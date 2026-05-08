# AI陪练 MVP 试用版 · 执行方案

> 配套文档：`/Users/leckyhuang/.claude/plans/users-leckyhuang-desktop-ai-trainer-pro-dynamic-wombat.md`（问题评估报告）

## 总体节奏

| 阶段 | 目标 | 预估工时 |
|------|------|---------|
| 阶段一 | P0 安全 + 部署配置改造 | 1.5 天 |
| 阶段二 | P1 体验完善（PC响应式 / TTS / 导出） | 2.5 天 |
| 阶段三 | 服务器部署上线 + 验证 | 1 天 |
| 阶段四 | P2 优化（试用期内渐进推进） | 按需 |
| 阶段五 | 商用前架构升级（独立周期） | 后续规划 |

---

# 阶段一 · P0 安全修复 + 部署配置改造

## 1.1 API 密钥安全处理

**前提**：当前 `backend/.env` 中的密钥已暴露，必须视为已泄露。

**步骤**：
1. **立即去三家平台轮换密钥**：
   - 阿里云 DashScope 控制台 → 重新生成 QWEN_API_KEY
   - 火山引擎语音 → 重新生成 DOUBAO_ACCESS_KEY / SECRET_KEY
   - MiniMax 平台 → 重新生成 MINIMAX_API_KEY
   - 旧密钥立即删除/禁用

2. **改造 `.env` 管理**：
   - 在 `backend/` 下新建 `.env.example`（模板，无真实值）：
     ```
     SECRET_KEY=<run: openssl rand -hex 32>
     DEFAULT_ADMIN_USERNAME=admin
     DEFAULT_ADMIN_PASSWORD=<set-on-deploy>
     DATABASE_URL=sqlite+aiosqlite:///./data/ai_trainer.db
     QWEN_API_KEY=
     DOUBAO_APP_ID=
     DOUBAO_ACCESS_KEY=
     DOUBAO_SECRET_KEY=
     MINIMAX_API_KEY=
     CORS_ORIGINS=https://your-domain.com
     ```
   - 项目根目录创建/修改 `.gitignore`，加入：
     ```
     backend/.env
     backend/data/
     backend/uploads/
     backend/logs/
     ```
   - 本地 `backend/.env` 不再上传到任何代码仓库；服务器 `.env` 由部署时单独 scp 上传

3. **验证**：`grep -r "sk-15aacf" .` 确认无残留旧密钥

---

## 1.2 默认超管密码改造

**目标**：去除硬编码密码，由部署时通过环境变量指定。

**改造文件**：`backend/app/main.py`

**修改要点**（`init_db` 函数 / startup 事件中）：
- 读取 `os.environ.get("DEFAULT_ADMIN_PASSWORD")`
- 如未设置：启动时生成 16 位随机密码，写入 `backend/data/INITIAL_ADMIN_PASSWORD.txt` 并打印到控制台
- 文件权限设置为 600
- `.gitignore` 中加入 `INITIAL_ADMIN_PASSWORD.txt`

**配套**：在 `core/config.py` 增加 `default_admin_password: Optional[str] = None`

---

## 1.3 越权访问修复

**改造文件**：`backend/app/api/v1/endpoints/roleplay_ws.py`（约 267 行处的 `get_session`）

**修改逻辑**：
```python
# 当前：仅 decode_token 验证
# 改为：取出 user_id 后，校验 submission 归属
payload = decode_token(token)
current_user_id = payload["sub"]
current_role = payload.get("role")

submission = await db.get(TaskSubmission, submission_id)
if submission.user_id != current_user_id and current_role not in ("admin", "superadmin"):
    raise HTTPException(403, "无权限访问该会话")
```

**同样需检查的其他 GET endpoint**：
- `backend/app/api/v1/endpoints/qa.py`：`GET /sessions/{submission_id}`（同模式修复）
- `backend/app/api/v1/endpoints/files.py`：`GET /{file_id}/download`（确认是否有归属概念，文件库默认所有员工可读，可酌情）

---

## 1.4 部署配置改造（前后端 baseURL + CORS）

### 后端

