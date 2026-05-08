// L02 · 主页（任务列表）— Mobile + PC
// L03 · 通知中心
// L04 · 个人中心

function TaskCard({ task, expanded }) {
  const meta = TASK_TYPE_META[task.type];
  const urg = URGENCY_META[task.urgency];
  return (
    <div style={{
      background: 'white', borderRadius: 'var(--radius-m)',
      padding: 14, boxShadow: 'var(--shadow-1)',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'all 200ms',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: meta.bg, color: meta.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name={meta.icon} size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: meta.color, letterSpacing: 0.3 }}>{meta.label.toUpperCase()}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, lineHeight: 1.3 }}>{task.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{task.desc}</div>
        </div>
        <Icon name="chevronRight" size={18} color="var(--text-tertiary)" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--separator)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusDot label="练习" state={task.practice} />
          <StatusDot label="考核" state={task.exam} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: urg.color, fontSize: 12, fontWeight: 600 }}>
          <Icon name={urg.icon} size={13} />
          <span>{task.deadline}</span>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ label, state }) {
  const map = {
    todo: { bg: 'transparent', border: '#C7C7CC', icon: null, text: '待开始', color: 'var(--text-secondary)' },
    progress: { bg: 'var(--color-primary)', border: 'var(--color-primary)', icon: null, text: '进行中', color: 'var(--color-primary)' },
    done: { bg: 'var(--color-success)', border: 'var(--color-success)', icon: 'check', text: '已完成', color: 'var(--color-success)' },
    locked: { bg: 'transparent', border: '#C7C7CC', icon: 'lock', text: '待解锁', color: 'var(--text-tertiary)' },
  };
  const m = map[state];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: m.color, fontWeight: 600 }}>
      <span style={{
        width: 12, height: 12, borderRadius: '50%',
        background: m.bg, border: `1.5px solid ${m.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {m.icon === 'check' && <Icon name="check" size={8} color="white" strokeWidth={3} />}
        {m.icon === 'lock' && <Icon name="lock" size={7} color="var(--text-tertiary)" strokeWidth={2} />}
      </span>
      {label}·{m.text}
    </div>
  );
}

function L02_Mobile() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label: '待完成', count: MOCK_TASKS_TODO.length, list: MOCK_TASKS_TODO },
    { label: '进行中', count: MOCK_TASKS_DOING.length, list: MOCK_TASKS_DOING },
    { label: '已完成', count: MOCK_TASKS_DONE.length, list: [] },
  ];
  return (
    <PhoneFrame>
      {/* Header */}
      <div style={{
        padding: '8px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>欢迎回来</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{MOCK_USER.name}，加油 👋</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: MOCK_USER.avatar,
          color: 'white', fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{MOCK_USER.initial}</div>
      </div>

      {/* Segmented control */}
      <div style={{ padding: '4px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', background: 'rgba(118,118,128,0.12)', borderRadius: 9, padding: 2, position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 2, bottom: 2,
            width: `calc(${100 / 3}% - 1px)`,
            left: `calc(${tab * (100 / 3)}% + ${tab === 0 ? 2 : 1}px)`,
            background: 'white', borderRadius: 7,
            transition: 'left 250ms var(--ease-standard)',
            boxShadow: '0 1px 3px rgba(0,0,0,.08)',
          }}/>
          {tabs.map((t, i) => (
            <div key={i} onClick={() => setTab(i)} style={{
              flex: 1, padding: '6px 0', textAlign: 'center', fontSize: 13, fontWeight: 600,
              color: tab === i ? 'var(--text-primary)' : 'var(--text-secondary)',
              position: 'relative', zIndex: 1, cursor: 'pointer',
            }}>{t.label} {t.count > 0 && `(${t.count})`}</div>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab !== 2 && tabs[tab].list.map(t => <TaskCard key={t.id} task={t} />)}
        {tab === 2 && MOCK_TASKS_DONE.map(t => (
          <div key={t.id} style={{
            background: 'white', borderRadius: 'var(--radius-m)', padding: 14, opacity: 0.7,
            display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-1)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: TASK_TYPE_META[t.type].bg, color: TASK_TYPE_META[t.type].color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><Icon name={TASK_TYPE_META[t.type].icon} size={20} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{t.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>完成于 {t.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: getLevel(t.score).color, lineHeight: 1 }}>{t.score}</div>
              <Pill color={getLevel(t.score).color} size="xs">{getLevel(t.score).label}</Pill>
            </div>
          </div>
        ))}
      </div>

      <MobileTabBar active="home" />
    </PhoneFrame>
  );
}

function L02_PC() {
  return (
    <DesktopFrame label="AI 陪练 · 学习端" width={1280} height={800}>
      <PCSidebar active="home" />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <PCTopbar />
        <div style={{ padding: '32px 40px', flex: 1 }}>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>欢迎回来，{MOCK_USER.name} 👋</div>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>本周还有 {MOCK_TASKS_TODO.length} 个待完成任务，加油完成它们</div>

          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: '本月已完成', value: 14, color: 'var(--color-primary)', icon: 'check' },
              { label: '平均分', value: 84, color: 'var(--color-success)', icon: 'chart' },
              { label: '最高分', value: 96, color: 'var(--color-warning)', icon: 'trophy' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'white', borderRadius: 12, padding: 18,
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: 'var(--shadow-1)',
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `color-mix(in oklab, ${s.color} 12%, white)`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={s.icon} size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                    <AnimatedNumber value={s.value} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>待完成任务</div>
            <Pill color="var(--color-primary)">{MOCK_TASKS_TODO.length}</Pill>
            <div style={{ flex: 1 }} />
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 13 }}>
              查看全部 <Icon name="chevronRight" size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {MOCK_TASKS_TODO.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>
      </div>
    </DesktopFrame>
  );
}

function PCSidebar({ active = 'home' }) {
  const items = [
    { id: 'home', label: '首页', icon: 'house' },
    { id: 'bell', label: '通知', icon: 'bell', badge: 3 },
    { id: 'me', label: '我的', icon: 'person' },
  ];
  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--separator)',
      padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ padding: '8px 12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #007AFF, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={18} color="white" />
        </div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>AI 陪练</div>
      </div>
      {items.map(it => (
        <div key={it.id} style={{
          padding: '10px 12px', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 10,
          background: active === it.id ? 'var(--color-primary-light)' : 'transparent',
          color: active === it.id ? 'var(--color-primary)' : 'var(--text-primary)',
          fontWeight: active === it.id ? 600 : 500, fontSize: 14, cursor: 'pointer',
        }}>
          <Icon name={it.icon} size={20} />
          <span style={{ flex: 1 }}>{it.label}</span>
          {it.badge && <span style={{ background: 'var(--color-danger)', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{it.badge}</span>}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{
        margin: '0 4px', padding: 12,
        background: 'linear-gradient(135deg, rgba(0,122,255,0.08), rgba(88,86,214,0.08))',
        borderRadius: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-primary)', fontWeight: 600 }}>
          <Icon name="bolt" size={14} /> 学习提示
        </div>
        坚持每日练习 15 分钟，可显著提升留存率
      </div>
    </div>
  );
}

function PCTopbar() {
  return (
    <div style={{
      height: 52, padding: '0 28px', flexShrink: 0,
      background: 'rgba(246,246,246,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--separator)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>首页 / 任务列表</div>
      <div style={{ flex: 1 }} />
      <div style={{
        width: 280, height: 32, padding: '0 12px',
        background: 'rgba(118,118,128,0.10)', borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13,
      }}>
        <Icon name="search" size={14} /> 搜索任务、题库、角色...
      </div>
      <Icon name="bell" size={20} color="var(--text-secondary)" />
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: MOCK_USER.avatar,
        color: 'white', fontWeight: 600, fontSize: 13,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{MOCK_USER.initial}</div>
    </div>
  );
}

window.L02_Mobile = L02_Mobile;
window.L02_PC = L02_PC;
window.PCSidebar = PCSidebar;
window.PCTopbar = PCTopbar;
window.TaskCard = TaskCard;
