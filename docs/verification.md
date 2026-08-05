# 验证记录

最后更新：2026-08-05。

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
| 后端 | `mvn test` | 40 项执行，39 项通过，0 失败，0 错误，1 项因本机无 Docker 跳过 |
| 前端依赖 | 全新临时目录执行 `npm ci` | 成功安装 76 个包，无 deprecated 或 vulnerability 警告 |
| 前端类型 | `npm run typecheck` | 通过，无诊断 |
| 前端生产包 | `npm run build` | 通过，51 个模块；JS 263.96 kB，CSS 30.03 kB |
| 配置文件 | Node JSON 解析及 PowerShell XML 解析 | 5 个 JSON 与 `backend/pom.xml` 通过 |

受管沙箱内的 Vite 默认配置加载器无法读取工作区上级目录；授权在普通本机权限下执行后，`npm run build` 成功完成 TypeScript 编译和生产打包。

## H2 冒烟测试

使用可执行 Spring Boot JAR 和临时 H2 内存库完成以下真实调用：

- `/actuator/health` 返回 `UP`。
- 登录和 `/api/v1/auth/me` 成功。
- 创建项目后自动建立 Acquisition 状态与 PMO L0。
- 2024-12 Vehicle Market 返回总销量 24500 和 3 个 OEM。
- Academy 课程创建并发布后状态为 `PUBLISHED`。
- Demo 用户返回 2 条工单，业务优先级排序首项为 `HIGH`。
- 管理员登录后，追溯接口返回 30 个 AEB 演示工件和 8 类关系定义。
- 追溯集成测试覆盖环路终止、完整路径、影响候选、解释路径、人工复核、二次确认与关联工单创建。

冒烟进程已停止，没有保留后台 Java 服务。

## 尚未验证

当前机器未安装 Docker，因此没有执行 `docker compose up --build`。PostgreSQL Testcontainers 用例按设计自动跳过；该用例已包含对 V1–V3 Flyway 迁移和追溯核心表的检查，但本次结果不代表 PostgreSQL 17、Flyway、Nginx 和三个容器已在本机完成端到端验证。H2 本地环境按设计关闭 Flyway并由 Hibernate 管理 Schema，不能代替 PostgreSQL 兼容性验证。获得 Docker 环境后应执行：

```powershell
Copy-Item .env.example .env
docker compose up --build --wait
docker compose ps
docker compose down
```

共享或生产环境运行前，必须先替换示例密码与 JWT 密钥，并将 `CORS_ALLOWED_ORIGINS` 改为实际访问地址。
