<template>
  <div class="result-list">
    <!-- Toolbar (Fixed) -->
    <el-card class="toolbar" shadow="hover">
      <div class="toolbar-content">
        <div class="toolbar-left">
          <h2 class="title">
            <el-icon><UserFilled /></el-icon>
            Results
            <el-tag type="primary">{{ displayCount }}</el-tag>
          </h2>
        </div>

        <div class="toolbar-right">
          <!-- View Mode -->
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button value="cards">
              <el-icon><Grid /></el-icon>
              Cards
            </el-radio-button>
            <el-radio-button value="list">
              <el-icon><Reading /></el-icon>
              List
            </el-radio-button>
          </el-radio-group>

          <!-- Group By -->
          <el-select v-model="groupBy" size="small" style="width: 150px" placeholder="Group by">
            <el-option label="No Grouping" value="none" />
            <el-option label="By Institution" value="institution" />
            <el-option label="By Area" value="area" />
          </el-select>

          <!-- Sort -->
          <el-select v-model="sortBy" size="small" style="width: 160px">
            <el-option label="Match Score ↓" value="score-desc" />
            <el-option label="Match Score ↑" value="score-asc" />
            <el-option label="Papers ↓" value="papers-desc" />
            <el-option label="Papers ↑" value="papers-asc" />
            <el-option label="Name A-Z" value="name-asc" />
            <el-option label="Name Z-A" value="name-desc" />
            <el-option label="Institution A-Z" value="affiliation-asc" />
            <el-option label="Institution Z-A" value="affiliation-desc" />
          </el-select>

          <!-- Export - Hidden (now using floating button) -->
          <div v-if="false">
            <el-dropdown trigger="click" @command="handleExport">
              <el-button size="small" :icon="Download">
                Export
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv">
                    <el-icon><Document /></el-icon>
                    Export as CSV
                  </el-dropdown-item>
                  <el-dropdown-item command="json">
                    <el-icon><Folder /></el-icon>
                    Export as JSON
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Content Area (Scrollable) -->
    <div class="content-area">
      <!-- Empty State -->
      <el-empty
        v-if="displayProfessors.length === 0 && !store.loading"
        description="Click 'Start Analysis' in the right panel to begin"
      >
        <template #image>
          <div style="font-size: 80px">🎓</div>
        </template>
        <el-button type="primary" @click="handleReset">Reset Filters</el-button>
      </el-empty>

      <!-- Loading State -->
      <el-card v-if="store.loading" shadow="hover">
      <div style="text-align: center; padding: 40px">
        <el-icon class="is-loading" style="font-size: 48px; color: var(--el-color-primary)">
          <Loading />
        </el-icon>
        <p style="margin-top: 16px; color: var(--el-text-color-secondary)">
          Loading professor data...
        </p>
      </div>
    </el-card>

    <!-- Cards View -->
    <div v-else-if="viewMode === 'cards'" class="cards-container">
      <template v-if="groupBy === 'none'">
        <ProfessorCard
          v-for="(prof, index) in sortedProfessors"
          :key="prof.name + index"
          :professor="{ ...prof, rank: index + 1 }"
        />
      </template>
      
      <template v-else>
        <div v-for="(group, groupName) in groupedProfessors" :key="groupName" class="professor-group">
          <h3 class="group-header">
            {{ groupName }}
            <el-tag size="small" type="info">{{ group.length }} professors</el-tag>
          </h3>
          <div class="cards-container">
            <ProfessorCard
              v-for="(prof, index) in group"
              :key="`${prof.name}-${index}`"
              :professor="prof"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- Compact List View -->
    <el-card v-else-if="viewMode === 'list'" shadow="hover" class="list-view">
      <template v-if="groupBy === 'none'">
        <div class="compact-list">
          <div 
            v-for="(prof, index) in sortedProfessors" 
            :key="`${prof.name}-${index}`"
            class="list-item"
          >
            <div class="list-rank">{{ index + 1 }}</div>
            <div class="list-item-main">
              <div class="list-item-name">
                <strong>{{ prof.name }}</strong>
                <el-tag v-if="prof.matchScore" :type="getScoreType(prof.matchScore)" size="small" round>
                  {{ (prof.matchScore * 100).toFixed(0) }}%
                </el-tag>
              </div>
              <div class="list-item-affiliation">
                {{ prof.affiliation }}
              </div>
            </div>
            <div class="list-item-stats">
              <el-tag size="small" type="info">
                {{ Math.round(prof.relevantPapers || prof.total_papers_recent || 0) }} papers
              </el-tag>
              <el-button-group size="small">
                <el-button :icon="Link" @click="openHomepage(prof.homepage)" :disabled="!prof.homepage" text>
                  Home
                </el-button>
                <el-button :icon="Reading" @click="openScholar(prof.scholarid)" :disabled="!prof.scholarid" text>
                  Scholar
                </el-button>
              </el-button-group>
            </div>
          </div>
        </div>
      </template>
      
      <template v-else>
        <el-collapse v-model="activeGroups">
          <el-collapse-item 
            v-for="(group, groupName) in groupedProfessors" 
            :key="groupName"
            :name="groupName"
          >
            <template #title>
              <div class="group-title-bar">
                <strong>{{ groupName }}</strong>
                <el-tag size="small" type="primary">{{ group.length }}</el-tag>
              </div>
            </template>
            <div class="compact-list">
              <div 
                v-for="(prof, index) in group" 
                :key="`${prof.name}-${index}`"
                class="list-item"
              >
                <div class="list-rank">{{ index + 1 }}</div>
                <div class="list-item-main">
                  <div class="list-item-name">
                    <strong>{{ prof.name }}</strong>
                    <el-tag v-if="prof.matchScore" :type="getScoreType(prof.matchScore)" size="small" round>
                      {{ (prof.matchScore * 100).toFixed(0) }}%
                    </el-tag>
                  </div>
                  <div class="list-item-affiliation" v-if="groupBy !== 'institution'">
                    {{ prof.affiliation }}
                  </div>
                </div>
                <div class="list-item-stats">
                  <el-tag size="small" type="info">
                    {{ Math.round(prof.relevantPapers || prof.total_papers_recent || 0) }} papers
                  </el-tag>
                  <el-button-group size="small">
                    <el-button :icon="Link" @click="openHomepage(prof.homepage)" :disabled="!prof.homepage" text>
                      Home
                    </el-button>
                    <el-button :icon="Reading" @click="openScholar(prof.scholarid)" :disabled="!prof.scholarid" text>
                      Scholar
                    </el-button>
                  </el-button-group>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </template>
    </el-card>

    <!-- Pagination (only show when not grouping) -->
    <div v-if="groupBy === 'none' && totalProfessors > pageSize" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalProfessors"
        :page-sizes="[100, 200, 300, 500]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="(size) => { pageSize = size; resetPagination() }"
        @current-change="handlePageChange"
        background
      />
    </div>
    </div><!-- End of content-area -->

    <!-- Floating Export Button -->
    <div class="floating-export-btn">
      <el-dropdown trigger="click" @command="handleExport" placement="top-end">
        <el-button 
          type="success" 
          circle 
          size="large" 
          :icon="Download"
          :disabled="displayProfessors.length === 0"
        />
        <template #dropdown>
          <el-dropdown-menu>
            <div class="export-header">
              <strong v-if="displayCount > 0">Export {{ displayCount }} Professors</strong>
              <strong v-else style="color: var(--el-text-color-secondary);">No Data to Export</strong>
            </div>
            <el-dropdown-item command="csv" :disabled="displayProfessors.length === 0">
              <el-icon><Document /></el-icon>
              <strong>CSV Format</strong>
            </el-dropdown-item>
            <el-dropdown-item command="json" :disabled="displayProfessors.length === 0">
              <el-icon><Folder /></el-icon>
              <strong>JSON Format</strong>
            </el-dropdown-item>
            
            <!-- History Section -->
            <template v-if="exportHistory.length > 0">
              <el-divider style="margin: 8px 0" />
              <div class="export-history-header">
                📝 Recent Exports
              </div>
              <div
                v-for="(item, index) in exportHistory.slice(0, 5)"
                :key="index"
                class="history-item-wrapper"
              >
                <div class="history-item">
                  <div class="history-main">
                    <el-icon :component="item.format === 'csv' ? Document : Folder" />
                    <span class="history-count">{{ item.count }} professors</span>
                    <el-tag size="small" :type="item.format === 'csv' ? 'success' : 'primary'">
                      {{ item.format.toUpperCase() }}
                    </el-tag>
                  </div>
                  <div class="history-time">{{ item.date }} {{ item.time }}</div>
                </div>
              </div>
            </template>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  Grid,
  Download,
  Document,
  Folder,
  Link,
  Reading,
  Loading
} from '@element-plus/icons-vue'
import ProfessorCard from './ProfessorCard.vue'
import { useAppStore } from '@/stores/appStore'
import { exportToCSV, exportToJSON } from '@/utils/exportUtils'

