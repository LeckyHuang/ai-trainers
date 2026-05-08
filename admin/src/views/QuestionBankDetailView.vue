<!-- ## 题库详情：题目 CRUD，AI 从文本/文件自动提取生成题目 -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { banksApi, filesApi } from '@/api'
import type { QuestionBank, Question, ScorePoint, FileItem } from '@/api/types'
import Modal from '@/components/Modal.vue'
import AdminIcon from '@/components/AdminIcon.vue'
import { showToast } from '@/composables/toast'

const route = useRoute()
const router = useRouter()
const bankId = route.params.id as string

const bank = ref<QuestionBank | null>(null)
const questions = ref<Question[]>([])
const loading = ref(false)
const generating = ref(false)

const showAddModal = ref(false)
const showGenModal = ref(false)
const saving = ref(false)

// ── A08d: single-question edit drawer ──────────────────────────────────────
const editingQ = ref<any | null>(null)
const editForm = ref({
  question_type: '',
  difficulty: '',
  score: 1,
  question_text: '',
  options: [] as { text: string; is_correct: boolean }[],
  reference_answer: '',
  knowledge_point: '',
  score_points: [] as { description: string; weight: number }[],
})
const editKpInput = ref('')
const editKpTags = ref<string[]>([])

function openDrawer(q: any) {
  editingQ.value = q
  editForm.value = {
    question_type: q.question_type || '简答',
    difficulty: q.difficulty || 'medium',
    score: q.max_score ?? q.score ?? 1,
    question_text: q.question_text || '',
    options: Array.isArray(q.options)
      ? q.options.map((o: any, i: number) => ({
          text: typeof o === 'string' ? o : o.text || '',
          is_correct: q.correct_options?.includes(i) || q.correct_option === i || o.is_correct || false,
        }))
      : [],
    reference_answer: q.answer_text || q.reference_answer || '',
    knowledge_point: q.knowledge_point || '',
    score_points: q.score_points
      ? q.score_points.map((sp: any) => ({ description: sp.keyword || sp.description || '', weight: sp.weight || 0 }))
      : [],
  }
  editKpTags.value = q.knowledge_point ? [q.knowledge_point] : []
  editKpInput.value = ''
}

function closeDrawer() {
  editingQ.value = null
}

function drawerDiffClass(d: string) {
  return { easy: 'seg-easy', medium: 'seg-medium', hard: 'seg-hard' }[d] || 'seg-medium'
}

function drawerAddOption() {
  editForm.value.options.push({ text: '', is_correct: false })
}

function drawerRemoveOption(i: number) {
  editForm.value.options.splice(i, 1)
}

function drawerSetCorrect(i: number) {
  const type = editForm.value.question_type
  if (type === '单选') {
    editForm.value.options = editForm.value.options.map((o, idx) => ({ ...o, is_correct: idx === i }))
  } else {
    editForm.value.options[i].is_correct = !editForm.value.options[i].is_correct
  }
}

function drawerAddKp() {
  const tag = editKpInput.value.trim()
  if (!tag) return
  if (!editKpTags.value.includes(tag)) editKpTags.value.push(tag)
  editKpInput.value = ''
}

function drawerRemoveKp(i: number) {
  editKpTags.value.splice(i, 1)
}

function drawerAddScorePoint() {
  editForm.value.score_points.push({ description: '', weight: 0 })
}

function drawerRemoveScorePoint(i: number) {
  editForm.value.score_points.splice(i, 1)
}

async function drawerSave() {
  if (!editingQ.value) return
  saving.value = true
  try {
    const payload: any = {
      question_text: editForm.value.question_text,
      answer_text: editForm.value.reference_answer,
      max_score: editForm.value.score,
      difficulty: editForm.value.difficulty,
      question_type: editForm.value.question_type,
      knowledge_point: editKpTags.value.join(',') || editForm.value.knowledge_point,
      score_points: editForm.value.score_points.map(sp => ({ keyword: sp.description, weight: sp.weight, match_type: 'semantic' })),
    }
    if (['单选', '多选'].includes(editForm.value.question_type)) {
      payload.options = editForm.value.options.map(o => o.text)
      const corrects = editForm.value.options.map((o, i) => o.is_correct ? i : -1).filter(i => i >= 0)
      payload.correct_options = corrects
      if (editForm.value.question_type === '单选') payload.correct_option = corrects[0] ?? 0
    }
    await banksApi.updateQuestion(bankId, editingQ.value.id, payload)
    const idx = questions.value.findIndex(x => x.id === editingQ.value.id)
    if (idx >= 0) questions.value[idx] = { ...questions.value[idx], ...payload }
    showToast('保存成功', 'success')
    closeDrawer()
  } catch (e: any) { showToast(e?.message || '保存失败', 'error') }
  saving.value = false
}

async function drawerDelete() {
  if (!editingQ.value) return
  if (!confirm('确认删除此题目？此操作不可撤销。')) return
  try {
    await banksApi.deleteQuestion(bankId, editingQ.value.id)
    questions.value = questions.value.filter(x => x.id !== editingQ.value.id)
    showToast('已删除', 'success')
    closeDrawer()
  } catch { showToast('删除失败', 'error') }
}
// ───────────────────────────────────────────────────────────────────────────

