<!-- ## 文件库：上传 PDF/音视频/图片，支持预览下载，管理员增删 -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminIcon from '@/components/AdminIcon.vue'
import { filesApi } from '@/api'
import type { FileItem } from '@/api/types'
import api from '@/api'
import { showToast } from '@/composables/toast'

const files = ref<FileItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const uploading = ref(false)
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

const viewMode = ref<'grid' | 'list'>('grid')
const typeFilter = ref('all')
const searchQuery = ref('')

const filteredFiles = computed(() => {
  return files.value.filter(f => {
    // Type filter - 材料 covers PDF/doc, 音频 covers audio, 视频 covers video
    if (typeFilter.value !== 'all') {
      const mime = f.mime_type || ''
      if (typeFilter.value === 'material' && !mime.includes('pdf') && !mime.includes('doc') && !mime.includes('word') && !mime.includes('msword')) return false
      if (typeFilter.value === 'audio' && !mime.includes('audio')) return false
      if (typeFilter.value === 'video' && !mime.includes('video')) return false
    }
    // Search filter
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!(f.original_name || '').toLowerCase().includes(q)) return false
    }
    return true
  })
})

function fileColor(mime?: string): string {
  if (!mime) return '#8E8E93'
  if (mime.includes('pdf') || mime.includes('doc') || mime.includes('word') || mime.includes('msword')) return '#FF3B30'
  if (mime.includes('video')) return '#FF9500'
  if (mime.includes('audio')) return '#34C759'
  if (mime.includes('image')) return '#0066CC'
  return '#8E8E93'
}

function fileTypeName(mime?: string): string {
  if (!mime) return 'FILE'
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('doc') || mime.includes('word') || mime.includes('msword')) return 'DOC'
  if (mime.includes('video')) return 'VID'
  if (mime.includes('audio')) return 'AUD'
  if (mime.includes('image')) return 'IMG'
  return 'FILE'
}

function fileIcon(mime?: string): string {
  if (!mime) return 'file-doc'
  if (mime.includes('pdf')) return 'file-doc'
  if (mime.includes('video')) return 'file-doc'
  if (mime.includes('audio')) return 'file-doc'
  if (mime.includes('image')) return 'file-doc'
  return 'file-doc'
}

async function load() {
  loading.value = true
  try {
    const res = await filesApi.list({ page: page.value, page_size: pageSize })
    files.value = res.items
    total.value = res.total
  } catch { showToast('加载失败', 'error') }
  loading.value = false
}

onMounted(load)

async function uploadFile(f: globalThis.File) {
  if (!f) return
  uploading.value = true
  try {
    await filesApi.upload(f)
    showToast('上传成功', 'success')
    load()
  } catch (e: any) { showToast(e?.message || '上传失败', 'error') }
  uploading.value = false
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) uploadFile(input.files[0])
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) uploadFile(f)
}

async function deleteFile(f: FileItem) {
  if (!confirm(`确认删除「${f.original_name}」？`)) return
  try {
    await filesApi.delete(f.id)
    showToast('已删除', 'success')
    load()
  } catch { showToast('删除失败', 'error') }
}

function formatSize(bytes?: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

function downloadUrl(id: string) {
  const token = localStorage.getItem('access_token') || ''
  return `${api.defaults.baseURL}/files/${id}/download?token=${encodeURIComponent(token)}`
}

// 判断文件是否支持浏览器预览
function isPreviewable(mime?: string): boolean {
  if (!mime) return false
  return (
    mime.includes('pdf') ||
    mime.includes('text/') ||
    mime.includes('html') ||
    mime.includes('audio/') ||
    mime.includes('video/')
  )
}

// 用 Blob URL 在新标签预览（绕过 Content-Disposition: attachment）
const previewing = ref<string | null>(null)
async function previewFile(f: FileItem) {
  if (previewing.value === f.id) return
  previewing.value = f.id
  try {
    const token = localStorage.getItem('access_token') || ''
    const url = `${api.defaults.baseURL}/files/${f.id}/download?token=${encodeURIComponent(token)}`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error('获取文件失败')
    const blob = await resp.blob()
    // 强制 MIME 正确（部分服务端返回 application/octet-stream）
    const mime = f.mime_type || blob.type || 'application/octet-stream'
    const blobUrl = URL.createObjectURL(new Blob([blob], { type: mime }))
    window.open(blobUrl, '_blank')
    // 延迟释放 URL，给浏览器足够时间加载
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000)
  } catch (e: any) {
    showToast('预览失败，尝试直接下载', 'error')
    window.open(downloadUrl(f.id), '_blank')
  }
  previewing.value = null
}

const totalPages = () => Math.ceil(total.value / pageSize)
</script>

