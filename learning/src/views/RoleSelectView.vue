<!-- ## 选择对话对象：三栏布局（任务信息 + 角色Grid + 详情面板） -->
<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasksApi, personasApi, filesApi } from '@/api'
import { showToast } from '@/composables/toast'
import type { Task, Persona, FileItem } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const taskId = route.params.id as string
const windowWidth = ref(window.innerWidth)

const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const loading = ref(true)
const task = ref<Task | null>(null)
const personas = ref<Persona[]>([])
const materials = ref<FileItem[]>([])
const selectedPersonaId = ref<string | null>(null)
const hasPractice = ref(false)
const examSubmissionId = ref<string>('')

const selectedIndustry = ref<string>('全部')

const PERSONA_COLORS = [
  'linear-gradient(135deg,#AF52DE,#5856D6)',
  'linear-gradient(135deg,#007AFF,#34AADC)',
  'linear-gradient(135deg,#FF9500,#FF3B30)',
  'linear-gradient(135deg,#34C759,#007AFF)',
  'linear-gradient(135deg,#FF2D55,#AF52DE)',
  'linear-gradient(135deg,#5AC8FA,#34C759)',
]
function personaColor(i: number) { return PERSONA_COLORS[i % PERSONA_COLORS.length] }

const industries = computed<string[]>(() => {
  const seen = new Set<string>()
  const result: string[] = ['全部']
  for (const p of personas.value) {
    if (p.industry && !seen.has(p.industry)) { seen.add(p.industry); result.push(p.industry) }
  }
  return result
})

const filteredPersonas = computed<Persona[]>(() =>
  selectedIndustry.value === '全部' ? personas.value : personas.value.filter(p => p.industry === selectedIndustry.value)
)

const selectedPersona = computed<Persona | null>(() =>
  personas.value.find(p => p.id === selectedPersonaId.value) ?? (filteredPersonas.value[0] ?? null)
)

const personaIndex = computed(() =>
  personas.value.findIndex(p => p.id === selectedPersona.value?.id)
)

// 从 task config 提取对话目标列表
const dialogueGoals = computed<string[]>(() => {
  const cfg = (task.value as any)?.config
  if (cfg?.goals && Array.isArray(cfg.goals)) return cfg.goals
  if (cfg?.objective) return [cfg.objective]
  if (task.value?.description) return [task.value.description]
  return []
})

// 从 task config 提取评分维度
const scoringDimensions = computed<string[]>(() => {
  const cfg = (task.value as any)?.config
  if (cfg?.dimensions && Array.isArray(cfg.dimensions)) return cfg.dimensions
  return ['开场白', '需求挖掘', '异议处理', '产品介绍', '促成成交', '整体流程']
})

function getPersonaBackground(p: Persona) {
  const card = p.persona_card
  return card?.background || card?.role_description || ''
}
function getPersonaScene(p: Persona) {
  const card = p.persona_card
  return card?.scene || card?.focus || ''
}
function getPersonaTip(p: Persona) {
  const card = p.persona_card
  return card?.tip || card?.emotional_response_mode || card?.motivation || ''
}

onMounted(async () => {
  try {
    const taskRes = await tasksApi.get(taskId)
    task.value = taskRes

    const personaIds: string[] = taskRes.persona_ids || []
    const materialIds: string[] = taskRes.material_ids || []

    const [personaRes, submissionsRes] = await Promise.all([
      personaIds.length > 0 ? personasApi.list() : Promise.resolve({ items: [] }),
      tasksApi.mySubmissions(taskId).catch(() => []),
    ])

    const all = Array.isArray(personaRes) ? personaRes : (personaRes.items || [])
    personas.value = all.filter((p: Persona) => p.is_active !== false && personaIds.includes(p.id))
    if (personas.value.length > 0) selectedPersonaId.value = personas.value[0].id

    const subs = Array.isArray(submissionsRes) ? submissionsRes : []
    hasPractice.value = subs.some((s: any) => s.mode === 'practice' && s.status === 'completed')
    const examSub = subs.find((s: any) => s.mode === 'exam' && s.status === 'completed')
    if (examSub) examSubmissionId.value = examSub.id || examSub.submission_id || ''

    if (materialIds.length > 0) {
      const results = await Promise.all(materialIds.map((id: string) => filesApi.get(id).catch(() => null)))
      materials.value = results.filter(Boolean) as FileItem[]
    }
  } catch {}
  loading.value = false
})

