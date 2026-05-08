// 角色库完整流程 · Batch 3
// A09 新建角色, A10b 角色编辑双列, A10c AI 重生成画像, A10d 角色试聊 Modal

const BIG_FIVE = [
  { key: 'O', name: '开放性', desc: '想象力 / 接受新事物', low: '务实保守', high: '富有创造' },
  { key: 'C', name: '尽责性', desc: '自律性 / 目标导向', low: '随性散漫', high: '严谨自律' },
  { key: 'E', name: '外向性', desc: '社交活跃度', low: '内敛克制', high: '外向健谈' },
  { key: 'A', name: '宜人性', desc: '合作与同理心', low: '强势直接', high: '友善合作' },
  { key: 'N', name: '神经质', desc: '情绪稳定性', low: '情绪稳定', high: '情绪敏感' },
];

function BigFiveSlider({ trait, value, locked = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--bg-selected)', color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{trait.key}</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{trait.name}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{trait.desc}</span>
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: 'rgba(118,118,128,0.18)', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', left: 0, width: `${value}%`, height: 4, background: 'linear-gradient(90deg, var(--color-primary), var(--color-purple))', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', left: `calc(${value}% - 9px)`, width: 18, height: 18, borderRadius: '50%', background: 'white', border: '2px solid var(--color-primary)', boxShadow: 'var(--shadow-1)' }}/>
        {[20, 40, 60, 80].map(t => (
          <div key={t} style={{ position: 'absolute', left: `${t}%`, width: 1, height: 6, background: 'rgba(118,118,128,0.30)' }}/>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
        <span>{trait.low}</span><span>{trait.high}</span>
      </div>
    </div>
  );
}

// =================================================================
// A09 · 新建角色 — 基础信息 + 大五人格
// =================================================================
function A09_PersonaCreate() {
  return (
    <AdminFrame active="personas" breadcrumb={['内容管理', '角色库', '新建角色']}
      actions={<><AdminBtn variant="ghost">取消</AdminBtn><AdminBtn variant="secondary">存为草稿</AdminBtn><AdminBtn variant="secondary" icon="sparkles">下一步：AI 生成画像</AdminBtn></>}>
      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* 主表单 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>基础信息</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>角色的基本身份与外观</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #FF9500, #FF6B00)', color: 'white', fontWeight: 700, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>李</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>头像</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    'linear-gradient(135deg, #FF9500, #FF6B00)',
                    'linear-gradient(135deg, #AF52DE, #FF2D92)',
                    'linear-gradient(135deg, #34C759, #30B0C7)',
                    'linear-gradient(135deg, #5AC8FA, #007AFF)',
                    'linear-gradient(135deg, #5856D6, #AF52DE)',
                  ].map((g, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: g, border: i === 0 ? '2px solid var(--color-primary)' : '2px solid transparent', boxShadow: i === 0 ? '0 0 0 2px white inset' : 'none', cursor: 'pointer' }}/>
                  ))}
                  <button style={{ width: 28, height: 28, borderRadius: '50%', background: '#FAFAFA', border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="upload" size={12}/>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: 10 }}>
              <FormRow label="姓名 *">
                <input defaultValue="李明华" style={{ height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13 }}/>
              </FormRow>
              <FormRow label="性别">
                <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: 7, padding: 2, height: 36 }}>
                  {['男', '女'].map((g, i) => (
                    <div key={g} style={{ flex: 1, fontSize: 13, fontWeight: 600, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === 0 ? 'white' : 'transparent', color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: i === 0 ? '0 1px 2px rgba(0,0,0,.06)' : 'none' }}>{g}</div>
                  ))}
                </div>
              </FormRow>
              <FormRow label="年龄">
                <input defaultValue="58" style={{ height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13, textAlign: 'center' }}/>
              </FormRow>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormRow label="所属行业 *">
                <select defaultValue="制造业" style={{ height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13 }}>
                  <option>制造业</option><option>金融业</option><option>零售连锁</option><option>互联网科技</option><option>医疗健康</option>
                </select>
              </FormRow>
              <FormRow label="职位 *">
                <input defaultValue="集团总经理" style={{ height: 36, padding: '0 12px', borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 13 }}/>
              </FormRow>
            </div>

            <FormRow label="风格标签 · 用于学员快速识别">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: 8, borderRadius: 7, border: '1px solid var(--border-strong)', minHeight: 44 }}>
                {['理性', '务实', '重数据'].map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, background: 'var(--bg-selected)', color: 'var(--color-primary)', fontSize: 12, fontWeight: 600 }}>
                    {t} <Icon name="close" size={10} color="var(--color-primary)"/>
                  </span>
                ))}
                <input placeholder="输入并回车，最多 5 个..." style={{ flex: 1, minWidth: 140, height: 26, border: 'none', outline: 'none', fontSize: 12 }}/>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>常用：</span>
                {['强势', '谨慎', '健谈', '内敛', '关注成本', '技术导向', '快节奏', '注重合规'].map(t => (
                  <span key={t} style={{ padding: '3px 8px', borderRadius: 11, background: '#FAFAFA', border: '1px solid var(--separator)', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>{t}</span>
                ))}
              </div>
            </FormRow>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: 22, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>大五人格 · Big Five</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>调节五个维度，AI 将基于这些参数生成对话风格与决策偏好</div>
              </div>
              <div style={{ flex: 1 }}/>
              <button style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="sparkles" size={12}/> 应用预设
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <BigFiveSlider trait={BIG_FIVE[0]} value={62}/>
              <BigFiveSlider trait={BIG_FIVE[1]} value={84}/>
              <BigFiveSlider trait={BIG_FIVE[2]} value={45}/>
              <BigFiveSlider trait={BIG_FIVE[3]} value={32}/>
              <BigFiveSlider trait={BIG_FIVE[4]} value={28}/>
            </div>

            <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 12, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              💡 当前组合接近 <strong style={{ color: 'var(--text-primary)' }}>"理性决策者"</strong> — 高尽责、低宜人、情绪稳定。常见于资深管理岗位的客户画像。
            </div>
          </div>
        </div>

        {/* 右侧：预览 + 预设 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>实时预览</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #FF9500, #FF6B00)', color: 'white', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>李</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>李明华，58</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>制造业 · 集团总经理</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
              {['理性', '务实', '重数据'].map(s => <Pill key={s} color="var(--color-primary)" size="xs">{s}</Pill>)}
            </div>
            <svg viewBox="0 0 200 160" width="100%" height={130}>
              {[0,1,2,3,4].map(i => {
                const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const x = 100 + 60 * Math.cos(a), y = 80 + 60 * Math.sin(a);
                return <line key={i} x1="100" y1="80" x2={x} y2={y} stroke="rgba(0,0,0,0.06)"/>;
              })}
              {[20,40,60].map(r => (
                <polygon key={r} points={[0,1,2,3,4].map(i => {
                  const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
                  return `${100 + r * Math.cos(a)},${80 + r * Math.sin(a)}`;
                }).join(' ')} fill="none" stroke="rgba(0,0,0,0.04)"/>
              ))}
              <polygon points={[62,84,45,32,28].map((v, i) => {
                const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const r = (v / 100) * 60;
                return `${100 + r * Math.cos(a)},${80 + r * Math.sin(a)}`;
              }).join(' ')} fill="rgba(0,122,255,0.20)" stroke="var(--color-primary)" strokeWidth="2"/>
              {[62,84,45,32,28].map((v, i) => {
                const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const r = (v / 100) * 60;
                return <circle key={i} cx={100 + r * Math.cos(a)} cy={80 + r * Math.sin(a)} r="3" fill="var(--color-primary)"/>;
              })}
              {BIG_FIVE.map((t, i) => {
                const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const r = 74;
                return <text key={t.key} x={100 + r * Math.cos(a)} y={80 + r * Math.sin(a) + 4} textAnchor="middle" fontSize="10" fill="var(--text-secondary)" fontWeight="600">{t.key}</text>;
              })}
            </svg>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: 14, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>人格预设</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { n: '理性决策者', d: '高尽责 · 低宜人', sel: true },
                { n: '热情合作者', d: '高外向 · 高宜人' },
                { n: '强势谈判者', d: '低宜人 · 低神经质' },
                { n: '谨慎技术派', d: '高开放 · 高尽责' },
              ].map(p => (
                <div key={p.n} style={{ padding: '8px 10px', borderRadius: 7, background: p.sel ? 'var(--bg-selected)' : '#FAFAFA', border: p.sel ? '1px solid var(--color-primary)' : '1px solid transparent', cursor: 'pointer' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: p.sel ? 'var(--color-primary)' : 'var(--text-primary)' }}>{p.n}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{p.d}</div>
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
// A10b · 角色编辑双列 — 左基础+人格 / 右 AI 画像 6 维
// =================================================================
function A10b_PersonaEdit() {
  const profile = [
    { icon: 'mic', label: '沟通风格', text: '简洁务实，偏好数据和案例支撑。习惯打断追问关键细节，对空泛承诺敏感。语速中等，问句多于陈述。' },
    { icon: 'chart', label: '决策风格', text: '强 ROI 导向，要求清晰的实施路径与里程碑。决策周期 2-4 周，需要财务与技术双线认可。' },
    { icon: 'warning', label: '核心痛点', text: '今年制造成本压力大，对每项新投入都要求清晰的回报周期。过去对 IT 项目延期落地有不愉快经历。' },
    { icon: 'star', label: '关注价值', text: '可量化的产能提升、设备 OEE、生产追溯能力；本地化部署与数据安全；售后响应速度。' },
    { icon: 'shield', label: '潜在异议', text: '对行业 Know-how 持怀疑，会反复追问案例真实性；担心实施周期过长影响生产；对价格敏感。' },
    { icon: 'bookOpen', label: '行业背景', text: '20 年制造业从业，主导过 ERP、MES 项目。对技术细节有基础理解，但更关注业务结果。' },
  ];
  return (
    <AdminFrame active="personas" breadcrumb={['内容管理', '角色库', '李明华 · 制造业总经理']}
      actions={<><AdminBtn variant="ghost">取消</AdminBtn><AdminBtn variant="secondary" icon="play">试聊</AdminBtn><AdminBtn icon="check">保存修改</AdminBtn></>}>
      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16 }}>
        {/* 左：基础 + 人格 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignSelf: 'flex-start' }}>
          <div style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #FF9500, #FF6B00)', color: 'white', fontWeight: 700, fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>李</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>李明华，58 · 男</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>制造业 · 集团总经理</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <span>已用于 4 个任务</span>
                  <span>·</span>
                  <span>更新于 5 月 1 日</span>
                </div>
              </div>
              <Icon name="edit" size={14} color="var(--text-secondary)"/>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['理性', '务实', '重数据'].map(s => <Pill key={s} color="var(--color-primary)" size="xs">{s}</Pill>)}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: 18, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>大五人格</div>
              <div style={{ flex: 1 }}/>
              <button style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 500 }}>应用预设</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[62, 84, 45, 32, 28].map((v, i) => (
                <BigFiveSlider key={i} trait={BIG_FIVE[i]} value={v}/>
              ))}
            </div>
          </div>
        </div>

        {/* 右：AI 画像 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.06), rgba(88,86,214,0.06))', borderRadius: 10, padding: 14, border: '1px solid var(--bg-selected)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #007AFF, #5856D6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="sparkles" size={18}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AI 自动生成的角色画像</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>基于基础信息 + 大五人格生成 · 你可手动编辑任何一段，或重新生成</div>
            </div>
            <AdminBtn variant="secondary" icon="refresh">重新生成全部</AdminBtn>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {profile.map((p, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: 14, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,122,255,0.08)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={p.icon} size={14}/>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                  <div style={{ flex: 1 }}/>
                  <button style={{ width: 22, height: 22, borderRadius: 5, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }} title="重新生成此项">
                    <Icon name="refresh" size={12}/>
                  </button>
                  <button style={{ width: 22, height: 22, borderRadius: 5, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                    <Icon name="edit" size={12}/>
                  </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>{p.text}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: 'var(--shadow-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="settings" size={14} color="var(--text-secondary)"/>
              <div style={{ fontSize: 13, fontWeight: 700 }}>对话场景设定</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormRow label="开场情境">
                <textarea defaultValue="客户的办公室。你刚完成季度运营会议，时间很紧。销售来介绍解决方案，你只给 30 分钟。" style={{ minHeight: 60, padding: 10, borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 12, fontFamily: 'inherit' }}/>
              </FormRow>
              <FormRow label="对话目标">
                <textarea defaultValue="评估销售方案是否值得进入下一步技术对接；要让销售给出可量化收益与典型客户案例。" style={{ minHeight: 60, padding: 10, borderRadius: 7, border: '1px solid var(--border-strong)', fontSize: 12, fontFamily: 'inherit' }}/>
              </FormRow>
            </div>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A10c · AI 重新生成画像 — diff 对比预览
// =================================================================
function A10c_PersonaRegenerate() {
  const diff = [
    {
      label: '沟通风格',
      old: '简洁务实，偏好数据和案例支撑。习惯打断追问关键细节，对空泛承诺敏感。',
      new: '简洁直接，几乎不寒暄。倾向于先听 30 秒判断是否值得继续，会用具体数字反问销售。语速偏快，问题密集。',
    },
    {
      label: '决策风格',
      old: '强 ROI 导向，要求清晰的实施路径与里程碑。决策周期 2-4 周。',
      new: '强 ROI 导向，但更关心"风险调整后回报"。决策周期 3-6 周，需要业务、财务、IT 三方背书，倾向于先做小规模 POC 验证。',
    },
    {
      label: '核心痛点',
      old: '今年制造成本压力大，对每项新投入都要求清晰的回报周期。',
      new: '今年面临原材料波动 + 海外订单收缩的双重压力，刚否决了一个 IT 项目。对短周期回本（< 6 个月）的方案接受度更高。',
      changed: true,
    },
  ];
  return (
    <AdminFrame active="personas" breadcrumb={['内容管理', '角色库', '李明华', '重新生成画像']}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', borderRadius: 10, padding: '14px 18px', color: 'white', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Icon name="sparkles" size={22}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>AI 已基于最新参数重新生成画像</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>共更新 6 项 · 你可逐项决定保留旧版或采用新版</div>
          </div>
          <AdminBtn variant="secondary" style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.30)' }}>全部采用新版</AdminBtn>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>视图</span>
          <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: 6, padding: 2 }}>
            {['对比', '仅新版', '仅旧版'].map((m, i) => (
              <div key={m} style={{ padding: '5px 14px', fontSize: 12, fontWeight: 600, borderRadius: 4, background: i === 0 ? 'white' : 'transparent', color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', boxShadow: i === 0 ? '0 1px 2px rgba(0,0,0,.06)' : 'none' }}>{m}</div>
            ))}
          </div>
          <div style={{ flex: 1 }}/>
          <FilterChip label="仅显示有变化（3）"/>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>已采用 1 / 6</span>
        </div>

        {diff.map((d, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--separator)' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{d.label}</span>
              {d.changed ? <Pill color="var(--color-warning)" size="xs">变化较大</Pill> : <Pill color="var(--color-primary)" size="xs">已优化</Pill>}
              <div style={{ flex: 1 }}/>
              <button style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="refresh" size={11}/> 再次生成
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              <div style={{ padding: 14, borderRight: '1px solid var(--separator)', background: '#FAFAFA' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>旧版本 · 当前</div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>{d.old}</div>
                <button style={{ marginTop: 10, padding: '4px 10px', fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', background: 'white', border: '1px solid var(--border-strong)', borderRadius: 5 }}>保留旧版</button>
              </div>
              <div style={{ padding: 14, background: 'rgba(52,199,89,0.04)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-success)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="sparkles" size={11}/> 新版本 · AI 生成
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>{d.new}</div>
                <button style={{ marginTop: 10, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: 'white', background: 'var(--color-success)', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={11} strokeWidth={3}/> 采用新版
                </button>
              </div>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <AdminBtn variant="ghost">放弃所有变更</AdminBtn>
          <AdminBtn variant="secondary" icon="refresh">再生成一次</AdminBtn>
          <AdminBtn icon="check">应用并保存（1 项采用）</AdminBtn>
        </div>
      </div>
    </AdminFrame>
  );
}

// =================================================================
// A10d · 角色试聊 Modal
// =================================================================
function A10d_PersonaTryChat() {
  const transcript = [
    { role: 'system', text: '试聊场景 · 销售来访问，时间紧，30 分钟' },
    { role: 'user', text: '李总您好，我是来介绍我们最新的智能 MES 解决方案的，看看能不能帮到贵司。' },
    { role: 'ai', text: '小林是吧？时间不多。直接说，跟我们现在用的那套比，你们能多带来什么？最好有数字。', meta: '决策风格命中 · 立即追问 ROI' },
    { role: 'user', text: '我们最新案例是江苏某汽车零部件龙头，OEE 从 65% 提升到 79%，排产周期 7 天压缩到 3 天。' },
    { role: 'ai', text: '79% 这个数我先记着。汽车零部件和我们机加工还是有差异的——你们在我们这种小批量多品种的厂子，做过吗？', meta: '行业背景命中 · 质疑案例可迁移性' },
  ];
  return (
    <AdminFrame active="personas" breadcrumb={['内容管理', '角色库', '李明华']}>
      <div style={{ padding: 20, opacity: 0.35, filter: 'blur(2px)', pointerEvents: 'none' }}>
        <div style={{ background: 'white', borderRadius: 10, height: 480 }}/>
      </div>
      <div style={{ position: 'absolute', inset: 0, top: 44, background: 'rgba(0,0,0,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 760, height: 580, background: 'white', borderRadius: 14, boxShadow: 'var(--shadow-3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FF9500, #FF6B00)', color: 'white', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>李</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                试聊 · 李明华
                <Pill color="var(--color-warning)" size="xs">未保存</Pill>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>验证设定后再保存到角色库 · 试聊不计入正式记录</div>
            </div>
            <div style={{ flex: 1 }}/>
            <Icon name="refresh" size={16} color="var(--text-secondary)"/>
            <Icon name="close" size={18} color="var(--text-secondary)"/>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 240px', overflow: 'hidden' }}>
            {/* 对话流 */}
            <div style={{ overflow: 'auto', padding: 18, background: '#F5F5F7', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transcript.map((m, i) => {
                if (m.role === 'system') return (
                  <div key={i} style={{ alignSelf: 'center', fontSize: 11, color: 'var(--text-tertiary)', padding: '4px 12px', background: 'rgba(118,118,128,0.10)', borderRadius: 10 }}>{m.text}</div>
                );
                const isUser = m.role === 'user';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
                    <div style={{ maxWidth: '82%', padding: '10px 14px', borderRadius: 12, background: isUser ? 'var(--color-primary)' : 'white', color: isUser ? 'white' : 'var(--text-primary)', fontSize: 13, lineHeight: 1.55, boxShadow: isUser ? 'none' : 'var(--shadow-1)' }}>
                      {m.text}
                    </div>
                    {m.meta && (
                      <div style={{ fontSize: 10, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
                        <Icon name="check" size={10} strokeWidth={3}/> {m.meta}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 右侧：行为命中 */}
            <div style={{ borderLeft: '1px solid var(--separator)', padding: 14, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>行为命中</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { l: '决策风格', s: 92, c: 'var(--color-success)' },
                    { l: '沟通风格', s: 88, c: 'var(--color-success)' },
                    { l: '行业背景', s: 78, c: 'var(--color-primary)' },
                    { l: '核心痛点', s: 64, c: 'var(--color-warning)' },
                  ].map(d => (
                    <div key={d.l}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                        <span>{d.l}</span>
                        <span style={{ fontWeight: 700, color: d.c }}>{d.s}</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(118,118,128,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${d.s}%`, height: '100%', background: d.c }}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>"核心痛点"未充分体现，可调整画像或追加场景</div>
              </div>

              <div style={{ height: 1, background: 'var(--separator)' }}/>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>切换场景</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { n: '初次拜访', sel: true },
                    { n: '价格谈判' },
                    { n: '售后投诉' },
                  ].map(s => (
                    <div key={s.n} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: s.sel ? 'var(--bg-selected)' : '#FAFAFA', color: s.sel ? 'var(--color-primary)' : 'var(--text-primary)', border: s.sel ? '1px solid var(--color-primary)' : '1px solid transparent', cursor: 'pointer' }}>{s.n}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 输入条 */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--separator)', background: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F5F5F7', borderRadius: 8 }}>
              <input placeholder="输入你的回应..." style={{ flex: 1, height: 24, border: 'none', background: 'transparent', outline: 'none', fontSize: 13 }} defaultValue="我们针对小批量多品种场景有专门的工艺路线模板，您看，我们是否先做一次现场调研？"/>
              <Icon name="mic" size={16} color="var(--text-secondary)"/>
            </div>
            <AdminBtn icon="arrowRight">发送</AdminBtn>
          </div>
        </div>
      </div>
    </AdminFrame>
  );
}

window.A09_PersonaCreate = A09_PersonaCreate;
window.A10b_PersonaEdit = A10b_PersonaEdit;
window.A10c_PersonaRegenerate = A10c_PersonaRegenerate;
window.A10d_PersonaTryChat = A10d_PersonaTryChat;
