# ODS_Platform

Here is a breakdown of the functions under each of the five major functional modules provided by ODS:
数字化运营 (Digital Operations)：Vehicle Market v1.0 ， Vehicle Market v2.0
数字化项目管理 (Digital Project Management)：数字化项目管理
数字化产品开发 (Digital Product Engineering)：
数字化知识库 (Digital Knowledge base)：Academy Library (EDS 知识库)
数字化工作台 (Digital Workspace)：My Ticket  ， Video Guideline


1. 数字化运营 (Digital Operations)

    Here's a summary of the Vehicle Market v1 and v2, including their demand descriptions, project backgrounds,概要设计, and implementation methods:

    Vehicle Market v1.0

    1. 项目背景与痛点 (Background/Pain Point):

    - 销售部门以及上层管理层希望通过公开的市场产销和出口数据，来直观获取市场表现趋势等信息。

    2. 功能名称 (Function Name):

    - Vehicle Market v1.0

    3. 功能范围 (Functional Scope):

    - One Driving System → Digital Operation → Market → Vehicle Market

    4. 需求描述与概要设计 (Demand Description & Overview Design):

    - 数据相关定义 (Data Related Definitions):

    - 数据源: CAAM数据库 (每月15号更新，提供上月数据)。

    - 数据提供: 未在v1.0中明确列出提供方姓名，但数据来自CAAM数据库。

    - 功能需求 (Functional Requirements):

    - 功能模块概述: 包含整体销量分布、整体ADAS等级分布、市场产品渗透率、产品市场占有率。

    - 数据关联与映射: 佐思数据库与CAAM数据库关联与映射，产品相关数据列对应。

    - 非功能性需求: 列出非功能性需求，但未具体说明内容。

    - 图表及对应内容、过滤筛选项、UI & Prototype: 提及这些部分，但未提供具体细节。

    5. 实现方式 (Implementation Method):

    - 文档中未明确给出v1.0的实现方式细节，主要侧重于需求和数据来源的定义。

    Vehicle Market v2.0

    1. 项目背景与痛点 (Background/Pain Point):

    - 销售同事在相似/同源数据上有不同维度的统计，每次都需要手动计算和绘制PPT。他们希望在得知数据同源后，能够通过ODS实现实时统计和报表展示，以节省重复工作量。

    2. 功能名称 (Function Name):

    - Vehicle Market v2.0

    3. 功能范围 (Functional Scope):

    - One Driving System → Digital Operation → Market → Vehicle Market

    4. 需求描述与概要设计 (Demand Description & Overview Design):

    - 数据相关定义 (Data Related Definitions):

    - 数据源:

    - CAAM数据库 (原有)，每月15号更新，提供上月数据。

    - 佐思数据库 (新增)，已有2021-2024年的数据。

    - 数据提供方:

    - CAAM: WANG Rachel

    - 佐思: GU Edward

    - 功能需求 (Functional Requirements):

    - 功能模块概述 (Functional Module Overview):

    - 整体销量分布 (Overall Sales Distribution) (基于CAAM数据库): 显示每个OEM的市场占有率和市场占有率变化 (高优先级)。

    - 整体ADAS等级分布 (Overall ADAS Level Distribution): 对比不同年份销量中不同ADAS等级的占比和数量变化 (当前无数据，无法确定提供时间，本阶段暂时不做) (高优先级)。

    - 数据关联与映射: 佐思数据库与CAAM数据库关联与映射，产品相关数据列对应。

    - 非功能性需求: 提及非功能性需求，但未具体说明内容。

    - 图表及对应内容、过滤筛选项、UI & Prototype: 提及这些部分，但未提供具体细节.

    5. 实现方式 (Implementation Method):

    - 文档中未明确给出v2.0的实现方式细节，主要侧重于需求和数据来源的扩展。


