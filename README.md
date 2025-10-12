# CSProfHunt - AI-Powered Professor Discovery

[English](#english) | [中文](#中文)

---

## English

### 🎯 Overview

**CSProfHunt** is an intelligent professor discovery tool powered by AI, built on top of [CSRankings](https://csrankings.org) data. It helps researchers and students find the most suitable professors based on their research interests using advanced AI-powered matching.

### ✨ Key Features

#### 🔍 Smart Filtering
- **Geographic Selection**: Filter by country or continent
- **Time Range**: Publication records from 1970-2025
- **Research Areas**: Complete CSRankings field taxonomy
- **Real-time Search**: Search by name or institution

#### 🤖 AI-Powered Matching
- **Multiple LLM Support**: OpenAI, Gemini, Claude, DeepSeek
- **Local Model**: Transformers.js local inference support
- **Smart Scoring**: Matching scores based on research direction alignment
- **Batch Processing**: Efficient concurrent processing

#### 📊 Data Visualization
- **Card View**: Beautiful professor information cards
- **Table View**: Detailed data tables
- **Sort & Filter**: Sort by match score or publication count
- **Export**: Export results in CSV/JSON formats

### 🚀 Quick Start

#### Prerequisites
- **Node.js** 18+ (required)
- **Python** 3.7+ (required for data processing)
- **Git** (required for cloning CSRankings)

#### Installation

1. **Clone this repository**
```bash
git clone https://github.com/Tastal/CSProfHunt.git
cd CSProfHunt
```

2. **Clone CSRankings data** (not included in repository)
```bash
git clone --depth 1 https://github.com/emeryberger/CSRankings.git
```

3. **Run the application**

**Windows users**:
```bash
# Double-click or run:
start.bat
```

**Manual start** (all platforms):
```bash
npm install
npm run dev
```

The application will:
- Automatically check for CSRankings updates
- Load and process data if needed
- Start the development server at http://localhost:3000

### 📖 Usage Guide

#### Step 1: Filter Professors
1. Select a region (e.g., USA, Europe, Asia)
2. Set year range (e.g., 2020-2025)
3. Select research areas (optional)
4. Click "📊 Load Professors"

#### Step 2: Configure AI Matching
1. Choose an LLM provider (or use local model)
2. Enter your API key (if using cloud services)
3. Describe your research interests in detail
4. Adjust matching threshold (0.6 recommended)

#### Step 3: Run Analysis
1. Click "🚀 Start AI Analysis"
2. Wait for processing (depends on number of professors)
3. Review matched professors with scores
4. Export results if needed

### 🏗️ Technical Architecture

#### Frontend Stack
- **Vue 3** - Progressive JavaScript framework
- **Element Plus** - Vue 3 UI library
- **Pinia** - State management
- **Vite** - Next generation frontend tooling
- **ECharts** - Data visualization

#### Data Processing
- **Python** - CSRankings data preprocessing
- **Pandas** - Data manipulation
- **JSON** - Optimized data storage
- **Region-based splitting** - Efficient data loading

#### LLM Integration
- **Cloud APIs** - OpenAI, Gemini, Claude, DeepSeek
- **Local Inference** - Transformers.js support
- **Web Workers** - Background processing for better performance

### 📁 Project Structure

```
CSProfHunt/
├── src/                    # Source code
│   ├── components/         # Vue components
│   ├── services/          # Service layer (API, LLM)
│   ├── stores/            # State management (Pinia)
│   ├── utils/             # Utility functions
│   └── styles/            # Global styles
├── public/data/           # Professor data (generated)
├── scripts/               # Data processing scripts
├── CSRankings/            # CSRankings repository (not included)
├── start.bat              # Windows startup script
└── package.json           # Project configuration
```

### 🔧 Development

#### Development Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

#### Update CSRankings Data
```bash
# The start.bat script automatically checks for updates
# Or manually:
cd CSRankings
git pull
cd ..
python scripts/load-local-data.py
```

### 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### 📄 License

MIT License - See [LICENSE](LICENSE) file for details

Based on CSRankings data (Creative Commons licensed)

### 🙏 Acknowledgments

- [CSRankings](https://csrankings.org) - Data source
- [Emery Berger](https://github.com/emeryberger) - CSRankings creator

---

## 中文

### 🎯 项目简介

**CSProfHunt** 是一个基于 [CSRankings](https://csrankings.org) 数据的 AI 驱动的教授发现工具。它帮助研究人员和学生通过先进的 AI 匹配技术，根据研究兴趣找到最合适的教授。

### ✨ 核心功能

#### 🔍 智能筛选
- **地区选择**：支持按国家/大洲筛选
- **时间范围**：1970-2025 年论文发表记录
- **研究领域**：完整的 CSRankings 领域分类
- **实时搜索**：按姓名或机构搜索

#### 🤖 AI 智能匹配
- **多 LLM 支持**：OpenAI、Gemini、Claude、DeepSeek
- **本地模型**：支持 Transformers.js 本地推理
- **智能评分**：基于研究方向的匹配度评分
- **批量处理**：高效的并发处理

#### 📊 数据展示
- **卡片视图**：美观的教授信息卡片
- **表格视图**：详细的数据表格
- **排序筛选**：按匹配度、论文数量排序
- **数据导出**：CSV/JSON 格式导出

### 🚀 快速开始

#### 环境要求
- **Node.js** 18+ (必需)
- **Python** 3.7+ (数据处理必需)
- **Git** (克隆 CSRankings 必需)

#### 安装步骤

1. **克隆本仓库**
```bash
git clone https://github.com/Tastal/CSProfHunt.git
cd CSProfHunt
```

2. **克隆 CSRankings 数据**（不包含在本仓库中）
```bash
git clone --depth 1 https://github.com/emeryberger/CSRankings.git
```

3. **运行应用**

**Windows 用户**：
```bash
# 双击运行或命令行：
start.bat
```

**手动启动**（所有平台）：
```bash
npm install
npm run dev
```

应用会自动：
- 检查 CSRankings 更新
- 需要时加载和处理数据
- 在 http://localhost:3000 启动开发服务器

### 📖 使用指南

#### 第一步：筛选教授
1. 选择地区（如：USA、Europe、Asia）
2. 设置年份范围（如：2020-2025）
3. 选择研究领域（可选）
4. 点击 "📊 Load Professors"

#### 第二步：配置 AI 匹配
1. 选择 LLM 提供商（或使用本地模型）
2. 输入 API Key（如使用云服务）
3. 详细描述你的研究兴趣
4. 调整匹配阈值（推荐 0.6）

#### 第三步：运行分析
1. 点击 "🚀 Start AI Analysis"
2. 等待处理（取决于教授数量）
3. 查看匹配的教授及评分
4. 需要时导出结果

### 🏗️ 技术架构

#### 前端技术栈
- **Vue 3** - 渐进式 JavaScript 框架
- **Element Plus** - Vue 3 UI 组件库
- **Pinia** - 状态管理
- **Vite** - 下一代前端构建工具
- **ECharts** - 数据可视化

#### 数据处理
- **Python** - CSRankings 数据预处理
- **Pandas** - 数据处理
- **JSON** - 优化的数据存储
- **按地区分片** - 高效的数据加载

#### LLM 集成
- **云端 API** - OpenAI、Gemini、Claude、DeepSeek
- **本地推理** - Transformers.js 支持
- **Web Workers** - 后台处理提升性能

### 📁 项目结构

```
CSProfHunt/
├── src/                    # 源代码
│   ├── components/         # Vue 组件
│   ├── services/          # 服务层（API、LLM）
│   ├── stores/            # 状态管理（Pinia）
│   ├── utils/             # 工具函数
│   └── styles/            # 全局样式
├── public/data/           # 教授数据（生成的）
├── scripts/               # 数据处理脚本
├── CSRankings/            # CSRankings 仓库（不包含）
├── start.bat              # Windows 启动脚本
└── package.json           # 项目配置
```

### 🔧 开发

#### 开发命令
```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run preview      # 预览生产构建
```

#### 更新 CSRankings 数据
```bash
# start.bat 脚本会自动检查更新
# 或手动更新：
cd CSRankings
git pull
cd ..
python scripts/load-local-data.py
```

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

基于 CSRankings 数据（Creative Commons 许可）

### 🙏 致谢

- [CSRankings](https://csrankings.org) - 数据来源
- [Emery Berger](https://github.com/emeryberger) - CSRankings 创建者

---

**立即开始**：双击 `start.bat` 启动应用！ 🚀
