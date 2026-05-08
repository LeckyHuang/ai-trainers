<!-- ## 学员端 SVG 图标库（SF Symbols 风格，描边图标） -->
<template>
  <svg v-if="name === 'home'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5z" />
    <path d="M9 21V13h6v8" />
  </svg>

  <svg v-else-if="name === 'bell'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>

  <svg v-else-if="name === 'user'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
  </svg>

  <svg v-else-if="name === 'sparkle'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5Z" />
  </svg>

  <svg v-else-if="name === 'bolt'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
  </svg>

  <svg v-else-if="name === 'check-circle'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9,12 11,14 15,10" />
  </svg>

  <svg v-else-if="name === 'chart-bar'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <line x1="3" y1="20" x2="21" y2="20" />
    <line x1="7" y1="20" x2="7" y2="14" />
    <line x1="12" y1="20" x2="12" y2="6" />
    <line x1="17" y1="20" x2="17" y2="10" />
  </svg>

  <svg v-else-if="name === 'trophy'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 4h10l-1 7a4 4 0 0 1-8 0L7 4z" />
    <path d="M7 4H4v3a3 3 0 0 0 3 3" />
    <path d="M17 4h3v3a3 3 0 0 1-3 3" />
    <line x1="12" y1="15" x2="12" y2="19" />
    <line x1="8" y1="19" x2="16" y2="19" />
  </svg>

  <svg v-else-if="name === 'inbox'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>

  <svg v-else-if="name === 'task-qa'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2.5" />
  </svg>

  <svg v-else-if="name === 'task-roleplay'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>

  <svg v-else-if="name === 'mic'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M19 10a7 7 0 0 1-14 0" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>

  <svg v-else-if="name === 'stop'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>

  <svg v-else-if="name === 'keyboard'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="7" width="20" height="12" rx="2" />
    <line x1="6" y1="11" x2="6.01" y2="11" stroke-width="2.5" />
    <line x1="10" y1="11" x2="10.01" y2="11" stroke-width="2.5" />
    <line x1="14" y1="11" x2="14.01" y2="11" stroke-width="2.5" />
    <line x1="18" y1="11" x2="18.01" y2="11" stroke-width="2.5" />
    <line x1="8" y1="15" x2="16" y2="15" />
  </svg>

  <svg v-else-if="name === 'target'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>

  <svg v-else-if="name === 'close'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>

  <svg v-else-if="name === 'check'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>

  <svg v-else-if="name === 'arrow-right'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="9,18 15,12 9,6" />
  </svg>

  <svg v-else-if="name === 'file'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>

  <svg v-else-if="name === 'lock'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="11" width="14" height="11" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </svg>

  <svg v-else-if="name === 'megaphone'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>

  <svg v-else-if="name === 'bell-off'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8.56 2.9A7 7 0 0 1 19 9v4m-2 4H3s3-2 3-9a6 6 0 0 1 .65-2.74" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>

  <svg v-else-if="name === 'timer'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="13" r="8" />
    <polyline points="12,9 12,13 14,15" />
    <line x1="9" y1="2" x2="15" y2="2" />
    <line x1="12" y1="2" x2="12" y2="5" />
  </svg>

  <svg v-else-if="name === 'clipboard'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="14" y2="15" />
  </svg>

  <svg v-else-if="name === 'volume'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>

  <svg v-else-if="name === 'volume-off'" :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="sw" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{ name: string; size?: number; strokeWidth?: number }>()
const size = props.size ?? 24
const sw = props.strokeWidth ?? 1.8
</script>
