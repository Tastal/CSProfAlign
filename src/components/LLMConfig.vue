<template>
  <el-card class="llm-config" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="header-title">
          <el-icon><MagicStick /></el-icon>
          AI Analysis
        </span>
      </div>
    </template>

    <el-form label-position="top" size="default">
      <!-- Collapsible Configuration Groups -->
      <el-collapse v-model="activeCollapses" class="config-collapse">
        <!-- Group 1: LLM Provider -->
        <el-collapse-item name="provider" title="🔧 LLM Provider">
          <el-form-item label="Provider">
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
            <span>Local Model (vLLM Backend)</span>
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
        <!-- Backend Status -->
        <el-alert
          :type="backendStatus === 'connected' ? 'success' : 'error'"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template v-if="backendStatus === 'connected'">
            ✅ Backend Connected (localhost:8000)
          </template>
          <template v-else-if="backendStatus === 'checking'">
            ⏳ Checking backend status...
          </template>
          <template v-else>
            <div>
              ❌ Backend Not Running
              <div style="margin-top: 8px; font-size: 12px;">
                Please start Docker backend:
                <code style="display: block; margin-top: 4px; padding: 4px; background: var(--el-fill-color-light);">
                  start-backend.bat
                </code>
              </div>
            </div>
          </template>
        </el-alert>
        
        <el-form-item label="Model">
          <el-select
            v-model="selectedLocalModel"
            style="width: 100%"
            placement="bottom"
            @change="handleLocalModelChange"
            :disabled="backendStatus !== 'connected'"
          >
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            >
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span>{{ model.name }}</span>
                <el-tag size="small" type="info">{{ model.size }}</el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- Model Status Alert -->
        <el-alert
          v-if="backendStatus === 'connected'"
          :type="downloadAlertType"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <!-- Status 1: Ready to Load -->
          <template v-if="!store.localModelLoading && !store.localModelReady">
            <div class="model-info">
              <div><strong>Model:</strong> {{ selectedModelInfo.name }}</div>
              <div><strong>Size:</strong> {{ selectedModelInfo.size }}</div>
              <div><strong>VRAM:</strong> {{ selectedModelInfo.vram }}</div>
              <div style="margin-top: 8px; color: var(--el-color-warning); font-size: 12px;">
                First download may take 5-10 minutes
              </div>
            </div>
          </template>

          <!-- Status 2: Loading -->
          <template v-else-if="store.localModelLoading">
            <div class="downloading-status">
              <div style="margin-bottom: 8px;">
                <strong>📥 Loading Model...</strong>
              </div>
              <div style="font-size: 12px; color: var(--el-text-color-secondary);">
                This may take a few minutes on first load while downloading from HuggingFace...
              </div>
            </div>
          </template>

          <!-- Status 3: Ready -->
          <template v-else-if="store.localModelReady">
            <div class="model-ready">
              ✅ <strong>Model Loaded</strong>
              <div style="margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary);">
                Batch processing: 20 professors at a time (GPU-accelerated)
              </div>
            </div>
          </template>
        </el-alert>

        <!-- Load/Unload Model Buttons -->
        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
          <el-button
            v-if="!store.localModelReady"
            type="primary"
            :loading="store.localModelLoading"
            @click="handleLoadLocalModel"
            :disabled="backendStatus !== 'connected'"
            style="flex: 1;"
          >
            {{ store.localModelLoading ? 'Loading...' : 'Load Model' }}
          </el-button>
          <el-button
            v-if="store.localModelReady"
            type="success"
            style="flex: 1;"
            disabled
          >
            ✅ Ready
          </el-button>
          <el-button
            v-if="store.localModelReady"
            type="danger"
            @click="handleUnloadModel"
            :disabled="store.isProcessing"
          >
            Unload
          </el-button>
        </div>
      </div>
        </el-collapse-item>

        <!-- Group 2: Research Criteria -->
        <el-collapse-item name="criteria" title="🎯 Research Criteria">
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
      <el-form-item>
        <template #label>
          <span>
            Matching Threshold
            <el-tooltip placement="top" effect="dark">
              <template #content>
                <div style="max-width: 300px">
                  Minimum match score to include professors in results.<br/>
                  Lower threshold = more results, but less relevant.<br/>
                  Higher threshold = fewer results, but more precise.
                </div>
              </template>
              <el-icon style="margin-left: 4px; cursor: help;">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </span>
        </template>
        <div class="slider-container">
          <el-slider
            v-model="store.threshold"
            :min="0"
            :max="1"
            :step="0.05"
            :marks="thresholdMarks"
            show-stops
          />
        </div>
        <div class="threshold-display">
          <span class="threshold-value">{{ store.threshold.toFixed(2) }}</span>
          <span class="threshold-desc">{{ getThresholdDescription() }}</span>
        </div>
          </el-form-item>
        </el-collapse-item>

        <!-- Group 3: Analysis Methods -->
        <el-collapse-item name="methods" title="⚙️ Analysis Methods">
          <el-form-item>
        <template #label>
          <span>
            Scoring Method
            <el-tooltip placement="top" effect="dark">
              <template #content>
                <div style="max-width: 300px">
                  <strong>Basic:</strong> Direct 0.0-1.0 score. Simple and fast, but may vary by LLM.<br/><br/>
                  <strong>Decision Tree:</strong> Uses YES/NO questions for objective evaluation. 95% consistency across LLMs.
                </div>
              </template>
              <el-icon style="margin-left: 4px; cursor: help;">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-select v-model="store.scoringScheme" style="width: 100%">
          <el-option label="Basic" value="original">
            <div style="padding: 4px 0;">
              <div style="font-weight: 500;">Basic</div>
              <small style="color: var(--el-color-info); font-size: 12px;">
                Direct 0-1 score (may vary by LLM)
              </small>
            </div>
          </el-option>
          <el-option label="Decision Tree" value="decision_tree">
            <div style="padding: 4px 0;">
              <div style="font-weight: 500;">Decision Tree</div>
              <small style="color: var(--el-color-success); font-size: 12px;">
                95% consistency across LLMs
              </small>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- Publication Data Source -->
      <el-form-item>
        <template #label>
          <span>
            Publication Data Source
            <el-tooltip placement="top" effect="dark">
              <template #content>
                <div style="max-width: 350px">
                  <strong>Hybrid (Recommended):</strong> Uses DBLP API to fetch real paper titles for 90%+ professors. Smart school matching. Processing time: ~15-25 min for 1000 professors.<br/><br/>
                  <strong>Scholar Scraper:</strong> Original method scraping Google Scholar. Slower and less stable.
                </div>
              </template>
              <el-icon style="margin-left: 4px; cursor: help;">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </span>
        </template>
        <el-select 
          v-model="store.publicationSource" 
          style="width: 100%"
          placeholder="Select publication data source"
        >
          <el-option label="Hybrid (CSRankings + DBLP)" value="hybrid">
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
              <span>Hybrid (CSRankings + DBLP)</span>
              <el-tag size="small" type="success" style="margin-left: 8px">Recommended</el-tag>
            </div>
          </el-option>
          <el-option label="Scholar Scraper (Original)" value="scholar">
            <span>Scholar Scraper (Original)</span>
          </el-option>
        </el-select>
          </el-form-item>
        </el-collapse-item>

        <!-- Group 4: Advanced Settings -->
        <el-collapse-item name="advanced" title="🔬 Advanced Settings">
          <el-form-item>
            <template #label>
              <span>
                LLM Requests
                <el-tag v-if="recommendedBatchSize" size="small" type="success" style="margin-left: 8px">
                  Recommended: {{ recommendedBatchSize }}
                </el-tag>
                <el-tooltip placement="top" effect="dark">
                  <template #content>
                    <div style="max-width: 300px">
                      Number of professors processed simultaneously.<br/>
                      Higher concurrency = faster processing, but may hit API rate limits.<br/>
                      <span v-if="recommendedBatchSize">Auto-adjusted based on selected model.</span>
                      <span v-else>Recommended: 10-20 for most APIs.</span>
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: help;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </span>
            </template>
            <div class="slider-container">
              <el-slider
                v-model="store.maxWorkers"
                :min="1"
                :max="50"
                :step="1"
                show-stops
                :marks="{ 1: '1', 10: '10', 20: '20', 30: '30', 50: '50' }"
              />
            </div>
            <div class="setting-value">
              <span class="setting-number">{{ store.maxWorkers }}</span>
              <span class="setting-desc">professors processed simultaneously</span>
              <br>
              <small style="color: var(--el-color-info); margin-top: 4px; display: block;">
                Est. time for 3000 profs: ~{{ estimateTime(3000) }}
              </small>
            </div>
          </el-form-item>

          <el-form-item>
            <template #label>
              <span>
                Max Papers to Consider
                <el-tooltip placement="top" effect="dark">
                  <template #content>
                    <div style="max-width: 300px">
                      Maximum number of recent papers to analyze per professor.<br/>
                      More papers = more accurate, but slower processing.
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: help;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-input-number
              v-model="store.maxPapers"
              :min="5"
              :max="50"
              style="width: 100%"
            />
          </el-form-item>

          <!-- DBLP API Concurrency (only show when using DBLP) -->
          <el-form-item 
            v-if="store.publicationSource === 'hybrid' || store.publicationSource === 'dblp-priority'"
          >
            <template #label>
              <span>
                DBLP API Concurrency
                <el-tooltip placement="top" effect="dark">
                  <template #content>
                    <div style="max-width: 300px">
                      Number of DBLP API requests simultaneously.<br/>
                      Recommended: 2-3 for stable performance.<br/>
                      <strong>Warning:</strong> Higher values (4-5) may trigger rate limits 
                      when processing 1000+ professors in a single batch.
                    </div>
                  </template>
                  <el-icon style="margin-left: 4px; cursor: help;">
                    <QuestionFilled />
                  </el-icon>
                </el-tooltip>
              </span>
            </template>
            <div class="slider-container">
              <el-slider
                v-model="store.dblpConcurrency"
                :min="1"
                :max="5"
                :step="1"
                :marks="{ 1: '1', 2: '2', 3: '3', 5: '5' }"
              />
            </div>
            <div class="setting-value">
              <span class="setting-number">{{ store.dblpConcurrency }}</span>
              <span class="setting-desc">DBLP requests simultaneously</span>
            </div>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>

      <!-- Run Button -->
      <el-form-item style="margin-top: 24px">
        <el-button
          :type="buttonHovered && store.isProcessing ? 'danger' : 'primary'"
          size="large"
          :loading="store.loading && !store.isProcessing"
          :disabled="!canRunAnalysis && !store.isProcessing"
          @click="store.isProcessing ? handleStopProcessing() : handleRunAnalysis()"
          @mouseenter="buttonHovered = true"
          @mouseleave="buttonHovered = false"
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
          style="margin-top: 12px; font-size: 13px; text-align: center;"
          class="status-alert"
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
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, InfoFilled, MagicStick } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/appStore'
import { backendLLM } from '@/services/backendLLM'

