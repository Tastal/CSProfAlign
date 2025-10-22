# 提示词管理 / Prompt Management

## 📂 文件结构

```
public/prompts/
├── README.md                           # 本说明文档
├── basic-user-prompt.txt               # Basic 方法用户提示词
├── basic-system-prompt.txt             # Basic 方法系统提示词
├── decision-tree-user-prompt.txt       # Decision Tree 方法用户提示词
└── decision-tree-system-prompt.txt     # Decision Tree 方法系统提示词
```

---

## 📝 提示词说明

### 1. Basic Method (基础方法)

#### `basic-user-prompt.txt`
- **用途**：发送给 LLM 的主要提示词，包含教授信息和评分任务
- **变量**：
  - `{{professor.name}}` - 教授姓名
  - `{{professor.affiliation}}` - 学校
  - `{{professor.areas}}` - 研究领域列表
  - `{{publications}}` - 近期论文列表
  - `{{researchDirection}}` - 用户输入的研究方向

#### `basic-system-prompt.txt`
- **用途**：系统级指令，告诉 LLM 它的角色和规则
- **无变量**：纯文本，直接使用

---

### 2. Decision Tree Method (决策树方法)

#### `decision-tree-user-prompt.txt`
- **用途**：包含 5 个 YES/NO 问题的提示词
- **变量**：与 Basic 方法相同
  - `{{professor.name}}`
  - `{{professor.affiliation}}`
  - `{{professor.areas}}`
  - `{{publications}}`
  - `{{researchDirection}}`

#### `decision-tree-system-prompt.txt`
- **用途**：强调客观性和一致性的系统指令
- **无变量**：纯文本，直接使用

---

## ✏️ 如何修改提示词

### 方法1：直接编辑文本文件（推荐）
1. 用任意文本编辑器打开对应的 `.txt` 文件
2. 修改提示词内容
3. 保存文件
4. 刷新浏览器（Ctrl+Shift+R）
5. 提示词会自动重新加载

### 方法2：在代码编辑器中修改
1. 在 VS Code 中打开 `public/prompts/` 文件夹
2. 编辑对应的提示词文件
3. 保存后自动生效

---

## 🔄 变量替换规则

### 变量格式
- 使用双花括号：`{{variableName}}`
- 区分大小写：`{{professor.name}}` ≠ `{{Professor.Name}}`

### 可用变量列表

| 变量名 | 示例值 | 说明 |
|--------|-------|------|
| `{{professor.name}}` | "Yoshua Bengio" | 教授姓名 |
| `{{professor.affiliation}}` | "Université de Montréal" | 学校/机构 |
| `{{professor.areas}}` | "icml, neurips, iclr" | 研究领域（逗号分隔） |
| `{{publications}}` | "Publication in ICML 2024\n..." | 论文列表（多行） |
| `{{researchDirection}}` | "ML + physics simulation" | 用户的研究方向 |

### 示例

**提示词文件内容**：
```
Professor: {{professor.name}}
Institution: {{professor.affiliation}}
```

**渲染后**：
```
Professor: Yoshua Bengio
Institution: Université de Montréal
```

---

## 🎯 提示词优化指南

### Basic Method 优化建议

#### 当前版本特点
- ✅ 灵活评分（0-1.0 连续分布）
- ✅ 强调使用完整范围
- ✅ 鼓励中间分数（0.45, 0.55, 0.65）

#### 如果想让评分更宽松
修改 `basic-user-prompt.txt`：
```
Provide a match score between 0.0 and 1.0, where:
- 0.0-0.2: Poor match          ← 缩小"差"的范围
- 0.3-0.5: Moderate match       ← 扩大"中等"的范围
- 0.6-0.8: Good match           ← 扩大"好"的范围
- 0.9-1.0: Excellent match
```

#### 如果想让评分更严格
修改 `basic-system-prompt.txt`：
```
CRITICAL RULES:
1. ...
4. When in doubt, choose the LOWER score  ← 添加这条
```

---

### Decision Tree Method 优化建议

#### 当前版本特点
- ✅ 95%+ 一致性
- ✅ 客观的 YES/NO 问题
- ✅ 明确的评分范围

#### 如果想让 Q2 更宽松（增加通过率）
修改 `decision-tree-user-prompt.txt` 的 Q2：
```
QUESTION 2: Does the professor have RECENT publications (2024-2025) in this direction?
- Answer YES if: Has 1 or more papers in 2023-2025  ← 降低要求
- Answer NO if: Has 0 papers in 2023-2025
```

#### 如果想调整评分范围
修改提示词中的 SCORING LOGIC 部分：
```
- Q1=YES → Q2=YES → Q3=YES: Score 0.90-1.00
- Q1=YES → Q2=YES → Q3=NO:  Score 0.70-0.85  ← 修改范围
```

