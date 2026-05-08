<!-- ## 创建任务：填写基本信息、关联素材/题库/角色，选择时间范围 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminIcon from '@/components/AdminIcon.vue'
import { tasksApi, banksApi, personasApi, filesApi } from '@/api'
import type { QuestionBank, Persona, File as FileItem } from '@/api/types'
import { showToast } from '@/composables/toast'

const router = useRouter()
const step = ref(1)
const saving = ref(false)

const form = ref({
  title: '',
  description: '',
  type: 'qa' as 'qa' | 'roleplay',
  start_at: '',
  end_at: '',
  // qa specific
  bank_ids: [] as string[],
  material_ids: [] as string[],
  practice_count: 5,
  exam_count: 10,
  pass_score: 60,
  excellence_score: 90,
  // roleplay specific
  persona_ids: [] as string[],
  max_rounds: 10,
  objective: '',
  topic: '',        // 交流话题（约束对话方向和内容主题）
  difficulty_level: 'medium' as 'easy' | 'medium' | 'hard',
  time_limit: 30,
})

const banks = ref<QuestionBank[]>([])
const personas = ref<Persona[]>([])
const files = ref<FileItem[]>([])

onMounted(async () => {
  const [bankRes, personaRes, fileRes] = await Promise.all([
    banksApi.list({ page: 1, page_size: 100 }),
    personasApi.list({ page: 1, page_size: 100 }),
    filesApi.list({ page: 1, page_size: 100 }),
  ])
  banks.value = bankRes.items
  personas.value = personaRes.items
  files.value = fileRes.items
})

function toggleId(arr: string[], id: string) {
  const idx = arr.indexOf(id)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(id)
}

function nextStep() {
  if (step.value === 1) {
    if (!form.value.title) { showToast('请输入任务名称', 'error'); return }
  }
  step.value++
}

async function submit() {
  if (form.value.type === 'qa' && form.value.bank_ids.length === 0) {
    showToast('请选择至少一个题库', 'error'); return
  }
  if (form.value.type === 'roleplay' && form.value.persona_ids.length === 0) {
    showToast('请选择至少一个角色', 'error'); return
  }
  saving.value = true
  try {
    const payload: any = {
      title: form.value.title,
      description: form.value.description,
      type: form.value.type,
      config: {
        pass_score: form.value.pass_score,
        excellence_score: form.value.excellence_score,
        time_limit: form.value.time_limit,
      },
      material_ids: form.value.material_ids,
      start_at: form.value.start_at || undefined,
      end_at: form.value.end_at || undefined,
    }
    if (form.value.type === 'qa') {
      payload.bank_ids = form.value.bank_ids
      payload.config.practice_count = form.value.practice_count
      payload.config.exam_count = form.value.exam_count
    } else {
      payload.persona_ids = form.value.persona_ids
      payload.config.objective = form.value.objective
      payload.config.topic = form.value.topic
      payload.config.difficulty_level = form.value.difficulty_level
      payload.config.max_rounds = form.value.max_rounds
    }
    const task = await tasksApi.create(payload)
    showToast('任务创建成功', 'success')
    router.push(`/tasks/${task.id}`)
  } catch (e: any) { showToast(e?.message || '创建失败', 'error') }
  saving.value = false
}

