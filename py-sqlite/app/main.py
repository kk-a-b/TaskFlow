from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import SessionLocal, engine
from app.exceptions import AppError, app_error_handler, ok
from app.models import Base
from app.routers import auth, board, projects, tasks, users
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    description="任务看板后端（FastAPI + SQLite），对接 uni-ts-vue3-vite 接口约定。",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)

prefix = settings.api_prefix
app.include_router(auth.router, prefix=prefix)
app.include_router(users.router, prefix=prefix)
app.include_router(projects.router, prefix=prefix)
app.include_router(board.router, prefix=prefix)
app.include_router(tasks.router, prefix=prefix)


@app.get("/")
def root():
    return ok(
        {
            "name": settings.app_name,
            "docs": "/docs",
            "api": prefix,
        }
    )


@app.get(f"{prefix}/health")
def health():
    return ok({"status": "up"})
