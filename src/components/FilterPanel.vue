<template>
  <el-card class="filter-panel" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="header-title">
          <el-icon><Filter /></el-icon>
          Filter Settings
        </span>
      </div>
    </template>

    <el-form label-position="top" size="default">
      <!-- Region Selection -->
      <el-form-item label="Region">
        <el-radio-group v-model="regionMode" size="small" style="margin-bottom: 12px">
          <el-radio-button value="continent">By Continent</el-radio-button>
          <el-radio-button value="country">By Country/Region</el-radio-button>
        </el-radio-group>
        
        <el-select
          v-model="selectedRegion"
          placeholder="Select a region"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="region in displayRegions"
            :key="region.value"
            :label="region.label"
            :value="region.value"
          />
        </el-select>
      </el-form-item>

      <!-- Year Range -->
      <el-form-item label="Year Range">
        <div class="year-inputs">
          <el-input-number
            v-model="store.yearRange[0]"
            :min="1970"
            :max="store.yearRange[1]"
            controls-position="right"
            style="width: 120px"
          />
          <span class="year-separator">to</span>
          <el-input-number
            v-model="store.yearRange[1]"
            :min="store.yearRange[0]"
            :max="2025"
            controls-position="right"
            style="width: 120px"
          />
        </div>
      </el-form-item>

      <!-- Area/Venue Selection -->
      <el-form-item label="Research Areas & Venues">
        <AreaSelector v-model="store.selectedVenues" />
      </el-form-item>

      <!-- Search -->
      <el-form-item label="Search">
        <el-input
          v-model="localSearchQuery"
          placeholder="Search by name or institution..."
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearchClear"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button :icon="Search" @click="handleSearch">Search</el-button>
          </template>
        </el-input>
      </el-form-item>

      <!-- Actions -->
      <el-form-item>
        <el-button
          type="primary"
          @click="handleApplyFilters"
          :disabled="store.professors.length === 0"
          style="width: 100%"
        >
          <el-icon><Filter /></el-icon>
          Apply Filters
        </el-button>
      </el-form-item>
      
      <el-form-item>
        <el-button
          @click="handleReset"
          style="width: 100%"
        >
          <el-icon><Refresh /></el-icon>
          Reset Filters
        </el-button>
      </el-form-item>

      <!-- Statistics -->
      <el-divider />
      <div class="statistics">
        <div class="stat-item">
          <span class="stat-label">Found:</span>
          <span class="stat-value">{{ store.candidateProfessors.length }}</span>
        </div>
        <div v-if="store.llmFilteredProfessors.length > 0" class="stat-item">
          <span class="stat-label">AI Matched:</span>
          <span class="stat-value">{{ matchedCount }}</span>
        </div>
      </div>

      <!-- Debug Info (development only) -->
      <el-collapse v-model="debugOpen" style="margin-top: 12px">
        <el-collapse-item title="🔍 Debug Info" name="debug">
          <div class="debug-info">
            <p><strong>Region:</strong> {{ store.selectedRegions }}</p>
            <p><strong>Year:</strong> {{ store.yearRange }}</p>
            <p><strong>Venues:</strong> {{ store.selectedVenues.length }} selected</p>
            <p><strong>Search:</strong> "{{ store.searchQuery }}"</p>
            <el-button size="small" @click="logDebugInfo" style="margin-top: 8px">
              Print to Console
            </el-button>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Filter, Search, Refresh } from '@element-plus/icons-vue'
import AreaSelector from './AreaSelector.vue'
import { useAppStore } from '@/stores/appStore'
import { REGION_CONFIG } from '@/utils/areaConfig'

const store = useAppStore()

const regionMode = ref('country')
const selectedRegion = ref('us')
const debugOpen = ref([])
const localSearchQuery = ref('')

const displayRegions = computed(() => {
  return regionMode.value === 'continent' 
    ? REGION_CONFIG.byContinent
    : REGION_CONFIG.byCountry
})

// Initialize store region
store.selectedRegions = ['us']

// Update store when region changes
watch(selectedRegion, (newVal) => {
  store.selectedRegions = [newVal]
  console.log('Region changed to:', newVal)
})

// Switch default when changing mode
watch(regionMode, (newMode) => {
  selectedRegion.value = newMode === 'continent' ? 'northamerica' : 'us'
  console.log('Region mode changed to:', newMode, 'Region:', selectedRegion.value)
})

const yearMarks = {
  1970: '1970',
  1990: '1990',
  2010: '2010',
  2025: '2025'
}

const matchedCount = computed(() => {
  return store.llmFilteredProfessors.filter(
    prof => prof.matchScore >= store.threshold
  ).length
})

function handleApplyFilters() {
  if (store.professors.length === 0) {
    ElMessage.warning('Please load professors first')
    return
  }
  
  store.applyCandidateFilters()
  ElMessage.success(`Filters applied. Found ${store.candidateProfessors.length} professors`)
}

function handleReset() {
  store.resetFilters()
  selectedRegion.value = 'us'
  regionMode.value = 'country'
  localSearchQuery.value = ''
  ElMessage.info('Filters reset')
}

function handleSearch() {
  store.searchQuery = localSearchQuery.value
  if (store.professors.length > 0) {
    store.applyCandidateFilters()
    if (localSearchQuery.value.trim()) {
      ElMessage.success(`Found ${store.candidateProfessors.length} professors matching: ${localSearchQuery.value}`)
    }
  } else {
    ElMessage.warning('Please load professors first')
  }
}

function handleSearchClear() {
  localSearchQuery.value = ''
  store.searchQuery = ''
  if (store.professors.length > 0) {
    store.applyCandidateFilters()
  }
}

function logDebugInfo() {
  console.log('=== FULL DEBUG INFO ===')
  console.log('Selected Regions:', store.selectedRegions)
  console.log('Year Range:', store.yearRange)
  console.log('Selected Venues:', store.selectedVenues)
  console.log('Search Query:', store.searchQuery)
  console.log('---')
  console.log('Raw Professors:', store.professors.length)
  console.log('Candidate Professors:', store.candidateProfessors.length)
  console.log('Display Professors:', store.displayProfessors.length)
  console.log('---')
  console.log('Sample raw professor:', store.professors[0])
  console.log('Sample candidate professor:', store.candidateProfessors[0])
  ElMessage.success('Debug info printed to console (F12)')
}
</script>

<style scoped>
.filter-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.year-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}

.year-separator {
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.statistics {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.stat-value {
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 16px;
}

:deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

.debug-info {
  font-size: 13px;
}

.debug-info p {
  margin: 4px 0;
  color: var(--el-text-color-regular);
}

.debug-info strong {
  color: var(--el-text-color-primary);
}
</style>

