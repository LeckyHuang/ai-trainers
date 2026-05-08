# AI陪练平台 · 项目进度摘要

> 生成时间：2026-05-05 | 项目路径：`~/Desktop/ai-trainer-project/`

---

## 一、阶段总览

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase A | 管理后台基础 CRUD（15 页面 + 路由/布局） | 已完成 |
| Phase B | 学习端基础视图（12 页面）+ 后端全部 API 端点 | 已完成 |
| Phase C | UI 设计稿对齐 + Bug 修复（5 大 bug + emoji 清理） | 进行中 |
| Phase D | AI 能力接入（LLM/ASR/TTS + Prompt 系统 + Celery + WebSocket 对练） | 待开始 |
| Phase E | MVP 收尾（导出 Excel / 部署 Docker / Nginx / 压测） | 待开始 |

---

## 二、Phase C 进度（当前阶段）

### 已完成的 Bug 修复

| Bug | 描述 | 状态 |
|-----|------|------|
| Bug 1 | Modal 确认按钮不可见（重写 Modal.vue，props 驱动按钮，scoped CSS 内联） | 刚完成，待验证 |
| Bug 2 | 文件库上传/下载鉴权（download 端点加 `?token=` query param） | 已修复 |
| Bug 3 | 题库缺"从文件 AI 生成"（新增 `generate-from-file` 端点 + pdfplumber 解析 PDF） | 已修复 |
| Bug 4 | 角色库创建→生成画像流程断（重写 PersonasView，单步 create+generate+展示） | 代码完成，待验证 |
| Bug 5 | 任务列表缺编辑按钮 + 缺分配人数（后端批量查询 assigned_count + 前端编辑入口） | 已修复 |
| — | 全前端 emoji 清理 | 已完成 |
| — | `main.css` 中失败的全局 button 修复需回滚 | 待清理 |

### Phase C 剩余任务（来自 design spec 对齐）

**L10 · RoleplayView（最复杂，最优先）**
五状态 UI：AI_SPEAKING（脉冲光环+波形+打字机）→ USER_TURN（浮动按钮）→ USER_RECORDING（红色+音量环+计时）→ PROCESSING（文字轮换）→ SESSION_ENDED（结果按钮）

**L09 · RoleSelectView**
补充学习材料区域（在线阅读跳转 PdfReader）+ 考核解锁逻辑（需完成至少一次练习）

**A14 · TaskDetailView（admin）**
顶部整体进度条 + 用户进度表格按得分排序

**A12 · TaskCreateView**
Step1 补充开始/结束时间（datetime-local），Step2 补充练习/考核题目数滑块、合格/优秀分数线

### 当前紧急待办

1. 回滚 `admin/src/assets/main.css` 中失败的 `button.btn-primary` 等全局规则
2. 将所有 Modal 调用方从 `<template #footer>` 迁移到 props API（confirmText/confirmLoading）
3. FilesView.vue 增加 PDF 在线预览（iframe 嵌入 Modal）
4. 验证角色库"生成角色"按钮可见且功能正常
5. 启动后端 + 前端，用浏览器实测所有 modal 按钮

---

## 三、Phase D 内容：AI 能力接入（预估 6-8 工作日）

### D1 · AI Provider 抽象层（待实现）

当前 `app/services/ai/` 仅有硬编码的 LLMService（Qwen）和 ASRService（Doubao），需重构为：

```
app/ai/
  base.py          → LLMProvider / ASRProvider / TTSProvider 抽象类
  providers/
    qwen.py         → QwenLLM + QwenASR + QwenTTS
    deepseek.py     → DeepSeekLLM（LLM 备选）
    doubao.py       → DoubaoASR（ASR 备选）
  factory.py        → 从 ai_provider_configs 表读取配置，按 tenant 实例化，Redis 5min 缓存
```

关键设计：配置优先级 = 任务级 > 企业级 > 全局默认，支持多 Provider 热切换。

### D2 · Prompt 模板系统（待实现）

5 类内置 Prompt（写入 `prompt_templates` 表，`tenant_id=NULL`）：

| code | 用途 | 输出格式 |
|------|------|----------|
| `qa_generate` | 从材料生成问答对+得分点 | JSON { questions: [...] } |
| `persona_generate` | 从属性生成 6 维角色画像 | JSON { communication_style, ... } |
| `qa_score` | 知识问答单题评分 | JSON { score, partial_scores, feedback } |
| `roleplay_system` | 对练 system prompt（注入角色卡） | 文本 |
| `roleplay_score` | 对练最终评分 | JSON { score, dimensions, highlights, ... } |

变量规范：`{{material_text}}` `{{question}}` `{{user_answer}}` `{{score_points}}` `{{persona_card}}` `{{conversation_history}}` 等双花括号。

超管可在 SA02 页面编辑 Prompt + 版本历史 + 沙箱测试。

### D3 · Celery 长任务（待实现）

