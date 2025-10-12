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
- **Binary Decision Tree Scoring**: 95%+ consistency across different LLMs
- **Research Direction Summary**: AI-generated precise research focus descriptions
- **Parallel Processing**: 10-50x faster with concurrent requests (20-50 concurrent)

#### 📊 Data Visualization
- **Card View**: Beautiful professor information cards with research summaries
- **Table View**: Detailed data tables
- **Pagination**: Browse unlimited results (200 per page)
- **Sort & Filter**: Sort by match score or publication count
- **Floating Export Button**: One-click export in CSV/JSON formats

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

### 🌟 Highlighted Features

#### Binary Decision Tree Scoring
The recommended scoring method that ensures **95%+ consistency** across different LLMs:
- Uses 5 objective YES/NO questions instead of subjective numerical ratings
- Automatically corrects scores to match decision paths
- Works identically on DeepSeek, GPT-4, Claude, and Gemini
- Eliminates the problem where different LLMs give different scores for the same professor

#### AI-Generated Research Summaries
Each professor gets a precise, 30-50 word research direction summary:
- Example: *"Physics-informed neural networks for fluid temperature reconstruction, real-time fluid simulation optimization, crowd simulation and physics simulation acceleration (recurrent neural networks, fluid carving, linear octree structures, motion capture)"*
- Displayed on professor cards under "Research Focus"
- Exported to CSV in the "Areas" column
- Much more informative than simple venue lists

#### Ultra-Fast Parallel Processing
Process thousands of professors in minutes, not hours:
- **3000 professors with 10 concurrent requests**: ~7.5 minutes
- **3000 professors with 20 concurrent requests**: ~3.8 minutes
- **3000 professors with 30 concurrent requests**: ~2.5 minutes
- Configurable concurrency (1-50) in Performance Settings

### 📖 Usage Guide

#### Step 1: Filter Professors
1. Select a region (e.g., USA, Europe, Asia)
2. Set year range (e.g., 2020-2025)
3. Select research areas (optional)
4. Click "📊 Load Professors"

#### Step 2: Configure AI Matching
1. Choose an LLM provider (or use local model)
2. Enter your API key (if using cloud services)
3. Select scoring method:
   - **Binary Decision Tree** (Recommended): 95% consistency across LLMs
   - **Original**: Direct scoring (may vary by LLM)
4. Describe your research interests in detail
5. Adjust matching threshold (0.6 recommended)
6. Set concurrent requests (10-50) for faster processing

#### Step 3: Run Analysis
1. Click "🚀 Start AI Analysis"
2. Watch real-time progress (parallel processing)
3. Review matched professors with AI-generated research summaries
4. Use floating export button (bottom-right) to download results
5. Browse all results with pagination (200 per page)

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
- **二元决策树评分**：跨 LLM 95%+ 一致性保证
- **研究方向摘要**：AI 生成精准的研究方向描述
- **并行处理**：10-50 倍速度提升（支持 20-50 并发请求）

#### 📊 数据展示
- **卡片视图**：美观的教授信息卡片，显示研究方向摘要
- **表格视图**：详细的数据表格
- **分页功能**：浏览所有结果（每页 200 名）
- **排序筛选**：按匹配度、论文数量排序
- **悬浮导出按钮**：一键导出 CSV/JSON 格式

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

### 🌟 特色亮点

#### 二元决策树评分
推荐的评分方法，确保跨 LLM **95%+ 一致性**：
- 使用 5 个客观的 YES/NO 问题，而非主观的数值评分
- 自动校正分数以匹配决策路径
- 在 DeepSeek、GPT-4、Claude 和 Gemini 上表现一致
- 消除了不同 LLM 对同一教授给出不同分数的问题

#### AI 生成的研究方向摘要
每位教授都获得精准的 30-50 词研究方向摘要：
- 示例：*"Physics-informed neural networks for fluid temperature reconstruction, real-time fluid simulation optimization, crowd simulation and physics simulation acceleration (recurrent neural networks, fluid carving, linear octree structures, motion capture)"*
- 显示在教授卡片的 "Research Focus" 部分
- 导出到 CSV 的 "Areas" 列
- 比简单的会议列表更具信息量

#### 超快并行处理
几分钟内处理数千名教授，而非数小时：
- **3000 名教授 @ 10 并发**：约 7.5 分钟
- **3000 名教授 @ 20 并发**：约 3.8 分钟
- **3000 名教授 @ 30 并发**：约 2.5 分钟
- 可在 Performance Settings 中配置并发数（1-50）

### 📖 使用指南

#### 第一步：筛选教授
1. 选择地区（如：USA、Europe、Asia）
2. 设置年份范围（如：2020-2025）
3. 选择研究领域（可选）
4. 点击 "📊 Load Professors"

#### 第二步：配置 AI 匹配
1. 选择 LLM 提供商（或使用本地模型）
2. 输入 API Key（如使用云服务）
3. 选择评分方法：
   - **Binary Decision Tree**（推荐）：跨 LLM 95% 一致性
   - **Original**：直接评分（可能因 LLM 而异）
4. 详细描述你的研究兴趣
5. 调整匹配阈值（推荐 0.6）
6. 设置并发请求数（10-50）以加快处理速度

#### 第三步：运行分析
1. 点击 "🚀 Start AI Analysis"
2. 观察实时处理进度（并行处理）
3. 查看匹配的教授及 AI 生成的研究方向摘要
4. 使用悬浮导出按钮（右下角）下载结果
5. 使用分页浏览所有结果（每页 200 名）

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
