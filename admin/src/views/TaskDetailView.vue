<!-- ## 任务详情（管理端）：编辑配置、发布指派学员、查看学员完成进度明细 -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api, { tasksApi, usersApi, filesApi, banksApi, personasApi } from '@/api'
import type { Task, User } from '@/api/types'
import Modal from '@/components/Modal.vue'
import { showToast } from '@/composables/toast'

const route = useRoute()
const router = useRouter()
const taskId = route.params.id as string

const task = ref<Task | null>(null)
const progress = ref<any[]>([])
const loading = ref(false)
const publishing = ref(false)

const dimensions = ref<{name: string; avg_score: number; max: number}[]>([])
const dimSessionCount = ref(0)

const showPublishModal = ref(false)
const allUsers = ref<User[]>([])
const selectedUsers = ref<string[]>([])
const loadingUsers = ref(false)

async function load() {
  loading.value = true
  try {
    const [taskRes, progressRes] = await Promise.all([
      tasksApi.get(taskId),
      tasksApi.getProgressDetail(taskId),
    ])
    task.value = taskRes
    progress.value = progressRes.items || []
    if (taskRes.task_type === 'roleplay' || taskRes.type === 'roleplay') {
      try {
        const dimRes = await tasksApi.getDimensionStats(taskId)
        dimensions.value = dimRes.dimensions || []
        dimSessionCount.value = dimRes.session_count || 0
      } catch {}
    }
  } catch { showToast('加载失败', 'error') }
  loading.value = false
}

async function openPublishModal() {
  showPublishModal.value = true
  loadingUsers.value = true
  try {
    const res = await usersApi.list({ page: 1, page_size: 200, role: 'learner' })
    allUsers.value = res.items
    // pre-select already assigned users
    selectedUsers.value = progress.value.map((p: any) => p.user_id)
  } catch { showToast('加载用户失败', 'error') }
  loadingUsers.value = false
}

function toggleUser(id: string) {
  const idx = selectedUsers.value.indexOf(id)
  if (idx >= 0) selectedUsers.value.splice(idx, 1)
  else selectedUsers.value.push(id)
}

async function publish() {
  if (selectedUsers.value.length === 0) { showToast('请选择至少一名用户', 'error'); return }
  publishing.value = true
  try {
    await tasksApi.publish(taskId, { user_ids: selectedUsers.value })
    showToast(`已发布给 ${selectedUsers.value.length} 名用户`, 'success')
    showPublishModal.value = false
    load()
  } catch (e: any) { showToast(e?.message || '发布失败', 'error') }
  publishing.value = false
}

function statusLabel(s: string) { return { draft: '草稿', active: '已发布', archived: '已归档' }[s] || s }
function statusClass(s: string) { return { draft: 'draft', active: 'published', archived: 'archived' }[s] || '' }
function typeLabel(t: string) { return { qa: '知识问答', roleplay: '模拟对练' }[t] || t }
function progressLabel(s: string) { return { not_started: '未开始', assigned: '未开始', in_progress: '进行中', completed: '已完成', expired: '已过期' }[s] || s }
function progressClass(s: string) { return { not_started: 'not-started', assigned: 'not-started', in_progress: 'in-progress', completed: 'completed', expired: 'expired' }[s] || '' }

const completedCount = () => progress.value.filter((p: any) => p.status === 'completed').length
const inProgressCount = () => progress.value.filter((p: any) => p.status === 'in_progress').length

const notStartedCount = () => progress.value.filter((p: any) => p.status === 'not_started' || p.status === 'assigned').length
const completionRate = () => progress.value.length ? Math.round(completedCount() / progress.value.length * 100) : 0
const avgScore = computed(() => {
  const scored = progress.value.filter((p: any) => p.score !== null && p.score !== undefined)
  if (!scored.length) return '—'
  const avg = scored.reduce((s: number, p: any) => s + (p.score || 0), 0) / scored.length
  return avg.toFixed(1)
})

const exportLoading = ref(false)

