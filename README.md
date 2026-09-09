TASKFLOW一个轻量级的团队任务管理工具，支持多项目管理、任务看板拖拽、成员协作等功能，帮助团队直观地追踪任务进度。

# 前端 README

> TaskFlow系统前端应用，基于 uni-app + Vue 3 + TypeScript 构建，支持 H5 多端编译。

## 技术栈

- uni-app 3.x
- Vue 3 Composition API
- TypeScript
- Vite 5
- SCSS（玻璃拟态风格）
- vuedraggable（拖拽交互）

## 快速启动

### 1. 克隆项目

```bash
git clone https://github.com/kk-a-b/TaskFlow.git
cd uni-ts-vue3-vite
```
### 2. 安装依赖
```bash
npm install
```
### 3. 启动 H5 开发服务
```bash
npm run dev:h5
```

# 后端 README

> TaskFlow系统后端服务，基于 FastAPI + SQLite 构建，提供项目、看板列、任务卡的完整 REST API。

## 技术栈
- Python 3.9+
- FastAPI
- SQLAlchemy (ORM)
- SQLite (本地文件数据库)
- PyJWT (Token 认证)
- Passlib (密码哈希)

## 快速启动

### 1. 克隆项目
```bash
git clone https://github.com/kk-a-b/TaskFlow.git
cd py-sqlite
```
### 2. 安装依赖
```bash
pip install -r requirements.txt
```
### 3. 启动服务
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 数据库
首次启动会自动创建 app.db 文件<br>
自动创建表结构并写入演示数据<br>
无需单独安装数据库


# 核心功能
| 功能 | 说明 |
| :--- | :--- |
| 登录 / 注册 | JWT Token 认证，记住账号 |
| 项目列表 | 展示用户参与的项目，新建项目 |
| 看板主页 | 三列结构（待办/进行中/已完成），支持列和卡的拖拽排序 |
| 任务管理 | 创建、编辑、删除任务，支持指派人、优先级、截止日期 |
| 成员管理 | 邀请成员加入项目（多选+搜索） |
| 权限控制 | 前端 UI 根据角色展示/隐藏操作入口 |

# 页面预览
