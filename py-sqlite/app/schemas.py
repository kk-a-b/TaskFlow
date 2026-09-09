from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class LoginBody(CamelModel):
    username: str
    password: str


class RegisterBody(CamelModel):
    username: str
    password: str


class UserOut(CamelModel):
    id: str
    username: str
    display_name: str
    avatar: str
    role: str
    email: str = ""
    created_at: str


class AuthData(CamelModel):
    user: UserOut
    token: str


class ProjectCreateBody(CamelModel):
    name: str
    description: str = ""
    owner_id: str


class ProjectUpdateBody(CamelModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectListItem(CamelModel):
    id: str
    name: str
    description: str
    owner_id: str
    owner_name: str
    status_summary: str
    updated_at: str


class ProjectOut(CamelModel):
    id: str
    name: str
    description: str
    owner_id: str
    owner_name: str
    member_ids: list[str]
    status_summary: str
    updated_at: str
    updated_at_label: str
    created_at: str


class ProjectMemberOut(CamelModel):
    id: str
    username: str
    display_name: str
    avatar: str
    role: str
    role_label: str
    is_owner: bool = False


class InvitableUserOut(CamelModel):
    id: str
    username: str
    display_name: str
    avatar: str
    role: str
    role_label: str


class AddMembersBody(CamelModel):
    user_ids: list[str] = Field(default_factory=list)


class ColumnCreateBody(CamelModel):
    title: str


class ColumnRenameBody(CamelModel):
    title: str


class TaskCardOut(CamelModel):
    id: str
    name: str
    description: str = ""
    done: bool
    assignee_id: Optional[str] = None
    assignee_name: str = ""
    priority: str
    deadline: str = ""
    status: str
    sort: int = 0
    created_at: str = ""
    updated_at: str = ""


class ColumnOut(CamelModel):
    id: str
    title: str
    sort: int
    tasks: list[TaskCardOut] = Field(default_factory=list)


class BoardOut(CamelModel):
    project_id: str
    columns: list[ColumnOut]


class TaskDetailOut(CamelModel):
    id: str
    name: str
    description: str
    done: bool
    assignee_id: Optional[str] = None
    assignee_name: str = ""
    priority: str
    deadline: str = ""
    status: str
    sort: int = 0
    column_id: str
    column_title: str
    project_id: str
    created_at: str
    updated_at: str


class TaskCreateBody(CamelModel):
    name: str
    description: str = ""
    assignee_id: Optional[str] = None
    priority: str = "medium"
    deadline: str = ""
    status: Optional[str] = None
    column_id: Optional[str] = None


class TaskUpdateBody(CamelModel):
    name: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None


class ColumnReorderItem(CamelModel):
    id: str
    sort: int


class TaskReorderItem(CamelModel):
    id: str
    column_id: str
    sort: int
    status: Optional[str] = None
    done: Optional[bool] = None


class BoardReorderBody(CamelModel):
    columns: list[ColumnReorderItem] = Field(default_factory=list)
    tasks: list[TaskReorderItem] = Field(default_factory=list)
