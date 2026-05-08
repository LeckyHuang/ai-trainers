<!-- ## 题库管理：题库列表，点击进入题目详情页 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { banksApi } from '@/api'
import type { QuestionBank } from '@/api/types'
import Modal from '@/components/Modal.vue'
import AdminIcon from '@/components/AdminIcon.vue'
import { showToast } from '@/composables/toast'

const router = useRouter()
const banks = ref<QuestionBank[]>([])
const total = ref(0)
const loading = ref(false)
const showModal = ref(false)
const editTarget = ref<QuestionBank | null>(null)
const form = ref({ name: '', description: '' })
const saving = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await banksApi.list({ page: 1, page_size: 50 })
    banks.value = res.items || []
    total.value = res.total || 0
  } catch { showToast('加载失败', 'error') }
  loading.value = false
}

onMounted(load)

async function create() {
  if (!form.value.name) { showToast('请输入题库名称', 'error'); return }
  saving.value = true
  try {
    if (editTarget.value) {
      await banksApi.update(editTarget.value.id, { name: form.value.name, description: form.value.description })
      showToast('更新成功', 'success')
    } else {
      await banksApi.create({ name: form.value.name, description: form.value.description })
      showToast('创建成功', 'success')
    }
    showModal.value = false
    editTarget.value = null
    load()
  } catch (e: any) { showToast(e?.message || '操作失败', 'error') }
  saving.value = false
}

function openCreate() {
  editTarget.value = null
  form.value = { name: '', description: '' }
  showModal.value = true
}

function openEdit(b: QuestionBank) {
  editTarget.value = b
  form.value = { name: b.name, description: b.description || '' }
  showModal.value = true
}

function categoryLabel(b: QuestionBank) {
  return (b as any).category || '通用'
}

async function deleteBank(b: QuestionBank) {
  if (!confirm(`确认删除题库「${b.name}」？题库中的所有题目也将被删除。`)) return
  try {
    await banksApi.delete(b.id)
    showToast('已删除', 'success')
    load()
  } catch { showToast('删除失败', 'error') }
}
</script>

<template>
  <div class="page-wrap">
    <div class="page-header">
      <div>
        <h2>题库管理</h2>
        <span class="page-sub">共 {{ total }} 个题库</span>
      </div>
      <button class="btn-primary" @click="openCreate">+ 新建题库</button>
    </div>

    <div v-if="loading" class="loading-state">加载中...</div>

    <div v-else-if="banks.length === 0" class="empty-state">
      <div class="empty-icon"><AdminIcon name="empty-question" /></div>
      <div class="empty-title">还没有题库</div>
      <div class="empty-sub">点击「新建题库」开始创建</div>
      <button class="btn-primary" @click="openCreate">+ 新建题库</button>
    </div>

    <div v-else class="bank-grid">
      <div
        v-for="b in banks"
        :key="b.id"
        class="bank-card"
      >
        <!-- Icon + category pill row -->
        <div class="bank-card-top">
          <div class="bank-icon-box">
            <AdminIcon name="question-bank" />
          </div>
          <span class="bank-category-pill">{{ categoryLabel(b) }}</span>
        </div>

        <!-- Name -->
        <div class="bank-name">{{ b.name }}</div>

        <!-- Description (2 lines, truncated) -->
        <div class="bank-desc">{{ b.description || '暂无描述' }}</div>

        <!-- Count + action links -->
        <div class="bank-footer">
          <div class="bank-count-row">
            <span class="bank-count">{{ (b as any).question_count ?? 0 }}</span>
            <span class="bank-count-label">题</span>
          </div>
          <div class="bank-actions">
            <button class="link-btn" @click="router.push(`/question-banks/${b.id}`)">查看详情</button>
            <span class="divider">|</span>
            <button class="link-btn" @click.stop="openEdit(b)">编辑</button>
            <button class="icon-del-btn" @click.stop="deleteBank(b)" title="删除">
              <AdminIcon name="trash" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <Modal v-if="showModal" :title="editTarget ? '编辑题库' : '新建题库'" @close="showModal = false">
      <div class="form-grid">
        <div class="field">
          <label>题库名称 <span class="required">*</span></label>
          <input v-model="form.name" placeholder="例如：产品知识季度考核" />
        </div>
        <div class="field">
          <label>描述</label>
          <textarea v-model="form.description" placeholder="可选" rows="3" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="showModal = false">取消</button>
        <button class="btn-primary" :disabled="saving" @click="create">{{ saving ? '确认中...' : (editTarget ? '确认修改' : '确认创建') }}</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.page-wrap { padding: 28px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; height: 100%; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
.page-sub { font-size: 12px; color: var(--text-tertiary); display: block; margin-top: 2px; }

.loading-state { text-align: center; color: var(--text-tertiary); padding: 60px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 80px; }
.empty-icon { opacity: 0.4; color: var(--text-tertiary); margin-bottom: 8px; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.empty-sub { font-size: 13px; color: var(--text-tertiary); }

/* 3-column card grid */
.bank-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 1100px) { .bank-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) { .bank-grid { grid-template-columns: 1fr; } }

.bank-card {
  background: white;
  border-radius: 10px;
  border: 1px solid var(--border);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-1);
  transition: all 150ms;
}
.bank-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-2); transform: translateY(-1px); }

/* Icon box + category pill */
.bank-card-top { display: flex; align-items: center; justify-content: space-between; }
.bank-icon-box {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: var(--color-primary);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.bank-category-pill {
  font-size: 11px; font-weight: 600;
  padding: 3px 10px; border-radius: 20px;
  background: rgba(0,102,204,0.08); color: var(--color-primary);
}

/* Name */
.bank-name { font-size: 16px; font-weight: 700; color: var(--text-primary); }

/* Description — 2 lines truncated */
.bank-desc {
  font-size: 13px; color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  flex: 1;
}

/* Footer: count left, actions right */
.bank-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--separator);
}
.bank-count-row { display: flex; align-items: baseline; gap: 3px; }
.bank-count { font-size: 22px; font-weight: 700; color: var(--color-primary); }
.bank-count-label { font-size: 13px; color: var(--text-secondary); }

.bank-actions { display: flex; align-items: center; gap: 4px; }
.link-btn {
  background: none; border: none;
  font-size: 13px; color: var(--color-primary);
  cursor: pointer; padding: 2px 4px;
  font-weight: 500;
}
.link-btn:hover { text-decoration: underline; }
.divider { color: var(--separator); font-size: 12px; user-select: none; }
.icon-del-btn {
  width: 26px; height: 26px;
  border-radius: 6px;
  background: none; border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  margin-left: 4px;
}
.icon-del-btn:hover { color: var(--color-danger); background: rgba(255,59,48,0.07); }

/* Modal form */
.form-grid { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.required { color: var(--color-danger); }
input, textarea { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-strong); background: var(--bg-grouped); font-size: 13px; color: var(--text-primary); }
input { height: 36px; }
textarea { resize: vertical; font-family: inherit; }
input:focus, textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0,102,204,0.1); outline: none; }
.btn-primary { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--color-primary); color: white; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--bg-grouped); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); }
</style>
