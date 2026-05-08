// PC 学员核心 · Batch 1
// P04 资料学习, P05 边学边练, P09 对练进行中
// 复用 PCSidebar / PCTopbar / DesktopFrame / AudioRecorder / VoiceChatBubble

// =================================================================
// P04 · 资料学习 — 左材料目录 + 右 PDF 阅读区
// =================================================================
function P04_PCReading() {
  const materials = [
    { name: '产品概览.pdf', pages: 8, read: true, current: false },
    { name: '技术架构.pdf', pages: 12, read: false, current: true },
    { name: '行业案例.pdf', pages: 16, read: false, current: false },
    { name: '竞品对比.pdf', pages: 6, read: false, current: false },
  ];
  return (
    <DesktopFrame label="AI 陪练 · 产品知识季度考核" width={1280} height={800}>
      <PCSidebar active="home"/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PCTopbar/>
        <div style={{ padding: '20px 28px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Icon name="chevronLeft" size={20} color="var(--text-secondary)"/>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>产品知识季度考核</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>资料学习 · 完成全部材料后解锁练习</div>
          </div>
          <div style={{ flex: 1 }}/>
          <Pill color="var(--color-primary)">学习中 · 1 / 4</Pill>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr 240px', gap: 0, overflow: 'hidden' }}>
          {/* 左：材料目录 */}
          <div style={{ background: 'white', borderRight: '1px solid var(--separator)', padding: '14px 12px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ padding: '4px 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>学习材料</div>
            {materials.map(m => (
              <div key={m.name} style={{
                padding: '10px 10px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8,
                background: m.current ? 'var(--bg-selected)' : 'transparent',
                border: m.current ? '1px solid var(--color-primary)' : '1px solid transparent',
                cursor: 'pointer',
              }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: m.current ? 'var(--color-primary)' : 'rgba(118,118,128,0.10)', color: m.current ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="doc" size={13}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: m.current ? 600 : 500, color: m.current ? 'var(--color-primary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>{m.pages} 页</div>
                </div>
                {m.read && <Icon name="check" size={13} color="var(--color-success)" strokeWidth={3}/>}
              </div>
            ))}

            <div style={{ marginTop: 14, padding: 12, background: 'rgba(0,122,255,0.06)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="bolt" size={12}/> 学习进度
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>已完成 1 / 4 份材料，再阅读 3 份即可开始练习</div>
              <div style={{ height: 4, background: 'rgba(0,122,255,0.15)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', background: 'var(--color-primary)' }}/>
              </div>
            </div>
          </div>

          {/* 中：PDF 阅读 */}
          <div style={{ background: '#E5E5EA', overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'white', borderRadius: 7, boxShadow: 'var(--shadow-1)', alignSelf: 'center' }}>
              <Icon name="chevronLeft" size={14} color="var(--text-secondary)"/>
              <span style={{ fontSize: 12, fontWeight: 600 }}>第 7 页 / 共 12 页</span>
              <Icon name="chevronRight" size={14} color="var(--color-primary)"/>
              <div style={{ width: 1, height: 14, background: 'var(--separator)', margin: '0 4px' }}/>
              <Icon name="minus" size={14} color="var(--text-secondary)"/>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>120%</span>
              <Icon name="plus" size={14} color="var(--text-secondary)"/>
              <div style={{ width: 1, height: 14, background: 'var(--separator)', margin: '0 4px' }}/>
              <Icon name="download" size={14} color="var(--color-primary)"/>
            </div>

            <div style={{ background: 'white', borderRadius: 6, padding: '36px 48px', boxShadow: 'var(--shadow-2)', maxWidth: 720, margin: '0 auto', width: '100%' }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 14 }}>第二章 · 系统架构</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18, fontWeight: 600 }}>2.1 整体架构总览</div>
              {[94, 88, 92, 85, 90, 96].map((w, i) => (
                <div key={i} style={{ height: 8, background: '#F2F2F7', borderRadius: 2, marginBottom: 10, width: `${w}%` }}/>
              ))}
              <div style={{ height: 140, background: 'linear-gradient(180deg, #F2F2F7, #E5E5EA)', borderRadius: 6, margin: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>架构示意图</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, fontWeight: 600 }}>2.2 核心组件</div>
              {[91, 76, 88, 82].map((w, i) => (
                <div key={i} style={{ height: 8, background: '#F2F2F7', borderRadius: 2, marginBottom: 10, width: `${w}%` }}/>
              ))}
            </div>
          </div>

          {/* 右：笔记 + 操作 */}
          <div style={{ background: 'white', borderLeft: '1px solid var(--separator)', padding: 14, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>我的笔记</div>
              <div style={{ background: 'rgba(255,204,0,0.08)', borderLeft: '3px solid #FFCC00', padding: '8px 10px', fontSize: 12, lineHeight: 1.5, borderRadius: 4, marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>第 3 页 · 5 月 3 日</div>
                MES 系统的 OEE 计算公式：可用性 × 性能 × 质量
              </div>
              <div style={{ background: 'rgba(255,204,0,0.08)', borderLeft: '3px solid #FFCC00', padding: '8px 10px', fontSize: 12, lineHeight: 1.5, borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>第 5 页 · 5 月 3 日</div>
                江苏案例：排产周期 7 天 → 3 天，OEE 65% → 79%
              </div>
              <button style={{ width: '100%', marginTop: 8, padding: '6px 10px', fontSize: 12, fontWeight: 500, color: 'var(--color-primary)', background: 'rgba(0,122,255,0.06)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Icon name="plus" size={12}/> 添加笔记
              </button>
            </div>

            <div style={{ height: 1, background: 'var(--separator)' }}/>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>关键摘要 · AI</div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                本章核心：MES 系统的三层架构（设备层、控制层、应用层）以及 OEE 提升机制。
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {['MES 三层架构', 'OEE 提升', '排产优化'].map(t => <Pill key={t} color="var(--color-primary)" size="xs">{t}</Pill>)}
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div style={{ padding: '12px 28px', flexShrink: 0, background: 'white', borderTop: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>当前材料 · 技术架构.pdf</div>
            <div style={{ height: 4, background: 'rgba(118,118,128,0.18)', borderRadius: 2, overflow: 'hidden', maxWidth: 360 }}>
              <div style={{ width: '58%', height: '100%', background: 'var(--color-primary)' }}/>
            </div>
          </div>
          <Btn variant="secondary" size="m">上一份</Btn>
          <Btn variant="primary" size="m" icon="arrowRight">下一份</Btn>
          <Btn variant="secondary" size="m" icon="lock" disabled>开始练习</Btn>
        </div>
      </div>
    </DesktopFrame>
  );
}

// =================================================================
// P05 · 边学边练 — 左题号导航 + 中题目+录音 + 右参考/评语
// =================================================================
function P05_PCPractice() {
  const questions = [
    { idx: 1, status: 'done', score: 88 },
    { idx: 2, status: 'done', score: 75 },
    { idx: 3, status: 'current' },
    { idx: 4, status: 'todo' },
    { idx: 5, status: 'todo' },
  ];
  const q = MOCK_QUESTIONS[0];
  return (
    <DesktopFrame label="AI 陪练 · 边学边练" width={1280} height={800}>
      <PCSidebar active="home"/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PCTopbar/>
        <div style={{ padding: '14px 28px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--separator)', background: 'white' }}>
          <Icon name="close" size={20} color="var(--text-secondary)"/>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>产品知识季度考核 · 练习</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>第 3 题 · 共 5 题 · 已用时 06:32</div>
          </div>
          <div style={{ flex: 1 }}/>
          <Pill color="var(--color-primary)" size="m">练习模式</Pill>
          <Btn variant="secondary" size="s">退出练习</Btn>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 320px', overflow: 'hidden' }}>
          {/* 左：题号导航 */}
          <div style={{ background: 'white', borderRight: '1px solid var(--separator)', padding: '14px 12px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ padding: '4px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>题目导航</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {questions.map(qq => {
                const isCurrent = qq.status === 'current';
                const isDone = qq.status === 'done';
                const lvl = qq.score ? getLevel(qq.score) : null;
                return (
                  <div key={qq.idx} style={{
                    aspectRatio: 1, borderRadius: 6, fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCurrent ? 'var(--color-primary)' : isDone ? `color-mix(in oklab, ${lvl.color} 14%, white)` : '#FAFAFA',
                    color: isCurrent ? 'white' : isDone ? lvl.color : 'var(--text-tertiary)',
                    border: isCurrent ? '2px solid var(--color-primary)' : isDone ? `1.5px solid ${lvl.color}` : '1px solid var(--separator)',
                    cursor: 'pointer',
                  }}>{qq.idx}</div>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
              {[
                { l: '已答题', c: 'var(--color-success)', n: 2 },
                { l: '当前题', c: 'var(--color-primary)', n: 1 },
                { l: '未答题', c: 'var(--text-tertiary)', n: 2 },
              ].map(s => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: s.c }}/>
                  <span style={{ flex: 1 }}>{s.l}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.n}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--separator)', margin: '6px 0' }}/>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>本次平均</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-success)', lineHeight: 1, letterSpacing: '-0.02em' }}><AnimatedNumber value={82}/></div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>已答 2 题平均分</div>
            </div>
          </div>

          {/* 中：题目 + 录音 */}
          <div style={{ overflow: 'auto', padding: 28, background: 'var(--bg-grouped)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: 'var(--shadow-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 700, letterSpacing: 0.5 }}>QUESTION 03 · 简答题 · 100 分</div>
              <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-primary)' }}>{q.text}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {['产品知识', '客户案例', '竞品对比'].map(t => <Pill key={t} color="var(--color-primary)" size="xs">{t}</Pill>)}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 14, padding: 28, boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <AudioRecorder mode="ptt"/>
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: 'var(--shadow-1)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Icon name="bolt" size={18} color="var(--color-warning)"/>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>
                <strong>提示</strong> · 这是练习模式，可以随时查看右侧参考要点。考核模式下要点和参考答案将隐藏。
              </div>
              <Btn variant="ghost" size="s">跳过本题</Btn>
            </div>
          </div>

          {/* 右：参考要点 + 评语 */}
          <div style={{ background: 'white', borderLeft: '1px solid var(--separator)', padding: 18, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>得分要点</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.points.map((p, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 8, background: '#FAFAFA', border: '1px solid var(--separator)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.weight} 分</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>回答中需覆盖此知识点</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--separator)' }}/>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="sparkles" size={11}/> 上一题 AI 评语
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, padding: 10, background: 'rgba(0,122,255,0.05)', borderRadius: 8 }}>
                回答覆盖了核心要点，表述清晰；但未提及与主要竞品的具体对比分析，建议在下一题强化。
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>参考答案 · 仅练习可见</div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, padding: 10, background: 'rgba(52,199,89,0.06)', borderRadius: 8, borderLeft: '3px solid var(--color-success)' }}>
                {q.reference}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

// =================================================================
// P09 · 对练进行中 — 左任务/角色面板 + 主对话区 + 底录音条
// =================================================================
function P09_PCDialogue() {
  const persona = MOCK_PERSONAS[0];
  return (
    <DesktopFrame label="AI 陪练 · 模拟对练" width={1280} height={800}>
      <PCSidebar active="home"/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PCTopbar/>
        <div style={{ padding: '14px 28px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--separator)', background: 'white' }}>
          <Icon name="close" size={20} color="var(--text-secondary)"/>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: persona.avatar.bg, color: 'white', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{persona.avatar.initial}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>与 {persona.name} 的对练</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>大客户拜访模拟练习 · {persona.industry} · {persona.title}</div>
          </div>
          <div style={{ flex: 1 }}/>
          <Pill color="var(--color-primary)">练习模式</Pill>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            <Icon name="clock" size={14}/> 12:34
          </div>
          <Btn variant="secondary" size="s" icon="stop">结束对话</Btn>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 280px', overflow: 'hidden' }}>
          {/* 左：任务目标 + 角色画像 */}
          <div style={{ background: 'white', borderRight: '1px solid var(--separator)', padding: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', borderRadius: 12, padding: 14, color: 'white' }}>
              <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>🎯 任务目标</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>向制造业大客户的采购总监介绍 XX 企业级解决方案，达成下一步技术对接的承诺</div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>角色画像</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: persona.avatar.bg, color: 'white', fontWeight: 600, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{persona.avatar.initial}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{persona.name}，{persona.age}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{persona.industry} · {persona.title}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {persona.style.map(s => <Pill key={s} color="var(--color-primary)" size="xs">{s}</Pill>)}
              </div>
              {[
                ['沟通风格', '简洁务实，偏好数据和案例支撑，习惯打断追问关键细节'],
                ['决策风格', '重 ROI 与可量化收益，要求明确的实施路径与里程碑'],
                ['核心痛点', '今年制造成本压力大，对每一项新投入都要求清晰的回报周期'],
              ].map(([l, t]) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>{t}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="doc" size={16} color="var(--color-primary)"/>
              <div style={{ flex: 1, fontSize: 12 }}>产品介绍.pdf</div>
              <Icon name="eye" size={14} color="var(--color-primary)"/>
            </div>
          </div>

          {/* 中：对话流 */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F5F5F7' }}>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {MOCK_DIALOGUE.map((m, i) => (
                <VoiceChatBubble
                  key={i}
                  role={m.role}
                  text={m.text}
                  audioDuration={m.audioDuration}
                  score={m.role === 'user' ? m.score : undefined}
                  avatar={m.role === 'ai' ? persona.avatar : undefined}
                />
              ))}
            </div>

            {/* 底部录音条 */}
            <div style={{ flexShrink: 0, padding: '16px 32px 20px', background: 'white', borderTop: '1px solid var(--separator)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }}/>
                  轮到你了 · 按住右侧按钮或长按空格回应
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>已对话 3 轮 / 建议 5-8 轮 · 可随时结束</div>
              </div>
              <AudioRecorder mode="ptt" hideToggle showHint={false} size="compact"/>
            </div>
          </div>

          {/* 右：实时提示 + 历史评分 */}
          <div style={{ background: 'white', borderLeft: '1px solid var(--separator)', padding: 16, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="sparkles" size={11}/> 实时建议
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, padding: 10, background: 'rgba(0,122,255,0.05)', borderRadius: 8 }}>
                客户刚提出"具体差异化"的追问。建议从 <strong>响应延迟</strong>、<strong>行业 Know-how</strong>、<strong>私有化部署</strong> 三点切入，避免抽象描述。
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>本轮评分</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: '表达清晰度', v: 85, c: 'var(--color-success)' },
                  { l: '产品匹配度', v: 80, c: 'var(--color-primary)' },
                  { l: '客户应对', v: 78, c: 'var(--color-primary)' },
                  { l: '专业性', v: 88, c: 'var(--color-success)' },
                ].map(d => (
                  <div key={d.l}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span>{d.l}</span>
                      <span style={{ fontWeight: 700, color: d.c, fontVariantNumeric: 'tabular-nums' }}>{d.v}</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(118,118,128,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${d.v}%`, height: '100%', background: d.c }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--separator)' }}/>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>历史轮次</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { i: 1, s: 82 }, { i: 2, s: 88 },
                ].map(r => (
                  <div key={r.i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#FAFAFA', borderRadius: 6, fontSize: 12 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,122,255,0.10)', color: 'var(--color-primary)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.i}</span>
                    <span style={{ flex: 1, color: 'var(--text-secondary)' }}>第 {r.i} 轮回应</span>
                    <span style={{ fontWeight: 700, color: getLevel(r.s).color }}>{r.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

window.P04_PCReading = P04_PCReading;
window.P05_PCPractice = P05_PCPractice;
window.P09_PCDialogue = P09_PCDialogue;
