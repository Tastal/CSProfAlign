<template>
  <div id="app">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <h1>🎓 CSProfHunt</h1>
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
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <div class="app-layout">
        <!-- Left Panel: Filters -->
        <aside class="left-panel">
          <FilterPanel />
        </aside>

        <!-- Center Panel: Results -->
        <section class="center-panel">
          <ProgressBar />
          <ResultList />
        </section>

        <!-- Right Panel: LLM Config -->
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
    <el-dialog v-model="helpVisible" title="How to Use CSProfHunt" width="600px">
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

          <el-step title="Step 3: Configure AI Matching (Optional)">
            <template #description>
              <p>
                In the right panel, select an LLM provider (OpenAI, Gemini, Claude, DeepSeek, or Local).
                Enter your API key (if using cloud services) and describe your research direction in detail.
              </p>
            </template>
          </el-step>

          <el-step title="Step 4: Run AI Analysis (Optional)">
            <template #description>
              <p>
                Adjust the matching threshold (0.6 recommended) and click "🚀 Start AI Analysis".
                The AI will evaluate each professor's alignment with your research interests.
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
          <li>Be specific in your research direction description for better matches</li>
          <li>Start with a lower threshold (0.5-0.6) to see more candidates</li>
          <li>Local models are free but slower than cloud APIs</li>
          <li>Processing time depends on the number of professors and LLM speed</li>
        </ul>
      </div>

      <template #footer>
        <el-button type="primary" @click="helpVisible = false">Got it!</el-button>
      </template>
    </el-dialog>
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
import { useAppStore } from './stores/appStore'

const store = useAppStore()
const helpVisible = ref(false)

onMounted(() => {
  // Show help on first visit
  const hasVisited = localStorage.getItem('csprofhunt-visited')
  if (!hasVisited) {
    helpVisible.value = true
    localStorage.setItem('csprofhunt-visited', 'true')
  }
})

function showHelp() {
  helpVisible.value = true
}

function openGithub() {
  window.open('https://github.com/Tastal/CSProfHunt', '_blank')
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
  overflow: hidden;
  padding: 20px;
}

.app-layout {
  max-width: 1600px;
  margin: 0 auto;
  height: 100%;
  display: grid;
  grid-template-columns: 320px 1fr 380px;
  gap: 20px;
}

.left-panel,
.right-panel {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.center-panel {
  height: 100%;
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
@media (max-width: 1400px) {
  .app-layout {
    grid-template-columns: 280px 1fr 340px;
  }
}

@media (max-width: 1200px) {
  .app-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
  }

  .left-panel,
  .right-panel {
    height: auto;
    max-height: 400px;
  }
}

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