<template>
  <div class="page-wrap">
    <!-- Toolbar row -->
    <div class="toolbar-row">
      <!-- File type tabs -->
      <div class="type-tabs">
        <button :class="['tab-btn', {active: typeFilter==='all'}]" @click="typeFilter='all'">全部</button>
        <button :class="['tab-btn', {active: typeFilter==='material'}]" @click="typeFilter='material'">材料</button>
        <button :class="['tab-btn', {active: typeFilter==='audio'}]" @click="typeFilter='audio'">音频</button>
        <button :class="['tab-btn', {active: typeFilter==='video'}]" @click="typeFilter='video'">视频</button>
      </div>
      <!-- Spacer + search + view toggle + upload -->
      <div class="toolbar-right">
        <input v-model="searchQuery" class="search-input" placeholder="搜索文件名..." />
        <div class="view-toggle">
          <button :class="['vt-btn', {active: viewMode==='grid'}]" @click="viewMode='grid'" title="网格视图">⊞</button>
          <button :class="['vt-btn', {active: viewMode==='list'}]" @click="viewMode='list'" title="列表视图">≡</button>
        </div>
        <input ref="fileInput" type="file" style="display:none" @change="onFileChange" />
        <button class="btn-primary" :disabled="uploading" @click="fileInput?.click()">
          {{ uploading ? '上传中...' : '+ 上传文件' }}
        </button>
      </div>
    </div>

    <!-- File count -->
    <div class="file-count">共 {{ filteredFiles.length }} 个文件</div>

    <!-- GRID VIEW -->
    <div v-if="viewMode === 'grid'" class="file-grid">
      <div v-if="loading" class="grid-loading">加载中...</div>
      <div v-else-if="filteredFiles.length === 0" class="grid-empty">暂无文件</div>
      <template v-else>
        <div v-for="f in filteredFiles" :key="f.id" class="file-card">
          <div class="file-card-icon" :style="{background: fileColor(f.mime_type)+'18', color: fileColor(f.mime_type)}">
            <span class="file-type-badge">{{ fileTypeName(f.mime_type) }}</span>
          </div>
          <div class="file-card-info">
            <div class="file-card-name" :title="f.original_name">{{ f.original_name }}</div>
            <div class="file-card-size">{{ formatSize(f.size_bytes) }}</div>
            <div class="file-card-date">{{ f.created_at?.slice(0,10) }}</div>
          </div>
          <div class="file-card-actions">
            <button
              v-if="isPreviewable(f.mime_type)"
              class="act-btn view-btn"
              :disabled="previewing === f.id"
              @click="previewFile(f)"
            >{{ previewing === f.id ? '加载中...' : '预览' }}</button>
            <a :href="downloadUrl(f.id)" target="_blank" class="act-btn">下载</a>
            <button class="act-btn delete-btn" @click="deleteFile(f)">删除</button>
          </div>
        </div>
      </template>
    </div>

    <!-- LIST VIEW (existing table) -->
    <div v-else class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>文件名</th>
            <th>类型</th>
            <th>大小</th>
            <th>上传时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="empty-row">加载中...</td>
          </tr>
          <tr v-else-if="filteredFiles.length === 0">
            <td colspan="5" class="empty-row">暂无文件，请上传</td>
          </tr>
          <tr v-for="f in filteredFiles" :key="f.id">
            <td>
              <div class="file-cell">
                <span class="file-icon"><AdminIcon :name="fileIcon(f.mime_type)" /></span>
                <span class="file-name">{{ f.original_name }}</span>
              </div>
            </td>
            <td class="text-secondary">{{ f.mime_type || '—' }}</td>
            <td class="text-secondary">{{ formatSize(f.size_bytes) }}</td>
            <td class="text-secondary">{{ f.created_at?.slice(0, 10) }}</td>
            <td>
              <div class="row-actions">
                <button
                  v-if="isPreviewable(f.mime_type)"
                  class="act-btn"
                  :disabled="previewing === f.id"
                  @click="previewFile(f)"
                >{{ previewing === f.id ? '加载中...' : '预览' }}</button>
                <a :href="downloadUrl(f.id)" target="_blank" class="act-btn">下载</a>
                <button class="act-btn danger" @click="deleteFile(f)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination" v-if="total > pageSize">
        <button class="pg-btn" :disabled="page === 1" @click="page--; load()">‹ 上一页</button>
        <span class="pg-info">{{ page }} / {{ totalPages() }}</span>
        <button class="pg-btn" :disabled="page >= totalPages()" @click="page++; load()">下一页 ›</button>
      </div>
    </div>

    <!-- Drag-upload zone -->
    <div
      class="upload-zone"
      :class="{ over: dragOver }"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
      @click="fileInput?.click()"
    >
      <div class="upload-icon"><AdminIcon :name="uploading ? 'clock' : 'upload'" /></div>
      <div class="upload-text">{{ uploading ? '上传中，请稍候...' : '拖拽文件至此处，或点击上传' }}</div>
      <div class="upload-hint">支持 PDF、Word、图片、音视频等格式</div>
    </div>

    <!-- Pagination (grid view) -->
    <div class="pagination" v-if="viewMode === 'grid' && total > pageSize">
      <button class="pg-btn" :disabled="page === 1" @click="page--; load()">‹ 上一页</button>
      <span class="pg-info">{{ page }} / {{ totalPages() }}</span>
      <button class="pg-btn" :disabled="page >= totalPages()" @click="page++; load()">下一页 ›</button>
    </div>
  </div>
