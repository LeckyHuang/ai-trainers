// L10 · 模拟对练 · 对话界面
// 状态机驱动：AI_SPEAKING / USER_TURN / USER_RECORDING / PROCESSING / SESSION_ENDED

function L10_Dialogue({ initialState = 'USER_TURN', mode = 'practice' }) {
  const [state, setState] = useState(initialState);
  const [messages, setMessages] = useState(MOCK_DIALOGUE);
  const persona = MOCK_PERSONAS[0]; // 李明华
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const isSpeaking = state === 'AI_SPEAKING';
  const isUserTurn = state === 'USER_TURN';
  const isRecording = state === 'USER_RECORDING';
  const isProcessing = state === 'PROCESSING';
  const isEnded = state === 'SESSION_ENDED';

  return (
    <PhoneFrame>
      {/* Header */}
      <div style={{
        padding: '4px 12px 10px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid var(--separator)',
      }}>
        <Icon name="close" size={22} color="var(--text-primary)" />
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: persona.avatar.bg,
          color: 'white', fontWeight: 600, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{persona.avatar.initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{persona.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{persona.industry} · {persona.title}</div>
        </div>
        <Pill color={mode === 'practice' ? 'var(--color-primary)' : 'var(--color-warning)'} size="xs">
          {mode === 'practice' ? '练习模式' : '考核模式'}
        </Pill>
        <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', fontWeight: 600 }}>12:34</div>
      </div>

      {/* Speaking indicator banner — only when AI speaking */}
      {isSpeaking && (
        <div style={{
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(180deg, rgba(0,122,255,0.06), transparent)',
          flexShrink: 0,
        }}>
          <div style={{ position: 'relative', width: 52, height: 52 }}>
            {[0, 0.5, 1].map(d => (
              <div key={d} style={{
                position: 'absolute', inset: 4,
                borderRadius: '50%', border: '2px solid var(--color-primary)',
                animation: `ios-pulse 1.6s ${d}s infinite ease-out`,
              }}/>
            ))}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%', background: persona.avatar.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 600, fontSize: 17,
            }}>{persona.avatar.initial}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600 }}>{persona.name} 正在说话</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 16, marginTop: 4 }}>
              {[0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.6].map((v, i) => (
                <div key={i} style={{
                  width: 3, height: `${v * 100}%`,
                  background: 'var(--color-primary)', borderRadius: 1.5,
                  animation: `ios-wave-bar 0.8s ${i * 0.08}s infinite ease-in-out`,
                  transformOrigin: 'bottom',
                }}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '12px 12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <VoiceChatBubble
            key={i}
            role={m.role}
            text={m.text}
            audioDuration={m.audioDuration}
            score={mode === 'practice' && m.role === 'user' ? m.score : undefined}
            avatar={m.role === 'ai' ? persona.avatar : undefined}
          />
        ))}
        {isProcessing && (
          <VoiceChatBubble role="ai" isTyping avatar={persona.avatar} showPlay={false} />
        )}
      </div>

      {/* Bottom bar — varies by state */}
      <div style={{
        padding: '12px 16px 18px', flexShrink: 0,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
        borderTop: '0.5px solid var(--separator)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        minHeight: 160,
      }}>
        {isUserTurn && (
          <>
            <div style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, animation: 'bobble 1.4s infinite' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)' }}/>
              轮到你了，按住下方按钮回应
            </div>
            <AudioRecorder mode="ptt" hideToggle showHint={false} size="compact" />
          </>
        )}
        {isRecording && (
          <>
            <div style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>录音中...</div>
            <AudioRecorder mode="ptt" hideToggle showHint={false} size="compact" initialState="recording" />
          </>
        )}
        {isProcessing && (
          <>
            <div style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              AI 正在思考你的回应
              <span style={{ display: 'inline-flex', gap: 3 }}>
                {[0, 0.2, 0.4].map(d => (
                  <span key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-primary)', animation: `ios-typing 1.2s ${d}s infinite` }}/>
                ))}
              </span>
            </div>
            <button disabled style={{
              width: 76, height: 76, borderRadius: '50%',
              background: '#E5E5EA', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 22, height: 22, border: '2.5px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'ios-spin 0.8s linear infinite' }}/>
            </button>
          </>
        )}
        {isSpeaking && (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>请等待对方说完...</div>
            <button disabled style={{
              width: 76, height: 76, borderRadius: '50%', background: '#E5E5EA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="mic" size={28} color="#A1A1A6" />
            </button>
          </>
        )}
        {isEnded && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>对话已结束 · 共 8 轮</div>
            <Btn variant="primary" size="l" fullWidth icon="chart">查看评分结果</Btn>
          </div>
        )}

        {/* state machine cycler — for prototype demo only, hidden chip */}
        <StateChips state={state} setState={setState} />
      </div>
    </PhoneFrame>
  );
}

function StateChips({ state, setState }) {
  const states = [
    ['AI_SPEAKING', 'AI 说话'],
    ['USER_TURN', '轮到你'],
    ['USER_RECORDING', '录音中'],
    ['PROCESSING', '处理中'],
    ['SESSION_ENDED', '已结束'],
  ];
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
      {states.map(([k, label]) => (
        <button key={k} onClick={() => setState(k)} style={{
          fontSize: 9, padding: '2px 6px', borderRadius: 4,
          background: state === k ? 'var(--color-primary)' : 'rgba(118,118,128,0.10)',
          color: state === k ? 'white' : 'var(--text-secondary)',
          fontWeight: 500, letterSpacing: 0.2,
        }}>{label}</button>
      ))}
    </div>
  );
}

window.L10_Dialogue = L10_Dialogue;
