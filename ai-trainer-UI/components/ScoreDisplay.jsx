// ScoreDisplay — animated score counter + level badge
// Plus a generic AnimatedNumber used for stat cards

function AnimatedNumber({ value, duration = 800, decimals = 0, style }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = 0;
    const animate = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{display.toFixed(decimals)}</span>;
}

function getLevel(score, passScore = 60, excellentScore = 90) {
  if (score >= excellentScore) return { key: 'excellent', label: '优秀', color: 'var(--color-success)', bg: 'rgba(52,199,89,0.12)' };
  if (score >= passScore) return { key: 'pass', label: '合格', color: 'var(--color-primary)', bg: 'rgba(0,122,255,0.12)' };
  return { key: 'fail', label: '待提升', color: 'var(--color-warning)', bg: 'rgba(255,149,0,0.12)' };
}

function ScoreDisplay({ score = 88, passScore = 60, excellentScore = 90, size = 'lg', label }) {
  const level = getLevel(score, passScore, excellentScore);
  const big = size === 'lg';
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: big ? 12 : 6 }}>
      <div style={{
        fontSize: big ? 72 : 48,
        fontWeight: 800,
        lineHeight: 1,
        color: level.color,
        letterSpacing: '-0.03em',
      }}>
        <AnimatedNumber value={score} />
      </div>
      <span style={{
        padding: big ? '6px 16px' : '4px 12px',
        borderRadius: 'var(--radius-full)',
        background: level.bg,
        color: level.color,
        fontWeight: 600,
        fontSize: big ? 14 : 12,
        animation: 'ios-bounce-in 600ms 200ms backwards var(--ease-spring)',
      }}>{level.label}</span>
      {label && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>}
    </div>
  );
}

// Confetti — light-weight CSS-only celebration
function Confetti({ count = 28, duration = 3000 }) {
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    color: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#007AFF', '#AF52DE'][i % 7],
    rotate: Math.random() * 360,
    width: Math.random() * 6 + 6,
    height: Math.random() * 10 + 10,
    dur: 2 + Math.random() * 1.5,
  })), [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: -20, left: `${p.left}%`,
          width: p.width, height: p.height, background: p.color,
          transform: `rotate(${p.rotate}deg)`,
          animation: `confetti-fall ${p.dur}s ${p.delay}s ease-in forwards`,
          borderRadius: 1,
        }} />
      ))}
    </div>
  );
}

window.AnimatedNumber = AnimatedNumber;
window.ScoreDisplay = ScoreDisplay;
window.Confetti = Confetti;
window.getLevel = getLevel;
