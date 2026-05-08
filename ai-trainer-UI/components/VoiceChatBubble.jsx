// VoiceChatBubble — message bubble for L10 simulation dialogue
// Props: role ('ai'|'user'|'system'), text, isTyping, avatar, score, audioDuration

function VoiceChatBubble({ role, text, isTyping, avatar, score, audioDuration = 12, showPlay = true }) {
  const isAI = role === 'ai';
  const isUser = role === 'user';
  const isSystem = role === 'system';

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0', color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }}>
        — {text} —
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: isAI ? 'row' : 'row-reverse',
      alignItems: 'flex-end',
      gap: 8,
      animation: 'ios-fade-in 300ms ease-out',
    }}>
      {avatar && (
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: avatar.bg || 'linear-gradient(135deg, #5AC8FA, #007AFF)',
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 600, fontSize: 14,
          overflow: 'hidden',
        }}>{avatar.initial || avatar.text || '?'}</div>
      )}
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isAI ? 'flex-start' : 'flex-end' }}>
        <div style={{
          padding: '10px 14px',
          borderRadius: 18,
          borderBottomLeftRadius: isAI ? 4 : 18,
          borderBottomRightRadius: isAI ? 18 : 4,
          background: isAI ? 'white' : 'var(--color-primary)',
          color: isAI ? 'var(--text-primary)' : 'white',
          fontSize: 15, lineHeight: 1.5,
          boxShadow: isAI ? '0 1px 2px rgba(0,0,0,.06)' : '0 1px 4px rgba(0,122,255,0.25)',
          position: 'relative',
        }}>
          {isTyping ? (
            <div style={{ display: 'flex', gap: 4, padding: '4px 4px' }}>
              {[0, 0.2, 0.4].map(d => (
                <span key={d} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'rgba(60,60,67,0.35)',
                  animation: `ios-typing 1.2s ${d}s infinite`,
                }} />
              ))}
            </div>
          ) : text}
          {!isTyping && showPlay && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
              background: isAI ? 'rgba(0,122,255,0.10)' : 'rgba(255,255,255,0.22)',
              fontSize: 11,
              cursor: 'pointer', userSelect: 'none',
            }}>
              <Icon name="play" size={11} color={isAI ? 'var(--color-primary)' : 'white'} />
              <span style={{ color: isAI ? 'var(--color-primary)' : 'white', fontWeight: 600 }}>
                {fmtTime(audioDuration)}
              </span>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 10 }}>
                {[0.4, 0.7, 0.9, 0.6, 0.3].map((v, i) => (
                  <div key={i} style={{
                    width: 2, height: `${v * 100}%`,
                    background: isAI ? 'var(--color-primary)' : 'white',
                    borderRadius: 1, opacity: 0.7,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
        {score !== undefined && (
          <span style={{
            fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500,
          }}>本轮 {score} 分</span>
        )}
      </div>
    </div>
  );
}

window.VoiceChatBubble = VoiceChatBubble;
