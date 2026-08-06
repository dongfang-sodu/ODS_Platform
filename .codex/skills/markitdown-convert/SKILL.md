---
name: markitdown-convert
description: 'Automatically convert non-Markdown files to Markdown before reading. Use when: reading, viewing, or analyzing PDF, DOCX, PPTX, XLSX, HTML, EPUB, CSV, JSON, XML, ZIP, or any file that is not .md or plain text. Converts the file to Markdown first using the markitdown CLI, then presents the result.'
argument-hint: '[file-path]'
user-invocable: true
disable-model-invocation: false
---

# MarkItDown File Converter

Automatically converts any non-Markdown file to Markdown before reading its content. This ensures all file contents are presented in a consistent, readable Markdown format.

## When to Use

This skill should be invoked whenever the user asks to:
- Read, view, or open a file that is NOT a `.md` file
- Analyze content of PDF, Word, PowerPoint, Excel documents
- Inspect HTML, EPUB, or structured data files (JSON, CSV, XML)
- View image metadata or perform OCR on images
- Extract text from ZIP archives or audio files (metadata/transcription)

**Trigger keywords:** read, view, open, show, display, analyze, inspect, check + any non-md file path.

## Prerequisites

The `markitdown` CLI must be installed in the project's virtual environment:

```bash
source /home/ubuntu/project/markitdown/.venv/bin/activate
```

## Procedure

### Step 1: Identify the file type

Check the file extension. If it is `.md` or a plain text file (`.txt`, `.py`, `.java`, `.ts`, `.tsx`, `.js`, `.yaml`, `.yml`, `.toml`, `.json`, `.xml`, `.csv`, `.html`, `.css`, `.sh`, `.sql`, `.cfg`, `.ini`, `.conf`, `.env`, `.gitignore`, `Dockerfile`, `Makefile`), read it directly — no conversion needed.

For ALL other file types (`.pdf`, `.docx`, `.pptx`, `.xlsx`, `.xls`, `.epub`, `.zip`, `.mp3`, `.wav`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, etc.), proceed with conversion.

### Step 2: Convert using markitdown

Run the `markitdown` CLI from the project's virtual environment. The command outputs Markdown to stdout:

```bash
source /home/ubuntu/project/markitdown/.venv/bin/activate && markitdown "<absolute-file-path>"
```

Use `run_in_terminal` with `mode=sync` to execute this command and capture the output.

### Step 3: Handle output

- If conversion succeeds: present the Markdown content to the user.
- If the output is very large (>500 lines): summarize key sections and offer to show specific parts.
- If conversion fails: inform the user and fall back to binary reading if appropriate.

### Step 4: Clean up

No cleanup is needed — `markitdown` writes to stdout and does not create temporary files.

## Supported File Types

| Category | Extensions |
|----------|-----------|
| Documents | `.pdf`, `.docx`, `.doc` |
| Presentations | `.pptx`, `.ppt` |
| Spreadsheets | `.xlsx`, `.xls` |
| E-books | `.epub` |
| Web | `.html`, `.htm` |
| Archives | `.zip` |
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.bmp` |
| Audio | `.mp3`, `.wav`, `.flac`, `.ogg` |

## Example

User: "Read the file /home/ubuntu/project/report.pdf"

Agent should:
1. Detect file is `.pdf` → needs conversion
2. Run: `source /home/ubuntu/project/markitdown/.venv/bin/activate && markitdown "/home/ubuntu/project/report.pdf"`
3. Present the Markdown output to the user
