// SF Symbols-inspired icon set, drawn as inline SVGs
// Usage: <Icon name="house" size={20} />
// All icons use currentColor so they inherit text color.

const ICONS = {
  // Tabs / nav
  house: <><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z"/></>,
  bell: <><path d="M12 3a6 6 0 0 0-6 6v3.5L4 16h16l-2-3.5V9a6 6 0 0 0-6-6z"/><path d="M9 19a3 3 0 0 0 6 0"/></>,
  person: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>,
  // Common UI
  chevronRight: <><path d="M9 6l6 6-6 6"/></>,
  chevronLeft: <><path d="M15 6l-6 6 6 6"/></>,
  chevronDown: <><path d="M6 9l6 6 6-6"/></>,
  chevronUp: <><path d="M6 15l6-6 6 6"/></>,
  close: <><path d="M6 6l12 12M18 6L6 18"/></>,
  check: <><path d="M5 13l4 4L19 7"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  minus: <><path d="M5 12h14"/></>,
  more: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  // Tasks
  bookOpen: <><path d="M3 5a2 2 0 0 1 2-2h5v18H5a2 2 0 0 1-2-2V5z"/><path d="M21 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 0 2-2V5z"/></>,
  chatBubble: <><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V5z"/></>,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></>,
  micOff: <><path d="M5 11a7 7 0 0 0 14 0"/><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M3 3l18 18" stroke-linecap="round"/></>,
  play: <><path d="M7 4l13 8-13 8V4z"/></>,
  pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  stop: <><rect x="6" y="6" width="12" height="12" rx="2"/></>,
  // Status
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  warning: <><path d="M12 4l10 17H2L12 4z"/><path d="M12 10v5M12 18v.5" stroke="white" strokeWidth="2"/></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  unlock: <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7-1"/></>,
  star: <><path d="M12 3l3 6 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-6.5L3 10l6-1 3-6z"/></>,
  // Files
  doc: <><path d="M6 3h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v4h4"/></>,
  folder: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></>,
  download: <><path d="M12 4v12M6 12l6 6 6-6M4 21h16"/></>,
  upload: <><path d="M12 20V4M6 12l6-6 6 6M4 21h16"/></>,
  // Edit
  edit: <><path d="M4 20h4L20 8l-4-4L4 16v4z"/></>,
  trash: <><path d="M5 7h14M9 7V4h6v3M7 7l1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13"/></>,
  // Misc
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a2 2 0 0 0 .4 2.2l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-2.2-.4 2 2 0 0 0-1.2 1.8V21a2 2 0 0 1-4 0v-.1a2 2 0 0 0-1.3-1.8 2 2 0 0 0-2.2.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a2 2 0 0 0 .4-2.2 2 2 0 0 0-1.8-1.2H3a2 2 0 0 1 0-4h.1a2 2 0 0 0 1.8-1.3 2 2 0 0 0-.4-2.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a2 2 0 0 0 2.2.4 2 2 0 0 0 1.2-1.8V3a2 2 0 0 1 4 0v.1a2 2 0 0 0 1.3 1.8 2 2 0 0 0 2.2-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a2 2 0 0 0-.4 2.2 2 2 0 0 0 1.8 1.2H21a2 2 0 0 1 0 4h-.1a2 2 0 0 0-1.8 1.2z"/></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
  refresh: <><path d="M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M2 12s3.5-7 10-7c2 0 4 .7 5.5 1.7M22 12s-3.5 7-10 7c-2 0-4-.7-5.5-1.7"/><path d="M3 3l18 18"/></>,
  filter: <><path d="M4 5h16l-6 8v6l-4-2v-4L4 5z"/></>,
  grid: <><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
  send: <><path d="M22 2L2 11l9 3 3 9 8-21z"/></>,
  bolt: <><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"/></>,
  trophy: <><path d="M8 21h8M12 17v4M6 4h12v4a6 6 0 0 1-12 0V4z"/><path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 0-3 3"/></>,
  sparkles: <><path d="M12 3l1.5 4 4 1.5-4 1.5L12 14l-1.5-4-4-1.5 4-1.5L12 3z"/><path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2zM5 16l.5 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5L5 16z"/></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></>,
  users: <><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 6 2 6 5"/></>,
  cube: <><path d="M12 3l9 5v8l-9 5-9-5V8l9-5z"/><path d="M3 8l9 5 9-5M12 13v9"/></>,
  chart: <><path d="M3 3v18h18"/><path d="M7 16l4-4 3 3 5-7"/></>,
  table: <><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M9 5v14M15 5v14"/></>,
  brain: <><path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3v1a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-1a3 3 0 0 0 3-3v-2a3 3 0 0 0-3-3V7a3 3 0 0 0-3-3H9z"/><path d="M12 4v16"/></>,
  pin: <><path d="M12 2l3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1 3-6z"/></>,
  rocket: <><path d="M5 19l3-3M9 15c-2 2-3 5-2 7 2 1 5 0 7-2M14 11l-1-1a8 8 0 0 1 8-8c0 4-2 7-5 8l-1-1M14 11l-3 3M14 11c-2 0-4 1-5 3"/></>,
  share: <><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 11l7-4M9 13l7 4"/></>,
  // Audio waveform placeholder (single bar shape)
  waveform: <><path d="M4 12h2M8 8v8M12 5v14M16 8v8M20 12h-2"/></>,
  paperPlane: <><path d="M3 11l18-8-8 18-2-7-8-3z"/></>,
  shield: <><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/></>,
  flask: <><path d="M9 3h6v5l5 10a2 2 0 0 1-2 3H6a2 2 0 0 1-2-3l5-10V3z"/><path d="M9 3h6"/></>,
  code: <><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></>,
  lightbulb: <><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1.5 2 1.5 3h5c0-1 .5-2 1.5-3a6 6 0 0 0-4-10z"/></>,
};

function Icon({ name, size = 20, strokeWidth = 1.7, color, style, className }) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {path}
    </svg>
  );
}

// Filled variants for tab bar / status indicators
function IconFilled({ name, size = 20, color, style, className }) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color || "currentColor"}
      stroke={color || "currentColor"}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {path}
    </svg>
  );
}

window.Icon = Icon;
window.IconFilled = IconFilled;
