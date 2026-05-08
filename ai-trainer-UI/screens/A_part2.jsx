// Admin part 2: A07 banks, A09/A10 personas, A12 task creator, A14 progress, A18 reports

function A07_Banks() {
  const banks = [
    { n: '产品知识题库', q: 248, t: 'qa', d: '产品功能、价格、案例', cat: '产品', c: 'var(--color-primary)' },
    { n: '合规与风控', q: 156, t: 'qa', d: '内控、信息安全、客户权益', cat: '合规', c: 'var(--color-warning)' },
    { n: 'CRM 系统使用', q: 92, t: 'qa', d: '系统操作、流程规范', cat: '系统', c: 'var(--color-success)' },
    { n: '销售技巧基础', q: 78, t: 'qa', d: '开场、需求挖掘、异议处理', cat: '销售', c: 'var(--color-purple)' },
    { n: '行业知识·制造业', q: 64, t: 'qa', d: '行业特点、典型客户画像', cat: '行业', c: 'var(--color-pink)' },
    { n: '新员工入职', q: 120, t: 'qa', d: '企业文化、规章制度', cat: '通用', c: 'var(--color-cyan)' },
  ];
  return (
    <AdminFrame active="banks" breadcrumb={['内容管理', '题库管理']} actions={<><AdminBtn variant="secondary" icon="upload">批量导入</AdminBtn><AdminBtn icon="plus">新建题库</AdminBtn></>}>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {banks.map((b, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: `color-mix(in oklab, ${b.c} 12%, white)`, color: b.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="bookOpen" size={20}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{b.n}</div>
                  <Pill color={b.c} size="xs">{b.cat}</Pill>
                </div>
                <Icon name="more" size={14} color="var(--text-secondary)"/>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b.d}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--separator)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>共 <strong style={{ color: 'var(--text-primary)', fontSize: 15 }}>{b.q}</strong> 题</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, padding: '4px 8px', borderRadius: 5, cursor: 'pointer' }}>查看</span>
                  <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, padding: '4px 8px', borderRadius: 5, cursor: 'pointer' }}>编辑</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminFrame>
  );
}

function A10_Personas() {
  return (
    <AdminFrame active="personas" breadcrumb={['内容管理', '角色库']} actions={<><AdminBtn variant="secondary" icon="filter">筛选</AdminBtn><AdminBtn icon="plus">新建角色</AdminBtn></>}>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <FilterChip label="行业：全部"/>
          <FilterChip label="职位：全部"/>
          <FilterChip label="风格：全部"/>
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>共 24 个角色</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[...MOCK_PERSONAS, ...MOCK_PERSONAS.slice(0, 3)].map((p, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: p.avatar.bg, color: 'white', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.avatar.initial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}，{p.age}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.industry} · {p.title}</div>
                </div>
                <Icon name="more" size={14} color="var(--text-secondary)"/>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {p.style.map(s => <Pill key={s} color="var(--color-primary)" size="xs">{s}</Pill>)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, paddingTop: 8, borderTop: '1px solid var(--separator)' }}>
                简洁务实，重 ROI 与可量化收益，不喜欢空洞的承诺。
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                <span>已用于 {2 + (i % 4)} 个任务</span>
                <span>·</span>
                <span>更新于 {3 + i} 天前</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminFrame>
  );
}

