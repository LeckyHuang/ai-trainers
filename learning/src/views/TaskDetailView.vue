<!-- ## 任务详情页：展示任务信息、学习材料、可选角色，提供开始练习/考核入口 -->
<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tasksApi, filesApi, personasApi } from '@/api'
import { showToast } from '@/composables/toast'
import type { Task, FileItem, Persona } from '@/api/types'
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
const materials = ref<FileItem[]>([])
const personas = ref<Persona[]>([])
const hasPractice = ref(false)
const examSubmissionId = ref<string>('')

onMounted(async () => {
  try {
    const taskRes = await tasksApi.get(taskId)
    task.value = taskRes

    // roleplay 任务直接跳角色选择页，无需中间过渡
    const type = taskRes.type || taskRes.task_type
    if (type === 'roleplay') {
      router.replace(`/tasks/${taskId}/role-select`)
      return
    }

    const [personaRes, fileResults, subsRes] = await Promise.all([
      personasApi.list().catch(() => []),
      taskRes.material_ids?.length
        ? Promise.all(taskRes.material_ids.map((fid: string) => filesApi.get(fid).catch(() => null)))
        : Promise.resolve([]),
      tasksApi.mySubmissions(taskId).catch(() => []),
    ])
    const personaIds: string[] = taskRes.persona_ids || []
    const allPersonas = Array.isArray(personaRes) ? personaRes : (personaRes.items || [])
    personas.value = personaIds.length > 0
      ? allPersonas.filter((p: any) => personaIds.includes(p.id))
      : allPersonas
    materials.value = fileResults.filter(Boolean)
    const subs = Array.isArray(subsRes) ? subsRes : []
    hasPractice.value = subs.some((s: any) => s.mode === 'practice' && s.status === 'completed')
    const examSub = subs.find((s: any) => s.mode === 'exam' && s.status === 'completed')
    if (examSub) examSubmissionId.value = examSub.id || examSub.submission_id || ''
  } catch {}
  loading.value = false
})

function isQa() {
  return task.value?.type === 'qa' || task.value?.task_type === 'qa'
}
function isRoleplay() {
  return task.value?.type === 'roleplay' || task.value?.task_type === 'roleplay'
}

function startQa() { router.push(`/tasks/${taskId}/qa`) }
function startRoleplay() { router.push(`/tasks/${taskId}/role-select`) }
function startExam() { router.push(`/tasks/${taskId}/exam`) }
function openPdf(fileId: string) { router.push(`/tasks/${taskId}/pdf?file_id=${fileId}`) }
</script>

