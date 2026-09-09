from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.exceptions import AppError, ok
from app.helpers import avatar_from_name, user_to_out
from app.models import User
from app.schemas import LoginBody, RegisterBody
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _new_user_id(db: Session) -> str:
    count = db.query(User).count()
    return f"u-{count + 1:03d}"


def _auth_payload(user: User) -> dict:
    return {
        "user": user_to_out(user),
        "token": create_access_token(user.id),
    }


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    username = (body.username or "").strip()
    password = body.password or ""
    if not username or not password:
        raise AppError(400, "请输入账号和密码")
    user = db.query(User).filter(User.username == username).first()
    if user is None or not verify_password(password, user.password_hash):
        raise AppError(401, "账号或密码错误")
    return ok(_auth_payload(user))


@router.post("/register")
def register(body: RegisterBody, db: Session = Depends(get_db)):
    username = (body.username or "").strip()
    password = body.password or ""
    if not username:
        raise AppError(400, "请输入账号")
    if not password:
        raise AppError(400, "请输入密码")
    exists = db.query(User).filter(User.username == username).first()
    if exists is not None:
        raise AppError(400, "账号已存在")
    user = User(
        id=_new_user_id(db),
        username=username,
        password_hash=hash_password(password),
        display_name=username,
        avatar=avatar_from_name(username),
        role="task_editor",
        email="",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return ok(_auth_payload(user))


@router.get("/me")
def me(current: User = Depends(get_current_user)):
    return ok(user_to_out(current))
