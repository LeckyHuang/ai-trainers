// Frame helpers — phone frame (375×812) and desktop frame (1280×800)
// Pure CSS chrome — no device bezel per user request

function PhoneFrame({ children, statusBar = true, label, theme = 'ios-theme', bg = 'var(--bg-system)', height = 812 }) {
  return (
    <div className={theme} style={{
      width: 375, height,
      background: bg,
      borderRadius: 28,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-stack)',
    }}>
      {statusBar && <PhoneStatusBar />}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

function PhoneStatusBar() {
  return (
    <div style={{
      height: 44, paddingTop: 12, paddingLeft: 24, paddingRight: 24,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
      fontSize: 15, fontWeight: 600, color: 'var(--text-primary)',
      zIndex: 50, background: 'transparent',
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* signal */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 11 }}>
          {[3, 5, 7, 9].map(h => <div key={h} style={{ width: 3, height: h, background: 'var(--text-primary)', borderRadius: 0.5 }} />)}
        </div>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 1C4.5 1 2 2.5 0 4l1.2 1.2C2.7 4 4.9 3 7.5 3s4.8 1 6.3 2.2L15 4C13 2.5 10.5 1 7.5 1zm0 3C5.7 4 4 4.8 2.7 6l1.2 1.2c1-.9 2.4-1.5 3.6-1.5s2.6.6 3.6 1.5L12.3 6C11 4.8 9.3 4 7.5 4zm0 3c-1 0-1.9.4-2.5 1L7.5 9.5 10 8c-.6-.6-1.5-1-2.5-1z"/></svg>
        {/* battery */}
        <div style={{ width: 24, height: 11, border: '1px solid var(--text-primary)', borderRadius: 3, padding: 1, position: 'relative', opacity: 0.5 }}>
          <div style={{ width: '78%', height: '100%', background: 'var(--text-primary)', borderRadius: 1 }} />
          <div style={{ position: 'absolute', right: -3, top: 3, width: 2, height: 5, background: 'var(--text-primary)', borderRadius: '0 1px 1px 0' }} />
        </div>
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <div style={{
      height: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      paddingBottom: 8, flexShrink: 0,
    }}>
      <div style={{ width: 134, height: 5, background: 'var(--text-primary)', borderRadius: 3, opacity: 0.85 }} />
    </div>
  );
}

// Desktop "macOS window" frame
function DesktopFrame({ children, width = 1280, height = 800, label }) {
  return (
    <div className="mac-theme" style={{
      width, height,
      background: 'var(--bg-window)',
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-stack)',
    }}>
      <MacTitleBar label={label} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {children}
      </div>
    </div>
  );
}

function MacTitleBar({ label }) {
  return (
    <div style={{
      height: 36, paddingLeft: 14, paddingRight: 14,
      background: 'var(--bg-toolbar)',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
      </div>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
        {label || 'AI 陪练 · 管理后台'}
      </div>
      <div style={{ width: 52 }} />
    </div>
  );
}

// Mobile tab bar (3 tabs)
function MobileTabBar({ active = 'home' }) {
  const tabs = [
    { id: 'home', label: '首页', icon: 'house' },
    { id: 'bell', label: '通知', icon: 'bell', badge: 3 },
    { id: 'me', label: '我的', icon: 'person' },
  ];
  return (
    <div style={{
      height: 49 + 28,
      paddingBottom: 28,
      borderTop: '1px solid var(--separator)',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexShrink: 0,
    }}>
      {tabs.map(t => (
        <div key={t.id} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          color: active === t.id ? 'var(--color-primary)' : 'var(--text-tertiary)',
          fontWeight: active === t.id ? 600 : 500, fontSize: 10,
          position: 'relative',
        }}>
          <div style={{ position: 'relative' }}>
            {active === t.id ? <IconFilled name={t.icon} size={26} /> : <Icon name={t.icon} size={26} strokeWidth={1.6} />}
            {t.badge && (
              <span style={{ position: 'absolute', top: -2, right: -8, background: 'var(--color-danger)', color: 'white', fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 8, minWidth: 14, textAlign: 'center' }}>{t.badge}</span>
            )}
          </div>
          <span>{t.label}</span>
        </div>
      ))}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 134, height: 5, background: 'var(--text-primary)', borderRadius: 3, opacity: 0.85 }} />
    </div>
  );
}

window.PhoneFrame = PhoneFrame;
window.DesktopFrame = DesktopFrame;
window.PhoneStatusBar = PhoneStatusBar;
window.HomeIndicator = HomeIndicator;
window.MobileTabBar = MobileTabBar;
window.MacTitleBar = MacTitleBar;