</template>

<style scoped>
.page-wrap { padding: 28px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; height: 100%; }

/* Toolbar */
.toolbar-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.type-tabs { display: flex; gap: 4px; }
.tab-btn { height: 32px; padding: 0 14px; border-radius: var(--radius-full, 9999px); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: white; color: var(--text-secondary); transition: all 150ms; }
.tab-btn.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.tab-btn:not(.active):hover { background: var(--bg-grouped); color: var(--text-primary); }

.toolbar-right { display: flex; align-items: center; gap: 8px; }
.search-input { height: 32px; padding: 0 12px; border-radius: var(--radius-s, 10px); border: 1px solid var(--border); background: white; font-size: 13px; color: var(--text-primary); width: 180px; outline: none; }
.search-input:focus { border-color: var(--color-primary); }

.view-toggle { display: flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.vt-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; background: white; color: var(--text-secondary); border: none; transition: all 120ms; }
.vt-btn.active { background: var(--color-primary); color: white; }

/* File count */
.file-count { font-size: 12px; color: var(--text-tertiary); }

/* Grid view */
.file-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media (max-width: 1200px) { .file-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { .file-grid { grid-template-columns: repeat(2, 1fr); } }

.file-card {
  background: white;
  border-radius: 10px;
  border: 1px solid var(--border);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-1);
  transition: box-shadow 200ms;
  position: relative;
  overflow: hidden;
}
.file-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.10); }
.file-card:hover .file-card-actions { opacity: 1; }

.file-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.file-type-badge { font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }

.file-card-info { flex: 1; min-width: 0; }
.file-card-name { font-size: 13px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; }
.file-card-size { font-size: 11px; color: var(--text-tertiary); }
.file-card-date { font-size: 11px; color: var(--text-tertiary); }

.file-card-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 150ms;
}

.view-btn { flex: 1; justify-content: center; }
.delete-btn { justify-content: center; }

.grid-loading, .grid-empty { grid-column: 1 / -1; text-align: center; color: var(--text-tertiary); padding: 40px; }

/* Upload zone */
.upload-zone {
  border: 2px dashed var(--border-strong); border-radius: 12px;
  padding: 32px; text-align: center; cursor: pointer;
  transition: all 200ms; background: var(--bg-grouped);
}
.upload-zone:hover, .upload-zone.over { border-color: var(--color-primary); background: rgba(0,102,204,0.04); }
.upload-icon { color: var(--text-tertiary); margin-bottom: 8px; display: flex; justify-content: center; }
.upload-text { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.upload-hint { font-size: 12px; color: var(--text-tertiary); margin-top: 4px; }

/* List view table */
.table-card { background: white; border-radius: 12px; box-shadow: var(--shadow-1); border: 1px solid var(--border); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--separator); }
.data-table td { padding: 11px 16px; font-size: 13px; border-bottom: 1px solid var(--separator); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--bg-grouped); }
.empty-row { text-align: center; color: var(--text-tertiary); padding: 40px !important; }
.text-secondary { color: var(--text-secondary); }
.file-cell { display: flex; align-items: center; gap: 8px; }
.file-icon { display: flex; align-items: center; color: var(--text-tertiary); flex-shrink: 0; }
.file-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px; }
.row-actions { display: flex; gap: 6px; }

/* Shared action buttons */
.act-btn { padding: 4px 10px; border-radius: 6px; font-size: 12px; background: var(--bg-grouped); color: var(--text-primary); cursor: pointer; border: 1px solid var(--border); text-decoration: none; display: inline-flex; align-items: center; transition: all 120ms; }
.act-btn:hover { background: var(--bg-selected); color: var(--color-primary); border-color: var(--color-primary); }
.act-btn.danger:hover { background: rgba(255,59,48,0.08); color: var(--color-danger); border-color: var(--color-danger); }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px; border-top: 1px solid var(--separator); }
.pg-btn { padding: 5px 14px; border-radius: 7px; font-size: 13px; background: var(--bg-grouped); color: var(--text-primary); cursor: pointer; border: 1px solid var(--border); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: 12px; color: var(--text-secondary); }

.btn-primary { height: 34px; padding: 0 16px; border-radius: 8px; background: var(--color-primary); color: white; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