async function exportResults() {
  exportLoading.value = true
  try {
    const token = localStorage.getItem('access_token') || ''
    const url = `${api.defaults.baseURL}/tasks/${taskId}/export?token=${encodeURIComponent(token)}`
    const a = document.createElement('a')
    a.href = url
    a.download = `task_${taskId}.xlsx`
    a.click()
  } catch { showToast('导出失败', 'error') }
  exportLoading.value = false
}

const sortByScore = ref(false)
const sortedProgress = computed(() => {
  if (!sortByScore.value) return progress.value
  return [...progress.value].sort((a, b) => {
    const sa = a.score ?? -1
    const sb = b.score ?? -1
    return sb - sa
  })
})

// ── Edit Task Modal ───────────────────────────────────────────
const showEditModal = ref(false)
const editSaving = ref(false)
const editForm = ref({
  title: '', description: '', start_at: '', end_at: '',
  pass_score: 60, excellence_score: 90,
  question_count_practice: 5, question_count_assessment: 10,
  max_rounds: 10, objective: '', time_limit: 30,
})

function openEditModal() {
  if (!task.value) return
  const cfg = task.value.config || {}
  editForm.value = {
    title: task.value.title,
    description: task.value.description || '',
    start_at: task.value.start_at ? task.value.start_at.slice(0, 16) : '',
    end_at: task.value.end_at ? task.value.end_at.slice(0, 16) : '',
    pass_score: cfg.pass_score ?? 60,
    excellence_score: cfg.excellence_score ?? 90,
    question_count_practice: cfg.question_count_practice ?? 5,
    question_count_assessment: cfg.question_count_assessment ?? 10,
    max_rounds: cfg.max_rounds ?? 10,
    objective: cfg.objective ?? '',
    time_limit: cfg.time_limit ?? 30,
  }
  showEditModal.value = true
}

async function saveEdit() {
  if (!editForm.value.title.trim()) { showToast('请填写任务名称', 'error'); return }
  editSaving.value = true
  try {
    const cfg: any = {
      pass_score: editForm.value.pass_score,
      excellence_score: editForm.value.excellence_score,
      time_limit: editForm.value.time_limit,
    }
    if (task.value?.type === 'qa') {
      cfg.question_count_practice = editForm.value.question_count_practice
      cfg.question_count_assessment = editForm.value.question_count_assessment
    } else {
      cfg.max_rounds = editForm.value.max_rounds
      cfg.objective = editForm.value.objective
    }
    const payload: any = {
      title: editForm.value.title.trim(),
      description: editForm.value.description,
      config: { ...(task.value?.config || {}), ...cfg },
    }
    if (editForm.value.start_at) payload.start_at = editForm.value.start_at
    if (editForm.value.end_at) payload.end_at = editForm.value.end_at
    await tasksApi.update(taskId, payload)
    showToast('更新成功', 'success')
    showEditModal.value = false
    load()
  } catch (e: any) { showToast(e?.message || '更新失败', 'error') }
  editSaving.value = false
}

async function archiveTask() {
  if (!confirm('确认归档此任务？归档后学员将无法继续练习。')) return
  try {
    await tasksApi.update(taskId, { status: 'archived' } as any)
    showToast('已归档', 'success')
    load()
  } catch { showToast('归档失败', 'error') }
}

// ── Associations Editor ───────────────────────────────────────
const showAssocModal = ref(false)
const assocSaving = ref(false)
const assocFiles = ref<any[]>([])
const assocBanks = ref<any[]>([])
const assocPersonas = ref<any[]>([])
const selMaterials = ref<string[]>([])
const selBanks = ref<string[]>([])
const selPersonas = ref<string[]>([])

