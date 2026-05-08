// Common UI helpers + mock data shared across screens

// ============ MOCK DATA ============
const MOCK_USER = {
  name: '张明',
  initial: '张',
  dept: '华东大区·销售部',
  title: '高级客户经理',
  avatar: 'linear-gradient(135deg, #5AC8FA, #007AFF)',
  stats: { completed: 14, average: 84, highest: 96 },
};

const MOCK_TASKS_TODO = [
  {
    id: 't1', type: 'qa', title: '产品知识季度考核',
    desc: '覆盖2025 Q2新发布的企业级产品',
    deadline: '明天 18:00', urgency: 'urgent',
    practice: 'todo', exam: 'locked',
    materials: 3, questions: 10,
  },
  {
    id: 't2', type: 'roleplay', title: '大客户拜访模拟练习',
    desc: '面向制造业大客户的解决方案推销',
    deadline: '3 天后', urgency: 'soon',
    practice: 'done', exam: 'todo',
    materials: 2, roles: 3,
  },
  {
    id: 't3', type: 'qa', title: '合规与风控基础知识',
    desc: '反洗钱、客户身份识别、信息安全',
    deadline: '5 月 12 日', urgency: 'normal',
    practice: 'progress', exam: 'locked',
    materials: 5, questions: 15,
  },
  {
    id: 't4', type: 'roleplay', title: '价格异议处理对练',
    desc: '应对常见的价格谈判场景',
    deadline: '5 月 15 日', urgency: 'normal',
    practice: 'todo', exam: 'locked',
    materials: 1, roles: 2,
  },
];

const MOCK_TASKS_DOING = [
  {
    id: 'd1', type: 'qa', title: '新员工入职考核',
    desc: '公司文化、规章制度、基础流程',
    deadline: '已完成练习', urgency: 'normal',
    practice: 'done', exam: 'progress',
    materials: 4, questions: 20,
  },
];

const MOCK_TASKS_DONE = [
  { id: 'c1', type: 'qa', title: 'CRM 系统使用考核', score: 92, level: 'excellent', date: '5月1日' },
  { id: 'c2', type: 'roleplay', title: '电话开场白练习', score: 78, level: 'pass', date: '4月28日' },
  { id: 'c3', type: 'qa', title: '产品定价策略', score: 85, level: 'pass', date: '4月25日' },
  { id: 'c4', type: 'qa', title: '客户分级管理', score: 91, level: 'excellent', date: '4月22日' },
  { id: 'c5', type: 'roleplay', title: '售后投诉处理', score: 76, level: 'pass', date: '4月18日' },
];

const MOCK_PERSONAS = [
  {
    id: 'p1', name: '李明华', age: 58, gender: 'male',
    industry: '制造业', title: '集团总经理',
    style: ['理性', '务实', '重数据'],
    avatar: { bg: 'linear-gradient(135deg, #FF9500, #FF6B00)', initial: '李' },
  },
  {
    id: 'p2', name: '王雪琴', age: 42, gender: 'female',
    industry: '零售连锁', title: '采购总监',
    style: ['谨慎', '强势', '关注成本'],
    avatar: { bg: 'linear-gradient(135deg, #AF52DE, #FF2D92)', initial: '王' },
  },
  {
    id: 'p3', name: '陈志远', age: 36, gender: 'male',
    industry: '互联网科技', title: 'CTO',
    style: ['技术导向', '快节奏', '直接'],
    avatar: { bg: 'linear-gradient(135deg, #34C759, #30B0C7)', initial: '陈' },
  },
  {
    id: 'p4', name: '苏婉清', age: 49, gender: 'female',
    industry: '金融银行', title: '风控副总',
    style: ['严谨', '审慎', '重合规'],
    avatar: { bg: 'linear-gradient(135deg, #5AC8FA, #007AFF)', initial: '苏' },
  },
];

const MOCK_DIALOGUE = [
  { role: 'system', text: '对练开始 · 与「李明华 · 制造业总经理」的虚拟拜访' },
  { role: 'ai', text: '你好啊，是小张吧？我们时间不多，今天你想跟我谈什么？请直接说重点。', audioDuration: 8 },
  { role: 'user', text: '李总您好，今天主要想跟您介绍我们针对制造业的智能MES解决方案，能帮助贵司在排产、设备稼动率、质量追溯三个方面实现 20% 以上的提升。', audioDuration: 14, score: 82 },
  { role: 'ai', text: '20%？这个数据是在哪个工厂得出来的？我们每年看的供应商不少，类似的承诺听过太多了。', audioDuration: 9 },
  { role: 'user', text: '我们最新的案例是江苏某汽车零部件龙头，去年三季度上线，第四季度排产周期从 7 天压缩到 3 天，OEE 从 65% 提升到 79%。我可以会后把案例完整资料发给您。', audioDuration: 17, score: 88 },
  { role: 'ai', text: '好。那你说说看，跟你们竞品比，你们的核心差异化到底在哪？我不要听"更智能"这种话。', audioDuration: 10 },
];

