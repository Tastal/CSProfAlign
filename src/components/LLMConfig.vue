<template>
  <el-card class="llm-config" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="header-title">
          <el-icon><ChatDotRound /></el-icon>
          LLM Configuration
        </span>
      </div>
    </template>

    <el-form label-position="top" size="default">
      <!-- Provider Selection -->
      <el-form-item label="LLM Provider">
        <el-select v-model="store.llmProvider" style="width: 100%">
          <el-option label="OpenAI (ChatGPT)" value="openai">
            <span>OpenAI (ChatGPT)</span>
          </el-option>
          <el-option label="Google (Gemini)" value="gemini">
            <span>Google (Gemini)</span>
          </el-option>
          <el-option label="Anthropic (Claude)" value="claude">
            <span>Anthropic (Claude)</span>
          </el-option>
          <el-option label="DeepSeek" value="deepseek">
            <span>DeepSeek</span>
          </el-option>
          <el-option label="Local Model" value="local">
            <span>Local Model (Browser)</span>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- API Key (for cloud providers) -->
      <el-form-item
        v-if="store.llmProvider !== 'local'"
        label="API Key"
      >
        <el-input
          v-model="store.llmApiKey"
          type="password"
          placeholder="Enter your API key"
          show-password
        >
          <template #append>
            <el-button :icon="InfoFilled" @click="showApiKeyHelp" />
          </template>
        </el-input>
      </el-form-item>

      <!-- Model Selection (optional) -->
      <el-form-item
        v-if="store.llmProvider !== 'local'"
        label="Model (Optional)"
      >
        <el-input
          v-model="store.llmModel"
          :placeholder="getDefaultModel()"
        />
      </el-form-item>

      <!-- Base URL (optional) -->
      <el-form-item
        v-if="store.llmProvider !== 'local'"
        label="Base URL (Optional)"
      >
        <el-input
          v-model="store.llmBaseURL"
          placeholder="Custom API endpoint"
        />
      </el-form-item>

      <!-- Local Model Options -->
      <div v-if="store.llmProvider === 'local'">
        <el-form-item label="Local Model">
          <el-select
            v-model="selectedLocalModel"
            style="width: 100%"
            @change="handleLocalModelChange"
          >
            <el-option
              v-for="model in RECOMMENDED_MODELS"
              :key="model.name"
              :label="`${model.description} (${model.size})`"
              :value="model.name"
            >
              <div>
                <span>{{ model.description }}</span>
                <span style="float: right; color: var(--el-color-info)">
                  {{ model.size }}
                </span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-alert
          v-if="!store.localModelReady"
          title="Local model requires initial download"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          First-time model download may take several minutes.
        </el-alert>

        <el-button
          v-if="!store.localModelReady"
          type="primary"
          :loading="store.localModelLoading"
          @click="handleLoadLocalModel"
          style="width: 100%; margin-bottom: 16px"
        >
          {{ store.localModelLoading ? 'Loading Model...' : 'Load Model' }}
        </el-button>

        <el-progress
          v-if="store.localModelLoading"
          :percentage="localModelProgress"
          :status="localModelProgress === 100 ? 'success' : undefined"
        />
      </div>

      <!-- Research Direction -->
      <el-form-item label="Research Direction">
        <el-input
          v-model="store.researchDirection"
          type="textarea"
          :rows="8"
          placeholder="Describe your research interests in detail...

Example:
I'm interested in large language models for code generation, particularly focusing on program synthesis, automated debugging, and AI-assisted software development. Looking for experts in neural program synthesis, transformer-based code models, and human-AI collaboration in programming."
        />
        <div class="char-count">
          {{ store.researchDirection.length }} characters
        </div>
      </el-form-item>

      <!-- Threshold -->
      <el-form-item label="Matching Threshold">
        <el-slider
          v-model="store.threshold"
          :min="0"
          :max="1"
          :step="0.05"
          :marks="thresholdMarks"
          show-stops
        />
        <div class="threshold-display">
          <span>{{ store.threshold.toFixed(2) }}</span>
          <span class="threshold-desc">{{ getThresholdDescription() }}</span>
        </div>
      </el-form-item>

      <!-- Advanced Settings (Collapsible) -->
      <el-collapse v-model="activeCollapse">
        <el-collapse-item title="Advanced Settings" name="advanced">
          <el-form-item label="Max Workers (Concurrency)">
            <el-input-number
              v-model="store.maxWorkers"
              :min="1"
              :max="20"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="Batch Size">
            <el-input-number
              v-model="store.batchSize"
              :min="1"
              :max="50"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="Max Papers to Consider">
            <el-input-number
              v-model="store.maxPapers"
              :min="5"
              :max="50"
              style="width: 100%"
            />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <!-- Run Button -->
      <el-form-item style="margin-top: 24px">
        <el-button
          type="primary"
          size="large"
          :loading="store.isProcessing || store.loading"
          :disabled="!canRunAnalysis"
          @click="handleRunAnalysis"
          style="width: 100%"
        >
          <el-icon v-if="!store.isProcessing && !store.loading"><MagicStick /></el-icon>
          {{ getButtonText() }}
        </el-button>
        
        <el-alert
          v-if="!store.loading && !store.isProcessing"
          :title="getDisabledReason()"
          :type="store.researchDirection.trim() ? 'success' : 'info'"
          :closable="false"
          style="margin-top: 12px; font-size: 13px"
        />
      </el-form-item>

      <el-form-item>
        <el-button
          @click="handleReset"
          style="width: 100%"
        >
          Reset Configuration
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, InfoFilled, MagicStick } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/appStore'
import { RECOMMENDED_MODELS } from '@/services/localLLM'