async function openAssocModal() {
  showAssocModal.value = true
  selMaterials.value = [...(task.value?.material_ids || [])]
  selBanks.value = [...(task.value?.bank_ids || [])]
  selPersonas.value = [...(task.value?.persona_ids || [])]
  try {
    const [fRes, bRes, pRes] = await Promise.all([
      filesApi.list({ page: 1, page_size: 100 }),
      banksApi.list({ page: 1, page_size: 100 }),
      personasApi.list({ page: 1, page_size: 100 }),
    ])
    assocFiles.value = fRes.items || []
    assocBanks.value = bRes.items || []
    assocPersonas.value = pRes.items || []
  } catch { showToast('加载资源失败', 'error') }
}



async function saveAssoc() {
  assocSaving.value = true
  try {
    await tasksApi.updateAssociations(taskId, {
      material_ids: selMaterials.value,
      bank_ids: task.value?.type === 'qa' ? selBanks.value : undefined,
      persona_ids: task.value?.type === 'roleplay' ? selPersonas.value : undefined,
    })
    showToast('关联资源更新成功', 'success')
    showAssocModal.value = false
    load()
  } catch (e: any) { showToast(e?.message || '更新失败', 'error') }
  assocSaving.value = false
}

const radarSvgData = computed(() => {
  const dims = dimensions.value
  if (!dims.length) return null
  const cx = 120, cy = 120, R = 85
  const n = dims.length
  // Points for user data polygon
  const points = dims.map((d, i) => {
    const ang = -Math.PI / 2 + (Math.PI * 2 * i) / n
    const r = (d.avg_score / d.max) * R
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r }
  })
  // Grid rings at 25/50/75/100%
  const rings = [0.25, 0.5, 0.75, 1].map(p =>
    dims.map((_, i) => {
      const ang = -Math.PI / 2 + (Math.PI * 2 * i) / n
      return `${cx + Math.cos(ang) * R * p},${cy + Math.sin(ang) * R * p}`
    }).join(' ')
  )
  // Axis lines
  const axes = dims.map((_, i) => {
    const ang = -Math.PI / 2 + (Math.PI * 2 * i) / n
    return { x2: cx + Math.cos(ang) * R, y2: cy + Math.sin(ang) * R }
  })
  // Labels (offset outward)
  const labels = dims.map((d, i) => {
    const ang = -Math.PI / 2 + (Math.PI * 2 * i) / n
    return { x: cx + Math.cos(ang) * (R + 22), y: cy + Math.sin(ang) * (R + 22), name: d.name }
  })
  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ')
  return { rings, axes, labels, polyPoints, dots: points, cx, cy }
})

function dimColor(score: number, max: number) {
  const pct = score / max
  if (pct >= 0.85) return 'var(--color-success, #34C759)'
  if (pct >= 0.70) return 'var(--color-primary, #0066CC)'
  return 'var(--color-warning, #FF9500)'
}

