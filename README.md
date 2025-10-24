# CSProfAlign - AI-Powered Professor Discovery

**Language**: [English](#english) | [中文](#中文)

---

## English

### Overview

An intelligent platform for discovering professors whose research aligns with your interests. Uses LLMs (cloud APIs or local models) to analyze research profiles and match against your specified direction. Built on CSRankings database with CS professors worldwide.

### Key Features

- **AI-Powered Matching**: LLM-based evaluation of professor-research alignment
- **Flexible LLM Options**: Cloud APIs (OpenAI, DeepSeek) or local models (Qwen 0.5B/1.5B)
- **Multiple Data Sources**: CSRankings + DBLP + Google Scholar
- **Advanced Filtering**: Region, year range, venue, publication count
- **Two Scoring Methods**: Basic (direct) and Decision Tree (structured)
- **Batch Processing**: Efficient concurrent evaluation
- **Export Results**: CSV export with match scores and summaries

### Technology Stack

**Frontend**
- Vue 3 + Vite
- Element Plus UI
- Pinia (state management)
- Papa Parse (CSV processing)

**Backend (Optional, for local LLM)**
- Python 3.10+ + FastAPI
- vLLM (GPU-accelerated inference)
- Docker + Docker Compose

**Data Sources**
- CSRankings (professor database)
- DBLP API (publication metadata)
- Google Scholar (citation data)

**LLM Support**
- Cloud: OpenAI GPT-4, DeepSeek
- Local: 
  - Qwen 0.5B (Fast, 4GB VRAM)
  - Qwen 1.5B (Balanced, 8GB VRAM)
  - Qwen 2.5 7B (High accuracy, 16GB VRAM, INT8 quantized)

### Quick Start

#### 1. Clone Repository
```bash
git clone https://github.com/Tastal/CSProfAlign.git
cd CSProfAlign
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Start Application

**Option A: Cloud API (Recommended)**
```bash
# Windows
start.bat

# macOS/Linux
./start.sh
```
Then configure API key in settings.

**Option B: Local LLM**
```bash
# Start backend first
# Windows: start-backend.bat
# macOS/Linux: ./start-backend.sh

# Then start frontend
# Windows: start.bat
# macOS/Linux: ./start.sh
```

#### 4. Open Browser
Navigate to http://localhost:5173

**Note**: 
- Professor database and essential CSRankings files are included
- First run may download missing files from CSRankings GitHub
- Automatic update check on each start (downloads only if needed)

### Usage Guide

**Step 1: Filter Professors**
- Select regions (US, Europe, Asia, etc.)
- Set year range (2020-2025)
- Choose specific venues (optional)
- Click "Load Professors"

**Step 2: Configure LLM**
- **Cloud API**: Select provider → Enter API key
- **Local Model**: Load Qwen 0.5B or 1.5B
- Choose scoring method (Basic/Decision Tree)
- Set batch size and concurrency

**Step 3: Set Research Direction**
- Enter your research interests (detailed description recommended)
- Adjust match threshold (0.0-1.0, default: 0.6)

**Step 4: Run & Export**
- Click "Start AI Filtering"
- Monitor real-time progress
- Export matched results to CSV

### Scoring Methods

**Basic Method**
- Direct score evaluation (0.0-1.0)
- Fast, flexible
- Works well with all LLMs

**Decision Tree Method**
- Structured YES/NO questions
- More consistent across different LLMs
- Slower but higher inter-rater reliability

### LLM Configuration

**Cloud APIs (Primary Option)**
- **OpenAI GPT-4**: Best accuracy, $0.01-0.03 per professor
- **DeepSeek**: Good accuracy, $0.001 per professor
- **Setup**: API key only, no installation required
- **Speed**: 10 concurrent requests, ~5 min for 500 professors

**Local Models (Secondary Option)**
- **Qwen 0.5B**: Fast, basic accuracy, 4GB VRAM
- **Qwen 1.5B**: Balanced, 8GB VRAM
- **Setup**: Docker + GPU required
- **Speed**: 20 batch size, ~11 min for 500 professors

### Data Sources

**CSRankings Foundation**
- 19,000+ CS professors worldwide
- Publication venues classified into 24 research areas
- Data updated regularly from DBLP

**Hybrid Publication Fetching**
1. Local CSRankings data (fast, complete venue info)
2. DBLP API (real-time, recent papers)
3. Google Scholar fallback (comprehensive)

### Performance

| LLM Type | Setup Time | Processing Speed | Cost |
|----------|-----------|------------------|------|
| Cloud API | 1 min | ~5 min/500 profs | $0.5-15 |
| Local 0.5B | 10 min first time | ~8 min/500 profs | Free |
| Local 1.5B | 15 min first time | ~11 min/500 profs | Free |
| Local 7B | 20 min first time | ~18 min/500 profs | Free |

### Requirements

**Minimum**
- Node.js 18+
- 4GB RAM
- Internet connection

**For Local LLM**
- Docker Desktop
- NVIDIA GPU:
  - 0.5B model: 4GB VRAM
  - 1.5B model: 8GB VRAM
  - 7B model: 16GB VRAM (INT8 quantized)
- 16GB+ system RAM

### Project Structure

```
CSProfAlign/
├── src/                      # Vue.js frontend
│   ├── components/           # UI components
│   ├── services/            # Data & LLM services
│   └── stores/              # State management
├── backend/                 # Python vLLM backend (optional)
│   ├── server.py           # FastAPI app
│   ├── llm_engine.py       # vLLM wrapper
│   └── prompt_builder.py   # Prompt templates
├── public/
│   ├── data/               # Professor database
│   └── prompts/            # LLM prompt templates
├── docker-compose.yml      # Backend deployment
├── start.bat               # Frontend launcher (Windows)
├── start.sh                # Frontend launcher (Unix)
├── start-backend.bat       # Backend launcher (Windows)
└── start-backend.sh        # Backend launcher (Unix)
```

### Troubleshooting

**Frontend won't start**
- Check Node.js version: `node --version` (need 18+)
- Delete `node_modules` and run `npm install`

**Backend won't start**
- Ensure Docker is running: `docker info`
- **Port 8000 occupied:** Run `change-port.bat` to switch to another port (e.g., 8001)
- **Old containers running:** `docker ps -a`, then `docker stop <name>` and `docker rm <name>`
- View logs: `docker-compose logs -f`

**Port Configuration**
If port 8000 is in use:
```bat
# Windows - Quick fix
set BACKEND_PORT=8001
start-backend.bat

# Or use the configuration script
change-port.bat
```

See [PORT_CONFIG.md](PORT_CONFIG.md) for detailed instructions.

**Model loading fails**
- Check GPU memory: NVIDIA-smi (Windows/Linux) or Activity Monitor (macOS)
- Try smaller model (0.5B)
- Restart Docker: `docker-compose restart`

**CORS errors**
- DBLP API rate limiting (automatic fallback to local data)
- No action needed, system uses cached data

### Development

**Add new LLM provider**
1. Update `src/services/llmService.js`
2. Add provider to `LLMConfig.vue`

**Customize prompts**
- Cloud models: `public/prompts/basic-*.txt` or `decision-tree-*.txt`
- Local models: `public/prompts/local-*.txt` or `local-decision-tree-*.txt`

**Add new model to backend**
1. Edit `backend/llm_engine.py` → `AVAILABLE_MODELS`
2. Update `src/components/LLMConfig.vue` → model options

### License

MIT License

---

## 中文

### 简介

基于大语言模型的智能教授发现平台，帮助研究者找到与研究方向匹配的教授。支持云端API和本地模型，基于CSRankings的计算机科学教授数据库。

### 核心功能

- **AI智能匹配**: 使用LLM评估教授与研究方向的匹配度
- **灵活的LLM选项**: 云端API (OpenAI, DeepSeek) 或本地模型 (Qwen 0.5B/1.5B)
- **多数据源**: CSRankings + DBLP + Google Scholar
- **高级筛选**: 地区、年份、会议、发表数量
- **双评分方法**: Basic (直接评分) 和 Decision Tree (结构化评分)
- **批量处理**: 高效并发评估
- **结果导出**: CSV导出，包含匹配分数和摘要

### 技术栈

**前端**
- Vue 3 + Vite
- Element Plus UI组件
- Pinia 状态管理
- Papa Parse CSV处理

**后端 (可选，用于本地LLM)**
- Python 3.10+ + FastAPI
- vLLM GPU加速推理
- Docker + Docker Compose

**数据源**
- CSRankings 教授数据库
- DBLP API 论文元数据
- Google Scholar 引用数据

**LLM支持**
- 云端: OpenAI GPT-4, DeepSeek
- 本地: 
  - Qwen 0.5B (快速, 4GB显存)
  - Qwen 1.5B (平衡, 8GB显存)
  - Qwen 2.5 7B (高精度, 16GB显存, INT8量化)

### 快速开始

#### 1. 克隆仓库
```bash
git clone https://github.com/Tastal/CSProfAlign.git
cd CSProfAlign
```

#### 2. 安装依赖
```bash
npm install
```

#### 3. 启动应用

**方式A: 云端API (推荐)**
```bash
# Windows
start.bat

# macOS/Linux
./start.sh
```
然后在设置中配置API密钥。

**方式B: 本地LLM**
```bash
# 先启动后端
# Windows: start-backend.bat
# macOS/Linux: ./start-backend.sh

# 再启动前端
# Windows: start.bat
# macOS/Linux: ./start.sh
```

#### 4. 打开浏览器
访问 http://localhost:5173

**说明**: 
- 教授数据库和必需的CSRankings文件已包含
- 首次运行可能从CSRankings GitHub下载缺失文件
- 每次启动自动检查更新 (仅在需要时下载)

### 使用指南

**步骤1: 筛选教授**
- 选择地区 (美国、欧洲、亚洲等)
- 设置年份范围 (2020-2025)
- 选择特定会议 (可选)
- 点击"Load Professors"

**步骤2: 配置LLM**
- **云端API**: 选择提供商 → 输入API密钥
- **本地模型**: 加载Qwen 0.5B或1.5B
- 选择评分方法 (Basic/Decision Tree)
- 设置批处理大小和并发数

**步骤3: 设置研究方向**
- 输入研究兴趣 (建议详细描述)
- 调整匹配阈值 (0.0-1.0，默认: 0.6)

**步骤4: 运行并导出**
- 点击"Start AI Filtering"
- 实时监控进度
- 导出匹配结果为CSV

### 评分方法

**Basic方法**
- 直接评分 (0.0-1.0)
- 快速、灵活
- 适用于所有LLM

**Decision Tree方法**
- 结构化YES/NO问题
- 不同LLM间更一致
- 较慢但跨模型可靠性更高

### LLM配置

**云端API (主要选项)**
- **OpenAI GPT-4**: 最佳准确度，$0.01-0.03/教授
- **DeepSeek**: 良好准确度，$0.001/教授
- **配置**: 仅需API密钥，无需安装
- **速度**: 10并发请求，500教授约5分钟

**本地模型 (备选)**
- **Qwen 0.5B**: 快速，基础准确度，4GB显存
- **Qwen 1.5B**: 平衡，8GB显存
- **配置**: 需要Docker + GPU
- **速度**: 20批处理，500教授约11分钟

### 数据源

**CSRankings基础**
- 19,000+ 全球计算机科学教授
- 发表会议分为24个研究领域
- 数据定期从DBLP更新

**混合论文获取**
1. 本地CSRankings数据 (快速，完整会议信息)
2. DBLP API (实时，最新论文)
3. Google Scholar备用 (全面)

### 性能

| LLM类型 | 配置时间 | 处理速度 | 成本 |
|---------|---------|---------|------|
| 云端API | 1分钟 | ~5分钟/500教授 | $0.5-15 |
| 本地0.5B | 首次10分钟 | ~8分钟/500教授 | 免费 |
| 本地1.5B | 首次15分钟 | ~11分钟/500教授 | 免费 |
| 本地7B | 首次20分钟 | ~18分钟/500教授 | 免费 |

### 系统要求

**最低配置**
- Node.js 18+
- 4GB内存
- 互联网连接

**使用本地LLM需要**
- Docker Desktop
- NVIDIA GPU:
  - 0.5B模型: 4GB显存
  - 1.5B模型: 8GB显存
  - 7B模型: 16GB显存 (INT8量化)
- 16GB+系统内存

### 项目结构

```
CSProfAlign/
├── src/                      # Vue.js前端
│   ├── components/           # UI组件
│   ├── services/            # 数据和LLM服务
│   └── stores/              # 状态管理
├── backend/                 # Python vLLM后端 (可选)
│   ├── server.py           # FastAPI应用
│   ├── llm_engine.py       # vLLM包装器
│   └── prompt_builder.py   # 提示词模板
├── public/
│   ├── data/               # 教授数据库
│   └── prompts/            # LLM提示词模板
├── docker-compose.yml      # 后端部署
├── start.bat/.sh           # 前端启动器
└── start-backend.bat/.sh   # 后端启动器
```

### 故障排除

**前端无法启动**
- 检查Node.js版本: `node --version` (需要18+)
- 删除`node_modules`并重新`npm install`

**后端无法启动**
- 确保Docker运行中: `docker info`
- **端口8000被占用:** 运行`change-port.bat`切换到其他端口(如8001)
- **旧容器仍在运行:** `docker ps -a`，然后`docker stop <容器名>`和`docker rm <容器名>`
- 查看日志: `docker-compose logs -f`

**端口配置**
如果端口8000被占用:
```bat
# Windows - 快速修复
set BACKEND_PORT=8001
start-backend.bat

# 或使用配置脚本
change-port.bat
```

详细说明见[PORT_CONFIG.md](PORT_CONFIG.md)

**模型加载失败**
- 检查GPU内存: nvidia-smi (Windows/Linux) 或活动监视器 (macOS)
- 尝试更小模型 (0.5B)
- 重启Docker: `docker-compose restart`

**CORS错误**
- DBLP API限流 (自动回退到本地数据)
- 无需处理，系统使用缓存数据

### 开发

**添加新LLM提供商**
1. 更新`src/services/llmService.js`
2. 在`LLMConfig.vue`中添加提供商选项

**自定义提示词**
- 云端模型: `public/prompts/basic-*.txt` 或 `decision-tree-*.txt`
- 本地模型: `public/prompts/local-*.txt` 或 `local-decision-tree-*.txt`

**添加新模型到后端**
1. 编辑`backend/llm_engine.py` → `AVAILABLE_MODELS`
2. 更新`src/components/LLMConfig.vue` → 模型选项

### 许可证

MIT License