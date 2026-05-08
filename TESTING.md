# AI Trainer 本地测试指引

## 启动服务

```bash
cd ~/Desktop/ai-trainer-project
./start.sh
```

`start.sh` 会自动清理旧进程，依次启动后端、管理后台、学员端。`Ctrl+C` 一键停止全部。

---

## 访问地址

### PC 端

| 服务 | 地址 |
|------|------|
| 后端 API | http://127.0.0.1:8000 |
| API 文档 (Swagger) | http://127.0.0.1:8000/docs |
| 管理后台 | http://localhost:5173 |
| 学员端 | http://localhost:5179 |

### 手机端

电脑和手机需在同一 WiFi 下，把 `localhost` 换成当前 LAN IP：

| 服务 | 地址 |
|------|------|
| 管理后台 | http://192.168.8.205:5173 |
| 学员端 | http://192.168.8.205:5179 |

> 如果 LAN IP 变了，运行 `ipconfig getifaddr en0` 查看当前 IP。

---

## 测试账号

| 用途 | 用户名 | 密码 | 角色 |
|------|--------|------|------|
| 管理后台（最高权限） | `admin` | `admin123` | superadmin |
| 管理后台（企业视角） | `ceshi` | `ceshi123` | admin |
| 管理后台（企业视角） | `enterprise` | `123456` | admin |
| 学员端 | `lucky` | `lucky123` | learner |

> 以上密码已于 2026-05-06 逐一通过 API 验证，全部可用。

---

## 手机端注意事项

1. **录音功能**：手机浏览器需 HTTPS 或 localhost 才能使用麦克风。通过 `http://192.168.x.x` 访问属于不安全上下文，录音不可用。
   - 对策：角色对练中切换到「文字输入」模式
   - QA 答题：PC 端完成录音类题目

2. **TTS 语音**：AI 角色对话现已接入 MiniMax TTS，男声。如果听不到声音，检查右上角喇叭按钮是否开启。

---

## 当前技术状态

| 模块 | 状态 |
|------|------|
| LLM (Qwen) | 正常 |
| ASR (豆包) | 正常 |
| TTS (MiniMax) | 正常，男声 `male-qn-qingse` |
| 角色对练 WebSocket | 正常，五状态机 |
| QA 问答 | 正常 |

---

## 常见问题

**Q: 管理后台 http://127.0.0.1:5173 打不开？**
用 `http://localhost:5173`。如果还不行，检查是否运行了 `./start.sh`。

**Q: 学员端登录报错？**
确认用的账号是 `lucky`（不是 admin），密码 `lucky123`。

**Q: 手机无法访问？**
检查手机和电脑是否在同一 WiFi，IP 是否正确（运行 `ipconfig getifaddr en0` 确认）。