2. 数字化项目管理 (Digital Project Management)

    功能与工作流程要求 (基于PDF):

    1. 项目创建 (Project Creation):

    - 角色职责: TPjM (Lead Project Manager) 负责在系统中创建新项目。

    - 业务规则:

    - 常规情况: 原则上，一次QG4 (Quality Gate 4) 对应创建一个项目。

    - 特殊情况: 如果多个QG4项目具有相同的产品、项目团队和里程碑，则可以只创建一个项目。

    - 不可删除性: 项目一旦创建，将不允许删除。如果遇到特殊情况需要删除，必须联系系统管理员 (OND1SZH, DNS1SZH, NVZ1HC 或 Le Minh Thu, DUAN Lanlan)。这个规则需要体现在UI/UX设计中（例如，不提供删除按钮或需要管理员审批流程）。

    - 入口: 页面上需要有明确的“Create new Project”或“新建项目”入口。

    - 字段: 需要考虑创建项目时可能需要的必填字段。

    1. 项目列表与信息查看 (Project List & Information View):

    - 导航路径: 用户可以通过 "Project Management" -> "Project List" 进入项目列表页面。

    - 项目列表页面功能:

    - 显示项目列表。

    - 提供查看项目详情或编辑项目信息的入口 (例如，每个项目行有一个“Click here to see Project Detail or Edit Project Information”的链接或按钮)。

    - 导出项目列表 (Export list Project) 功能。

    - 导入项目列表 (Import list Project) 功能 (注意：PDF中提到“Not support for Release 2”，但可以考虑预留接口或作为未来迭代项)。

    1. 项目筛选/搜索 (Filter/Search Project):

    - 入口: 在项目列表页面提供筛选和搜索功能。

    - Option 1 (按定义条件筛选):

    - 点击“Filter”按钮。

    - 选择筛选条件（例如，项目名称、状态、负责人等）。

    - 点击“Close Filters”应用筛选，显示过滤后的项目。

    - Option 2 (关键词搜索):

    - 提供一个关键词搜索框，用户可以直接输入关键词进行搜索。

    1. 项目编辑 (Edit Project):

    - 用户应能够通过项目列表页面的入口（如“Click here to see Project Detail or Edit Project Information”）进入项目详情页进行编辑。

    - 编辑功能需要考虑到数据的保存和更新。

    1. Acquisition Status Tracking (收购状态跟踪):

    - 入口: "One Driving System → Digital Project Management → Acquisition Status Tracking"。

    - 功能描述: 将XC项目的定点状态跟踪表格规范化并线上化，透明化所有Acquisition项目的状态。

    - 记录内容: 统一记录线下状态、上会状态和Sales Force系统状态，以便对比和跟踪。

    - 用户角色: PCB, SCP 部门的同事负责填写；TPM Lead, BU, SCN Sales 的同事负责跟踪。

    1. PMO Project List (M3 - 项目管理办公室项目列表):

    - 功能描述: 从PMO角度维护项目列表，包括项目基本信息、Capacity录入、风险启动信息、MPR Escalation信息、Key Project、Highlight Project 信息等。

    - 项目来源:

    - M1 (Acquisition) 新建项目后，系统在M3中同步建立。需要实现M1和M3之间的关联和数据同步，并有去重逻辑。

    - 需要风险启动的项目，可能会在M3中直接创建 (Manually Add L0 或在L0下Add L1)。

    - 颗粒度: 支持L0和L1分层，L1与L0关联。

    - 用户场景 (PJM/EBE/EPO/LPM):

    - 新建项目: 通过“Manually Add L0”或在某个L0下选择“Add L1”来填写项目信息。

    - 修改项目信息: 在L0或L1的“Operation”栏点击“Edit”进行修改。

    - 删除项目: 在L0或L1的“Operation”栏点击“Delete”（注意: 仅LPM有权删除M3中的项目）。这个权限控制是关键。

    - 风险启动: 在L0或L1的“Operation”栏点击“Manage Risk”，更改状态。

    - 批量导出: 在筛选区域应用筛选逻辑后，点击“Export”按钮下载包含所有筛选字段的Excel。

    - 数据来源: 一部分与Acquisition表完全一样，一部分是手工输入。

    1. SE Documentation (系统工程文档):

    - 功能描述: 根据Acquisition Status Tracking中的项目，相关同事维护相关的文档信息。

    - 范围: 所有Acquisition Status Tracking表的项目。

    - 用户角色: SCP, PMO & PCB Group。

    1. TPM Project List (TPM项目列表):

    - 功能描述: 建立基础项目列表库，用于制作实时Project Health Dashboard，监控项目健康状况。

    - 范围: XC-AS Driving部分的交付项目。

    - 用户角色: XC-AS/EDM 1-4。

    1. 管理员页面 (Administrator page):

    - 需要为管理员功能预留入口，并注明“Refer to Admin Guideline”。

    1. 其他辅助功能/页面 (Guideline for Each Page):

    - 主页 (Home Page)

    - 项目仪表板 (Project Dashboard)

    - 项目管理_项目概览 (Project Management_Project Overview)

    - 项目管理_项目列表和复制项目 (Project Management _Project List and Copy Project)

    - 项目详细信息 (Project Detail Info)

    - 项目特定 - 通用和里程碑等 (Project specific - General & milestone etc)

    - 成本规划 (Cost Planning)

    - 车辆信息 (Vehicle information)

    - 组织结构图 (Org chart)

    - T&R Easy Go

    - 车辆列表 (Vehicle List)

    技术实现建议 (作为提示词的一部分，指导ChatGPT):

    - 架构: 建议采用现代Web应用架构（例如，前后端分离），前端使用流行的框架（如React/Vue/Angular），后端使用可靠的框架（如Node.js/Python/Java Spring Boot）和数据库（如PostgreSQL/MySQL）。

    - 权限管理: 必须实现基于角色的访问控制 (RBAC)，特别是针对项目删除、编辑等敏感操作。

    - 数据同步: 考虑M1到M3的数据同步机制（例如，事件驱动、定时任务或API调用）。

    - UI/UX: 页面布局应清晰直观，操作流程符合用户习惯。设计响应式布局以适应不同设备。

    - 错误处理与通知: 妥善处理用户操作中的错误，并提供清晰的反馈（例如，项目无法删除时的提示）。

    - 可扩展性: 设计时考虑到未来功能的扩展性（如导入功能、更多仪表板视图）。

    输出要求 (ChatGPT的响应):

    请提供以下内容：

    1. 高层架构概述: 简要说明前端、后端、数据库的选型和交互方式。

    2. 关键页面/组件的设计思路:

    - “项目列表”页面 (Project List Page) 的UI布局和交互流程。

    - “创建项目”表单的设计（包含字段和验证逻辑）。

    - “筛选/搜索”功能的设计。

    - 项目详情页的结构。

    - PMO Project List (M3) 的特殊处理（L0/L1结构、同步机制、LPM删除权限如何体现）。

    1. 数据模型设计 (高层): 针对项目、用户、权限等核心实体，提供关键字段的思考。

    2. 工作流程图/伪代码: 针对“创建项目”、“查看/编辑项目”、“筛选项目”和“M3项目删除”等核心流程，提供简化的工作流程图（文本描述）或伪代码。

    3. 前端组件或库的推荐: 针对复杂UI（如表格、日期选择器、图表）的推荐。

    **请确保你的设计严格遵循PDF中关于功能可用性、角色职责和业务规则（尤其是项目不可删除性、M3的