onMounted(() => {
  if (route.query.edit === 'true') {
    load().then(() => openEditModal())
  } else {
    load()
  }
})
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <button class="back-btn" @click="router.push('/tasks')">‹ 返回</button>
      <div class="header-main">
        <div v-if="task">
          <h2>{{ task.title }}</h2>
          <div class="header-meta">
            <span class="type-badge" :class="task.type">{{ typeLabel(task.type) }}</span>
            <span class="status-badge" :class="statusClass(task.status)">{{ statusLabel(task.status) }}</span>
            <span class="text-secondary">创建于 {{ task.created_at?.slice(0, 10) }}</span>
          </div>
        </div>
        <div class="header-btn-group">
          <button class="btn-ghost" @click="openEditModal">编辑信息</button>
          <button class="btn-ghost" @click="openAssocModal">编辑关联资源</button>
          <button class="btn-ghost" :disabled="exportLoading" @click="exportResults">
            {{ exportLoading ? '导出中...' : '导出成绩' }}
          </button>
          <button
            class="btn-primary"
            v-if="task?.status !== 'archived'"
            @click="openPublishModal"
          >发布/补充用户</button>
          <button class="btn-danger" v-if="task?.status === 'active'" @click="archiveTask">归档</button>
        </div>
      </div>
    </div>

    <div v-if="task?.description" class="desc-card">{{ task.description }}</div>

    <!-- 整体进度条 -->
    <div class="progress-card" v-if="progress.length > 0">
      <div class="progress-head">
        <div>
          <span class="progress-label">整体完成进度</span>
          <span class="progress-rate">{{ completionRate() }}%</span>
        </div>
        <span class="progress-pct">{{ completedCount() }} / {{ progress.length }} 人完成</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" :style="{ width: completionRate() + '%' }" />
      </div>
    </div>

    <!-- Stat cards -->
    <div class="stat-cards">
      <div class="stat-card stat-card-green">
        <div class="stat-card-val">{{ completedCount() }}</div>
        <div class="stat-card-label">已完成</div>
        <div class="stat-card-bar-wrap">
          <div class="stat-card-bar" :style="{ width: completionRate() + '%' }" />
        </div>
        <div class="stat-card-sub">完成率 {{ completionRate() }}%</div>
      </div>
      <div class="stat-card stat-card-orange">
        <div class="stat-card-val">{{ inProgressCount() }}</div>
        <div class="stat-card-label">进行中</div>
      </div>
      <div class="stat-card stat-card-gray">
        <div class="stat-card-val">{{ notStartedCount() }}</div>
        <div class="stat-card-label">未开始</div>
      </div>
      <div class="stat-card stat-card-blue">
        <div class="stat-card-val">{{ avgScore }}</div>
        <div class="stat-card-label">平均得分</div>
      </div>
    </div>

    <!-- 能力雷达 -->
    <div v-if="dimensions.length > 0" class="radar-card">
      <div class="radar-card-header">
        <div class="radar-title">能力雷达</div>
        <span class="radar-sub">基于 {{ dimSessionCount }} 份已完成对练 · 维度平均分</span>
      </div>
      <div class="radar-body">
        <svg v-if="radarSvgData" width="240" height="240" viewBox="0 0 240 240" class="radar-svg">
          <!-- Grid rings -->
          <polygon
            v-for="(ring, i) in radarSvgData.rings" :key="'ring'+i"
            :points="ring"
            fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="1"
          />
          <!-- Axis lines -->
          <line
            v-for="(ax, i) in radarSvgData.axes" :key="'ax'+i"
            :x1="radarSvgData.cx" :y1="radarSvgData.cy"
            :x2="ax.x2" :y2="ax.y2"
            stroke="rgba(0,0,0,0.07)" stroke-width="1"
          />
          <!-- Data polygon -->
          <polygon
            :points="radarSvgData.polyPoints"
            fill="rgba(0,102,204,0.18)" stroke="var(--color-primary, #0066CC)" stroke-width="2"
          />
          <!-- Dots -->
          <circle
            v-for="(dot, i) in radarSvgData.dots" :key="'dot'+i"
            :cx="dot.x" :cy="dot.y" r="3.5"
            fill="var(--color-primary, #0066CC)"
          />
          <!-- Labels -->
          <text
            v-for="(lbl, i) in radarSvgData.labels" :key="'lbl'+i"
            :x="lbl.x" :y="lbl.y"
            text-anchor="middle" dominant-baseline="middle"
            font-size="11" fill="var(--text-secondary)"
          >{{ lbl.name }}</text>
        </svg>

        <!-- Legend with progress bars -->
        <div class="radar-legend">
          <div v-for="d in dimensions" :key="d.name" class="radar-legend-row">
            <span class="radar-legend-name">{{ d.name }}</span>
            <div class="radar-legend-bar-wrap">
              <div
                class="radar-legend-bar"
                :style="{
                  width: (d.avg_score / d.max * 100) + '%',
                  background: dimColor(d.avg_score, d.max)
                }"
              />
            </div>
            <strong class="radar-legend-score" :style="{ color: dimColor(d.avg_score, d.max) }">
              {{ d.avg_score }}
            </strong>
          </div>
          <div class="radar-tip" v-if="dimensions.some(d => d.avg_score / d.max < 0.7)">
            <strong style="color:var(--color-warning)">建议：</strong>
            {{ dimensions.filter(d => d.avg_score / d.max < 0.7).map(d => d.name).join('、') }}维度相对薄弱，可推送相关专项练习任务。
          </div>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="section-head">
        <span class="section-title">用户进度</span>
        <button class="sort-btn" :class="{ active: sortByScore }" @click="sortByScore = !sortByScore">
          {{ sortByScore ? '▼ 按得分' : '按得分排序' }}
        </button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>用户</th>
            <th>分组</th>
            <th>状态</th>
            <th class="sortable" @click="sortByScore = !sortByScore">
              得分 <span v-if="sortByScore">▼</span>
            </th>
            <th>用时</th>
            <th>提交时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="empty-row">加载中...</td>
          </tr>
          <tr v-else-if="progress.length === 0">
            <td colspan="6" class="empty-row">尚未分配给任何用户</td>
          </tr>
          <tr v-for="p in sortedProgress" :key="p.user_id || p.id">
            <td>
              <div class="user-cell">
                <div class="avatar">{{ (p.user?.display_name || p.user?.username || '?').charAt(0) }}</div>
                <div class="user-cell-info">
                  <div class="user-cell-name">{{ p.user?.display_name || p.user?.username || `用户 #${p.user_id}` }}</div>
                  <div class="user-cell-sub">{{ p.user?.username || '' }}</div>
                </div>
              </div>
            </td>
            <td class="text-secondary">{{ (p as any).group_name || (p.user as any)?.group_name || '—' }}</td>
            <td>
              <span class="progress-badge" :class="progressClass(p.status)">{{ progressLabel(p.status) }}</span>
            </td>
            <td class="score-cell">
              <span v-if="p.score !== null && p.score !== undefined" class="score">
                {{ p.score }}<span v-if="p.max_score" class="score-max">/{{ p.max_score }}</span>
              </span>
              <span v-else class="text-secondary">—</span>
            </td>
            <td class="text-secondary">
              <span v-if="(p as any).time_spent">{{ Math.round((p as any).time_spent / 60) }}分钟</span>
              <span v-else>—</span>
            </td>
            <td class="text-secondary">{{ p.completed_at?.slice(0, 16).replace('T',' ') || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Publish modal -->
    <Modal v-if="showPublishModal" title="发布任务给用户" :width="520" @close="showPublishModal = false">
      <div class="publish-info">选择要分配此任务的学员（已选 {{ selectedUsers.length }} 人）</div>
      <div v-if="loadingUsers" class="loading-state">加载用户中...</div>
      <div v-else class="user-list">
        <div
          v-for="u in allUsers"
          :key="u.id"
          class="user-row"
          :class="{ selected: selectedUsers.includes(u.id) }"
          @click="toggleUser(u.id)"
        >
          <div class="u-avatar">{{ (u.display_name || u.username).charAt(0) }}</div>
          <div class="u-info">
            <div class="u-name">{{ u.display_name || u.username }}</div>
            <div class="u-sub">{{ u.username }}</div>
          </div>
          <span class="check-mark" v-if="selectedUsers.includes(u.id)">+</span>
        </div>
        <div v-if="allUsers.length === 0" class="empty-hint">暂无学员用户</div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showPublishModal = false">取消</button>
        <button class="btn-primary" :disabled="publishing" @click="publish">
          {{ publishing ? '发布中...' : `发布给 ${selectedUsers.length} 名用户` }}
        </button>
      </template>
    </Modal>

    <!-- Edit task modal -->
    <Modal v-if="showEditModal" title="编辑任务信息" :width="560" @close="showEditModal = false">
      <div class="form-grid">
        <div class="field">
          <label>任务名称 <span class="required">*</span></label>
          <input v-model="editForm.title" placeholder="任务名称" />
        </div>
        <div class="field">
          <label>任务描述</label>
          <textarea v-model="editForm.description" placeholder="任务说明..." rows="3" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>开始时间</label>
            <input v-model="editForm.start_at" type="datetime-local" />
          </div>
          <div class="field">
            <label>结束时间</label>
            <input v-model="editForm.end_at" type="datetime-local" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>合格分数</label>
            <input v-model.number="editForm.pass_score" type="number" min="0" max="200" />
          </div>
          <div class="field">
            <label>优秀分数</label>
            <input v-model.number="editForm.excellence_score" type="number" min="0" max="200" />
          </div>
        </div>
        <template v-if="task?.type === 'qa'">
          <div class="field-row">
            <div class="field">
              <label>练习题数</label>
              <input v-model.number="editForm.question_count_practice" type="number" min="1" max="50" />
            </div>
            <div class="field">
              <label>考核题数</label>
              <input v-model.number="editForm.question_count_assessment" type="number" min="1" max="50" />
            </div>
          </div>
        </template>
        <template v-if="task?.type === 'roleplay'">
          <div class="field">
            <label>任务目标</label>
            <textarea v-model="editForm.objective" placeholder="本次对练的核心目标..." rows="2" />
          </div>
          <div class="field-row">
            <div class="field">
              <label>最大轮次</label>
              <input v-model.number="editForm.max_rounds" type="number" min="1" max="50" />
            </div>
            <div class="field">
              <label>时间限制(分钟)</label>
              <input v-model.number="editForm.time_limit" type="number" min="5" max="120" />
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showEditModal = false">取消</button>
        <button class="btn-primary" :disabled="editSaving" @click="saveEdit">
          {{ editSaving ? '保存中...' : '确认修改' }}
        </button>
      </template>
    </Modal>

    <!-- Associations editor modal -->
    <Modal v-if="showAssocModal" title="编辑关联资源" :width="600" @close="showAssocModal = false">
      <div class="assoc-sections">
        <!-- Materials -->
        <div class="assoc-section">
          <div class="assoc-section-title">学习素材</div>
          <div class="assoc-list">
            <label v-for="f in assocFiles" :key="f.id" class="assoc-row">
              <input type="checkbox" :value="f.id" v-model="selMaterials" />
              <span class="assoc-name">{{ f.original_name }}</span>
              <span class="assoc-sub">{{ f.mime_type?.includes('pdf') ? 'PDF' : f.mime_type || '' }}</span>
            </label>
            <div v-if="assocFiles.length === 0" class="assoc-empty">暂无文件，请先在文件库上传</div>
          </div>
        </div>

        <!-- Banks (for QA tasks) -->
        <div class="assoc-section" v-if="task?.type === 'qa'">
          <div class="assoc-section-title">题库</div>
          <div class="assoc-list">
            <label v-for="b in assocBanks" :key="b.id" class="assoc-row">
              <input type="checkbox" :value="b.id" v-model="selBanks" />
              <span class="assoc-name">{{ b.name }}</span>
              <span class="assoc-sub">{{ b.question_count }} 题</span>
            </label>
            <div v-if="assocBanks.length === 0" class="assoc-empty">暂无题库</div>
          </div>
        </div>

        <!-- Personas (for roleplay tasks) -->
        <div class="assoc-section" v-if="task?.type === 'roleplay'">
          <div class="assoc-section-title">虚拟角色</div>
          <div class="assoc-list">
            <label v-for="p in assocPersonas" :key="p.id" class="assoc-row">
              <input type="checkbox" :value="p.id" v-model="selPersonas" />
              <span class="assoc-name">{{ p.name }}</span>
              <span class="assoc-sub">{{ p.industry || '' }}{{ p.position ? ' · ' + p.position : '' }}</span>
            </label>
            <div v-if="assocPersonas.length === 0" class="assoc-empty">暂无角色</div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showAssocModal = false">取消</button>
        <button class="btn-primary" :disabled="assocSaving" @click="saveAssoc">
          {{ assocSaving ? '保存中...' : '确认保存' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page-wrap { padding: 28px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; height: 100%; }
.back-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 7px; font-size: 13px; background: var(--bg-grouped); color: var(--text-secondary); cursor: pointer; border: 1px solid var(--border); margin-bottom: 4px; align-self: flex-start; width: auto; }
.page-header { display: flex; flex-direction: column; gap: 6px; }
.header-main { display: flex; align-items: flex-start; justify-content: space-between; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
.header-meta { display: flex; align-items: center; gap: 8px; }
.text-secondary { color: var(--text-secondary); font-size: 12px; }

.type-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.type-badge.qa { background: rgba(0,102,204,0.08); color: var(--color-primary); }
.type-badge.roleplay { background: rgba(88,86,214,0.08); color: #5856D6; }
.status-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.status-badge.draft { background: rgba(142,142,147,0.12); color: var(--text-secondary); }
.status-badge.published { background: rgba(52,199,89,0.12); color: var(--color-success); }
.status-badge.archived { background: rgba(255,149,0,0.12); color: var(--color-warning); }

.desc-card { background: var(--bg-grouped); border-radius: 10px; padding: 14px 16px; font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

.stats-row { display: flex; gap: 16px; }
.mini-stat { background: white; border-radius: 10px; border: 1px solid var(--border); padding: 14px 20px; display: flex; flex-direction: column; gap: 4px; }
.mini-val { font-size: 24px; font-weight: 700; color: var(--text-primary); }
.mini-val.green { color: var(--color-success); }
.mini-val.blue { color: var(--color-primary); }
.mini-val.gray { color: var(--text-tertiary); }
.mini-label { font-size: 12px; color: var(--text-secondary); }

.table-card { background: white; border-radius: 12px; box-shadow: var(--shadow-1); border: 1px solid var(--border); overflow: hidden; }
.section-head { padding: 14px 20px; border-bottom: 1px solid var(--separator); }
.section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--separator); }
.data-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--separator); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--bg-grouped); }
.empty-row { text-align: center; color: var(--text-tertiary); padding: 40px !important; }
.user-cell { display: flex; align-items: center; gap: 8px; }
.user-cell-info { display: flex; flex-direction: column; gap: 1px; }
.user-cell-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.user-cell-sub { font-size: 11px; color: var(--text-tertiary); }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#0066CC,#5856D6); color: white; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.score-cell { font-weight: 600; }
.score { color: var(--color-primary); }

/* Stat cards (A14 design) */
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.stat-card { background: white; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-1); padding: 18px 20px; display: flex; flex-direction: column; gap: 4px; position: relative; overflow: hidden; }
.stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
.stat-card-green::before { background: var(--color-success); }
.stat-card-orange::before { background: var(--color-warning); }
.stat-card-gray::before { background: var(--text-tertiary); }
.stat-card-blue::before { background: var(--color-primary); }
.stat-card-val { font-size: 28px; font-weight: 700; color: var(--text-primary); line-height: 1.2; margin-top: 4px; }
.stat-card-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
.stat-card-bar-wrap { height: 4px; background: var(--bg-grouped); border-radius: 2px; overflow: hidden; margin-top: 6px; }
.stat-card-bar { height: 100%; background: var(--color-success); border-radius: 2px; transition: width 500ms ease; }
.stat-card-sub { font-size: 11px; color: var(--text-tertiary); }

