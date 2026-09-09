from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.exceptions import AppError, ok
from app.helpers import (
    DEFAULT_COLUMNS,
    ROLE_ADMIN,
    ROLE_PM,
    can_view_project,
    has_permission,
    invitable_to_out,
    is_project_member,
    member_to_out,
    project_to_list_item,
    project_to_out,
    touch_project,
)
from app.models import BoardColumn, Project, ProjectMember, User
from app.schemas import AddMembersBody, ProjectCreateBody, ProjectUpdateBody

router = APIRouter(tags=["projects"])


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


def require_project(db: Session, project_id: str) -> Project:
    project = load_project(db, project_id)
    if project is None:
        raise AppError(404, "项目不存在")
    return project


def require_visible(db: Session, project_id: str, user: User) -> Project:
    project = require_project(db, project_id)
    if not can_view_project(user, project):
        raise AppError(403, "无权限查看该项目")
    return project


def _new_project_id(db: Session) -> str:
    count = db.query(Project).count()
    return f"p-{count + 1:03d}"


@router.get("/projects")
def list_projects(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    query = db.query(Project).options(
        joinedload(Project.owner),
        selectinload(Project.members),
        selectinload(Project.tasks),
    )
    projects = query.order_by(Project.updated_at.desc()).all()
    visible = [p for p in projects if can_view_project(current, p)]
    return ok([project_to_list_item(p) for p in visible])


@router.post("/projects")
def create_project(
    body: ProjectCreateBody,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != ROLE_ADMIN:
        raise AppError(403, "无权限创建项目")
    name = (body.name or "").strip()
    if not name:
        raise AppError(400, "请输入项目名称")
    owner_id = (body.owner_id or "").strip()
    if not owner_id:
        raise AppError(400, "请选择项目负责人")
    owner = db.get(User, owner_id)
    if owner is None or owner.role != ROLE_PM:
        raise AppError(400, "负责人必须是项目负责人")

    project = Project(
        id=_new_project_id(db),
        name=name,
        description=(body.description or "").strip(),
        owner_id=owner.id,
    )
    db.add(project)
    db.flush()
    db.add(ProjectMember(project_id=project.id, user_id=owner.id))
    for col_id, title, sort in DEFAULT_COLUMNS:
        db.add(BoardColumn(id=col_id, project_id=project.id, title=title, sort=sort))
    db.commit()
    return ok(project_to_out(require_project(db, project.id)))


@router.get("/projects/{project_id}")
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_visible(db, project_id, current)
    return ok(project_to_out(project))


@router.put("/projects/{project_id}")
def update_project(
    project_id: str,
    body: ProjectUpdateBody,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_visible(db, project_id, current)
    if not has_permission(current.role, "EDIT_PROJECT_SETTINGS"):
        raise AppError(403, "无权限")
    if current.role != ROLE_ADMIN and project.owner_id != current.id:
        raise AppError(403, "无权限修改项目设置")
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise AppError(400, "请输入项目名称")
        project.name = name
    if body.description is not None:
        project.description = body.description.strip()
    touch_project(project)
    db.commit()
    return ok(project_to_out(require_project(db, project_id)))


@router.get("/projects/{project_id}/members")
def list_members(
    project_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_visible(db, project_id, current)
    members = []
    for item in project.members:
        if item.user is None:
            continue
        members.append(member_to_out(item.user, project.owner_id))
    members.sort(key=lambda m: (not m["isOwner"], m["displayName"]))
    return ok(members)


@router.get("/projects/{project_id}/invitable-users")
def list_invitable(
    project_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_visible(db, project_id, current)
    existing = set(m.user_id for m in project.members)
    users = db.query(User).order_by(User.created_at.asc()).all()
    data = [invitable_to_out(u) for u in users if u.id not in existing]
    return ok(data)


@router.post("/projects/{project_id}/members")
def add_members(
    project_id: str,
    body: AddMembersBody,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    project = require_visible(db, project_id, current)
    if not has_permission(current.role, "MANAGE_PROJECT_MEMBERS"):
        raise AppError(403, "无权限")
    if current.role != ROLE_ADMIN and not is_project_member(project, current.id):
        raise AppError(403, "无权限管理项目成员")
    user_ids = [uid for uid in (body.user_ids or []) if uid]
    if not user_ids:
        raise AppError(400, "请选择要添加的成员")
    existing = set(m.user_id for m in project.members)
    added = []
    for uid in user_ids:
        user = db.get(User, uid)
        if user is None or uid in existing:
            continue
        db.add(ProjectMember(project_id=project.id, user_id=uid))
        existing.add(uid)
        added.append(user)
    if not added:
        raise AppError(400, "所选成员已在项目中或不存在")
    touch_project(project)
    db.commit()
    project = require_project(db, project_id)
    return ok(
        {
            "members": [member_to_out(u, project.owner_id) for u in added],
            "project": project_to_out(project),
        }
    )


@router.post("/projects/{project_id}/members/{user_id}")
def add_member(
    project_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    return add_members(
        project_id,
        AddMembersBody(user_ids=[user_id]),
        db,
        current,
    )
