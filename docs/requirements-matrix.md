# 需求实现矩阵

状态说明：`已实现` 表示已有真实 API/页面或自动测试；`基线` 表示已预留数据模型和页面但仍需外部系统或增强；`待实现` 为后续迭代。

| 需求域 | 需求 | 状态 | 当前证据/下一步 |
| --- | --- | --- | --- |
| 项目管理 | 创建、列表、详情、编辑、筛选、CSV 导出 | 已实现 | `/api/v1/projects` 与 React Projects 页面 |
| 项目管理 | M1 项目不可删除 | 已实现 | 无 DELETE 路由；前端明确提示 |
| 项目管理 | Acquisition 三类状态 | 已实现 | `/projects/{id}/acquisition-status`，PCB/SCP 写权限 |
| 项目管理 | M1→M3 同步去重 | 已实现 | 同一事务创建 M3 L0；编号唯一；集成测试 |
| 项目管理 | M3 L0/L1、Capacity、Risk、Key/Highlight | 已实现 | PMO API 和页面 |
| 项目管理 | 仅 LPM 删除 M3 | 已实现 | 方法级 RBAC + 软删除 + 授权测试 |
| 项目管理 | Excel 导入、SE 文档、TPM 健康看板 | 待实现 | 第二阶段拆分独立表和导入任务 |
| Vehicle Market | OEM 销量和市场份额/变化 | 已实现 | 销量分布 API 与 Market 页面 |
| Vehicle Market | CAAM/佐思数据接入及映射 | 基线 | 数据表、来源字段、种子数据；下一步 CSV staging/连接器 |
| Vehicle Market | ADAS 等级分布 | 已实现 | 有等级数据时按销量聚合并计算占比；缺源时返回明确不可用状态 |
| Academy | 知识树和材料外链 | 已实现 | Knowledge API 与 Academy 页面入口 |
| Academy | 课程增改、发布、取消、完成状态规则 | 已实现 | Course API、服务状态机和测试 |
| Academy | 邮件、报名、日历、材料提醒 | 待实现 | 数据字段已预留，需邮件/日历集成 |
| My Ticket | 当前用户工单、筛选、每日优先级 | 已实现 | `/api/v1/my-tickets` 和 Tickets 页面 |
| My Ticket | JIRA 同步、TR/Clone API | 待实现 | 后续使用 Adapter 接口隔离 JIRA |
| Video Guideline | 分类浏览、链接、管理员维护 | 已实现 | Video API 和 Guideline 页面 |
| Product Engineering | 专属功能 | 待定义 | 原始文档没有明确需求，保留导航扩展点 |
| 平台能力 | JWT、RBAC、错误响应、健康检查、OpenAPI | 已实现 | 仅登录端点匿名开放；禁用/删除用户的旧 JWT 失效；统一 JSON 401 |
| 平台能力 | PostgreSQL Schema 兼容验证 | 已实现 | Testcontainers 启动 PostgreSQL 17 并执行 Flyway + Hibernate validate；无 Docker 自动跳过 |
| 平台能力 | 审计、通知、可观测性、生产备份 | 待实现 | 第三阶段生产化任务 |

## 近期迭代顺序

1. 安装 JDK/Node/Docker 并执行全量构建，消除环境验证缺口。
2. 完成前后端登录和字段契约的端到端测试。
3. 增加项目审计日志与 Transactional Outbox。
4. 实现 Vehicle CSV staging、校验、回滚和产品映射。
5. 增加 Academy 报名、材料提醒和 JIRA Adapter。
