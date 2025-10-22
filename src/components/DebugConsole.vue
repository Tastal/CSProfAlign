<template>
  <Teleport to="body">
    <div v-if="visible" class="debug-overlay" @mousedown="handleOverlayClick">
      <div 
        class="debug-console"
        :style="windowStyle"
        @mousedown.stop="() => {}"
      >
        <!-- Header -->
        <div class="debug-header" @mousedown="startDrag">
          <div class="header-left">
            <span class="console-title">
              <span class="icon">📊</span>
              Debug Console
            </span>
          </div>
          <div class="header-right">
            <el-button-group size="small">
              <el-button @click="clearLogs" title="Clear logs">Clear</el-button>
              <el-button @click="exportLogs" title="Export logs">Export</el-button>
              <el-button @click="close" title="Close">×</el-button>
            </el-button-group>
          </div>
        </div>

        <!-- Content -->
        <div class="debug-content">
          <!-- Filter Bar -->
          <div class="filter-bar">
            <div class="filter-group">
              <span class="filter-label">Filters:</span>
              <el-button-group size="small">
                <el-button 
                  :type="categoryFilter === '' ? 'primary' : ''" 
                  @click="categoryFilter = ''"
                  size="small"
                >All</el-button>
                <el-button 
                  :type="categoryFilter === 'data' ? 'primary' : ''" 
                  @click="categoryFilter = 'data'"
                  size="small"
                >Data</el-button>
                <el-button 
                  :type="categoryFilter === 'dblp' ? 'primary' : ''" 
                  @click="categoryFilter = 'dblp'"
                  size="small"
                >DBLP</el-button>
                <el-button 
                  :type="categoryFilter === 'llm' ? 'primary' : ''" 
                  @click="categoryFilter = 'llm'"
                  size="small"
                >LLM</el-button>
                <el-button 
                  :type="categoryFilter === 'error' ? 'danger' : ''" 
                  @click="categoryFilter = 'error'"
                  size="small"
                >Errors</el-button>
              </el-button-group>
            </div>
            <div class="filter-group">
              <span class="filter-label">Search:</span>
              <el-input 
                v-model="searchQuery" 
                placeholder="Search logs..." 
                size="small"
                style="width: 180px;"
                clearable
              />
              <el-checkbox v-model="autoScroll" label="Auto-scroll" size="small" />
            </div>
          </div>

          <!-- Cards Layout -->
          <div class="cards-container">
            <!-- Row 1: Progress + DBLP + Results -->
            <div class="cards-row">
              <!-- Progress Card -->
              <div class="debug-card progress-card">
                <div class="card-header">📊 Progress</div>
                <div class="card-content">
                  <div class="stat-item">
                    <span class="stat-label">Overall:</span>
                    <div class="progress-bar-container">
                      <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
                      <span class="progress-text">{{ progressPercent }}%</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Count:</span>
                    <span class="stat-value">{{ stats.progress.processed }}/{{ stats.progress.total }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Speed:</span>
                    <span class="stat-value">{{ stats.progress.speed.toFixed(2) }} profs/sec</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">ETA:</span>
                    <span class="stat-value">{{ formatETA(stats.eta) }}</span>
                  </div>
                </div>
              </div>

              <!-- DBLP Card -->
              <div class="debug-card dblp-card">
                <div class="card-header">🔗 DBLP API</div>
                <div class="card-content">
                  <div class="stat-item">
                    <span class="stat-label">Success:</span>
                    <span class="stat-value success">{{ stats.dblp.success }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Cached:</span>
                    <span class="stat-value">{{ stats.dblp.cached }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Failed:</span>
                    <span class="stat-value error">{{ stats.dblp.failed }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Rate:</span>
                    <div class="mini-bar">
                      <div class="mini-bar-fill" :style="{ width: dblpRate + '%', backgroundColor: dblpRate > 80 ? '#81c784' : dblpRate > 50 ? '#ffb74d' : '#e57373' }"></div>
                    </div>
                    <span class="mini-rate">{{ dblpRate }}%</span>
                  </div>
                </div>
              </div>

              <!-- Results Card -->
              <div class="debug-card results-card">
                <div class="card-header">🎯 Results</div>
                <div class="card-content">
                  <div class="stat-item">
                    <span class="stat-label">Matched:</span>
                    <span class="stat-value success">{{ stats.progress.matched }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Errors:</span>
                    <span class="stat-value error">{{ stats.errors.count }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Elapsed:</span>
                    <span class="stat-value">{{ stats.elapsed }}s</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Total Logs:</span>
                    <span class="stat-value">{{ logs.length }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 2: Recent Events (Full Width) -->
            <div class="debug-card logs-card full-width">
              <div class="card-header">
                📋 Recent Events 
                <span class="log-count">({{ filteredLogs.length }} / {{ logs.length }})</span>
              </div>
              <div class="card-content logs-content" ref="logsContainer">
                <div 
                  v-for="log in displayedLogs" 
                  :key="log.id"
                  :class="['log-entry', `log-${log.level}`, `log-${log.category}`]"
                >
                  <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                  <span class="log-level">{{ getLogIcon(log.level) }}</span>
                  <span class="log-category">[{{ log.category.toUpperCase() }}]</span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
                <div v-if="filteredLogs.length === 0" class="no-logs">No logs to display</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resize Handle -->
        <div class="resize-handle" @mousedown.stop="startResize"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { logService } from '@/services/logService'

const visible = ref(false)
const categoryFilter = ref('')
const searchQuery = ref('')
const autoScroll = ref(true)
const logs = ref([])
const stats = ref({
  data: { count: 0 },
  filter: { count: 0 },
  llm: { count: 0 },
  dblp: { success: 0, failed: 0, cached: 0, total: 0 },
  progress: { processed: 0, total: 0, matched: 0, speed: 0 },
  errors: { count: 0, types: {} },
  elapsed: 0,
  eta: 0
})

// Window positioning and sizing
const windowX = ref(window.innerWidth * 0.15)
const windowY = ref(window.innerHeight * 0.1)
const windowWidth = ref(Math.min(window.innerWidth * 0.7, 1000))
const windowHeight = ref(Math.min(window.innerHeight * 0.7, 700))
const isDragging = ref(false)
const isResizing = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const resizeStartX = ref(0)
const resizeStartY = ref(0)
const resizeStartWidth = ref(0)
const resizeStartHeight = ref(0)
const logsContainer = ref(null)
let unsubscribe = null

// Computed properties
const windowStyle = computed(() => ({
  left: windowX.value + 'px',
  top: windowY.value + 'px',
  width: windowWidth.value + 'px',
  height: windowHeight.value + 'px'
}))

const filteredLogs = computed(() => {
  let filtered = logs.value

  if (categoryFilter.value) {
    if (categoryFilter.value === 'error') {
      filtered = filtered.filter(log => log.level === 'error')
    } else {
      filtered = filtered.filter(log => log.category === categoryFilter.value)
    }
  }

  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    filtered = filtered.filter(log => 
      log.message.toLowerCase().includes(search)
    )
  }

  return filtered
})

const displayedLogs = computed(() => {
  return filteredLogs.value.slice(-30).reverse()
})

const progressPercent = computed(() => {
  if (stats.value.progress.total === 0) return 0
  return Math.round((stats.value.progress.processed / stats.value.progress.total) * 100)
})

const dblpRate = computed(() => {
  const total = stats.value.dblp.success + stats.value.dblp.failed
  if (total === 0) return 0
  return Math.round((stats.value.dblp.success / total) * 100)
})

// Methods
function show() {
  visible.value = true
  logService.interceptConsole()
  // Force update logs when showing
  updateLogs()
}

function close() {
  visible.value = false
}

function formatTime(date) {
  if (!date) return ''
  return logService.formatTime(date)
}

function getLogIcon(level) {
  return logService.getLogIcon(level)
}

function formatETA(seconds) {
  if (seconds === 0 || !seconds) return '--'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

function clearLogs() {
  logService.clear()
  logs.value = []
}

function exportLogs() {
  const text = logService.exportAsText()
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-log-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function startDrag(e) {
  isDragging.value = true
  dragStartX.value = e.clientX - windowX.value
  dragStartY.value = e.clientY - windowY.value
}

function startResize(e) {
  isResizing.value = true
  resizeStartX.value = e.clientX
  resizeStartY.value = e.clientY
  resizeStartWidth.value = windowWidth.value
  resizeStartHeight.value = windowHeight.value
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) {
    close()
  }
}

function handleMouseMove(e) {
  if (isDragging.value) {
    windowX.value = e.clientX - dragStartX.value
    windowY.value = e.clientY - dragStartY.value
  }
  if (isResizing.value) {
    const deltaX = e.clientX - resizeStartX.value
    const deltaY = e.clientY - resizeStartY.value
    windowWidth.value = Math.max(600, resizeStartWidth.value + deltaX)
    windowHeight.value = Math.max(400, resizeStartHeight.value + deltaY)
  }
}

function handleMouseUp() {
  isDragging.value = false
  isResizing.value = false
}

function updateLogs() {
  // Create new array reference to trigger Vue reactivity
  logs.value = [...logService.getLogs()]
  stats.value = { ...logService.getStats() }
}

function scrollToBottom() {
  if (autoScroll.value && logsContainer.value) {
    nextTick(() => {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    })
  }
}

// Watch for log updates
watch(() => logs.value.length, () => {
  scrollToBottom()
})

// Watch for visibility changes
watch(visible, (newValue) => {
  if (newValue) {
    // Refresh logs when console becomes visible
    updateLogs()
    nextTick(() => {
      scrollToBottom()
    })
  }
})

// Lifecycle
onMounted(() => {
  updateLogs()
  
  // Subscribe to log updates
  unsubscribe = logService.subscribe((logEntry) => {
    updateLogs()
  })

  // Add global event listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  // Save window state to localStorage
  const savedState = localStorage.getItem('csprofhunt-debug-console-state')
  if (savedState) {
    const state = JSON.parse(savedState)
    windowX.value = state.x
    windowY.value = state.y
    windowWidth.value = state.width
    windowHeight.value = state.height
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  // Save window state
  const state = {
    x: windowX.value,
    y: windowY.value,
    width: windowWidth.value,
    height: windowHeight.value
  }
  localStorage.setItem('csprofhunt-debug-console-state', JSON.stringify(state))
})

// Expose for external control
defineExpose({ show, close, visible })
</script>

<style scoped>
/* Overlay */
.debug-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Console Window */
.debug-console {
  position: fixed;
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  z-index: 10000;
}

/* Header */
.debug-header {
  background: linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%);
  padding: 12px 16px;
  border-bottom: 1px solid #3a3a3a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
}

.console-title {
  color: #e0e0e0;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.console-title .icon {
  font-size: 16px;
}

.header-right {
  display: flex;
  gap: 6px;
}

/* Content */
.debug-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: #1e1e1e;
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 12px;
}

/* Filter Bar */
.filter-bar {
  background: #252525;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #3a3a3a;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-label {
  color: #999999;
  font-size: 12px;
  font-weight: 600;
}

/* Cards Container */
.cards-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow-y: auto;
}

.cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* Card Styles */
.debug-card {
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 140px;
}

.debug-card.full-width {
  grid-column: 1 / -1;
  flex: 1;
  min-height: 280px;
}

.debug-card.logs-card {
  grid-column: 1 / -1;
}

.card-header {
  background: #252525;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 12px;
  color: #b0b0b0;
  border-bottom: 1px solid #3a3a3a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.log-count {
  color: #757575;
  font-size: 11px;
  margin-left: auto;
  font-weight: normal;
}

.card-content {
  padding: 10px 12px;
  font-size: 12px;
  color: #e0e0e0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Stat Items */
.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #333333;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #999999;
  font-size: 11px;
}

.stat-value {
  color: #e0e0e0;
  font-weight: 600;
  font-size: 12px;
}

.stat-value.success {
  color: #81c784;
}

.stat-value.error {
  color: #e57373;
}

/* Progress Bar */
.progress-bar-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #333333;
  border-radius: 3px;
  padding: 2px 4px;
  position: relative;
  height: 18px;
  min-width: 80px;
}

.progress-bar-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #4fc3f7, #0288d1);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  position: relative;
  z-index: 1;
  font-size: 10px;
  color: #e0e0e0;
  font-weight: 700;
  text-align: center;
  width: 100%;
}

/* Mini Bar */
.mini-bar {
  flex: 1;
  height: 16px;
  background: #333333;
  border-radius: 2px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 2px;
}

.mini-bar-fill {
  height: 100%;
  border-radius: 1px;
  transition: width 0.3s ease;
}

.mini-rate {
  font-size: 10px;
  color: #999999;
  min-width: 30px;
  text-align: right;
}

/* Logs Container */
.logs-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.4;
  background: #1a1a1a;
  border-radius: 4px;
  padding: 4px;
}

.log-entry {
  padding: 3px 6px;
  border-left: 3px solid transparent;
  display: grid;
  grid-template-columns: 65px 16px 70px 1fr;
  gap: 6px;
  align-items: baseline;
  border-bottom: 1px solid #2a2a2a;
  margin-bottom: 2px;
}

.log-entry:hover {
  background: #252525;
}

.log-entry.log-error {
  background: rgba(229, 115, 115, 0.08);
  border-left-color: #e57373;
}

.log-entry.log-warning {
  border-left-color: #ffb74d;
}

.log-entry.log-success {
  border-left-color: #81c784;
}

.log-entry.log-info {
  border-left-color: #4fc3f7;
}

.log-time {
  color: #757575;
  font-size: 10px;
  font-weight: 600;
}

.log-level {
  font-size: 11px;
  flex-shrink: 0;
}

.log-category {
  color: #9e9e9e;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.log-message {
  color: #e0e0e0;
  word-break: break-all;
  white-space: pre-wrap;
}

.no-logs {
  color: #757575;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #3a3a3a 50%);
}

.resize-handle:hover {
  background: linear-gradient(135deg, transparent 50%, #4fc3f7 50%);
}

/* Scrollbar Styling */
.logs-content::-webkit-scrollbar {
  width: 6px;
}

.logs-content::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.logs-content::-webkit-scrollbar-thumb {
  background: #3a3a3a;
  border-radius: 3px;
}

.logs-content::-webkit-scrollbar-thumb:hover {
  background: #4a4a4a;
}

/* Responsive */
@media (max-width: 1200px) {
  .cards-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .debug-card.progress-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .cards-row {
    grid-template-columns: 1fr;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