适用于 10-60 秒的 AI 生成任务：
- **AI 生成题库**：上传文件 → 提取文本 → LLM 生成问答对 → 解析 JSON → 批量写 questions 表
- **AI 生成角色画像**：基础属性 → LLM 生成 6 维 persona_card

前端流程：触发 → 返回 `celery_task_id` → 轮询 `GET /celery-tasks/{id}` → 完成/失败 → 预览确认

### D4 · 知识问答 AI 真实接入

替换当前 Mock 评分为真实 ASR + LLM 调用：
- `POST /qa/submit-answer`：音频 → ASR 转文字 → 读题目+得分点 → LLM 评分 → 返回 { score, feedback, reference_answer }
- 超时 10s，失败重试 2 次，均失败返回 503
- 音频格式兼容：iOS `audio/mp4`，其他 `audio/webm`

### D5 · 模拟对练完整实现（WebSocket）

当前 `roleplay_ws.py` 已有骨架，需完善：
- **连接建立** → 验证 JWT，创建 submission + roleplay_session，加载 persona_card
- **开场白** → LLM 生成 → TTS → 存 MinIO → 推送 `{ type: "ai_response", audio_url }`
- **对话循环** → 前端发送音频 → ASR → 构建对话历史 → LLM 回复 → TTS → 推送
- **结束** → AI 检测 `[END_SIGNAL]` 或用户发送 `end_session` → 异步评分 → 推送 `{ type: "evaluation_ready" }`
- **心跳** → 30s ping/pong，60s 无响应断开，前端指数退避重连

### D6 · 前端页面（对练相关）

- **L09 RoleSelectView**：横滑角色卡，画像展开，材料阅读，考核解锁
- **L10 RoleplayView**：WebSocket 连接，5 状态 UI，录音按钮，对话气泡列表
- **L11 RoleplayResultView**：多维度评分雷达图，示范话术对比，对话回顾

---

## 四、Phase E 内容：收尾与部署（预估 3-4 工作日）

### E1 · 任务结果导出
`GET /tasks/{id}/export` → openpyxl 生成 Excel（用户/模式/得分/完成时间/AI 反馈/各题明细）→ 存 MinIO → 返回签名 URL

### E2 · 超管剩余页面
- **SA02** Prompt 模板管理页（代码编辑器 + 变量高亮 + 测试面板 + 版本历史）
- **SA03** 全局 AI Provider 配置页（含连通性测试按钮）

### E3 · 企业设置页
- **A15** 企业设置：基础信息 Tab + AI Provider 配置 Tab（LLM/ASR/TTS 各自 provider + model + API Key + 测试）

### E4 · 部署基础设施
- Docker Compose 生产配置（nginx / api / celery / redis / postgres / minio 六服务）
- Nginx：路由分发 + gzip + HTTPS 终止 + WebSocket `proxy_pass upgrade`
- `.env.example` 模板（含所有必需环境变量说明）
- 健康检查 `GET /health`

### E5 · 测试与兼容
- iOS Safari 兼容测试（audio/mp4、getUserMedia、长按录音）
- 并发压测：10 并发 WebSocket 对练（locust 或 k6）
- 跨租户数据隔离单测

---

## 五、关键架构决策（备忘）

| 决策 | 内容 |
|------|------|
| 多租户 | 单数据库 + `tenant_id` 行隔离 + PostgreSQL RLS |
| 部署模式 | `DEPLOYMENT_MODE=standalone`（当前）vs `saas` |
| 语音方案 | MVP：录制→上传→ASR→LLM→TTS，M2 升级流式 WebSocket ASR |
| 评分策略 | 单题同步 HTTP（<5s），批量生成异步 Celery（10-60s） |
| 文件存储 | MinIO（开发/独立部署），阿里云 OSS（SaaS），同一 S3 API 切换 |
| 前端 monorepo | pnpm workspace：admin + learning + 4 shared packages |
| JWT | access 15min + refresh 7d，refresh token 写 Redis 黑名单 |

---

## 六、技术风险提醒

1. **iOS Safari**：MediaRecorder 优先 `audio/mp4`，按钮需 `preventDefault` 防长按菜单
2. **LLM JSON 不稳定**：Prompt 强制要求 JSON，解析失败最多重试 2 次
3. **WebSocket 断线**：客户端指数退避重连（1/2/4/8s），服务端会话存 Redis 可续
4. **TTS 延迟**：MVP 全量生成后返回，M2 升级流式分块播放
5. **API Key 安全**：AES-256 加密存储，日志禁止输出 key

---

## 七、服务信息

| 服务 | 地址 | 启动命令 |
|------|------|----------|
| 后端 API | `http://127.0.0.1:8000` | `uvicorn app.main:app --reload` |
| 管理后台 | `http://localhost:5177` | `npm run dev` (admin/) |
| 学员端 | `http://localhost:5176` | `npm run dev` (learning/) |

账号：`admin / admin123`（superadmin）、`ceshi / 123456`（admin）、`lucky / 123456`（learner）