**改造**：`backend/app/core/config.py` 已支持 CORS_ORIGINS 从 .env 读取，无需改代码，只需部署时设置：
```
CORS_ORIGINS=https://your-domain.com,https://your-domain.com/admin
```

### Learning 前端

**改造**：`learning/.env.production`（新建）
```
VITE_API_BASE_URL=/api/v1
```

确认 `learning/src/api/index.ts` 中：
- baseURL 从 `import.meta.env.VITE_API_BASE_URL` 读取（已是）
- WebSocket 地址构造：roleplay 使用 `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/v1/ws/roleplay/...`
- **若当前代码 WS 地址是硬编码 `ws://192.168...`，需要改为相对协议 + 当前 host**

### Admin 前端

**改造**：`admin/.env.production`（新建）
```
VITE_API_BASE_URL=/api/v1
```

构建命令：`pnpm build --mode production`（或 npm run build）

### 验证标准
- 本地 `pnpm dev` 不受影响（仍走 `.env` 的 192.168.1.207）
- `pnpm build` 后 `dist/` 中查找应无任何 `127.0.0.1` 或 `192.168.1.207` 字符串

---

# 阶段二 · P1 体验完善

## 2.1 学员端 PC 响应式适配（7 个页面）

**统一模式**（参照 `learning/src/views/HomeView.vue`）：

```vue
<script setup>
const windowWidth = ref(window.innerWidth)
const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div v-if="isPC"><!-- PC 布局 --></div>
  <div v-else><!-- 移动端布局（保留原 page-container） --></div>
</template>
```

**逐页改造方案**：

| 页面 | PC 布局要点 |
|------|-----------|
| `TaskDetailView.vue` | 顶部任务 hero 卡片宽度限制 960px 居中；下方"学习材料"和"角色列表"用 2 列 grid；操作按钮区固定在右侧 |
| `NotificationsView.vue` | 列表宽度限 720px 居中；每条通知左右布局（左侧图标+标题+正文，右侧时间）|
| `ProfileView.vue` | 顶部卡片+下方信息分两栏；账号信息和操作分组卡片化 |
| `QaResultView.vue` | 总分大卡片置顶，下方答题详情用 2 列网格；每题展开显示 ASR文本/参考答案/AI反馈 |
| `RoleplayResultView.vue` | 左侧总分+四维评分雷达，右侧对话回放和讲师评语 |
| `RoleSelectView.vue` | persona 卡片用 3 列 grid 展示，每张卡片显示头像/姓名/行业/性格简介 |
| `PdfReaderView.vue` | 中间 PDF 区域宽度 800px 居中；左侧固定目录/进度，右侧固定页码控制 |

**复用样式**：`learning/src/style.css` 已有 `.pc-content-title`, `.pc-stat-card`, `.pc-section-header` 等类，可直接借用。如需新增 PC 专用类，统一加在该文件 PC 媒体查询段。

**估时**：每页 0.3-0.5 天 × 7 = 约 2.5-3.5 天，可由助手协助快速产出后人工微调。

---

## 2.2 角色对练 TTS 集成

**目标**：AI 回复同时返回文本 + 音频 URL，前端自动播放。

**后端改造**：`backend/app/api/v1/endpoints/roleplay_ws.py`

```python
# 在 LLM 生成 AI 回复后，调用 TTS
ai_text = llm_response  # 已有
ai_audio_bytes = await tts_service.synthesize(ai_text)  # 新增

# 保存为临时文件并生成访问 URL
audio_filename = f"tts_{uuid4().hex}.mp3"
audio_path = Path(settings.upload_dir) / "tts" / audio_filename
audio_path.parent.mkdir(parents=True, exist_ok=True)
audio_path.write_bytes(ai_audio_bytes)
audio_url = f"/api/v1/files/tts/{audio_filename}"  # 或现有 file 体系

# WS 推送
await websocket.send_json({
    "type": "ai_response",
    "text": ai_text,
    "audio_url": audio_url
})
```

**新增文件路由**：在 `files.py` 增加一个 `GET /tts/{filename}` 公开访问端点（或加 token），返回 mp3。

