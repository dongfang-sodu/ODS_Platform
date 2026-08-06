# 验证记录

最后更新：2026-08-06。

## 工具链

| 工具 | 已验证版本 |
| --- | --- |
| Java | Microsoft OpenJDK 21.0.12 LTS |
| Maven | 3.9.9 |
| Node.js | 22.23.1 |
| npm | 10.9.8 |
| Git | `C:\Program Files\Git\cmd\git.exe` |

便携工具位于仓库的 `.tools/`，仅用于当前开发环境，不属于应用运行时。

## 自动验证

| 范围 | 命令 | 结果 |
| --- | --- | --- |
| 后端 | `mvn test` | 45 项执行，44 项通过，0 失败，0 错误，1 项因本机无 Docker 跳过 |
| 前端依赖 | 全新临时目录执行 `npm ci` | 成功安装 76 个包，无 deprecated 或 vulnerability 警告 |
| 前端类型 | `npm run typecheck` | 通过，无诊断 |
| 前端生产包 | `npm run build` | 通过，54 个模块；JS 271.62 kB，CSS 30.03 kB |
| 配置文件 | Python YAML 静态解析 | Compose、2 个 GitHub Actions 工作流及 10 个 K3s YAML 文件全部通过 |
| 差异检查 | `git diff --check` | 通过，无空白错误 |

受管沙箱内的 Vite 默认配置加载器无法读取工作区上级目录；授权在普通本机权限下执行后，`npm run build` 成功完成 TypeScript 编译和生产打包。

## H2 冒烟测试

使用可执行 Spring Boot JAR 和临时 H2 内存库完成以下真实调用：

- `/actuator/health` 返回 `UP`。
- 登录和 `/api/v1/auth/me` 成功。
- 使用仅包含旧版 `users` 表结构的文件型 H2 数据库启动新版本，认证字段自动补齐，`admin` 登录返回 HTTP 200。
- 新增认证集成测试验证刷新令牌轮换、旧令牌失效、连续 5 次失败锁定账号、密码重置请求不泄露账号是否存在，以及登录会话列表和单会话注销。
- 创建项目后自动建立 Acquisition 状态与 PMO L0。
- 2024-12 Vehicle Market 返回总销量 24500 和 3 个 OEM。
- Academy 课程创建并发布后状态为 `PUBLISHED`。
- Demo 用户返回 2 条工单，业务优先级排序首项为 `HIGH`。
- 管理员登录后，追溯接口返回 30 个 AEB 演示工件和 8 类关系定义。
- 追溯集成测试覆盖环路终止、完整路径、影响候选、解释路径、人工复核、二次确认与关联工单创建。

冒烟进程已停止，没有保留后台 Java 服务。

## 尚未验证

当前机器未安装 Docker 和 kubectl，因此没有执行 `docker compose up --build` 或 K3s 启动验证。PostgreSQL Testcontainers 用例按设计自动跳过；该用例已包含对 V1–V4 Flyway 迁移、追溯核心表、刷新令牌表和密码重置令牌表的检查，但本次结果不代表 PostgreSQL 17、Flyway、Redis、RabbitMQ、Nginx 和容器编排已完成端到端验证。H2 本地环境按设计关闭 Flyway 并由 Hibernate 管理 Schema，不能代替 PostgreSQL 兼容性验证。获得 Docker 环境后应执行：

```powershell
Copy-Item .env.example .env
docker compose up --build --wait
docker compose ps
docker compose down
```

共享或生产环境运行前，必须先替换示例密码与 JWT 密钥，并将 `CORS_ALLOWED_ORIGINS` 改为实际访问地址。
