# AI陪练平台 · 完整开发计划

> 版本：v1.0 | 状态：已 Opus 审核确认
> 适用对象：全栈开发工程师
> 预计工期：23-28 工作日（单人全栈，不含 UI 设计时间）

---

## 一、项目定位与 MVP 目标

### 1.1 产品定位

AI陪练是一个面向企业内训的 AI 对话练习平台，支持云端 SaaS 多租户模式和客户独立部署双模式。企业管理员通过后台配置培训任务并推送给员工，员工在前端完成学习和考核，全程由 AI 提供互动、评分与反馈。

产品支持试用体验，超管可一键为企业开通试用租户（独立数据隔离），试用期结束后一键转为正式账号，数据原地保留无需迁移。

### 1.2 MVP 范围

**完整实现（两种核心模式全流程）**

- **知识问答模式**：员工阅读学习材料（PDF）→ 完成阅读后解锁练习 → 练习模式（逐题语音作答，AI即时评分，可查看参考答案）→ 完成一次练习后解锁考核 → 考核模式（限时，不即时给分）→ 结果页（汇总评分+各题明细）
- **模拟客户对练模式**：员工选择虚拟客户角色 → 进入语音对话（AI扮演客户，多轮自然对话）→ 对话结束后 AI 给出综合评分、亮点/改进建议、示范话术

**简化版实现（管理后台支撑功能）**

- 用户管理：三级角色（超管/管理员/学员），固定权限，不做自定义 RBAC
- 任务创建与推送（指定用户或分组）
- 题库管理（手工创建 + AI 从文件生成）
- 角色库管理（手工创建 + AI 生成6维画像）
- 文件库（上传/管理学习材料、音视频）
- 站内通知（任务推送时自动发送）

**最小可用版实现（不能删、但可以简化）**

- **审计日志**：FastAPI 中间件统一捕获 POST/PUT/DELETE 操作，写入 `audit_logs` 表，管理后台提供简单列表查询。必须从 Day 1 记录，历史数据无法补录。
- **任务结果导出**：按任务维度导出参与用户列表+得分+AI反馈摘要为 Excel（openpyxl），企业演示/试用评估时的必备功能。

**MVP 暂缓（后续版本）**

- 方案试讲模式（M2）
- 支付接入 + License 机制（M3）
- i18n 国际化（M3，但代码预留框架）
- 自定义 RBAC 权限配置（M3）
- 勋章/成就体系（M3）
- 短信通知（M4）
- 流式 WebSocket ASR 降延迟（M2）
- 打断式语音（M4）

### 1.3 试用账号策略（已确认）

采用**独立租户方案**：超管后台一键开通试用企业，系统自动分配独立 `tenant_id`，创建企业管理员账号，设置试用期限。试用期内所有数据完全隔离。到期后超管一键"转正"，仅需修改 `tenant.status` 和 `plan` 字段，所有数据（用户/任务/记录）原地保留。

---

## 二、技术栈选型（最终确认）

### 2.1 后端

| 层 | 技术选型 | 选型理由 |
|---|---|---|
| Web 框架 | **Python 3.11 + FastAPI** | async 原生支持，OpenAPI 文档自动生成，Qwen/DeepSeek/Minimax SDK 均为 Python 优先，AI 生态最完整 |
| ORM | **SQLAlchemy 2.0 + Alembic** | 类型安全，async 支持，migration 版本管理 |
| 异步任务 | **Celery 5 + Redis** | AI 生成题库/角色画像等10-60秒长任务异步处理，前端轮询任务状态 |
| 认证 | **JWT**（access 15min + refresh 7d）| 无状态，适合多实例扩展；refresh token 写 Redis 黑名单实现登出 |
| 实时通信 | **FastAPI WebSocket** | 模拟对练语音轮次通信，FastAPI 原生支持，无需额外引入 |
| 文件存储 | **MinIO**（开发/独立部署）**阿里云 OSS**（SaaS 生产）| 两者均兼容 S3 API，同一套代码通过环境变量切换，零改动 |

### 2.2 数据库

| 用途 | 技术 | 说明 |
|---|---|---|
| 主业务数据 | **PostgreSQL 16** | 行级安全（RLS）+ `tenant_id` 实现多租户隔离；`JSONB` 存储差异化配置 |
| 缓存/会话/队列 | **Redis 7** | JWT 黑名单、Celery Broker、AI Provider 配置缓存（5min TTL）|
| 全文检索 | PostgreSQL FTS（MVP）→ Elasticsearch（按需）| MVP 阶段 PG 内置全文检索够用 |

### 2.3 AI Provider 层（核心架构）

三类 AI 能力均通过抽象接口统一调用，便于不同租户配置不同 Provider，以及后续切换或新增 Provider：

```
AbstractProvider
├── LLMProvider  → QwenLLM / DeepSeekLLM / MinimaxLLM
├── ASRProvider  → QwenASR / DoubaoASR
└── TTSProvider  → QwenTTS
```

配置优先级（从低到高）：超管全局默认 → 企业租户覆盖 → 任务级别覆盖

### 2.4 前端（Monorepo）

```
pnpm workspace（根）
apps/
  admin/      Vue 3 + Vite  管理后台（macOS 风，含超管模块）
  learning/   Vue 3 + Vite  学习端（iOS 家族响应式）
packages/
  design-tokens/   CSS 变量双主题：mac-theme / ios-theme
  ui-shared/       跨端共用业务组件（PDFReader / AudioRecorder / VoiceChatBubble / ScoreDisplay）
  api-client/      orval 从 FastAPI OpenAPI schema 自动生成请求函数 + TypeScript 类型
  utils/           通用工具（日期/格式化/音频处理等）
```

### 2.5 部署

- **容器化**：Docker + Docker Compose（单机 MVP），后期可平滑迁移 K8s
- **反向代理**：Nginx（路由分发 + gzip + HTTPS 终止 + 静态资源）
- **云服务**：阿里云/腾讯云（按需升配，初期推荐 4核8G 起步）

---

