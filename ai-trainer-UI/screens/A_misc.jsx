// Batch 6 · 精简版 · 后台杂项 + 超管
// A04 用户详情, A05 分组管理, A15 企业设置, A16 审计日志, SA03 Prompt 模板

// =================================================================
// A04 · 用户详情
// =================================================================
function A04_UserDetail() {
  const radarDims = [
    { l: '产品知识', v: 88 },
    { l: '合规风控', v: 76 },
    { l: '销售技巧', v: 82 },
    { l: '客户洞察', v: 71 },
    { l: '异议处理', v: 65 },
    { l: '系统操作', v: 92 },
  ];
  const cx = 110, cy = 110, R = 80;
  const points = radarDims.map((d, i) => {
    const ang = -Math.PI / 2 + (Math.PI * 2 * i) / radarDims.length;
    const r = (d.v / 100) * R;
    return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
  });
  return (
    <AdminFrame active="users" breadcrumb={['用户管理', '用户列表', '张明']}
      actions={<><AdminBtn variant="secondary" icon="bell">发送提醒</AdminBtn><AdminBtn variant="secondary" icon="edit">编辑</AdminBtn><AdminBtn>查看完整档案</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header card */}
        <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #5AC8FA, #007AFF)', color: 'white', fontWeight: 600, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>张</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>张明</div>
              <Pill color="var(--color-success)" size="xs">在职</Pill>
              <Pill color="var(--color-purple)" size="xs">高级客户经理</Pill>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 14 }}>
              <span>📧 zhangming@example.com</span>
              <span>📱 138 0000 1234</span>
              <span>🏢 华东大区 · 销售部</span>
              <span>📅 入职 2 年 8 个月</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { l: '已完成', v: 14, c: 'var(--color-primary)' },
              { l: '平均分', v: 84, c: 'var(--color-warning)' },
              { l: '最高分', v: 96, c: 'var(--color-success)' },
              { l: '团队排名', v: '#3', c: 'var(--color-purple)' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.c, lineHeight: 1.1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* 能力雷达 */}
          <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>能力雷达</div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>基于近 3 个月任务</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <svg width="220" height="220" viewBox="0 0 220 220">
                {[0.25, 0.5, 0.75, 1].map((p, i) => (
                  <polygon key={i} points={radarDims.map((_, j) => {
                    const ang = -Math.PI / 2 + (Math.PI * 2 * j) / radarDims.length;
                    return `${cx + Math.cos(ang) * R * p},${cy + Math.sin(ang) * R * p}`;
                  }).join(' ')} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
                ))}
                {radarDims.map((d, i) => {
                  const ang = -Math.PI / 2 + (Math.PI * 2 * i) / radarDims.length;
                  return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(ang) * R} y2={cy + Math.sin(ang) * R} stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>;
                })}
                <polygon points={points.map(p => p.join(',')).join(' ')} fill="rgba(0,122,255,0.18)" stroke="var(--color-primary)" strokeWidth="2"/>
                {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="var(--color-primary)"/>)}
                {radarDims.map((d, i) => {
                  const ang = -Math.PI / 2 + (Math.PI * 2 * i) / radarDims.length;
                  const lx = cx + Math.cos(ang) * (R + 18), ly = cy + Math.sin(ang) * (R + 18);
                  return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="var(--text-secondary)">{d.l}</text>;
                })}
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {radarDims.map(d => (
                  <div key={d.l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 60, color: 'var(--text-secondary)' }}>{d.l}</span>
                    <div style={{ flex: 1, height: 5, background: '#F2F2F7', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${d.v}%`, height: '100%', background: d.v >= 85 ? 'var(--color-success)' : d.v >= 70 ? 'var(--color-primary)' : 'var(--color-warning)' }}/>
                    </div>
                    <strong style={{ width: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: d.v >= 85 ? 'var(--color-success)' : d.v >= 70 ? 'var(--color-primary)' : 'var(--color-warning)' }}>{d.v}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.20)', borderRadius: 7, fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--color-warning)' }}>建议：</strong>异议处理与客户洞察相对薄弱，可推送《价格异议处理对练》。
            </div>
          </div>

          {/* 学习时长 */}
          <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>学习时长 · 近 12 周</div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>累计 24 小时 38 分</span>
            </div>
            <svg viewBox="0 0 360 160" width="100%" height={160}>
              {[0, 40, 80, 120].map(y => <line key={y} x1="30" y1={140 - y} x2="350" y2={140 - y} stroke="rgba(0,0,0,0.05)"/>)}
              {[10, 25, 40, 55, 35, 60, 70, 50, 80, 65, 90, 75].map((h, i) => (
                <g key={i}>
                  <rect x={36 + i * 26} y={140 - h * 1.3} width="18" height={h * 1.3} fill={i === 11 ? 'var(--color-primary)' : 'rgba(0,122,255,0.45)'} rx="2"/>
                </g>
              ))}
              {['W1','W3','W5','W7','W9','W11'].map((w, i) => (
                <text key={w} x={45 + i * 52} y="155" fontSize="9" fill="var(--text-tertiary)">{w}</text>
              ))}
            </svg>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
              {[
                { l: '本周', v: '2h 15m', sub: '+18%', c: 'var(--color-success)' },
                { l: '本月', v: '8h 42m', sub: '前 20%', c: 'var(--color-primary)' },
                { l: '连续打卡', v: '12 天', sub: '🔥 进行中', c: 'var(--color-warning)' },
              ].map(s => (
                <div key={s.l} style={{ background: '#FAFAFA', borderRadius: 7, padding: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.l}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: s.c, margin: '2px 0' }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 任务历史 + 时间线 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>任务历史</div>
              <FilterChip label="状态：全部"/>
              <FilterChip label="类型：全部"/>
              <div style={{ flex: 1 }}/>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>共 22 条</span>
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ color: 'var(--text-secondary)', background: '#FAFAFA' }}>
                {['任务', '类型', '提交时间', '用时', '得分', ''].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  { n: '产品知识季度考核', t: 'qa', d: '5月3日 14:22', u: '32分', s: 92 },
                  { n: '价格异议处理对练', t: 'roleplay', d: '5月1日 10:08', u: '18分', s: 78 },
                  { n: '合规与风控基础', t: 'qa', d: '4月28日 09:15', u: '24分', s: 85 },
                  { n: 'CRM 系统使用考核', t: 'qa', d: '4月25日 16:30', u: '14分', s: 96 },
                  { n: '大客户拜访模拟', t: 'roleplay', d: '4月22日 14:45', u: '22分', s: 81 },
                  { n: '客户分级管理', t: 'qa', d: '4月18日 11:20', u: '28分', s: 91 },
                ].map((r, i) => {
                  const lvl = getLevel(r.s);
                  const meta = TASK_TYPE_META[r.t];
                  return (
                    <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{r.n}</td>
                      <td><Pill color={meta.color} size="xs">{meta.label}</Pill></td>
                      <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{r.d}</td>
                      <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{r.u}</td>
                      <td><span style={{ fontSize: 14, fontWeight: 700, color: lvl.color }}>{r.s}</span></td>
                      <td style={{ width: 60 }}><span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 500, cursor: 'pointer' }}>详情</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>近期活动</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { t: '今天 09:30', a: '开始边学边练', task: '合规与风控基础', c: 'var(--color-primary)', i: 'play' },
                { t: '昨天 14:22', a: '完成考核', task: '产品知识季度考核 · 92 分', c: 'var(--color-success)', i: 'check' },
                { t: '5月1日 10:08', a: '提交对练', task: '价格异议处理 · 78 分', c: 'var(--color-warning)', i: 'chatBubble' },
                { t: '4月28日', a: '收到提醒', task: '合规风控逾期前 3 天', c: 'var(--color-purple)', i: 'bell' },
                { t: '4月25日', a: '获得徽章', task: 'CRM 优秀奖 · 96 分', c: 'var(--color-warning)', i: 'trophy' },
              ].map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: `color-mix(in oklab, ${e.c} 14%, white)`, color: e.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={e.i} size={13}/>
                    </div>
                    {i < 4 && <div style={{ width: 1, flex: 1, background: 'var(--separator)', marginTop: 2 }}/>}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{e.a}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{e.task}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{e.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A05 · 用户分组管理 — 树形分组 + 成员
// =================================================================
function A05_GroupManager() {
  const tree = [
    { l: '某金融科技集团', dep: 0, count: 320, sel: false, exp: true, root: true },
    { l: '销售中心', dep: 1, count: 180, exp: true },
    { l: '华东大区', dep: 2, count: 56, sel: true },
    { l: '华南大区', dep: 2, count: 42 },
    { l: '华北大区', dep: 2, count: 48 },
    { l: '西南大区', dep: 2, count: 34 },
    { l: '产品中心', dep: 1, count: 64, exp: false },
    { l: '管理团队', dep: 1, count: 12, exp: false },
    { l: '运营支持', dep: 1, count: 64, exp: false },
  ];
  const members = [
    { i: '张', n: '张明', t: '高级客户经理', s: 92, last: '今天' },
    { i: '李', n: '李娜', t: '销售经理', s: 85, last: '昨天' },
    { i: '赵', n: '赵丽君', t: '客户经理', s: 78, last: '2 天前' },
    { i: '陈', n: '陈雨萱', t: '资深客户经理', s: 96, last: '今天' },
    { i: '徐', n: '徐心怡', t: '初级客户经理', s: 64, last: '3 天前' },
    { i: '周', n: '周建国', t: '销售总监', s: 88, last: '今天' },
    { i: '刘', n: '刘宇航', t: '客户经理', s: null, last: '1 周前' },
    { i: '孙', n: '孙嘉怡', t: '销售经理', s: 79, last: '4 天前' },
  ];
  return (
    <AdminFrame active="groups" breadcrumb={['用户管理', '用户分组']}
      actions={<><AdminBtn variant="secondary" icon="upload">导入组织结构</AdminBtn><AdminBtn icon="plus">新建分组</AdminBtn></>}>
      <div style={{ padding: 20, height: 'calc(100% - 0px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          {/* 左侧：组织树 */}
          <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: 14, borderBottom: '1px solid var(--separator)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>组织树</div>
                <Icon name="more" size={14} color="var(--text-secondary)"/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F5F5F7', borderRadius: 6 }}>
                <Icon name="search" size={12} color="var(--text-secondary)"/>
                <input placeholder="搜索分组..." style={{ flex: 1, height: 22, border: 'none', outline: 'none', fontSize: 12, background: 'transparent' }}/>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {tree.map((n, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 7, background: n.sel ? 'var(--bg-selected)' : 'transparent', marginLeft: n.dep * 16, cursor: 'pointer' }}>
                  {n.exp !== undefined ? (
                    <Icon name="chevronRight" size={11} color="var(--text-secondary)" style={{ transform: n.exp ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }}/>
                  ) : (
                    <span style={{ width: 11 }}/>
                  )}
                  <Icon name={n.root ? 'building' : 'folder'} size={14} color={n.sel ? 'var(--color-primary)' : 'var(--text-secondary)'}/>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: n.dep === 0 ? 700 : n.sel ? 600 : 500, color: n.sel ? 'var(--color-primary)' : 'var(--text-primary)' }}>{n.l}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', background: n.sel ? 'white' : '#F2F2F7', padding: '1px 6px', borderRadius: 8 }}>{n.count}</span>
                </div>
              ))}
              <button style={{ marginTop: 8, padding: '8px 12px', borderRadius: 7, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="plus" size={12}/> 添加子分组
              </button>
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--separator)', fontSize: 11, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>共 9 个分组</span>
              <span>· 320 人</span>
            </div>
          </div>

          {/* 右侧：选中分组详情 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
            {/* 分组信息 */}
            <div style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(0,122,255,0.10)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="folder" size={22}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>华东大区</div>
                    <Pill color="var(--color-primary)" size="xs">销售中心</Pill>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>负责人：周建国 · 创建于 2024-03-15</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <AdminBtn variant="ghost" icon="edit">编辑</AdminBtn>
                  <AdminBtn variant="secondary" icon="rocket">推送任务</AdminBtn>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--separator)' }}>
                {[
                  { l: '成员数', v: 56, c: 'var(--color-primary)' },
                  { l: '本月平均分', v: 84, c: 'var(--color-warning)' },
                  { l: '完成率', v: '92%', c: 'var(--color-success)' },
                  { l: '活跃度', v: '高', c: 'var(--color-purple)' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.c, lineHeight: 1.1, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 成员列表 */}
            <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>成员</div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>56</span>
                <div style={{ flex: 1 }}/>
                <FilterChip label="角色：全部"/>
                <button style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, color: 'var(--color-primary)', borderRadius: 6, border: '1px solid var(--bg-selected)', background: 'var(--bg-selected)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="plus" size={11}/> 添加成员
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#FAFAFA', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                      {['用户', '职位', '近 30 天均分', '最近活动', ''].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((u, i) => {
                      const lvl = u.s ? getLevel(u.s) : null;
                      return (
                        <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #5AC8FA, #007AFF)', color: 'white', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{u.i}</div>
                              <span style={{ fontWeight: 500 }}>{u.n}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{u.t}</td>
                          <td>
                            {u.s ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: lvl.color, width: 30 }}>{u.s}</span>
                                <div style={{ width: 60, height: 4, background: '#F2F2F7', borderRadius: 2, overflow: 'hidden' }}>
                                  <div style={{ width: `${u.s}%`, height: '100%', background: lvl.color }}/>
                                </div>
                              </div>
                            ) : <span style={{ color: 'var(--text-tertiary)' }}>未参与</span>}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{u.last}</td>
                          <td style={{ width: 120 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 500, cursor: 'pointer' }}>详情</span>
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>移出</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A15 · 企业设置 — 基础信息 + AI 配置
// =================================================================
function A15_CompanySettings() {
  const [tab, setTab] = useState(1);
  const tabs = [
    { l: '基础信息', i: 'building' },
    { l: 'AI 配置', i: 'sparkles' },
    { l: '账号与权限', i: 'shield' },
    { l: '通知与集成', i: 'bell' },
    { l: '订阅与用量', i: 'chart' },
  ];
  return (
    <AdminFrame active="tenant" breadcrumb={['企业设置']}
      actions={<><AdminBtn variant="ghost">取消</AdminBtn><AdminBtn icon="check">保存修改</AdminBtn></>}>
      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Side tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map((t, i) => (
            <div key={t.l} onClick={() => setTab(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: tab === i ? 'var(--bg-selected)' : 'white', color: tab === i ? 'var(--color-primary)' : 'var(--text-primary)', boxShadow: tab === i ? 'none' : 'var(--shadow-1)', fontSize: 13, fontWeight: tab === i ? 600 : 500, cursor: 'pointer' }}>
              <Icon name={t.i} size={16}/>
              <span>{t.l}</span>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: 12, background: 'rgba(0,122,255,0.05)', borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, border: '1px solid var(--bg-selected)' }}>
            <div style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: 4, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="lightbulb" size={12}/> 提示
            </div>
            修改 AI 配置后，新发布的任务才会生效，已进行中的任务保持原配置。
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Section: LLM */}
          <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Icon name="sparkles" size={16} color="var(--color-primary)"/>
              <div style={{ fontSize: 15, fontWeight: 700 }}>大语言模型 LLM</div>
              <Pill color="var(--color-success)" size="xs">已连通</Pill>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>用于生成题目、评分点提取、对话评价等智能任务</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { n: 'GPT-4o', d: 'OpenAI', s: false, c: '#10A37F' },
                { n: 'Claude 3.5', d: 'Anthropic', s: true, c: '#D97757' },
                { n: '通义千问', d: '阿里云', s: false, c: '#615CED' },
                { n: '自有模型', d: '私有部署', s: false, c: '#8E8E93' },
              ].map(p => (
                <div key={p.n} style={{ padding: 12, borderRadius: 8, border: p.s ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: p.s ? 'var(--bg-selected)' : 'white', cursor: 'pointer', position: 'relative' }}>
                  {p.s && <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={9} strokeWidth={3}/></div>}
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: p.c, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{p.n[0]}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.d}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormRow label="模型版本">
                <select defaultValue="claude-3-5-sonnet" style={{ height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13 }}>
                  <option>claude-3-5-sonnet（推荐）</option>
                  <option>claude-3-5-haiku</option>
                  <option>claude-3-opus</option>
                </select>
              </FormRow>
              <FormRow label="API Key">
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value="sk-ant-api03-•••••••••••••••••••••••N4xQ" readOnly style={{ flex: 1, height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 12, fontFamily: 'monospace' }}/>
                  <button style={{ padding: '0 12px', borderRadius: 7, background: '#F2F2F7', fontSize: 12, fontWeight: 500 }}>更换</button>
                </div>
              </FormRow>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
              <FormRow label="Temperature">
                <div style={{ height: 36, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="range" min="0" max="100" defaultValue="35" style={{ flex: 1 }}/>
                  <span style={{ width: 36, textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>0.35</span>
                </div>
              </FormRow>
              <FormRow label="Max Tokens">
                <input defaultValue="4096" style={{ height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13 }}/>
              </FormRow>
              <FormRow label="超时">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input defaultValue="30" style={{ flex: 1, height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13 }}/>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>秒</span>
                </div>
              </FormRow>
            </div>
            <div style={{ marginTop: 12, padding: 12, background: '#FAFAFA', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="check" size={16} color="var(--color-success)"/>
              <div style={{ flex: 1, fontSize: 12 }}>
                <strong>连通测试通过</strong>
                <span style={{ color: 'var(--text-secondary)' }}> · 平均延迟 1.2s · 最近测试 5 分钟前</span>
              </div>
              <button style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, color: 'var(--color-primary)', background: 'var(--bg-selected)' }}>重新测试</button>
            </div>
          </div>

          {/* Section: ASR + TTS 双列 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              {
                t: '语音识别 ASR', sub: '把学员的录音转写为文字',
                p: [{ n: '科大讯飞', s: true }, { n: '阿里云', s: false }, { n: 'Whisper', s: false }],
                cfg: [{ l: '语种', v: '中文 (普通话)' }, { l: '采样率', v: '16 kHz' }, { l: '热词表', v: '已加载 24 个产品名词', c: 'var(--color-success)' }],
              },
              {
                t: '语音合成 TTS', sub: '虚拟角色的开口说话',
                p: [{ n: '阿里云', s: true }, { n: '科大讯飞', s: false }, { n: 'Azure TTS', s: false }],
                cfg: [{ l: '默认音色', v: '思琪（成年女声）' }, { l: '语速', v: '1.0x' }, { l: '输出格式', v: 'MP3 / 48 kHz' }],
              },
            ].map(s => (
              <div key={s.t} style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Icon name={s.t.includes('识别') ? 'mic' : 'waveform'} size={14} color="var(--color-primary)"/>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.t}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>{s.sub}</div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {s.p.map(o => (
                    <div key={o.n} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: o.s ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: o.s ? 'var(--bg-selected)' : 'white', textAlign: 'center', fontSize: 12, fontWeight: 600, color: o.s ? 'var(--color-primary)' : 'var(--text-primary)' }}>{o.n}</div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.cfg.map(c => (
                    <div key={c.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--separator)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{c.l}</span>
                      <strong style={{ color: c.c || 'var(--text-primary)' }}>{c.v}</strong>
                    </div>
                  ))}
                </div>
                <button style={{ marginTop: 10, width: '100%', padding: '6px 0', borderRadius: 6, background: 'var(--bg-selected)', color: 'var(--color-primary)', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="play" size={11}/> 试听 / 测试
                </button>
              </div>
            ))}
          </div>

          {/* Section: 用量配额 */}
          <div style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>本月 AI 用量</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>套餐：企业版（无封顶，按量后付）</div>
              </div>
              <button style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, color: 'var(--color-primary)', borderRadius: 6, background: 'var(--bg-selected)' }}>查看详细账单</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { l: 'LLM Token', used: 2400000, total: 5000000, sub: '$ 88.42', c: 'var(--color-primary)' },
                { l: 'ASR 时长', used: 142, total: 500, sub: '142 / 500 小时', c: 'var(--color-success)' },
                { l: 'TTS 时长', used: 86, total: 300, sub: '86 / 300 小时', c: 'var(--color-purple)' },
              ].map(m => {
                const pct = Math.round(m.used / m.total * 100);
                return (
                  <div key={m.l} style={{ background: '#FAFAFA', borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.l}</span>
                      <strong style={{ fontSize: 11, color: m.c }}>{pct}%</strong>
                    </div>
                    <div style={{ height: 6, background: '#E5E5EA', borderRadius: 3, overflow: 'hidden', margin: '8px 0' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: m.c, borderRadius: 3 }}/>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A16 · 审计日志
// =================================================================
function A16_AuditLog() {
  const logs = [
    { t: '2025-05-03 14:22:18', who: '陈雨萱', role: '管理员', act: 'task.publish', target: '产品知识季度考核', s: 'ok', ip: '180.165.x.x', desc: '推送给 56 位学员' },
    { t: '2025-05-03 11:05:42', who: '陈雨萱', role: '管理员', act: 'persona.update', target: '李明华 · 制造业总经理', s: 'ok', ip: '180.165.x.x', desc: '更新 AI 画像（diff 4 项）' },
    { t: '2025-05-03 09:48:11', who: '系统', role: 'system', act: 'task.deadline', target: '合规与风控基础', s: 'warn', ip: '—', desc: '即将逾期 24 小时内' },
    { t: '2025-05-02 17:30:09', who: '周建国', role: '主管', act: 'user.create', target: '新员工 王思琪', s: 'ok', ip: '116.236.x.x', desc: '加入华东大区分组' },
    { t: '2025-05-02 16:14:33', who: '陈雨萱', role: '管理员', act: 'bank.import', target: '产品知识题库', s: 'ok', ip: '180.165.x.x', desc: '批量导入 124 题' },
    { t: '2025-05-02 14:02:55', who: '李娜', role: '学员', act: 'task.submit', target: '产品知识季度考核', s: 'ok', ip: '116.236.x.x', desc: '得分 85 · 用时 38 分钟' },
    { t: '2025-05-02 10:12:08', who: '陈雨萱', role: '管理员', act: 'settings.update', target: '企业 AI 配置', s: 'ok', ip: '180.165.x.x', desc: '切换 LLM 至 Claude 3.5' },
    { t: '2025-05-01 22:48:01', who: '系统', role: 'system', act: 'auth.fail', target: 'admin@example.com', s: 'err', ip: '203.0.113.x', desc: '连续 3 次密码错误，IP 临时锁定 30 分钟' },
    { t: '2025-05-01 16:30:42', who: '陈雨萱', role: '管理员', act: 'group.create', target: '产品中心', s: 'ok', ip: '180.165.x.x', desc: '创建分组' },
    { t: '2025-05-01 09:00:12', who: '陈雨萱', role: '管理员', act: 'auth.login', target: '后台登录', s: 'ok', ip: '180.165.x.x', desc: 'Web · macOS · Chrome' },
  ];
  const sm = { ok: { l: '成功', c: 'var(--color-success)' }, warn: { l: '警告', c: 'var(--color-warning)' }, err: { l: '失败', c: 'var(--color-danger)' } };
  const actColor = (a) => a.startsWith('auth.') ? 'var(--color-purple)' : a.startsWith('task.') ? 'var(--color-primary)' : a.startsWith('user.') || a.startsWith('group.') ? 'var(--color-cyan)' : a.startsWith('settings.') || a.startsWith('persona.') || a.startsWith('bank.') ? 'var(--color-warning)' : 'var(--text-secondary)';
  return (
    <AdminFrame active="audit" breadcrumb={['企业设置', '审计日志']}
      actions={<><AdminBtn variant="secondary" icon="filter">高级筛选</AdminBtn><AdminBtn variant="secondary" icon="download">导出 CSV</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 概览 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { l: '今日操作', v: 142, sub: '+18 vs 昨日', c: 'var(--color-primary)' },
            { l: '失败操作', v: 3, sub: '需关注', c: 'var(--color-danger)' },
            { l: '管理员动作', v: 28, sub: '24 小时内', c: 'var(--color-warning)' },
            { l: '活跃 IP', v: 12, sub: '今日不同 IP', c: 'var(--color-purple)' },
          ].map(s => (
            <div key={s.l} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.l}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.c, lineHeight: 1.2, margin: '4px 0' }}><AnimatedNumber value={s.v}/></div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* 筛选条 */}
        <div style={{ background: 'white', borderRadius: 10, padding: 12, boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <FilterChip label="时间：今天 / 7 天 / 30 天 / 自定义"/>
          <FilterChip label="操作类型：全部"/>
          <FilterChip label="操作人：全部"/>
          <FilterChip label="结果：全部"/>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F5F5F7', borderRadius: 7, fontSize: 12, color: 'var(--text-secondary)', width: 280 }}>
            <Icon name="search" size={12}/> 搜索操作目标 / 描述 / IP...
          </div>
        </div>

        {/* 表格 */}
        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {['时间', '操作人', '操作', '目标', '描述', '结果', 'IP', ''].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                  <td style={{ padding: '10px 12px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{l.t}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: l.role === 'system' ? '#F2F2F7' : 'linear-gradient(135deg, #5AC8FA, #007AFF)', color: l.role === 'system' ? 'var(--text-secondary)' : 'white', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {l.role === 'system' ? <Icon name="bolt" size={11}/> : l.who[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{l.who}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{l.role}</div>
                      </div>
                    </div>
                  </td>
                  <td><Pill color={actColor(l.act)} size="xs">{l.act}</Pill></td>
                  <td style={{ fontWeight: 500 }}>{l.target}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 260 }}>{l.desc}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: sm[l.s].c, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm[l.s].c }}/>
                      {sm[l.s].l}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontFamily: 'monospace', fontSize: 11 }}>{l.ip}</td>
                  <td style={{ width: 50 }}><span style={{ fontSize: 11, color: 'var(--color-primary)', cursor: 'pointer' }}>详情</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--separator)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>显示 1 - 10 / 共 1,284 条</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['‹', '1', '2', '3', '...', '129', '›'].map((p, i) => (
                <div key={i} style={{ minWidth: 24, height: 24, padding: '0 6px', borderRadius: 5, background: p === '1' ? 'var(--color-primary)' : 'transparent', color: p === '1' ? 'white' : 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{p}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// SA03 · Prompt 模板管理 — 双栏代码编辑器 + 测试运行
// =================================================================
function SA03_PromptTemplates() {
  const templates = [
    { n: '题目生成 · 单选题', cat: 'qa', v: 'v3.2', sel: true, used: '128 企业', updated: '2 天前', tag: 'core' },
    { n: '题目生成 · 多选题', cat: 'qa', v: 'v2.1', updated: '5 天前' },
    { n: '题目生成 · 判断题', cat: 'qa', v: 'v1.8', updated: '1 周前' },
    { n: '简答题评分 · 得分点提取', cat: 'score', v: 'v4.0', updated: '今天', tag: 'beta' },
    { n: '虚拟角色画像生成', cat: 'persona', v: 'v2.5', updated: '昨天' },
    { n: '虚拟角色对话回应', cat: 'persona', v: 'v3.1', updated: '3 天前' },
    { n: '对练评分 · 6 维评估', cat: 'score', v: 'v2.0', updated: '4 天前' },
    { n: '对练改进建议', cat: 'score', v: 'v1.4', updated: '1 周前' },
  ];
  const catMeta = {
    qa: { l: '题目生成', c: 'var(--color-primary)' },
    score: { l: '评分', c: 'var(--color-success)' },
    persona: { l: '虚拟角色', c: 'var(--color-purple)' },
  };
  const promptText = `你是一位资深企业培训出题专家。基于下方"知识材料"为学员生成 {{count}} 道
单选题，要求：

1. 每题须围绕材料中的核心知识点，避免重复
2. 选项 4 个（A/B/C/D），其中 1 个正确，3 个干扰项
3. 干扰项需"看似合理但有明显错误"，避免无意义选项
4. 难度按 {{difficulty}} 控制：
   - easy：直接定义/概念
   - medium：场景化运用
   - hard：综合判断、多步推理
5. 输出 JSON：
   { "questions": [
       { "stem": "...", "options": ["A...", "B...", "C...", "D..."],
         "answer": "B", "explain": "...", "knowledge_point": "..." }
   ] }

【知识材料】
{{material}}

【难度】{{difficulty}}
【数量】{{count}}`;
  return (
    <AdminFrame active="prompts" superadmin breadcrumb={['超管', 'Prompt 模板']}
      actions={<><AdminBtn variant="ghost">重置默认</AdminBtn><AdminBtn variant="secondary">复制为新版本</AdminBtn><AdminBtn icon="rocket">发布到全部企业</AdminBtn></>}>
      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '300px 1fr 360px', gap: 16, height: '100%' }}>
        {/* 左：模板列表 */}
        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--separator)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>模板列表</div>
              <Icon name="plus" size={14} color="var(--color-primary)"/>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F5F5F7', borderRadius: 6 }}>
              <Icon name="search" size={11} color="var(--text-secondary)"/>
              <input placeholder="搜索模板..." style={{ flex: 1, height: 22, border: 'none', outline: 'none', fontSize: 12, background: 'transparent' }}/>
            </div>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--separator)', padding: '0 10px' }}>
            {['全部', '题目', '评分', '角色'].map((t, i) => (
              <div key={t} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 600, color: i === 0 ? 'var(--color-primary)' : 'var(--text-secondary)', borderBottom: i === 0 ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -1, cursor: 'pointer' }}>{t}</div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {templates.map((t, i) => {
              const m = catMeta[t.cat];
              return (
                <div key={i} style={{ padding: 10, borderRadius: 7, background: t.sel ? 'var(--bg-selected)' : 'transparent', border: t.sel ? '1px solid var(--color-primary)' : '1px solid transparent', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon name="code" size={12} color={t.sel ? 'var(--color-primary)' : 'var(--text-secondary)'}/>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: t.sel ? 600 : 500, color: t.sel ? 'var(--color-primary)' : 'var(--text-primary)' }}>{t.n}</span>
                    {t.tag === 'core' && <Pill color="var(--color-warning)" size="xs">核心</Pill>}
                    {t.tag === 'beta' && <Pill color="var(--color-purple)" size="xs">Beta</Pill>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-tertiary)' }}>
                    <Pill color={m.c} size="xs">{m.l}</Pill>
                    <span>{t.v}</span>
                    <span>·</span>
                    <span>{t.updated}</span>
                  </div>
                  {t.sel && (
                    <div style={{ marginTop: 6, fontSize: 10, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="building" size={10}/> 应用于 128 个企业
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 中：编辑器 */}
        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="code" size={15} color="var(--color-primary)"/>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>题目生成 · 单选题</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>v3.2 · 2 天前更新 · 128 企业使用中</div>
            </div>
            <div style={{ flex: 1 }}/>
            <select defaultValue="v3.2" style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--border-strong)', fontSize: 11 }}>
              <option>v3.2 (current)</option><option>v3.1</option><option>v3.0</option><option>v2.5</option>
            </select>
            <button style={{ padding: '5px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', background: '#F2F2F7', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="refresh" size={11}/> 与上版 diff
            </button>
          </div>
          {/* Variables strip */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--separator)', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginRight: 4 }}>变量</span>
            {[
              { n: 'material', t: 'string', d: '知识材料文本' },
              { n: 'count', t: 'int', d: '题目数量' },
              { n: 'difficulty', t: 'enum', d: 'easy/medium/hard' },
            ].map(v => (
              <div key={v.n} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'white', border: '1px solid var(--separator)', borderRadius: 5, fontFamily: 'monospace', fontSize: 11 }}>
                <span style={{ color: 'var(--color-purple)', fontWeight: 600 }}>{`{{${v.n}}}`}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>{v.t}</span>
              </div>
            ))}
            <div style={{ flex: 1 }}/>
            <button style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Icon name="plus" size={10}/> 新增变量
            </button>
          </div>
          {/* Code editor */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#1d1f21' }}>
            <div style={{ padding: '14px 8px', fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.08)', userSelect: 'none', lineHeight: 1.6 }}>
              {Array.from({ length: 24 }, (_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <div style={{ flex: 1, padding: 14, fontSize: 12, fontFamily: 'monospace', color: '#e8e8e8', whiteSpace: 'pre-wrap', lineHeight: 1.6, overflow: 'auto' }}>
              {promptText.split(/(\{\{\w+\}\}|"[^"]*"|【[^】]+】|\b(?:你是|要求|输出|JSON)\b)/g).map((seg, i) => {
                if (/^\{\{\w+\}\}$/.test(seg)) return <span key={i} style={{ color: '#c792ea', background: 'rgba(199,146,234,0.12)', padding: '0 2px', borderRadius: 3 }}>{seg}</span>;
                if (/^【.+】$/.test(seg)) return <span key={i} style={{ color: '#82aaff', fontWeight: 600 }}>{seg}</span>;
                if (/^".*"$/.test(seg)) return <span key={i} style={{ color: '#c3e88d' }}>{seg}</span>;
                if (/^(你是|要求|输出|JSON)$/.test(seg)) return <span key={i} style={{ color: '#f78c6c' }}>{seg}</span>;
                return <span key={i}>{seg}</span>;
              })}
            </div>
          </div>
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--separator)', background: '#FAFAFA', display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>{promptText.length} 字符</span>
            <span>· 约 280 tokens</span>
            <span>· 中文 + 英文</span>
            <div style={{ flex: 1 }}/>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-success)' }}>
              <Icon name="check" size={11} strokeWidth={3}/> 模板格式正确
            </span>
          </div>
        </div>

        {/* 右：测试运行 */}
        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="flask" size={14} color="var(--color-warning)"/>
            <div style={{ fontSize: 13, fontWeight: 700 }}>测试运行</div>
            <div style={{ flex: 1 }}/>
            <select defaultValue="claude" style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid var(--border-strong)', fontSize: 11 }}>
              <option value="claude">Claude 3.5</option><option>GPT-4o</option><option>通义千问</option>
            </select>
          </div>
          <div style={{ padding: 14, borderBottom: '1px solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>material</div>
              <textarea defaultValue="产品 X 是面向制造业的 MES 系统，核心模块包含智能排产、设备稼动率监控、质量追溯..." style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 11, fontFamily: 'monospace' }}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>count</div>
                <input defaultValue="3" style={{ width: '100%', height: 28, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border-strong)', fontSize: 12 }}/>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>difficulty</div>
                <select defaultValue="medium" style={{ width: '100%', height: 28, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border-strong)', fontSize: 12 }}>
                  <option>easy</option><option>medium</option><option>hard</option>
                </select>
              </div>
            </div>
            <button style={{ padding: '8px 0', borderRadius: 6, background: 'var(--color-primary)', color: 'white', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="play" size={12}/> 运行测试
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              输出预览
              <Pill color="var(--color-success)" size="xs">200 OK · 1.8s · 412 tok</Pill>
            </div>
            <div style={{ padding: 14, paddingTop: 0 }}>
              <div style={{ background: '#FAFAFA', borderRadius: 7, padding: 12, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
{`{
  "questions": [
    {
      "stem": "产品 X 的设备稼动率监控模块，主要解决以下哪类问题？",
      "options": [
        "A. 财务对账与税务申报",
        "B. 实时识别设备闲置/异常并定位瓶颈",
        "C. 客户订单分级",
        "D. 员工排班"
      ],
      "answer": "B",
      "explain": "稼动率监控聚焦设备运行状态…",
      "knowledge_point": "设备稼动率"
    },
    ...
  ]
}`}
              </div>

              <div style={{ marginTop: 10, padding: 10, background: 'rgba(52,199,89,0.06)', borderRadius: 7, border: '1px solid rgba(52,199,89,0.2)', fontSize: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontWeight: 600, marginBottom: 4 }}>
                  <Icon name="check" size={11} strokeWidth={3}/> JSON 结构验证通过
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>3 道题 · 平均干扰项合理度 8.2 / 10 · 知识点覆盖一致</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

window.A04_UserDetail = A04_UserDetail;
window.A05_GroupManager = A05_GroupManager;
window.A15_CompanySettings = A15_CompanySettings;
window.A16_AuditLog = A16_AuditLog;
window.SA03_PromptTemplates = SA03_PromptTemplates;
