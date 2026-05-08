# AI 陪练平台 · 生产部署文档

> 版本：v1.0-trial | 适用场景：单机独立部署（standalone 模式）  
> 服务器推荐：4 核 8G 内存，50GB SSD，100Mbps 带宽（阿里云/腾讯云标准规格）

---

## 一、多客户试用说明

### 当前架构是否支持多家客户同时试用？

**结论：支持，但有前提条件。**

当前部署模式为 `standalone`（单租户），适合**单家客户独立部署一套**。如果需要同时服务多家客户，有两种方案：

| 方案 | 说明 | 适用场景 |
|---|---|---|
| **方案 A（推荐）：分实例部署** | 每家客户部署一套独立的服务（不同端口或不同子域名），数据库完全隔离 | ≤5 家试用客户，最简单可靠 |
| **方案 B：多租户 SaaS** | 单套服务，通过 `tenant_id` 隔离数据，需切换至 `DEPLOYMENT_MODE=saas` 并完善 RLS 逻辑 | 需额外开发，暂不建议在试用阶段使用 |

**方案 A 具体做法**：在同一台服务器上，每家客户分配独立端口：

```
客户 A：后端 8001 → admin 前端 /clientA/admin → 学员端 /clientA
客户 B：后端 8002 → admin 前端 /clientB/admin → 学员端 /clientB
每个实例有自己的 .env 和独立的 MySQL 数据库（db_clientA、db_clientB）
```

Nginx 按路径前缀路由即可，几乎不需要额外开发。

---

## 二、部署前准备

### 2.1 服务器环境

```bash
# Ubuntu 22.04 LTS 推荐
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y git curl wget unzip nginx mysql-server python3.11 python3.11-venv nodejs npm

# 安装 pnpm
npm install -g pnpm

# 配置 MySQL（首次）
sudo mysql_secure_installation
```

### 2.2 MySQL 数据库初始化

```sql
-- 以 root 登录 MySQL
mysql -u root -p

-- 创建数据库（每个客户一个库）
CREATE DATABASE ai_trainer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用账号（勿直接用 root）
CREATE USER 'aitrainer'@'localhost' IDENTIFIED BY '强密码请替换';
GRANT ALL PRIVILEGES ON ai_trainer.* TO 'aitrainer'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.3 拉取代码

```bash
# 建议放 /opt 目录
sudo mkdir -p /opt/ai-trainer
sudo chown $USER:$USER /opt/ai-trainer
cd /opt/ai-trainer

git clone <你的代码仓库地址> .
# 或直接上传压缩包后解压
```

---

## 三、后端部署

### 3.1 创建 Python 虚拟环境

```bash
cd /opt/ai-trainer/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3.2 配置生产环境 .env

```bash
cp .env.example .env   # 如无 example 则手动创建
nano .env
```

**生产 .env 完整配置模板：**

```env
# ── 部署模式 ────────────────────────────────────────────────
DEPLOYMENT_MODE=standalone

# ── 安全 ────────────────────────────────────────────────────
# 必须修改！生成方式：python3 -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=在这里填入随机生成的64位hex字符串
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# ── 数据库（MySQL 生产配置）────────────────────────────────
DATABASE_URL=mysql+aiomysql://aitrainer:强密码请替换@127.0.0.1:3306/ai_trainer?charset=utf8mb4

# ── 文件存储（本地磁盘，生产环境建议挂载数据盘）────────────
UPLOAD_DIR=/opt/ai-trainer/data/uploads

# ── LLM - 阿里云通义千问 ────────────────────────────────────
LLM_PROVIDER=qwen
QWEN_API_KEY=你的Qwen API Key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-plus

# ── ASR - 豆包语音识别 ──────────────────────────────────────
ASR_PROVIDER=doubao
DOUBAO_APP_ID=你的APP_ID
DOUBAO_ACCESS_KEY=你的ACCESS_KEY
DOUBAO_SECRET_KEY=你的SECRET_KEY

# ── TTS - MiniMax 语音合成 ──────────────────────────────────
TTS_PROVIDER=minimax
MINIMAX_API_KEY=你的MiniMax API Key
# 如暂不使用 MiniMax，可改为浏览器合成（无需 API Key）：
# TTS_PROVIDER=browser

# ── CORS（填写实际域名或 IP）────────────────────────────────
# 多个域名用逗号分隔
CORS_ORIGINS=https://你的域名.com,https://admin.你的域名.com
```