**前端改造**：`learning/src/views/RoleplayView.vue`
- 收到 `ai_response` 后，若含 `audio_url`，使用 `new Audio(url)` 播放
- 增加播放/重播控件
- 用户可在设置中开关"语音朗读"

**性能注意**：TTS 调用约 2-4s 延迟。建议：
- TTS 与 LLM 完成后**先发文本**，音频准备好后再发 audio_url 增量消息
- 或显示"正在合成语音..."状态

**清理机制**：定时清理 `uploads/tts/` 下 24 小时前的文件（可加 startup 任务）

---

## 2.3 Excel 导出

**新增依赖**：`backend/requirements.txt` 加入 `openpyxl==3.1.5`

**新增 endpoint**：`backend/app/api/v1/endpoints/tasks.py`

```python
@router.get("/{task_id}/export")
async def export_task_results(task_id: str, db, _admin):
    # 1. 查询 task + 所有 submissions + 所有 answers + 所有 roleplay_sessions
    # 2. 构建 openpyxl Workbook，三张 sheet：
    #    - Sheet1 "学员汇总"：用户名 | 部门 | 状态 | 总分 | 完成时间
    #    - Sheet2 "QA详情"：用户 | 题目 | ASR文本 | 得分 | AI反馈
    #    - Sheet3 "对练详情"：用户 | 角色 | 轮次 | 总分 | 四维分 | 评价摘要
    # 3. wb.save 到 BytesIO，StreamingResponse 返回
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="task_{task_id}.xlsx"'}
    )
```

**前端**：`admin/src/views/TaskDetailView.vue` 添加"导出成绩"按钮，点击触发 `window.open(api.tasks.exportUrl(taskId, token))`。

---

# 阶段三 · 服务器部署上线

## 目录规划

```
/var/www/learning/         ← 学员端静态文件
/var/www/admin/            ← 管理后台静态文件
/opt/ai-trainer/backend/   ← FastAPI 代码
/opt/ai-trainer/backend/data/    ← SQLite db
/opt/ai-trainer/backend/uploads/ ← 上传文件
/etc/nginx/sites-enabled/ai-trainer
/etc/systemd/system/ai-trainer-api.service
```

## 部署步骤

### 一、服务器环境准备（一次性）

```bash
# Ubuntu 22.04 假设
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip nginx ffmpeg certbot python3-certbot-nginx
```

### 二、后端部署

```bash
# 1. 上传代码（FTP/scp 均可）
scp -r backend/ user@server:/opt/ai-trainer/

# 2. 创建虚拟环境与依赖
ssh user@server
cd /opt/ai-trainer/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. 创建生产 .env（重要：手动填入轮换后的密钥）
nano .env
# 内容参考 .env.example，填入真实值

# 4. 初始化目录
mkdir -p data uploads logs uploads/tts
chmod 700 data
```

### 三、systemd 服务

`/etc/systemd/system/ai-trainer-api.service`：
```ini
[Unit]
Description=AI Trainer FastAPI
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ai-trainer/backend
Environment="PATH=/opt/ai-trainer/backend/venv/bin"
EnvironmentFile=/opt/ai-trainer/backend/.env
ExecStart=/opt/ai-trainer/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启动：
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ai-trainer-api
sudo systemctl status ai-trainer-api
sudo journalctl -u ai-trainer-api -f  # 查看日志
```

### 四、前端构建并上传

本地：
```bash
# Learning
cd learning
pnpm install
pnpm build  # 自动读取 .env.production，输出到 dist/
scp -r dist/* user@server:/var/www/learning/

# Admin
cd ../admin
pnpm install
pnpm build
scp -r dist/* user@server:/var/www/admin/
```

### 五、Nginx 配置

