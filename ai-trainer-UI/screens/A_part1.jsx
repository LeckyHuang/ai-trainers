// Admin screens: A01 login, A02 dashboard, A03 users, A06 files, A07/A08 banks, A09/A10 personas

function A01_AdminLogin() {
  return (
    <div className="mac-theme" style={{ width: 520, height: 600, background: '#1C1C1E', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontFamily: 'var(--font-stack)' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 16, padding: '36px 40px', width: 380, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #0066CC, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={28} color="white" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1D1D1F' }}>AI 陪练</div>
          <div style={{ fontSize: 12, color: '#86868B', fontWeight: 500 }}>管理后台</div>
        </div>
        {[
          { ph: '请输入手机号', icon: 'person' },
          { ph: '请输入密码', icon: 'lock' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', height: 38, padding: '0 12px', background: '#F5F5F7', borderRadius: 7, gap: 8, border: '1px solid var(--border)' }}>
            <Icon name={f.icon} size={14} color="var(--text-secondary)"/>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{f.ph}</span>
          </div>
        ))}
        <button style={{ height: 38, background: '#0066CC', color: 'white', borderRadius: 7, fontWeight: 600, fontSize: 14, marginTop: 4 }}>登录</button>
      </div>
    </div>
  );
}

function A02_Dashboard() {
  const stats = [
    { label: '总用户数', v: 128, sub: '本月 +12', icon: 'users', c: 'var(--color-primary)' },
    { label: '活跃任务', v: 6, sub: '进行中', icon: 'rocket', c: 'var(--color-success)' },
    { label: '本月完成', v: 43, sub: '+18% MoM', icon: 'check', c: 'var(--color-warning)' },
    { label: 'AI 调用', v: 1240, sub: '本月累计', icon: 'sparkles', c: 'var(--color-purple)' },
  ];
  return (
    <AdminFrame active="dashboard" breadcrumb={['仪表盘']} label="AI 陪练 · 管理后台" actions={<><AdminBtn variant="secondary" icon="download">导出报告</AdminBtn><AdminBtn icon="refresh">刷新</AdminBtn></>}>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `color-mix(in oklab, ${s.c} 12%, white)`, color: s.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={s.icon} size={14}/>
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.c, lineHeight: 1.1 }}><AnimatedNumber value={s.v}/></div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>最近任务状态</div>
              <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>全部 →</span>
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ fontWeight: 500, padding: '6px 0' }}>任务名</th>
                  <th style={{ fontWeight: 500 }}>类型</th>
                  <th style={{ fontWeight: 500 }}>完成率</th>
                  <th style={{ fontWeight: 500 }}>状态</th>
                  <th style={{ fontWeight: 500 }}>截止</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { n: '产品知识季度考核', t: 'qa', r: 72, s: '进行中', d: '明天' },
                  { n: '大客户拜访模拟练习', t: 'roleplay', r: 45, s: '进行中', d: '3天后' },
                  { n: '合规风控基础', t: 'qa', r: 88, s: '进行中', d: '5月12日' },
                  { n: '新员工入职考核', t: 'qa', r: 100, s: '已结束', d: '4月30日' },
                  { n: 'CRM 使用考核', t: 'qa', r: 100, s: '已结束', d: '4月25日' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                    <td style={{ padding: '8px 0', fontWeight: 500 }}>{row.n}</td>
                    <td><Pill color={TASK_TYPE_META[row.t].color} size="xs">{TASK_TYPE_META[row.t].label}</Pill></td>
                    <td style={{ width: 90 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${row.r}%`, height: '100%', background: 'var(--color-primary)' }}/>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, width: 28 }}>{row.r}%</span>
                      </div>
                    </td>
                    <td><Pill color={row.s === '已结束' ? 'var(--text-secondary)' : 'var(--color-success)'} size="xs">{row.s}</Pill></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{row.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>近 7 日完成趋势</div>
            <MiniChart data={[12, 18, 24, 16, 28, 34, 22]} labels={['周一','周二','周三','周四','周五','周六','周日']}/>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

function MiniChart({ data, labels }) {
  const max = Math.max(...data);
  return (
    <div>
      <svg viewBox="0 0 280 140" width="100%" height={140}>
        {[0, 1, 2, 3].map(i => (
          <line key={i} x1="20" y1={20 + i * 30} x2="280" y2={20 + i * 30} stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
        ))}
        <path d={`M ${data.map((v, i) => `${20 + i * 40} ${130 - (v / max) * 100}`).join(' L ')}`} fill="none" stroke="var(--color-primary)" strokeWidth="2"/>
        <path d={`M 20 130 L ${data.map((v, i) => `${20 + i * 40} ${130 - (v / max) * 100}`).join(' L ')} L 260 130 Z`} fill="url(#gradL)" opacity="0.2"/>
        <defs>
          <linearGradient id="gradL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {data.map((v, i) => (
          <circle key={i} cx={20 + i * 40} cy={130 - (v / max) * 100} r="3" fill="white" stroke="var(--color-primary)" strokeWidth="2"/>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

function A03_Users() {
  const users = [
    { n: '张明', i: '张', p: '13800138001', r: '学员', g: '华东大区', s: 'active', last: '5月3日 14:22' },
    { n: '李娜', i: '李', p: '13800138002', r: '学员', g: '华南大区', s: 'active', last: '5月3日 11:08' },
    { n: '王刚', i: '王', p: '13800138003', r: '导师', g: '产品中心', s: 'active', last: '5月2日' },
    { n: '陈雨萱', i: '陈', p: '13800138004', r: '管理员', g: '管理团队', s: 'active', last: '今天 09:30' },
    { n: '刘宇航', i: '刘', p: '13800138005', r: '学员', g: '华北大区', s: 'inactive', last: '4月20日' },
    { n: '赵丽君', i: '赵', p: '13800138006', r: '学员', g: '华东大区', s: 'active', last: '昨天 16:45' },
    { n: '周建国', i: '周', p: '13800138007', r: '导师', g: '销售中心', s: 'active', last: '5月3日' },
    { n: '徐心怡', i: '徐', p: '13800138008', r: '学员', g: '西南大区', s: 'active', last: '5月2日' },
  ];
  const roleColor = { 超管: 'var(--color-purple)', 管理员: 'var(--color-primary)', 导师: 'var(--color-success)', 学员: 'var(--text-secondary)' };
  return (
    <AdminFrame active="users" breadcrumb={['用户管理', '用户列表']} actions={<><AdminBtn variant="secondary" icon="upload">导入用户</AdminBtn><AdminBtn icon="plus">新增用户</AdminBtn></>}>
      <div style={{ padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderBottom: '1px solid var(--separator)' }}>
            <div style={{ display: 'flex', alignItems: 'center', height: 30, padding: '0 10px', background: '#F5F5F7', borderRadius: 6, gap: 6, width: 220 }}>
              <Icon name="search" size={13} color="var(--text-secondary)"/>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>搜索姓名 / 手机号</span>
            </div>
            <FilterChip label="角色：全部"/>
            <FilterChip label="分组：全部"/>
            <FilterChip label="状态：全部"/>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>共 {users.length * 16} 人</span>
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', background: '#FAFAFA' }}>
                {['', '用户', '手机号', '角色', '分组', '状态', '最后登录', ''].map((h, i) => (
                  <th key={i} style={{ fontWeight: 500, fontSize: 11, padding: '8px 12px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                  <td style={{ padding: '10px 12px', width: 32 }}><div style={{ width: 14, height: 14, border: '1.5px solid var(--border-strong)', borderRadius: 3 }}/></td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #5AC8FA, #007AFF)', color: 'white', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{u.i}</div>
                      <span style={{ fontWeight: 600 }}>{u.n}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{u.p}</td>
                  <td><Pill color={roleColor[u.r]} size="xs">{u.r}</Pill></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.g}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: u.s === 'active' ? 'var(--color-success)' : 'var(--text-tertiary)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.s === 'active' ? 'var(--color-success)' : 'var(--text-tertiary)' }}/>
                      {u.s === 'active' ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{u.last}</td>
                  <td style={{ width: 60 }}><Icon name="more" size={14} color="var(--text-secondary)"/></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, borderTop: '1px solid var(--separator)' }}>
            {['‹', '1', '2', '3', '...', '16', '›'].map((p, i) => (
              <span key={i} style={{ padding: '2px 8px', fontSize: 12, borderRadius: 4, background: p === '1' ? 'var(--color-primary)' : 'transparent', color: p === '1' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

function FilterChip({ label }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 12, color: 'var(--text-primary)', background: 'white', cursor: 'pointer' }}>
      {label}
      <Icon name="chevronDown" size={11} color="var(--text-secondary)"/>
    </div>
  );
}

function A06_Files() {
  const files = [
    { n: '产品手册 v3.pdf', t: 'doc', s: '4.2 MB', d: '5月3日' },
    { n: '价格策略培训.mp4', t: 'video', s: '128 MB', d: '5月2日' },
    { n: '客户案例-江苏.pdf', t: 'doc', s: '2.8 MB', d: '5月1日' },
    { n: '电话录音示例.mp3', t: 'audio', s: '12 MB', d: '4月29日' },
    { n: '竞品分析.pdf', t: 'doc', s: '3.5 MB', d: '4月28日' },
    { n: '产品架构图.png', t: 'img', s: '1.4 MB', d: '4月27日' },
    { n: '行业研究报告.pdf', t: 'doc', s: '8.1 MB', d: '4月25日' },
    { n: '路演视频.mp4', t: 'video', s: '256 MB', d: '4月22日' },
  ];
  const meta = {
    doc: { c: '#FF3B30', i: 'doc' },
    video: { c: '#FF9500', i: 'play' },
    audio: { c: '#34C759', i: 'mic' },
    img: { c: '#5AC8FA', i: 'star' },
  };
  return (
    <AdminFrame active="files" breadcrumb={['内容管理', '文件库']} actions={<><AdminBtn variant="secondary" icon="filter">筛选</AdminBtn><AdminBtn icon="upload">上传文件</AdminBtn></>}>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', background: 'white', borderRadius: 7, padding: 2, border: '1px solid var(--border)' }}>
            {['全部', '文档', '视频', '音频', '图片'].map((t, i) => (
              <div key={t} style={{ padding: '4px 12px', fontSize: 12, fontWeight: 500, borderRadius: 5, background: i === 0 ? 'var(--color-primary)' : 'transparent', color: i === 0 ? 'white' : 'var(--text-secondary)', cursor: 'pointer' }}>{t}</div>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', background: 'white', borderRadius: 7, padding: 2, border: '1px solid var(--border)' }}>
            {[{ k: 'grid', i: 'grid' }, { k: 'list', i: 'list' }].map((v, i) => (
              <div key={v.k} style={{ width: 26, height: 22, borderRadius: 5, background: i === 0 ? 'var(--bg-selected)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon name={v.i} size={12} color={i === 0 ? 'var(--color-primary)' : 'var(--text-secondary)'}/>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {files.map((f, i) => {
            const m = meta[f.t];
            return (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: 14, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 100, background: `color-mix(in oklab, ${m.c} 8%, white)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: m.c, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={m.i} size={24}/>
                  </div>
                  <div style={{ position: 'absolute', top: 6, right: 6, padding: '2px 6px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 9, fontWeight: 600, borderRadius: 4, letterSpacing: 0.4 }}>{f.t.toUpperCase()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{f.s}</span>
                    <span>{f.d}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminFrame>
  );
}

window.A01_AdminLogin = A01_AdminLogin;
window.A02_Dashboard = A02_Dashboard;
window.A03_Users = A03_Users;
window.A06_Files = A06_Files;
window.MiniChart = MiniChart;
window.FilterChip = FilterChip;
