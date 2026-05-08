// Admin (mac-theme) shared chrome — sidebar + topbar
// All admin screens compose AdminFrame around their content.

const ADMIN_NAV = [
  { group: '概览', items: [
    { id: 'dashboard', label: '仪表盘', icon: 'chart' },
  ]},
  { group: '用户管理', items: [
    { id: 'users', label: '用户列表', icon: 'users' },
    { id: 'groups', label: '用户分组', icon: 'cube' },
  ]},
  { group: '内容管理', items: [
    { id: 'files', label: '文件库', icon: 'folder' },
    { id: 'banks', label: '题库管理', icon: 'bookOpen' },
    { id: 'personas', label: '角色库', icon: 'users' },
  ]},
  { group: '培训任务', items: [
    { id: 'tasks-qa', label: '知识问答', icon: 'doc' },
    { id: 'tasks-rp', label: '模拟对练', icon: 'chatBubble' },
  ]},
  { group: '数据报表', items: [
    { id: 'reports', label: '任务报表', icon: 'chart' },
  ]},
  { group: '系统设置', items: [
    { id: 'tenant', label: '企业设置', icon: 'building' },
    { id: 'audit', label: '审计日志', icon: 'shield' },
  ]},
];

const SUPERADMIN_NAV = [
  { id: 'tenants', label: '企业账号', icon: 'building' },
  { id: 'prompts', label: 'Prompt 管理', icon: 'code' },
  { id: 'aiconfig', label: 'AI 配置', icon: 'sparkles' },
];

function AdminSidebar({ active = 'dashboard', superadmin = false }) {
  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
      borderRight: '1px solid var(--border)',
      padding: '12px 8px',
      overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
      fontSize: 13,
    }}>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #0066CC, #5856D6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={15} color="white" />
        </div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>AI 陪练</div>
      </div>

      {ADMIN_NAV.map(group => (
        <div key={group.group}>
          <div style={{ padding: '4px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{group.group}</div>
          {group.items.map(it => (
            <div key={it.id} style={{
              padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
              background: active === it.id ? 'var(--bg-selected)' : 'transparent',
              color: active === it.id ? 'var(--color-primary)' : 'var(--text-primary)',
              fontWeight: active === it.id ? 600 : 500, cursor: 'pointer',
              borderLeft: active === it.id ? '3px solid var(--color-primary)' : '3px solid transparent',
              paddingLeft: active === it.id ? 9 : 12,
            }}>
              <Icon name={it.icon} size={15}/>
              <span>{it.label}</span>
            </div>
          ))}
        </div>
      ))}

      {superadmin && (
        <>
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 12px' }}/>
          <div>
            <div style={{ padding: '4px 12px', fontSize: 10, fontWeight: 700, color: 'var(--color-purple)', letterSpacing: 0.5, textTransform: 'uppercase' }}>超管</div>
            {SUPERADMIN_NAV.map(it => (
              <div key={it.id} style={{
                padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
                background: active === it.id ? 'rgba(175,82,222,0.10)' : 'transparent',
                color: active === it.id ? 'var(--color-purple)' : 'var(--text-primary)',
                fontWeight: active === it.id ? 600 : 500, cursor: 'pointer',
                borderLeft: active === it.id ? '3px solid var(--color-purple)' : '3px solid transparent',
                paddingLeft: active === it.id ? 9 : 12,
              }}>
                <Icon name={it.icon} size={15}/>
                <span>{it.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--separator)', marginTop: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #FF9500, #FF2D92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 12 }}>许</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>许文涛</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>管理员</div>
        </div>
        <Icon name="more" size={14} color="var(--text-secondary)" />
      </div>
    </div>
  );
}

function AdminToolbar({ breadcrumb = ['仪表盘'], actions }) {
  return (
    <div style={{
      height: 44, padding: '0 20px', flexShrink: 0,
      background: 'rgba(246,246,246,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
    }}>
      {breadcrumb.map((b, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="chevronRight" size={11} color="var(--text-tertiary)" />}
          <span style={{ color: i === breadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: i === breadcrumb.length - 1 ? 600 : 500 }}>{b}</span>
        </React.Fragment>
      ))}
      <div style={{ flex: 1 }}/>
      {actions}
    </div>
  );
}

function AdminBtn({ children, variant = 'primary', icon, onClick, style }) {
  const variants = {
    primary: { bg: 'var(--color-primary)', color: 'white' },
    secondary: { bg: 'white', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' },
    ghost: { bg: 'transparent', color: 'var(--color-primary)' },
    danger: { bg: 'var(--color-danger)', color: 'white' },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', fontSize: 13, fontWeight: 600,
      borderRadius: 7,
      background: v.bg, color: v.color, border: v.border || 'none',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'all 200ms', whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon && <Icon name={icon} size={14}/>}
      {children}
    </button>
  );
}

function AdminFrame({ active = 'dashboard', breadcrumb, actions, children, label, superadmin, width = 1280, height = 800 }) {
  return (
    <DesktopFrame label={label} width={width} height={height}>
      <AdminSidebar active={active} superadmin={superadmin}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminToolbar breadcrumb={breadcrumb} actions={actions}/>
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-grouped)' }}>
          {children}
        </div>
      </div>
    </DesktopFrame>
  );
}

window.AdminSidebar = AdminSidebar;
window.AdminToolbar = AdminToolbar;
window.AdminBtn = AdminBtn;
window.AdminFrame = AdminFrame;
