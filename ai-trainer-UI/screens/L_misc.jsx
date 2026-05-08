// L01 Login, L03 Notifications, L04 Profile, L09 Role Select, L11 Roleplay Result

function L01_Login() {
  return (
    <PhoneFrame>
      <div style={{ flex: 1, padding: '40px 28px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,122,255,0.35)', marginBottom: 14 }}>
            <Icon name="sparkles" size={36} color="white" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>AI 陪练</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>企业培训陪练平台</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 14px', background: 'white', borderRadius: 14, gap: 12 }}>
            <span style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>+86</span>
            <div style={{ width: 1, height: 22, background: 'var(--separator)' }}/>
            <span style={{ fontSize: 15, color: 'var(--text-tertiary)' }}>请输入手机号</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 14px', background: 'white', borderRadius: 14, gap: 8 }}>
            <span style={{ flex: 1, fontSize: 15, letterSpacing: 4, color: 'var(--text-primary)' }}>••••••••</span>
            <Icon name="eye" size={18} color="var(--text-secondary)"/>
          </div>
          <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--color-primary)', fontWeight: 500, marginTop: -4 }}>忘记密码</div>
          <Btn variant="primary" size="l" fullWidth style={{ marginTop: 8 }}>登录</Btn>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 32 }}>© 2025 AI 陪练 · 企业培训平台</div>
      </div>
      <HomeIndicator />
    </PhoneFrame>
  );
}

