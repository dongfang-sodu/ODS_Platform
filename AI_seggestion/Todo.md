# AI 辅助逆向工程构建指南

> 从纯功能文档（PDF）逆向构建新系统框架的完整工作流程

---

## 📋 整体策略概览

```
PDF文档 → 文档解析与提取 → 需求梳理与归纳 → 架构设计 → 技术选型 → 框架搭建 → 功能模块开发 → 集成测试
```

---

## 🔧 第一阶段：PDF 文档处理（最关键的一步）

### 工具推荐：

| 工具 | 用途 | 特点 |
|------|------|------|
| **PyMuPDF (fitz)** | PDF 文本/图片提取 | 速度快，支持 OCR 识别图片中的文字 |
| **Marker / Surya** | PDF 转 Markdown | OCR + 格式保留，输出结构化 MD |
| **Docling (IBM)** | 文档解析 | 支持表格、图片的深层解析 |
| **Unstructured.io** | 文档预处理 | 支持多种格式，适合 RAG 场景 |

### 建议流程：
1. **先用 PyMuPDF 批量提取**所有 PDF 的文本内容，按章节/页面存储
2. **用 Marker** 将有复杂排版（表格、截图）的页面转为 Markdown
3. **人工标注关键页** — 功能页面、流程图页面、数据表页面等

---

## 🧠 第二阶段：用大语言模型梳理需求

### 推荐 LLM 及分工：

| LLM | 角色 | 说明 |
|-----|------|------|
| **DeepSeek V4 / Claude 4** | 主分析引擎 | 长上下文（200K+ tokens），一次性消化大量文档内容进行综合分析 |
| **Gemini 2.5 Pro** | 图表理解 | 对截图中的流程图、UI 截图有强理解能力 |
| **GPT-4o** | 辅助分析与代码生成 | 多模态，适合看图理解 + 生成代码 |
| **Copilot (VS Code)** | 编码助手 | 日常代码补全和实现 |

### 具体使用方式：

**阶段A：需求提取**
- 将 PDF 转出的 Markdown 分批喂给 DeepSeek/Claude
- 提示词：`请从这个功能说明中提取：1) 功能名称 2) 输入输出 3) 业务规则 4) 依赖关系`
- 截图/流程图 → 喂给 Gemini 2.5 Pro 或 GPT-4o
- 提示词：`请描述这张截图中展示的功能流程和UI元素`
- 汇总 → 生成《功能需求清单》

**阶段B：架构推导**
- 将《功能需求清单》喂给 DeepSeek
- 提示词：`根据以下功能清单，推导出可能的系统架构，包括：1) 技术栈建议 2) 模块划分 3) 数据库表设计 4) API接口设计`
- 产出 → 《系统架构设计文档》

---

## 🏗️ 第三阶段：框架搭建

推荐的项目结构（Python 技术栈，ODS 平台）：

```
ODS_Platform/
├── backend/                 # 后端服务
│   ├── api/                 # FastAPI/Django REST 接口
│   ├── core/                # 核心业务逻辑
│   ├── models/              # 数据模型
│   ├── services/            # 业务服务层
│   └── tasks/               # 异步任务 (Celery)
├── frontend/                # 前端 (React/Vue)
├── data_pipeline/           # 数据管道
│   ├── extract/             # 数据抽取
│   ├── transform/           # 数据转换
│   └── load/                # 数据加载
├── docs/                    # 从PDF提取的结构化文档
│   ├── raw_md/              # 原始Markdown
│   ├── requirements/        # 需求清单
│   └── architecture/        # 架构文档
├── docker/                  # Docker配置
└── tests/                   # 测试
```

---

## 💡 实操建议

### 1. 文档处理脚本示例：
```python
# extract_pdfs.py - 批量提取PDF内容
import fitz  # PyMuPDF
import os
from pathlib import Path

def extract_all_pdfs(pdf_folder, output_folder):
    for pdf_file in Path(pdf_folder).glob("*.pdf"):
        doc = fitz.open(pdf_file)
        text = ""
        for page in doc:
            text += page.get_text()
        
        # 保存为 Markdown
        md_path = Path(output_folder) / f"{pdf_file.stem}.md"
        md_path.write_text(text, encoding="utf-8")
        print(f"✅ {pdf_file.name} → {md_path.name}")
```

### 2. LLM 辅助需求提取 Prompt 模板：
```
你是一位系统架构师。请阅读以下功能说明文档，并提取：

1. **功能模块清单**：列出所有独立的功能模块
2. **每个模块的详细信息**：
   - 功能描述
   - 输入数据/参数
   - 输出结果
   - 业务规则与约束
   - 与其他模块的依赖关系
3. **数据实体识别**：列出所有涉及的数据实体及其字段
4. **业务流程梳理**：用 Mermaid 流程图描述核心业务流程
```