`/etc/nginx/sites-enabled/ai-trainer`：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 学员端（默认根路径）
    root /var/www/learning;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 管理后台
    location /admin/ {
        alias /var/www/admin/;
        try_files $uri $uri/ /admin/index.html;
    }

    # 后端 API（含 WebSocket）
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 升级（角色对练必需）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;

        # 上传大文件
        client_max_body_size 100M;
    }
}
```

启用 + SSL：
```bash
sudo ln -s /etc/nginx/sites-available/ai-trainer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 申请 SSL 证书
sudo certbot --nginx -d your-domain.com
# 按提示完成；certbot 会自动改 Nginx 配置加 443 监听 + 80 跳转
```

### 六、上线验证清单

- [ ] `https://your-domain.com/` 可访问学员登录页
- [ ] `https://your-domain.com/admin/` 可访问管理后台登录页
- [ ] 用 `INITIAL_ADMIN_PASSWORD.txt` 中的密码登录超管成功，**立即修改密码**
- [ ] 学员端登录 → 任务列表 → PDF 阅读 → QA 答题（含语音录制 + ASR）→ 结果页
- [ ] 学员端登录 → 角色对练 → 多轮对话（含 TTS 播放）→ 结果页
- [ ] 管理后台：用户管理 / 题库 / 角色 / 任务发布 / 导出 Excel
- [ ] 浏览器 DevTools 查 Network：所有 API 请求 200，无 CORS 报错
- [ ] WebSocket 连接成功（wss 协议）

---

# 阶段四 · P2 优化（试用期渐进）

| 项 | 实施建议 | 估时 |
|---|---------|------|
| 文件下载改 Authorization header | 后端：`Depends(get_current_user)` 替代 query token；前端：用 fetch 加 header 后转 blob 下载 | 0.5 天 |
| 审计日志记 IP | 在 `deps.py` 添加获取 `request.client.host`，所有写操作 endpoint 透传到 audit log | 0.5 天 |
| AI 接口限流 | 引入 `slowapi`，给 `/qa/submit-answer` 和 `/tts/synthesize` 加 `@limiter.limit("30/minute")` per user | 0.5 天 |
| Persona 列表分页 | 加 `page` `page_size` 参数，前端兼容 | 0.3 天 |

---

# 阶段五 · 商用前架构升级（后续规划）

试用验证通过、签下首批客户前需要完成：

1. **数据库迁移**：SQLite → PostgreSQL 16
   - 初始化 alembic：`alembic init migrations`
   - 基于现有模型生成 baseline migration
   - 数据迁移脚本：`pgloader` 或自写脚本
   
2. **多租户隔离**：
   - 所有表添加 `tenant_id` 字段
   - 启用 PostgreSQL Row-Level Security
   - JWT 中加入 tenant_id claim
   - 中间件设置 `SET app.current_tenant = ?`

3. **异步任务队列**：
   - Redis + Celery 部署
   - 题目生成、Excel 导出等耗时任务改为异步
   - WebSocket 状态用 Redis Pub/Sub

4. **对象存储**：
   - 接入阿里云 OSS（或 MinIO 自建）
   - 文件上传/下载走签名 URL

5. **运维**：
   - 结构化日志（JSON 格式 + 日志聚合）
   - Sentry 错误追踪
   - 健康检查 + 监控告警
   - 数据库自动备份

---

# 立即可执行的检查清单（按时间顺序）

**Day 1 上午**：
- [ ] 阿里云/火山/MiniMax 三家平台轮换密钥
- [ ] 创建 `.gitignore`、`.env.example`
- [ ] 改造 `main.py` 默认密码逻辑
- [ ] 修复 roleplay_ws.py 和 qa.py 的越权问题

**Day 1 下午**：
- [ ] 创建前端 `.env.production`
- [ ] 检查并修复学员端 WebSocket URL 构造
- [ ] 本地 `pnpm build` 验证产物

**Day 2-4**：
- [ ] 7 个学员端页面 PC 响应式（可与 TTS 并行）
- [ ] TTS 集成到 roleplay
- [ ] Excel 导出功能

**Day 5**：
- [ ] 服务器初始化 + 上传代码
- [ ] Nginx + systemd 配置
- [ ] SSL 证书申请
- [ ] 上线验证清单全过
- [ ] 修改超管密码

**试用期**：
- [ ] 收集客户反馈
- [ ] P2 项目按反馈优先级渐进推进