function L03_Notifications() {
  const items = [
    { type: 'qa', title: '新任务推送', desc: '《产品知识季度考核》已发布，请于明天 18:00 前完成', time: '5 分钟前', unread: true },
    { type: 'roleplay', title: '考核已解锁', desc: '《大客户拜访模拟练习》已完成练习，现在可以开始考核', time: '2 小时前', unread: true },
    { type: 'qa', title: '截止提醒', desc: '《合规与风控基础》还有 3 天截止，加油完成', time: '昨天 09:30', unread: true },
    { type: 'qa', title: '成绩公布', desc: '《CRM 系统使用考核》已批改完成，得分 92 分', time: '5月1日', unread: false },
    { type: 'roleplay', title: '点评反馈', desc: '《电话开场白练习》导师已添加点评建议', time: '4月29日', unread: false },
  ];
  return (
    <PhoneFrame>
      <div style={{ padding: '4px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Icon name="chevronLeft" size={22} />
        <div style={{ fontSize: 17, fontWeight: 700 }}>通知</div>
        <span style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>全部已读</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => {
          const meta = TASK_TYPE_META[it.type];
          return (
            <div key={i} style={{ background: it.unread ? 'var(--color-primary-light)' : 'white', borderRadius: 'var(--radius-m)', padding: 14, display: 'flex', gap: 12, position: 'relative' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={meta.icon} size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{it.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>{it.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>{it.time}</div>
              </div>
              {it.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-danger)', flexShrink: 0, marginTop: 6 }}/>}
            </div>
          );
        })}
      </div>
      <MobileTabBar active="bell" />
    </PhoneFrame>
  );
}

function L04_Profile() {
  return (
    <PhoneFrame>
      <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ width: 22 }}/>
        <div style={{ fontSize: 17, fontWeight: 700 }}>我的</div>
        <Icon name="settings" size={22} color="var(--text-secondary)" />
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: MOCK_USER.avatar, color: 'white', fontWeight: 600, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,122,255,0.25)' }}>{MOCK_USER.initial}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{MOCK_USER.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{MOCK_USER.dept} · {MOCK_USER.title}</div>
        </div>
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { v: 14, l: '已完成', c: 'var(--color-primary)' },
            { v: 84, l: '平均分', c: 'var(--color-success)' },
            { v: 96, l: '最高分', c: 'var(--color-warning)' },
          ].map(s => (
            <div key={s.l} style={{ background: 'white', borderRadius: 14, padding: 14, textAlign: 'center', boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-1)' }}>
            {[
              { icon: 'lock', label: '修改密码' },
              { icon: 'bell', label: '通知设置' },
              { icon: 'shield', label: '隐私与安全' },
              { icon: 'star', label: '关于' },
            ].map((it, i, arr) => (
              <div key={it.label} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < arr.length - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                <Icon name={it.icon} size={18} color="var(--color-primary)" />
                <div style={{ flex: 1, fontSize: 15 }}>{it.label}</div>
                <Icon name="chevronRight" size={16} color="var(--text-tertiary)" />
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, padding: '0 4px' }}>最近完成</div>
          <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-1)' }}>
            {MOCK_TASKS_DONE.slice(0, 3).map((t, i, arr) => (
              <div key={t.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < arr.length - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t.date}</div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: getLevel(t.score).color }}>{t.score}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 14, textAlign: 'center', fontSize: 15, fontWeight: 500, color: 'var(--color-danger)', boxShadow: 'var(--shadow-1)' }}>退出登录</div>
        </div>
      </div>
      <MobileTabBar active="me" />
    </PhoneFrame>
  );
}

function L09_RoleSelect() {
  const [sel, setSel] = useState(0);
  const persona = MOCK_PERSONAS[sel];
  return (
    <PhoneFrame>
      <div style={{ padding: '4px 12px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Icon name="chevronLeft" size={22} />
        <div style={{ flex: 1, fontSize: 15, fontWeight: 600, textAlign: 'center' }}>大客户拜访模拟练习</div>
        <div style={{ width: 22 }}/>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', borderRadius: 18, padding: 18, color: 'white' }}>
          <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600, letterSpacing: 0.5, marginBottom: 6 }}>🎯 任务目标</div>
          <div style={{ fontSize: 15, lineHeight: 1.5, fontWeight: 500 }}>向某制造业大客户的采购总监介绍 XX 企业级解决方案，达成下一步技术对接的承诺</div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>选择对话对象</div>
          <div style={{ display: 'flex', gap: 10, overflow: 'auto', padding: '4px 0 8px', margin: '0 -16px', paddingLeft: 16, paddingRight: 16 }}>
            {MOCK_PERSONAS.map((p, i) => (
              <div key={p.id} onClick={() => setSel(i)} style={{
                flexShrink: 0, width: 130, background: 'white', borderRadius: 14, padding: 14,
                border: sel === i ? '2px solid var(--color-primary)' : '2px solid transparent',
                boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                position: 'relative', cursor: 'pointer',
              }}>
                {sel === i && (
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={11} color="white" strokeWidth={3} />
                  </div>
                )}
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: p.avatar.bg, color: 'white', fontWeight: 600, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.avatar.initial}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>{p.industry}<br/>{p.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: persona.avatar.bg, color: 'white', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{persona.avatar.initial}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{persona.name}，{persona.age}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{persona.industry} · {persona.title}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {persona.style.map(s => <Pill key={s} color="var(--color-primary)" size="xs">{s}</Pill>)}
          </div>
          {[
            ['沟通风格', '简洁务实，偏好数据和案例支撑，不喜欢过多寒暄。习惯打断追问关键细节。'],
            ['决策风格', '重 ROI 与可量化收益，不轻易做承诺，会要求明确的实施路径与里程碑。'],
            ['核心痛点', '今年制造成本压力大，对每一项新投入都要求清晰的回报周期。'],
          ].map(([l, t]) => (
            <div key={l} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{t}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="doc" size={20} color="var(--color-primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>产品介绍.pdf</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>选填材料 · 2.1 MB</div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>查看</span>
        </div>
      </div>
      <div style={{ padding: '12px 16px 18px', flexShrink: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid var(--separator)', display: 'flex', gap: 10 }}>
        <Btn variant="secondary" size="l" style={{ flex: 1 }} icon="play">开始练习</Btn>
        <Btn variant="primary" size="l" style={{ flex: 1 }} icon="lock" disabled>进入考核</Btn>
      </div>
    </PhoneFrame>
  );
}

function L11_RoleplayResult() {
  const score = 82;
  const lvl = getLevel(score);
  const dims = [
    { name: '表达清晰度', value: 85, color: 'var(--color-success)' },
    { name: '产品匹配度', value: 80, color: 'var(--color-primary)' },
    { name: '客户应对', value: 78, color: 'var(--color-primary)' },
    { name: '专业性', value: 85, color: 'var(--color-success)' },
  ];
  const persona = MOCK_PERSONAS[0];
  return (
    <PhoneFrame>
      <div style={{ padding: '4px 12px 8px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Icon name="chevronLeft" size={22} />
        <div style={{ flex: 1, fontSize: 15, fontWeight: 600, textAlign: 'center' }}>对练评分报告</div>
        <Icon name="share" size={20} color="var(--color-primary)" />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'white', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow-2)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: persona.avatar.bg, color: 'white', fontWeight: 600, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{persona.avatar.initial}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>与 {persona.name} 的对练结果</div>
          <ScoreDisplay score={score} />
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-1)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>评分维度</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dims.map(d => (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{d.name}</span>
                  <span style={{ fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(118,118,128,0.12)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${d.value}%`, height: '100%', background: d.color, borderRadius: 3, transition: 'width 800ms 200ms var(--ease-standard)' }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(52,199,89,0.06)', borderRadius: 14, padding: 14, borderLeft: '3px solid var(--color-success)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-success)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="sparkles" size={14}/> 亮点</div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <li>· 开场自然，迅速建立专业关系</li>
            <li>· 产品介绍逻辑清晰，案例数据扎实</li>
            <li>· 对客户痛点的回应展现了行业理解</li>
          </ul>
        </div>

        <div style={{ background: 'rgba(255,149,0,0.06)', borderRadius: 14, padding: 14, borderLeft: '3px solid var(--color-warning)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-warning)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="bolt" size={14}/> 改进建议</div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <li>· 价格异议处理可以更主动地引入 ROI 视角</li>
            <li>· 结尾未有效推进下一步具体动作（如约定 POC 时间）</li>
          </ul>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-1)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>示范话术参考 · 第 3 轮</div>
          <div style={{ padding: 10, background: 'rgba(118,118,128,0.06)', borderRadius: 8, fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>你说</div>
            这个价格其实挺实惠的，您看...
          </div>
          <div style={{ padding: 10, background: 'rgba(0,122,255,0.06)', borderRadius: 8, fontSize: 13, lineHeight: 1.5, borderLeft: '3px solid var(--color-primary)' }}>
            <div style={{ fontSize: 10, color: 'var(--color-primary)', marginBottom: 4, fontWeight: 600 }}>更佳表达</div>
            李总，我理解您对成本的关注。其实从 ROI 视角看，按照刚刚提到的江苏案例的口径，12 个月内通过 OEE 提升带来的产能释放就能覆盖整体投入...
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 16px 18px', flexShrink: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid var(--separator)', display: 'flex', gap: 10 }}>
        <Btn variant="secondary" size="l" style={{ flex: 1 }}>再练一次</Btn>
        <Btn variant="primary" size="l" style={{ flex: 1 }}>返回任务</Btn>
      </div>
    </PhoneFrame>
  );
}

window.L01_Login = L01_Login;
window.L03_Notifications = L03_Notifications;
window.L04_Profile = L04_Profile;
window.L09_RoleSelect = L09_RoleSelect;
window.L11_RoleplayResult = L11_RoleplayResult;
