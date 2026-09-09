from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.config import TZ_SHANGHAI
from app.helpers import DEFAULT_COLUMNS
from app.models import BoardColumn, Project, ProjectMember, Task, User
from app.security import hash_password


def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value).astimezone(TZ_SHANGHAI)


def seed_if_empty(db: Session) -> None:
    if db.query(User).first() is not None:
        return

    password = hash_password("123456")
    users = [
        User(
            id="u-001",
            username="admin",
            password_hash=password,
            display_name="系统管理员",
            avatar="A",
            role="admin",
            email="admin@example.com",
            created_at=_dt("2026-01-01T08:00:00+08:00"),
        ),
        User(
            id="u-002",
            username="zhangpm",
            password_hash=password,
            display_name="张经理",
            avatar="张",
            role="project_manager",
            email="zhangpm@example.com",
            created_at=_dt("2026-02-10T09:00:00+08:00"),
        ),
        User(
            id="u-003",
            username="lisi",
            password_hash=password,
            display_name="李四",
            avatar="李",
            role="project_manager",
            email="lisi@example.com",
            created_at=_dt("2026-02-15T10:00:00+08:00"),
        ),
        User(
            id="u-004",
            username="wangwu",
            password_hash=password,
            display_name="王五",
            avatar="王",
            role="task_editor",
            email="wangwu@example.com",
            created_at=_dt("2026-03-01T11:00:00+08:00"),
        ),
        User(
            id="u-005",
            username="zhaoliu",
            password_hash=password,
            display_name="赵六",
            avatar="赵",
            role="task_editor",
            email="zhaoliu@example.com",
            created_at=_dt("2026-03-05T14:00:00+08:00"),
        ),
        User(
            id="u-006",
            username="sunqi",
            password_hash=password,
            display_name="孙七",
            avatar="孙",
            role="task_editor",
            email="sunqi@example.com",
            created_at=_dt("2026-03-08T16:00:00+08:00"),
        ),
    ]
    db.add_all(users)
    db.flush()

    projects = [
        (
            Project(
                id="p-001",
                name="项目A",
                description="核心产品迭代看板，包含需求开发与缺陷修复。",
                owner_id="u-002",
                created_at=_dt("2026-06-01T09:00:00+08:00"),
                updated_at=_dt("2026-09-07T10:30:00+08:00"),
            ),
            ["u-002", "u-004", "u-005"],
        ),
        (
            Project(
                id="p-002",
                name="项目B",
                description="运营活动专项，短期冲刺交付。",
                owner_id="u-003",
                created_at=_dt("2026-07-12T14:00:00+08:00"),
                updated_at=_dt("2026-09-06T18:00:00+08:00"),
            ),
            ["u-003", "u-005", "u-006"],
        ),
        (
            Project(
                id="p-003",
                name="项目C",
                description="技术债务清理与性能优化跟踪。",
                owner_id="u-002",
                created_at=_dt("2026-08-01T10:00:00+08:00"),
                updated_at=_dt("2026-09-05T12:00:00+08:00"),
            ),
            ["u-002", "u-004", "u-006"],
        ),
    ]
    for project, member_ids in projects:
        db.add(project)
        for user_id in member_ids:
            db.add(ProjectMember(project_id=project.id, user_id=user_id))
        for col_id, title, sort in DEFAULT_COLUMNS:
            db.add(BoardColumn(id=col_id, project_id=project.id, title=title, sort=sort))
    db.flush()

    tasks = [
        Task(
            id="t-001",
            project_id="p-001",
            column_id="todo",
            name="任务1",
            description="梳理登录模块交互细节，补充异常态提示文案。",
            done=False,
            assignee_id="u-004",
            priority="high",
            deadline="2026-09-10",
            status="待办",
            sort=0,
            created_at=_dt("2026-09-01T09:00:00+08:00"),
            updated_at=_dt("2026-09-05T11:20:00+08:00"),
        ),
        Task(
            id="t-002",
            project_id="p-001",
            column_id="todo",
            name="任务2",
            description="看板页拖拽交互优化，兼容 PC 与移动端。",
            done=False,
            assignee_id="u-005",
            priority="medium",
            deadline="2026-09-15",
            status="待办",
            sort=1,
            created_at=_dt("2026-09-02T10:00:00+08:00"),
            updated_at=_dt("2026-09-06T15:40:00+08:00"),
        ),
        Task(
            id="t-003",
            project_id="p-001",
            column_id="todo",
            name="任务3",
            description="编写任务详情页 UI 规范说明文档。",
            done=False,
            assignee_id="u-004",
            priority="low",
            deadline="2026-09-20",
            status="待办",
            sort=2,
            created_at=_dt("2026-09-03T14:00:00+08:00"),
            updated_at=_dt("2026-09-03T14:00:00+08:00"),
        ),
        Task(
            id="t-004",
            project_id="p-001",
            column_id="doing",
            name="任务4",
            description="对接虚拟 Mock 数据层，预留 REST 接口字段。",
            done=False,
            assignee_id="u-005",
            priority="high",
            deadline="2026-09-12",
            status="进行中",
            sort=0,
            created_at=_dt("2026-08-28T09:30:00+08:00"),
            updated_at=_dt("2026-09-07T09:10:00+08:00"),
        ),
        Task(
            id="t-005",
            project_id="p-001",
            column_id="doing",
            name="任务5",
            description="项目列表页响应式布局微调。",
            done=False,
            assignee_id="u-004",
            priority="medium",
            deadline="2026-09-18",
            status="进行中",
            sort=1,
            created_at=_dt("2026-08-30T16:00:00+08:00"),
            updated_at=_dt("2026-09-06T20:00:00+08:00"),
        ),
        Task(
            id="t-006",
            project_id="p-001",
            column_id="done",
            name="任务6",
            description="完成玻璃拟态登录页与注册页静态 UI。",
            done=True,
            assignee_id="u-004",
            priority="medium",
            deadline="2026-08-25",
            status="已完成",
            sort=0,
            created_at=_dt("2026-08-10T08:00:00+08:00"),
            updated_at=_dt("2026-08-25T17:30:00+08:00"),
        ),
        Task(
            id="t-007",
            project_id="p-001",
            column_id="done",
            name="任务7",
            description="搭建 uni-app + Vue3 工程骨架。",
            done=True,
            assignee_id="u-002",
            priority="high",
            deadline="2026-08-20",
            status="已完成",
            sort=1,
            created_at=_dt("2026-08-01T09:00:00+08:00"),
            updated_at=_dt("2026-08-20T12:00:00+08:00"),
        ),
        Task(
            id="t-008",
            project_id="p-001",
            column_id="done",
            name="任务8",
            description="确定看板三列默认命名与任务字段模型。",
            done=True,
            assignee_id="u-005",
            priority="low",
            deadline="2026-08-22",
            status="已完成",
            sort=2,
            created_at=_dt("2026-08-05T11:00:00+08:00"),
            updated_at=_dt("2026-08-22T10:00:00+08:00"),
        ),
        Task(
            id="t-101",
            project_id="p-002",
            column_id="todo",
            name="设计活动主视觉",
            description="输出 Banner 与落地页首屏稿。",
            done=False,
            assignee_id="u-006",
            priority="high",
            deadline="2026-09-08",
            status="待办",
            sort=0,
            created_at=_dt("2026-09-04T09:00:00+08:00"),
            updated_at=_dt("2026-09-04T09:00:00+08:00"),
        ),
        Task(
            id="t-102",
            project_id="p-002",
            column_id="done",
            name="活动规则文案",
            description="法务审核已通过。",
            done=True,
            assignee_id="u-003",
            priority="medium",
            deadline="2026-09-01",
            status="已完成",
            sort=0,
            created_at=_dt("2026-08-20T10:00:00+08:00"),
            updated_at=_dt("2026-09-01T16:00:00+08:00"),
        ),
        Task(
            id="t-201",
            project_id="p-003",
            column_id="todo",
            name="首页首屏加载优化",
            description="目标 LCP < 2.5s。",
            done=False,
            assignee_id="u-006",
            priority="high",
            deadline="2026-09-25",
            status="待办",
            sort=0,
            created_at=_dt("2026-09-01T08:00:00+08:00"),
            updated_at=_dt("2026-09-01T08:00:00+08:00"),
        ),
        Task(
            id="t-202",
            project_id="p-003",
            column_id="todo",
            name="清理未使用依赖",
            description="package.json 瘦身。",
            done=False,
            assignee_id="u-004",
            priority="low",
            deadline="2026-10-01",
            status="待办",
            sort=1,
            created_at=_dt("2026-09-02T13:00:00+08:00"),
            updated_at=_dt("2026-09-02T13:00:00+08:00"),
        ),
    ]
    db.add_all(tasks)
    db.commit()