## 三、系统架构设计

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                       用户层                             │
│   管理后台(Vue/PC)         学习端(Vue/响应式PC+H5)       │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────▼──────────────────────────────┐
│                   Nginx（反向代理）                      │
│         路由分发 / gzip / HTTPS终止 / 静态资源           │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│           FastAPI 应用（Gunicorn + Uvicorn workers）     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ 认证模块 │ │ 任务模块 │ │ 文件模块 │ │ WebSocket模块 │  │
│  │ 租户中间件│ │ QA流程  │ │ MinIO   │ │ 对练对话管理  │  │
│  └─────────┘ └─────────┘ └─────────┘ └──────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ 用户模块 │ │ 题库模块 │ │ 角色库  │ │  超管模块    │  │
│  └─────────┘ └─────────┘ └─────────┘ └──────────────┘  │
└──────────┬───────────────────────────┬──────────────────┘
           │                           │
  ┌────────▼────────┐       ┌──────────▼──────────┐
  │   PostgreSQL    │       │   Celery Workers      │
  │  (RLS多租户隔离) │       │  (AI生成/异步任务)   │
  └─────────────────┘       └──────────┬──────────┘
  ┌─────────────────┐                  │
  │      Redis      │       ┌──────────▼──────────┐
  │ (缓存/会话/队列) │       │    AI Provider层     │
  └─────────────────┘       │  Qwen/DeepSeek/豆包  │
  ┌─────────────────┐       └─────────────────────┘
  │  MinIO / OSS    │
  │ (文件/音频/PDF)  │
  └─────────────────┘
```

### 3.2 多租户隔离策略

**实现方式**：单数据库 + `tenant_id` 行隔离 + PostgreSQL Row Level Security

所有业务表均包含 `tenant_id NOT NULL` 字段，并配置 RLS Policy，通过 Session 变量 `app.current_tenant_id` 自动过滤数据，杜绝跨租户访问。

**租户中间件工作流程**：
1. 请求进入 FastAPI
2. 中间件解析 JWT，提取 `tenant_id` 和 `user_id`
3. 执行 `SET LOCAL app.current_tenant_id = '{tenant_id}'`
4. 所有后续数据库查询自动受 RLS 约束
5. 超管角色（role=superadmin）对应的数据库角色 bypass RLS

**独立部署切换**：
```bash
DEPLOYMENT_MODE=standalone  # 中间件跳过 RLS，DEFAULT_TENANT_ID=1
DEPLOYMENT_MODE=saas        # 启用 RLS，从 JWT 提取 tenant_id
```

### 3.3 DEPLOYMENT_MODE 环境变量框架

通过单一环境变量控制以下行为差异：

| 行为 | saas 模式 | standalone 模式 |
|---|---|---|
| 租户隔离 | 启用 RLS，JWT 携带 tenant_id | 跳过 RLS，固定 tenant_id=1 |
| 试用/限额校验 | 启用（检查 tenant.status/quota）| 跳过 |
| 支付模块 | 加载（M3 实现）| 不加载 |
| License 校验 | 跳过 | 机器码验证（M3 实现）|
| 超管模块 | 完整功能 | 简化单租户版 |
| 注册入口 | 企业申请试用流程 | 关闭（管理员账号由部署者创建）|

### 3.4 语音对话技术方案

**MVP 选用方案 A（本地录音 → 上传 → 处理）**，技术实现简单可靠：

```
[用户按住录音] → MediaRecorder 录音（iOS: audio/mp4，其他: audio/webm）
→ 录音完成 → 上传到后端 /api/v1/roleplay/audio
→ 后端：ASR 转文字 → 写入对话历史 → LLM 生成回复（携带完整 context）
→ TTS 生成音频 → 存 MinIO → 返回 {text, audio_url, turn_id}
→ 前端播放 TTS 音频，显示对话气泡
→ 等待下一轮
典型延迟：3-8 秒/轮（用户可接受）
```

**M2 升级到方案 B**（流式 WebSocket ASR，延迟降至 1-3 秒）：WebSocket 连接已在 MVP 中建立，升级时只需在服务端增加 streaming ASR 逻辑，前端不需大改。

**iOS Safari 兼容处理**：
- 录音格式优先 `audio/mp4`（iOS Safari 支持），降级 `audio/webm`
- 前端在 `getUserMedia` 前必须有用户手势触发（不能自动录音）
- 长按录音按钮需 `preventDefault()` 阻止系统长按菜单
- 后端 ASR 接口统一接受多种格式，由 ASR Provider 处理格式适配

### 3.5 知识问答评分策略

单题评分采用**同步 HTTP 调用**（非 Celery 异步），原因：
- 目标响应时间 < 5 秒（ASR + LLM 串行调用，Qwen 接口正常情况下可达到）
- 同步模式前端 loading 等待体验直接，无需轮询
- Celery 异步队列只用于真正的长任务（AI 生成题库/角色画像，耗时 10-60 秒）

若 LLM 超时（超过 10 秒），返回 503 错误，前端提示用户重试。

---

## 四、数据库完整 Schema

### 4.1 租户与用户

```sql
-- 企业租户表
CREATE TABLE tenants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(200) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'trial'
                  CHECK (status IN ('trial','active','expired','suspended')),
    plan          VARCHAR(20)  NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free','basic','pro','enterprise')),
    trial_expires_at    TIMESTAMPTZ,
    max_users           INT DEFAULT 50,
    max_tasks           INT DEFAULT 100,
    ai_call_quota_monthly INT DEFAULT 10000,
    contact_name        VARCHAR(100),
    contact_phone       VARCHAR(20),
    contact_email       VARCHAR(200),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户表（含所有角色）
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id),
    phone         VARCHAR(20) UNIQUE,
    email         VARCHAR(200),
    username      VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'trainee'
                  CHECK (role IN ('superadmin','admin','tutor','trainee')),
    display_name  VARCHAR(100),
    avatar_url    TEXT,
    department    VARCHAR(100),
    is_active     BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_phone ON users(phone);

-- 用户分组
CREATE TABLE user_groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_group_members (
    user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id  UUID REFERENCES user_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, group_id)
);

