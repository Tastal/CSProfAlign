<template>
  <div v-if="store.isProcessing" class="progress-container">
    <el-card shadow="hover">
      <div class="progress-content">
        <div class="progress-header">
          <h3>🤖 Processing Professors with AI...</h3>
        </div>

        <div class="progress-wrapper">
          <el-progress
            :percentage="store.processingProgress"
            :status="store.processingProgress === 100 ? 'success' : undefined"
            :stroke-width="32"
            :show-text="false"
            striped
            striped-flow
          />
          <div class="progress-overlay">
            <span class="progress-count">{{ store.processedCount }} / {{ store.totalCount }}</span>
            <span class="progress-percent">{{ store.processingProgress }}%</span>
          </div>
        </div>

        <div class="progress-stats">
          <div class="stat">
            <el-icon><Timer /></el-icon>
            <span v-if="estimatedTimeFormatted">ETA: {{ estimatedTimeFormatted }}</span>
            <span v-else>Calculating...</span>
          </div>
          
          <div class="stat">
            <el-icon><TrendCharts /></el-icon>
            <span>{{ processingRate }} profs/min</span>
          </div>
        </div>

        <div class="progress-tips">
          <el-icon><InfoFilled /></el-icon>
          <span>Processing with parallel requests for faster speed. You can switch tabs while processing.</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Timer, TrendCharts, InfoFilled } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/appStore'

const store = useAppStore()

const estimatedTimeFormatted = computed(() => {
  const seconds = store.estimatedTimeRemaining
  if (!seconds) return null
  
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }
})

const processingRate = computed(() => {
  if (!store.processingStartTime || store.processedCount === 0) {
    return '0'
  }
  
  const elapsed = (Date.now() - store.processingStartTime) / 1000 / 60 // minutes
  const rate = store.processedCount / elapsed
  return rate.toFixed(1)
})
</script>

<style scoped>
.progress-container {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 16px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.progress-content {
  padding: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
  text-align: center;
}

.progress-wrapper {
  position: relative;
  margin-top: 20px;
}

.progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  pointer-events: none;
}

.progress-count {
  font-weight: 700;
  font-size: 16px;
  color: #333;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

.progress-percent {
  font-weight: 700;
  font-size: 16px;
  color: #333;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.stat .el-icon {
  color: var(--el-color-primary);
  font-size: 18px;
}

.progress-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--el-color-info-light-9);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-color-info);
}

.progress-tips .el-icon {
  font-size: 16px;
}

:deep(.el-progress__text) {
  font-size: 14px !important;
  font-weight: 600;
}
</style>