> ⚠️ **安全注意事项：**  
> - `.env` 文件权限设为 600：`chmod 600 .env`  
> - 不要把 `.env` 提交到 git  
> - `SECRET_KEY` 一旦上线不要再改（改了会导致所有用户 token 失效）

### 3.3 创建上传目录

```bash
mkdir -p /opt/ai-trainer/data/uploads
```

### 3.4 初始化数据库（自动建表）

```bash
cd /opt/ai-trainer/backend
source venv/bin/activate

# 启动一次后立即停止，create_all 会自动建表
python3 -c "
import asyncio
from app.db.database import init_db
asyncio.run(init_db())
print('数据库初始化完成')
"
```

### 3.5 创建超级管理员账号

```bash
python3 -c "
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
import uuid

async def create_admin():
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine)
    async with Session() as db:
        admin = User(
            id=str(uuid.uuid4()),
            username='admin',
            password_hash=hash_password('初始密码请修改'),
            role='superadmin',
            display_name='超级管理员',
            is_active=True,
        )
        db.add(admin)
        await db.commit()
    print('超管账号创建完成，用户名: admin')
    await engine.dispose()

asyncio.run(create_admin())
"
```

### 3.6 配置 systemd 服务（开机自启）

```bash
sudo nano /etc/systemd/system/ai-trainer-api.service
```

```ini
[Unit]
Description=AI Trainer Backend API
After=network.target mysql.service

[Service]
User=ubuntu
WorkingDirectory=/opt/ai-trainer/backend
Environment="PATH=/opt/ai-trainer/backend/venv/bin"
ExecStart=/opt/ai-trainer/backend/venv/bin/uvicorn app.main:app \
    --host 127.0.0.1 \
    --port 8000 \
    --workers 2 \
    --log-level info
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-trainer-api
sudo systemctl start ai-trainer-api

# 查看状态
sudo systemctl status ai-trainer-api
# 查看日志
sudo journalctl -u ai-trainer-api -f
```

---

## 四、前端部署

### 4.1 构建管理后台

```bash
cd /opt/ai-trainer/admin

# 配置生产环境 API 地址
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://你的域名.com/api/v1
EOF

pnpm install
pnpm build
# 构建产物在 dist/ 目录
```

### 4.2 构建学员端

```bash
cd /opt/ai-trainer/learning

cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://你的域名.com/api/v1
EOF

pnpm install
pnpm build
# 构建产物在 dist/ 目录
```

### 4.3 部署静态文件

```bash
sudo mkdir -p /var/www/ai-trainer/admin
sudo mkdir -p /var/www/ai-trainer/app

sudo cp -r /opt/ai-trainer/admin/dist/* /var/www/ai-trainer/admin/
sudo cp -r /opt/ai-trainer/learning/dist/* /var/www/ai-trainer/app/
```

---

## 五、Nginx 配置

### 5.1 申请 SSL 证书（Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com -d admin.你的域名.com
```

### 5.2 Nginx 站点配置

```bash
sudo nano /etc/nginx/sites-available/ai-trainer
```

```nginx
# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name 你的域名.com admin.你的域名.com;
    return 301 https://$host$request_uri;
}