-- 审计日志（不挂 RLS，超管和服务层均可写入）
CREATE TABLE audit_logs (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id     UUID REFERENCES tenants(id),
    user_id       UUID REFERENCES users(id),
    action        VARCHAR(100) NOT NULL,   -- 如 'task.create', 'user.delete', 'persona.update'
    resource_type VARCHAR(50),             -- 如 'task', 'user', 'question_bank'
    resource_id   TEXT,
    before_data   JSONB,
    after_data    JSONB,
    ip_address    INET,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
```

### 4.2 文件库

```sql
CREATE TABLE files (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL REFERENCES tenants(id),
    original_name  VARCHAR(500) NOT NULL,
    storage_key    TEXT NOT NULL,          -- MinIO/OSS 对象 key
    storage_bucket VARCHAR(100),
    mime_type      VARCHAR(100),
    size_bytes     BIGINT,
    file_type      VARCHAR(50)
                   CHECK (file_type IN ('material','audio','video','image','other')),
    uploaded_by    UUID REFERENCES users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_files_tenant_type ON files(tenant_id, file_type);
```

### 4.3 任务系统

```sql
CREATE TABLE tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    title       VARCHAR(500) NOT NULL,
    description TEXT,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('qa','roleplay','presentation')),
    status      VARCHAR(20) NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','scheduled','active','ended','cancelled')),
    config      JSONB NOT NULL DEFAULT '{}',
    -- QA 模式 config 示例：
    -- {"question_count_practice": 5, "question_count_assessment": 10,
    --  "time_limit_minutes": 30, "pass_score": 60, "excellent_score": 90}
    -- Roleplay 模式 config 示例：
    -- {"pass_score": 60, "excellent_score": 90, "objective": "向XX行业客户推销XX产品"}
    start_at    TIMESTAMPTZ,
    end_at      TIMESTAMPTZ,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tasks_tenant_type_status ON tasks(tenant_id, type, status);

-- 任务关联学习材料
CREATE TABLE task_materials (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_id    UUID NOT NULL REFERENCES files(id),
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE (task_id, file_id)
);

-- 任务关联题库（QA模式）
CREATE TABLE task_question_banks (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    bank_id UUID NOT NULL REFERENCES question_banks(id),
    PRIMARY KEY (task_id, bank_id)
);

-- 任务关联角色（Roleplay模式）
CREATE TABLE task_personas (
    task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id),
    PRIMARY KEY (task_id, persona_id)
);

-- 任务推送对象（user 或 group 二选一）
CREATE TABLE task_assignments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id),
    group_id   UUID REFERENCES user_groups(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (user_id IS NOT NULL OR group_id IS NOT NULL)
);

-- 用户提交记录（每次练习/考核均记录）
CREATE TABLE task_submissions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id      UUID NOT NULL REFERENCES tasks(id),
    user_id      UUID NOT NULL REFERENCES users(id),
    tenant_id    UUID NOT NULL REFERENCES tenants(id),
    mode         VARCHAR(20) NOT NULL CHECK (mode IN ('practice','assessment')),
    status       VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress','completed','expired')),
    score        NUMERIC(5,2),
    max_score    NUMERIC(5,2),
    ai_feedback  JSONB,                   -- 综合评语、各维度分数等
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_submissions_task_user ON task_submissions(task_id, user_id);

-- 知识问答每题作答记录
CREATE TABLE submission_answers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id     UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
    question_id       UUID REFERENCES questions(id),
    question_order    INT,
    audio_file_id     UUID REFERENCES files(id),
    transcribed_text  TEXT,
    score             NUMERIC(5,2),
    max_score         NUMERIC(5,2),
    partial_scores    JSONB,             -- 各得分点命中情况
    ai_feedback       TEXT,
    reference_answer  TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 站内通知
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id),
    user_id    UUID NOT NULL REFERENCES users(id),
    type       VARCHAR(50) NOT NULL,    -- 'task_assigned', 'task_reminder'
    title      VARCHAR(200) NOT NULL,
    body       TEXT,
    task_id    UUID REFERENCES tasks(id),
    is_read    BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
