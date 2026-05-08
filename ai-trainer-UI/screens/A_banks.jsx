// 题库完整流程 · Batch 2
// A08 题库详情, A08a 新建题库 Modal, A08b AI 批量生成 Modal,
// A08c 批量导入, A08d 单题编辑 Drawer

// ============ shared mock ============
const MOCK_BANK_QUESTIONS = [
  {
    id: 'q1', no: 1, type: '单选', diff: '简单', weight: 2, kp: '产品政策',
    text: '关于产品 X 的客户分级标准，下列哪一项是正确的？',
    options: [
      { l: 'A', t: '按照客户年采购额划分为 4 个等级', correct: true },
      { l: 'B', t: '按照客户行业划分为 3 个等级', correct: false },
      { l: 'C', t: '按照客户地理区域划分为 5 个等级', correct: false },
      { l: 'D', t: '不进行客户分级', correct: false },
    ],
    answer: 'A',
    analysis: '产品 X 采用基于年采购额（≥500万、200-500万、50-200万、<50万）的四级客户分级体系。',
  },
  { id: 'q2', no: 2, type: '多选', diff: '中等', weight: 4, kp: '合规流程', text: '合规风险评估流程包含以下哪些步骤？（多选）' },
  { id: 'q3', no: 3, type: '判断', diff: '简单', weight: 1, kp: '产品基础', text: '产品 X 支持私有化部署且通过等保三级认证。' },
  { id: 'q4', no: 4, type: '简答', diff: '困难', weight: 5, kp: '销售技巧', text: '请描述面对价格异议时的三种推荐应对方式。' },
  { id: 'q5', no: 5, type: '单选', diff: '中等', weight: 2, kp: '系统操作', text: 'CRM 系统中创建商机的正确路径是？' },
  { id: 'q6', no: 6, type: '单选', diff: '简单', weight: 2, kp: '产品政策', text: '产品 X 的标准售后服务响应时间是？' },
];

const TYPE_COLORS = {
  '单选': 'var(--color-primary)', '多选': 'var(--color-purple)',
  '判断': 'var(--color-success)', '简答': 'var(--color-warning)',
};
const DIFF_COLORS = {
  '简单': 'var(--color-success)', '中等': 'var(--color-warning)', '困难': 'var(--color-danger)',
};