function A12_TaskCreator() {
  const steps = ['基本信息', '题目配置', '考核规则', '推送范围', '预览发布'];
  const active = 1;
  return (
    <AdminFrame active="tasks-qa" breadcrumb={['培训任务', '知识问答', '新建任务']}
      actions={<><AdminBtn variant="ghost">取消</AdminBtn><AdminBtn variant="secondary">存为草稿</AdminBtn><AdminBtn icon="rocket">发布任务</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 10, padding: '14px 20px', boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: i <= active ? 'var(--color-primary)' : '#F2F2F7', color: i <= active ? 'white' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i < active ? <Icon name="check" size={11} strokeWidth={3}/> : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: i === active ? 600 : 500, color: i === active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i < active ? 'var(--color-primary)' : 'var(--separator)' }}/>}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>题目配置</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>从已选题库中抽取题目，或手动添加</div>
            </div>

            <FormRow label="出题方式">
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { l: '从题库抽取', s: true, d: '随机或按规则' },
                  { l: '手动选择', s: false, d: '逐题挑选' },
                  { l: 'AI 生成', s: false, d: '基于文件生成' },
                ].map(o => (
                  <div key={o.l} style={{ flex: 1, padding: 12, borderRadius: 8, border: o.s ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: o.s ? 'var(--bg-selected)' : 'white', cursor: 'pointer' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{o.l}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{o.d}</div>
                  </div>
                ))}
              </div>
            </FormRow>

            <FormRow label="选择题库">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { n: '产品知识题库', q: 248, c: 60, sel: true },
                  { n: '客户案例题库', q: 96, c: 20, sel: true },
                  { n: '合规风控基础', q: 156, c: 0, sel: false },
                ].map(b => (
                  <div key={b.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: b.sel ? 'var(--bg-selected)' : '#FAFAFA', borderRadius: 7, border: b.sel ? '1px solid var(--color-primary)' : '1px solid transparent' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: b.sel ? '2px solid var(--color-primary)' : '1.5px solid var(--border-strong)', background: b.sel ? 'var(--color-primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {b.sel && <Icon name="check" size={10} color="white" strokeWidth={3}/>}
                    </div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{b.n}</div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>共 {b.q} 题</span>
                    {b.sel && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>抽取</span>
                        <input defaultValue={b.c} style={{ width: 50, height: 24, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border-strong)', fontSize: 12, textAlign: 'center' }}/>
                        <span style={{ color: 'var(--text-secondary)' }}>题</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </FormRow>

            <FormRow label="题型分布">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { l: '单选题', v: 40, c: 'var(--color-primary)' },
                  { l: '多选题', v: 20, c: 'var(--color-success)' },
                  { l: '判断题', v: 10, c: 'var(--color-warning)' },
                  { l: '简答题', v: 10, c: 'var(--color-purple)' },
                ].map(t => (
                  <div key={t.l} style={{ background: '#FAFAFA', borderRadius: 7, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: t.c, lineHeight: 1.1 }}>{t.v}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{t.l}</div>
                  </div>
                ))}
              </div>
            </FormRow>

            <FormRow label="难度分布">
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { l: '简单', v: 40, c: 'var(--color-success)' },
                  { l: '中等', v: 50, c: 'var(--color-warning)' },
                  { l: '困难', v: 10, c: 'var(--color-danger)' },
                ].map(d => (
                  <div key={d.l} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span>{d.l}</span>
                      <span style={{ fontWeight: 600, color: d.c }}>{d.v}%</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${d.v}%`, height: '100%', background: d.c }}/>
                    </div>
                  </div>
                ))}
              </div>
            </FormRow>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>题目预览</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}><span>总题数</span><strong style={{ color: 'var(--text-primary)' }}>80</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}><span>总分</span><strong style={{ color: 'var(--text-primary)' }}>100 分</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}><span>预计时长</span><strong style={{ color: 'var(--text-primary)' }}>40 分钟</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}><span>合格分</span><strong style={{ color: 'var(--text-primary)' }}>60 分</strong></div>
              </div>
              <button style={{ width: '100%', marginTop: 12, padding: '6px 0', borderRadius: 6, background: 'var(--bg-selected)', color: 'var(--color-primary)', fontSize: 12, fontWeight: 600 }}>查看全部题目</button>
            </div>

            <div style={{ background: 'rgba(0,122,255,0.05)', borderRadius: 10, padding: 14, border: '1px solid var(--bg-selected)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon name="sparkles" size={14} color="var(--color-primary)"/>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>AI 助手建议</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                根据你选择的题库和分布，建议增加 5 道情境分析题，提升对实战场景的覆盖。
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

function FormRow({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</label>
      {children}
    </div>
  );
}

function A14_TaskProgress() {
  const learners = [
    { n: '张明', i: '张', g: '华东大区', s: 'done', score: 92, t: '32分钟', d: '5月3日 14:22' },
    { n: '李娜', i: '李', g: '华南大区', s: 'done', score: 85, t: '38分钟', d: '5月3日 11:08' },
    { n: '王刚', i: '王', g: '华北大区', s: 'doing', score: null, t: null, d: '5月3日 09:30' },
    { n: '赵丽君', i: '赵', g: '华东大区', s: 'done', score: 78, t: '42分钟', d: '5月2日 16:45' },
    { n: '刘宇航', i: '刘', g: '华北大区', s: 'todo', score: null, t: null, d: '-' },
    { n: '陈雨萱', i: '陈', g: '管理团队', s: 'done', score: 96, t: '28分钟', d: '5月2日 10:15' },
    { n: '徐心怡', i: '徐', g: '西南大区', s: 'done', score: 64, t: '45分钟', d: '5月1日 17:22' },
    { n: '周建国', i: '周', g: '销售中心', s: 'doing', score: null, t: null, d: '今天 09:00' },
  ];
  const statusMap = { done: { l: '已完成', c: 'var(--color-success)' }, doing: { l: '进行中', c: 'var(--color-primary)' }, todo: { l: '未开始', c: 'var(--text-tertiary)' } };
  return (
    <AdminFrame active="tasks-qa" breadcrumb={['培训任务', '知识问答', '产品知识季度考核']} actions={<><AdminBtn variant="secondary" icon="bell">催办</AdminBtn><AdminBtn variant="secondary" icon="download">导出</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>产品知识季度考核</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 12 }}>
              <span>📅 5月1日 — 5月7日</span>
              <span>· 推送给 56 人</span>
              <span>· 创建于 4月28日</span>
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <Pill color="var(--color-success)" size="m">进行中</Pill>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { l: '已完成', v: 41, sub: '73%', c: 'var(--color-success)' },
            { l: '进行中', v: 8, sub: '14%', c: 'var(--color-primary)' },
            { l: '未开始', v: 7, sub: '13%', c: 'var(--text-tertiary)' },
            { l: '平均分', v: 84, sub: '及格率 92%', c: 'var(--color-warning)' },
          ].map(s => (
            <div key={s.l} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.l}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.c, lineHeight: 1.2, margin: '4px 0' }}><AnimatedNumber value={s.v}/></div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderBottom: '1px solid var(--separator)' }}>
            <FilterChip label="状态：全部"/>
            <FilterChip label="分组：全部"/>
            <FilterChip label="分数：全部"/>
            <div style={{ flex: 1 }}/>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>显示 56 / 56 人</span>
          </div>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {['用户', '分组', '状态', '得分', '用时', '提交时间', ''].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {learners.map((u, i) => {
                const lvl = u.score ? getLevel(u.score) : null;
                return (
                  <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #5AC8FA, #007AFF)', color: 'white', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{u.i}</div>
                        <span style={{ fontWeight: 500 }}>{u.n}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.g}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: statusMap[u.s].c }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusMap[u.s].c }}/>
                        {statusMap[u.s].l}
                      </span>
                    </td>
                    <td>{u.score ? <span style={{ fontSize: 15, fontWeight: 700, color: lvl.color }}>{u.score}</span> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</td>
                    <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{u.t || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{u.d}</td>
                    <td style={{ width: 70 }}>{u.s !== 'todo' && <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, cursor: 'pointer' }}>详情</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminFrame>
  );
}

function A18_Reports() {
  return (
    <AdminFrame active="reports" breadcrumb={['数据报表']} actions={<><AdminBtn variant="secondary" icon="filter">筛选</AdminBtn><AdminBtn icon="download">导出报表</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>各分组完成率</div>
              <div style={{ display: 'flex', background: '#F5F5F7', borderRadius: 6, padding: 2 }}>
                {['本周','本月','季度'].map((p, i) => (
                  <div key={p} style={{ padding: '3px 10px', fontSize: 11, fontWeight: 500, borderRadius: 4, background: i === 1 ? 'white' : 'transparent', color: i === 1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{p}</div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { n: '华东大区', total: 22, done: 20, c: 'var(--color-primary)' },
                { n: '华南大区', total: 16, done: 14, c: 'var(--color-success)' },
                { n: '华北大区', total: 18, done: 13, c: 'var(--color-warning)' },
                { n: '西南大区', total: 12, done: 10, c: 'var(--color-purple)' },
                { n: '产品中心', total: 8, done: 8, c: 'var(--color-cyan)' },
              ].map(g => {
                const pct = Math.round(g.done / g.total * 100);
                return (
                  <div key={g.n}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{g.n}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{g.done} / {g.total} · <strong style={{ color: g.c }}>{pct}%</strong></span>
                    </div>
                    <div style={{ height: 8, background: '#F2F2F7', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: g.c, borderRadius: 4, transition: 'width 800ms var(--ease-standard)' }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>分数分布</div>
            <svg viewBox="0 0 280 160" width="100%" height={160}>
              {[
                { x: 30, h: 20, l: '<60', c: 'var(--color-danger)' },
                { x: 80, h: 50, l: '60-69', c: 'var(--color-warning)' },
                { x: 130, h: 90, l: '70-79', c: 'var(--color-primary)' },
                { x: 180, h: 110, l: '80-89', c: 'var(--color-success)' },
                { x: 230, h: 70, l: '≥90', c: 'var(--color-purple)' },
              ].map((b, i) => (
                <g key={i}>
                  <rect x={b.x - 16} y={130 - b.h} width="32" height={b.h} fill={b.c} rx="3"/>
                  <text x={b.x} y={148} textAnchor="middle" fill="var(--text-secondary)" fontSize="10">{b.l}</text>
                  <text x={b.x} y={125 - b.h} textAnchor="middle" fill={b.c} fontSize="10" fontWeight="600">{b.h / 10}人</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>错题 TOP 5（产品知识季度考核）</div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ color: 'var(--text-secondary)', textAlign: 'left' }}>
              {['#', '题目摘要', '知识点', '错误率', '错答分布'].map(h => <th key={h} style={{ fontWeight: 500, padding: '6px 0' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[
                { q: '关于产品 X 的客户分级标准，正确的是…', kp: '产品政策', err: 78 },
                { q: '在合规风险评估流程中，第二步通常是…', kp: '合规流程', err: 65 },
                { q: '面对价格异议，最不推荐的应对方式是…', kp: '销售技巧', err: 58 },
                { q: 'CRM 系统中创建商机的正确路径是…', kp: '系统操作', err: 52 },
                { q: '关于客户隐私保护的核心原则不包括…', kp: '合规风控', err: 47 },
              ].map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)', width: 28 }}>{i + 1}</td>
                  <td style={{ paddingRight: 10 }}>{r.q}</td>
                  <td style={{ width: 100 }}><Pill color="var(--color-primary)" size="xs">{r.kp}</Pill></td>
                  <td style={{ width: 80, fontWeight: 600, color: 'var(--color-danger)' }}>{r.err}%</td>
                  <td style={{ width: 140 }}>
                    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', background: '#F2F2F7' }}>
                      <div style={{ width: '40%', background: 'var(--color-danger)' }}/>
                      <div style={{ width: '30%', background: 'var(--color-warning)' }}/>
                      <div style={{ width: '15%', background: 'var(--color-primary)' }}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminFrame>
  );
}

function SA02_Tenants() {
  const tenants = [
    { n: '某金融科技集团', i: '金', users: 320, plan: '企业版', usage: 84, expire: '2026-12-31', s: 'active' },
    { n: '某制造业集团', i: '制', users: 156, plan: '企业版', usage: 62, expire: '2026-08-15', s: 'active' },
    { n: '某连锁零售品牌', i: '零', users: 88, plan: '标准版', usage: 95, expire: '2025-09-30', s: 'warn' },
    { n: '某医药企业', i: '医', users: 42, plan: '标准版', usage: 28, expire: '2026-03-15', s: 'active' },
    { n: '某地产开发商', i: '地', users: 64, plan: '标准版', usage: 45, expire: '2025-06-15', s: 'expiring' },
  ];
  return (
    <AdminFrame active="tenants" superadmin breadcrumb={['超管', '企业账号']} actions={<AdminBtn icon="plus">创建企业</AdminBtn>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { l: '总企业数', v: 28, sub: '本月 +3', c: 'var(--color-purple)' },
            { l: '总学员数', v: 1842, sub: '+218', c: 'var(--color-primary)' },
            { l: '本月 AI 调用', v: 12480, sub: '+24% MoM', c: 'var(--color-success)' },
            { l: '即将到期', v: 3, sub: '30天内', c: 'var(--color-warning)' },
          ].map(s => (
            <div key={s.l} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.l}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.c, lineHeight: 1.2, margin: '4px 0' }}><AnimatedNumber value={s.v}/></div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#FAFAFA', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              {['企业', '套餐', '用户数', 'AI 用量', '到期时间', '状态', ''].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {tenants.map((t, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: 'linear-gradient(135deg, #AF52DE, #FF2D92)', color: 'white', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.i}</div>
                      <span style={{ fontWeight: 600 }}>{t.n}</span>
                    </div>
                  </td>
                  <td><Pill color={t.plan === '企业版' ? 'var(--color-purple)' : 'var(--color-primary)'} size="xs">{t.plan}</Pill></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{t.users}</td>
                  <td style={{ width: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: '#F2F2F7', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${t.usage}%`, height: '100%', background: t.usage > 90 ? 'var(--color-danger)' : t.usage > 70 ? 'var(--color-warning)' : 'var(--color-success)' }}/>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, width: 30 }}>{t.usage}%</span>
                    </div>
                  </td>
                  <td style={{ color: t.s === 'expiring' ? 'var(--color-warning)' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{t.expire}</td>
                  <td>
                    {t.s === 'active' && <Pill color="var(--color-success)" size="xs">正常</Pill>}
                    {t.s === 'warn' && <Pill color="var(--color-warning)" size="xs">用量超限</Pill>}
                    {t.s === 'expiring' && <Pill color="var(--color-warning)" size="xs">即将到期</Pill>}
                  </td>
                  <td style={{ width: 60 }}><Icon name="more" size={14} color="var(--text-secondary)"/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminFrame>
  );
}

window.A07_Banks = A07_Banks;
window.A10_Personas = A10_Personas;
window.A12_TaskCreator = A12_TaskCreator;
window.A14_TaskProgress = A14_TaskProgress;
window.A18_Reports = A18_Reports;
window.SA02_Tenants = SA02_Tenants;
window.FormRow = FormRow;