.mini-val.red { color: var(--color-danger); }
.progress-card { background: white; border-radius: 12px; border: 1px solid var(--border); padding: 16px 20px; }
.progress-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.progress-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.progress-rate { font-size: 28px; font-weight: 700; color: var(--color-primary); display: block; line-height: 1.2; }
.progress-pct { font-size: 13px; color: var(--text-secondary); }
.progress-bar-wrap { height: 8px; background: var(--bg-grouped); border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-success)); border-radius: 4px; transition: width 600ms ease; }
.section-head { display: flex; align-items: center; justify-content: space-between; }
.sort-btn { font-size: 12px; color: var(--text-secondary); padding: 4px 10px; border-radius: 6px; background: var(--bg-grouped); border: 1px solid var(--border); cursor: pointer; }
.sort-btn.active { color: var(--color-primary); border-color: var(--color-primary); background: rgba(0,102,204,0.05); }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--color-primary); }
.score-max { font-size: 11px; color: var(--text-tertiary); font-weight: 400; }
.progress-badge { padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.progress-badge.not-started { background: rgba(142,142,147,0.12); color: var(--text-secondary); }
.progress-badge.in-progress { background: rgba(255,149,0,0.12); color: var(--color-warning); }
.progress-badge.completed { background: rgba(52,199,89,0.12); color: var(--color-success); }
.progress-badge.expired { background: rgba(255,59,48,0.1); color: var(--color-danger); }

.publish-info { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
.loading-state { text-align: center; color: var(--text-tertiary); padding: 30px; }
.user-list { max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.user-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 120ms; border: 2px solid transparent; }
.user-row:hover { background: var(--bg-grouped); }
.user-row.selected { border-color: var(--color-primary); background: rgba(0,102,204,0.04); }
.u-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#FF9500,#FF2D55); color: white; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.u-info { flex: 1; }
.u-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.u-sub { font-size: 11px; color: var(--text-tertiary); }
.check-mark { color: var(--color-primary); font-weight: 700; }
.empty-hint { font-size: 13px; color: var(--text-tertiary); padding: 20px; text-align: center; }

.btn-primary { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--color-primary); color: white; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--bg-grouped); color: var(--text-primary); font-size: 13px; cursor: pointer; border: 1px solid var(--border); }
.btn-danger { height: 34px; padding: 0 16px; border-radius: 8px; background: rgba(255,59,48,0.08); color: var(--color-danger); font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid rgba(255,59,48,0.2); }
.btn-danger:hover { background: rgba(255,59,48,0.15); }
.header-btn-group { display: flex; gap: 8px; align-items: center; }
.form-grid { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.required { color: var(--color-danger); }
input[type=datetime-local], input[type=number], textarea { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg-grouped); font-size: 13px; color: var(--text-primary); font-family: inherit; }
input[type=datetime-local], input[type=number] { height: 36px; }
textarea { resize: vertical; }
input:focus, textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,102,204,0.1); outline: none; }