const emptyForm = () => ({
  question_text: '',
  answer_text: '',
  max_score: 100,
  difficulty: 'medium' as string,
  score_points: [] as ScorePoint[],
})
const qForm = ref(emptyForm())
const genForm = ref({ material_text: '', question_count: 10 })
const genMode = ref<'text' | 'file'>('text')
const fileList = ref<FileItem[]>([])
const selectedFileId = ref('')
const loadingFiles = ref(false)
const spKeyword = ref('')
const spWeight = ref(30)

// Collapsible question rows — track by index
const expandedIdx = ref<number | null>(null)
function toggleExpand(idx: number) {
  expandedIdx.value = expandedIdx.value === idx ? null : idx
}

// Filter state
const filterType = ref('')
const filterDiff = ref('')
const searchText = ref('')

// Computed filtered questions
const filteredQuestions = computed(() => {
  return questions.value.filter(q => {
    if (filterType.value && (q as any).question_type !== filterType.value) return false
    if (filterDiff.value && q.difficulty !== filterDiff.value) return false
    if (searchText.value && !q.question_text.includes(searchText.value)) return false
    return true
  })
})

// Distribution: compute type breakdown from questions
const typeDistribution = computed(() => {
  const map: Record<string, number> = { 单选: 0, 多选: 0, 判断: 0, 简答: 0 }
  for (const q of questions.value) {
    const t = (q as any).question_type || '简答'
    if (t in map) map[t]++
    else map['简答']++
  }
  return map
})

const totalForDist = computed(() => Object.values(typeDistribution.value).reduce((a, b) => a + b, 0))

// Knowledge point cloud: collect unique knowledge_point tags
const knowledgeCloud = computed(() => {
  const map: Record<string, number> = {}
  for (const q of questions.value) {
    const kp = (q as any).knowledge_point
    if (kp) map[kp] = (map[kp] || 0) + 1
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])
})

async function load() {
  loading.value = true
  try {
    const [bankRes, qRes] = await Promise.all([
      banksApi.get(bankId),
      banksApi.listQuestions(bankId, { page: 1, page_size: 200 }),
    ])
    bank.value = bankRes
    questions.value = qRes.items
  } catch { showToast('加载失败', 'error') }
  loading.value = false
}

onMounted(load)

function addScorePoint() {
  const kw = spKeyword.value.trim()
  if (!kw) return
  qForm.value.score_points.push({ keyword: kw, weight: spWeight.value, match_type: 'semantic' })
  spKeyword.value = ''
  spWeight.value = 30
}

function removeScorePoint(idx: number) {
  qForm.value.score_points.splice(idx, 1)
}

async function saveQuestion() {
  if (!qForm.value.question_text || !qForm.value.answer_text) {
    showToast('请填写题目和答案', 'error'); return
  }
  saving.value = true
  try {
    const payload = {
      question_text: qForm.value.question_text,
      answer_text: qForm.value.answer_text,
      max_score: qForm.value.max_score,
      difficulty: qForm.value.difficulty,
      score_points: qForm.value.score_points,
    }
    await banksApi.createQuestion(bankId, payload)
    showToast('添加成功', 'success')
    showAddModal.value = false
    load()
  } catch (e: any) { showToast(e?.message || '操作失败', 'error') }
  saving.value = false
}

function openEdit(q: Question) {
  openDrawer(q)
}

function openAdd() {
  qForm.value = emptyForm()
  spKeyword.value = ''
  spWeight.value = 30
  showAddModal.value = true
}

async function openGenModal() {
  genMode.value = 'text'
  genForm.value = { material_text: '', question_count: 10 }
  selectedFileId.value = ''
  showGenModal.value = true
}

async function switchGenMode(mode: 'text' | 'file') {
  genMode.value = mode
  if (mode === 'file' && fileList.value.length === 0) {
    loadingFiles.value = true
    try {
      const res = await filesApi.list({ page: 1, page_size: 100 })
      fileList.value = (res.items || []).filter((f: FileItem) =>
        f.mime_type === 'application/pdf' || f.original_name?.toLowerCase().endsWith('.pdf')
      )
    } catch { showToast('加载文件列表失败', 'error') }
    loadingFiles.value = false
  }
}

async function generateQuestions() {
  generating.value = true
  showGenModal.value = false
  try {
    let res: any
    if (genMode.value === 'file') {
      if (!selectedFileId.value) { showToast('请选择文件', 'error'); generating.value = false; return }
      res = await banksApi.generateFromFile(bankId, {
        file_id: selectedFileId.value,
        question_count: genForm.value.question_count,
      })
    } else {
      if (!genForm.value.material_text) { showToast('请输入素材文本', 'error'); generating.value = false; return }
      res = await banksApi.generate(bankId, {
        material_text: genForm.value.material_text,
        question_count: genForm.value.question_count,
      })
    }
    showToast(`AI 生成了 ${res.created ?? res.questions?.length ?? 0} 道题目`, 'success')
    genForm.value = { material_text: '', question_count: 10 }
    selectedFileId.value = ''
    load()
  } catch (e: any) { showToast(e?.detail || e?.message || 'AI 生成失败', 'error') }
  generating.value = false
}

async function deleteQuestion(q: Question) {
  if (!confirm('确认删除此题目？')) return
  try {
    await banksApi.deleteQuestion(bankId, q.id)
    questions.value = questions.value.filter(x => x.id !== q.id)
    showToast('已删除', 'success')
  } catch { showToast('删除失败', 'error') }
}

