from __future__ import annotations

from datetime import datetime
from typing import Iterable

from sqlalchemy.orm import Session

from app.config import TZ_SHANGHAI
from app.models import BoardColumn, Project, Task, User

ROLE_ADMIN = "admin"
ROLE_PM = "project_manager"
ROLE_EDITOR = "task_editor"

ROLE_LABELS = {
    ROLE_ADMIN: "管理员",
    ROLE_PM: "项目负责人",
    ROLE_EDITOR: "任务修改人",
}

PERMISSIONS = {
    "CREATE_PROJECT": {ROLE_ADMIN, ROLE_PM},
    "EDIT_PROJECT_SETTINGS": {ROLE_ADMIN, ROLE_PM},
    "MANAGE_PROJECT_MEMBERS": {ROLE_ADMIN, ROLE_PM},
    "MANAGE_COLUMNS": {ROLE_ADMIN, ROLE_PM},
    "CREATE_TASK": {ROLE_ADMIN, ROLE_PM, ROLE_EDITOR},
    "EDIT_ANY_TASK": {ROLE_ADMIN, ROLE_PM},
    "EDIT_ASSIGNED_TASK": {ROLE_ADMIN, ROLE_PM, ROLE_EDITOR},
    "DELETE_TASK": {ROLE_ADMIN, ROLE_PM},
    "DRAG_REORDER": {ROLE_ADMIN, ROLE_PM, ROLE_EDITOR},
}

DEFAULT_COLUMNS = [
    ("todo", "待办", 0),
    ("doing", "进行中", 1),
    ("done", "已完成", 2),
]

DONE_STATUS = "已完成"


def has_permission(role: str, key: str) -> bool:
    return role in PERMISSIONS.get(key, set())


def iso(dt: datetime | None) -> str:
    if dt is None:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ_SHANGHAI)
    return dt.astimezone(TZ_SHANGHAI).isoformat(timespec="seconds")


def relative_label(dt: datetime | None) -> str:
    if dt is None:
        return "刚刚"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ_SHANGHAI)
    now = datetime.now(TZ_SHANGHAI)
    days = (now.date() - dt.astimezone(TZ_SHANGHAI).date()).days
    if days <= 0:
        if (now - dt.astimezone(TZ_SHANGHAI)).total_seconds() < 60:
            return "刚刚"
        return "今天"
    if days == 1:
        return "昨天"
    if days == 2:
        return "前天"
    return f"{days}天前"


def avatar_from_name(name: str) -> str:
    text = (name or "").strip()
    return text[0].upper() if text else "U"


def dump(model) -> dict | list:
    if isinstance(model, list):
        return [dump(item) for item in model]
    return model.model_dump(by_alias=True, mode="json")


def user_to_out(user: User) -> dict:
    from app.schemas import UserOut

    return dump(
        UserOut(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            avatar=user.avatar,
            role=user.role,
            email=user.email or "",
            created_at=iso(user.created_at),
        )
    )


def member_ids_of(project: Project) -> list[str]:
    return [m.user_id for m in project.members]


def is_project_member(project: Project, user_id: str) -> bool:
    return user_id in member_ids_of(project) or project.owner_id == user_id


def can_view_project(user: User, project: Project) -> bool:
    if user.role == ROLE_ADMIN:
        return True
    if user.role == ROLE_PM:
        return project.owner_id == user.id or is_project_member(project, user.id)
    return is_project_member(project, user.id)


def status_summary(tasks: Iterable[Task]) -> str:
    items = list(tasks)
    doing = sum(1 for t in items if t.status == "进行中")
    if doing:
        return f"{doing}个任务进行中"
    todo = sum(1 for t in items if t.status == "待办")
    if todo:
        return f"待办 {todo}个"
    done = sum(1 for t in items if t.status == DONE_STATUS)
    if done:
        return f"已完成 {done}个"
    return "暂无任务"