function selectPersona(p: Persona) { selectedPersonaId.value = p.id }

function startPractice() {
  if (!selectedPersona.value) { showToast('请选择对话对象', 'error'); return }
  router.push(`/tasks/${taskId}/roleplay?persona_id=${selectedPersona.value.id}&mode=practice`)
}

function startExam() {
  if (!selectedPersona.value) { showToast('请选择对话对象', 'error'); return }
  if (examSubmissionId.value) { showToast('您已完成本任务考核', 'info'); return }
  if (!hasPractice.value) { showToast('请先完成一次练习后再进入考核', 'error'); return }
  router.push(`/tasks/${taskId}/roleplay?persona_id=${selectedPersona.value.id}&mode=exam`)
}

function viewExamResult() {
  router.push(`/roleplay/${examSubmissionId.value}/result`)
}

function openPdf(fileId: string) {
  router.push(`/tasks/${taskId}/pdf?file_id=${fileId}`)
}
</script>

<template>
  <!-- ========== PC Layout ========== -->
  <div v-if="isPC" class="pc-wrapper">
    <div v-if="loading" class="empty-state"><div class="spinner" /></div>
    <template v-else>
      <div class="pc-three-col">

        <!-- ── 左栏：任务信息 ── -->
        <div class="col-left">
          <!-- 任务卡 -->
          <div class="task-info-card card">
            <div class="ti-badge">
              <AppIcon name="task-roleplay" :size="13" style="margin-right:4px" />
              模拟对练
            </div>
            <div class="ti-title">{{ task?.title }}</div>
            <div class="ti-desc" v-if="task?.description">{{ task?.description }}</div>
          </div>

          <!-- 对话目标 -->
          <div class="side-section" v-if="dialogueGoals.length">
            <div class="side-section-title">对话目标</div>
            <ul class="goal-list">
              <li v-for="(g, i) in dialogueGoals" :key="i" class="goal-item">
                <span class="goal-dot" />{{ g }}
              </li>
            </ul>
          </div>

          <!-- 评分维度 -->
          <div class="side-section">
            <div class="side-section-title">评分维度</div>
            <div class="dim-tags">
              <span v-for="d in scoringDimensions" :key="d" class="dim-tag">{{ d }}</span>
            </div>
          </div>

          <!-- 学习材料 -->
          <div class="side-section" v-if="materials.length">
            <div class="side-section-title">学习材料</div>
            <div class="mat-list">
              <div v-for="m in materials" :key="m.id" class="mat-row" @click="openPdf(m.id)">
                <AppIcon name="file" :size="15" class="mat-row-icon" />
                <span class="mat-row-name">{{ m.original_name }}</span>
                <span class="mat-row-link">阅读 ›</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 中栏：角色选择 ── -->
        <div class="col-center">
          <div class="center-header">
            <div class="pc-section-title">选择对话对象</div>
            <!-- 行业筛选 -->
            <div v-if="industries.length > 2" class="filter-chips">
              <button
                v-for="ind in industries" :key="ind"
                class="filter-chip" :class="{ active: selectedIndustry === ind }"
                @click="selectedIndustry = ind"
              >{{ ind }}</button>
            </div>
          </div>

          <div v-if="filteredPersonas.length === 0" class="empty-state" style="padding:40px 0">
            <div class="msg">暂无可用角色</div>
          </div>
          <div v-else class="persona-grid">
            <div
              v-for="(p, i) in filteredPersonas" :key="p.id"
              class="persona-card" :class="{ selected: selectedPersona?.id === p.id }"
              @click="selectPersona(p)"
            >
              <div v-if="selectedPersona?.id === p.id" class="card-check">
                <AppIcon name="check" :size="11" />
              </div>
              <div class="persona-avatar-lg" :style="(p as any).avatar_url ? {} : { background: personaColor(i) }">
                <img v-if="(p as any).avatar_url" :src="(p as any).avatar_url" class="av-photo" alt="" />
                <template v-else>{{ p.name.charAt(0) }}</template>
              </div>
              <div class="persona-card-name">{{ p.name }}</div>
              <div class="persona-card-meta">
                <span v-if="p.age">{{ p.age }}岁</span>
                <span v-if="p.age && (p.industry || p.position)"> · </span>
                {{ p.industry || p.position || '' }}
              </div>
              <div class="persona-card-tags">
                <span v-if="p.industry" class="ptag">{{ p.industry }}</span>
                <span v-if="p.position" class="ptag ptag-blue">{{ p.position }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 右栏：角色详情 + 开始按钮 ── -->
        <div class="col-right">
          <div v-if="!selectedPersona" class="detail-empty">
            <AppIcon name="user" :size="40" style="opacity:0.25" />
            <div style="margin-top:8px;font-size:13px;color:var(--text-3)">请选择角色</div>
          </div>
          <template v-else>
            <!-- 角色头部 -->
            <div class="detail-hero">
              <div class="detail-avatar" :style="(selectedPersona as any).avatar_url ? {} : { background: personaColor(personaIndex) }">
                <img v-if="(selectedPersona as any).avatar_url" :src="(selectedPersona as any).avatar_url" class="av-photo" alt="" />
                <template v-else>{{ selectedPersona.name.charAt(0) }}</template>
              </div>
              <div class="detail-name">{{ selectedPersona.name }}</div>
              <div class="detail-meta">
                <span v-if="selectedPersona.age">{{ selectedPersona.age }}岁</span>
                <span v-if="selectedPersona.age && selectedPersona.industry"> · </span>
                <span>{{ selectedPersona.industry || '' }}</span>
                <span v-if="selectedPersona.position"> · {{ selectedPersona.position }}</span>
              </div>
            </div>

            <!-- 信息模块 -->
            <div class="detail-sections">
              <div v-if="getPersonaBackground(selectedPersona)" class="detail-block">
                <div class="detail-block-label">沟通背景</div>
                <div class="detail-block-text">{{ getPersonaBackground(selectedPersona) }}</div>
              </div>
              <div v-if="getPersonaScene(selectedPersona)" class="detail-block">
                <div class="detail-block-label">对话场景</div>
                <div class="detail-block-text">{{ getPersonaScene(selectedPersona) }}</div>
              </div>
              <div v-if="getPersonaTip(selectedPersona)" class="detail-block tip-block">
                <div class="detail-block-label">
                  <AppIcon name="bell" :size="12" style="margin-right:3px;color:#FF9500" />提示
                </div>
                <div class="detail-block-text">{{ getPersonaTip(selectedPersona) }}</div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="detail-actions">
              <button class="btn-secondary" style="height:44px" @click="startPractice">
                开始练习
              </button>
              <button
                class="btn-primary exam-btn" style="height:44px"
                :class="{ locked: !hasPractice || !!examSubmissionId }"
                @click="startExam"
              >
                <AppIcon v-if="!hasPractice || examSubmissionId" name="lock" :size="13" style="margin-right:4px" />
                {{ examSubmissionId ? '已完成考核' : '进入考核' }}
              </button>
              <div v-if="!hasPractice && !examSubmissionId" class="locked-hint">先完成一次练习后解锁考核</div>
              <button
                v-if="examSubmissionId"
                class="btn-ghost" style="height:40px;border:1px solid var(--color-primary);color:var(--color-primary)"
                @click="viewExamResult"
              >查看考核结果 ›</button>
            </div>
          </template>
        </div>

      </div>
    </template>
  </div>

  <!-- ========== Mobile Layout ========== -->
  <div v-else class="page-container">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <span class="page-title">{{ task?.title || '加载中...' }}</span>
      <div style="width:32px" />
    </div>

    <div v-if="loading" class="empty-state"><div class="spinner" /></div>
    <template v-else>
      <!-- 任务目标横幅 -->
      <div class="section">
        <div class="objective-banner" v-if="dialogueGoals.length">
          <div class="obj-label">
            <AppIcon name="target" :size="13" style="margin-right:4px" />对话目标
          </div>
          <div v-for="(g, i) in dialogueGoals" :key="i" class="obj-goal">
            <span class="obj-dot" />{{ g }}
          </div>
        </div>
      </div>

      <!-- 角色筛选 + 列表 -->
      <div class="section">
        <div class="section-title">选择对话对象</div>
        <div v-if="industries.length > 2" class="filter-chips filter-chips--mobile">
          <button
            v-for="ind in industries" :key="ind"
            class="filter-chip" :class="{ active: selectedIndustry === ind }"
            @click="selectedIndustry = ind"
          >{{ ind }}</button>
        </div>
        <div class="persona-scroll">
          <div
            v-for="(p, i) in filteredPersonas" :key="p.id"
            class="persona-chip" :class="{ selected: selectedPersona?.id === p.id }"
            @click="selectPersona(p)"
          >
            <div v-if="selectedPersona?.id === p.id" class="chip-check">
              <AppIcon name="check" :size="11" />
            </div>
            <div class="chip-avatar" :style="(p as any).avatar_url ? {} : { background: personaColor(i) }">
              <img v-if="(p as any).avatar_url" :src="(p as any).avatar_url" class="av-photo" alt="" />
              <template v-else>{{ p.name.charAt(0) }}</template>
            </div>
            <div class="chip-name">{{ p.name }}</div>
            <div class="chip-sub">{{ [p.industry, p.position].filter(Boolean).join(' · ') }}</div>
          </div>
        </div>
      </div>

      <!-- 选中角色详情 -->
      <div class="section" v-if="selectedPersona">
        <div class="card detail-mobile">
          <div class="dm-header">
            <div class="dm-avatar" :style="(selectedPersona as any).avatar_url ? {} : { background: personaColor(personaIndex) }">
              <img v-if="(selectedPersona as any).avatar_url" :src="(selectedPersona as any).avatar_url" class="av-photo" alt="" />
              <template v-else>{{ selectedPersona.name.charAt(0) }}</template>
            </div>
            <div>
              <div class="dm-name">
                {{ selectedPersona.name }}
                <span v-if="selectedPersona.age" style="font-weight:400;font-size:14px">，{{ selectedPersona.age }}岁</span>
              </div>
              <div class="dm-meta">{{ [selectedPersona.industry, selectedPersona.position].filter(Boolean).join(' · ') }}</div>
            </div>
          </div>
          <div class="dm-blocks">
            <div v-if="getPersonaBackground(selectedPersona)" class="dm-block">
              <div class="dm-block-label">沟通背景</div>
              <div class="dm-block-text">{{ getPersonaBackground(selectedPersona) }}</div>
            </div>
            <div v-if="getPersonaScene(selectedPersona)" class="dm-block">
              <div class="dm-block-label">对话场景</div>
              <div class="dm-block-text">{{ getPersonaScene(selectedPersona) }}</div>
            </div>
            <div v-if="getPersonaTip(selectedPersona)" class="dm-block dm-tip">
              <div class="dm-block-label">💡 提示</div>
              <div class="dm-block-text">{{ getPersonaTip(selectedPersona) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习材料 -->
      <div class="section" v-if="materials.length">
        <div class="section-title">学习材料（可选）</div>
        <div class="mat-list-mobile">
          <div v-for="m in materials" :key="m.id" class="mat-row-mobile card" @click="openPdf(m.id)">
            <AppIcon name="file" :size="17" style="flex-shrink:0;color:var(--color-primary)" />
            <span class="mat-name-mobile">{{ m.original_name }}</span>
            <span style="font-size:12px;color:var(--color-primary);flex-shrink:0">在线阅读 ›</span>
          </div>
        </div>
      </div>

      <!-- 评分维度 -->
      <div class="section">
        <div class="section-title">评分维度</div>
        <div class="dim-tags">
          <span v-for="d in scoringDimensions" :key="d" class="dim-tag">{{ d }}</span>
        </div>
      </div>
    </template>

    <!-- 底部操作栏 -->
    <div class="role-actions" v-if="!loading">
      <button class="btn-secondary" style="flex:1;height:46px" @click="startPractice">开始练习</button>
      <button
        v-if="examSubmissionId"
        class="btn-ghost" style="flex:1;height:46px;border:1px solid var(--color-primary);color:var(--color-primary);border-radius:12px;font-size:14px;font-weight:600"
        @click="viewExamResult"
      >查看考核结果 ›</button>
      <button
        v-else
        class="btn-primary" style="flex:1;height:46px"
        :class="{ locked: !hasPractice }"
        @click="startExam"
      >
        <AppIcon v-if="!hasPractice" name="lock" :size="13" style="margin-right:4px" />进入考核
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ── PC Wrapper ── */
.pc-wrapper { height: 100%; }

.pc-three-col {
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  gap: 20px;
  align-items: start;
  height: 100%;
}

/* ── Left col ── */
.col-left { display: flex; flex-direction: column; gap: 16px; }

.task-info-card { padding: 18px; }
.ti-badge {
  display: inline-flex; align-items: center;
  background: linear-gradient(135deg, rgba(175,82,222,0.12), rgba(88,86,214,0.12));
  color: #5856D6; font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px; margin-bottom: 10px;
}
.ti-title { font-size: 15px; font-weight: 700; color: var(--text-primary); line-height: 1.4; margin-bottom: 6px; }
.ti-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

.side-section { background: white; border-radius: 14px; padding: 14px 16px; box-shadow: var(--shadow-1); }
.side-section-title {
  font-size: 11px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.goal-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.goal-item { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: var(--text-primary); line-height: 1.5; }
.goal-dot {
  flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%;
  background: var(--color-primary); margin-top: 5px;
}

.dim-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.dim-tag {
  background: var(--bg-grouped); color: var(--text-secondary);
  font-size: 11px; font-weight: 600;
  padding: 3px 10px; border-radius: 20px;
  border: 1px solid var(--border);
}

.mat-list { display: flex; flex-direction: column; gap: 6px; }
.mat-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 4px; cursor: pointer; border-radius: 8px;
  transition: background 120ms;
}
.mat-row:hover { background: var(--bg-grouped); }
.mat-row-icon { flex-shrink: 0; color: var(--color-primary); }
.mat-row-name { flex: 1; font-size: 12px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mat-row-link { font-size: 11px; color: var(--color-primary); flex-shrink: 0; }

/* ── Center col ── */
.col-center { display: flex; flex-direction: column; gap: 16px; min-height: 0; }

.center-header { display: flex; flex-direction: column; gap: 10px; }

.filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-chip {
  height: 28px; padding: 0 12px; border-radius: 14px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  background: var(--bg-grouped);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  transition: all 120ms; white-space: nowrap;
}
.filter-chip.active {
  background: rgba(0,122,255,0.1); color: var(--color-primary); border-color: transparent;
}

.persona-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.persona-card {
  background: white; border-radius: 16px;
  border: 2px solid transparent;
  box-shadow: var(--shadow-1);
  padding: 20px 16px 16px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  position: relative; cursor: pointer;
  transition: border-color 150ms, box-shadow 150ms, transform 150ms;
}
.persona-card:hover:not(.selected) { box-shadow: var(--shadow-2); transform: translateY(-2px); }
.persona-card.selected {
  border-color: var(--color-primary);
  box-shadow: 0 4px 20px rgba(0,122,255,0.18);
  transform: translateY(-2px);
}

.card-check {
  position: absolute; top: 10px; right: 10px;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--color-primary); color: white;
  display: flex; align-items: center; justify-content: center;
}

.persona-avatar-lg {
  width: 60px; height: 76px; border-radius: 10px;
  color: white; font-size: 22px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px; overflow: hidden;
}
.av-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
.persona-card-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.persona-card-meta { font-size: 11px; color: var(--text-secondary); text-align: center; }
.persona-card-tags { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; margin-top: 4px; }
.ptag {
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px;
  background: rgba(175,82,222,0.1); color: #5856D6;
}
.ptag-blue { background: rgba(0,122,255,0.1); color: var(--color-primary); }

/* ── Right col ── */
.col-right {
  background: white; border-radius: 18px; box-shadow: var(--shadow-1);
  padding: 24px; display: flex; flex-direction: column; gap: 0;
  position: sticky; top: 20px;
}

.detail-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 48px 0;
}

.detail-hero {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; padding-bottom: 20px;
  border-bottom: 1px solid var(--separator);
  margin-bottom: 20px;
}
.detail-avatar {
  width: 80px; height: 100px; border-radius: 12px;
  color: white; font-size: 28px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px; overflow: hidden;
}
.detail-name { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.detail-meta { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

.detail-sections { display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px; }
.detail-block { display: flex; flex-direction: column; gap: 5px; }
.detail-block-label {
  display: flex; align-items: center;
  font-size: 11px; font-weight: 700; color: var(--text-3);
  text-transform: uppercase; letter-spacing: 0.4px;
}
.detail-block-text { font-size: 13px; color: var(--text-primary); line-height: 1.6; }
.tip-block .detail-block-text {
  background: rgba(255,149,0,0.08); border-left: 3px solid #FF9500;
  border-radius: 0 8px 8px 0; padding: 8px 10px;
  color: var(--text-secondary);
}

.detail-actions { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
.exam-btn.locked {
  background: var(--bg-grouped) !important;
  color: var(--text-3) !important;
  box-shadow: none !important;
}
.locked-hint { font-size: 11px; color: var(--text-3); text-align: center; }

/* ── Mobile page container override（留出 role-actions 高度） ── */
.page-container {
  padding-bottom: calc(var(--nav-height) + var(--safe-bottom) + 86px) !important;
}

/* ── Mobile ── */
.objective-banner {
  background: linear-gradient(135deg, #5856D6 0%, #AF52DE 100%);
  border-radius: 16px; padding: 16px; color: white;
}
.obj-label { font-size: 11px; font-weight: 700; opacity: 0.8; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; }
.obj-goal { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; line-height: 1.5; margin-bottom: 4px; }
.obj-dot { flex-shrink: 0; width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.8); margin-top: 7px; }

.filter-chips--mobile { margin-bottom: 12px; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
.filter-chips--mobile::-webkit-scrollbar { height: 0; }

.persona-scroll {
  display: flex; gap: 10px; overflow-x: auto; padding: 4px 0 8px;
  -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory;
}
.persona-scroll::-webkit-scrollbar { height: 0; }

.persona-chip {
  flex-shrink: 0; width: 110px;
  background: white; border-radius: 14px; padding: 14px 10px;
  border: 2px solid transparent; box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  position: relative; cursor: pointer; scroll-snap-align: start;
  transition: border-color 150ms, transform 150ms;
}
.persona-chip.selected {
  border-color: var(--color-primary); transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,122,255,0.2);
}
.chip-check {
  position: absolute; top: 6px; right: 6px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--color-primary); color: white;
  display: flex; align-items: center; justify-content: center;
}
.chip-avatar {
  width: 48px; height: 60px; border-radius: 8px;
  color: white; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.chip-name { font-size: 13px; font-weight: 600; color: var(--text-1); text-align: center; }
.chip-sub { font-size: 10px; color: var(--text-3); text-align: center; line-height: 1.3; }

.detail-mobile { padding: 16px; }
.dm-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.dm-avatar {
  width: 48px; height: 60px; border-radius: 8px;
  color: white; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;
}
.dm-name { font-size: 16px; font-weight: 700; color: var(--text-1); }
.dm-meta { font-size: 11px; color: var(--text-3); margin-top: 2px; }
.dm-blocks { display: flex; flex-direction: column; gap: 12px; }
.dm-block { display: flex; flex-direction: column; gap: 4px; }
.dm-block-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; }
.dm-block-text { font-size: 13px; color: var(--text-1); line-height: 1.6; }
.dm-tip .dm-block-text {
  background: rgba(255,149,0,0.08); border-left: 3px solid #FF9500;
  border-radius: 0 8px 8px 0; padding: 6px 10px;
}

.mat-list-mobile { display: flex; flex-direction: column; gap: 8px; }
.mat-row-mobile {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; cursor: pointer;
}
.mat-name-mobile {
  flex: 1; font-size: 14px; font-weight: 500; color: var(--text-1);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.role-actions {
  padding: 12px 16px;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid var(--separator);
  display: flex; gap: 10px;
  position: fixed;
  bottom: calc(var(--nav-height) + var(--safe-bottom));
  left: 0; right: 0;
  z-index: 50;
}
.btn-primary.locked {
  background: var(--bg-grouped) !important;
  color: var(--text-3) !important;
  box-shadow: none !important;
}
</style>
