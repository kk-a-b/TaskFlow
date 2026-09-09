from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def ok(data=None, message: str = "ok") -> dict:
    return {"code": 0, "message": message, "data": data}


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.code if exc.code in {400, 401, 403, 404} else 400,
        content={"code": exc.code, "message": exc.message, "data": None},
    )
