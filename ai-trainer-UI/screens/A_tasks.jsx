// Batch 5 · 任务管理补全
// A11 任务列表 (双 Tab), A12b 基本信息, A12c 考核规则, A12d 推送范围, A13 对练任务创建（角色选择步骤）

// =================================================================
// A11 · 任务列表 — 知识问答 / 模拟对练 双 Tab
// =================================================================
function A11_TaskList() {
  const [tab, setTab] = useState(0);
  const qaTasks = [
    { n: '产品知识季度考核', cat: '产品', s: 'live', total: 56, done: 41, avg: 84, due: '5/7 18:00', urg: true },
    { n: '合规与风控基础', cat: '合规', s: 'live', total: 72, done: 28, avg: 76, due: '5/12' },
    { n: '新员工入职考核', cat: '通用', s: 'live', total: 24, done: 18, avg: 91, due: '5/10' },
    { n: 'CRM 系统使用考核', cat: '系统', s: 'done', total: 56, done: 56, avg: 88, due: '已结束 4/30' },
    { n: '客户分级管理', cat: '产品', s: 'draft', total: 0, done: 0, avg: null, due: '草稿' },
  ];
  const rpTasks = [
    { n: '大客户拜访模拟', persona: 4, s: 'live', total: 32, done: 22, avg: 82, due: '5/15' },
    { n: '价格异议处理', persona: 3, s: 'live', total: 56, done: 38, avg: 79, due: '5/20' },
    { n: '售后投诉处理', persona: 2, s: 'done', total: 24, done: 24, avg: 86, due: '已结束 4/28' },
  ];
  const sm = { live: { l: '进行中', c: 'var(--color-success)' }, done: { l: '已结束', c: 'var(--text-secondary)' }, draft: { l: '草稿', c: 'var(--color-warning)' } };
  return (
    <AdminFrame active={tab === 0 ? 'tasks-qa' : 'tasks-rp'} breadcrumb={['培训任务', tab === 0 ? '知识问答' : '模拟对练']}
      actions={<><AdminBtn variant="secondary" icon="filter">高级筛选</AdminBtn><AdminBtn icon="plus">新建任务</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { l: '总任务', v: 28, sub: '本月 +6', c: 'var(--color-primary)' },
            { l: '进行中', v: 12, sub: '覆盖 240 人', c: 'var(--color-success)' },
            { l: '完成率', v: 78, sub: '团队均值', c: 'var(--color-warning)', suf: '%' },
            { l: '即将截止', v: 3, sub: '24 小时内', c: 'var(--color-danger)' },
          ].map(s => (
            <div key={s.l} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.l}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.c, lineHeight: 1.2, margin: '4px 0' }}><AnimatedNumber value={s.v}/>{s.suf || ''}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
          <div style={{ borderBottom: '1px solid var(--separator)', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
            {[{ l: '知识问答', c: qaTasks.length, i: 'bookOpen' }, { l: '模拟对练', c: rpTasks.length, i: 'chatBubble' }].map((t, i) => (
              <div key={t.l} onClick={() => setTab(i)} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: tab === i ? 'var(--color-primary)' : 'var(--text-secondary)', borderBottom: tab === i ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -1, cursor: 'pointer' }}>
                <Icon name={t.i} size={14}/>
                {t.l}
                <span style={{ background: tab === i ? 'var(--bg-selected)' : '#F2F2F7', color: tab === i ? 'var(--color-primary)' : 'var(--text-secondary)', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 9 }}>{t.c}</span>
              </div>
            ))}
            <div style={{ flex: 1 }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FilterChip label="状态：全部"/>
              <FilterChip label="时间：本月"/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F5F5F7', borderRadius: 7, fontSize: 12, color: 'var(--text-secondary)', width: 200 }}>
                <Icon name="search" size={12}/> 搜索任务名...
              </div>
            </div>
          </div>

          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {(tab === 0 ? ['任务', '分类', '状态', '完成进度', '平均分', '截止', ''] : ['任务', '虚拟角色', '状态', '完成进度', '平均分', '截止', '']).map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {(tab === 0 ? qaTasks : rpTasks).map((t, i) => {
                const pct = t.total > 0 ? Math.round(t.done / t.total * 100) : 0;
                return (
                  <tr key={i} style={{ borderTop: '1px solid var(--separator)' }}>
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 7, background: tab === 0 ? 'rgba(0,122,255,0.10)' : 'rgba(52,199,89,0.10)', color: tab === 0 ? 'var(--color-primary)' : 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name={tab === 0 ? 'bookOpen' : 'chatBubble'} size={15}/>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>{t.n}{t.urg && <Pill color="var(--color-danger)" size="xs">紧急</Pill>}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>4 月 28 日 创建 · 由陈雨萱</div>
                        </div>
                      </div>
                    </td>
                    {tab === 0 ? (
                      <td><Pill color="var(--color-primary)" size="xs">{t.cat}</Pill></td>
                    ) : (
                      <td>
                        <div style={{ display: 'flex' }}>
                          {Array.from({ length: t.persona }).map((_, j) => (
                            <div key={j} style={{ width: 24, height: 24, borderRadius: '50%', background: ['linear-gradient(135deg, #FF9500, #FF6B00)','linear-gradient(135deg, #AF52DE, #FF2D92)','linear-gradient(135deg, #34C759, #30B0C7)','linear-gradient(135deg, #5AC8FA, #007AFF)'][j], border: '2px solid white', marginLeft: j ? -8 : 0, color: 'white', fontWeight: 600, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{['李','王','陈','苏'][j]}</div>
                          ))}
                          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)', alignSelf: 'center' }}>{t.persona} 个</span>
                        </div>
                      </td>
                    )}
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: sm[t.s].c }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm[t.s].c }}/>
                        {sm[t.s].l}
                      </span>
                    </td>
                    <td style={{ width: 200 }}>
                      {t.total > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: '#F2F2F7', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-primary)' : 'var(--color-warning)' }}/>
                          </div>
                          <span style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>{t.done}/{t.total}</span>
                        </div>
                      ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                    </td>
                    <td>{t.avg ? <span style={{ fontSize: 14, fontWeight: 700, color: getLevel(t.avg).color }}>{t.avg}</span> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</td>
                    <td style={{ color: t.urg ? 'var(--color-danger)' : 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', fontWeight: t.urg ? 600 : 400 }}>{t.due}</td>
                    <td style={{ width: 90 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, cursor: 'pointer' }}>查看</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>···</span>
                      </div>
                    </td>
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

function StepBar({ steps, active }) {
  return (
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
  );
}

// =================================================================
// A12b · 任务创建 · 基本信息
// =================================================================
function A12b_TaskBasic() {
  const steps = ['基本信息', '题目配置', '考核规则', '推送范围', '预览发布'];
  return (
    <AdminFrame active="tasks-qa" breadcrumb={['培训任务', '知识问答', '新建任务']}
      actions={<><AdminBtn variant="ghost">取消</AdminBtn><AdminBtn variant="secondary">存为草稿</AdminBtn><AdminBtn icon="arrowRight">下一步</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <StepBar steps={steps} active={0}/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>基本信息</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>填写任务基本信息，让学员清楚知道这是一个怎样的任务</div>
            </div>

            <FormRow label="任务名称 *">
              <input defaultValue="产品知识季度考核" style={{ height: 38, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13 }}/>
            </FormRow>

            <FormRow label="任务描述">
              <textarea defaultValue="覆盖 2025 Q2 新发布的企业级产品知识。请先完成边学边练，再进行正式考核。" style={{ minHeight: 70, padding: 10, borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}/>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>32 / 200 字</div>
            </FormRow>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormRow label="所属分类 *">
                <select defaultValue="产品知识" style={{ height: 38, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13 }}>
                  <option>产品知识</option><option>合规风控</option><option>销售技巧</option><option>系统使用</option><option>新员工入职</option>
                </select>
              </FormRow>
              <FormRow label="任务类型">
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ l: '考核任务', s: true, d: '有合格分' }, { l: '日常练习', d: '不计分' }].map(o => (
                    <div key={o.l} style={{ flex: 1, padding: 10, borderRadius: 7, border: o.s ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: o.s ? 'var(--bg-selected)' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{o.l}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{o.d}</div>
                    </div>
                  ))}
                </div>
              </FormRow>
            </div>

            <FormRow label="学习模式 · 决定学员看到的环节">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: '边学边练 → 正式考核', d: '学员先用资料 + 题目练习巩固，达到练习要求后解锁正式考核', s: true },
                  { l: '仅正式考核', d: '学员直接进入正式考核，无练习环节' },
                  { l: '仅边学边练', d: '只有练习模式，不强制考核（适合日常学习）' },
                ].map(o => (
                  <div key={o.l} style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 8, border: o.s ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: o.s ? 'var(--bg-selected)' : 'white', cursor: 'pointer' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: o.s ? '5px solid var(--color-primary)' : '1.5px solid var(--border-strong)', background: 'white', flexShrink: 0, marginTop: 2 }}/>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{o.l}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{o.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FormRow>

            <FormRow label="关联学习资料 · 学员在边学边练时会看到">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { n: '《产品 X 企业版手册.pdf》', t: 'PDF', sz: '4.2 MB', sel: true },
                  { n: '《2025 Q2 产品对比表.xlsx》', t: 'Excel', sz: '128 KB', sel: true },
                  { n: '《客户案例集 · 制造业.pdf》', t: 'PDF', sz: '8.6 MB', sel: true },
                ].map(f => (
                  <div key={f.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#FAFAFA', borderRadius: 7 }}>
                    <Icon name="doc" size={14} color="var(--color-primary)"/>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{f.n}</span>
                    <Pill color="var(--color-primary)" size="xs">{f.t}</Pill>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.sz}</span>
                    <Icon name="close" size={12} color="var(--text-tertiary)"/>
                  </div>
                ))}
                <button style={{ padding: '10px 12px', borderRadius: 7, border: '1px dashed var(--border-strong)', background: 'transparent', color: 'var(--color-primary)', fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="plus" size={12}/> 从文件库添加
                </button>
              </div>
            </FormRow>

            <FormRow label="任务封面（可选）">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 110, height: 70, borderRadius: 8, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <Icon name="bookOpen" size={26}/>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, borderRadius: 6, background: '#F2F2F7' }}>更换封面</button>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>支持 JPG / PNG，建议 1200×600</span>
                </div>
              </div>
            </FormRow>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>学员预览（移动端）</div>
              <div style={{ borderRadius: 12, border: '1px solid var(--separator)', padding: 14 }}>
                <div style={{ height: 90, borderRadius: 8, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: 10 }}>
                  <Icon name="bookOpen" size={28}/>
                </div>
                <Pill color="var(--color-primary)" size="xs">知识问答</Pill>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6, marginBottom: 4 }}>产品知识季度考核</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>覆盖 2025 Q2 新发布的企业级产品知识。请先完成边学边练，再进行正式考核。</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <span>📚 3 份资料</span>
                  <span>·</span>
                  <span>📝 边学边练 + 考核</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,122,255,0.05)', borderRadius: 10, padding: 14, border: '1px solid var(--bg-selected)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--color-primary)' }}>
                <Icon name="sparkles" size={14}/>
                <div style={{ fontSize: 12, fontWeight: 600 }}>AI 助手建议</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                你已选择的 3 份资料覆盖度较好，可在下一步基于这些资料一键生成题目。
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A12c · 任务创建 · 考核规则
// =================================================================
function A12c_TaskRules() {
  const steps = ['基本信息', '题目配置', '考核规则', '推送范围', '预览发布'];
  return (
    <AdminFrame active="tasks-qa" breadcrumb={['培训任务', '知识问答', '新建任务']}
      actions={<><AdminBtn variant="ghost">取消</AdminBtn><AdminBtn variant="secondary" icon="arrowLeft">上一步</AdminBtn><AdminBtn icon="arrowRight">下一步</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <StepBar steps={steps} active={2}/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>分数与等级</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { l: '满分', v: 100, c: 'var(--text-primary)', sub: '由题目权重总和' },
                  { l: '合格分', v: 60, c: 'var(--color-warning)', sub: '低于此分判定不合格' },
                  { l: '优秀分', v: 90, c: 'var(--color-success)', sub: '达到此分获得优秀徽章' },
                ].map(d => (
                  <div key={d.l} style={{ background: '#FAFAFA', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.l}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '6px 0' }}>
                      <input defaultValue={d.v} style={{ width: 60, height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 18, fontWeight: 700, textAlign: 'center', color: d.c, background: 'white' }}/>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>分</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{d.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 40, background: 'linear-gradient(90deg, var(--color-danger) 0%, var(--color-danger) 60%, var(--color-warning) 60%, var(--color-warning) 90%, var(--color-success) 90%)', borderRadius: 6, position: 'relative' }}>
                <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: 2, background: 'white' }}/>
                <div style={{ position: 'absolute', left: '90%', top: 0, bottom: 0, width: 2, background: 'white' }}/>
                <div style={{ position: 'absolute', left: '30%', top: 12, color: 'white', fontSize: 11, fontWeight: 600 }}>不合格 0-59</div>
                <div style={{ position: 'absolute', left: '67%', top: 12, color: 'white', fontSize: 11, fontWeight: 600 }}>合格 60-89</div>
                <div style={{ position: 'absolute', left: '91%', top: 12, color: 'white', fontSize: 11, fontWeight: 600 }}>优秀</div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>时限与次数</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormRow label="单次答题时限">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input defaultValue="40" style={{ flex: 1, height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 13, textAlign: 'center' }}/>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>分钟</span>
                  </div>
                </FormRow>
                <FormRow label="允许补考次数">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['0', '1', '2', '不限'].map((n, i) => (
                      <div key={n} style={{ flex: 1, height: 36, borderRadius: 6, border: i === 1 ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: i === 1 ? 'var(--bg-selected)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: i === 1 ? 'var(--color-primary)' : 'var(--text-primary)', cursor: 'pointer' }}>{n}</div>
                    ))}
                  </div>
                </FormRow>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormRow label="边学边练通过门槛">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>正确率 ≥</span>
                    <input defaultValue="80" style={{ width: 60, height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 13, textAlign: 'center' }}/>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>% 才解锁正式考核</span>
                  </div>
                </FormRow>
                <FormRow label="任务起止时间">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <input defaultValue="2025-05-01" style={{ flex: 1, height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 12 }}/>
                    <span style={{ color: 'var(--text-secondary)' }}>—</span>
                    <input defaultValue="2025-05-07" style={{ flex: 1, height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 12 }}/>
                  </div>
                </FormRow>
              </div>

              <FormRow label="高级选项">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { l: '允许暂存退出', d: '学员可保存进度后退出，下次继续作答', on: true },
                    { l: '题目顺序随机', d: '每个学员看到的题序不同，避免抄答案', on: true },
                    { l: '选项顺序随机', d: '单选/多选的选项顺序也随机化', on: false },
                    { l: '反作弊监测', d: '记录切屏、退出全屏行为', on: true },
                    { l: '考核结束前不允许查看答案', d: '提交后才显示正确答案与解析', on: true },
                  ].map(it => (
                    <div key={it.l} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#FAFAFA', borderRadius: 7, gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{it.l}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{it.d}</div>
                      </div>
                      <div style={{ flex: 1 }}/>
                      <div style={{ width: 36, height: 22, borderRadius: 11, background: it.on ? 'var(--color-success)' : '#C7C7CC', position: 'relative', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 2, left: it.on ? 16 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left 200ms' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </FormRow>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>规则摘要</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                {[
                  { l: '满分', v: '100 分' },
                  { l: '合格分', v: '60 分', c: 'var(--color-warning)' },
                  { l: '优秀分', v: '90 分', c: 'var(--color-success)' },
                  { l: '答题时限', v: '40 分钟' },
                  { l: '允许补考', v: '1 次' },
                  { l: '边练门槛', v: '80% 正确率' },
                  { l: '任务有效期', v: '5/1 — 5/7' },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--separator)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.l}</span>
                    <strong style={{ color: r.c || 'var(--text-primary)' }}>{r.v}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A12d · 任务创建 · 推送范围
// =================================================================
function A12d_TaskAudience() {
  const steps = ['基本信息', '题目配置', '考核规则', '推送范围', '预览发布'];
  return (
    <AdminFrame active="tasks-qa" breadcrumb={['培训任务', '知识问答', '新建任务']}
      actions={<><AdminBtn variant="ghost">取消</AdminBtn><AdminBtn variant="secondary" icon="arrowLeft">上一步</AdminBtn><AdminBtn icon="arrowRight">下一步：预览</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <StepBar steps={steps} active={3}/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>推送范围</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>选择本次任务推送给哪些用户</div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { l: '按分组', d: '推荐：覆盖整个组织树', s: true, i: 'folder' },
                { l: '按用户', d: '逐个挑选个人', i: 'person' },
                { l: '按标签', d: '筛选符合标签的用户', i: 'filter' },
                { l: '全员', d: '推给所有学员', i: 'house' },
              ].map(o => (
                <div key={o.l} style={{ flex: 1, padding: 12, borderRadius: 8, border: o.s ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: o.s ? 'var(--bg-selected)' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Icon name={o.i} size={16} color={o.s ? 'var(--color-primary)' : 'var(--text-secondary)'}/>
                  <div style={{ fontSize: 13, fontWeight: 600, color: o.s ? 'var(--color-primary)' : 'var(--text-primary)' }}>{o.l}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{o.d}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>组织树 · 可选范围</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'white', borderRadius: 6, marginBottom: 8 }}>
                  <Icon name="search" size={12} color="var(--text-secondary)"/>
                  <input placeholder="搜索分组或成员..." style={{ flex: 1, height: 22, border: 'none', outline: 'none', fontSize: 12, background: 'transparent' }}/>
                </div>
                <div style={{ flex: 1, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { l: '某金融科技集团', dep: 0, exp: true, count: 320 },
                    { l: '销售中心', dep: 1, exp: true, count: 180, checked: 'partial' },
                    { l: '华东大区', dep: 2, count: 56, checked: true },
                    { l: '华南大区', dep: 2, count: 42, checked: true },
                    { l: '华北大区', dep: 2, count: 48, checked: false },
                    { l: '西南大区', dep: 2, count: 34 },
                    { l: '产品中心', dep: 1, count: 64 },
                    { l: '管理团队', dep: 1, count: 12 },
                  ].map((n, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 5, background: n.checked === true ? 'var(--bg-selected)' : 'transparent', marginLeft: n.dep * 18 }}>
                      {n.exp !== undefined && <Icon name="chevronRight" size={10} color="var(--text-secondary)" style={{ transform: n.exp ? 'rotate(90deg)' : 'none' }}/>}
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid', borderColor: n.checked ? 'var(--color-primary)' : 'var(--border-strong)', background: n.checked === true ? 'var(--color-primary)' : n.checked === 'partial' ? 'var(--color-primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {n.checked === true && <Icon name="check" size={9} color="white" strokeWidth={3}/>}
                        {n.checked === 'partial' && <span style={{ width: 6, height: 2, background: 'white' }}/>}
                      </div>
                      <Icon name={n.exp !== undefined ? 'folder' : 'person'} size={12} color="var(--text-secondary)"/>
                      <span style={{ flex: 1, fontWeight: n.dep === 0 ? 700 : 500 }}>{n.l}</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{n.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(0,122,255,0.04)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 0.4, textTransform: 'uppercase' }}>已选 · 56 人</div>
                  <div style={{ flex: 1 }}/>
                  <button style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 500 }}>清空</button>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { t: 'group', n: '华东大区', c: 56 },
                    { t: 'group', n: '华南大区', c: 42 },
                  ].map((g, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'white', borderRadius: 5, fontSize: 12 }}>
                      <Icon name="folder" size={12} color="var(--color-primary)"/>
                      <span style={{ flex: 1, fontWeight: 500 }}>{g.n}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{g.c} 人</span>
                      <Icon name="close" size={11} color="var(--text-tertiary)"/>
                    </div>
                  ))}
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>排除 2 人（休假）</div>
                  {[
                    { n: '王刚', dep: '华北大区' },
                    { n: '徐心怡', dep: '西南大区' },
                  ].map((u, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'white', borderRadius: 5, fontSize: 12, opacity: 0.7 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#F2F2F7', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{u.n[0]}</div>
                      <span style={{ flex: 1 }}>{u.n}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>排除</span>
                      <Icon name="close" size={11} color="var(--text-tertiary)"/>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <FormRow label="推送方式">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { l: '站内通知', d: '学员登录系统时看到红点', on: true },
                  { l: '企业微信 / 钉钉 推送', d: '需要在企业设置中绑定', on: true },
                  { l: '短信提醒', d: '每条 0.05 元，从配额扣除', on: false },
                ].map(it => (
                  <div key={it.l} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#FAFAFA', borderRadius: 7, gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{it.l}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{it.d}</div>
                    </div>
                    <div style={{ flex: 1 }}/>
                    <div style={{ width: 36, height: 22, borderRadius: 11, background: it.on ? 'var(--color-success)' : '#C7C7CC', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 2, left: it.on ? 16 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </FormRow>

            <FormRow label="发布时机">
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ l: '立即发布', s: true }, { l: '定时发布' }].map(o => (
                  <div key={o.l} style={{ flex: 1, padding: 10, borderRadius: 7, border: o.s ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: o.s ? 'var(--bg-selected)' : 'white', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: o.s ? 'var(--color-primary)' : 'var(--text-primary)' }}>{o.l}</div>
                ))}
              </div>
            </FormRow>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>推送对象统计</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>56</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>位学员将收到此任务</div>
              <div style={{ height: 1, background: 'var(--separator)', margin: '12px 0' }}/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                {[{ l: '华东大区', c: 56 }, { l: '华南大区', c: 42 }, { l: '排除', c: -2, danger: true }].map(s => (
                  <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{s.l}</span>
                    <strong style={{ color: s.danger ? 'var(--color-danger)' : 'var(--text-primary)' }}>{s.c > 0 ? '+' : ''}{s.c} 人</strong>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(255,149,0,0.06)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,149,0,0.20)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-warning)' }}>
                <Icon name="warning" size={13}/>
                <div style={{ fontSize: 12, fontWeight: 600 }}>提醒</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                其中 8 位学员同时被推送了《合规与风控基础》，本周任务量较大。
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A13 · 模拟对练任务创建 · 角色选择步骤
// =================================================================
function A13_RoleplayTaskCreator() {
  const steps = ['基本信息', '角色与场景', '评分维度', '推送范围', '预览发布'];
  return (
    <AdminFrame active="tasks-rp" breadcrumb={['培训任务', '模拟对练', '新建任务']}
      actions={<><AdminBtn variant="ghost">取消</AdminBtn><AdminBtn variant="secondary" icon="arrowLeft">上一步</AdminBtn><AdminBtn icon="arrowRight">下一步：评分</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <StepBar steps={steps} active={1}/>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>选择虚拟角色</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>学员可从这些角色中挑选 1 个进行对练 · 至少选 2 个，最多 6 个</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FilterChip label="行业：制造业 · 金融业"/>
                <FilterChip label="难度：全部"/>
                <FilterChip label="风格：全部"/>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已选 3 / 6</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[...MOCK_PERSONAS, ...MOCK_PERSONAS.slice(0, 2)].map((p, i) => {
                  const sel = i === 0 || i === 1 || i === 3;
                  return (
                    <div key={i} style={{ background: sel ? 'var(--bg-selected)' : 'white', borderRadius: 10, padding: 14, border: sel ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {sel && <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={11} strokeWidth={3}/></div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: p.avatar.bg, color: 'white', fontWeight: 600, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.avatar.initial}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}，{p.age}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.industry}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.title}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.style.slice(0, 2).map(s => <Pill key={s} color="var(--color-primary)" size="xs">{s}</Pill>)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6, borderTop: '1px solid var(--separator)', fontSize: 10, color: 'var(--text-tertiary)' }}>
                        <span>难度 {['中', '高', '中', '高', '中'][i] || '中'}</span>
                        <span>·</span>
                        <span>已用 {2 + (i % 3)} 次</span>
                      </div>
                    </div>
                  );
                })}
                <div style={{ background: 'transparent', borderRadius: 10, padding: 14, border: '1px dashed var(--border-strong)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-secondary)', minHeight: 140 }}>
                  <Icon name="plus" size={18}/>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>新建角色</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>对话场景</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>统一适用于所有所选角色 · 也可以为单个角色单独设定</div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { l: '初次拜访', s: true },
                  { l: '需求挖掘' },
                  { l: '价格谈判' },
                  { l: '异议处理' },
                  { l: '售后投诉' },
                  { l: '自定义' },
                ].map(o => (
                  <div key={o.l} style={{ padding: '8px 14px', borderRadius: 18, background: o.s ? 'var(--color-primary)' : '#FAFAFA', color: o.s ? 'white' : 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{o.l}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormRow label="开场情境">
                  <textarea defaultValue="客户的办公室。你刚完成季度运营会议，时间很紧。销售来介绍解决方案，你只给 30 分钟。" style={{ minHeight: 80, padding: 10, borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 12, fontFamily: 'inherit' }}/>
                </FormRow>
                <FormRow label="学员的目标">
                  <textarea defaultValue="清晰陈述产品三大差异化优势；引用至少一个真实客户案例；有效应对至少 2 项异议；推动客户进入下一步行动。" style={{ minHeight: 80, padding: 10, borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 12, fontFamily: 'inherit' }}/>
                </FormRow>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormRow label="对话长度">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['8 轮', '12 轮', '15 轮', '不限'].map((n, i) => (
                      <div key={n} style={{ flex: 1, height: 34, borderRadius: 6, border: i === 1 ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: i === 1 ? 'var(--bg-selected)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: i === 1 ? 'var(--color-primary)' : 'var(--text-primary)', cursor: 'pointer' }}>{n}</div>
                    ))}
                  </div>
                </FormRow>
                <FormRow label="单次时限">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input defaultValue="25" style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 13, textAlign: 'center' }}/>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>分钟</span>
                  </div>
                </FormRow>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
            <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>已选角色 · 3</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[MOCK_PERSONAS[0], MOCK_PERSONAS[1], MOCK_PERSONAS[3]].map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#FAFAFA', borderRadius: 7 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: p.avatar.bg, color: 'white', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.avatar.initial}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{p.industry}</div>
                    </div>
                    <Icon name="close" size={12} color="var(--text-tertiary)"/>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(0,122,255,0.05)', borderRadius: 10, padding: 14, border: '1px solid var(--bg-selected)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--color-primary)' }}>
                <Icon name="sparkles" size={14}/>
                <div style={{ fontSize: 12, fontWeight: 600 }}>AI 助手建议</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                你选了 2 个制造业 + 1 个金融业角色，难度梯度合理。建议补充一个零售连锁角色，覆盖更多细分场景。
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

window.A11_TaskList = A11_TaskList;
window.A12b_TaskBasic = A12b_TaskBasic;
window.A12c_TaskRules = A12c_TaskRules;
window.A12d_TaskAudience = A12d_TaskAudience;
window.A13_RoleplayTaskCreator = A13_RoleplayTaskCreator;
window.StepBar = StepBar;