function diffLabel(d: string) {
  return { easy: '简单', medium: '中等', hard: '困难' }[d] || d
}

function typeLabel(q: Question) {
  return (q as any).question_type || '简答'
}

function typeClass(q: Question) {
  const t = (q as any).question_type || '简答'
  const map: Record<string, string> = { '单选': 'type-primary', '多选': 'type-purple', '判断': 'type-success', '简答': 'type-warning' }
  return map[t] || 'type-warning'
}

const TYPE_COLORS = [
  { key: '单选', color: '#0066CC', bg: 'rgba(0,102,204,0.12)' },
  { key: '多选', color: '#5856D6', bg: 'rgba(88,86,214,0.12)' },
  { key: '判断', color: '#34C759', bg: 'rgba(52,199,89,0.12)' },
  { key: '简答', color: '#FF9500', bg: 'rgba(255,149,0,0.12)' },
]


</script>

<template>
  <div class="page-wrap">
    <!-- Page header: back + action buttons -->
    <div class="page-header">
      <div class="header-top">
        <button class="back-btn" @click="router.push('/question-banks')">‹ 返回题库列表</button>
      </div>
      <div class="header-main">
        <div>
          <h2>{{ bank?.name || '题库详情' }}</h2>
        </div>
        <div class="header-actions">
          <button class="btn-ai" :disabled="generating" @click="openGenModal">
            {{ generating ? 'AI 生成中...' : 'AI 生成题目' }}
          </button>
          <button class="btn-primary" @click="openAdd">+ 手动添加</button>
        </div>
      </div>
    </div>

    <div v-if="generating" class="generating-banner">
      <span class="spin"><AdminIcon name="clock" /></span>
      AI 正在生成题目，约需 30 秒，请耐心等候...
    </div>

    <div v-if="loading" class="loading-state">加载中...</div>

    <template v-else>
      <!-- Overview card -->
      <div class="overview-card" v-if="bank">
        <div class="overview-left">
          <div class="overview-icon">
            <AdminIcon name="question-bank" />
          </div>
          <div class="overview-info">
            <div class="overview-name">{{ bank.name }}</div>
            <span class="overview-category">{{ (bank as any).category || '通用' }}</span>
            <div class="overview-desc">{{ bank.description || '暂无描述' }}</div>
          </div>
        </div>
        <div class="overview-stats">
          <div class="stat-item">
            <div class="stat-num">{{ questions.length }}</div>
            <div class="stat-label">题目总数</div>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <div class="stat-num">{{ (bank as any).tasks_count ?? '-' }}</div>
            <div class="stat-label">引用任务数</div>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <div class="stat-num">{{ (bank as any).accuracy != null ? ((bank as any).accuracy * 100).toFixed(0) + '%' : '-' }}</div>
            <div class="stat-label">平均正确率</div>
          </div>
        </div>
      </div>

      <!-- Distribution 2-column grid -->
      <div class="dist-grid" v-if="questions.length > 0">
        <!-- Left: 题型分布 -->
        <div class="dist-card">
          <div class="dist-title">题型分布</div>
          <!-- Segmented bar -->
          <div class="seg-bar">
            <div
              v-for="tc in TYPE_COLORS"
              :key="tc.key"
              class="seg-segment"
              :style="{
                width: totalForDist > 0 ? (typeDistribution[tc.key] / totalForDist * 100) + '%' : '0%',
                background: tc.color,
              }"
            />
          </div>
          <!-- Legend -->
          <div class="seg-legend">
            <div v-for="tc in TYPE_COLORS" :key="tc.key" class="legend-row">
              <span class="legend-dot" :style="{ background: tc.color }" />
              <span class="legend-key">{{ tc.key }}</span>
              <span class="legend-count">{{ typeDistribution[tc.key] }}</span>
            </div>
          </div>
        </div>

        <!-- Right: 知识点分布 -->
        <div class="dist-card">
          <div class="dist-title">知识点分布</div>
          <div v-if="knowledgeCloud.length === 0" class="kp-empty">暂无知识点标签</div>
          <div v-else class="kp-cloud">
            <span v-for="[kp, cnt] in knowledgeCloud" :key="kp" class="kp-tag">
              {{ kp }}<strong class="kp-cnt">{{ cnt }}</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state when no questions -->
      <div v-if="questions.length === 0" class="empty-state">
        <div class="empty-title">还没有题目</div>
        <div class="empty-sub">手动添加，或粘贴材料让 AI 自动生成</div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn-ghost" @click="openGenModal">AI 生成</button>
          <button class="btn-primary" @click="openAdd">+ 手动添加</button>
        </div>
      </div>

      <!-- Question list with filter bar -->
      <div v-else class="questions-section">
        <!-- Filter bar -->
        <div class="filter-bar">
          <div class="filter-chips">
            <button
              v-for="t in ['', '单选', '多选', '判断', '简答']"
              :key="t"
              class="filter-chip"
              :class="{ active: filterType === t }"
              @click="filterType = t; expandedIdx = null"
            >{{ t || '全部题型' }}</button>
          </div>
          <div class="filter-chips">
            <button
              v-for="d in [{ v: '', l: '全部难度' }, { v: 'easy', l: '简单' }, { v: 'medium', l: '中等' }, { v: 'hard', l: '困难' }]"
              :key="d.v"
              class="filter-chip"
              :class="{ active: filterDiff === d.v }"
              @click="filterDiff = d.v; expandedIdx = null"
            >{{ d.l }}</button>
          </div>
          <input
            v-model="searchText"
            class="filter-search"
            placeholder="搜索题目..."
            @input="expandedIdx = null"
          />
        </div>

        <!-- Question rows -->
        <div class="questions-list">
          <div
            v-for="(q, idx) in filteredQuestions"
            :key="q.id"
            class="q-card"
            :class="{ expanded: expandedIdx === idx }"
          >
            <!-- Collapsed header -->
            <div class="q-header" @click="toggleExpand(idx)">
              <span class="q-chevron" :class="{ open: expandedIdx === idx }">›</span>
              <div class="q-num">{{ idx + 1 }}</div>
              <div class="q-title-preview">{{ q.question_text }}</div>
              <span class="type-pill" :class="typeClass(q)">{{ typeLabel(q) }}</span>
              <span class="diff-pill" :class="q.difficulty || 'medium'">{{ diffLabel(q.difficulty || 'medium') }}</span>
              <div class="q-actions" @click.stop>
                <button class="icon-btn" @click="openEdit(q)" title="编辑">
                  <AdminIcon name="edit" />
                </button>
                <button class="icon-btn danger" @click="deleteQuestion(q)" title="删除">✕</button>
              </div>
            </div>

            <!-- Expanded content -->
            <div class="q-body" v-show="expandedIdx === idx">
              <div class="q-text">{{ q.question_text }}</div>

              <!-- Options if present -->
              <div v-if="(q as any).options?.length" class="q-options">
                <div
                  v-for="(opt, oi) in (q as any).options"
                  :key="oi"
                  class="q-option"
                  :class="{ correct: (q as any).correct_option === oi || (q as any).correct_options?.includes(oi) }"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + (oi as number)) }}.</span>
                  {{ opt }}
                </div>
              </div>

              <div class="q-answer">
                <span class="answer-label">参考答案：</span>{{ q.answer_text }}
              </div>

              <div v-if="q.score_points?.length" class="q-points">
                <span class="points-label">得分点：</span>
                <span v-for="(pt, i) in q.score_points" :key="i" class="point-tag">
                  {{ pt.keyword }}（{{ pt.weight }}分）
                </span>
              </div>

              <div v-if="(q as any).knowledge_point" class="q-kp">
                <span class="kp-label">知识点：</span>
                <span class="kp-pill">{{ (q as any).knowledge_point }}</span>
              </div>
            </div>
          </div>

          <div v-if="filteredQuestions.length === 0" class="filter-empty">
            没有符合条件的题目
          </div>
        </div>
      </div>
    </template>

    <!-- Add modal (手动添加) -->
    <Modal
      v-if="showAddModal"
      title="手动添加题目"
      :width="580"
      @close="showAddModal = false"
    >
      <div class="form-grid">
        <div class="field">
          <label>题目 <span class="required">*</span></label>
          <textarea v-model="qForm.question_text" placeholder="输入题目内容" rows="3" />
        </div>
        <div class="field">
          <label>参考答案 <span class="required">*</span></label>
          <textarea v-model="qForm.answer_text" placeholder="输入完整参考答案" rows="4" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>难度</label>
            <select v-model="qForm.difficulty">
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div class="field">
            <label>满分</label>
            <input v-model.number="qForm.max_score" type="number" min="1" max="200" />
          </div>
        </div>
        <div class="field">
          <label>得分点（可选，用于 AI 精确评分）</label>
          <div class="sp-tags" v-if="qForm.score_points.length > 0">
            <span v-for="(pt, i) in qForm.score_points" :key="i" class="sp-tag">
              {{ pt.keyword }}（{{ pt.weight }}分）
              <button @click="removeScorePoint(i)" class="sp-remove">×</button>
            </span>
          </div>
          <div class="sp-input-row">
            <input v-model="spKeyword" placeholder="关键词" @keyup.enter="addScorePoint" />
            <input v-model.number="spWeight" type="number" min="1" max="100" placeholder="分值" style="width:80px;flex-shrink:0" />
            <button class="btn-ghost sp-add-btn" @click="addScorePoint">+ 添加</button>
          </div>
          <div class="sp-hint">留空时 AI 将根据参考答案语义自动评分</div>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showAddModal = false">取消</button>
        <button class="btn-primary" :disabled="saving" @click="saveQuestion">
          {{ saving ? '保存中...' : '确认添加' }}
        </button>
      </template>
    </Modal>

    <!-- ── A08d Edit Drawer ──────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="editingQ" class="drawer-overlay" @click.self="closeDrawer">
        <div class="edit-drawer">
          <!-- Header -->
          <div class="drawer-header">
            <div class="drawer-header-left">
              <div class="drawer-title">编辑题目 · 第 {{ questions.findIndex(x => x.id === editingQ.id) + 1 }} 题</div>
              <div class="drawer-subtitle">{{ bank?.name }} · {{ new Date().toLocaleDateString('zh-CN') }}</div>
            </div>
            <button class="drawer-close" @click="closeDrawer">✕</button>
          </div>

          <!-- Body -->
          <div class="drawer-body">
            <!-- 3-col grid -->
            <div class="drawer-3col">
              <div class="drawer-field">
                <label>题型</label>
                <select v-model="editForm.question_type">
                  <option value="单选">单选</option>
                  <option value="多选">多选</option>
                  <option value="判断">判断</option>
                  <option value="简答">简答</option>
                </select>
              </div>
              <div class="drawer-field">
                <label>难度</label>
                <div class="seg-ctrl">
                  <button
                    v-for="d in [{ v:'easy', l:'简单' }, { v:'medium', l:'中等' }, { v:'hard', l:'困难' }]"
                    :key="d.v"
                    class="seg-btn"
                    :class="[drawerDiffClass(d.v), { active: editForm.difficulty === d.v }]"
                    @click="editForm.difficulty = d.v"
                  >{{ d.l }}</button>
                </div>
              </div>
              <div class="drawer-field">
                <label>分值</label>
                <input v-model.number="editForm.score" type="number" min="1" />
              </div>
            </div>

            <!-- 题干 -->
            <div class="drawer-field">
              <label>题干</label>
              <textarea v-model="editForm.question_text" style="min-height:60px;resize:vertical;" />
            </div>

            <!-- 选项 (单选/多选) -->
            <div v-if="['单选','多选'].includes(editForm.question_type)" class="drawer-field">
              <label>选项</label>
              <div class="options-list">
                <div
                  v-for="(opt, oi) in editForm.options"
                  :key="oi"
                  class="option-row"
                  :class="{ 'option-correct': opt.is_correct }"
                >
                  <button
                    class="opt-radio"
                    :class="{ 'opt-radio-correct': opt.is_correct }"
                    @click="drawerSetCorrect(oi)"
                    :title="opt.is_correct ? '已选为正确答案' : '设为正确答案'"
                  >{{ opt.is_correct ? '✓' : '' }}</button>
                  <span class="opt-letter">{{ String.fromCharCode(65 + oi) }}</span>
                  <input v-model="opt.text" class="opt-text" placeholder="选项内容" />
                  <button class="opt-remove" @click="drawerRemoveOption(oi)">✕</button>
                </div>
              </div>
              <button class="btn-ghost-sm" @click="drawerAddOption">+ 添加选项</button>
            </div>

            <!-- 参考答案 -->
            <div class="drawer-field">
              <label>参考答案</label>
              <textarea v-model="editForm.reference_answer" style="min-height:60px;resize:vertical;" />
            </div>

            <!-- 知识点标签 -->
            <div class="drawer-field">
              <label>知识点标签</label>
              <div class="kp-input-wrap">
                <div class="kp-pills">
                  <span v-for="(tag, ti) in editKpTags" :key="ti" class="kp-pill-edit">
                    {{ tag }}<button class="kp-pill-rm" @click="drawerRemoveKp(ti)">✕</button>
                  </span>
                  <input
                    v-model="editKpInput"
                    class="kp-inline-input"
                    placeholder="输入后按 Enter 确认"
                    @keyup.enter="drawerAddKp"
                    @keyup.comma="drawerAddKp"
                  />
                </div>
              </div>
            </div>

            <!-- 得分点 -->
            <div class="drawer-field">
              <label>得分点</label>
              <div class="sp-list">
                <div v-for="(sp, si) in editForm.score_points" :key="si" class="sp-row">
                  <input v-model="sp.description" class="sp-desc" placeholder="得分点描述" />
                  <input v-model.number="sp.weight" type="number" class="sp-weight" placeholder="权重%" min="0" max="100" />
                  <button class="opt-remove" @click="drawerRemoveScorePoint(si)">✕</button>
                </div>
              </div>
              <button class="btn-ghost-sm" @click="drawerAddScorePoint">+ 添加得分点</button>
            </div>
          </div>

          <!-- Footer -->
          <div class="drawer-footer">
            <button class="btn-danger" @click="drawerDelete">删除</button>
            <div style="display:flex;gap:8px">
              <button class="btn-ghost" @click="closeDrawer">取消</button>
              <button class="btn-primary" :disabled="saving" @click="drawerSave">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- AI generate modal -->
    <Modal v-if="showGenModal" title="AI 从材料生成题目" :width="640" @close="showGenModal = false">
      <div class="form-grid">
        <div class="gen-mode-tabs">
          <button :class="['mode-tab', genMode === 'text' ? 'active' : '']" @click="switchGenMode('text')">粘贴文本</button>
          <button :class="['mode-tab', genMode === 'file' ? 'active' : '']" @click="switchGenMode('file')">从文件库选择</button>
        </div>

        <template v-if="genMode === 'text'">
          <p class="hint-text">将培训材料、产品介绍、规章制度等文本粘贴至下方，AI 将自动提取考核点并生成结构化题目。</p>
          <div class="field">
            <label>材料文本 <span class="required">*</span></label>
            <textarea v-model="genForm.material_text" placeholder="粘贴培训材料..." rows="10" />
          </div>
        </template>

        <template v-else>
          <p class="hint-text">从文件库中选择已上传的 PDF 文件，AI 将自动读取并提取题目。</p>
          <div class="field">
            <label>选择文件 <span class="required">*</span></label>
            <div v-if="loadingFiles" class="hint-text">加载中...</div>
            <div v-else-if="fileList.length === 0" class="hint-text" style="color:var(--color-warning)">
              文件库中暂无 PDF 文件，请先在文件库上传
            </div>
            <div v-else class="file-select-list">
              <label v-for="f in fileList" :key="f.id" class="file-select-row">
                <input type="radio" :value="f.id" v-model="selectedFileId" />
                <span class="file-select-name">{{ f.original_name }}</span>
                <span class="file-select-size">{{ f.size_bytes ? (f.size_bytes / 1024).toFixed(0) + ' KB' : '' }}</span>
              </label>
            </div>
          </div>
        </template>

        <div class="field" style="max-width:200px">
          <label>生成题目数量</label>
          <input v-model.number="genForm.question_count" type="number" min="1" max="30" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showGenModal = false">取消</button>
        <button class="btn-ai" @click="generateQuestions">开始生成</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page-wrap { padding: 28px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; height: 100%; }