// =================================================================
// A08 · 题库详情
// =================================================================
function A08_BankDetail() {
  return (
    <AdminFrame active="banks" breadcrumb={['内容管理', '题库管理', '产品知识题库']}
      actions={<><AdminBtn variant="secondary" icon="upload">批量导入</AdminBtn><AdminBtn variant="secondary" icon="sparkles">AI 生成</AdminBtn><AdminBtn icon="plus">添加题目</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 概览卡 */}
        <div style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(0,122,255,0.10)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bookOpen" size={26}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>产品知识题库</div>
              <Pill color="var(--color-primary)" size="xs">产品</Pill>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>覆盖产品功能、价格、案例、政策的全套知识点 · 创建于 2025-03-12 · 最近编辑 5 月 1 日</div>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            {[
              { l: '题目总数', v: 248, c: 'var(--text-primary)' },
              { l: '已使用任务', v: 12, c: 'var(--color-primary)' },
              { l: '平均正确率', v: '76%', c: 'var(--color-success)' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.c, lineHeight: 1.1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 分布 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: 0.4, textTransform: 'uppercase' }}>题型分布</div>
            <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: '52%', background: TYPE_COLORS['单选'] }}/>
              <div style={{ width: '20%', background: TYPE_COLORS['多选'] }}/>
              <div style={{ width: '15%', background: TYPE_COLORS['判断'] }}/>
              <div style={{ width: '13%', background: TYPE_COLORS['简答'] }}/>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              {[['单选', 129], ['多选', 50], ['判断', 37], ['简答', 32]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[l] }}/>
                  <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: 0.4, textTransform: 'uppercase' }}>知识点分布</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                ['产品政策', 56], ['产品功能', 42], ['客户案例', 38], ['销售技巧', 28],
                ['合规风控', 24], ['竞品对比', 18], ['行业知识', 16], ['系统操作', 12], ['其他', 14],
              ].map(([l, n]) => (
                <span key={l} style={{ padding: '5px 10px', borderRadius: 12, background: '#FAFAFA', border: '1px solid var(--separator)', fontSize: 11, color: 'var(--text-primary)' }}>
                  {l} <strong style={{ color: 'var(--color-primary)', marginLeft: 4 }}>{n}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 题目折叠列表 */}
        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, borderBottom: '1px solid var(--separator)' }}>
            <FilterChip label="题型：全部"/>
            <FilterChip label="难度：全部"/>
            <FilterChip label="知识点：全部"/>
            <div style={{ flex: 1 }}/>
            <div style={{ width: 220, height: 28, padding: '0 10px', background: '#FAFAFA', borderRadius: 6, border: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
              <Icon name="search" size={12}/> 搜索题目内容...
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* expanded */}
            <div style={{ borderBottom: '1px solid var(--separator)' }}>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--bg-selected)' }}>
                <Icon name="chevronRight" size={14} color="var(--color-primary)" style={{ transform: 'rotate(90deg)', marginTop: 4 }}/>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'white', color: 'var(--color-primary)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>01</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <Pill color={TYPE_COLORS[MOCK_BANK_QUESTIONS[0].type]} size="xs">{MOCK_BANK_QUESTIONS[0].type}</Pill>
                    <Pill color={DIFF_COLORS[MOCK_BANK_QUESTIONS[0].diff]} size="xs">{MOCK_BANK_QUESTIONS[0].diff}</Pill>
                    <Pill color="var(--text-secondary)" size="xs">{MOCK_BANK_QUESTIONS[0].kp}</Pill>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-secondary)' }}>分值 {MOCK_BANK_QUESTIONS[0].weight} · 正确率 82%</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{MOCK_BANK_QUESTIONS[0].text}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Icon name="edit" size={14} color="var(--color-primary)"/>
                  <Icon name="more" size={14} color="var(--text-secondary)"/>
                </div>
              </div>
              <div style={{ padding: '4px 16px 16px 70px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MOCK_BANK_QUESTIONS[0].options.map(o => (
                  <div key={o.l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, background: o.correct ? 'rgba(52,199,89,0.08)' : '#FAFAFA', border: o.correct ? '1px solid var(--color-success)' : '1px solid transparent' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: o.correct ? 'var(--color-success)' : 'white', color: o.correct ? 'white' : 'var(--text-secondary)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: o.correct ? 'none' : '1px solid var(--border-strong)' }}>{o.l}</div>
                    <div style={{ flex: 1, fontSize: 13 }}>{o.t}</div>
                    {o.correct && <Pill color="var(--color-success)" size="xs">正确答案</Pill>}
                  </div>
                ))}
                <div style={{ marginTop: 4, padding: '10px 12px', background: 'rgba(0,122,255,0.05)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--color-primary)' }}>解析 · </strong>{MOCK_BANK_QUESTIONS[0].analysis}
                </div>
              </div>
            </div>

            {/* collapsed rows */}
            {MOCK_BANK_QUESTIONS.slice(1).map(q => (
              <div key={q.id} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--separator)' }}>
                <Icon name="chevronRight" size={14} color="var(--text-tertiary)"/>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FAFAFA', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{String(q.no).padStart(2, '0')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <Pill color={TYPE_COLORS[q.type]} size="xs">{q.type}</Pill>
                    <Pill color={DIFF_COLORS[q.diff]} size="xs">{q.diff}</Pill>
                    <Pill color="var(--text-secondary)" size="xs">{q.kp}</Pill>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>分值 {q.weight}</span>
                <Icon name="more" size={14} color="var(--text-secondary)"/>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>显示 1 - 6，共 248 题</span>
            <div style={{ flex: 1 }}/>
            {['上一页', '1', '2', '3', '...', '42', '下一页'].map((p, i) => (
              <span key={i} style={{ padding: '3px 9px', borderRadius: 5, background: p === '1' ? 'var(--color-primary)' : 'transparent', color: p === '1' ? 'white' : 'var(--text-secondary)', fontWeight: p === '1' ? 600 : 500, cursor: 'pointer', border: p !== '1' ? '1px solid var(--separator)' : 'none' }}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A08a · 新建题库 Modal（三入口选择）
// =================================================================
function A08a_BankCreateModal() {
  const options = [
    { id: 'manual', icon: 'edit', title: '手工录入', desc: '逐题手动添加，适合精细把控的小批量题目', meta: '约 1-2 分钟 / 题', sel: false },
    { id: 'import', icon: 'upload', title: '批量导入', desc: '上传 Excel / CSV 文件批量创建，支持模板下载', meta: '一次最多 500 题', sel: true },
    { id: 'ai', icon: 'sparkles', title: 'AI 批量生成', desc: '基于已上传材料，AI 自动生成题目并由你审核', meta: '5-10 秒 / 题', sel: false, recommended: true },
  ];
  return (
    <AdminFrame active="banks" breadcrumb={['内容管理', '题库管理']} actions={<><AdminBtn variant="secondary" icon="upload">批量导入</AdminBtn><AdminBtn icon="plus">新建题库</AdminBtn></>}>
      {/* underlying list dimmed */}
      <div style={{ padding: 20, opacity: 0.4, pointerEvents: 'none', filter: 'blur(2px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)', height: 140 }}/>
          ))}
        </div>
      </div>
      {/* modal */}
      <div style={{ position: 'absolute', inset: 0, top: 44, background: 'rgba(0,0,0,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 620, background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-3)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>新建题库</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>选择题目录入方式 · 后续可继续添加</div>
            </div>
            <div style={{ flex: 1 }}/>
            <Icon name="close" size={18} color="var(--text-secondary)"/>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormRow label="题库名称">
              <input defaultValue="2025 Q3 产品知识题库" style={{ height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13 }}/>
            </FormRow>
            <FormRow label="分类标签">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['产品', '合规', '系统', '销售', '行业', '通用'].map((t, i) => (
                  <span key={t} style={{ padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: 500, background: i === 0 ? 'var(--color-primary)' : '#FAFAFA', color: i === 0 ? 'white' : 'var(--text-primary)', border: i === 0 ? 'none' : '1px solid var(--border-strong)', cursor: 'pointer' }}>{t}</span>
                ))}
              </div>
            </FormRow>

            <FormRow label="题目录入方式">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map(o => (
                  <div key={o.id} style={{ position: 'relative', padding: 14, borderRadius: 9, border: o.sel ? '2px solid var(--color-primary)' : '1px solid var(--border-strong)', background: o.sel ? 'var(--bg-selected)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: o.sel ? 'var(--color-primary)' : 'rgba(118,118,128,0.10)', color: o.sel ? 'white' : 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name={o.icon} size={20}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{o.title}</span>
                        {o.recommended && <Pill color="var(--color-warning)" size="xs">推荐</Pill>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{o.desc}</div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{o.meta}</span>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: o.sel ? '5px solid var(--color-primary)' : '2px solid var(--border-strong)', background: 'white', flexShrink: 0 }}/>
                  </div>
                ))}
              </div>
            </FormRow>
          </div>

          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--separator)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#FAFAFA' }}>
            <AdminBtn variant="secondary">取消</AdminBtn>
            <AdminBtn icon="arrowRight">下一步</AdminBtn>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A08b · AI 批量生成 Modal
// =================================================================
function A08b_AIGenerateModal() {
  const generated = [
    { type: '单选', diff: '简单', text: '产品 X 的核心定位面向以下哪类客户？', kp: '产品政策', sel: true },
    { type: '单选', diff: '中等', text: '基于行业案例，下列哪种实施路径最适合制造业大客户？', kp: '客户案例', sel: true },
    { type: '多选', diff: '中等', text: '产品 X 的合规认证包含以下哪些？', kp: '合规风控', sel: true },
    { type: '简答', diff: '困难', text: '请结合排产优化场景，描述 OEE 提升的核心机制。', kp: '产品功能', sel: false },
    { type: '判断', diff: '简单', text: '产品 X 支持私有化部署且兼容主流国产化操作系统。', kp: '产品政策', sel: true },
  ];
  return (
    <AdminFrame active="banks" breadcrumb={['内容管理', '题库管理', '产品知识题库']}>
      <div style={{ padding: 20, opacity: 0.35, filter: 'blur(2px)', pointerEvents: 'none' }}>
        <div style={{ background: 'white', borderRadius: 10, height: 480 }}/>
      </div>

      <div style={{ position: 'absolute', inset: 0, top: 44, background: 'rgba(0,0,0,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 880, maxHeight: 'calc(100% - 32px)', background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" size={16} color="white"/>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>AI 批量生成题目</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>第 3 步 / 共 3 步 · 预览并选择保留的题目</div>
            </div>
            <div style={{ flex: 1 }}/>
            <Icon name="close" size={18} color="var(--text-secondary)"/>
          </div>

          {/* stepper */}
          <div style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--separator)', background: '#FAFAFA' }}>
            {['选择材料', '配置参数', '生成预览'].map((s, i) => {
              const active = i === 2, done = i < 2;
              return (
                <React.Fragment key={s}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? 'var(--color-success)' : active ? 'var(--color-primary)' : '#E5E5EA', color: done || active ? 'white' : 'var(--text-secondary)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {done ? <Icon name="check" size={11} strokeWidth={3}/> : i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s}</span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 1, background: i < 2 && done ? 'var(--color-success)' : 'var(--separator)' }}/>}
                </React.Fragment>
              );
            })}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
            {/* 参数回顾 */}
            <div style={{ background: '#FAFAFA', borderRadius: 9, padding: 14, display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'flex-start' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase' }}>生成配置</div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>来源材料 · 3 份</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {['产品概览.pdf', '技术架构.pdf', '行业案例.pdf'].map(n => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <Icon name="doc" size={12} color="var(--color-primary)"/>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
                    </div>
                  ))}
                </div>
              </div>

              {[
                ['题目数量', '15 题', 'var(--color-primary)'],
                ['题型分布', '单选 6 / 多选 3 / 判断 3 / 简答 3', null],
                ['难度分布', '简单 40% · 中 50% · 难 10%', null],
                ['知识点覆盖', '产品政策、客户案例、合规、产品功能', null],
              ].map(([l, v, c]) => (
                <div key={l}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c || 'var(--text-primary)', marginTop: 2, lineHeight: 1.4 }}>{v}</div>
                </div>
              ))}

              <button style={{ marginTop: 4, padding: '6px 0', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', background: 'white', borderRadius: 6, border: '1px solid var(--border-strong)' }}>修改配置</button>
            </div>

            {/* 生成结果 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>生成结果 · 15 题</div>
                <Pill color="var(--color-success)" size="xs">已选 12</Pill>
                <div style={{ flex: 1 }}/>
                <button style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>全选</button>
                <button style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>取消全选</button>
                <button style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="refresh" size={12}/> 重新生成
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {generated.map((q, i) => (
                  <div key={i} style={{ background: q.sel ? 'var(--bg-selected)' : 'white', border: q.sel ? '1px solid var(--color-primary)' : '1px solid var(--separator)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, background: q.sel ? 'var(--color-primary)' : 'white', border: q.sel ? 'none' : '1.5px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      {q.sel && <Icon name="check" size={11} color="white" strokeWidth={3}/>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 5, marginBottom: 4 }}>
                        <Pill color={TYPE_COLORS[q.type]} size="xs">{q.type}</Pill>
                        <Pill color={DIFF_COLORS[q.diff]} size="xs">{q.diff}</Pill>
                        <Pill color="var(--text-secondary)" size="xs">{q.kp}</Pill>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{q.text}</div>
                    </div>
                    <Icon name="edit" size={13} color="var(--text-secondary)"/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAFA' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>消耗 AI 调用 · <strong style={{ color: 'var(--text-primary)' }}>~ 0.6 元</strong></div>
            <div style={{ flex: 1 }}/>
            <AdminBtn variant="secondary">上一步</AdminBtn>
            <AdminBtn variant="ghost">取消</AdminBtn>
            <AdminBtn icon="check">导入选中 12 题</AdminBtn>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A08c · 批量导入（字段映射 + 校验）
// =================================================================
function A08c_BulkImport() {
  const rows = [
    { ok: true, type: '单选', q: '关于产品 X 的客户分级标准...', a: 'A', kp: '产品政策' },
    { ok: true, type: '单选', q: 'CRM 系统中创建商机的正确路径...', a: 'B', kp: '系统操作' },
    { warn: true, type: '简答', q: '请描述合规风险评估流程...', a: '', kp: '合规', msg: '简答题缺少参考答案' },
    { ok: true, type: '多选', q: '产品 X 的合规认证包含哪些？', a: 'ABD', kp: '合规' },
    { error: true, type: '?', q: '面对价格异议时的应对方式有...', a: '推荐 3 种', kp: '', msg: '未识别的题型，需选择' },
    { ok: true, type: '判断', q: '产品 X 支持私有化部署。', a: '正确', kp: '产品政策' },
    { ok: true, type: '单选', q: '产品 X 的售后响应时间承诺...', a: 'C', kp: '产品政策' },
  ];
  return (
    <AdminFrame active="banks" breadcrumb={['内容管理', '题库管理', '产品知识题库', '批量导入']}
      actions={<><AdminBtn variant="ghost">取消</AdminBtn><AdminBtn variant="secondary" icon="download">下载模板</AdminBtn></>}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* stepper */}
        <div style={{ background: 'white', borderRadius: 10, padding: '12px 18px', boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {['上传文件', '字段映射', '校验预览', '完成导入'].map((s, i) => {
            const done = i < 2, active = i === 2;
            return (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: done ? 'var(--color-success)' : active ? 'var(--color-primary)' : '#E5E5EA', color: done || active ? 'white' : 'var(--text-secondary)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done ? <Icon name="check" size={11} strokeWidth={3}/> : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s}</span>
                </div>
                {i < 3 && <div style={{ flex: 1, height: 1, background: done ? 'var(--color-success)' : 'var(--separator)' }}/>}
              </React.Fragment>
            );
          })}
        </div>

        {/* 校验摘要 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { l: '上传题目', v: 156, c: 'var(--text-primary)' },
            { l: '可直接导入', v: 138, c: 'var(--color-success)' },
            { l: '存在警告', v: 14, c: 'var(--color-warning)' },
            { l: '错误', v: 4, c: 'var(--color-danger)' },
          ].map(s => (
            <div key={s.l} style={{ background: 'white', borderRadius: 10, padding: 14, boxShadow: 'var(--shadow-1)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.l}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.c, lineHeight: 1.2, marginTop: 2 }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* 字段映射 + 文件信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>源文件</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#FAFAFA', borderRadius: 7 }}>
              <Icon name="doc" size={20} color="var(--color-success)"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>2025_q3_产品题目导入.xlsx</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>156 行 · 8 列 · 已识别表头</div>
              </div>
              <Icon name="check" size={16} color="var(--color-success)" strokeWidth={3}/>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>字段映射</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 16px 1fr', gap: 8, alignItems: 'center', fontSize: 12 }}>
              {[
                ['题型', '题目类型', true],
                ['题目内容', '题干 *', true],
                ['选项A-D', '选项 *', true],
                ['正确答案', '正确答案 *', true],
                ['知识点', '知识点标签', true],
                ['—', '难度（默认中等）', false],
              ].map(([f, t, ok], i) => (
                <React.Fragment key={i}>
                  <div style={{ padding: '5px 9px', background: '#FAFAFA', borderRadius: 5, fontSize: 11 }}>{f}</div>
                  <Icon name="arrowRight" size={11} color="var(--text-tertiary)"/>
                  <div style={{ padding: '5px 9px', background: ok ? 'rgba(0,122,255,0.08)' : '#FAFAFA', color: ok ? 'var(--color-primary)' : 'var(--text-secondary)', borderRadius: 5, fontSize: 11, fontWeight: ok ? 600 : 500, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {t} {ok && <Icon name="chevronRight" size={9}/>}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* 校验表 */}
        <div style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilterChip label="状态：全部"/>
            <FilterChip label="题型：全部"/>
            <div style={{ flex: 1 }}/>
            <button style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500 }}>仅显示问题行</button>
          </div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                {['', '行', '题型', '题干', '答案', '知识点', '校验'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--separator)', background: r.error ? 'rgba(255,59,48,0.04)' : r.warn ? 'rgba(255,149,0,0.04)' : 'transparent' }}>
                  <td style={{ padding: '8px 12px' }}>
                    {r.ok && <Icon name="check" size={14} color="var(--color-success)" strokeWidth={3}/>}
                    {r.warn && <Icon name="warning" size={14} color="var(--color-warning)"/>}
                    {r.error && <Icon name="close" size={14} color="var(--color-danger)" strokeWidth={3}/>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{i + 1}</td>
                  <td><Pill color={TYPE_COLORS[r.type] || 'var(--text-tertiary)'} size="xs">{r.type}</Pill></td>
                  <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.q}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.a || '—'}</td>
                  <td>{r.kp ? <Pill color="var(--text-secondary)" size="xs">{r.kp}</Pill> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</td>
                  <td style={{ color: r.error ? 'var(--color-danger)' : r.warn ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 500, fontSize: 11 }}>
                    {r.msg || '校验通过'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAFA' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>显示前 7 / 共 156 行</span>
            <div style={{ flex: 1 }}/>
            <AdminBtn variant="secondary">上一步</AdminBtn>
            <AdminBtn variant="secondary" icon="download">导出错误清单</AdminBtn>
            <AdminBtn icon="check">导入 138 题（跳过 18 题）</AdminBtn>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A08d · 单题编辑 Drawer
// =================================================================
function A08d_QuestionEditDrawer() {
  return (
    <AdminFrame active="banks" breadcrumb={['内容管理', '题库管理', '产品知识题库']}>
      {/* dim list */}
      <div style={{ padding: 20, opacity: 0.4, filter: 'blur(2px)', pointerEvents: 'none' }}>
        <div style={{ background: 'white', borderRadius: 10, height: 480 }}/>
      </div>

      {/* drawer right */}
      <div style={{ position: 'absolute', inset: 0, top: 44, background: 'rgba(0,0,0,0.30)' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 560, background: 'white', boxShadow: 'var(--shadow-3)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>编辑题目 · 第 1 题</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>产品知识题库 · 最近编辑 5 月 2 日</div>
            </div>
            <div style={{ flex: 1 }}/>
            <Icon name="close" size={18} color="var(--text-secondary)"/>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <FormRow label="题型">
                <select defaultValue="单选" style={{ height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 13 }}>
                  <option>单选</option><option>多选</option><option>判断</option><option>简答</option>
                </select>
              </FormRow>
              <FormRow label="难度">
                <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: 7, padding: 2 }}>
                  {['简单', '中等', '困难'].map((d, i) => (
                    <div key={d} style={{ flex: 1, padding: '5px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, borderRadius: 5, background: i === 0 ? 'white' : 'transparent', color: i === 0 ? DIFF_COLORS[d] : 'var(--text-secondary)', boxShadow: i === 0 ? '0 1px 2px rgba(0,0,0,.06)' : 'none' }}>{d}</div>
                  ))}
                </div>
              </FormRow>
              <FormRow label="分值">
                <input defaultValue="2" style={{ height: 32, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-strong)', fontSize: 13 }}/>
              </FormRow>
            </div>

            <FormRow label="题干 *">
              <textarea defaultValue={MOCK_BANK_QUESTIONS[0].text} style={{ minHeight: 60, padding: 10, borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}/>
            </FormRow>

            <FormRow label="选项 *">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MOCK_BANK_QUESTIONS[0].options.map(o => (
                  <div key={o.l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 6, background: o.correct ? 'rgba(52,199,89,0.08)' : '#FAFAFA', border: o.correct ? '1px solid var(--color-success)' : '1px solid transparent' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: o.correct ? 'var(--color-success)' : 'white', border: o.correct ? 'none' : '1.5px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {o.correct && <Icon name="check" size={10} color="white" strokeWidth={3}/>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, width: 14 }}>{o.l}</span>
                    <input defaultValue={o.t} style={{ flex: 1, height: 28, padding: '0 8px', borderRadius: 5, border: '1px solid var(--separator)', fontSize: 12, background: 'white' }}/>
                    <Icon name="close" size={12} color="var(--text-tertiary)"/>
                  </div>
                ))}
                <button style={{ alignSelf: 'flex-start', padding: '5px 10px', fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="plus" size={12}/> 添加选项
                </button>
              </div>
            </FormRow>

            <FormRow label="解析">
              <textarea defaultValue={MOCK_BANK_QUESTIONS[0].analysis} style={{ minHeight: 50, padding: 10, borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13, fontFamily: 'inherit' }}/>
            </FormRow>

            <FormRow label="知识点标签">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 8, borderRadius: 7, border: '1px solid var(--border-strong)', minHeight: 40 }}>
                {['产品政策', '客户分级'].map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, background: 'var(--bg-selected)', color: 'var(--color-primary)', fontSize: 11, fontWeight: 600 }}>
                    {t} <Icon name="close" size={9} color="var(--color-primary)"/>
                  </span>
                ))}
                <input placeholder="输入或选择标签..." style={{ flex: 1, minWidth: 120, height: 22, border: 'none', outline: 'none', fontSize: 12 }}/>
              </div>
            </FormRow>

            <FormRow label="得分点">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  ['客户分级标准识别', 50],
                  ['正确选项理由', 30],
                  ['排除干扰项', 20],
                ].map(([n, w]) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: '#FAFAFA', borderRadius: 6 }}>
                    <Icon name="check" size={13} color="var(--color-success)" strokeWidth={3}/>
                    <input defaultValue={n} style={{ flex: 1, height: 24, padding: '0 8px', borderRadius: 5, border: '1px solid var(--separator)', fontSize: 12, background: 'white' }}/>
                    <input defaultValue={w} style={{ width: 50, height: 24, padding: '0 8px', borderRadius: 5, border: '1px solid var(--separator)', fontSize: 12, textAlign: 'center', background: 'white' }}/>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>%</span>
                  </div>
                ))}
                <button style={{ alignSelf: 'flex-start', padding: '5px 10px', fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="plus" size={12}/> 添加得分点
                </button>
              </div>
            </FormRow>
          </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAFA' }}>
            <AdminBtn variant="ghost" icon="trash" style={{ color: 'var(--color-danger)' }}>删除</AdminBtn>
            <div style={{ flex: 1 }}/>
            <AdminBtn variant="secondary">取消</AdminBtn>
            <AdminBtn icon="check">保存</AdminBtn>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

window.A08_BankDetail = A08_BankDetail;
window.A08a_BankCreateModal = A08a_BankCreateModal;
window.A08b_AIGenerateModal = A08b_AIGenerateModal;
window.A08c_BulkImport = A08c_BulkImport;
window.A08d_QuestionEditDrawer = A08d_QuestionEditDrawer;