const store = useAppStore()

const activeCollapse = ref([])
const selectedLocalModel = ref('Xenova/LaMini-Flan-T5-783M')
const localModelProgress = ref(0)

const thresholdMarks = {
  0: '0.0',
  0.3: 'Low',
  0.6: 'Medium',
  0.9: 'High',
  1: '1.0'
}

const canRunAnalysis = computed(() => {
  // Can always run to load professors
  // LLM filtering is optional
  return true
})

function getButtonText() {
  if (store.loading) return 'Loading Data...'
  if (store.isProcessing) return 'AI Filtering...'
  if (!store.researchDirection.trim()) {
    return '📊 Load Professors'
  }
  return '🚀 Start AI Analysis'
}

function getDisabledReason() {
  if (!store.researchDirection.trim()) {
    return 'Will load professors without AI filtering. Add research direction to enable AI matching.'
  }
  if (store.llmProvider === 'local' && !store.localModelReady) {
    return 'Please load a local model first for AI filtering'
  }
  if (store.llmProvider !== 'local' && !store.llmApiKey.trim()) {
    return 'Please enter your API key for AI filtering'
  }
  return 'Ready for AI-powered analysis'
}

function getDefaultModel() {
  const defaults = {
    openai: 'gpt-4',
    gemini: 'gemini-pro',
    claude: 'claude-3-sonnet-20240229',
    deepseek: 'deepseek-chat'
  }
  return defaults[store.llmProvider] || ''
}

function getThresholdDescription() {
  const t = store.threshold
  if (t < 0.4) return 'Very relaxed - broad matches'
  if (t < 0.6) return 'Relaxed - related areas'
  if (t < 0.75) return 'Moderate - good alignment'
  if (t < 0.9) return 'Strict - close match'
  return 'Very strict - perfect match only'
}

function showApiKeyHelp() {
  const helpUrls = {
    openai: 'https://platform.openai.com/api-keys',
    gemini: 'https://makersuite.google.com/app/apikey',
    claude: 'https://console.anthropic.com/settings/keys',
    deepseek: 'https://platform.deepseek.com/api_keys'
  }
  
  const url = helpUrls[store.llmProvider]
  if (url) {
    ElMessageBox.confirm(
      `Get your API key from: ${url}`,
      'API Key Help',
      {
        confirmButtonText: 'Open in Browser',
        cancelButtonText: 'Close',
        type: 'info'
      }
    ).then(() => {
      // User clicked "Open in Browser"
      window.open(url, '_blank')
    }).catch(() => {
      // User clicked "Close" or pressed ESC - do nothing
    })
  }
}

async function handleLoadLocalModel() {
  try {
    await store.loadLocalModel(selectedLocalModel.value, (progress) => {
      localModelProgress.value = progress.progress || 0
    })
    ElMessage.success('Local model loaded successfully!')
  } catch (error) {
    ElMessage.error(`Failed to load model: ${error.message}`)
  }
}

function handleLocalModelChange() {
  store.localModelReady = false
}

async function handleRunAnalysis() {
  try {
    // Step 1: Load professors based on filters
    ElMessage.info('Loading professors...')
    await store.loadProfessors()
    
    if (store.candidateProfessors.length === 0) {
      ElMessage.warning('No professors found matching your filters. Try adjusting region, time range, or areas.')
      return
    }
    
    ElMessage.success(`Loaded ${store.candidateProfessors.length} professors`)
    
    // Step 2: Run LLM filtering only if research direction is provided
    if (store.researchDirection.trim()) {
      ElMessage.info('AI filtering in progress...')
      await store.runLLMFilter()
      
      const matchedCount = store.displayProfessors.filter(
        prof => prof.matchScore >= store.threshold
      ).length
      
      ElMessage.success({
        message: `Analysis complete! Found ${matchedCount} matching professors`,
        duration: 5000
      })
    } else {
      // No research direction - just show all loaded professors
      ElMessage.success({
        message: `Showing all ${store.candidateProfessors.length} professors. Add research direction to enable AI filtering.`,
        duration: 5000
      })
    }
  } catch (error) {
    ElMessage.error(`Analysis failed: ${error.message}`)
    console.error('Analysis error:', error)
  }
}

function handleReset() {
  store.resetLLMConfig()
  ElMessage.info('Configuration reset')
}
</script>

<style scoped>
.llm-config {
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

.char-count {
  text-align: right;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 4px;
}

.threshold-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.threshold-display span:first-child {
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 16px;
}

.threshold-desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

:deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  background: var(--el-fill-color-light);
  padding: 0 12px;
  border-radius: 4px;
}

:deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

:deep(.el-collapse-item__content) {
  padding: 12px 0;
}
</style>