.header-top { margin-bottom: 8px; }
.back-btn { padding: 5px 14px; border-radius: 7px; font-size: 13px; background: var(--bg-grouped); color: var(--text-secondary); cursor: pointer; border: 1px solid var(--border); }
.back-btn:hover { background: var(--bg-selected); color: var(--color-primary); border-color: var(--color-primary); }
.header-main { display: flex; align-items: flex-start; justify-content: space-between; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.header-actions { display: flex; gap: 10px; align-items: center; }

.generating-banner { background: rgba(255,149,0,0.08); border: 1px solid rgba(255,149,0,0.25); border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 500; color: var(--color-warning); display: flex; align-items: center; gap: 8px; }
.spin { animation: rotate 1.5s linear infinite; display: flex; }
@keyframes rotate { to { transform: rotate(360deg); } }

.loading-state { text-align: center; color: var(--text-tertiary); padding: 60px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 80px; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.empty-sub { font-size: 13px; color: var(--text-tertiary); }

/* ===== Overview Card ===== */
.overview-card {
  background: white; border-radius: 12px; border: 1px solid var(--border);
  box-shadow: var(--shadow-1); padding: 20px 24px;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;
}
.overview-left { display: flex; align-items: flex-start; gap: 16px; flex: 1; min-width: 0; }
.overview-icon {
  width: 56px; height: 56px; border-radius: 14px;
  background: var(--color-primary); color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; flex-shrink: 0;
}
.overview-info { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.overview-name { font-size: 18px; font-weight: 700; color: var(--text-primary); }
.overview-category {
  display: inline-block; font-size: 11px; font-weight: 600;
  padding: 2px 10px; border-radius: 20px;
  background: rgba(0,102,204,0.08); color: var(--color-primary);
  width: fit-content;
}
.overview-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

.overview-stats { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0 24px; }
.stat-num { font-size: 24px; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 12px; color: var(--text-tertiary); white-space: nowrap; }
.stat-divider { width: 1px; height: 40px; background: var(--separator); }

/* ===== Distribution Grid ===== */
.dist-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 800px) { .dist-grid { grid-template-columns: 1fr; } }

.dist-card {
  background: white; border-radius: 12px; border: 1px solid var(--border);
  box-shadow: var(--shadow-1); padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
}
.dist-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }

/* Segmented bar */
.seg-bar {
  height: 10px; border-radius: 5px; overflow: hidden;
  display: flex; background: var(--bg-grouped);
}
.seg-segment { height: 100%; transition: width 400ms ease; }

.seg-legend { display: flex; flex-direction: column; gap: 8px; }
.legend-row { display: flex; align-items: center; gap: 8px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-key { font-size: 13px; color: var(--text-secondary); flex: 1; }
.legend-count { font-size: 13px; font-weight: 700; color: var(--text-primary); }

/* Knowledge cloud */
.kp-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.kp-tag {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--text-secondary);
  background: var(--bg-grouped); border-radius: 20px;
  padding: 4px 12px; border: 1px solid var(--border);
}
.kp-cnt { font-weight: 700; color: var(--color-primary); }
.kp-empty { font-size: 13px; color: var(--text-tertiary); padding: 20px 0; text-align: center; }

/* ===== Questions Section ===== */
.questions-section { display: flex; flex-direction: column; gap: 12px; }

/* Filter bar */
.filter-bar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: white; border-radius: 10px; border: 1px solid var(--border);
  padding: 12px 16px; box-shadow: var(--shadow-1);
}
.filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-chip {
  height: 28px; padding: 0 12px; border-radius: 14px;
  font-size: 12px; font-weight: 500;
  background: var(--bg-grouped); color: var(--text-secondary);
  border: 1px solid var(--border); cursor: pointer;
  transition: all 120ms;
}
.filter-chip.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.filter-chip:hover:not(.active) { border-color: var(--color-primary); color: var(--color-primary); }
.filter-search {
  margin-left: auto; height: 30px; padding: 0 10px;
  border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-grouped); font-size: 13px;
  color: var(--text-primary); min-width: 160px;
}
.filter-search:focus { border-color: var(--color-primary); outline: none; box-shadow: 0 0 0 3px rgba(0,102,204,0.1); }