<template>
  <!-- ========== PC Layout ========== -->
  <div v-if="isPC">
    <div v-if="loading" class="empty-state"><div class="spinner" /></div>
    <template v-else-if="task">
      <div class="pc-task-header">
        <div>
          <div class="pc-content-title">{{ task.title }}</div>
          <div class="pc-content-sub" v-if="task.description">{{ task.description }}</div>
        </div>
        <span class="badge" :class="isQa() ? 'badge-blue' : 'badge-purple'" style="font-size:13px;padding:6px 14px">
          <AppIcon :name="isQa() ? 'task-qa' : 'task-roleplay'" :size="14" style="margin-right:4px" />
          {{ isQa() ? '知识问答' : '模拟对练' }}
        </span>
      </div>

      <!-- 判断左侧是否有实质内容 -->
      <div
        class="pc-detail-grid"
        :class="{ 'no-sidebar': materials.length === 0 && !(isRoleplay() && personas.length > 0) }"
      >
        <!-- Left: materials + personas（有内容才渲染） -->
        <div class="pc-detail-main" v-if="materials.length > 0 || (isRoleplay() && personas.length > 0)">
          <div v-if="materials.length > 0" style="margin-bottom:24px">
            <div class="pc-section-title" style="margin-bottom:12px">学习材料</div>
            <div class="material-list">
              <div
                v-for="m in materials"
                :key="m.id"
                class="material-item card"
                @click="openPdf(m.id)"
              >
                <span class="mat-icon"><AppIcon name="file" :size="18" /></span>
                <div class="mat-info">
                  <span class="mat-name">{{ m.original_name }}</span>
                  <span class="mat-size">{{ ((m.size_bytes || m.file_size || 0) / 1024).toFixed(0) }} KB</span>
                </div>
                <span class="mat-arrow">在线阅读 ›</span>
              </div>
            </div>
          </div>

          <div v-if="isRoleplay() && personas.length > 0">
            <div class="pc-section-title" style="margin-bottom:12px">可选角色</div>
            <div class="pc-persona-grid">
              <div v-for="p in personas" :key="p.id" class="persona-item card">
                <div class="persona-avatar">{{ p.name[0] }}</div>
                <div class="persona-info">
                  <div class="persona-name">{{ p.name }}</div>
                  <div class="persona-meta">{{ p.position || '' }} {{ p.industry ? '· ' + p.industry : '' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right / Center: action panel -->
        <div class="pc-detail-aside">
          <div class="pc-action-card card">
            <div class="pc-action-icon">
              <AppIcon :name="isQa() ? 'task-qa' : 'task-roleplay'" :size="32" />
            </div>
            <div class="pc-action-title">开始任务</div>
            <div class="pc-action-desc">
              {{ isQa() ? '通过语音或文字回答题目，AI 即时评分反馈' : '选择角色，开始模拟对练，提升真实销售/沟通能力' }}
            </div>
            <div class="pc-action-btns">
              <template v-if="isQa()">
                <button class="btn-secondary" style="height:44px" @click="startQa">开始练习</button>
                <button
                  class="btn-primary" style="height:44px"
                  :style="(!hasPractice || !!examSubmissionId) ? 'opacity:0.5;cursor:not-allowed' : ''"
                  @click="examSubmissionId ? showToast('您已完成本任务考核', 'info') : hasPractice ? startExam() : showToast('请先完成一次练习后再进入考核', 'info')"
                >
                  <AppIcon v-if="!hasPractice || examSubmissionId" name="lock" :size="13" style="margin-right:4px" />
                  {{ examSubmissionId ? '已完成考核' : '进入考核' }}
                </button>
                <div v-if="!hasPractice && !examSubmissionId" class="locked-hint">完成一次练习后解锁考核</div>
                <button
                  v-if="examSubmissionId"
                  class="btn-ghost" style="height:40px;border:1px solid var(--color-primary);color:var(--color-primary)"
                  @click="router.push(`/qa/${examSubmissionId}/result`)"
                >查看考核结果 ›</button>
              </template>
              <button
                v-if="isRoleplay()" class="btn-primary" style="height:44px;background:linear-gradient(135deg, #AF52DE, #5856D6)"
                @click="startRoleplay"
              >选择角色开始对练</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- ========== Mobile Layout ========== -->
  <div v-else class="page-container">
    <div class="page-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <span class="page-title">任务详情</span>
    </div>

    <div v-if="loading" class="empty-state">
      <div class="spinner" />
    </div>

    <template v-else-if="task">
      <div class="section">
        <div class="task-hero card">
          <div class="task-icon-big"><AppIcon :name="isQa() ? 'task-qa' : 'task-roleplay'" :size="36" /></div>
          <h2>{{ task.title }}</h2>
          <p v-if="task.description" class="desc">{{ task.description }}</p>
          <div class="tags">
            <span class="badge" :class="isQa() ? 'badge-blue' : 'badge-purple'">
              {{ isQa() ? '知识问答' : '模拟对练' }}
            </span>
          </div>
        </div>
      </div>

      <div class="section" v-if="materials.length > 0">
        <div class="section-title">学习材料</div>
        <div class="material-list">
          <div
            v-for="m in materials"
            :key="m.id"
            class="material-item card"
            @click="openPdf(m.id)"
          >
            <span class="mat-icon"><AppIcon name="file" :size="18" /></span>
            <div class="mat-info">
              <span class="mat-name">{{ m.original_name }}</span>
              <span class="mat-size">{{ ((m.size_bytes || m.file_size || 0) / 1024).toFixed(0) }} KB</span>
            </div>
            <span class="mat-arrow">›</span>
          </div>
        </div>
      </div>

      <div class="section" v-if="isRoleplay() && personas.length > 0">
        <div class="section-title">可选角色</div>
        <div class="persona-list">
          <div v-for="p in personas" :key="p.id" class="persona-item card">
            <div class="persona-avatar">{{ p.name[0] }}</div>
            <div class="persona-info">
              <div class="persona-name">{{ p.name }}</div>
              <div class="persona-meta">{{ p.position || '' }} {{ p.industry ? '@' + p.industry : '' }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section" style="display:flex;flex-direction:column;gap:10px">
        <template v-if="isQa()">
          <button class="btn-secondary action-btn" @click="startQa">开始练习</button>
          <button
            class="btn-primary action-btn"
            :style="(!hasPractice || !!examSubmissionId) ? 'opacity:0.5;cursor:not-allowed' : ''"
            @click="examSubmissionId ? showToast('您已完成本任务考核', 'info') : hasPractice ? startExam() : showToast('请先完成一次练习后再进入考核', 'info')"
          >
            <AppIcon v-if="!hasPractice || examSubmissionId" name="lock" :size="13" style="margin-right:4px" />
            {{ examSubmissionId ? '已完成考核' : '进入考核' }}
          </button>
          <div v-if="!hasPractice && !examSubmissionId" class="locked-hint">完成一次练习后解锁考核</div>
          <button
            v-if="examSubmissionId"
            class="action-btn"
            style="height:50px;font-size:16px;border-radius:12px;background:rgba(0,122,255,0.08);color:#007AFF;border:1px solid rgba(0,122,255,0.2)"
            @click="router.push(`/qa/${examSubmissionId}/result`)"
          >查看考核结果 ›</button>
        </template>
        <button
          v-if="isRoleplay()" class="btn-primary action-btn"
          style="background:linear-gradient(135deg, #AF52DE, #5856D6)"
          @click="startRoleplay"
        >选择角色开始对练</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* --- PC styles --- */
.pc-task-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 24px; gap: 20px;
}

.pc-detail-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}
/* 没有左侧内容时，action 卡居中显示 */
.pc-detail-grid.no-sidebar {
  grid-template-columns: 1fr;
  max-width: 480px;
  margin: 0 auto;
}

.pc-persona-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.pc-action-card {
  padding: 32px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.pc-detail-grid:not(.no-sidebar) .pc-action-card {
  align-items: flex-start; text-align: left;
}
.pc-action-icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: linear-gradient(135deg, rgba(0,122,255,0.12), rgba(88,86,214,0.12));
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px; color: var(--color-primary);
}
.pc-detail-grid:not(.no-sidebar) .pc-action-icon { display: none; }
.pc-action-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.pc-action-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px; }
.pc-action-btns { display: flex; flex-direction: column; gap: 10px; width: 100%; }

