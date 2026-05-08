<!-- ## 系统配置（超管）：在线编辑所有 AI Prompt 和参数，实时生效 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { systemConfigApi } from '@/api'
import { showToast } from '@/composables/toast'
import AdminIcon from '@/components/AdminIcon.vue'

interface ConfigItem { key: string; value: string; description: string; group?: string; updated_at?: string }

const configs = ref<ConfigItem[]>([])
const loading = ref(false)
const saving = ref<Record<string, boolean>>({})
const editValues = ref<Record<string, string>>({})
const activeTab = ref<'prompts' | 'ai'>('prompts')

// 所有 prompt 分组，顺序与 DEFAULT_CONFIGS 保持一致
const PROMPT_GROUPS = [
  {
    label: '题库生成',
    keys: ['extract_questions_system', 'extract_questions_user'],
    color: '#FF9500',
  },
  {
    label: '虚拟角色画像',
    keys: ['generate_persona_system', 'generate_persona_user'],
    color: '#34C759',
  },
  {
    label: '知识问答评分',
    keys: ['qa_score_system', 'qa_score_user'],
    color: '#007AFF',
  },
  {
    label: '模拟对练',
    keys: ['roleplay_behavior_instructions', 'roleplay_eval_system', 'roleplay_eval_user'],
    color: '#AF52DE',
  },
]

const AI_KEYS = ['llm_model', 'llm_temperature', 'llm_max_tokens', 'qa_pass_score', 'roleplay_pass_score', 'platform_name']

const keyLabels: Record<string, string> = {
  extract_questions_system: '题库生成 System Prompt',
  extract_questions_user: '题库生成 User 模板',
  generate_persona_system: '角色画像生成 System Prompt',
  generate_persona_user: '角色画像生成 User 模板',
  qa_score_system: '知识问答评分 System Prompt',
  qa_score_user: '知识问答评分 User 模板',
  roleplay_behavior_instructions: '对练角色行为规则',
  roleplay_eval_system: '对练综合评估 System Prompt',
  roleplay_eval_user: '对练综合评估 User 模板',
  llm_model: '语言模型（Model）',
  llm_temperature: '温度（Temperature）',
  llm_max_tokens: '最大 Token 数',
  qa_pass_score: '问答通过分数线',
  roleplay_pass_score: '对练通过分数线',
  platform_name: '平台名称',
}

function getConfig(key: string) { return configs.value.find(c => c.key === key) }
function isDirty(key: string) { return getConfig(key)?.value !== editValues.value[key] }

async function load() {
  loading.value = true
  try {
    const res = await systemConfigApi.getAll()
    configs.value = res.items
    res.items.forEach((c: ConfigItem) => { editValues.value[c.key] = c.value })
  } catch { showToast('加载配置失败', 'error') }
  loading.value = false
}

onMounted(load)