/* Question list */
.questions-list { display: flex; flex-direction: column; gap: 8px; }
.q-card {
  background: white; border-radius: 12px; border: 1px solid var(--border);
  padding: 0; box-shadow: var(--shadow-1); overflow: hidden;
}
.q-header {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 18px;
  cursor: pointer; user-select: none;
  transition: background 120ms;
}
.q-header:hover { background: var(--bg-grouped); }

.q-chevron {
  font-size: 18px; color: var(--text-tertiary);
  transition: transform 200ms; display: inline-block; flex-shrink: 0;
  line-height: 1;
}
.q-chevron.open { transform: rotate(90deg); }

.q-num {
  font-size: 11px; font-weight: 700; color: white;
  background: var(--color-primary);
  padding: 2px 7px; border-radius: 5px; flex-shrink: 0;
}
.q-title-preview {
  flex: 1; font-size: 13px; color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* Type pills */
.type-pill { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 5px; flex-shrink: 0; }
.type-primary { background: rgba(0,102,204,0.1); color: var(--color-primary); }
.type-purple { background: rgba(88,86,214,0.1); color: #5856D6; }
.type-success { background: rgba(52,199,89,0.1); color: var(--color-success); }
.type-warning { background: rgba(255,149,0,0.1); color: var(--color-warning); }

/* Difficulty pills */
.diff-pill { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 5px; flex-shrink: 0; }
.diff-pill.easy { background: rgba(52,199,89,0.1); color: var(--color-success); }
.diff-pill.medium { background: rgba(255,149,0,0.1); color: var(--color-warning); }
.diff-pill.hard { background: rgba(255,59,48,0.1); color: var(--color-danger); }

.q-actions { margin-left: 4px; display: flex; gap: 6px; }
.icon-btn { width: 26px; height: 26px; border-radius: 6px; background: var(--bg-grouped); font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); }
.icon-btn:hover { background: var(--bg-selected); color: var(--color-primary); border-color: var(--color-primary); }
.icon-btn.danger:hover { background: rgba(255,59,48,0.08); color: var(--color-danger); border-color: var(--color-danger); }

.q-body {
  border-top: 1px solid var(--separator);
  padding: 16px 20px;
  display: flex; flex-direction: column; gap: 10px;
}
.q-text { font-size: 14px; font-weight: 600; color: var(--text-primary); line-height: 1.5; }

.q-options { display: flex; flex-direction: column; gap: 6px; }
.q-option {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; color: var(--text-secondary);
  padding: 6px 10px; border-radius: 7px;
  border: 1px solid transparent;
}
.q-option.correct {
  background: rgba(52,199,89,0.07);
  color: var(--color-success);
  border-color: rgba(52,199,89,0.2);
  font-weight: 600;
}
.option-label { font-weight: 600; flex-shrink: 0; }

.q-answer { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
.answer-label { font-weight: 600; color: var(--color-success); }

.q-points { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.points-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); }
.point-tag { font-size: 11px; padding: 2px 8px; border-radius: 5px; background: rgba(0,102,204,0.06); color: var(--color-primary); border: 1px solid rgba(0,102,204,0.15); }

.q-kp { display: flex; align-items: center; gap: 8px; }
.kp-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); }
.kp-pill { font-size: 12px; padding: 2px 10px; border-radius: 20px; background: var(--bg-grouped); border: 1px solid var(--border); color: var(--text-secondary); }

