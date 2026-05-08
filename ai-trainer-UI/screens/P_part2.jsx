// Batch 4 · PC 学员其余 7 屏
// P01b 登录, P02 通知, P03 个人, P06 考核, P07 结果, P08 选角, P10 评分

// =================================================================
// P01b · PC 登录
// =================================================================
function P01b_LoginPC() {
  return (
    <DesktopFrame label="AI 陪练 · 登录" width={1280} height={800}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', color: 'white', padding: 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -120, right: -120, width: 380, height: 380, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
          <div style={{ position: 'absolute', bottom: -100, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon name="sparkles" size={24} color="white"/>
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.15 }}>AI 陪练</div>
            <div style={{ fontSize: 16, opacity: 0.85, marginTop: 8, fontWeight: 500 }}>企业培训陪练 SaaS 平台</div>
          </div>
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { i: 'bookOpen', t: '智能题库', d: 'AI 自动生成题目与得分点' },
              { i: 'chatBubble', t: '虚拟客户', d: '基于人格模型的对练角色' },
              { i: 'chart', t: '过程化数据', d: '颗粒度到知识点的能力诊断' },
              { i: 'shield', t: '私有化部署', d: '完整满足金融合规要求' },
            ].map(f => (
              <div key={f.t} style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)', borderRadius: 10, padding: 14 }}>
                <Icon name={f.i} size={18} color="white"/>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>{f.t}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 56 }}>
          <div style={{ width: '100%', maxWidth: 360 }}>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>欢迎回来</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>使用企业账号登录，开始你的学习</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>手机号 / 工号</div>
                <input defaultValue="13812345678" style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 14 }}/>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>密码</span>
                  <a style={{ fontSize: 12, color: 'var(--color-primary)' }}>忘记密码？</a>
                </div>
                <input type="password" defaultValue="••••••••" style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 14 }}/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid var(--color-primary)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={9} color="white" strokeWidth={3}/>
                </div>
                7 天内自动登录
              </div>
              <button style={{ height: 44, borderRadius: 8, background: 'var(--color-primary)', color: 'white', fontSize: 14, fontWeight: 600, marginTop: 4 }}>登录</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-tertiary)', fontSize: 11, margin: '8px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--separator)' }}/>
                其他登录方式
                <div style={{ flex: 1, height: 1, background: 'var(--separator)' }}/>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ l: '钉钉', c: '#3296FA' }, { l: '企业微信', c: '#07C160' }, { l: '飞书', c: '#3370FF' }].map(p => (
                  <button key={p.l} style={{ flex: 1, height: 38, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'white', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.c }}/>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// =================================================================
// P02 · 通知中心 — 三栏
// =================================================================
function P02_NotificationsPC() {
  const list = [
    { c: '考核', t: '《产品知识季度考核》将于明天 18:00 截止', tm: '5 分钟前', unread: true, sel: true },
    { c: '考核', t: '你被指派了新任务：合规与风控基础', tm: '2 小时前', unread: true },
    { c: '点评', t: '主管陈雨萱对你的对练记录留下了点评', tm: '今天 09:30', unread: true },
    { c: '系统', t: '陪练 AI 模型升级至 v3.2，对话理解更准确', tm: '昨天' },
    { c: '点评', t: '你的"价格异议处理对练"成绩进入团队前 10%', tm: '5 月 1 日' },
    { c: '考核', t: '《新员工入职考核》已发布，请于 5 月 10 日前完成', tm: '4 月 28 日' },
  ];
  return (
    <DesktopFrame label="AI 陪练 · 通知中心" width={1280} height={800}>
      <PCSidebar active="bell"/>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PCTopbar/>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '180px 380px 1fr', overflow: 'hidden' }}>
          <div style={{ borderRight: '1px solid var(--separator)', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', padding: '0 10px 8px' }}>分类</div>
            {[
              { l: '全部', c: 12, sel: true, i: 'bell' },
              { l: '考核任务', c: 5, i: 'bookOpen' },
              { l: '点评反馈', c: 4, i: 'chatBubble' },
              { l: '系统', c: 3, i: 'settings' },
            ].map(it => (
              <div key={it.l} style={{ padding: '8px 10px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: it.sel ? 600 : 500, background: it.sel ? 'var(--bg-selected)' : 'transparent', color: it.sel ? 'var(--color-primary)' : 'var(--text-primary)', cursor: 'pointer' }}>
                <Icon name={it.i} size={15}/>
                <span style={{ flex: 1 }}>{it.l}</span>
                <span style={{ fontSize: 11, color: it.sel ? 'var(--color-primary)' : 'var(--text-tertiary)', fontWeight: 600 }}>{it.c}</span>
              </div>
            ))}
            <div style={{ flex: 1 }}/>
            <button style={{ padding: '8px 10px', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'left' }}>全部标为已读</button>
          </div>

          <div style={{ borderRight: '1px solid var(--separator)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>全部通知</div>
              <Pill color="var(--color-danger)" size="xs">3 未读</Pill>
              <div style={{ flex: 1 }}/>
              <Icon name="filter" size={14} color="var(--text-secondary)"/>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {list.map((n, i) => {
                const cm = { '考核': 'var(--color-primary)', '点评': 'var(--color-success)', '系统': 'var(--text-secondary)' }[n.c];
                return (
                  <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--separator)', cursor: 'pointer', background: n.sel ? 'var(--bg-selected)' : (n.unread ? 'rgba(0,122,255,0.02)' : 'white'), borderLeft: n.sel ? '3px solid var(--color-primary)' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Pill color={cm} size="xs">{n.c}</Pill>
                      {n.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-danger)' }}/>}
                      <div style={{ flex: 1 }}/>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{n.tm}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: n.unread ? 600 : 500, color: 'var(--text-primary)', lineHeight: 1.45 }}>{n.t}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ overflow: 'auto', padding: 32, background: '#FAFAFA' }}>
            <div style={{ background: 'white', borderRadius: 12, padding: 28, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Pill color="var(--color-primary)" size="xs">考核</Pill>
                <Pill color="var(--color-danger)" size="xs">紧急</Pill>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>5 月 6 日 14:25 · 来自系统</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>《产品知识季度考核》将于明天 18:00 截止</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 18 }}>
                你已完成边学边练（得分 78），正式考核尚未提交。请尽快在截止时间前完成考核，逾期将无法补考。考核内容覆盖 2025 Q2 新发布的企业级产品知识，共 80 题，预计耗时 40 分钟。
              </div>
              <div style={{ background: '#FAFAFA', borderRadius: 10, padding: 16, marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>任务详情</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {[
                    { l: '总题数', v: '80 题' },
                    { l: '合格分', v: '60 分' },
                    { l: '截止时间', v: '5/7 18:00', c: 'var(--color-danger)' },
                    { l: '剩余时间', v: '27 小时', c: 'var(--color-warning)' },
                    { l: '边学边练', v: '已完成 · 78 分', c: 'var(--color-success)' },
                    { l: '正式考核', v: '未开始', c: 'var(--color-primary)' },
                  ].map(s => (
                    <div key={s.l}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.c || 'var(--text-primary)', marginTop: 2 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '10px 22px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="rocket" size={14}/> 立即开始考核
                </button>
                <button style={{ padding: '10px 18px', borderRadius: 8, background: '#F2F2F7', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>稍后提醒</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// =================================================================
// P03 · 个人中心 — 左信息卡 / 右统计
// =================================================================
function P03_ProfilePC() {
  return (
    <DesktopFrame label="AI 陪练 · 我的" width={1280} height={920}>
      <PCSidebar active="me"/>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <PCTopbar/>
        <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 12, padding: 22, boxShadow: 'var(--shadow-1)', textAlign: 'center' }}>
              <div style={{ width: 84, height: 84, borderRadius: '50%', background: MOCK_USER.avatar, color: 'white', fontWeight: 700, fontSize: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{MOCK_USER.initial}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{MOCK_USER.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{MOCK_USER.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{MOCK_USER.dept}</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                <Pill color="var(--color-primary)" size="xs">高级用户</Pill>
                <Pill color="var(--color-success)" size="xs">连续 12 天</Pill>
              </div>
              <button style={{ marginTop: 16, padding: '8px 0', width: '100%', borderRadius: 8, background: '#F2F2F7', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>编辑资料</button>
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>能力雷达</div>
              <svg viewBox="0 0 200 180" width="100%" height={170}>
                {[0,1,2,3,4,5].map(i => {
                  const a = (Math.PI * 2 / 6) * i - Math.PI / 2;
                  const x = 100 + 64 * Math.cos(a), y = 90 + 64 * Math.sin(a);
                  return <line key={i} x1="100" y1="90" x2={x} y2={y} stroke="rgba(0,0,0,0.06)"/>;
                })}
                {[20,40,60].map(r => (
                  <polygon key={r} points={[0,1,2,3,4,5].map(i => {
                    const a = (Math.PI * 2 / 6) * i - Math.PI / 2;
                    return `${100 + r * Math.cos(a)},${90 + r * Math.sin(a)}`;
                  }).join(' ')} fill="none" stroke="rgba(0,0,0,0.05)"/>
                ))}
                <polygon points={[78,82,68,75,90,72].map((v, i) => {
                  const a = (Math.PI * 2 / 6) * i - Math.PI / 2;
                  const r = (v / 100) * 64;
                  return `${100 + r * Math.cos(a)},${90 + r * Math.sin(a)}`;
                }).join(' ')} fill="rgba(0,122,255,0.20)" stroke="var(--color-primary)" strokeWidth="2"/>
                {['产品知识','合规风控','客户开发','异议处理','成交技巧','跟进维护'].map((label, i) => {
                  const a = (Math.PI * 2 / 6) * i - Math.PI / 2;
                  const r = 80;
                  return <text key={label} x={100 + r * Math.cos(a)} y={90 + r * Math.sin(a) + 3} textAnchor="middle" fontSize="9" fill="var(--text-secondary)" fontWeight="500">{label}</text>;
                })}
              </svg>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                { l: '已完成任务', v: 14, sub: '本月', c: 'var(--color-primary)', i: 'check' },
                { l: '平均分', v: 84, sub: '团队 +6', c: 'var(--color-success)', i: 'chart' },
                { l: '学习时长', v: 18.5, sub: '小时·本月', c: 'var(--color-warning)', i: 'clock' },
                { l: '团队排名', v: 7, sub: '/ 56 人', c: 'var(--color-purple)', i: 'trophy' },
              ].map(s => (
                <div key={s.l} style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `color-mix(in oklab, ${s.c} 12%, white)`, color: s.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={s.i} size={14}/>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.l}</div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.c, lineHeight: 1.1 }}><AnimatedNumber value={s.v}/></div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 22, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>近期记录</div>
                <div style={{ flex: 1 }}/>
                <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: 6, padding: 2 }}>
                  {['全部', '考核', '对练'].map((m, i) => (
                    <div key={m} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4, background: i === 0 ? 'white' : 'transparent', color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}>{m}</div>
                  ))}
                </div>
              </div>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    {['任务', '类型', '得分', '用时', '完成时间'].map(h => <th key={h} style={{ padding: '8px 0', textAlign: 'left', fontWeight: 500 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TASKS_DONE.map((t, i) => {
                    const lvl = getLevel(t.score);
                    const meta = TASK_TYPE_META[t.type];
                    return (
                      <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                        <td style={{ padding: '12px 0', fontWeight: 500 }}>{t.title}</td>
                        <td><Pill color={meta.color} size="xs">{meta.label}</Pill></td>
                        <td><span style={{ fontSize: 15, fontWeight: 700, color: lvl.color }}>{t.score}</span> <Pill color={lvl.color} size="xs">{lvl.label}</Pill></td>
                        <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{['32分钟','24分钟','38分钟','29分钟','41分钟'][i]}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{t.date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// =================================================================
// P06 · PC 正式考核（隐藏参考 + 全局倒计时）
// =================================================================
function P06_ExamPC() {
  return (
    <DesktopFrame label="AI 陪练 · 正式考核" width={1280} height={840}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 56, padding: '0 24px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 16, background: 'white', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={16} color="white"/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>产品知识季度考核 · 正式考核</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>已答 8 / 10 · 合格分 60</div>
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,59,48,0.08)', borderRadius: 8, color: 'var(--color-danger)' }}>
            <Icon name="clock" size={14}/>
            <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>14:23</span>
            <span style={{ fontSize: 11 }}>剩余</span>
          </div>
          <button style={{ padding: '8px 14px', borderRadius: 8, background: '#F2F2F7', fontSize: 13, fontWeight: 500 }}>暂存退出</button>
          <button style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--color-success)', color: 'white', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="check" size={13} strokeWidth={3}/> 提交考核
          </button>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr', overflow: 'hidden' }}>
          <div style={{ borderRight: '1px solid var(--separator)', padding: 16, overflow: 'auto', background: '#FAFAFA' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>题号导航</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {Array.from({ length: 10 }).map((_, i) => {
                const status = i < 7 ? 'done' : i === 7 ? 'cur' : 'todo';
                const sm = { done: { bg: 'var(--color-primary)', color: 'white' }, cur: { bg: 'white', color: 'var(--color-primary)', border: '2px solid var(--color-primary)' }, todo: { bg: 'white', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' } }[status];
                return (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, ...sm, cursor: 'pointer' }}>{i + 1}</div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-primary)' }}/> 已答 7</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, border: '2px solid var(--color-primary)' }}/> 当前 1</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, border: '1px solid var(--border-strong)' }}/> 未答 2</div>
            </div>
            <div style={{ marginTop: 18, padding: 12, background: 'rgba(255,149,0,0.08)', borderRadius: 8, fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: 'var(--color-warning)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="warning" size={11}/> 考试中
              </div>
              已开启反作弊监测。切屏 / 退出全屏将记录在案。
            </div>
          </div>

          <div style={{ overflow: 'auto', padding: '32px 56px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 920, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>08</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>/ 10</span>
              <Pill color="var(--color-primary)" size="xs">单选题</Pill>
              <Pill color="var(--color-warning)" size="xs">10 分</Pill>
              <div style={{ flex: 1 }}/>
            </div>

            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.6 }}>
              关于我们最新发布的企业版产品 X，下列关于客户分级与定价策略的描述，<strong style={{ color: 'var(--color-danger)' }}>不正确</strong>的是？
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { l: 'A', t: 'A 类客户（年消耗 ≥ 500万）享受标准目录价 8 折', sel: false },
                { l: 'B', t: 'B 类客户（年消耗 100-500万）需走商务审批后定价', sel: true },
                { l: 'C', t: '所有客户首年合同必须包含基础服务包', sel: false },
                { l: 'D', t: '私有化部署版本不参与任何折扣政策', sel: false },
              ].map(o => (
                <div key={o.l} style={{ padding: '14px 18px', borderRadius: 10, border: o.sel ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: o.sel ? 'var(--bg-selected)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: o.sel ? 'var(--color-primary)' : '#F2F2F7', color: o.sel ? 'white' : 'var(--text-secondary)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{o.l}</div>
                  <div style={{ flex: 1, fontSize: 14, lineHeight: 1.55 }}>{o.t}</div>
                  {o.sel && <Icon name="check" size={16} color="var(--color-primary)" strokeWidth={3}/>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12 }}>
              <button style={{ padding: '10px 20px', borderRadius: 8, background: '#F2F2F7', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="arrowLeft" size={13}/> 上一题
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '10px 16px', borderRadius: 8, background: 'white', border: '1px solid var(--border-strong)', fontSize: 13, fontWeight: 500 }}>标记疑问</button>
                <button style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  下一题 <Icon name="arrowRight" size={13}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// =================================================================
// P07 · PC 考核结果
// =================================================================
function P07_ResultPC() {
  return (
    <DesktopFrame label="AI 陪练 · 考核结果" width={1280} height={920}>
      <PCSidebar active="home"/>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <PCTopbar/>
        <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
            <div style={{ background: 'linear-gradient(160deg, #34C759 0%, #30B0C7 100%)', borderRadius: 14, padding: 28, color: 'white', textAlign: 'center', boxShadow: 'var(--shadow-2)' }}>
              <div style={{ fontSize: 12, opacity: 0.9, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 600 }}>本次考核</div>
              <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1, margin: '8px 0' }}>84</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>合格 · 良好</div>
              <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.20)' }}>
                {[{ l: '总题数', v: '10' }, { l: '答对', v: '8' }, { l: '用时', v: '36:42' }].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{s.v}</div>
                    <div style={{ fontSize: 11, opacity: 0.85 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>知识点掌握</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { n: '产品政策', s: 92, c: 'var(--color-success)' },
                  { n: '客户分级', s: 78, c: 'var(--color-primary)' },
                  { n: '合规要求', s: 64, c: 'var(--color-warning)' },
                  { n: '竞品对比', s: 52, c: 'var(--color-danger)' },
                ].map(k => (
                  <div key={k.n}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>{k.n}</span>
                      <span style={{ fontWeight: 700, color: k.c }}>{k.s}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(118,118,128,0.12)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${k.s}%`, height: '100%', background: k.c }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#F2F2F7', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="download" size={13}/> 导出 PDF
              </button>
              <button style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', fontSize: 13, fontWeight: 600 }}>错题再练</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>逐题详情</div>
              <Pill color="var(--color-success)" size="xs">8 对</Pill>
              <Pill color="var(--color-danger)" size="xs">2 错</Pill>
              <div style={{ flex: 1 }}/>
              <FilterChip label="只看错题"/>
            </div>

            {[
              { n: 1, q: '关于产品 X 的客户分级标准，正确的是…', correct: true, your: 'B', right: 'B', score: 10, max: 10, kp: '客户分级' },
              { n: 2, q: '在合规风险评估流程中，第二步通常是…', correct: false, your: 'C', right: 'A', score: 0, max: 10, kp: '合规要求', expl: '合规评估流程为：客户准入 → 风险识别 → 风险量化 → 控制措施 → 持续监测。第二步是"风险识别"，因此正确答案是 A。' },
              { n: 3, q: '面对客户对价格的强烈异议，最优的应对策略是？', correct: true, your: 'D', right: 'D', score: 10, max: 10, kp: '异议处理' },
              { n: 4, q: '关于客户隐私保护的核心原则，下列不包括…', correct: false, your: 'A', right: 'C', score: 0, max: 10, kp: '合规要求', expl: '《个人信息保护法》明确的核心原则包括：合法、正当、必要、诚信。"商业用途优先"不在原则之列。' },
            ].map(q => (
              <div key={q.n} style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)', borderLeft: `4px solid ${q.correct ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)' }}>第 {String(q.n).padStart(2, '0')} 题</span>
                  <Pill color="var(--color-primary)" size="xs">{q.kp}</Pill>
                  <div style={{ flex: 1 }}/>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>得分</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: q.correct ? 'var(--color-success)' : 'var(--color-danger)' }}>{q.score}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>/{q.max}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.55, marginBottom: 10 }}>{q.q}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, marginBottom: q.expl ? 10 : 0 }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>你的答案：</span>
                    <span style={{ fontWeight: 700, color: q.correct ? 'var(--color-success)' : 'var(--color-danger)' }}>{q.your}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>正确答案：</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{q.right}</span>
                  </div>
                </div>
                {q.expl && (
                  <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, display: 'flex', gap: 8 }}>
                    <Icon name="bookOpen" size={14} color="var(--color-primary)"/>
                    <div><strong>解析：</strong>{q.expl}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// =================================================================
// P08 · PC 选择对话对象
// =================================================================
function P08_RoleSelectPC() {
  return (
    <DesktopFrame label="AI 陪练 · 选择对话对象" width={1280} height={840}>
      <PCSidebar active="home"/>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PCTopbar/>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 320px', overflow: 'hidden' }}>
          <div style={{ borderRight: '1px solid var(--separator)', padding: 24, overflow: 'auto', background: '#FAFAFA' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>当前任务</div>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>大客户拜访模拟练习</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>面向制造业大客户的解决方案推销 · 至少完成一个角色对练才能进入考核</div>

            <div style={{ background: 'white', borderRadius: 10, padding: 14, boxShadow: 'var(--shadow-1)', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>对话目标</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                <li>清晰陈述产品三大差异化优势</li>
                <li>引用至少一个真实客户案例</li>
                <li>有效应对至少 2 项异议</li>
                <li>推动客户进入下一步行动</li>
              </ul>
            </div>

            <div style={{ background: 'white', borderRadius: 10, padding: 14, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>评分维度</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                {[{ l: '专业度', v: 30 }, { l: '亲和力', v: 20 }, { l: '逻辑性', v: 20 }, { l: '应变力', v: 30 }].map(d => (
                  <div key={d.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{d.l}</span>
                    <span style={{ fontWeight: 600 }}>{d.v} 分</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ overflow: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>选择虚拟客户</div>
              <Pill color="var(--color-primary)" size="xs">3 个备选</Pill>
              <div style={{ flex: 1 }}/>
              <FilterChip label="行业：制造业"/>
              <FilterChip label="难度：全部"/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {MOCK_PERSONAS.slice(0, 4).map((p, i) => (
                <div key={p.id} style={{ background: 'white', borderRadius: 12, padding: 18, boxShadow: 'var(--shadow-1)', border: i === 0 ? '2px solid var(--color-primary)' : '2px solid transparent', cursor: 'pointer', position: 'relative' }}>
                  {i === 0 && <div style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={12} strokeWidth={3}/></div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: p.avatar.bg, color: 'white', fontWeight: 600, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.avatar.initial}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}，{p.age}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.industry} · {p.title}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                    {p.style.map(s => <Pill key={s} color="var(--color-primary)" size="xs">{s}</Pill>)}
                  </div>
                  <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--separator)', fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span>难度：{['中', '高', '中', '高'][i]}</span>
                    <span>·</span>
                    <span>预计 15-25 分钟</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--separator)', padding: 24, overflow: 'auto', background: 'white' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>已选角色 · 详情</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: MOCK_PERSONAS[0].avatar.bg, color: 'white', fontWeight: 600, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{MOCK_PERSONAS[0].avatar.initial}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{MOCK_PERSONAS[0].name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{MOCK_PERSONAS[0].industry} · {MOCK_PERSONAS[0].title}</div>
              </div>
            </div>
            <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 14 }}>
              简洁务实，重 ROI 与可量化收益，不喜欢空洞的承诺。决策周期 2-4 周，需要财务与技术双线认可。
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>对话场景</div>
              <div style={{ background: 'rgba(0,122,255,0.05)', border: '1px solid var(--bg-selected)', borderRadius: 8, padding: 12, fontSize: 12, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                客户的办公室。你刚完成季度运营会议，时间很紧。销售来介绍解决方案，你只给 30 分钟。
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>提示</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                <li>开场不要寒暄过长</li>
                <li>准备具体数据支撑</li>
                <li>引用同行业客户案例</li>
              </ul>
            </div>

            <button style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: 'var(--color-primary)', color: 'white', fontSize: 14, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              开始对练 <Icon name="arrowRight" size={14}/>
            </button>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// =================================================================
// P10 · PC 对练评分（双列：维度+亮点 / 示范话术对照）
// =================================================================
function P10_RoleplayResultPC() {
  return (
    <DesktopFrame label="AI 陪练 · 对练评分" width={1280} height={920}>
      <PCSidebar active="home"/>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <PCTopbar/>
        <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: 'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)', borderRadius: 14, padding: 28, color: 'white', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 28, boxShadow: 'var(--shadow-2)' }}>
            <div>
              <Pill color="white" bg="rgba(255,255,255,0.18)" size="xs">模拟对练</Pill>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 10, marginBottom: 6 }}>大客户拜访 · 与「李明华 · 制造业总经理」</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>5 月 6 日 14:25 完成 · 用时 18 分 32 秒 · 共 12 轮对话</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {[{ l: '专业度', v: 26, max: 30 }, { l: '亲和力', v: 16, max: 20 }, { l: '逻辑性', v: 17, max: 20 }, { l: '应变力', v: 23, max: 30 }].map(d => (
                  <div key={d.l} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11, opacity: 0.85 }}>{d.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{d.v}<span style={{ fontSize: 12, opacity: 0.7 }}> / {d.max}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', alignSelf: 'center' }}>
              <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 0.4, textTransform: 'uppercase' }}>综合评分</div>
              <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1, margin: '6px 0' }}>82</div>
              <Pill color="white" bg="rgba(255,255,255,0.20)" size="m">良好</Pill>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 12, padding: 22, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <Icon name="star" size={16} color="var(--color-success)"/>
                <div style={{ fontSize: 15, fontWeight: 700 }}>3 个亮点</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { t: '案例引用充分', d: '主动引用江苏汽车零部件案例，OEE / 排产周期数据具体，提升客户信任度。' },
                  { t: '快速回应质疑', d: '面对"行业差异"的反问，10 秒内承认前提并提出现场调研方案。' },
                  { t: '推动下一步明确', d: '结尾给出"下周三现场走访"的具体行动建议，转化路径清晰。' },
                ].map((it, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: 12, background: 'rgba(52,199,89,0.06)', borderRadius: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="check" size={12} strokeWidth={3}/>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{it.t}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{it.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 22, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <Icon name="warning" size={16} color="var(--color-warning)"/>
                <div style={{ fontSize: 15, fontWeight: 700 }}>2 个改进点</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { t: '开场过于直接', d: '客户虽然时间紧但仍重视基本礼仪，建议先用 1 句感谢对方时间，再切入主题。' },
                  { t: '竞品对比缺失', d: '客户两次问到"和你们竞品比"，回答均较含糊，建议准备 2-3 项具体差异化能力。' },
                ].map((it, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: 12, background: 'rgba(255,149,0,0.06)', borderRadius: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-warning)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: 12 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{it.t}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>{it.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 22, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Icon name="sparkles" size={16} color="var(--color-primary)"/>
              <div style={{ fontSize: 15, fontWeight: 700 }}>关键回合 · 你的话术 vs 推荐话术</div>
              <div style={{ flex: 1 }}/>
              <FilterChip label="共 3 处建议改写"/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                {
                  ctx: '客户："20%？这个数据是在哪个工厂得出来的？"',
                  yours: '我们最新的案例是江苏某汽车零部件龙头，去年三季度上线，OEE 从 65% 提升到 79%。',
                  better: '是江苏某汽车零部件龙头，去年三季度上线。具体来说，他们的精加工工段 OEE 从 65% 提升到 79%，等会我可以打开一个数据看板给您实时看。这家也是 32 亿规模，跟咱们的体量是接近的。',
                  reason: '加入"具体工段"细节增强真实性，主动提供"看板演示"是强信任动作，主动建立"规模可比"对标。',
                },
                {
                  ctx: '客户："跟你们竞品比，你们的核心差异化在哪？"',
                  yours: '我们最大的优势是更智能、响应更快，而且行业经验丰富。',
                  better: '三点最关键：第一，端到端响应低于 200ms，竞品普遍 500ms+，对您的实时排产至关重要；第二，我们累计了 1200+ 制造业客户的工艺路线模板，开箱即用；第三，私有化部署完整，零数据外传，符合您的合规底线。',
                  reason: '客户明确要求"不要听更智能这种话"——必须用具体数字 / 名词替代形容词。',
                  flag: 'changes',
                },
              ].map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: '1 / 3', fontSize: 12, color: 'var(--text-secondary)', padding: '6px 12px', background: '#FAFAFA', borderRadius: 6 }}>📍 场景：{c.ctx}</div>
                  <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>你的话术</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>"{c.yours}"</div>
                  </div>
                  <div style={{ background: 'rgba(0,122,255,0.04)', border: '1px solid var(--bg-selected)', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="sparkles" size={11}/> 推荐话术
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 8 }}>"{c.better}"</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, paddingTop: 8, borderTop: '1px solid var(--bg-selected)' }}>
                      <strong style={{ color: 'var(--color-primary)' }}>为什么更好：</strong>{c.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={{ padding: '10px 18px', borderRadius: 8, background: '#F2F2F7', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="download" size={13}/> 导出报告
            </button>
            <button style={{ padding: '10px 18px', borderRadius: 8, background: '#F2F2F7', fontSize: 13, fontWeight: 500 }}>查看完整对话回放</button>
            <button style={{ padding: '10px 22px', borderRadius: 8, background: 'var(--color-primary)', color: 'white', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="refresh" size={13}/> 再练一次
            </button>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

window.P01b_LoginPC = P01b_LoginPC;
window.P02_NotificationsPC = P02_NotificationsPC;
window.P03_ProfilePC = P03_ProfilePC;
window.P06_ExamPC = P06_ExamPC;
window.P07_ResultPC = P07_ResultPC;
window.P08_RoleSelectPC = P08_RoleSelectPC;
window.P10_RoleplayResultPC = P10_RoleplayResultPC;
