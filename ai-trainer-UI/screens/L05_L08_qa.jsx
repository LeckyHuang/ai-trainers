// L05 · 材料阅读, L06 · 练习模式, L07 · 考核模式, L08 · 结果页

function L05_Reading() {
  const [progress, setProgress] = useState(7);
  const total = 12;
  return (
    <PhoneFrame>
      <div style={{ padding: '4px 12px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid var(--separator)' }}>
        <Icon name="chevronLeft" size={22} />
        <div style={{ flex: 1, fontSize: 15, fontWeight: 600, textAlign: 'center' }}>产品知识季度考核</div>
        <Icon name="download" size={18} color="var(--color-primary)" />
      </div>
      {/* material tabs */}
      <div style={{ display: 'flex', padding: '8px 12px', gap: 8, flexShrink: 0, background: 'white', borderBottom: '0.5px solid var(--separator)' }}>
        {[
          { name: '产品概览.pdf', read: true },
          { name: '技术架构.pdf', read: false, active: true },
          { name: '行业案例.pdf', read: false },
        ].map((m, i) => (
          <div key={i} style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: m.active ? 'var(--color-primary-light)' : 'rgba(118,118,128,0.08)',
            color: m.active ? 'var(--color-primary)' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {m.read && <Icon name="check" size={12} color="var(--color-success)" strokeWidth={3} />}
            {m.name}
          </div>
        ))}
      </div>
      {/* PDF viewport */}
      <div style={{ flex: 1, padding: 16, background: '#E5E5EA', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'white', borderRadius: 8, padding: 24, boxShadow: 'var(--shadow-1)', minHeight: 380 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>第二章 · 系统架构</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>2.1 整体架构总览</div>
          <div style={{ height: 8, background: '#F2F2F7', borderRadius: 2, marginBottom: 8, width: '94%' }}/>
          <div style={{ height: 8, background: '#F2F2F7', borderRadius: 2, marginBottom: 8, width: '88%' }}/>
          <div style={{ height: 8, background: '#F2F2F7', borderRadius: 2, marginBottom: 8, width: '92%' }}/>
          <div style={{ height: 80, background: 'linear-gradient(180deg, #F2F2F7, #E5E5EA)', borderRadius: 4, margin: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 11 }}>架构图示意</div>
          <div style={{ height: 8, background: '#F2F2F7', borderRadius: 2, marginBottom: 8, width: '90%' }}/>
          <div style={{ height: 8, background: '#F2F2F7', borderRadius: 2, marginBottom: 8, width: '76%' }}/>
        </div>
      </div>
      {/* footer */}
      <div style={{ padding: '12px 16px', flexShrink: 0, background: 'white', borderTop: '0.5px solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="chevronLeft" size={20} color="var(--color-primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>{progress} / {total} 页</div>
            <div style={{ height: 4, background: 'rgba(118,118,128,0.20)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${progress / total * 100}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 2, transition: 'width 300ms' }}/>
            </div>
          </div>
          <Icon name="chevronRight" size={20} color="var(--color-primary)" />
        </div>
        <Btn variant="secondary" size="l" fullWidth icon="lock" disabled>请阅读完所有材料后开始练习</Btn>
      </div>
    </PhoneFrame>
  );
}

function L06_Practice({ resultMode = false }) {
  const q = MOCK_QUESTIONS[0];
  const [showRef, setShowRef] = useState(false);
  return (
    <PhoneFrame>
      <div style={{ padding: '4px 12px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }}>
        <Icon name="close" size={22} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'center' }}>第 3 题 / 共 5 题</div>
          <div style={{ height: 4, background: 'rgba(118,118,128,0.18)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', background: 'var(--color-primary)', borderRadius: 2 }}/>
          </div>
        </div>
        <Pill color="var(--color-primary)" size="xs">练习</Pill>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Question card */}
        <div style={{
          background: 'white', borderRadius: 'var(--radius-l)', padding: 20,
          boxShadow: 'var(--shadow-2)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>QUESTION 03</div>
          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-primary)' }}>{q.text}</div>
        </div>

        {!resultMode ? (
          <div style={{ background: 'white', borderRadius: 'var(--radius-l)', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-1)' }}>
            <AudioRecorder mode="ptt" />
          </div>
        ) : (
          <ScoreResultCard q={q} showRef={showRef} setShowRef={setShowRef} />
        )}
      </div>
      {resultMode && (
        <div style={{ padding: '12px 16px 18px', flexShrink: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid var(--separator)' }}>
          <Btn variant="primary" size="l" fullWidth icon="arrowRight">下一题</Btn>
        </div>
      )}
    </PhoneFrame>
  );
}

function ScoreResultCard({ q, showRef, setShowRef }) {
  const lvl = getLevel(q.score);
  return (
    <div style={{
      background: 'white', borderRadius: 'var(--radius-l)', padding: 18,
      boxShadow: 'var(--shadow-1)', display: 'flex', flexDirection: 'column', gap: 14,
      animation: 'ios-fade-in 400ms',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: lvl.bg, borderRadius: 14 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: lvl.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
          <AnimatedNumber value={q.score} />
        </div>
        <div style={{ flex: 1 }}>
          <Pill color={lvl.color}>{lvl.label}</Pill>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>满分 {q.max} 分</div>
        </div>
      </div>

      {/* score points */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>得分点命中</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {q.points.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <Icon name={p.hit ? 'check' : 'close'} size={14} color={p.hit ? 'var(--color-success)' : 'var(--color-danger)'} strokeWidth={2.5} />
              <span style={{ flex: 1, color: 'var(--text-primary)' }}>{p.name}</span>
              <span style={{ fontWeight: 600, color: p.hit ? 'var(--color-success)' : 'var(--text-tertiary)', fontSize: 12 }}>{p.score}/{p.weight}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 12, background: 'rgba(0,122,255,0.05)', borderRadius: 10, fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="sparkles" size={12}/> AI 评语
        </div>
        {q.feedback}
      </div>

      <button onClick={() => setShowRef(!showRef)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(118,118,128,0.08)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        <span>查看参考答案</span>
        <Icon name={showRef ? 'chevronUp' : 'chevronDown'} size={16}/>
      </button>
      {showRef && (
        <div style={{ padding: 12, background: 'rgba(52,199,89,0.06)', borderRadius: 10, fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', borderLeft: '3px solid var(--color-success)' }}>
          {q.reference}
        </div>
      )}
    </div>
  );
}

function L07_Exam() {
  return (
    <PhoneFrame>
      <div style={{ padding: '6px 12px 10px', flexShrink: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid var(--separator)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="close" size={20} />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>第 2 题 / 共 10 题</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-warning)', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            <Icon name="clock" size={14}/> 22:45
          </div>
        </div>
        <div style={{ height: 4, background: 'rgba(118,118,128,0.18)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '20%', height: '100%', background: 'var(--color-primary)' }}/>
        </div>
        <div style={{ height: 4, background: 'rgba(118,118,128,0.18)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '76%', height: '100%', background: 'var(--color-warning)' }}/>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 'var(--radius-l)', padding: 20, boxShadow: 'var(--shadow-2)', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--color-warning)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>EXAM · QUESTION 02</div>
          <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5 }}>请说明在客户提出价格异议时，你应当如何用 ROI 视角进行回应。</div>
        </div>
        <div style={{ background: 'white', borderRadius: 'var(--radius-l)', padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-1)' }}>
          <AudioRecorder mode="ptt" />
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>每题限时 2 分钟，超时自动提交</div>
        </div>
      </div>
    </PhoneFrame>
  );
}

function L08_Result({ score = 88 }) {
  const lvl = getLevel(score);
  const isExcellent = lvl.key === 'excellent';
  const [expanded, setExpanded] = useState(0);

  return (
    <PhoneFrame>
      {isExcellent && <Confetti />}
      <div style={{ padding: '4px 12px 8px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <Icon name="chevronLeft" size={22} />
        <div style={{ flex: 1, fontSize: 15, fontWeight: 600, textAlign: 'center' }}>考核报告</div>
        <Icon name="share" size={20} color="var(--color-primary)" />
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'white', borderRadius: 'var(--radius-l)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow-2)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>产品知识季度考核</div>
          <ScoreDisplay score={score} />
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>用时 18 分 22 秒 · 5 月 4 日</div>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-m)', padding: 16, boxShadow: 'var(--shadow-1)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="sparkles" size={12}/> AI 综合评语
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)' }}>
            整体表现优秀，对产品核心优势的掌握较为全面，案例引用准确。竞品对比环节尚有提升空间，建议结合最新的市场调研数据，强化在性能和成本两个维度的差异化论证。
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, padding: '0 4px' }}>各题详情（10 题）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[90, 85, 75, 92, 88, 70, 95, 82, 88, 91].map((sc, i) => {
              const l = getLevel(sc);
              const isOpen = expanded === i;
              return (
                <div key={i} style={{ background: 'white', borderRadius: 'var(--radius-m)', boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isOpen ? -1 : i)} style={{ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, width: 28 }}>第{i + 1}题</span>
                    <Icon name={l.key === 'fail' ? 'close' : 'check'} size={16} color={l.color} strokeWidth={2.5}/>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>得分点覆盖与表达准确性</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: l.color }}>{sc}</span>
                    <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={14} color="var(--text-tertiary)"/>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, lineHeight: 1.5 }}>
                      <div style={{ padding: 10, background: 'rgba(118,118,128,0.06)', borderRadius: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>我的回答</div>
                        我们的产品在 AI 引擎自研、行业 Know-how 沉淀、私有化部署三个维度都有显著优势...
                      </div>
                      <div style={{ padding: 10, background: 'rgba(0,122,255,0.06)', borderRadius: 8, borderLeft: '3px solid var(--color-primary)' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 4 }}>参考答案</div>
                        三大核心优势：1) 全栈自研AI能力；2) 行业Know-how超过8年；3) 私有化部署完整支持...
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

window.L05_Reading = L05_Reading;
window.L06_Practice = L06_Practice;
window.L07_Exam = L07_Exam;
window.L08_Result = L08_Result;