const store = useAppStore()

const activeCollapse = ref([]) // For Advanced Settings
const activeCollapses = ref([]) // For main config groups
const selectedLocalModel = ref('qwen-1.5b')
const localModelProgress = ref(0)
const downloadMessage = ref('Initializing...')
const downloadDevice = ref('')
const currentLoadedModel = ref('')
const buttonHovered = ref(false)

// Backend status
const backendStatus = ref('checking')
const availableModels = ref([])

// Computed: Recommended batch size for current model
const recommendedBatchSize = computed(() => {
  if (store.llmProvider === 'local') {
    const model = availableModels.value.find(m => m.id === selectedLocalModel.value)
    return model?.recommended_batch_size || null
  }
  return null
})

// Watch for provider changes and check backend
watch(() => store.llmProvider, async (newProvider) => {
  if (newProvider === 'local') {
    await checkBackendStatus()
  }
})

// Watch for local model selection changes - auto-adjust batch size
watch(selectedLocalModel, (newModel) => {
  const modelInfo = availableModels.value.find(m => m.id === newModel)
  if (modelInfo && modelInfo.recommended_batch_size) {
    store.maxWorkers = modelInfo.recommended_batch_size
    ElMessage.info({
      message: `Batch size auto-adjusted to ${modelInfo.recommended_batch_size} for ${modelInfo.name}`,
      duration: 2000
    })
  }
})