.assoc-sections { display: flex; flex-direction: column; gap: 16px; }
.assoc-section {}
.assoc-section-title { font-size: 12px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.assoc-list { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; max-height: 200px; overflow-y: auto; }
.assoc-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer; border-bottom: 1px solid var(--separator); font-weight: 400; font-size: 13px; }
.assoc-row:last-child { border-bottom: none; }
.assoc-row:hover { background: var(--bg-grouped); }
.assoc-row input[type=checkbox] { accent-color: var(--color-primary); cursor: pointer; }
.assoc-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-primary); }
.assoc-sub { font-size: 11px; color: var(--text-tertiary); }
.assoc-empty { font-size: 13px; color: var(--text-tertiary); padding: 16px; text-align: center; }

.radar-card {
  background: white; border-radius: 10px; padding: 18px 20px;
  box-shadow: var(--shadow-1); margin-bottom: 16px;
}
.radar-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.radar-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.radar-sub { font-size: 11px; color: var(--text-secondary); }
.radar-body { display: flex; align-items: center; gap: 20px; }
.radar-svg { flex-shrink: 0; }
.radar-legend { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.radar-legend-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.radar-legend-name { width: 72px; color: var(--text-secondary); flex-shrink: 0; }
.radar-legend-bar-wrap { flex: 1; height: 5px; background: #F2F2F7; border-radius: 3px; overflow: hidden; }
.radar-legend-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
.radar-legend-score { width: 28px; text-align: right; font-size: 12px; font-variant-numeric: tabular-nums; }
.radar-tip {
  margin-top: 6px; padding: 8px 10px; background: rgba(255,149,0,0.06);
  border: 1px solid rgba(255,149,0,0.20); border-radius: 7px;
  font-size: 11px; color: var(--text-primary); line-height: 1.5;
}
</style>