.filter-empty { text-align: center; padding: 40px; font-size: 13px; color: var(--text-tertiary); }

/* Modal forms */
.form-grid { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.required { color: var(--color-danger); }
input, select, textarea { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg-grouped); font-size: 13px; color: var(--text-primary); font-family: inherit; }
input, select { height: 36px; }
textarea { resize: vertical; }
input:focus, select:focus, textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,102,204,0.1); outline: none; }
.hint-text { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.6; }
.sp-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.sp-tag { display: flex; align-items: center; gap: 4px; font-size: 12px; padding: 3px 8px; background: rgba(0,102,204,0.07); color: var(--color-primary); border-radius: 6px; border: 1px solid rgba(0,102,204,0.15); }
.sp-remove { background: none; border: none; color: var(--text-tertiary); cursor: pointer; font-size: 15px; line-height: 1; padding: 0 2px; }
.sp-remove:hover { color: var(--color-danger); }
.sp-input-row { display: flex; gap: 8px; align-items: center; }
.sp-add-btn { height: 36px; padding: 0 12px; white-space: nowrap; flex-shrink: 0; }
.sp-hint { font-size: 11px; color: var(--text-tertiary); }

.btn-primary { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--color-primary); color: white; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--bg-grouped); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--bg-selected); }
.btn-ai { height: 34px; padding: 0 16px; border-radius: 8px; background: linear-gradient(135deg,#5856D6,#0066CC); color: white; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-ai:disabled { opacity: 0.6; cursor: not-allowed; }

.gen-mode-tabs { display: flex; background: var(--bg-grouped); border-radius: 8px; padding: 3px; gap: 2px; }
.mode-tab { flex: 1; height: 30px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: var(--text-secondary); transition: all 150ms; }
.mode-tab.active { background: white; color: var(--color-primary); font-weight: 600; box-shadow: var(--shadow-1); }

.file-select-list { display: flex; flex-direction: column; gap: 4px; max-height: 260px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; padding: 6px; }
.file-select-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 7px; cursor: pointer; }
.file-select-row:hover { background: var(--bg-grouped); }
.file-select-row input[type="radio"] { cursor: pointer; accent-color: var(--color-primary); }
.file-select-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-primary); }
.file-select-size { font-size: 11px; color: var(--text-tertiary); }