const MOCK_QUESTIONS = [
  {
    id: 'q1', text: '请介绍我们产品在企业级市场的三个核心差异化优势，并结合一个真实客户案例展开说明。',
    score: 75, max: 100, level: 'pass',
    feedback: '回答覆盖了核心要点，表述清晰；但未提及与主要竞品的具体对比分析，案例的数据支撑可以更充分。',
    reference: '我们产品的三大核心优势：1) 全栈自研AI能力，端到端响应低于200ms（竞品普遍500ms+）；2) 行业Know-how沉淀超过8年，累计服务1200+企业客户；3) 私有化部署支持完整，符合金融与制造业合规要求。典型案例：某汽车零部件龙头通过我司方案实现OEE从65%→79%。',
    points: [
      { name: '产品优势', weight: 30, score: 28, hit: true },
      { name: '客户案例', weight: 30, score: 22, hit: true },
      { name: '竞品对比', weight: 25, score: 10, hit: false },
      { name: '数据量化', weight: 15, score: 15, hit: true },
    ],
  },
];

// ============ Reusable UI ============
function Pill({ children, color = 'var(--color-primary)', bg, size = 's' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'xs' ? '2px 8px' : '4px 10px',
      borderRadius: 'var(--radius-full)',
      background: bg || `color-mix(in oklab, ${color} 12%, white)`,
      color, fontSize: size === 'xs' ? 11 : 12, fontWeight: 600,
      lineHeight: 1.4,
    }}>{children}</span>
  );
}

function Btn({ children, variant = 'primary', size = 'm', icon, onClick, fullWidth, disabled, style }) {
  const variants = {
    primary: { bg: 'var(--color-primary)', color: 'white' },
    secondary: { bg: 'rgba(118,118,128,0.12)', color: 'var(--text-primary)' },
    ghost: { bg: 'transparent', color: 'var(--color-primary)' },
    danger: { bg: 'var(--color-danger)', color: 'white' },
    success: { bg: 'var(--color-success)', color: 'white' },
  };
  const v = variants[variant];
  const sizes = {
    s: { padding: '6px 12px', fontSize: 13, h: 32 },
    m: { padding: '10px 18px', fontSize: 15, h: 40 },
    l: { padding: '14px 24px', fontSize: 17, h: 52 },
  };
  const sz = sizes[size];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: sz.padding, fontSize: sz.fontSize, fontWeight: 600,
      borderRadius: 'var(--radius-full)',
      background: disabled ? 'rgba(118,118,128,0.18)' : v.bg,
      color: disabled ? 'var(--text-tertiary)' : v.color,
      width: fullWidth ? '100%' : 'auto',
      transition: 'all 200ms', cursor: disabled ? 'not-allowed' : 'pointer',
      ...style,
    }}>
      {icon && <Icon name={icon} size={sz.fontSize + 1} />}
      {children}
    </button>
  );
}

function Card({ children, padding = 16, style, onClick, hover }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-surface)',
      borderRadius: 'var(--radius-m)',
      boxShadow: 'var(--shadow-1)',
      padding,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 200ms',
      ...style,
    }}>{children}</div>
  );
}

const TASK_TYPE_META = {
  qa: { label: '知识问答', color: '#007AFF', bg: 'rgba(0,122,255,0.12)', icon: 'bookOpen' },
  roleplay: { label: '模拟对练', color: '#34C759', bg: 'rgba(52,199,89,0.12)', icon: 'chatBubble' },
  pitch: { label: '方案试讲', color: '#FF9500', bg: 'rgba(255,149,0,0.12)', icon: 'mic' },
};

const URGENCY_META = {
  urgent: { color: 'var(--color-danger)', icon: 'warning' },
  soon: { color: 'var(--color-warning)', icon: 'clock' },
  normal: { color: 'var(--text-secondary)', icon: 'clock' },
};

window.MOCK_USER = MOCK_USER;
window.MOCK_TASKS_TODO = MOCK_TASKS_TODO;
window.MOCK_TASKS_DOING = MOCK_TASKS_DOING;
window.MOCK_TASKS_DONE = MOCK_TASKS_DONE;
window.MOCK_PERSONAS = MOCK_PERSONAS;
window.MOCK_DIALOGUE = MOCK_DIALOGUE;
window.MOCK_QUESTIONS = MOCK_QUESTIONS;
window.Pill = Pill;
window.Btn = Btn;
window.Card = Card;
window.TASK_TYPE_META = TASK_TYPE_META;
window.URGENCY_META = URGENCY_META;
