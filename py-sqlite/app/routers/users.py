from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.exceptions import AppError, ok
from app.helpers import ROLE_PM, user_to_out
from app.models import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/project-managers")
def list_project_managers(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != "admin":
        raise AppError(403, "无权限")
    users = (
        db.query(User)
        .filter(User.role == ROLE_PM)
        .order_by(User.created_at.asc())
        .all()
    )
    return ok([user_to_out(u) for u in users])