3. 数字化产品开发 (Digital Product Engineering)

- No specific features explicitly categorized under "Digital Product Engineering" were found in the provided snippets, beyond general project management relevant to R&D. The ODS aims to integrate project process management which includes R&D aspects, but a dedicated list of features solely for "Digital Product Engineering" is not detailed here.

4. 数字化知识库 (Digital Knowledge base)

    根据提供的文件，以下是“Academy Library (EDS 知识库)”功能的总结，遵循软件工程设计范式：

        1. 功能名称

        - Academy Library (EDS 知识库)

        - 相关/组件：Trims Academy

        2. 项目背景与需求描述 (需求描述 / 项目背景)

        - 背景/痛点：

        - EDS 部门有大量常用学习材料存储在不同的公共盘中。

        - 用户难以找到具体的材料，并且通常不清楚可用内容的范围。

        - 许多 XC 用户反馈需要一个集中的在线培训课程邀请、查看和上传模块。

        - 需要将过去的培训课程整合到一个统一的知识库中，以便于检索。

        - 目标：

        - 将学习材料组织成结构化、易于导航的格式。

        - 通过点击树状结构中的节点，使用户能够直接访问学习材料对应的公共盘地址。

        - 对于 Trims Academy，一个主要目标是确保课程完成后，相应的培训材料被上传到 SharePoint 文件夹并在课程表中显示。

        3. 功能范围 (功能范围)

        - Academy Library 功能可通过以下路径访问：One Driving System → Digital Knowledge → Academy Library。

        - Trims Academy 组件的入口是“Trims Academy”二级菜单项（通常在右上角），通向“Training Course”。这涵盖了所有 Trims Academy 课程。

        4. 概要设计 / 功能模块概述

        “数字化知识库”模块（Academy Library 是其一部分）提供结构化的信息访问。尽管没有为 Academy Library 明确详细说明单独的“概述”，但描述的功能指向一个具有以下特点的系统：

        - 结构化内容组织： 用于分类和呈现学习材料的树状结构。

        - 直接访问链接： 结构内的节点将直接链接到材料的存储位置（例如，公共盘地址）。

        - 培训课程管理 (Trims Academy)： 这是一个重要的组件，用于管理培训课程及其相关材料。

        - 课程列表显示： 以表格形式显示培训课程的关键信息。

        - 课程统计： 按月、季度和年份（当前日期所在季度/年份）可视化课程信息（计划中/已发布/已完成）的图表。

        - 课程操作： 添加、编辑、发布/取消发布、取消和删除课程的功能。

        - 材料位置追踪： 一个字段，用于指示培训材料的存储位置（例如，SharePoint 文件夹地址）。

        - 邮件自定义： 支持自定义培训课程的会议邀请邮件，包括富文本描述和完整邮件内容替换。

        - 自我注册（提议）： 考虑为感兴趣的同事提供自我注册功能，以便将相关培训添加到他们的日历中。

        5. 实现方式 / 数据相关定义

        - 数据源：

        - 现有的公共盘用于存储当前的学习材料。

        - SharePoint 文件夹用于存储与 Trims Academy 课程相关的培训材料。

        - Trims Academy 课程列表的关键字段：

        - No. (ID)

        - Topic (必填 - 保存/发布所需)

        - Date (YYYY-MM-DD hh:mm~hh:mm)

        - Trainer (发布必填，保存可选)

        - Training Coordinator (由部门关联带入，不允许手动填写，但必填)

        - Trainee (发布必填，保存可选)

        - Status

        - Participation Rate (目前无数据来源)

        - Training Dept. (必填)

        - Material Location (SharePoint 地址)

        - Operation (编辑/发布/取消课程)

        - Trims Academy 编辑/新建课程弹窗功能：

        - “Description”从长文本输入框替换为富文本 (v1.5)，后来又回退到长文本输入框，并增加“高级邮件”按钮用于自定义邮件内容 (v1.6)。

        - 在自定义邮件编辑器中提供生成 ODS 默认邮件模板的选项。

        - 状态管理：

        - 课程可以处于“未发布”、“已发布”、“未开始”、“邀请已发送”和“已完成”等状态。

        - 特定的操作（编辑、发布、取消课程）根据课程状态允许。

        - 系统需要跟踪课程完成后培训材料是否已上传，如果未上传则发送提醒。

        6. 用户场景 (用户场景)

        - 用户可以导航到“Digital Knowledge”，然后“Trims Academy”查看培训课程。

        - 用户可以在数字化知识库中搜索和筛选项目/信息。

        - 用户可以注册课程，并将其添加到自己的日历中（提议）。

        - 培训师可以添加、编辑、发布和管理他们的培训课程，包括上传材料和自定义邀请邮件。

