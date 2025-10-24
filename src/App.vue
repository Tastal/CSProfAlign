<template>
  <div id="app">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <h1>🎓 CSProfAlign</h1>
          <span class="tagline">AI-Powered Professor Discovery</span>
        </div>
        
        <div class="header-actions">
          <el-tooltip content="Help Guide" placement="bottom">
            <el-button :icon="QuestionFilled" circle @click="showHelp" />
          </el-tooltip>
          <el-tooltip content="GitHub Repository" placement="bottom">
            <el-button
              circle
              @click="openGithub"
            >
              <span style="font-size: 18px">📚</span>
            </el-button>
          </el-tooltip>
          <el-tooltip content="Debug Console" placement="bottom">
            <el-button circle @click="showDebugConsole">
              <span style="font-size: 18px">📊</span>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <div class="app-layout">
        <!-- Left Panel: Searching Scope -->
        <aside class="left-panel">
          <FilterPanel />
        </aside>

        <!-- Center Panel: Results -->
        <section class="center-panel">
          <ProgressBar />
          <ResultList />
        </section>

        <!-- Right Panel: AI Analysis -->
        <aside class="right-panel">
          <LLMConfig />
        </aside>
      </div>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <p>
        Data source:
        <a href="https://csrankings.org" target="_blank">CSRankings</a>
        | Built with Vue 3 + Element Plus
      </p>
    </footer>

    <!-- Help Dialog -->
    <el-dialog v-model="helpVisible" title="How to Use CSProfAlign" width="600px">
      <div class="help-content">
        <el-steps direction="vertical" :active="0">
          <el-step title="Step 1: Select Filters">
            <template #description>
              <p>
                In the left panel, select regions, set time range (e.g., 2020-2025), 
                and optionally choose research areas. Click "📊 Load Professors" to fetch data.
              </p>
            </template>
          </el-step>

          <el-step title="Step 2: Review Professor List">
            <template #description>
              <p>
                Browse the loaded professors in the center panel. 
                You can search, sort, and view their basic information and publication records.
              </p>
            </template>
          </el-step>

          <el-step title="Step 3: Configure LLM">
            <template #description>
              <p>
                <strong>Cloud API (Recommended):</strong> Select provider (OpenAI/DeepSeek) → Enter API key<br>
                <strong>Local Model:</strong> Select "Local" → Load Qwen 0.5B/1.5B<br>
                Enter your research direction in detail.
              </p>
            </template>
          </el-step>

          <el-step title="Step 4: Run AI Filtering">
            <template #description>
              <p>
                Adjust threshold (0.6 default), choose scoring method (Basic/Decision Tree),
                then click "🚀 Start AI Filtering" to evaluate professors.
              </p>
            </template>
          </el-step>

          <el-step title="Step 5: Export Results">
            <template #description>
              <p>
                View matched professors with AI scores, visit their homepages, 
                and export results in CSV or JSON format as needed.
              </p>
            </template>
          </el-step>
        </el-steps>

        <el-divider />

        <h3>Tips</h3>
        <ul>
          <li><strong>Research Direction:</strong> Be specific for better matches (describe techniques, topics, applications)</li>
          <li><strong>Threshold:</strong> Start at 0.6, lower to 0.5 for more results, raise to 0.7+ for precision</li>
          <li><strong>Cloud vs Local:</strong> Cloud API is faster/better, Local is free/offline</li>
          <li><strong>Scoring Method:</strong> Basic is fast, Decision Tree is more consistent</li>
        </ul>
      </div>

      <template #footer>
        <el-button type="primary" @click="helpVisible = false">Got it!</el-button>
      </template>
    </el-dialog>

    <!-- Debug Console -->
    <DebugConsole ref="debugConsole" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import FilterPanel from './components/FilterPanel.vue'
import LLMConfig from './components/LLMConfig.vue'
import ProgressBar from './components/ProgressBar.vue'
import ResultList from './components/ResultList.vue'
import DebugConsole from './components/DebugConsole.vue'
import { useAppStore } from './stores/appStore'

const store = useAppStore()
const helpVisible = ref(false)
const debugConsole = ref(null)

onMounted(() => {
  // Show help on first visit
  const hasVisited = localStorage.getItem('csprofalign-visited')
  if (!hasVisited) {
    helpVisible.value = true
    localStorage.setItem('csprofalign-visited', 'true')
  }
})

function showHelp() {
  helpVisible.value = true
}

function showDebugConsole() {
  debugConsole.value.show()
}

function openGithub() {
  window.open('https://github.com/Tastal/CSProfAlign', '_blank')
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', Arial, sans-serif;
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Header */
.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.tagline {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* Main */
.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
}

.app-layout {
  max-width: 1600px;
  margin: 0 auto;
  min-height: 100%;
  display: grid;
  grid-template-columns: 320px 1fr 380px;
  gap: 20px;
}

.left-panel,
.right-panel {
  height: fit-content;
  min-height: 400px;
  overflow-y: visible;
  overflow-x: hidden;
}

.center-panel {
  height: 100%;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Footer */
.app-footer {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.app-footer a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}

/* Help Dialog */
.help-content {
  padding: 12px;
}

.help-content h3 {
  margin: 16px 0 12px 0;
  color: var(--el-text-color-primary);
}

.help-content ul {
  padding-left: 24px;
}

.help-content li {
  margin: 8px 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

/* Responsive */
/* Large screens (>1600px) */
@media (min-width: 1601px) {
  .app-layout {
    grid-template-columns: 340px 1fr 400px;
  }
}

/* Medium screens (1200-1600px) */
@media (max-width: 1600px) {
  .app-layout {
    grid-template-columns: 300px 1fr 360px;
  }
}

/* Small screens (900-1200px) */
@media (max-width: 1200px) {
  .app-layout {
    grid-template-columns: 280px 1fr 320px;
  }
}

/* Tablet (768-900px) - Single column layout */
@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
  }

  .left-panel,
  .right-panel {
    max-height: none;
  }

  /* Adjust order: Filter -> LLM Config -> Results */
  .left-panel {
    order: 1;
  }
  .right-panel {
    order: 2;
  }
  .center-panel {
    order: 3;
  }
}

/* Mobile (<768px) */
@media (max-width: 768px) {
  .app-main {
    padding: 12px;
  }

  .app-layout {
    gap: 12px;
  }

  .header-content {
    padding: 12px 16px;
  }

  .logo h1 {
    font-size: 24px;
  }
}
</style>

