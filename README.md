# ODS Platform

ODS Platform（One Driving System）是一个面向数字化运营、项目管理、知识库和个人工作台的前后端分离平台。本仓库以毕业设计可运行、可测试、可持续迭代为目标，依据 `AI_seggestion/ODS系统的功能分析.md` 实现真实业务规则，而不是静态原型。

## 当前实现

- Spring Boot 3 / Java 21 模块化后端，提供 JWT、RBAC、统一错误处理、OpenAPI 和健康检查。
- React 18 / TypeScript / Vite 独立前端，包含仪表板及五大业务域导航和响应式页面。
- PostgreSQL 17 正式数据库，Flyway 管理生产结构；H2 用于无需数据库的本地开发和自动测试。
- 项目创建、列表、筛选、编辑、Acquisition 状态、M1 自动同步 M3 L0、PMO L0/L1、风险与容量维护。
- 普通项目不提供删除接口；PMO 项目仅 `LPM`/`ADMIN` 可软删除。
- Vehicle Market OEM 销量/份额接口、Academy 课程状态机、个人工单优先级、知识树和视频指南。
- Docker Compose、种子数据、后端集成测试和前端类型检查脚本。

## 项目结构

```text
ODS/
├── backend/             Spring Boot REST API
├── frontend/            React + TypeScript Web 应用
├── docs/                架构、需求矩阵和迭代路线
├── AI_seggestion/       原始需求分析
├── compose.yml          PostgreSQL + API + Web 编排
└── .env.example         本地环境变量模板
```

## 一键启动（推荐）

前置条件：Docker Desktop 4.x，并确保 Docker Compose 可用。

```powershell
Copy-Item .env.example .env
docker compose up --build
```

启动后访问：

- Web：<http://localhost:3000>
- API：<http://localhost:8080/api/v1>
- Swagger UI：<http://localhost:8080/swagger-ui.html>
- 健康检查：<http://localhost:8080/actuator/health>

`.env.example` 明确开启了本地演示数据。首次启动会写入演示账号，密码由
`ODS_SEED_PASSWORD` 指定（示例值为 `ChangeMe123!`）：

| 账号 | 角色 | 用途 |
| --- | --- | --- |
| `admin` | ADMIN、TPJM、LPM、COORDINATOR | 全流程演示 |
| `tpjm` | TPJM | 创建和维护 M1 项目 |
| `lpm` | LPM、PJM | PMO 管理及受控删除 |
| `demo` | USER | My Ticket 和只读功能 |

这些账号只用于本地演示，不应进入共享或生产环境。

## 生产部署要求

- 使用密码管理器生成独立的 `POSTGRES_PASSWORD` 和至少 32 字节随机 `JWT_SECRET`；Compose 不提供密钥回退值，缺少时会直接拒绝启动。
- 设置 `ODS_SEED_ENABLED=false`，并由正式的用户管理或 SSO 流程创建账号。PostgreSQL Profile 默认关闭种子数据。
- 在 Nginx 或企业网关启用 HTTPS，限制 Swagger 和数据库端口的公网访问，并建立 PostgreSQL 备份与恢复演练。
- 禁用用户或删除用户后，已有 JWT 会在下一次请求时失效；`/api/v1/auth/me` 不允许匿名访问。

## 本地开发

后端需要 JDK 21 和 Maven 3.9：

```powershell
cd backend
mvn spring-boot:run
```

默认使用文件型 H2 数据库，不需要安装 PostgreSQL。执行测试：

```powershell
mvn test
```

普通测试使用 H2。检测到 Docker 时，测试套件还会用 Testcontainers 启动 PostgreSQL 17，执行 Flyway 后再运行 Hibernate Schema 校验；无 Docker 时该项自动跳过。

前端需要 Node.js 20 和 npm 10：

```powershell
cd frontend
npm install
npm run dev
```

执行前端验证：

```powershell
npm run typecheck
npm run build
```

## 关键业务约束

- TPjM 创建项目；相同产品、团队和里程碑的重复项目会返回冲突，提示复用或人工确认合并。
- M1 项目创建与 Acquisition 状态、M3 L0 同事务写入，并用唯一项目编号防止重复同步。
- M1 项目没有删除 API；M3 删除为软删除，仅 LPM 或管理员可执行，存在有效 L1 时禁止删除 L0。
- L1 必须关联有效 L0；课程发布前必须补全培训师和学员；个人工单只能由受派人或管理员更新。
- ADAS 数据尚无来源时接口明确返回 `dataAvailable=false`，不伪造业务数据。

完整架构与阶段状态见 `docs/architecture.md` 和 `docs/requirements-matrix.md`。