```

### 4.4 阅读进度追踪

```sql
-- 逐页记录，防止用户直接跳到末页触发"已读"
CREATE TABLE material_reading_progress (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id),
    task_id          UUID NOT NULL REFERENCES tasks(id),
    file_id          UUID NOT NULL REFERENCES files(id),
    total_pages      INT,
    visited_pages    INT[] NOT NULL DEFAULT '{}',   -- 已访问页码集合
    max_page_reached INT NOT NULL DEFAULT 0,
    is_completed     BOOLEAN NOT NULL DEFAULT false,
    last_read_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, task_id, file_id)
);
```

### 4.5 题库

```sql
CREATE TABLE question_banks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    source      VARCHAR(20) CHECK (source IN ('manual','upload','ai_generated')),
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id         UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    question_text   TEXT NOT NULL,
    answer_text     TEXT NOT NULL,           -- 参考答案
    score_points    JSONB NOT NULL DEFAULT '[]',
    -- 格式：[{"keyword": "产品优势", "weight": 30, "match_type": "semantic"},
    --         {"keyword": "价格区间", "weight": 20, "match_type": "keyword"}]
    max_score       NUMERIC(5,2) NOT NULL DEFAULT 100,
    difficulty      VARCHAR(20) CHECK (difficulty IN ('easy','medium','hard')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    version         INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_questions_bank ON questions(bank_id, is_active);
```

### 4.6 角色库（虚拟客户）

```sql
CREATE TABLE personas (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID NOT NULL REFERENCES tenants(id),
    name                 VARCHAR(100) NOT NULL,
    gender               VARCHAR(10) CHECK (gender IN ('male','female','other')),
    age                  INT,
    industry             VARCHAR(100),
    position             VARCHAR(100),
    experience_years     INT,
    education            VARCHAR(100),
    -- 大五型人格各维度评分（1-10）
    big_five             JSONB NOT NULL DEFAULT '{}',
    -- {"openness": 7, "conscientiousness": 8, "extraversion": 5,
    --  "agreeableness": 6, "neuroticism": 3}
    -- 背景信息（可选填）
    background           JSONB NOT NULL DEFAULT '{}',
    -- {"career": "...", "education_detail": "...", "achievements": "...",
    --  "work_style": "...", "focus_areas": "..."}
    -- AI 生成的6维角色画像（核心，LLM 生成后可人工编辑）
    persona_card         JSONB NOT NULL DEFAULT '{}',
    -- {"communication_style": "...", "decision_making": "...",
    --  "pain_points": "...", "motivation": "...",
    --  "risk_attitude": "...", "relationship_style": "..."}
    avatar_file_id       UUID REFERENCES files(id),
    voice_id             VARCHAR(100),        -- 预留 TTS 音色 ID（M4）
    is_active            BOOLEAN NOT NULL DEFAULT true,
    created_by           UUID REFERENCES users(id),
    version              INT NOT NULL DEFAULT 1,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.7 对练会话记录

```sql
CREATE TABLE roleplay_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id     UUID NOT NULL REFERENCES task_submissions(id),
    persona_id        UUID NOT NULL REFERENCES personas(id),
    turns             JSONB NOT NULL DEFAULT '[]',
    -- 格式：[{"turn_id": "uuid", "role": "ai"|"user",
    --          "text": "...", "audio_url": "...", "timestamp": "..."}]
    final_evaluation  JSONB,
    -- {"score": 82, "dimensions": [...], "highlights": [...],
    --  "improvements": [...], "example_scripts": [...]}
    total_turns       INT NOT NULL DEFAULT 0,
    duration_seconds  INT,
    ws_session_id     VARCHAR(100),
    ended_by          VARCHAR(20) CHECK (ended_by IN ('ai','user','timeout')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMPTZ
);
```

### 4.8 Prompt 模板

```sql
CREATE TABLE prompt_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID,                        -- NULL = 全局默认，超管维护；非NULL = 企业自定义
    code        VARCHAR(100) NOT NULL,
    -- 预定义 code：
    -- qa_generate      从材料生成问答对+得分点
    -- persona_generate 从属性生成6维角色画像
    -- qa_score         知识问答单题评分
    -- roleplay_system  模拟对练 system prompt（动态注入角色卡）
    -- roleplay_score   模拟对练最终评分
    name        VARCHAR(200) NOT NULL,
    content     TEXT NOT NULL,
    variables   JSONB NOT NULL DEFAULT '[]',
    -- [{"name": "material_text", "description": "学习材料全文内容", "required": true}]
    version     INT NOT NULL DEFAULT 1,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    updated_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, code, is_active)
);

CREATE TABLE prompt_template_versions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id),
    content     TEXT NOT NULL,
    version     INT NOT NULL,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.9 AI Provider 配置

```sql
CREATE TABLE ai_provider_configs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID REFERENCES tenants(id),  -- NULL = 全局默认
    provider_type    VARCHAR(20) NOT NULL CHECK (provider_type IN ('llm','asr','tts')),
    provider_name    VARCHAR(50) NOT NULL,          -- 'qwen', 'deepseek', 'minimax', 'doubao'
    model_name       VARCHAR(100),                  -- 如 'qwen-turbo', 'deepseek-chat'
    api_key_encrypted TEXT NOT NULL,               -- AES 加密存储
    api_base_url     TEXT,                          -- 自定义 base URL（部分 Provider 需要）
    is_default       BOOLEAN NOT NULL DEFAULT false,
    config_extra     JSONB DEFAULT '{}',            -- 额外参数（temperature 等默认值）
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4.10 Row Level Security 设置

```sql
-- 对所有业务表执行（以 tasks 为例）
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tasks
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- 其余业务表同样操作：
-- users, files, task_*, question_banks, questions,
-- personas, roleplay_sessions, notifications, prompt_templates,
-- material_reading_progress, ai_provider_configs

-- 创建 bypass RLS 的超管数据库角色
CREATE ROLE app_superadmin BYPASSRLS;
-- 超管账号的数据库连接使用此角色
```

---

## 五、AI 能力层详细设计

### 5.1 Provider 抽象层代码结构

```python
# ai/base.py
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    async def chat(self, messages: list[dict], **kwargs) -> str:
        """标准对话，返回完整回复文本"""
        ...

    @abstractmethod
    async def chat_json(self, messages: list[dict], **kwargs) -> dict:
        """要求 LLM 返回 JSON，内部处理解析和重试"""
        ...

class ASRProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, format: str = "mp4") -> str:
        """音频转文字"""
        ...

class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, voice_id: str = None) -> bytes:
        """文字转音频，返回音频字节"""
        ...

# ai/providers/qwen.py   → 实现 QwenLLM, QwenASR, QwenTTS
# ai/providers/deepseek.py → 实现 DeepSeekLLM
# ai/providers/minimax.py  → 实现 MinimaxLLM
# ai/providers/doubao.py   → 实现 DoubaoASR

# ai/factory.py
class AIProviderFactory:
    _cache: dict = {}   # Redis 缓存 AI Provider 配置，TTL 5分钟

    @classmethod
    async def get_llm(cls, tenant_id: UUID) -> LLMProvider:
        """读取 ai_provider_configs，按优先级返回 LLM 实例"""
        ...

    @classmethod
    async def get_asr(cls, tenant_id: UUID) -> ASRProvider: ...

    @classmethod
    async def get_tts(cls, tenant_id: UUID) -> TTSProvider: ...
```

### 5.2 Prompt 模板系统

**变量规范**（模板中统一使用双花括号）：

| 变量名 | 用途 |
|---|---|
| `{{material_text}}` | 学习材料文本内容（PDF 解析后的文字）|
| `{{question}}` | 题目文本 |
| `{{user_answer}}` | 用户回答文本（ASR 转写后）|
| `{{score_points}}` | 得分点配置 JSON 字符串 |
| `{{persona_card}}` | 角色画像 JSON 字符串（注入 roleplay system prompt）|
| `{{conversation_history}}` | 格式化对话历史文本 |
| `{{task_objective}}` | 任务目标描述 |
| `{{question_count}}` | 需要生成的题目数量 |
| `{{big_five}}` | 大五型人格评分 JSON |

**5 类内置 Prompt**（系统初始化时写入，`tenant_id=NULL`，超管可编辑）：

**1. `qa_generate`**：从材料文本生成问答对+得分点

提示词要求 LLM 输出固定 JSON 结构：
```json
{
  "questions": [
    {
      "question_text": "...",
      "answer_text": "...",
      "score_points": [
        {"keyword": "...", "weight": 30, "match_type": "semantic|keyword"}
      ],
      "max_score": 100,
      "difficulty": "easy|medium|hard"
    }
  ]
}
```

**2. `persona_generate`**：从角色属性生成6维画像

输出 JSON：
```json
{
  "communication_style": "...",
  "decision_making": "...",
  "pain_points": "...",
  "motivation": "...",
  "risk_attitude": "...",
  "relationship_style": "..."
}
```

**3. `qa_score`**：知识问答单题评分

输出 JSON：
```json
{
  "score": 75,
  "max_score": 100,
  "partial_scores": [
    {"point": "产品优势", "hit": true, "score": 30, "max": 30}
  ],
  "feedback": "回答覆盖了核心要点，但...",
  "reference_answer": "完整示范答案..."
}
```

**4. `roleplay_system`**：模拟对练 system prompt

动态变量替换后注入 LLM 的 system 角色，包含：角色画像、任务背景、行为指引（自然结束对话的条件、语气要求、何时在回复末尾加 `[END_SIGNAL]`）

**5. `roleplay_score`**：模拟对练最终评分

输出 JSON：
```json
{
  "score": 82,
  "max_score": 100,
  "dimensions": [
    {"name": "表达清晰度", "score": 85, "max": 100},
    {"name": "产品匹配度", "score": 80, "max": 100},
    {"name": "客户应对",   "score": 78, "max": 100},
    {"name": "专业性",     "score": 85, "max": 100}
  ],
  "highlights": ["开场建立了良好客户关系", "产品介绍逻辑清晰"],
  "improvements": ["价格异议处理较被动", "结尾未有效推进成交"],
  "example_scripts": [
    {
      "turn_index": 3,
      "original": "这个价格已经很实惠了",
      "better": "我理解您对价格的顾虑，从ROI角度来看..."
    }
  ]
}
```

### 5.3 知识问答评分完整流程

```
POST /api/v1/tasks/{task_id}/qa/submit-answer
Body: {submission_id, question_id, audio_file_id, question_order}

服务端处理（同步）：
1. 从 MinIO 读取音频文件字节
2. 调用 ASRProvider.transcribe() → 文字
3. 从 questions 表读取题目文本和得分点
4. 渲染 qa_score prompt（注入题目+得分点+用户回答）
5. 调用 LLMProvider.chat_json() → 解析评分 JSON
   └── 失败重试最多 2 次，均失败返回 503
6. 写入 submission_answers 表
7. 返回 {score, max_score, partial_scores, feedback, reference_answer}

前端接收：
→ 显示得分动画 + AI 评语
→ 「查看参考答案」按钮（折叠展开，不自动显示）
→ 「下一题」按钮激活
```

### 5.4 模拟对练完整流程

```
WS /ws/roleplay/{task_id}?token=xxx&persona_id=xxx&mode=practice

1. 连接建立
   → 服务端验证 JWT + 检查任务状态
   → 创建 task_submission 记录（mode=practice）
   → 创建 roleplay_session 记录（turns=[]）
   → 从 DB 加载 persona_card + task config
   → 渲染 roleplay_system prompt（注入角色卡+任务目标）

2. AI 开场白
   → 调用 LLM（messages=[system, user:"请开始"]）→ 开场白文字
   → 调用 TTS → 音频 bytes → 存 MinIO → 获得 audio_url
   → 发送 {type:"session_ready", persona_name, background_brief}
   → 发送 {type:"ai_response", text, audio_url, turn_id}
   → 写入 turns[0]

3. 对话循环
   客户端发送：{type:"user_audio", audio: base64, format:"mp4", turn_id: uuid}
   → 服务端 base64 解码 → ASR → user_text
   → 写入 turns（role:"user"）
   → 构建对话历史 messages（system + 全部 turns 转 messages 格式）
   → 调用 LLM → ai_reply_text
   → 检测 [END_SIGNAL] 标记（如存在则设 end_signal=true）
   → 调用 TTS → audio_url
   → 写入 turns（role:"ai"）
   → 发送 {type:"ai_response", text, audio_url, turn_id, end_signal?}

4. 对话结束（AI 触发 end_signal 或用户发送 end_session）
   → 发送 {type:"session_ended", ended_by:"ai"|"user"}
   → 异步触发最终评分：
     └── 渲染 roleplay_score prompt（注入全部对话历史）
     └── 调用 LLM → 评分 JSON
     └── 写入 roleplay_session.final_evaluation
     └── 更新 task_submission（status=completed, score）
   → 发送 {type:"evaluation_ready", submission_id}
   → 关闭 WebSocket

5. 心跳与断线处理
   → 服务端每 30 秒发送 {type:"ping"}
   → 客户端回复 {type:"pong"}
   → 超过 60 秒无 pong → 关闭连接，session 标记 ended_by=timeout
   → 客户端断线重连（指数退避 1s/2s/4s/8s，最多 5 次）
```

---

## 六、API 接口设计

### 6.1 认证模块

```
POST   /api/v1/auth/login          手机号/用户名+密码 → {access_token, refresh_token, user}
POST   /api/v1/auth/refresh        refresh_token → {access_token}
POST   /api/v1/auth/logout         黑名单当前 refresh_token
GET    /api/v1/auth/me             当前用户信息
PUT    /api/v1/auth/password       修改密码
```

### 6.2 用户管理

```
GET    /api/v1/users               列表（分页+角色筛选+分组筛选+搜索）
POST   /api/v1/users               创建用户（admin 以上权限）
GET    /api/v1/users/{id}          用户详情
PUT    /api/v1/users/{id}          更新用户信息
DELETE /api/v1/users/{id}          禁用用户（软删除，is_active=false）
GET    /api/v1/user-groups         分组列表
POST   /api/v1/user-groups         创建分组
PUT    /api/v1/user-groups/{id}    更新分组
DELETE /api/v1/user-groups/{id}    删除分组
POST   /api/v1/user-groups/{id}/members    添加成员（批量）
DELETE /api/v1/user-groups/{id}/members    移除成员
```

### 6.3 文件库

```
POST   /api/v1/files/upload        上传文件（multipart/form-data）→ {file_id, url}
GET    /api/v1/files               文件列表（分页+类型筛选+搜索）
DELETE /api/v1/files/{id}          删除文件（检查是否被任务引用）
GET    /api/v1/files/{id}/url      获取临时访问 URL（签名，有效期 1 小时）
```

### 6.4 题库模块

```
GET    /api/v1/question-banks              题库列表
POST   /api/v1/question-banks              创建题库
GET    /api/v1/question-banks/{id}         题库详情
PUT    /api/v1/question-banks/{id}         更新题库基础信息
DELETE /api/v1/question-banks/{id}         删除题库
GET    /api/v1/question-banks/{id}/questions       题目列表（分页）
POST   /api/v1/question-banks/{id}/questions       手工添加题目
PUT    /api/v1/questions/{id}              编辑题目
DELETE /api/v1/questions/{id}             删除题目
POST   /api/v1/question-banks/{id}/generate        AI生成题库（异步）→ {celery_task_id}
GET    /api/v1/celery-tasks/{task_id}     查询异步任务状态
```

### 6.5 角色库模块

```
GET    /api/v1/personas            角色列表
POST   /api/v1/personas            创建角色（基础信息）
GET    /api/v1/personas/{id}       角色详情
PUT    /api/v1/personas/{id}       更新角色
DELETE /api/v1/personas/{id}       删除角色（软删除）
POST   /api/v1/personas/{id}/generate-card    AI生成角色画像（同步，约3-8秒）
POST   /api/v1/personas/{id}/avatar           上传头像文件
```

### 6.6 任务模块（管理端）

```
GET    /api/v1/tasks                     任务列表（type/status筛选，分页）
POST   /api/v1/tasks                     创建任务（含 config）
GET    /api/v1/tasks/{id}                任务详情（含材料/题库/角色/推送配置）
PUT    /api/v1/tasks/{id}                更新任务（draft 状态才可改）
POST   /api/v1/tasks/{id}/publish        发布并推送（写 task_assignments + notifications）
DELETE /api/v1/tasks/{id}               取消任务
GET    /api/v1/tasks/{id}/progress       任务整体进度（完成率+分组统计）
GET    /api/v1/tasks/{id}/progress/users 参与用户进度列表（含每人完成状态+最高分）
GET    /api/v1/tasks/{id}/progress/users/{user_id}  指定用户详细提交记录
GET    /api/v1/tasks/{id}/export         导出任务结果 Excel（生成后返回下载 URL）
```

### 6.7 任务模块（学习端）

```
GET    /api/v1/tasks/my                          我的任务列表（状态分组）
GET    /api/v1/tasks/{id}/my-progress            我在此任务的进度详情

-- 阅读进度
POST   /api/v1/tasks/{id}/materials/{file_id}/page    上报翻页（body: {page, total_pages}）
GET    /api/v1/tasks/{id}/reading-status              我的所有材料阅读完成状态

-- 知识问答
POST   /api/v1/tasks/{id}/qa/start-session     开始问答会话（返回随机题目列表，不含答案）
POST   /api/v1/qa/submit-answer                提交单题答案（同步评分）
POST   /api/v1/qa/complete-session             完成会话（写入汇总分数）
GET    /api/v1/qa/sessions/{submission_id}     查看会话结果详情
```

### 6.8 模拟对练（WebSocket）

```
WS  /ws/roleplay/{task_id}?token={jwt}&persona_id={id}&mode=practice|assessment

-- 消息协议见第三章 3.4 节
```

### 6.9 通知

```
GET    /api/v1/notifications           通知列表（分页，未读优先）
POST   /api/v1/notifications/{id}/read 标记已读
POST   /api/v1/notifications/read-all  全部已读
GET    /api/v1/notifications/unread-count  未读数（用于角标）
```

### 6.10 审计日志

```
GET    /api/v1/audit-logs    列表（tenant_id 过滤，时间范围+操作人+操作类型筛选，分页）
```

### 6.11 企业设置

```
GET    /api/v1/settings/ai-providers          当前企业 AI Provider 配置（脱敏，不返回 key）
PUT    /api/v1/settings/ai-providers          更新 AI Provider 配置
POST   /api/v1/settings/ai-providers/test     测试 Provider 连通性
```

### 6.12 超管专属（需 role=superadmin）

```
GET    /api/v1/superadmin/tenants              企业账号列表（全量）
POST   /api/v1/superadmin/tenants              开通试用企业（写 tenant + 创建 admin 账号）
PUT    /api/v1/superadmin/tenants/{id}         更新企业信息
POST   /api/v1/superadmin/tenants/{id}/activate  转正式账号（status=active, plan=xxx）
POST   /api/v1/superadmin/tenants/{id}/suspend   暂停企业
GET    /api/v1/superadmin/prompt-templates     全局 Prompt 模板列表
GET    /api/v1/superadmin/prompt-templates/{id}  模板详情+历史版本
PUT    /api/v1/superadmin/prompt-templates/{id}  更新模板（写版本历史）
POST   /api/v1/superadmin/prompt-templates/{id}/test  沙箱测试（传入变量值，调用LLM返回输出）
GET    /api/v1/superadmin/ai-providers         全局 AI Provider 配置
PUT    /api/v1/superadmin/ai-providers         更新全局配置
GET    /api/v1/superadmin/audit-logs           全量审计日志（跨所有租户）
```

---

## 七、前端模块结构

### 7.1 Monorepo 目录

```
ai-trainer-frontend/
├── apps/
│   ├── admin/                    # 管理后台
│   │   └── src/
│   │       ├── views/            # A01-A15, SA01-SA03 页面
│   │       ├── components/       # Admin专属组件
│   │       ├── layouts/
│   │       │   └── MacLayout.vue # 侧边栏 + 主内容区骨架
│   │       ├── router/           # 路由（含超管模块守卫，role=superadmin才可访问）
│   │       ├── stores/           # Pinia（user, tenant, notifications）
│   │       └── main.ts
│   └── learning/                 # 学习端
│       └── src/
│           ├── views/            # L01-L11 页面
│           ├── components/       # 学习端专属组件
│           ├── layouts/
│           │   ├── PCLayout.vue  # PC侧边导航（≥1024px）
│           │   └── MobileLayout.vue  # 底部Tab导航（<768px）
│           ├── router/
│           ├── stores/           # Pinia（user, tasks, notifications）
│           └── main.ts
├── packages/
│   ├── design-tokens/
│   │   ├── ios-theme.css         # 学习端 CSS 变量
│   │   └── mac-theme.css         # 管理后台 CSS 变量
│   ├── ui-shared/
│   │   ├── PDFReader.vue         # PDF.js 封装，含阅读进度上报
│   │   ├── AudioRecorder.vue     # 录音组件（PTT/Toggle，iOS兼容）
│   │   ├── VoiceChatBubble.vue   # 对话气泡（含音频播放）
│   │   └── ScoreDisplay.vue      # 分数展示（动画计数+等级标签）
│   ├── api-client/               # orval 自动生成（执行 pnpm gen:api 触发）
│   │   ├── models/               # TypeScript 类型
│   │   └── services/             # 请求函数
│   └── utils/
│       ├── audio.ts              # 音频格式检测/Base64转换
│       ├── date.ts               # 日期格式化
│       └── storage.ts            # localStorage 封装（JWT存储）
├── pnpm-workspace.yaml
├── package.json
└── turbo.json                    # Turborepo 构建缓存（可选）
```

### 7.2 路由守卫逻辑

**Admin App**：
- 未登录 → 重定向 `/login`
- 已登录但 role=trainee → 重定向（无权访问管理后台）
- 访问 `/superadmin/*` 路由 → 检查 role=superadmin，否则 403

**Learning App**：
- 未登录 → 重定向 `/login`
- 访问管理员专属路由 → 不存在（学习端无管理功能）

### 7.3 状态管理（Pinia）

```typescript
// user store
interface UserState {
  token: string | null
  refreshToken: string | null
  user: UserInfo | null
  tenant: TenantInfo | null
}

// tasks store（学习端）
interface TasksState {
  myTasks: Task[]
  currentTask: Task | null
  readingProgress: Record<string, MaterialProgress>  // file_id → progress
  activeSubmission: Submission | null
}

// roleplay store（学习端）
interface RoleplayState {
  wsConnection: WebSocket | null
  sessionId: string | null
  turns: Turn[]
  status: 'idle' | 'connecting' | 'ai_speaking' | 'user_turn' | 'processing' | 'ended'
  selectedPersona: Persona | null
}
```

---

## 八、MVP 开发阶段计划

### Phase 0：基础架构（3-5 工作日）

**后端**：
- [ ] FastAPI 项目初始化（目录结构、settings 配置管理、CORS、全局异常处理）
- [ ] Docker Compose 配置（nginx/api/celery/redis/postgres/minio 六服务）
- [ ] Alembic 初始化 + 全量 migration（所有表一次性创建）
- [ ] RLS Policy 配置 + 租户上下文中间件
- [ ] JWT 认证模块（登录/刷新/登出，refresh token Redis 黑名单）
- [ ] **审计日志中间件**（拦截 POST/PUT/DELETE，提取 action/resource 写 audit_logs）
- [ ] MinIO 集成（上传/下载/签名URL工具函数）
- [ ] Redis 集成（缓存工具类）
- [ ] Celery 配置（broker=Redis，result_backend=Redis）
- [ ] 健康检查接口 `GET /health`

**前端**：
- [ ] pnpm workspace + apps/admin + apps/learning Vite+Vue3 初始化
- [ ] packages/design-tokens 基础 CSS 变量（双主题）
- [ ] packages/api-client orval 接入（配置 OpenAPI 源路径）
- [ ] packages/ui-shared 骨架（空组件文件占位）
- [ ] packages/utils 基础工具函数

---

### Phase 1：管理后台核心（6-8 工作日）

**后端 API**：
- [ ] 用户 CRUD + 角色设置 + 用户分组 CRUD
- [ ] 文件上传/列表/删除/签名 URL
- [ ] 题库 CRUD + 题目 CRUD（含得分点 JSONB 配置）
- [ ] 角色库 CRUD（基础字段，暂无 AI 生成）
- [ ] 任务 CRUD（QA + Roleplay 两种 config 结构）
- [ ] 任务推送（解析 user_id/group_id，批量写 task_assignments + notifications）
- [ ] 任务整体进度统计 + 按用户进度 API
- [ ] 审计日志列表查询 API
- [ ] 超管：创建试用企业（写 tenant + 初始 admin 账号）

**前端（Admin App）**：
- [ ] A01 登录页 + JWT 存储 + 路由守卫
- [ ] MacLayout.vue（毛玻璃侧边栏 + 主内容区，超管专属菜单按 role 控制显示）
- [ ] A02 仪表盘（数据卡片 + 简单统计）
- [ ] A03-A04 用户管理（Table + 创建/编辑 Drawer 面板）
- [ ] A05 用户分组管理
- [ ] A06 文件库（Grid/List 切换，拖拽上传区）
- [ ] A07-A08 题库管理（列表 + 详情，含题目行内编辑）
- [ ] A09-A10 角色库管理（卡片列表 + 创建/编辑表单，含大五型人格滑块）
- [ ] A11 任务列表（Tab 切换 QA/Roleplay）
- [ ] A12 任务创建（知识问答模式完整表单）
- [ ] A13 任务创建（模拟对练模式完整表单，含角色选择）
- [ ] A14 任务详情+进度页（用户进度 Table）
- [ ] 审计日志列表页
- [ ] SA01 企业账号管理页（超管）

---

### Phase 2：学习端核心（5-7 工作日）

**后端 API**：
- [ ] 我的任务列表（按状态分组，含完成率）
- [ ] 阅读进度上报（翻页事件 → 记录 visited_pages → 判定 is_completed）
- [ ] QA 开始会话（随机抽题，按 config.question_count_practice，返回题目不含答案）
- [ ] QA 提交答案（同步 ASR+LLM 评分，返回得分+反馈+参考答案）—— 此阶段先 Mock AI 结果
- [ ] QA 完成会话（汇总总分，写 task_submission）
- [ ] 通知列表 + 已读标记 + 未读数
- [ ] 个人中心（我的信息 + 完成记录列表）

**前端（Learning App）**：
- [ ] L01 登录页（响应式，手机全屏/PC 居中卡片）
- [ ] PCLayout.vue + MobileLayout.vue 响应式切换（断点 1024px）
- [ ] L02 主页任务列表（分段控制器 + 任务卡片 Grid，截止日期警示颜色）
- [ ] L03 通知中心页
- [ ] L04 个人中心页（基础信息 + 完成统计）
- [ ] packages/ui-shared/PDFReader.vue（PDF.js 封装，翻页事件上报后端）
- [ ] L05 知识问答材料阅读页（多材料 Tab，阅读进度追踪，解锁动画）
- [ ] packages/ui-shared/AudioRecorder.vue（PTT 模式，录音波形，iOS 兼容）
- [ ] L06 知识问答练习模式（单题视图，录音提交，得分展示，折叠参考答案）
- [ ] L07 知识问答考核模式（倒计时进度条，不展示即时答案）
- [ ] L08 知识问答结果页（动画分数，各题明细可展开）

---

### Phase 3：AI 能力接入（6-8 工作日）

**AI Provider 抽象层**：
- [ ] `ai/base.py` 抽象类（LLMProvider / ASRProvider / TTSProvider）
- [ ] `ai/providers/qwen.py`（QwenLLM + QwenASR + QwenTTS，接入通义千问 API）
- [ ] `ai/providers/deepseek.py`（DeepSeekLLM，作为 LLM 备选）
- [ ] `ai/providers/doubao.py`（DoubaoASR，作为 ASR 备选）
- [ ] `ai/factory.py`（读 DB 配置，按 tenant 返回 Provider 实例，Redis 缓存5分钟）
- [ ] LLM 返回 JSON 重试逻辑（解析失败最多重试 2 次）

**Prompt 系统**：
- [ ] 5 类默认 Prompt 写入 DB 的 init 脚本
- [ ] Prompt 渲染器（变量替换 + 最大长度截断保护，防 context overflow）
- [ ] 超管 Prompt 编辑 API + 版本历史 API
- [ ] Prompt 测试沙箱 API
- [ ] SA02 Prompt 模板管理前端页面（代码编辑器 + 变量高亮 + 测试面板）

**知识问答 AI 接入**：
- [ ] QA 提交答案接口替换 Mock → 真实 ASR + LLM 评分调用
- [ ] 音频格式检测（mp4/webm 自动适配 ASR 接口）

**Celery AI 长任务**：
- [ ] `tasks/ai_tasks.py` Celery 任务：AI 生成题库（文件 → LLM → 解析写 DB）
- [ ] `tasks/ai_tasks.py` Celery 任务：AI 生成角色画像（属性 → LLM → 写 persona_card）
- [ ] 前端：题库 AI 生成入口（上传文件+配置 → 触发 Celery → 轮询状态 → 预览确认）
- [ ] 前端：角色库 AI 生成画像按钮 + 结果预览编辑

**模拟对练完整实现**：
- [ ] WebSocket 路由 + 连接管理（连接池，心跳30秒）
- [ ] 对话 session 状态机（connecting/ready/user_turn/processing/ended）
- [ ] 开场白生成（LLM+TTS，存 MinIO，发 audio_url）
- [ ] 对话轮次处理（ASR→LLM→TTS 串行，发送消息到前端）
- [ ] AI 结束信号检测 + 最终评分触发
- [ ] `packages/ui-shared/VoiceChatBubble.vue` 对话气泡组件
- [ ] L09 角色选择+任务介绍页（横滑角色卡，画像展开面板）
- [ ] L10 对话界面（WebSocket 连接，状态机驱动 UI，录音按钮，消息列表自动滚动）
- [ ] L11 评分结果页（多维度雷达图/进度条，示范话术对比，对话回顾）

---

### Phase 4：MVP 收尾 & 部署（3-4 工作日）

- [ ] **任务结果导出**：openpyxl 生成 Excel（用户/模式/得分/完成时间/AI反馈摘要/各题明细），存 MinIO 后返回签名 URL
- [ ] SA03 超管 AI Provider 全局配置页（含连通性测试）
- [ ] A15 企业设置页（基础信息 + AI Provider 配置）
- [ ] 个人中心完善（头像上传 + 完成任务历史详情查看）
- [ ] iOS Safari 兼容测试（audio/mp4，getUserMedia，长按录音）
- [ ] Nginx 生产配置（gzip/HTTPS 证书/WebSocket proxy_pass upgrade）
- [ ] 生产 Docker Compose 整理（`.env.example` 模板）
- [ ] 并发压测：10 并发 WebSocket 对练会话（使用 locust 或 k6）
- [ ] 部署文档（服务器初始化步骤 + 首次部署 checklist）

---

## 九、部署架构

### 9.1 MVP 单机部署

**推荐服务器**：4核8G内存，50GB SSD，100Mbps 带宽（阿里云/腾讯云标准规格）

```yaml
# docker-compose.yml 服务拓扑
services:
  nginx:      # 80/443，反向代理 + 静态资源服务
  api:        # FastAPI，Gunicorn 启动 2 个 Uvicorn worker
  celery:     # Celery worker，concurrency=4，负责 AI 长任务
  redis:      # 6379，appendonly yes 持久化
  postgres:   # 5432，数据 volume 挂载到 /data/postgres
  minio:      # 9000(API)/9001(Console)，数据挂载到 /data/minio
```

```nginx
# Nginx 路由规则
server {
    listen 443 ssl;
    
    location /api/v1/     { proxy_pass http://api:8000; }
    location /ws/         {
        proxy_pass http://api:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    location /admin/      { root /var/www; try_files $uri /admin/index.html; }
    location /             { root /var/www; try_files $uri /app/index.html; }
}
```

### 9.2 规模化扩展路径

```
阶段1：垂直扩展（升配至 8核16G）
阶段2：Celery 独立服务器 + PostgreSQL 主从读写分离
阶段3：FastAPI 多实例 + Nginx 负载均衡
        └── WebSocket 路由问题：Nginx sticky session 或 Redis Pub/Sub（按 session_id 路由）
阶段4：K8s + 阿里云 RDS（PostgreSQL）+ 阿里云 OSS（替换 MinIO）
```

---

## 十、关键技术风险与应对方案

| 风险 | 具体问题 | 应对方案 |
|---|---|---|
| iOS Safari 兼容 | MediaRecorder 格式限制，长按触发系统菜单 | 优先 audio/mp4，按钮加 `user-select:none` + `preventDefault` |
| LLM 返回非 JSON | 评分结果解析失败 | Prompt 强制要求 JSON，失败重试 2 次，均失败返回 503 + 提示重试 |
| TTS 延迟过高 | 首字延迟导致对话停顿感 | MVP 全量生成后返回；M2 升级流式 TTS 分块播放 |
| ASR 识别率低 | 方言/口音/背景噪音 | 前端提示使用普通话，后续引入多模型兜底；允许用户重录 |
| Celery 任务堆积 | AI 生成题库慢时任务积压 | 设置任务超时 5min，死信队列告警，前端展示排队状态 |
| WebSocket 断线 | 网络抖动导致对练中断 | 客户端指数退避重连（1/2/4/8/16秒），服务端会话状态存 Redis，重连可续 |
| 大文件上传 | 视频50MB以内，网络不稳定时超时 | MinIO Multipart 分片上传，前端断点续传，进度条展示 |
| 跨租户数据泄漏 | RLS 配置错误 | 单元测试强制覆盖跨租户隔离用例，CI 自动运行 |
| API Key 泄漏 | ai_provider_configs 存储 API Key | AES-256 加密存储，读取时解密，日志不输出 key 字段 |

---

## 十一、后续版本路线图

| 版本 | 主要内容 |
|---|---|
| M2 | 方案试讲模式（录音+AI评分）+ 流式 WebSocket ASR（降语音延迟）+ 完整 RBAC 权限配置 + 数据分析仪表盘 |
| M3 | 支付接入（支付宝/微信支付）+ 独立部署 License 机制 + i18n 中英双语 + 勋章/成就体系 |
| M4 | 短信通知（增值服务）+ 视频评分（方案试讲模式）+ 虚拟角色音色配置 + 打断式语音对话 |
| M5 | 学习路径推荐（AI 个性化）+ 企业数据大屏 + 移动端 App（React Native 或 Flutter）|