const store = useAppStore()

const viewMode = ref('cards')
const sortBy = ref('papers-desc')
const groupBy = ref('none')
const activeGroups = ref([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(200)

// Export history
const exportHistory = ref([])

const displayProfessors = computed(() => {
  return store.displayProfessors
})

const allSortedProfessors = computed(() => {
  const profs = [...displayProfessors.value]
  
  switch (sortBy.value) {
    case 'score-desc':
      return profs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    case 'score-asc':
      return profs.sort((a, b) => (a.matchScore || 0) - (b.matchScore || 0))
    case 'papers-desc':
      return profs.sort((a, b) => {
        const aPapers = a.relevantPapers || a.total_papers_recent || 0
        const bPapers = b.relevantPapers || b.total_papers_recent || 0
        return bPapers - aPapers
      })
    case 'papers-asc':
      return profs.sort((a, b) => {
        const aPapers = a.relevantPapers || a.total_papers_recent || 0
        const bPapers = b.relevantPapers || b.total_papers_recent || 0
        return aPapers - bPapers
      })
    case 'name-asc':
      return profs.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return profs.sort((a, b) => b.name.localeCompare(a.name))
    case 'affiliation-asc':
      return profs.sort((a, b) => a.affiliation.localeCompare(b.affiliation))
    case 'affiliation-desc':
      return profs.sort((a, b) => b.affiliation.localeCompare(a.affiliation))
    default:
      return profs
  }
})

// Paginated professors
const sortedProfessors = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allSortedProfessors.value.slice(start, end)
})

