<!-- ## PDF 阅读器：多材料 Tab + 阅读进度追踪，全部已读后解锁开始练习 -->
<script setup lang="ts">
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ref, onMounted, onBeforeUnmount, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { filesApi, tasksApi } from '@/api'
import type { FileItem } from '@/api/types'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const taskId = route.params.id as string
const initialFileId = (route.query.file_id as string) || ''

const windowWidth = ref(window.innerWidth)
const isPC = computed(() => windowWidth.value >= 768)
function onResize() { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const loading = ref(true)
const materials = ref<FileItem[]>([])
const activeIdx = ref(0)
const readSet = ref<Set<string>>(new Set())

// per-material state
const numPages = ref(0)
const currentPage = ref(1)
const canvasRef = ref<HTMLCanvasElement | null>(null)
let pdfDoc: any = null
let renderTask: any = null

const allRead = computed(() => materials.value.length > 0 && materials.value.every(m => readSet.value.has(m.id)))
const activeFile = computed(() => materials.value[activeIdx.value] || null)

const readJustNow = ref<string | null>(null)
const pulseUnlock = ref(false)

watch(allRead, (val) => {
  if (val) {
    pulseUnlock.value = true
    setTimeout(() => { pulseUnlock.value = false }, 1200)
  }
})

onMounted(async () => {
  try {
    const taskRes = await tasksApi.get(taskId)
    const ids: string[] = taskRes.material_ids || []
    if (ids.length > 0) {
      const results = await Promise.all(ids.map((fid: string) => filesApi.get(fid).catch(() => null)))
      materials.value = results.filter(Boolean) as FileItem[]
    }
    // If a specific file was requested, open that tab first
    if (initialFileId) {
      const idx = materials.value.findIndex(m => m.id === initialFileId)
      if (idx >= 0) activeIdx.value = idx
    }
  } catch {}
  loading.value = false
  if (materials.value.length > 0) await loadPdf(activeFile.value!)
})

watch(activeIdx, async () => {
  if (activeFile.value) await loadPdf(activeFile.value)
})

async function loadPdf(file: FileItem) {
  numPages.value = 0
  currentPage.value = 1
  if (pdfDoc) { pdfDoc.destroy(); pdfDoc = null }
  const url = filesApi.downloadUrl(file.id)
  try {
    // @ts-ignore
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
    pdfDoc = await pdfjsLib.getDocument(url).promise
    numPages.value = pdfDoc.numPages
    await renderPage(1)
  } catch {}
}

async function renderPage(pageNum: number) {
  if (!pdfDoc || !canvasRef.value) return
  if (renderTask) await renderTask
  currentPage.value = pageNum
  const page = await pdfDoc.getPage(pageNum)
  const rawVp = page.getViewport({ scale: 1 })
  const container = canvasRef.value.parentElement
  // 用 window.innerWidth 做保底，避免布局未完成时 clientWidth 为 0
  const availW = container?.clientWidth || window.innerWidth
  const displayW = Math.max(availW - 32, 100)
  const displayH = Math.round(displayW * rawVp.height / rawVp.width)
  // 按设备像素比渲染，解决高 DPI 屏幕模糊/变形问题
  const dpr = window.devicePixelRatio || 1
  const scale = isPC.value
    ? Math.min(1.6, displayW / rawVp.width * 1.2)
    : (displayW / rawVp.width) * dpr
  const vp = page.getViewport({ scale })
  const canvas = canvasRef.value
  canvas.width = vp.width
  canvas.height = vp.height
  // 固定显示尺寸，防止 CSS 拉伸
  canvas.style.width = (isPC.value ? vp.width / dpr : displayW) + 'px'
  canvas.style.height = (isPC.value ? vp.height / dpr : displayH) + 'px'
  const ctx = canvas.getContext('2d')!
  renderTask = page.render({ canvasContext: ctx, viewport: vp })
  await renderTask

  if (activeFile.value) {
    try { await tasksApi.reportReadingPage(taskId, activeFile.value.id, pageNum, numPages.value) } catch {}
    if (pageNum === numPages.value) {
      readSet.value = new Set([...readSet.value, activeFile.value.id])
      readJustNow.value = activeFile.value.id
      setTimeout(() => { readJustNow.value = null }, 600)
    }
  }
}

async function prevPage() {
  if (currentPage.value > 1) await renderPage(currentPage.value - 1)
}
async function nextPage() {
  if (currentPage.value < numPages.value) await renderPage(currentPage.value + 1)
}

function goBack() { window.history.back() }

function startPractice() {
  router.push(`/tasks/${taskId}/qa`)
}

onBeforeUnmount(() => {
  if (pdfDoc) pdfDoc.destroy()
})
</script>

<template>
  <div class="pdf-reader" :class="{ 'pdf-reader-pc': isPC }">
    <!-- Header -->
    <div class="pdf-header">
      <button class="back-btn" @click="goBack"><AppIcon name="chevron-left" :size="18" /></button>
      <span class="pdf-title">学习材料</span>
      <span class="page-indicator" v-if="numPages">{{ currentPage }} / {{ numPages }}</span>
      <div v-else style="width:48px" />
    </div>

    <!-- Material Tabs (mobile: horizontal scroll; PC: sidebar) -->
    <div v-if="!isPC && materials.length > 1" class="tab-bar">
      <button
        v-for="(m, i) in materials" :key="m.id"
        class="tab-pill"
        :class="{ active: activeIdx === i, read: readSet.has(m.id) }"
        @click="activeIdx = i"
      >
        <span class="tab-check" v-if="readSet.has(m.id)" :class="{ 'bounce-in': readJustNow === m.id }">✓</span>
        <span class="tab-label">{{ m.original_name || `材料${i + 1}` }}</span>
      </button>
    </div>

    <div class="pdf-body" :class="{ 'pdf-body-pc': isPC }">
      <!-- PC Sidebar -->
      <aside v-if="isPC && materials.length > 0" class="pdf-sidebar">
        <div class="sidebar-title">材料目录</div>
        <div
          v-for="(m, i) in materials" :key="m.id"
          class="sidebar-item"
          :class="{ active: activeIdx === i, read: readSet.has(m.id) }"
          @click="activeIdx = i"
        >
          <span class="sidebar-check" :class="{ visible: readSet.has(m.id), 'bounce-in': readJustNow === m.id }">✓</span>
          <span class="sidebar-label">{{ m.original_name || `材料 ${i + 1}` }}</span>
        </div>

        <div class="sidebar-footer">
          <button
            class="start-btn"
            :class="{ unlocked: allRead, 'btn-pulse': pulseUnlock }"
            :disabled="!allRead"
            @click="startPractice"
          >
            <AppIcon :name="allRead ? 'play' : 'lock'" :size="14" />
            {{ allRead ? '开始练习' : '阅读全部材料后解锁' }}
          </button>
        </div>
      </aside>

      <!-- PDF Canvas Area -->
      <div class="pdf-main">
        <div v-if="loading" class="empty-state pdf-empty">
          <div class="spinner pdf-spinner" />
        </div>
        <div v-else-if="!activeFile" class="empty-state pdf-empty">
          <div class="msg" style="color:rgba(255,255,255,0.5)">没有材料</div>
        </div>
        <div v-else class="pdf-content">
          <canvas ref="canvasRef" class="pdf-canvas" />
        </div>
      </div>
    </div>

    <!-- Controls (bottom) -->
    <div v-if="!loading && activeFile && numPages > 1" class="pdf-controls" :class="{ 'pdf-controls-pc': isPC }">
      <button :disabled="currentPage <= 1" @click="prevPage">上一页</button>
      <span class="page-info">{{ currentPage }} / {{ numPages }}</span>
      <button :disabled="currentPage >= numPages" @click="nextPage">下一页</button>
    </div>

    <!-- Mobile start-practice bar -->
    <div v-if="!isPC" class="mobile-start-bar">
      <button
        class="start-btn"
        :class="{ unlocked: allRead, 'btn-pulse': pulseUnlock }"
        :disabled="!allRead"
        @click="startPractice"
      >
        <AppIcon :name="allRead ? 'play' : 'lock'" :size="14" />
        {{ allRead ? '开始练习' : `已读 ${readSet.size} / ${materials.length} 个材料` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pdf-reader {
  background: #1C1C1E;
  min-height: 100vh;
  display: flex; flex-direction: column;
}
.pdf-reader-pc {
  min-height: unset; height: 100vh;
  overflow: hidden;
}

/* Header */
.pdf-header {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
  background: rgba(28,28,30,0.96);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  flex-shrink: 0;
}
.pdf-header .back-btn { background: rgba(255,255,255,0.1); color: white; flex-shrink: 0; }
.pdf-title { flex: 1; font-size: 15px; font-weight: 600; color: white; }
.page-indicator { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); }

/* Mobile Tab Bar */
.tab-bar {
  display: flex; overflow-x: auto; gap: 8px;
  padding: 10px 16px;
  background: rgba(28,28,30,0.9);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  scrollbar-width: none;
}
.tab-bar::-webkit-scrollbar { display: none; }
.tab-pill {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 4px;
  padding: 6px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 500;
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.5);
  transition: all 150ms;
}
.tab-pill.active { background: rgba(0,122,255,0.25); color: #007AFF; }
.tab-pill.read { color: #34C759; }
.tab-pill.read.active { background: rgba(52,199,89,0.2); }
.tab-check {
  font-size: 11px; font-weight: 700;
  animation: ios-bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.tab-label { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Body layout */
.pdf-body { flex: 1; display: flex; overflow: hidden; }
.pdf-body-pc { flex-direction: row; }

/* PC Sidebar */
.pdf-sidebar {
  width: 180px; flex-shrink: 0;
  background: rgba(255,255,255,0.04);
  border-right: 1px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.sidebar-title {
  padding: 14px 14px 8px;
  font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.5px; text-transform: uppercase;
}
.sidebar-item {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 14px; cursor: pointer;
  font-size: 13px; color: rgba(255,255,255,0.5);
  transition: all 150ms;
  border-left: 3px solid transparent;
}
.sidebar-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
.sidebar-item.active { background: rgba(0,122,255,0.15); color: #007AFF; border-left-color: #007AFF; }
.sidebar-item.read { color: #34C759; }
.sidebar-item.read.active { background: rgba(52,199,89,0.12); border-left-color: #34C759; }
.sidebar-check {
  font-size: 11px; font-weight: 700; flex-shrink: 0;
  opacity: 0; transition: opacity 200ms;
}
.sidebar-check.visible {
  opacity: 1;
  animation: ios-bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.sidebar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sidebar-footer {
  margin-top: auto;
  padding: 14px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

/* PDF main content */
.pdf-main {
  flex: 1; overflow: auto;
  display: flex; flex-direction: column;
}
.pdf-content {
  flex: 1; display: flex; justify-content: center;
  padding: 16px;
}
.pdf-canvas {
  display: block;
  max-width: 100%; /* 防止溢出，实际尺寸由 JS 控制 */
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  border-radius: 4px;
}

/* Controls */
.pdf-controls {
  position: sticky; bottom: 0;
  display: flex; align-items: center; justify-content: center; gap: 20px;
  padding: 12px 20px;
  background: rgba(28,28,30,0.96);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}
.pdf-controls-pc { position: static; border-top: 1px solid rgba(255,255,255,0.08); }
.pdf-controls button {
  padding: 8px 20px; border-radius: 8px;
  background: rgba(0,122,255,0.2);
  color: #007AFF; font-size: 14px; font-weight: 600;
}
.pdf-controls button:disabled { opacity: 0.3; }
.page-info { font-size: 14px; color: rgba(255,255,255,0.6); font-weight: 500; }

/* Start Practice Button */
.start-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 600;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.35);
  transition: all 300ms;
}
.start-btn.unlocked {
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: white;
  box-shadow: 0 4px 16px rgba(0,122,255,0.4);
  animation: pulse-glow 2s ease infinite;
}
.start-btn:disabled { cursor: not-allowed; }

/* Mobile start bar */
.mobile-start-bar {
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: rgba(28,28,30,0.96);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.mobile-start-bar .start-btn { font-size: 14px; padding: 12px 20px; }

.pdf-empty { color: rgba(255,255,255,0.4); }
.pdf-spinner { border-color: rgba(255,255,255,0.2); border-top-color: white; }

/* Bounce animation for newly-read checkmarks */
.bounce-in {
  animation: ios-bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
}

/* Pulse glow for unlock button */
.btn-pulse {
  animation: pulse-glow 0.6s ease 2 !important;
}
</style>