const steps = ['基本信息', '内容配置', '确认创建']
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <button class="back-btn" @click="router.push('/tasks')">‹ 返回</button>
      <h2>创建任务</h2>
    </div>

    <!-- Stepper -->
    <div class="stepper">
      <template v-for="(s, i) in steps" :key="i">
        <div class="step" :class="{ active: step === i+1, done: step > i+1 }">
          <div class="step-num">{{ step > i+1 ? '✓' : i+1 }}</div>
          <span>{{ s }}</span>
        </div>
        <div v-if="i < steps.length-1" class="step-line" :class="{ done: step > i+1 }" />
      </template>
    </div>

    <div class="form-card">
      <!-- Step 1: Basic Info -->
      <div v-if="step === 1">
        <h3 class="form-section-title">基本信息</h3>
        <div class="form-grid">
          <div class="field">
            <label>任务名称 <span class="required">*</span></label>
            <input v-model="form.title" placeholder="例如：Q2 产品知识考核" />
          </div>
          <div class="field">
            <label>任务描述</label>
            <textarea v-model="form.description" placeholder="任务目标、说明等..." rows="3" />
          </div>
          <div class="field">
            <label>任务类型 <span class="required">*</span></label>
            <div class="type-select">
              <div
                class="type-option"
                :class="{ active: form.type === 'qa' }"
                @click="form.type = 'qa'"
              >
                <div class="type-icon"><AdminIcon name="qa" /></div>
                <div class="type-label">知识问答</div>
                <div class="type-desc">学员回答题库中的题目，AI 自动评分</div>
              </div>
              <div
                class="type-option"
                :class="{ active: form.type === 'roleplay' }"
                @click="form.type = 'roleplay'"
              >
                <div class="type-icon"><AdminIcon name="roleplay" /></div>
                <div class="type-label">模拟对练</div>
                <div class="type-desc">与 AI 扮演的角色进行对话演练</div>
              </div>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>开始时间</label>
              <input v-model="form.start_at" type="datetime-local" />
            </div>
            <div class="field">
              <label>结束时间</label>
              <input v-model="form.end_at" type="datetime-local" />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Content -->
      <div v-else-if="step === 2">
        <!-- QA config -->
        <template v-if="form.type === 'qa'">
          <h3 class="form-section-title">选择题库</h3>
          <div class="check-grid">
            <div
              v-for="b in banks"
              :key="b.id"
              class="check-item"
              :class="{ selected: form.bank_ids.includes(b.id) }"
              @click="toggleId(form.bank_ids, b.id)"
            >
              <span class="check-icon"><AdminIcon name="question-bank" /></span>
              <div>
                <div class="check-name">{{ b.name }}</div>
                <div class="check-sub">{{ b.question_count ?? 0 }} 题</div>
              </div>
              <span class="check-mark" v-if="form.bank_ids.includes(b.id)">✓</span>
            </div>
            <div v-if="banks.length === 0" class="empty-hint">暂无题库，请先在「题库管理」创建</div>
          </div>

          <div class="form-grid" style="margin-top:20px">
            <div class="field-row">
              <div class="field">
                <label>练习题目数（{{ form.practice_count }} 题）</label>
                <input v-model.number="form.practice_count" type="range" min="3" max="20" />
              </div>
              <div class="field">
                <label>考核题目数（{{ form.exam_count }} 题）</label>
                <input v-model.number="form.exam_count" type="range" min="5" max="30" />
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>合格分数线</label>
                <div class="score-input-wrap">
                  <input v-model.number="form.pass_score" type="number" min="0" max="100" />
                  <span class="score-unit">分</span>
                </div>
              </div>
              <div class="field">
                <label>优秀分数线</label>
                <div class="score-input-wrap">
                  <input v-model.number="form.excellence_score" type="number" min="0" max="100" />
                  <span class="score-unit">分</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section-divider" />
          <h3 class="form-section-title">关联学习材料（可选）</h3>
          <div class="check-grid">
            <div
              v-for="f in files"
              :key="f.id"
              class="check-item"
              :class="{ selected: form.material_ids.includes(f.id) }"
              @click="toggleId(form.material_ids, f.id)"
            >
              <span class="check-icon">PDF</span>
              <div>
                <div class="check-name">{{ f.original_name }}</div>
                <div class="check-sub">{{ f.created_at?.slice(0,10) }}</div>
              </div>
              <span class="check-mark" v-if="form.material_ids.includes(f.id)">✓</span>
            </div>
            <div v-if="files.length === 0" class="empty-hint">暂无文件</div>
          </div>
        </template>

        <!-- Roleplay config -->
        <template v-else>
          <h3 class="form-section-title">选择角色</h3>
          <div class="check-grid">
            <div
              v-for="p in personas"
              :key="p.id"
              class="check-item"
              :class="{ selected: form.persona_ids.includes(p.id) }"
              @click="toggleId(form.persona_ids, p.id)"
            >
              <div class="persona-mini-avatar">{{ p.name.charAt(0) }}</div>
              <div>
                <div class="check-name">{{ p.name }}</div>
                <div class="check-sub">{{ (p as any).role_type || p.industry || '—' }}</div>
              </div>
              <span class="check-mark" v-if="form.persona_ids.includes(p.id)">✓</span>
            </div>
            <div v-if="personas.length === 0" class="empty-hint">暂无角色，请先在「角色库」创建</div>
          </div>

          <div class="form-grid" style="margin-top:20px">
            <div class="field">
              <label>训练目标 <span class="required">*</span></label>
              <textarea v-model="form.objective" placeholder="描述学员在此对练中需要达成的目标，如：完成一次产品推销，说服客户试用..." rows="3" />
            </div>
            <div class="field">
              <label>交流话题</label>
              <textarea v-model="form.topic" placeholder="约束角色与学员对话的内容主题和方向，如：云计算解决方案采购、年度保险方案续签谈判……留空则不限制话题" rows="2" />
            </div>
            <div class="field">
              <label>对练难度</label>
              <div class="difficulty-select">
                <div
                  class="difficulty-option"
                  :class="{ active: form.difficulty_level === 'easy' }"
                  @click="form.difficulty_level = 'easy'"
                >
                  <div class="diff-header">
                    <span class="diff-badge easy">入门</span>
                    <span class="diff-name">入门级</span>
                  </div>
                  <div class="diff-desc">问题基础友好，接受度高，适合初次练习</div>
                </div>
                <div
                  class="difficulty-option"
                  :class="{ active: form.difficulty_level === 'medium' }"
                  @click="form.difficulty_level = 'medium'"
                >
                  <div class="diff-header">
                    <span class="diff-badge medium">进阶</span>
                    <span class="diff-name">进阶级</span>
                  </div>
                  <div class="diff-desc">有一定深度，需充分论据，贴近真实商务场景</div>
                </div>
                <div
                  class="difficulty-option"
                  :class="{ active: form.difficulty_level === 'hard' }"
                  @click="form.difficulty_level = 'hard'"
                >
                  <div class="diff-header">
                    <span class="diff-badge hard">专家</span>
                    <span class="diff-name">专家级</span>
                  </div>
                  <div class="diff-desc">角色专业且严苛，适合高阶实战训练</div>
                </div>
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>最大对话轮数</label>
                <input v-model.number="form.max_rounds" type="number" min="3" max="30" style="width:100px" />
              </div>
              <div class="field">
                <label>单次时限（分钟）</label>
                <input v-model.number="form.time_limit" type="number" min="0" max="120" style="width:100px" />
                <span style="font-size:11px;color:var(--text-tertiary)">0 = 不限制</span>
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label>合格分数线</label>
                <div class="score-input-wrap">
                  <input v-model.number="form.pass_score" type="number" min="0" max="100" />
                  <span class="score-unit">分</span>
                </div>
              </div>
              <div class="field">
                <label>优秀分数线</label>
                <div class="score-input-wrap">
                  <input v-model.number="form.excellence_score" type="number" min="0" max="100" />
                  <span class="score-unit">分</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Step 3: Confirm -->
      <div v-else>
        <h3 class="form-section-title">确认创建</h3>
        <div class="confirm-list">
          <div class="confirm-row">
            <span class="confirm-key">任务名称</span>
            <span class="confirm-val">{{ form.title }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-key">任务类型</span>
            <span class="confirm-val">{{ form.type === 'qa' ? '知识问答' : '模拟对练' }}</span>
          </div>
          <div class="confirm-row" v-if="form.type === 'qa'">
            <span class="confirm-key">题库数量</span>
            <span class="confirm-val">{{ form.bank_ids.length }} 个</span>
          </div>
          <div class="confirm-row" v-if="form.type === 'roleplay'">
            <span class="confirm-key">角色数量</span>
            <span class="confirm-val">{{ form.persona_ids.length }} 个</span>
          </div>
          <div class="confirm-row" v-if="form.type === 'roleplay' && form.topic">
            <span class="confirm-key">交流话题</span>
            <span class="confirm-val">{{ form.topic }}</span>
          </div>
          <div class="confirm-row" v-if="form.type === 'roleplay'">
            <span class="confirm-key">对练难度</span>
            <span class="confirm-val">{{ { easy: '入门级', medium: '进阶级', hard: '专家级' }[form.difficulty_level] }}</span>
          </div>
          <div class="confirm-row" v-if="form.start_at">
            <span class="confirm-key">开始时间</span>
            <span class="confirm-val">{{ form.start_at.replace('T', ' ') }}</span>
          </div>
          <div class="confirm-row" v-if="form.end_at">
            <span class="confirm-key">结束时间</span>
            <span class="confirm-val">{{ form.end_at.replace('T', ' ') }}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-key">合格 / 优秀</span>
            <span class="confirm-val">{{ form.pass_score }}分 / {{ form.excellence_score }}分</span>
          </div>
          <div class="confirm-row" v-if="form.description">
            <span class="confirm-key">描述</span>
            <span class="confirm-val">{{ form.description }}</span>
          </div>
        </div>
        <p class="confirm-hint">创建后状态为「草稿」，可在任务详情页添加用户并发布。</p>
      </div>

      <!-- Footer buttons -->
      <div class="form-footer">
        <button class="btn-ghost" v-if="step > 1" @click="step--">上一步</button>
        <button class="btn-ghost" @click="router.push('/tasks')">取消</button>
        <button v-if="step < 3" class="btn-primary" @click="nextStep">下一步</button>
        <button v-else class="btn-primary" :disabled="saving" @click="submit">{{ saving ? '确认中...' : '确认创建' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrap { padding: 28px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; height: 100%; }
.back-btn { padding: 4px 12px; border-radius: 7px; font-size: 13px; background: var(--bg-grouped); color: var(--text-secondary); cursor: pointer; border: 1px solid var(--border); }
.page-header { display: flex; align-items: center; gap: 12px; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }

.stepper { display: flex; align-items: center; gap: 0; }
.step { display: flex; align-items: center; gap: 8px; }
.step-num { width: 26px; height: 26px; border-radius: 50%; background: var(--bg-grouped); border: 2px solid var(--border); font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); transition: all 200ms; }
.step.active .step-num { background: var(--color-primary); border-color: var(--color-primary); color: white; }
.step.done .step-num { background: var(--color-success); border-color: var(--color-success); color: white; }
.step span { font-size: 13px; font-weight: 500; color: var(--text-tertiary); }
.step.active span { color: var(--text-primary); font-weight: 600; }
.step-line { flex: 1; min-width: 40px; height: 2px; background: var(--border); margin: 0 8px; transition: background 200ms; }
.step-line.done { background: var(--color-success); }

.form-card { background: white; border-radius: 14px; border: 1px solid var(--border); padding: 28px; box-shadow: var(--shadow-1); }
.form-section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 16px; padding-bottom: 10px; border-bottom: 2px solid var(--color-primary); display: inline-flex; align-items: center; gap: 6px; }
.form-grid { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.required { color: var(--color-danger); }
input, textarea { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg-grouped); font-size: 13px; color: var(--text-primary); font-family: inherit; }
input { height: 36px; }
textarea { resize: vertical; }
input:focus, textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,102,204,0.1); outline: none; }