/* --- Shared styles --- */
.task-hero {
  padding: 24px 20px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.task-icon-big { font-size: 48px; }
h2 { font-size: 20px; font-weight: 800; color: var(--text-1); }
.desc { font-size: 14px; color: var(--text-3); line-height: 1.6; }
.tags { display: flex; gap: 6px; }

.material-list { display: flex; flex-direction: column; gap: 8px; }
.material-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; cursor: pointer;
}
.material-item:active { transform: scale(0.98); }
.material-item:hover { background: var(--bg-grouped); }
.mat-icon { font-size: 24px; }
.mat-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.mat-name { font-size: 14px; font-weight: 600; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mat-size { font-size: 12px; color: var(--text-3); }
.mat-arrow { font-size: 13px; color: var(--color-primary); font-weight: 500; white-space: nowrap; }

.persona-list { display: flex; flex-direction: column; gap: 8px; }
.persona-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
}
.persona-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #AF52DE, #5856D6);
  color: white; display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700; flex-shrink: 0;
}
.persona-name { font-size: 15px; font-weight: 600; color: var(--text-1); }
.persona-meta { font-size: 12px; color: var(--text-3); margin-top: 2px; }

.action-btn { margin-top: 4px; height: 50px; font-size: 16px; border-radius: 12px; }
.locked-hint { font-size: 12px; color: var(--text-3); text-align: center; margin-top: -2px; }
</style>