/* ── A08d Edit Drawer ───────────────────────────────────────────────────── */
.drawer-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.30);
  z-index: 1000;
}
.edit-drawer {
  position: absolute; top: 0; right: 0; bottom: 0; width: 560px;
  background: white; box-shadow: var(--shadow-3);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.drawer-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 16px 22px; border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.drawer-header-left { display: flex; flex-direction: column; gap: 2px; }
.drawer-title { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.drawer-subtitle { font-size: 11px; color: var(--text-secondary); }
.drawer-close {
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--bg-grouped); border: 1px solid var(--border);
  font-size: 14px; cursor: pointer; color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.drawer-close:hover { background: var(--bg-selected); color: var(--color-danger); border-color: var(--color-danger); }

.drawer-body {
  flex: 1; overflow-y: auto; padding: 22px;
  display: flex; flex-direction: column; gap: 18px;
}
.drawer-3col {
  display: grid; grid-template-columns: 1fr 1fr 80px; gap: 10px;
}
.drawer-field { display: flex; flex-direction: column; gap: 6px; }
.drawer-field > label { font-size: 12px; font-weight: 600; color: var(--text-primary); }

/* Segmented difficulty control */
.seg-ctrl { display: flex; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
.seg-btn {
  flex: 1; height: 34px; font-size: 12px; font-weight: 600; cursor: pointer;
  background: var(--bg-grouped); color: var(--text-secondary); border: none;
  transition: all 120ms;
}
.seg-btn.active.seg-easy { background: rgba(52,199,89,0.12); color: var(--color-success); }
.seg-btn.active.seg-medium { background: rgba(0,102,204,0.12); color: var(--color-primary); }
.seg-btn.active.seg-hard { background: rgba(255,59,48,0.12); color: var(--color-danger); }
.seg-btn:not(.active):hover { background: var(--bg-selected); }

/* Options */
.options-list { display: flex; flex-direction: column; gap: 6px; }
.option-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 8px;
  border: 1px solid var(--border);
  background: white; transition: background 120ms, border-color 120ms;
}
.option-correct {
  background: rgba(52,199,89,0.08);
  border-color: var(--color-success);
}
.opt-radio {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--border); background: white;
  cursor: pointer; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: var(--color-success); transition: all 120ms;
}
.opt-radio-correct { border-color: var(--color-success); background: rgba(52,199,89,0.1); }
.opt-letter { font-size: 12px; font-weight: 700; color: var(--text-tertiary); flex-shrink: 0; width: 16px; }
.opt-text { flex: 1; height: 28px; border: none; background: transparent; font-size: 13px; color: var(--text-primary); padding: 0; font-family: inherit; }
.opt-text:focus { outline: none; }
.opt-remove {
  background: none; border: none; color: var(--text-tertiary);
  cursor: pointer; font-size: 13px; padding: 0 2px; flex-shrink: 0;
}
.opt-remove:hover { color: var(--color-danger); }

/* Knowledge point tag input */
.kp-input-wrap {
  border: 1px solid var(--border-strong); border-radius: 8px;
  background: var(--bg-grouped); padding: 6px 8px;
  min-height: 36px;
}
.kp-pills { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.kp-pill-edit {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; padding: 2px 8px 2px 10px; border-radius: 20px;
  background: rgba(0,102,204,0.08); color: var(--color-primary);
  border: 1px solid rgba(0,102,204,0.2);
}
.kp-pill-rm {
  background: none; border: none; color: var(--color-primary);
  cursor: pointer; font-size: 11px; padding: 0; line-height: 1;
}
.kp-pill-rm:hover { color: var(--color-danger); }
.kp-inline-input {
  flex: 1; min-width: 100px; border: none; background: transparent;
  font-size: 13px; color: var(--text-primary); padding: 2px 0;
  font-family: inherit; height: auto;
}
.kp-inline-input:focus { outline: none; }

/* Score points */
.sp-list { display: flex; flex-direction: column; gap: 6px; }
.sp-row { display: flex; gap: 8px; align-items: center; }
.sp-desc { flex: 1; height: 34px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg-grouped); font-size: 13px; color: var(--text-primary); font-family: inherit; }
.sp-desc:focus { border-color: var(--color-primary); outline: none; box-shadow: 0 0 0 3px rgba(0,102,204,0.1); }
.sp-weight { width: 72px; height: 34px; padding: 0 8px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg-grouped); font-size: 13px; color: var(--text-primary); font-family: inherit; flex-shrink: 0; }
.sp-weight:focus { border-color: var(--color-primary); outline: none; box-shadow: 0 0 0 3px rgba(0,102,204,0.1); }

.btn-ghost-sm {
  height: 30px; padding: 0 12px; border-radius: 7px;
  background: var(--bg-grouped); color: var(--text-secondary);
  font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1px solid var(--border); align-self: flex-start;
}
.btn-ghost-sm:hover { background: var(--bg-selected); color: var(--color-primary); border-color: var(--color-primary); }

.drawer-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 22px; border-top: 1px solid var(--border);
  background: #FAFAFA; flex-shrink: 0;
}
.btn-danger {
  height: 34px; padding: 0 16px; border-radius: 8px;
  background: rgba(255,59,48,0.08); color: var(--color-danger);
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: 1px solid rgba(255,59,48,0.2);
}
.btn-danger:hover { background: rgba(255,59,48,0.15); }
</style>
