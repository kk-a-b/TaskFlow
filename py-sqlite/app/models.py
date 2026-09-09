from __future__ import annotations

from datetime import datetime

from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, ForeignKeyConstraint, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config import TZ_SHANGHAI
from app.database import Base


def now_sh() -> datetime:
    return datetime.now(TZ_SHANGHAI)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    display_name: Mapped[str] = mapped_column(String(64))
    avatar: Mapped[str] = mapped_column(String(8), default="")
    role: Mapped[str] = mapped_column(String(32), index=True)
    email: Mapped[str] = mapped_column(String(128), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_sh)

    owned_projects: Mapped[list[Project]] = relationship(back_populates="owner")
    memberships: Mapped[list[ProjectMember]] = relationship(back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    description: Mapped[str] = mapped_column(Text, default="")
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_sh)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_sh)

    owner: Mapped[User] = relationship(back_populates="owned_projects")
    members: Mapped[list[ProjectMember]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )
    columns: Mapped[list[BoardColumn]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="BoardColumn.sort",
    )
    tasks: Mapped[list[Task]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (UniqueConstraint("project_id", "user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))

    project: Mapped[Project] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="memberships")


class BoardColumn(Base):
    __tablename__ = "board_columns"
    __table_args__ = (
        UniqueConstraint("project_id", "id"),
    )

    pk: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String(64), index=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    title: Mapped[str] = mapped_column(String(64))
    sort: Mapped[int] = mapped_column(Integer, default=0)

    project: Mapped[Project] = relationship(back_populates="columns")
    tasks: Mapped[list[Task]] = relationship(back_populates="column", overlaps="project,tasks")


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        ForeignKeyConstraint(
            ["project_id", "column_id"],
            ["board_columns.project_id", "board_columns.id"],
        ),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"))
    column_id: Mapped[str] = mapped_column(String(64))
    name: Mapped[str] = mapped_column(String(256))
    description: Mapped[str] = mapped_column(Text, default="")
    done: Mapped[bool] = mapped_column(Boolean, default=False)
    assignee_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True)
    priority: Mapped[str] = mapped_column(String(16), default="medium")
    deadline: Mapped[str] = mapped_column(String(16), default="")
    status: Mapped[str] = mapped_column(String(32), default="待办")
    sort: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_sh)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_sh)

    project: Mapped[Project] = relationship(back_populates="tasks", overlaps="column,tasks")
    column: Mapped[BoardColumn] = relationship(back_populates="tasks", overlaps="project,tasks")
    assignee: Mapped[Optional[User]] = relationship()