// Check backend health on mount if already selected
onMounted(async () => {
  if (store.llmProvider === 'local') {
    await checkBackendStatus()
  }
  
  // Auto-expand provider panel if not configured
  if (!store.llmApiKey && store.llmProvider !== 'local') {
    activeCollapses.value = ['provider']
  }
})

async function checkBackendStatus() {
  backendStatus.value = 'checking'
  
  try {
    console.log('Checking backend health at http://localhost:8000/health')
    const healthy = await backendLLM.checkHealth()
    console.log('Backend health check result:', healthy)
    
    backendStatus.value = healthy ? 'connected' : 'disconnected'
    
    if (healthy) {
      console.log('Fetching available models...')
      const models = await backendLLM.getAvailableModels()
      console.log('Available models:', models)
      availableModels.value = models
      
      // Set default model if available
      if (models.length > 0 && !selectedLocalModel.value) {
        selectedLocalModel.value = models[0].id
      }
    }
  } catch (error) {
    console.error('Backend check failed:', error)
    backendStatus.value = 'disconnected'
  }
}

const thresholdMarks = {
  0: '0.0',
  0.3: 'Low',
  0.6: 'Medium',
  0.9: 'High',
  1: '1.0'
}

// Computed: Selected model info
const selectedModelInfo = computed(() => {
  return availableModels.value.find(m => m.id === selectedLocalModel.value) || 
         availableModels.value[0] || 
         { name: 'Qwen 1.5B', size: '1.5GB', description: 'Higher accuracy' }
})