# 学员端
server {
    listen 443 ssl http2;
    server_name 你的域名.com;

    ssl_certificate     /etc/letsencrypt/live/你的域名.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/你的域名.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1024;

    # 静态文件（学员端 Vue SPA）
    location / {
        root /var/www/ai-trainer/app;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # 静态资源强缓存
    location ~* \.(js|css|png|jpg|woff2|woff)$ {
        root /var/www/ai-trainer/app;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # API 反向代理
    location /api/v1/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;     # AI 处理需要较长时间
        proxy_send_timeout 180s;
        client_max_body_size 100M;   # 允许大文件上传（PDF、音频）
    }

    # WebSocket（模拟对练）
    location /api/v1/ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;    # WebSocket 长连接保持 1 小时
    }
}

# 管理后台
server {
    listen 443 ssl http2;
    server_name admin.你的域名.com;

    ssl_certificate     /etc/letsencrypt/live/你的域名.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/你的域名.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        root /var/www/ai-trainer/admin;
        try_files $uri $uri/ /index.html;
        expires 1h;
    }

    location ~* \.(js|css|png|jpg|woff2)$ {
        root /var/www/ai-trainer/admin;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 同一套后端 API
    location /api/v1/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
        client_max_body_size 100M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ai-trainer /etc/nginx/sites-enabled/
sudo nginx -t        # 检查配置语法
sudo systemctl reload nginx
```

---

## 六、首次部署检查清单

```
□ 服务器防火墙开放 80、443 端口（22 仅限指定 IP）
□ MySQL 已启动，数据库和账号已创建
□ .env 中 SECRET_KEY 已替换为随机值
□ .env 中 DATABASE_URL 指向 MySQL（非 SQLite）
□ .env 中所有 API Key 已填写（Qwen / Doubao / MiniMax）
□ UPLOAD_DIR 目录已创建且有写入权限
□ 数据库表已初始化（init_db）
□ 超管账号已创建
□ 后端 systemd 服务已启动（status: active）
□ 前端已 build 并复制到 /var/www/
□ Nginx 配置无报错（nginx -t 通过）
□ SSL 证书已申请并生效
□ 访问 https://你的域名.com 能打开学员端
□ 访问 https://admin.你的域名.com 能打开管理后台
□ 用超管账号登录管理后台，创建一个测试任务验证全流程
```

---

## 七、日常运维

### 更新代码

```bash
cd /opt/ai-trainer
git pull   # 或重新上传

# 后端依赖有变更时
cd backend && source venv/bin/activate && pip install -r requirements.txt

# 重启后端服务
sudo systemctl restart ai-trainer-api

# 前端有变更时重新 build 并覆盖
cd admin && pnpm build && sudo cp -r dist/* /var/www/ai-trainer/admin/
cd learning && pnpm build && sudo cp -r dist/* /var/www/ai-trainer/app/
```

### 查看日志

```bash
# 后端实时日志
sudo journalctl -u ai-trainer-api -f

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 数据库备份（建议每日定时）

```bash
# 手动备份
mysqldump -u aitrainer -p ai_trainer > /opt/backups/ai_trainer_$(date +%Y%m%d).sql

# 设置每日凌晨 2 点自动备份
crontab -e
# 添加：
0 2 * * * mysqldump -u aitrainer -p'密码' ai_trainer > /opt/backups/ai_trainer_$(date +\%Y\%m\%d).sql
```

### 系统健康检测（doctor）

项目内置 `scripts/doctor.py` 健康检测工具，**建议每次更新代码后、以及出现异常时运行**。

```bash
cd /opt/ai-trainer
source backend/venv/bin/activate

# 基础检测（环境变量 + 数据库连通 + 数据完整性）
python scripts/doctor.py

# 附加 AI 三方服务连通性（Qwen / MiniMax / Doubao）
python scripts/doctor.py --ai

# 全量检测 + 自动修复可修复问题（推荐每次更新后运行）
python scripts/doctor.py --all

# 仅输出警告和错误（适合写入 crontab 日志）
python scripts/doctor.py --quiet
```

**doctor 检测范围：**

| 层级 | 检测项 | 自动修复 |
|------|--------|---------|
| Layer 1 环境 | 必填环境变量是否配置、uploads 目录是否存在 | ✓ 可创建缺失目录 |
| Layer 2 数据库 | 数据库连通性、核心表是否存在 | — |
| Layer 3 AI 服务 | Qwen / MiniMax TTS / Doubao ASR 接口实测 | — |
| Layer 4 数据 | 卡住的提交记录（>2h in_progress）、评分完整性、文件孤岛 | ✓ 可标记 expired |

**退出码：** `0` = 全部正常，`1` = 有警告，`2` = 有失败（可用于 CI/CD 或监控脚本判断）。

> 提示：数据库连通检测需要在 venv 中执行（依赖 `aiosqlite` 或 `aiomysql`）。直接用系统 Python 运行时 Layer 2 会跳过。

### 多客户实例管理（方案 A）

```bash
# 第二家客户，复制一套配置，改端口和数据库名
sudo cp /etc/systemd/system/ai-trainer-api.service /etc/systemd/system/ai-trainer-api-clientb.service

# 修改 ClientB 的服务：
#   WorkingDirectory=/opt/ai-trainer-clientb/backend
#   ExecStart=... --port 8001  （换端口）

# 在 Nginx 里为 ClientB 添加新的 server block 或 location 块
```

---

## 八、生产环境待配置项（按优先级）

> 以下项目当前版本已简化处理，在试用阶段基本不影响功能。
> 按重要性排序，建议在 v1.1 正式版前逐步补齐。

### 🔴 P0 — 上线前必须确认

| 项目 | 当前状态 | 操作 |
|---|---|---|
| **SECRET_KEY 安全化** | 代码默认值 `changeme` | 必须在 .env 中替换为随机 64 位字符串 |
| **MySQL 替代 SQLite** | .env 中默认仍是 SQLite | 按本文第三章修改 DATABASE_URL |
| **UPLOAD_DIR 数据盘挂载** | 默认 `./uploads` 在代码目录 | 生产建议指向独立数据盘，防止系统盘满 |
| **CORS_ORIGINS 收紧** | 开发时配了大量 localhost | 仅填写实际部署域名 |

### 🟠 P1 — 上线后 1 周内补齐

| 项目 | 当前状态 | 影响 | 建议操作 |
|---|---|---|---|
| **文件存储 → 阿里云 OSS** | 本地磁盘存储 | 服务器重装/迁移会丢失上传文件 | 接入 OSS SDK，配置 Bucket，UPLOAD_DIR 改为 OSS 路径 |
| **Redis 缓存层** | 未接入 | AI Provider 配置每次都查数据库；无法做 JWT 黑名单（登出后 token 仍有效至过期） | 安装 Redis，接入 aioredis，实现 JWT 黑名单 |
| **数据库定时备份** | 无自动备份 | 数据丢失风险 | 设置 crontab 每日备份到独立目录或 OSS |
| **Nginx 上传大小限制** | 默认 1MB | PDF/音频上传会失败 | 已在本文配置 `client_max_body_size 100M`，确认已生效 |

### 🟡 P2 — v1.1 版本完善

| 项目 | 当前状态 | 影响 | 建议操作 |
|---|---|---|---|
| **Celery + Redis 异步队列** | AI 生成题库/画像为同步调用，阻塞请求 | 大文件生成时接口可能超时（>60s） | 接入 Celery，将 AI 长任务移至后台，前端轮询进度 |
| **JWT Refresh Token 黑名单** | 登出后 refresh token 未失效 | 安全性缺口（低风险，token 7 天过期） | 依赖 Redis，P1 完成后一起做 |
| **MinIO 对象存储**（替代本地磁盘） | 本地磁盘 | 不支持多实例水平扩展 | 如果需要横向扩展则必须迁移 |
| **Alembic 数据库迁移** | 使用 `create_all` 建表 | 字段变更无版本管理，升级时可能出问题 | 初始化一个 Alembic baseline，之后字段变更用 migration |
| **用户分组管理** | 后端表结构已有，前端无独立页面 | 任务只能按用户维度推送 | 补充管理后台用户分组页面 |

### 🟢 P3 — v1.2 及以后

| 项目 | 当前状态 | 说明 |
|---|---|---|
| **多租户 SaaS 模式** | standalone 单租户 | 需实现 PostgreSQL RLS + 租户中间件，切换 `DEPLOYMENT_MODE=saas` |
| **Avatar 头像上传** | 仅字母头像 | 需要文件上传接口 + 用户表 avatar_url 字段 |
| **Prompt 沙箱测试功能** | 编辑已实现，测试沙箱未实现 | 超管可在后台编辑 Prompt 但无法在线测试效果，需手动验证 |
| **AI Provider 管理页面（SA03）** | 通过 SystemConfig 管理 | 支持按企业配置不同的 LLM/ASR/TTS |
| **iOS Safari 专项测试** | 未系统覆盖 | 重点：长按录音、MediaRecorder 格式兼容 |
| **并发压测** | 未做 | 建议 10 并发 WebSocket 场景测试 |
| **服务器监控告警** | 无 | 推荐：阿里云云监控 或 Uptime Robot（免费） |

---

## 九、未完成的开发计划（后续版本）

> 以下功能已在 `dev-plan.md` 中完整设计，当前版本因优先级或工程量原因未实现，留待后续版本迭代。

### M2（下一个主版本）

- **流式 WebSocket ASR**：当前方案为录音完成后整段上传，AI 响应延迟 3-8 秒。M2 接入流式 ASR（如阿里云实时语音识别），延迟降至 1-3 秒，前端对话体验大幅提升。WebSocket 连接框架已在 MVP 中建立，服务端增加 streaming 分支即可。
- **方案试讲模式（第三种任务类型）**：学员录制一段讲解视频/音频，AI 从内容完整度、语言表达、逻辑结构等维度评分并给出改进建议。
- **数据分析仪表盘**：管理后台增加可视化图表（完成率趋势、得分分布、各维度能力雷达汇总等）。
- **完整 RBAC 权限系统**：当前为固定三级角色（超管/管理员/学员），M2 支持自定义角色和细粒度权限配置。
- **用户分组管理前端页面**：后端数据库表已有，补充管理后台的分组 CRUD 页面，支持任务按分组批量推送。

### M3

- **支付接入**：支付宝 / 微信支付，支持按账号数或按月订阅计费。
- **独立部署 License 机制**：客户私有化部署时的授权校验（机器码绑定 + 在线激活）。
- **i18n 国际化**：中英双语切换，代码中预留了 i18n 框架接入点。
- **勋章 / 成就体系**：学员连续学习、首次满分等行为触发成就，提升学习激励。
- **Prompt 沙箱测试**：超管后台 Prompt 编辑已实现，补充在线沙箱测试功能（传入变量值，实时调用 LLM 查看输出结果）。

### M4

- **短信通知**：任务到期提醒、考核成绩通知，接入阿里云短信 SDK。
- **打断式语音对话**：AI 说话期间用户可以打断，更接近真实对话体验。
- **视频评分**（方案试讲进阶）：上传视频，AI 分析表情、仪态、语速等非语言维度。

> 注：虚拟角色专属 TTS 音色配置已在当前版本实现（persona voice_id 字段 + 管理后台角色编辑页面）。

### M5

- **AI 个性化学习路径推荐**：根据历史得分和薄弱维度，推荐下一步学习任务。
- **企业数据大屏**：部门 / 团队维度的学习情况可视化展示。
- **移动端 App**：React Native 或 Flutter 原生 App，提升移动端录音体验和离线能力。
- **多租户 SaaS 完整实现**：PostgreSQL + RLS 多租户隔离，支持超管一键开通/暂停/转正企业账号。