---

## 🔍 调试提示词

### 查看实际发送给 LLM 的提示词
在浏览器控制台运行：
```javascript
import { promptService } from '/src/services/promptService.js'

// 查看 Basic 提示词
const basicUser = await promptService.loadPrompt('basic-user-prompt.txt')
console.log(basicUser)

// 查看 Decision Tree 提示词
const dtUser = await promptService.loadPrompt('decision-tree-user-prompt.txt')
console.log(dtUser)
```

### 测试变量替换
```javascript
const template = "Hello {{name}}, you work at {{institution}}"
const rendered = promptService.renderPrompt(template, {
  'name': 'John Doe',
  'institution': 'MIT'
})
console.log(rendered)
// 输出："Hello John Doe, you work at MIT"
```

---

## ⚠️ 注意事项

### 1. 文件格式
- ✅ **使用**：纯文本 `.txt` 文件
- ❌ **不要**：`.js`、`.json` 或其他格式

### 2. 编码格式
- 必须使用 **UTF-8** 编码
- Windows 用户注意：某些编辑器默认 GBK，需要手动改为 UTF-8

### 3. 变量名
- 必须完全匹配：`{{professor.name}}`
- 不能有空格：`{{ professor.name }}` ← 错误
- 区分大小写：`{{Professor.Name}}` ← 错误

### 4. JSON 输出格式
- 提示词中要求 LLM 返回 JSON
- **不要删除** `REQUIRED OUTPUT` 部分
- **不要修改** JSON 字段名（`score`, `reasoning`, `research_summary`）

---

## 📚 提示词最佳实践

### 1. 清晰的任务描述
```
✅ GOOD: "Evaluate how well this professor's research aligns..."
❌ BAD:  "Check if professor matches"
```

### 2. 明确的评分指引
```
✅ GOOD: "0.4-0.6: Moderate match (some relevant work)"
❌ BAD:  "0.5: Medium"
```

### 3. 具体的输出要求
```
✅ GOOD: "REQUIRED OUTPUT (JSON only): { "score": 0.XX, ... }"
❌ BAD:  "Please provide a score"
```

### 4. 关键规则强调
```
✅ GOOD: "IMPORTANT: Use the FULL 0.0-1.0 scale"
❌ BAD:  "Try to use different scores"
```

---

## 🚀 版本管理

### 保存提示词版本
建议创建备份文件：
```
public/prompts/
├── basic-user-prompt.txt           # 当前版本
├── basic-user-prompt-v1.txt        # 备份版本1
├── basic-user-prompt-v2.txt        # 备份版本2
└── basic-user-prompt-strict.txt    # 严格版本
```

### 回滚到之前版本
1. 复制备份文件的内容
2. 粘贴到当前版本文件
3. 保存并刷新浏览器

---

## 💡 常见问题

### Q: 修改提示词后没有生效？
A: 刷新浏览器（Ctrl+Shift+R 强制刷新）

### Q: 可以添加新的变量吗？
A: 可以，但需要修改代码：
1. 编辑 `src/services/llmService.js` 或 `decisionTree.js`
2. 在 `promptService.renderPrompt()` 调用处添加新变量

### Q: 提示词文件损坏了怎么办？
A: 查看本 README 下方的"默认提示词"部分，复制粘贴即可恢复

---

## 📖 当前提示词内容预览

### Basic Method
- **评分范围**：0.0-1.0（连续）
- **特点**：灵活、快速、鼓励中间分数
- **适用**：一般性筛选，速度优先

### Decision Tree Method  
- **评分范围**：分段（0-0.19, 0.2-0.39, 0.4-0.59, 0.6-0.74, 0.75-0.89, 0.9-1.0）
- **特点**：客观、一致、95%+ 跨 LLM 一致性
- **适用**：需要高一致性，多次运行结果稳定

---

## 🛠️ 技术实现

### 提示词加载流程
```
用户点击 "Run AI Analysis"
  ↓
batchFilterProfessors() 开始
  ↓
promptService.preloadAll()
  → 一次性加载所有 4 个提示词文件
  → 缓存到内存（避免重复加载）
  ↓
根据用户选择的 Scoring Method：
  → Basic: 使用 basic-*.txt
  → Decision Tree: 使用 decision-tree-*.txt
  ↓
buildPrompt() 调用
  → promptService.loadPrompt(filename) - 从缓存或文件加载
  → promptService.renderPrompt(template, variables) - 替换变量
  ↓
发送给 LLM
```

### 缓存机制
- ✅ 首次加载：从 `/prompts/*.txt` 文件读取
- ✅ 后续使用：从内存缓存读取（毫秒级）
- ✅ 刷新页面：缓存清空，重新加载

---

现在你可以方便地管理和修改所有提示词了！🎉

