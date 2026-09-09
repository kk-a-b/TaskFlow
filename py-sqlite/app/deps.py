from __future__ import annotations

from typing import Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.exceptions import AppError
from app.models import User
from app.security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None or creds.scheme.lower() != "bearer":
        raise AppError(401, "未登录 / Token 无效")
    user_id = decode_access_token(creds.credentials)
    if not user_id:
        raise AppError(401, "未登录 / Token 无效")
    user = db.get(User, user_id)
    if user is None:
        raise AppError(401, "未登录 / Token 无效")
    return user