// Total count for pagination
const totalProfessors = computed(() => allSortedProfessors.value.length)

const groupedProfessors = computed(() => {
  if (groupBy.value === 'none') return {}
  
  const groups = {}
  // When grouping, use ALL professors (paginated within groups instead)
  const profs = allSortedProfessors.value
  
  for (const prof of profs) {
    let groupKey
    
    if (groupBy.value === 'institution') {
      groupKey = prof.affiliation
    } else if (groupBy.value === 'area') {
      groupKey = prof.areas?.[0]?.toUpperCase() || 'Unknown'
    } else {
      groupKey = 'Other'
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(prof)
  }
  
  // Sort groups by name
  const sortedGroups = {}
  Object.keys(groups).sort().forEach(key => {
    sortedGroups[key] = groups[key]
  })
  
  return sortedGroups
})

const displayCount = computed(() => {
  return totalProfessors.value
})

// Reset to page 1 when sort or filter changes
function resetPagination() {
  currentPage.value = 1
}

// Watch for sort/filter changes to reset pagination
watch([sortBy, groupBy], () => {
  resetPagination()
})

// Watch for real-time updates during processing
watch(() => store.displayProfessors.length, (newLength, oldLength) => {
  // During processing, new results are added incrementally
  if (store.isProcessing && newLength > oldLength) {
    // Keep user on page 1 to see new results as they arrive
    if (currentPage.value === 1) {
      // User is on page 1, stay there to see new results
      return
    }
    // User browsed to other pages, respect their choice
  } else if (!store.isProcessing && newLength !== oldLength) {
    // Processing finished or filter changed, reset to page 1
    resetPagination()
  }
})

// Handle page change
function handlePageChange(page) {
  currentPage.value = page
  // Scroll to top of results
  const contentArea = document.querySelector('.content-area')
  if (contentArea) {
    contentArea.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const hasMatchScores = computed(() => {
  return displayProfessors.value.some(prof => prof.matchScore !== undefined)
})

function getScoreColor(score) {
  if (score >= 0.9) return '#67C23A'
  if (score >= 0.7) return '#409EFF'
  if (score >= 0.5) return '#E6A23C'
  return '#F56C6C'
}

function getScoreType(score) {
  if (score >= 0.9) return 'success'
  if (score >= 0.7) return 'primary'
  if (score >= 0.5) return 'warning'
  return 'danger'
}

function openHomepage(url) {
  if (url) {
    window.open(url, '_blank')
  }
}

function openScholar(scholarid) {
  if (scholarid) {
    window.open(`https://scholar.google.com/citations?user=${scholarid}`, '_blank')
  }
}

function handleExport(command) {
  if (displayProfessors.value.length === 0) {
    ElMessage.warning('No data to export')
    return
  }

  const now = new Date()
  const timestamp = now.toISOString().slice(0, 10)
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const filename = `csprofhunt-results-${timestamp}`

  try {
    const data = displayProfessors.value
    
    if (command === 'csv') {
      exportToCSV(data, `${filename}.csv`)
      ElMessage.success('Exported to CSV')
      
      // Add to history
      addToExportHistory({
        format: 'csv',
        count: data.length,
        time: timeStr,
        date: timestamp,
        data: data,
        filename: `${filename}.csv`
      })
    } else if (command === 'json') {
      exportToJSON(data, `${filename}.json`)
      ElMessage.success('Exported to JSON')
      
      // Add to history
      addToExportHistory({
        format: 'json',
        count: data.length,
        time: timeStr,
        date: timestamp,
        data: data,
        filename: `${filename}.json`
      })
    }
  } catch (error) {
    ElMessage.error(`Export failed: ${error.message}`)
  }
}

function addToExportHistory(item) {
  // Add to front of history (without data, only metadata)
  const historyItem = {
    format: item.format,
    count: item.count,
    time: item.time,
    date: item.date,
    filename: item.filename
  }
  
  exportHistory.value.unshift(historyItem)
  
  // Keep only last 10 exports
  if (exportHistory.value.length > 10) {
    exportHistory.value = exportHistory.value.slice(0, 10)
  }
  
  // Save to localStorage
  try {
    localStorage.setItem('csprofhunt-export-history', JSON.stringify(exportHistory.value))
  } catch (error) {
    console.warn('Failed to save export history:', error)
  }
}

// Load export history from localStorage on component mount
onMounted(() => {
  try {
    const saved = localStorage.getItem('csprofhunt-export-history')
    if (saved) {
      exportHistory.value = JSON.parse(saved)
    }
  } catch (error) {
    console.warn('Failed to load export history:', error)
  }
})

function handleReset() {
  store.resetFilters()
}
</script>

<style scoped>
.result-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.toolbar {
  flex-shrink: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.content-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  flex: 1;
  min-width: 200px;
}

.title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
  padding: 16px;
}

.professor-group {
  margin-bottom: 32px;
  padding: 0 16px;
}

.professor-group:first-child {
  margin-top: 16px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  color: var(--el-text-color-primary);
  border-left: 4px solid var(--el-color-primary);
}

.list-view {
  margin: 16px 16px 24px 16px;
}

.compact-list {
  display: flex;
  flex-direction: column;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  background: var(--el-fill-color-blank);
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;
}

.list-item:hover {
  background: var(--el-fill-color-light);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.list-item:last-child {
  border-bottom: none;
}

.list-rank {
  width: 40px;
  text-align: center;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  flex-shrink: 0;
}

.list-item-main {
  flex: 1;
  min-width: 0;
}

.list-item-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.list-item-name strong {
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.list-item-affiliation {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.group-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 16px;
}

.group-title-bar strong {
  font-size: 15px;
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* Floating Export Button */
.floating-export-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
}

.floating-export-btn .el-button {
  width: 56px;
  height: 56px;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-export-btn .el-button:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 20px rgba(103, 194, 58, 0.6);
}

.export-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.export-history-header {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.history-item-wrapper {
  padding: 8px 16px;
  cursor: default;
}

.history-item-wrapper:hover {
  background: var(--el-fill-color-light);
}

.history-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-count {
  font-size: 13px;
  color: var(--el-text-color-primary);
  flex: 1;
}

.history-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-left: 24px;
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
  }

  .toolbar-content {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    justify-content: space-between;
  }

  .pagination-container {
    padding: 16px 8px;
  }

  .pagination-container :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }

  .floating-export-btn {
    bottom: 24px;
    right: 24px;
  }
  
  .floating-export-btn .el-button {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>