.type-select { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.type-option { border: 2px solid var(--border); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 150ms; }
.type-option:hover { border-color: var(--color-primary); }
.type-option.active { border-color: var(--color-primary); background: rgba(0,102,204,0.04); }
.type-icon { color: var(--text-tertiary); margin-bottom: 8px; }
.type-option.active .type-icon { color: var(--color-primary); }
.type-label { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.type-desc { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }

.check-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.check-item { border: 2px solid var(--border); border-radius: 10px; padding: 12px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 150ms; position: relative; }
.check-item:hover { border-color: var(--color-primary); }
.check-item.selected { border-color: var(--color-primary); background: rgba(0,102,204,0.04); }
.check-icon { flex-shrink: 0; color: var(--text-tertiary); display: flex; align-items: center; }
.check-item.selected .check-icon { color: var(--color-primary); }
.check-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.check-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
.check-mark { position: absolute; top: 8px; right: 10px; color: var(--color-primary); font-weight: 700; }
.persona-mini-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#5856D6,#FF2D55); color: white; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.empty-hint { font-size: 13px; color: var(--text-tertiary); padding: 16px; }

.confirm-list { display: flex; flex-direction: column; gap: 14px; }
.confirm-row { display: flex; gap: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--separator); }
.confirm-row:last-child { border-bottom: none; }
.confirm-key { font-size: 13px; font-weight: 600; color: var(--text-secondary); width: 100px; flex-shrink: 0; }
.confirm-val { font-size: 13px; color: var(--text-primary); }
.confirm-hint { font-size: 12px; color: var(--text-tertiary); margin-top: 16px; padding: 10px 14px; background: var(--bg-grouped); border-radius: 8px; }
.section-divider { height: 1px; background: var(--separator); margin: 24px 0 20px; }

.form-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--separator); }
.btn-primary { height: 36px; padding: 0 20px; border-radius: 8px; background: var(--color-primary); color: white; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { height: 36px; padding: 0 16px; border-radius: 8px; background: var(--bg-grouped); color: var(--text-primary); font-size: 13px; cursor: pointer; border: 1px solid var(--border); }
.field-row { display: flex; gap: 16px; flex-wrap: wrap; }
.field-row .field { flex: 1; min-width: 160px; }
input[type="range"] { width: 100%; accent-color: var(--color-primary); }
.score-input-wrap { display: flex; align-items: center; gap: 6px; }
.score-input-wrap input { width: 90px; flex-shrink: 0; }
.score-unit { font-size: 13px; color: var(--text-secondary); white-space: nowrap; }

/* 难度选择器 */
.difficulty-select { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.difficulty-option { border: 2px solid var(--border); border-radius: 10px; padding: 12px; cursor: pointer; transition: all 150ms; }
.difficulty-option:hover { border-color: var(--color-primary); }
.difficulty-option.active { border-color: var(--color-primary); background: rgba(0,102,204,0.04); }
.diff-header { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
.diff-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.diff-desc { font-size: 11px; color: var(--text-secondary); line-height: 1.5; }
.diff-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.diff-badge.easy { background: #e6f9ee; color: #1a8742; }
.diff-badge.medium { background: #fff3e0; color: #e65c00; }
.diff-badge.hard { background: #fde8e8; color: #c0392b; }
</style>
