from __future__ import annotations

import time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.exceptions import AppError, ok
from app.helpers import (
    ROLE_ADMIN,
    apply_status_to_task,
    board_to_out,
    can_view_project,
    get_column,
    has_permission,
    is_project_member,
    touch_project,
)
from app.models import BoardColumn, Project, ProjectMember, Task, User
from app.schemas import BoardReorderBody, ColumnCreateBody, ColumnRenameBody

router = APIRouter(tags=["board"])


def load_board_project(db: Session, project_id: str) -> Project | None:
    return (
        db.query(Project)
        .options(
            joinedload(Project.owner),
            selectinload(Project.members).joinedload(ProjectMember.user),
            selectinload(Project.columns).selectinload(BoardColumn.tasks).joinedload(Task.assignee),
            selectinload(Project.tasks).joinedload(Task.assignee),
            selectinload(Project.tasks).joinedload(Task.column),
        )
        .filter(Project.id == project_id)
        .first()
    )


def require_board_project(db: Session, project_id: str, user: User) -> Project:
    project = load_board_project(db, project_id)
    if project is None:
        raise AppError(404, "项目不存在")
    if not can_view_project(user, project):
        raise AppError(403, "无权限查看该项目")
    return project


def require_manage_columns(user: User, project: Project) -> None:
    if not has_permission(user.role, "MANAGE_COLUMNS"):
        raise AppError(403, "无权限管理看板列")
    if user.role != ROLE_ADMIN and not is_project_member(project, user.id):
        raise AppError(403, "无权限管理看板列")


def sync_tasks_by_status(project: Project) -> None:
    by_title = {col.title: col for col in project.columns}
    for task in project.tasks:
        col = by_title.get(task.status) or get_column(project, task.column_id)
        if col is not None:
            apply_status_to_task(task, col)


@router.get("/projects/{project_id}/board")
def get_board(
    project_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_board_project(db, project_id, current)
    sync_tasks_by_status(project)
    db.commit()
    project = require_board_project(db, project_id, current)
    return ok(board_to_out(project))


@router.post("/projects/{project_id}/board/columns")
def add_column(
    project_id: str,
    body: ColumnCreateBody,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_board_project(db, project_id, current)
    require_manage_columns(current, project)
    title = (body.title or "").strip()
    if not title:
        raise AppError(400, "请输入列表名称")
    sort = max((c.sort for c in project.columns), default=-1) + 1
    column = BoardColumn(
        id=f"list-{int(time.time() * 1000)}",
        project_id=project.id,
        title=title,
        sort=sort,
    )
    db.add(column)
    touch_project(project)
    db.commit()
    project = require_board_project(db, project_id, current)
    return ok(board_to_out(project))


@router.put("/projects/{project_id}/board/columns/{column_id}")
def rename_column(
    project_id: str,
    column_id: str,
    body: ColumnRenameBody,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_board_project(db, project_id, current)
    require_manage_columns(current, project)
    column = get_column(project, column_id)
    if column is None:
        raise AppError(404, "列表不存在")
    title = (body.title or "").strip()
    if not title:
        raise AppError(400, "请输入列表名称")
    old_title = column.title
    column.title = title
    for task in list(column.tasks):
        if task.status == old_title:
            task.status = title
            task.done = title == "已完成"
    touch_project(project)
    db.commit()
    project = require_board_project(db, project_id, current)
    return ok(board_to_out(project))


@router.delete("/projects/{project_id}/board/columns/{column_id}")
def delete_column(
    project_id: str,
    column_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_board_project(db, project_id, current)
    require_manage_columns(current, project)
    columns = sorted(project.columns, key=lambda c: c.sort)
    if len(columns) <= 1:
        raise AppError(400, "至少保留一个列表")
    index = next((i for i, c in enumerate(columns) if c.id == column_id), None)
    if index is None:
        raise AppError(404, "列表不存在")
    remaining = [c for c in columns if c.id != column_id]
    target = remaining[min(index, len(remaining) - 1)]
    removed = columns[index]
    next_sort = max((t.sort for t in target.tasks), default=-1) + 1
    for task in sorted(removed.tasks, key=lambda t: t.sort):
        task.column_id = target.id
        task.status = target.title
        task.done = target.title == "已完成"
        task.sort = next_sort
        next_sort += 1
    db.delete(removed)
    touch_project(project)
    db.commit()
    project = require_board_project(db, project_id, current)
    return ok(board_to_out(project))


@router.put("/projects/{project_id}/board/reorder")
def reorder_board(
    project_id: str,
    body: BoardReorderBody,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_board_project(db, project_id, current)
    if not has_permission(current.role, "DRAG_REORDER"):
        raise AppError(403, "无权限拖拽排序")
    if current.role != ROLE_ADMIN and not is_project_member(project, current.id):
        raise AppError(403, "无权限拖拽排序")

    col_map = {c.id: c for c in project.columns}
    for item in body.columns:
        col = col_map.get(item.id)
        if col is not None:
            col.sort = item.sort

    task_map = {t.id: t for t in project.tasks}
    for item in body.tasks:
        task = task_map.get(item.id)
        if task is None:
            continue
        col = col_map.get(item.column_id)
        if col is None:
            raise AppError(400, "看板列表不存在")
        task.sort = item.sort
        if item.status:
            task.status = item.status
            match = next((c for c in project.columns if c.title == item.status), col)
            apply_status_to_task(task, match)
        else:
            apply_status_to_task(task, col)
        if item.done is not None:
            task.done = item.done
    touch_project(project)
    db.commit()
    project = require_board_project(db, project_id, current)
    return ok(board_to_out(project))