async function save(key: string) {
  saving.value[key] = true
  try {
    await systemConfigApi.update(key, { value: editValues.value[key] })
    const c = configs.value.find(x => x.key === key)
    if (c) c.value = editValues.value[key]
    showToast('已保存', 'success')
  } catch { showToast('保存失败', 'error') }
  saving.value[key] = false
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>系统配置</h2>
        <span class="sub">修改后即时生效，影响所有用户的 AI 行为</span>
      </div>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'prompts' }" @click="activeTab = 'prompts'">Prompt 配置</button>
      <button class="tab" :class="{ active: activeTab === 'ai' }" @click="activeTab = 'ai'">AI 参数</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <!-- Prompts tab -->
    <div v-else-if="activeTab === 'prompts'" class="config-list">
      <div v-for="group in PROMPT_GROUPS" :key="group.label" class="group-block">
        <div class="group-header" :style="{ borderLeftColor: group.color }">
          <span class="group-label">{{ group.label }}</span>
        </div>
        <div class="group-cards">
          <div v-for="key in group.keys" :key="key" class="config-card">
            <div class="config-head">
              <div class="config-title">{{ keyLabels[key] || key }}</div>
              <div class="config-desc">{{ getConfig(key)?.description }}</div>
            </div>
            <textarea
              v-model="editValues[key]"
              class="prompt-editor"
              rows="7"
            />
            <div class="config-footer">
              <span class="last-updated">
                {{ getConfig(key)?.updated_at ? '最后更新：' + getConfig(key)!.updated_at!.slice(0,16).replace('T',' ') : '使用默认值' }}
              </span>
              <div class="footer-actions">
                <button v-if="isDirty(key)" class="btn-ghost-sm" @click="editValues[key] = getConfig(key)?.value ?? ''">撤销</button>
                <button class="btn-save" :disabled="saving[key] || !isDirty(key)" :style="{ background: group.color }" @click="save(key)">
                  {{ saving[key] ? '保存中...' : '保存' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Params tab -->
    <div v-else class="config-list">
      <div class="ai-grid">
        <div v-for="key in AI_KEYS" :key="key" class="ai-card">
          <div class="ai-label">{{ keyLabels[key] || key }}</div>
          <div class="ai-desc">{{ getConfig(key)?.description }}</div>
          <div class="ai-input-row">
            <input
              v-model="editValues[key]"
              class="ai-input"
              :type="['llm_temperature','llm_max_tokens','qa_pass_score','roleplay_pass_score'].includes(key) ? 'number' : 'text'"
              :step="key === 'llm_temperature' ? 0.1 : 1"
              :min="key === 'llm_temperature' ? 0 : 1"
              :max="key === 'llm_temperature' ? 2 : key.includes('score') ? 100 : undefined"
            />
            <button class="btn-save-sm" :disabled="saving[key] || !isDirty(key)" @click="save(key)">
              {{ saving[key] ? '...' : '保存' }}
            </button>
          </div>
        </div>
      </div>

      <div class="notice-box">
        <div class="notice-title"><AdminIcon name="sparkle" /> 参数说明</div>
        <div class="notice-body">
          <p><strong>模型名称</strong>：qwen-plus / qwen-turbo / qwen-max（通义千问系列）</p>
          <p><strong>Temperature</strong>：0.0 = 确定性输出，0.7 = 均衡，2.0 = 高随机。评分建议 0.3，对练建议 0.8</p>
          <p><strong>通过分数线</strong>：学员完成任务后达到该分数才算「通过」</p>
          <p><strong>平台名称</strong>：显示在学员端顶部标题</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.sub { font-size: 12px; color: var(--text-tertiary); display: block; margin-top: 2px; }

.tabs { display: flex; gap: 4px; background: var(--bg-grouped); padding: 4px; border-radius: 10px; width: fit-content; }
.tab { padding: 6px 18px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text-secondary); transition: all 150ms; background: transparent; border: none; }
.tab.active { background: white; color: var(--text-primary); font-weight: 600; box-shadow: var(--shadow-1); }

.loading { text-align: center; color: var(--text-tertiary); padding: 60px; }
.config-list { display: flex; flex-direction: column; gap: 24px; }

.group-block { display: flex; flex-direction: column; gap: 12px; }
.group-header { padding-left: 12px; border-left: 3px solid #007AFF; }
.group-label { font-size: 14px; font-weight: 700; color: var(--text-primary); }

.group-cards { display: flex; flex-direction: column; gap: 10px; }

.config-card { background: white; border-radius: 12px; border: 1px solid var(--border); box-shadow: var(--shadow-1); overflow: hidden; }
.config-head { padding: 14px 20px 10px; border-bottom: 1px solid var(--separator); }
.config-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.config-desc { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }
.prompt-editor {
  width: 100%; padding: 14px 20px; border: none; resize: vertical;
  font-size: 12.5px; color: var(--text-primary); background: #FAFAFA;
  font-family: 'SF Mono', 'Menlo', 'Monaco', monospace; line-height: 1.7;
  border-bottom: 1px solid var(--separator); outline: none; box-sizing: border-box;
}
.prompt-editor:focus { background: white; }
.config-footer { padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
.last-updated { font-size: 11px; color: var(--text-tertiary); }
.footer-actions { display: flex; gap: 8px; }
.btn-ghost-sm { height: 30px; padding: 0 12px; border-radius: 7px; font-size: 12px; background: var(--bg-grouped); border: 1px solid var(--border); cursor: pointer; color: var(--text-secondary); }
.btn-save { height: 30px; padding: 0 16px; border-radius: 7px; font-size: 12px; font-weight: 600; color: white; cursor: pointer; border: none; }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

.ai-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.ai-card { background: white; border-radius: 10px; border: 1px solid var(--border); padding: 16px; box-shadow: var(--shadow-1); }
.ai-label { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.ai-desc { font-size: 11px; color: var(--text-secondary); margin: 4px 0 12px; line-height: 1.4; }
.ai-input-row { display: flex; gap: 8px; align-items: center; }
.ai-input { flex: 1; height: 34px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg-grouped); font-size: 13px; color: var(--text-primary); }
.ai-input:focus { border-color: #AF52DE; box-shadow: 0 0 0 3px rgba(175,82,222,0.1); outline: none; }
.btn-save-sm { height: 34px; padding: 0 14px; border-radius: 8px; font-size: 12px; font-weight: 600; background: #AF52DE; color: white; cursor: pointer; flex-shrink: 0; border: none; }
.btn-save-sm:disabled { opacity: 0.4; cursor: not-allowed; }

.notice-box { background: rgba(175,82,222,0.05); border: 1px solid rgba(175,82,222,0.15); border-radius: 10px; padding: 16px 20px; }
.notice-title { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
.notice-body p { font-size: 12px; color: var(--text-secondary); margin: 6px 0; line-height: 1.6; }
</style>
