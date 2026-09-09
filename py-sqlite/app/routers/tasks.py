from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload, selectinload

from app.config import TZ_SHANGHAI
from app.database import get_db
from app.deps import get_current_user
from app.exceptions import AppError, ok
from app.helpers import (
    ROLE_ADMIN,
    ROLE_EDITOR,
    apply_status_to_task,
    can_view_project,
    has_permission,
    is_project_member,
    next_sort,
    project_to_out,
    resolve_column,
    task_to_detail,
    touch_project,
)
from app.models import Project, ProjectMember, Task, User
from app.schemas import TaskCreateBody, TaskUpdateBody

router = APIRouter(tags=["tasks"])

VALID_PRIORITIES = {"high", "medium", "low"}


def load_task(db: Session, task_id: str) -> Task | None:
    return (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.column),
            joinedload(Task.project).joinedload(Project.owner),
            joinedload(Task.project).selectinload(Project.members).joinedload(ProjectMember.user),
            joinedload(Task.project).selectinload(Project.columns),
            joinedload(Task.project).selectinload(Project.tasks),
        )
        .filter(Task.id == task_id)
        .first()
    )


def load_project(db: Session, project_id: str) -> Project | None:
    return (
        db.query(Project)
        .options(
            joinedload(Project.owner),
            selectinload(Project.members).joinedload(ProjectMember.user),
            selectinload(Project.columns),
            selectinload(Project.tasks),
        )
        .filter(Project.id == project_id)
        .first()
    )


def _new_task_id(db: Session) -> str:
    count = db.query(Task).count()
    return f"t-{count + 1:03d}"


def _task_payload(task: Task) -> dict:
    return {
        "task": task_to_detail(task),
        "project": {"id": task.project.id, "name": task.project.name},
    }


def _ensure_assignee(db: Session, project: Project, assignee_id: str | None) -> str | None:
    if assignee_id is None or str(assignee_id).strip() == "":
        return None
    uid = str(assignee_id).strip()
    user = db.get(User, uid)
    if user is None:
        raise AppError(400, "指派人不存在")
    member_ids = {m.user_id for m in project.members}
    member_ids.add(project.owner_id)
    if uid not in member_ids:
        raise AppError(400, "只能指派给项目成员")
    return uid


def can_edit_task(user: User, task: Task) -> bool:
    if has_permission(user.role, "EDIT_ANY_TASK"):
        if user.role == ROLE_ADMIN:
            return True
        return is_project_member(task.project, user.id) or task.project.owner_id == user.id
    if user.role == ROLE_EDITOR:
        return task.assignee_id == user.id
    return False


@router.get("/tasks/{task_id}")
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    task = load_task(db, task_id)
    if task is None:
        raise AppError(404, "任务不存在")
    if not can_view_project(current, task.project):
        raise AppError(403, "无权限查看该任务")
    return ok(_task_payload(task))


@router.get("/tasks/{task_id}/editable")
def task_editable(
    task_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    task = load_task(db, task_id)
    if task is None:
        raise AppError(404, "任务不存在")
    if not can_view_project(current, task.project):
        raise AppError(403, "无权限查看该任务")
    return ok({"editable": can_edit_task(current, task)})


@router.post("/projects/{project_id}/tasks")
def create_task(
    project_id: str,
    body: TaskCreateBody,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = load_project(db, project_id)
    if project is None:
        raise AppError(404, "项目不存在")
    if not has_permission(current.role, "CREATE_TASK"):
        raise AppError(403, "无权限创建任务")
    if current.role != ROLE_ADMIN and not is_project_member(project, current.id):
        raise AppError(403, "无权限在该项目创建任务")

    name = (body.name or "").strip()
    if not name:
        raise AppError(400, "请输入任务标题")
    priority = (body.priority or "medium").strip()
    if priority not in VALID_PRIORITIES:
        raise AppError(400, "无效优先级")

    column = resolve_column(project, body.status, body.column_id)
    if column is None:
        if project.columns:
            column = sorted(project.columns, key=lambda c: c.sort)[0]
        else:
            raise AppError(400, "看板列表不存在")

    assignee_id = _ensure_assignee(db, project, body.assignee_id)
    task = Task(
        id=_new_task_id(db),
        project_id=project.id,
        column_id=column.id,
        name=name,
        description=body.description or "",
        assignee_id=assignee_id,
        priority=priority,
        deadline=body.deadline or "",
        sort=next_sort(db, project.id, column.id),
    )
    apply_status_to_task(task, column)
    db.add(task)
    touch_project(project)
    db.commit()
    task = load_task(db, task.id)
    return ok(_task_payload(task))


@router.put("/tasks/{task_id}")
def update_task(
    task_id: str,
    body: TaskUpdateBody,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    task = load_task(db, task_id)
    if task is None:
        raise AppError(404, "任务不存在")
    if not can_edit_task(current, task):
        raise AppError(403, "无权限编辑该任务")

    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise AppError(400, "请输入任务标题")
        task.name = name
    if body.description is not None:
        task.description = body.description
    if "assignee_id" in body.model_fields_set:
        task.assignee_id = _ensure_assignee(db, task.project, body.assignee_id)
    if body.priority is not None:
        if body.priority not in VALID_PRIORITIES:
            raise AppError(400, "无效优先级")
        task.priority = body.priority
    if body.deadline is not None:
        task.deadline = body.deadline or ""
    if body.status is not None:
        column = resolve_column(task.project, body.status, None)
        if column is None:
            raise AppError(400, "无效状态")
        apply_status_to_task(task, column)
        task.sort = next_sort(db, task.project_id, column.id, exclude_id=task.id)

    task.updated_at = datetime.now(TZ_SHANGHAI)
    touch_project(task.project)
    db.commit()
    task = load_task(db, task_id)
    return ok(_task_payload(task))


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    task = load_task(db, task_id)
    if task is None:
        raise AppError(404, "任务不存在")
    if not has_permission(current.role, "DELETE_TASK"):
        raise AppError(403, "无权限删除任务")
    if current.role != ROLE_ADMIN and not is_project_member(task.project, current.id):
        raise AppError(403, "无权限删除任务")
    project = task.project
    db.delete(task)
    touch_project(project)
    db.commit()
    return ok({"taskId": task_id})
