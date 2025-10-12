# GitHub 发布指南 / GitHub Publishing Guide

[中文](#中文) | [English](#english)

---

## 中文

### 📦 将 CSProfHunt 发布到 GitHub

本指南将帮助你将 CSProfHunt 项目发布到你的 GitHub 账户。

### 前置条件

1. 已安装 Git
2. 拥有 GitHub 账户（https://github.com/Tastal）
3. 已完成项目的所有修改

### 📝 发布步骤

#### 步骤 1：初始化 Git 仓库（如果还没有）

在项目根目录打开命令行，执行：

```bash
# 检查是否已经是 git 仓库
git status
```

如果显示错误（不是 git 仓库），执行：

```bash
# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 创建首次提交
git commit -m "Initial commit: CSProfHunt - AI-Powered Professor Discovery"
```

#### 步骤 2：在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `CSProfHunt`
   - **Description**: `AI-powered professor discovery tool based on CSRankings data`
   - **Visibility**: `Public`（推荐）或 `Private`
   - **不要勾选** "Add a README file"（我们已经有了）
   - **不要勾选** "Add .gitignore"（我们已经有了）
3. 点击 "Create repository"

#### 步骤 3：推送代码到 GitHub

在 GitHub 创建仓库后，页面会显示推送命令。执行以下命令：

```bash
# 添加远程仓库
git remote add origin https://github.com/Tastal/CSProfHunt.git

# 推送代码（首次推送）
git branch -M main
git push -u origin main
```

#### 步骤 4：验证上传

1. 刷新 GitHub 仓库页面
2. 确认文件已上传
3. 检查 README.md 是否正确显示

### ✅ 验证清单

确保以下内容已正确配置：

- [ ] `.gitignore` 包含 `CSRankings/` 目录（✓ 已配置）
- [ ] README.md 包含中英双语说明（✓ 已配置）
- [ ] 临时测试文件已删除（✓ 已清理）
- [ ] `package.json` 中的项目名为 `csprofhunt`（✓ 已更新）
- [ ] 所有代码注释和提交信息使用英文（✓ 请确认）

### 📋 重要说明

#### 关于 CSRankings 目录

- **CSRankings 目录不会被上传**到 GitHub（已在 `.gitignore` 中排除）
- 其他用户克隆你的仓库后，需要自行克隆 CSRankings：
  ```bash
  git clone --depth 1 https://github.com/emeryberger/CSRankings.git
  ```
- 这是正常的，因为：
  1. CSRankings 数据很大（几百 MB）
  2. 数据会定期更新
  3. 保持数据源的独立性

#### 关于生成的数据文件

- `public/data/*.json` 文件也不会被上传（已在 `.gitignore` 中排除）
- 用户运行 `start.bat` 时会自动生成这些文件

### 🔄 后续更新

当你需要更新 GitHub 仓库时：

```bash
# 添加修改的文件
git add .

# 提交更改
git commit -m "Update: describe your changes here"

# 推送到 GitHub
git push
```

### 🌐 设置 GitHub Pages（可选）

如果想要在线演示：

1. 构建生产版本：
   ```bash
   npm run build
   ```

2. 在 GitHub 仓库设置中：
   - 进入 Settings > Pages
   - Source 选择 "GitHub Actions"
   - 或上传 `dist` 目录到 `gh-pages` 分支

### 🎯 推荐的仓库设置

在 GitHub 仓库页面：

1. **About 部分**（右上角 ⚙️）：
   - Description: `AI-powered professor discovery tool based on CSRankings data`
   - Website: 如果有部署的话
   - Topics 添加：`vue`, `ai`, `csrankings`, `llm`, `professor`, `academic-research`

2. **README Badges**（可选，添加到 README.md 顶部）：
   ```markdown
   ![License](https://img.shields.io/badge/license-MIT-blue.svg)
   ![Vue](https://img.shields.io/badge/Vue-3.4-green.svg)
   ![Node](https://img.shields.io/badge/Node-18%2B-green.svg)
   ```

### 📞 获取帮助

如果遇到问题：

1. 检查 Git 配置：
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

2. 如果推送失败，可能需要设置 GitHub 认证：
   - 使用 Personal Access Token (推荐)
   - 或配置 SSH key

3. 查看 GitHub 文档：https://docs.github.com/

---

## English

### 📦 Publishing CSProfHunt to GitHub

This guide will help you publish the CSProfHunt project to your GitHub account.

### Prerequisites

1. Git installed
2. GitHub account (https://github.com/Tastal)
3. All project modifications completed

### 📝 Publishing Steps

#### Step 1: Initialize Git Repository (if not already done)

Open command line in the project root directory and run:

```bash
# Check if already a git repository
git status
```

If it shows an error (not a git repository), run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: CSProfHunt - AI-Powered Professor Discovery"
```

#### Step 2: Create Repository on GitHub

1. Visit https://github.com/new
2. Fill in repository information:
   - **Repository name**: `CSProfHunt`
   - **Description**: `AI-powered professor discovery tool based on CSRankings data`
   - **Visibility**: `Public` (recommended) or `Private`
   - **DO NOT check** "Add a README file" (we already have one)
   - **DO NOT check** "Add .gitignore" (we already have one)
3. Click "Create repository"

#### Step 3: Push Code to GitHub

After creating the repository on GitHub, the page will show push commands. Run:

```bash
# Add remote repository
git remote add origin https://github.com/Tastal/CSProfHunt.git

# Push code (first time)
git branch -M main
git push -u origin main
```

#### Step 4: Verify Upload

1. Refresh your GitHub repository page
2. Confirm files are uploaded
3. Check if README.md displays correctly

### ✅ Verification Checklist

Ensure the following are correctly configured:

- [ ] `.gitignore` includes `CSRankings/` directory (✓ Configured)
- [ ] README.md includes bilingual documentation (✓ Configured)
- [ ] Temporary test files removed (✓ Cleaned)
- [ ] Project name in `package.json` is `csprofhunt` (✓ Updated)
- [ ] All code comments and commit messages in English (✓ Please verify)

### 📋 Important Notes

#### About CSRankings Directory

- **CSRankings directory will NOT be uploaded** to GitHub (excluded in `.gitignore`)
- Users who clone your repository need to clone CSRankings separately:
  ```bash
  git clone --depth 1 https://github.com/emeryberger/CSRankings.git
  ```
- This is normal because:
  1. CSRankings data is large (several hundred MB)
  2. Data is updated regularly
  3. Maintains data source independence

#### About Generated Data Files

- `public/data/*.json` files will NOT be uploaded (excluded in `.gitignore`)
- Users will automatically generate these files when running `start.bat`

### 🔄 Subsequent Updates

When you need to update your GitHub repository:

```bash
# Add modified files
git add .

# Commit changes
git commit -m "Update: describe your changes here"

# Push to GitHub
git push
```

### 🌐 Setup GitHub Pages (Optional)

If you want an online demo:

1. Build production version:
   ```bash
   npm run build
   ```

2. In GitHub repository settings:
   - Go to Settings > Pages
   - Select "GitHub Actions" for Source
   - Or upload `dist` directory to `gh-pages` branch

### 🎯 Recommended Repository Settings

On your GitHub repository page:

1. **About section** (top right ⚙️):
   - Description: `AI-powered professor discovery tool based on CSRankings data`
   - Website: If deployed
   - Add topics: `vue`, `ai`, `csrankings`, `llm`, `professor`, `academic-research`

2. **README Badges** (optional, add to top of README.md):
   ```markdown
   ![License](https://img.shields.io/badge/license-MIT-blue.svg)
   ![Vue](https://img.shields.io/badge/Vue-3.4-green.svg)
   ![Node](https://img.shields.io/badge/Node-18%2B-green.svg)
   ```

### 📞 Getting Help

If you encounter issues:

1. Check Git configuration:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

2. If push fails, you may need to setup GitHub authentication:
   - Use Personal Access Token (recommended)
   - Or configure SSH key

3. Check GitHub documentation: https://docs.github.com/

---

**Good luck with your project! 🚀**

