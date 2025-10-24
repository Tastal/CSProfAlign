<template>
  <el-card class="professor-card" shadow="hover">
    <div class="card-content">
      <!-- Header -->
      <div class="card-header">
        <div class="professor-info">
          <h3 class="professor-name">{{ professor.name }}</h3>
          <p class="professor-affiliation">{{ professor.affiliation }}</p>
          
          <!-- Publication Data Sources -->
          <div v-if="professor.publicationSources && professor.publicationSources.length > 0" class="publication-sources">
            <el-tag 
              v-if="professor.publicationSources.includes('csrankings-local')" 
              size="small"
              type="info"
            >
              <el-icon><Document /></el-icon>
              CSRankings
            </el-tag>
            <el-tag 
              v-if="professor.publicationSources.includes('dblp-api')" 
              size="small"
              type="success"
            >
              <el-icon><Link /></el-icon>
              DBLP
            </el-tag>
            <el-tag 
              v-if="professor.publicationSources.includes('scholar-scraper')" 
              size="small"
              type="warning"
            >
              <el-icon><Search /></el-icon>
              Scholar
            </el-tag>
          </div>
        </div>
        
        <div v-if="professor.matchScore !== undefined" class="match-score">
          <el-progress
            type="circle"
            :percentage="Math.round(professor.matchScore * 100)"
            :width="60"
            :color="getScoreColor(professor.matchScore)"
          >
            <template #default>
              <span class="score-text">{{ (professor.matchScore * 100).toFixed(0) }}</span>
            </template>
          </el-progress>
        </div>
      </div>

      <!-- Research Areas -->
      <div class="research-areas">
        <el-tag
          v-for="area in displayAreas"
          :key="area"
          :color="getAreaColor(area)"
          size="small"
          effect="dark"
          class="area-tag"
        >
          {{ area.toUpperCase() }}
        </el-tag>
        <el-tag 
          v-if="professor.areas.length > 5" 
          size="small" 
          type="info"
          @click="showAllAreas = !showAllAreas"
          style="cursor: pointer;"
        >
          {{ showAllAreas ? 'Show less' : `+${professor.areas.length - 5} more` }}
        </el-tag>
      </div>

      <!-- Publications -->
      <div class="publications">
        <el-icon><Document /></el-icon>
        <span>
          {{ Math.round(professor.relevantPapers || professor.total_papers_recent || 0) }} papers
        </span>
      </div>

      <!-- Research Summary / Match Reasoning (if available) -->
      <div v-if="professor.researchSummary || professor.matchReasoning" class="match-reasoning">
        <div class="reasoning-header">
          <el-icon><ChatLineRound /></el-icon>
          <strong>Research Focus:</strong>
        </div>
        <div class="summary-container">
          <p :class="['reasoning-text', { 'expanded': isExpanded }]">
            {{ professor.researchSummary || professor.matchReasoning }}
          </p>
          <el-button 
            v-if="isTruncated" 
            text 
            type="primary" 
            size="small"
            @click="isExpanded = !isExpanded"
            class="expand-button"
          >
            {{ isExpanded ? 'Collapse ▲' : 'Expand ▼' }}
          </el-button>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-actions">
        <el-button
          v-if="professor.homepage"
          @click="openHomepage"
          size="small"
          :icon="Link"
        >
          Homepage
        </el-button>
        
        <el-button
          v-if="professor.scholarid"
          @click="openScholar"
          size="small"
          :icon="Reading"
        >
          Scholar
        </el-button>
        
        <el-dropdown v-if="professor.publications" trigger="click">
          <el-button size="small" :icon="MoreFilled">
            Details
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="showPublicationDetails">
                <el-icon><TrendCharts /></el-icon>
                Publication Timeline
              </el-dropdown-item>
              <el-dropdown-item @click="exportProfessor">
                <el-icon><Download /></el-icon>
                Export Data
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  ChatLineRound,
  Link,
  Reading,
  MoreFilled,
  TrendCharts,
  Download,
  Search
} from '@element-plus/icons-vue'
import { getVenueHierarchy } from '@/utils/areaConfig'

const props = defineProps({
  professor: {
    type: Object,
    required: true
  }
})

// Expand/Collapse state
const isExpanded = ref(false)
const showAllAreas = ref(false)

// Check if summary text is long enough to truncate
const isTruncated = computed(() => {
  const summary = props.professor.researchSummary || props.professor.matchReasoning || ''
  return summary.length > 200
})

const displayAreas = computed(() => {
  return showAllAreas.value ? props.professor.areas : props.professor.areas.slice(0, 5)
})

function getScoreColor(score) {
  if (score >= 0.9) return '#67C23A' // green
  if (score >= 0.7) return '#409EFF' // blue
  if (score >= 0.5) return '#E6A23C' // orange
  return '#F56C6C' // red
}

function getAreaColor(area) {
  const hierarchy = getVenueHierarchy(area)
  return hierarchy?.color || '#909399'
}

function openHomepage() {
  if (props.professor.homepage) {
    window.open(props.professor.homepage, '_blank')
  }
}

function openScholar() {
  if (props.professor.scholarid) {
    window.open(`https://scholar.google.com/citations?user=${props.professor.scholarid}`, '_blank')
  }
}

function showPublicationDetails() {
  ElMessage.info('Publication timeline view coming soon!')
}

function exportProfessor() {
  const data = JSON.stringify(props.professor, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.professor.name.replace(/\s+/g, '_')}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('Professor data exported')
}
</script>

<style scoped>
.professor-card {
  transition: all 0.3s;
}

.professor-card:hover {
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.professor-info {
  flex: 1;
}

.professor-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.professor-affiliation {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.publication-sources {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.publication-sources .el-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.match-score {
  flex-shrink: 0;
}

.score-text {
  font-size: 14px;
  font-weight: 600;
}

.research-areas {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.area-tag {
  color: white !important;
  font-weight: 500;
  border: none !important;
}

.publications {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.pub-period {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.match-reasoning {
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-primary);
}

.reasoning-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.reasoning-header .el-icon {
  color: var(--el-color-primary);
  font-size: 14px;
}

.summary-container {
  position: relative;
}

.reasoning-text {
  margin: 0;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  font-size: 13px;
  max-height: 4.8em; /* 3 lines at line-height 1.6 */
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.reasoning-text.expanded {
  max-height: none;
}

.expand-button {
  margin-top: 4px;
  padding: 0 4px;
  height: auto;
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>

