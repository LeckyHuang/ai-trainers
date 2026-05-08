// AudioRecorder — central interactive component
// Modes: 'ptt' (push-to-talk) or 'toggle' (click start/stop)
// States: idle | recording | recorded | processing
// Simulated waveform (Math.random based) — no real Web Audio for prototype safety.

// hooks via React.* to avoid global redeclaration with other Babel scripts
const { useState, useEffect, useRef, useMemo, useCallback } = React;
window.__hooksLoaded = (window.__hooksLoaded || 0) + 1;

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function AudioRecorder({
  mode = 'ptt',          // 'ptt' | 'toggle'
  maxSeconds = 120,
  onSubmit,              // () => void
  initialState = 'idle', // idle | recording | recorded | processing
  hideToggle = false,    // if true, don't show mode tabs
  onModeChange,          // optional
  size = 'normal',       // 'normal' | 'compact'
  showHint = true,
}) {
  const [state, setState] = useState(initialState);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState(() => Array(60).fill(0).map(() => Math.random() * 0.3 + 0.1));
  const [currentMode, setCurrentMode] = useState(mode);
  const intervalRef = useRef(null);
  const waveIntervalRef = useRef(null);

  useEffect(() => { setState(initialState); }, [initialState]);
  useEffect(() => { setCurrentMode(mode); }, [mode]);

  const startRecording = useCallback(() => {
    setState('recording');
    setDuration(0);
    setWaveform(Array(60).fill(0).map(() => Math.random() * 0.3 + 0.1));
    intervalRef.current = setInterval(() => {
      setDuration(d => {
        if (d + 0.1 >= maxSeconds) {
          stopRecording();
          return maxSeconds;
        }
        return d + 0.1;
      });
    }, 100);
    waveIntervalRef.current = setInterval(() => {
      setWaveform(w => [...w.slice(1), Math.random() * 0.85 + 0.15]);
    }, 80);
  }, [maxSeconds]);

  const stopRecording = useCallback(() => {
    setState('recorded');
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
  }, []);

  const reset = () => {
    setState('idle');
    setDuration(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, []);

  // Big button styles
  const buttonSize = size === 'compact' ? 76 : 96;
  const isRec = state === 'recording';
  const isProc = state === 'processing';
  const isDone = state === 'recorded';

  let btnBg = 'var(--color-primary)';
  let btnIcon = 'mic';
  if (isRec) btnBg = 'var(--color-danger)';
  if (isProc) btnBg = '#C7C7CC';
  if (isDone) btnBg = 'var(--color-primary)';

  const handleDown = (e) => {
    if (isProc) return;
    if (currentMode === 'ptt' && state === 'idle') startRecording();
  };
  const handleUp = () => {
    if (currentMode === 'ptt' && isRec) stopRecording();
  };
  const handleClick = () => {
    if (isProc) return;
    if (currentMode === 'toggle') {
      if (state === 'idle') startRecording();
      else if (isRec) stopRecording();
    } else if (isDone) {
      // tap recorded button to play (no-op visual)
    }
  };

  return (
    <div className="ar-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative' }}>
      {!hideToggle && (
        <div style={{
          background: 'rgba(118,118,128,0.12)', borderRadius: 9, padding: 2,
          display: 'flex', fontSize: 13, fontWeight: 500,
        }}>
          {[
            { v: 'ptt', label: '按住说话' },
            { v: 'toggle', label: '点击说话' },
          ].map(opt => (
            <div key={opt.v}
              onClick={() => { setCurrentMode(opt.v); onModeChange && onModeChange(opt.v); reset(); }}
              style={{
                padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                background: currentMode === opt.v ? '#fff' : 'transparent',
                color: currentMode === opt.v ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: currentMode === opt.v ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                transition: 'all 200ms',
              }}>{opt.label}</div>
          ))}
        </div>
      )}

      {/* Pulse rings while recording */}
      <div style={{ position: 'relative', width: buttonSize + 60, height: buttonSize + 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isRec && [0, 0.6, 1.2].map(delay => (
          <div key={delay} style={{
            position: 'absolute',
            width: buttonSize, height: buttonSize,
            borderRadius: '50%',
            border: '2px solid var(--color-danger)',
            animation: `ios-pulse 1.8s ${delay}s infinite ease-out`,
            opacity: 0.6,
          }} />
        ))}

        {/* Live waveform ring */}
        {isRec && (
          <svg width={buttonSize + 40} height={buttonSize + 40} style={{ position: 'absolute', pointerEvents: 'none' }}>
            {waveform.slice(-32).map((v, i) => {
              const angle = (i / 32) * Math.PI * 2 - Math.PI / 2;
              const r1 = (buttonSize / 2) + 8;
              const r2 = r1 + v * 14;
              const cx = (buttonSize + 40) / 2;
              const cy = (buttonSize + 40) / 2;
              const x1 = cx + Math.cos(angle) * r1;
              const y1 = cy + Math.sin(angle) * r1;
              const x2 = cx + Math.cos(angle) * r2;
              const y2 = cy + Math.sin(angle) * r2;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" />;
            })}
          </svg>
        )}

        <button
          onMouseDown={handleDown} onMouseUp={handleUp} onMouseLeave={handleUp}
          onTouchStart={handleDown} onTouchEnd={handleUp}
          onClick={handleClick}
          disabled={isProc}
          style={{
            width: buttonSize, height: buttonSize,
            borderRadius: '50%',
            background: btnBg,
            color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 200ms var(--ease-standard)',
            transform: isRec ? 'scale(1.05)' : 'scale(1)',
            boxShadow: isRec ? '0 0 30px rgba(255,59,48,0.4)' : '0 4px 16px rgba(0,122,255,0.35)',
            cursor: isProc ? 'wait' : 'pointer',
            position: 'relative', zIndex: 2,
          }}>
          {isRec
            ? <span style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtTime(duration)}</span>
            : isDone
              ? <Icon name="play" size={32} />
              : isProc
                ? <div className="ar-spinner" style={{ width: 24, height: 24, border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'ios-spin 0.8s linear infinite' }} />
                : <Icon name="mic" size={34} />}
        </button>
      </div>

      {/* hint text */}
      {showHint && (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', minHeight: 20, fontWeight: 500 }}>
          {state === 'idle' && (currentMode === 'ptt' ? '按住说话' : '点击开始录音')}
          {state === 'recording' && (currentMode === 'ptt' ? '录音中，松手结束' : '录音中，再次点击结束')}
          {state === 'recorded' && '录音完成'}
          {state === 'processing' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)' }}>
              AI 正在评分
              <span style={{ display: 'inline-flex', gap: 3 }}>
                {[0, 0.2, 0.4].map(d => (
                  <span key={d} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-primary)', animation: `ios-typing 1.2s ${d}s infinite` }}/>
                ))}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Recorded — show waveform playback bar + buttons */}
      {isDone && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-full)', minWidth: 220 }}>
            <Icon name="play" size={16} color="var(--color-primary)" />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 22, flex: 1 }}>
              {waveform.slice(-30).map((v, i) => (
                <div key={i} style={{
                  width: 2, height: `${v * 100}%`, background: 'var(--color-primary)',
                  borderRadius: 1, opacity: 0.85,
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtTime(duration)}</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={reset} style={{
              padding: '10px 20px', borderRadius: 'var(--radius-full)',
              background: 'rgba(118,118,128,0.12)',
              color: 'var(--text-primary)', fontWeight: 500, fontSize: 15,
            }}>重新录音</button>
            <button onClick={() => { setState('processing'); onSubmit && onSubmit(); }} style={{
              padding: '10px 24px', borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary)', color: 'white', fontWeight: 600, fontSize: 15,
            }}>提交答案</button>
          </div>
        </div>
      )}
    </div>
  );
}

window.AudioRecorder = AudioRecorder;
window.fmtTime = fmtTime;