def project_to_out(project: Project) -> dict:
    from app.schemas import ProjectOut

    owner_name = project.owner.display_name if project.owner else "未指派"
    return dump(
        ProjectOut(
            id=project.id,
            name=project.name,
            description=project.description or "",
            owner_id=project.owner_id,
            owner_name=owner_name,
            member_ids=member_ids_of(project),
            status_summary=status_summary(project.tasks),
            updated_at=iso(project.updated_at),
            updated_at_label=relative_label(project.updated_at),
            created_at=iso(project.created_at),
        )
    )


def project_to_list_item(project: Project) -> dict:
    from app.schemas import ProjectListItem

    owner_name = project.owner.display_name if project.owner else "未指派"
    return dump(
        ProjectListItem(
            id=project.id,
            name=project.name,
            description=project.description or "",
            owner_id=project.owner_id,
            owner_name=owner_name,
            status_summary=status_summary(project.tasks),
            updated_at=relative_label(project.updated_at),
        )
    )


def member_to_out(user: User, owner_id: str) -> dict:
    from app.schemas import ProjectMemberOut

    return dump(
        ProjectMemberOut(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            avatar=user.avatar,
            role=user.role,
            role_label=ROLE_LABELS.get(user.role, user.role),
            is_owner=user.id == owner_id,
        )
    )


def invitable_to_out(user: User) -> dict:
    from app.schemas import InvitableUserOut

    return dump(
        InvitableUserOut(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            avatar=user.avatar,
            role=user.role,
            role_label=ROLE_LABELS.get(user.role, user.role),
        )
    )


def touch_project(project: Project) -> None:
    project.updated_at = datetime.now(TZ_SHANGHAI)


def get_column(project: Project, column_id: str | None) -> BoardColumn | None:
    if not column_id:
        return None
    for col in project.columns:
        if col.id == column_id:
            return col
    return None


def column_by_status(project: Project, status: str | None) -> BoardColumn | None:
    if not status:
        return None
    for col in project.columns:
        if col.title == status:
            return col
    return None


def resolve_column(
    project: Project,
    status: str | None,
    column_id: str | None,
) -> BoardColumn | None:
    return column_by_status(project, status) or get_column(project, column_id)


def apply_status_to_task(task: Task, column: BoardColumn) -> None:
    task.column_id = column.id
    task.status = column.title
    task.done = column.title == DONE_STATUS


def next_sort(db: Session, project_id: str, column_id: str, exclude_id: str | None = None) -> int:
    query = db.query(Task).filter(Task.project_id == project_id, Task.column_id == column_id)
    if exclude_id:
        query = query.filter(Task.id != exclude_id)
    tasks = query.all()
    return max((t.sort for t in tasks), default=-1) + 1


def task_to_card(task: Task) -> dict:
    from app.schemas import TaskCardOut

    name = task.assignee.display_name if task.assignee else ""
    return dump(
        TaskCardOut(
            id=task.id,
            name=task.name,
            description=task.description or "",
            done=task.done,
            assignee_id=task.assignee_id,
            assignee_name=name,
            priority=task.priority,
            deadline=task.deadline or "",
            status=task.status,
            sort=task.sort,
            created_at=iso(task.created_at),
            updated_at=iso(task.updated_at),
        )
    )


def task_to_detail(task: Task) -> dict:
    from app.schemas import TaskDetailOut

    column_title = task.column.title if task.column else task.status
    name = task.assignee.display_name if task.assignee else ""
    return dump(
        TaskDetailOut(
            id=task.id,
            name=task.name,
            description=task.description or "",
            done=task.done,
            assignee_id=task.assignee_id,
            assignee_name=name,
            priority=task.priority,
            deadline=task.deadline or "",
            status=task.status,
            sort=task.sort,
            column_id=task.column_id,
            column_title=column_title,
            project_id=task.project_id,
            created_at=iso(task.created_at),
            updated_at=iso(task.updated_at),
        )
    )


def board_to_out(project: Project) -> dict:
    columns = []
    for col in sorted(project.columns, key=lambda c: c.sort):
        columns.append(
            {
                "id": col.id,
                "title": col.title,
                "sort": col.sort,
                "tasks": [task_to_card(t) for t in sorted(col.tasks, key=lambda t: t.sort)],
            }
        )
    return {"projectId": project.id, "columns": columns}