// Computed: Download alert type  
const downloadAlertType = computed(() => {
  if (backendStatus.value === 'disconnected') return 'error'
  if (store.localModelReady) return 'success'
  if (store.localModelLoading) return 'warning'
  return 'info'
})

const canRunAnalysis = computed(() => {
  // Can always run to load professors
  // LLM filtering is optional
  return true
})

function getButtonText() {
  if (store.loading) return 'Loading Data...'
  if (store.isProcessing) {
    return buttonHovered.value ? '⏹ Stop Processing' : '⏳ AI Filtering...'
  }
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

function estimateTime(totalProfs) {
  // Estimate based on concurrent requests
  // Assume each API call takes ~1.5 seconds on average
  const avgTimePerRequest = 1.5 // seconds
  const workers = store.maxWorkers
  
  const totalBatches = Math.ceil(totalProfs / workers)
  const totalSeconds = totalBatches * avgTimePerRequest
  
  if (totalSeconds < 60) {
    return `${Math.ceil(totalSeconds)}s`
  } else if (totalSeconds < 3600) {
    const mins = Math.ceil(totalSeconds / 60)
    return `${mins} min`
  } else {
    const hours = Math.floor(totalSeconds / 3600)
    const mins = Math.ceil((totalSeconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }
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
    downloadMessage.value = 'Initializing download...'
    downloadDevice.value = ''
    
    await store.loadLocalModel(selectedLocalModel.value, (progress) => {
      localModelProgress.value = progress.progress || 0
      
      // Update download message
      if (progress.progress < 20) {
        downloadMessage.value = 'Initializing...'
      } else if (progress.progress < 40) {
        downloadMessage.value = 'Downloading...'
      } else if (progress.progress < 60) {
        downloadMessage.value = 'Loading tokenizer...'
      } else if (progress.progress < 80) {
        downloadMessage.value = 'Processing...'
      } else if (progress.progress < 100) {
        downloadMessage.value = 'Finalizing...'
      } else {
        downloadMessage.value = 'Complete'
      }
      
      if (progress.device) {
        downloadDevice.value = progress.device
      }
      
      if (progress.model) {
        currentLoadedModel.value = progress.model
      }
    })
    
    ElMessage.success('Model loaded successfully!')
  } catch (error) {
    console.error('Model load error:', error)
    ElMessage.error({
      message: `Failed to load model: ${error.message}`,
      duration: 5000
    })
  }
}

async function handleUnloadModel() {
  try {
    await ElMessageBox.confirm(
      'This will unload the model and free memory. You will need to reload it to use again.',
      'Unload Local Model',
      {
        confirmButtonText: 'Unload',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    await store.unloadLocalModel()
    
    ElMessage.success('Model unloaded and memory freed')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error unloading model:', error)
      ElMessage.error('Failed to unload model')
    }
  }
}

function handleLocalModelChange() {
  store.localModelReady = false
  currentLoadedModel.value = ''
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

function handleStopProcessing() {
  ElMessageBox.confirm(
    'Are you sure you want to stop the AI analysis? Progress will be lost.',
    'Stop Processing',
    {
      confirmButtonText: 'Stop',
      cancelButtonText: 'Continue',
      type: 'warning'
    }
  ).then(() => {
    // User confirmed - stop processing
    store.stopLLMFilter()
    ElMessage.warning('Processing stopped by user')
  }).catch(() => {
    // User clicked "Continue" - do nothing
  })
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

.slider-container {
  width: 85%;
  margin: 0 auto;
  padding: 0 12px;
}

.threshold-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  gap: 16px;
}

.threshold-value {
  color: var(--el-color-primary);
  font-weight: 600;
  font-size: 16px;
  min-width: 45px;
  text-align: left;
}

.threshold-desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  flex: 1;
}

.setting-value {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  text-align: center;
}

.setting-number {
  color: var(--el-color-primary);
  font-weight: 700;
  font-size: 18px;
  margin-right: 12px;
}

.setting-desc {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

:deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

/* Configuration collapse panels */
.config-collapse {
  border: none !important;
  margin-bottom: 12px;
}

.config-collapse :deep(.el-collapse-item) {
  margin-bottom: 6px;
}

.config-collapse :deep(.el-collapse-item__header) {
  background: #e8eaf0 !important;  /* Darker background */
  padding: 8px 12px !important;  /* 60% of original */
  border-radius: 6px;
  margin-bottom: 0 !important;
  font-weight: 600;
  font-size: 13px !important;  /* Slightly smaller */
  transition: background 0.2s;
  min-height: 32px !important;  /* Reduce height */
  height: auto !important;
  line-height: 1.4 !important;
}

.config-collapse :deep(.el-collapse-item__header:hover) {
  background: #d8dae5 !important;  /* Darker hover */
}

.config-collapse :deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

.config-collapse :deep(.el-collapse-item__content) {
  padding: 10px 6px !important;  /* 60% of original */
}

.config-collapse :deep(.el-form-item) {
  margin-bottom: 12px !important;  /* Reduce form item spacing */
}

.config-collapse :deep(.el-form-item__label) {
  margin-bottom: 6px !important;
  font-size: 13px !important;
}

.config-collapse :deep(.el-input),
.config-collapse :deep(.el-select),
.config-collapse :deep(.el-textarea) {
  font-size: 13px !important;
}

.config-collapse :deep(.el-input__inner),
.config-collapse :deep(.el-select__wrapper) {
  height: 32px !important;  /* Smaller input height */
}

.config-collapse :deep(.el-button) {
  height: 32px !important;
  font-size: 13px !important;
  padding: 8px 15px !important;
}

.config-collapse :deep(.el-alert) {
  padding: 8px 12px !important;
  font-size: 12px !important;
}

.config-collapse :deep(.el-alert__title) {
  font-size: 12px !important;
}

/* Old Advanced Settings collapse (inside config-collapse now) */
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

/* Model info styles */
.model-info div {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.6;
}

.downloading-status {
  width: 100%;
}

.model-ready {
  font-size: 14px;
  line-height: 1.6;
}

/* Status alert centering */
.status-alert :deep(.el-alert__title) {
  text-align: center !important;
  width: 100%;
}
</style>