5. 数字化工作台 (Digital Workspace)

    1. 功能名称 (Feature Name)
    My Ticket

    2. 项目背景 / 痛点 (Project Background / Pain Points)
    Before the "My Ticket" feature, users faced several challenges:

    - Tickets were scattered across various projects, making it difficult to track them centrally.

    - Users had to manually save JIRA links for each project they were involved in.

    - Users needed to separately configure and save different JIRA filter conditions to find their tasks.

    - There was a lack of a clear, centralized way for team members to prioritize and manage their daily tasks.

    3. 需求描述 (Requirements Description)
    The "My Ticket" feature aims to address the aforementioned pain points by providing:

    - Centralized Ticket Management: A single, accessible location for users to view and manage their tickets, eliminating the scattering of tickets across projects.

    - Simplified Access: Removing the need for users to save individual JIRA links or configure and save specific JIRA filter conditions for their tasks.

    - Daily Task Prioritization: Enabling users to log into ODS daily, open "My Ticket," and prioritize their tasks according to importance.

    - Enhanced Task Clarity: Ensuring that each team member's daily tasks are clearly defined and visible.

    - Ease of Use: Designed to be easy to start using from the first day of its launch.

    4. 目标 (Goal)
    The primary goal of "My Ticket" is to serve as a user-friendly and efficient personal task management interface within the One Driving System (ODS), centralizing all relevant tickets and facilitating daily task prioritization and management for individual team members.

    5. 概要设计 (High-Level Design / Architectural Intent)
    While specific architectural diagrams are not provided, the description implies a high-level design that includes:

    - Personalized Dashboard/View: "My Ticket" will function as a personal dashboard within ODS, aggregating tickets relevant to the logged-in user.

    - Integration with Ticketing System: It will likely integrate with an underlying ticketing system (e.g., JIRA, as hinted by mentions in regarding JIRA Fix version, SW Version from JIRA, and checking users in JIRA for assignee input) to fetch and display ticket information.

    - Filtering and Prioritization Mechanism: The interface will provide functionalities to view, filter, and prioritize tasks based on their importance.

    - Direct Access: The feature will have a dedicated "My Ticket Entrance" within the ODS platform, suggesting a clear navigation path.

    6. 实现方式 (Implementation Methods)
    The "My Ticket" feature's implementation details are not explicitly described in the provided texts. However, based on the requirements and other related sections, the implementation would likely involve:

    - Front-end Development: A user interface within the ODS platform to display tickets, allow filtering, and facilitate prioritization.

    - Back-end Integration: Development of APIs and services to connect to and retrieve ticket data from an external or internal ticketing system (e.g., JIRA). mentions converting Python scripts for TR generation to a service API and attempting to call "clone ticket API," indicating programmatic interaction with the ticketing system.

    - Data Aggregation and Transformation: Logic to gather tickets from various projects, possibly normalize data, and present it in a unified view for the user.

    - User-Specific Context: Mechanisms to identify the logged-in user and retrieve only their assigned or relevant tickets.

    - Template Utilization: As described for the broader ticketing system, the underlying tickets may utilize templates for consistent field sets and workflows (Epic -> task -> subtask hierarchy, fixed fields, editable milestone plan).

    - Permission Management: Ensuring that users only see tickets they are authorized to view or interact with, aligning with permissions managed by the underlying ticketing system.



    1. 功能名称 (Feature Name)
    Video Guideline

    2. 项目背景 / 痛点 (Project Background / Pain Points)
    The direct "pain points" for the "Video Guideline" feature are not explicitly stated. However, the existence of such a feature implies a need for:

    - User Training and Onboarding: Users may require clear, step-by-step instructions to learn how to use the various functionalities of the One Driving System effectively.

    - Self-Service Support: Reducing the burden on support staff by enabling users to find answers to common "how-to" questions independently.

    - Standardized Instruction: Ensuring that all users receive consistent and accurate guidance on system usage.

    - Accessibility of Information: Providing an easily consumable format (videos) for learning complex system processes.

    3. 需求描述 (Requirements Description)
    The "Video Guideline" feature is a collection of video tutorials designed to guide users through various operations and functionalities within the One Driving System. The specific topics covered by these guidelines include, but are not limited to:

    - How to Log In

    - How to Request Access

    - How to View Personal Info

    - How to Create Project

    - How to View Project List or Project Information

    - How to Filter/Search Projects

    - How to Edit Project

    - How to Log Out

    - How to Request Access to Project Dashboard

    - How to go to the Project Overview Page (for Project Management Roles)

    - How to View Detail T&R Problem

    - How to View Change Request tasks in Overview

    - How to View Upcoming and Overdue tasks in Overview

    - How to Check/Download Project Milestone Plan in PPT format

    - How to go to Cost Planning Module

    - How to View Link Pages

    - How to View/Add/Edit Favorite Link Page

    - How to Clear Browser Cache

    4. 目标 (Goal)
    The primary goal of the "Video Guideline" feature is to provide comprehensive, easy-to-understand visual instructions to users, enabling them to navigate and utilize the One Driving System efficiently and independently. This aims to improve user proficiency, reduce training overhead, and enhance the overall user experience by offering readily accessible tutorials for core system functions.

    5. 概要设计 (High-Level Design / Architectural Intent)
    The "Video Guideline" feature appears to be a section or module within the One Driving System that aggregates links or embeds videos related to system usage.

    - Categorization: The videos are organized under a distinct section labeled "Video Guideline."

    - Topic-Based Structure: Each video addresses a specific "how-to" topic, indicating a structured approach to covering system functionalities.

    - Accessibility: It is likely integrated directly into the ODS interface, making it easily discoverable when users need help.

    6. 实现方式 (Implementation Methods)
    The implementation of "Video Guideline" would typically involve:

    - Content Creation: Developing and producing instructional video content for each specific topic.

    - Hosting: Storing the video files on a suitable platform (e.g., an internal video server, a corporate streaming service, or a public video platform).

    - Integration with ODS:

    - Direct Embedding: Embedding the videos directly into pages within the One Driving System's user interface.

    - Linked Resources: Providing clickable links within the ODS interface that direct users to the hosted video content, possibly opening in a new tab. mentions "click on image to open link in new tab," which might apply to video links as well.

    - Navigation: Creating a clear menu structure or a dedicated "Video Guideline" page where users can browse and select the relevant video tutorial.

    - Maintenance: Regularly updating video content to reflect changes in the One Driving System's features or UI.

