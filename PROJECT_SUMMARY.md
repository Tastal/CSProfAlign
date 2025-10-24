# CSProfAlign - AI-Powered Professor Discovery Platform

## Project Overview

**CSProfAlign** is an intelligent web application that helps students and researchers find the most suitable professors based on their research interests using advanced AI technology. The platform integrates CSRankings data with large language models (LLMs) to provide intelligent matching and evaluation.

**Live Demo**: [https://github.com/Tastal/CSProfAlign](https://github.com/Tastal/CSProfAlign)

---

## Project Motivation

### Problem Statement
Traditional professor discovery relies on manual searches through university websites, Google Scholar, and CSRankings. This process is:
- **Time-consuming**: Reading hundreds of professor profiles and publications
- **Inefficient**: Difficult to assess research alignment without deep domain knowledge
- **Subjective**: Hard to quantify match quality between research interests

### Solution
CSProfAlign automates this process using AI to:
1. Analyze professor research profiles from CSRankings (26,000+ professors)
2. Evaluate research alignment using LLM-powered semantic understanding
3. Provide scored results with detailed reasoning and research summaries
4. Support both cloud APIs (DeepSeek, OpenAI) and local GPU-accelerated inference

---

## Technical Architecture

### Tech Stack

#### **Frontend**
- **Vue 3** (Composition API) - Modern reactive framework
- **Pinia** - State management for complex application logic
- **Vite** - Fast build tool and development server
- **JavaScript/ES6+** - Core programming language

#### **Backend (Local LLM Service)**
- **Python 3.10+** - Backend programming language
- **FastAPI** - High-performance async web framework
- **vLLM** - GPU-accelerated LLM inference engine
- **Docker/Docker Compose** - Containerization and deployment
- **Pydantic** - Data validation and API modeling
- **Uvicorn** - ASGI server for FastAPI

#### **AI/ML**
- **DeepSeek API** - Primary cloud LLM provider (cost-effective)
- **OpenAI API** - Alternative cloud provider (GPT-4)
- **vLLM Engine** - Local inference with Qwen models (0.5B, 1.5B)
- **HuggingFace Transformers** - Model loading and management

#### **Data Processing**
- **CSRankings Dataset** - 26,000+ CS professors from top institutions
- **Papa Parse** - CSV parsing in browser
- **Python Pandas** - Data preprocessing and transformation

#### **DevOps**
- **Git/GitHub** - Version control and collaboration
- **Docker** - Cross-platform deployment (Windows/macOS/Linux)
- **NVIDIA Docker** - GPU passthrough for local inference

---

## Core Features

### 1. **Multi-Source LLM Support**
- **Cloud APIs**: DeepSeek R1, OpenAI GPT-4
- **Local Models**: Qwen 0.5B, 1.5B (GPU-accelerated via vLLM)
- **Dynamic model loading/unloading** with progress tracking
- **Automatic GPU memory management** (adaptive utilization based on VRAM)

### 2. **Intelligent Scoring System**
- **Basic Scoring**: Comprehensive evaluation with weighted criteria
- **Decision Tree Scoring**: Multi-stage evaluation for precise filtering
- **Local-Strict Prompts**: Specialized prompts for smaller local models
- **Configurable thresholds**: 70%, 80%, 90% match levels

### 3. **Advanced Filtering**
- **Geographic filtering**: 7 regions (US, Europe, Asia, etc.)
- **Time-based filtering**: Publication year ranges (2015-2025)
- **Research area filtering**: 29 CS sub-fields (AI, Systems, Theory, etc.)
- **Batch processing**: 20 professors per batch for optimal performance

### 4. **Data Export & Visualization**
- **CSV export**: Complete results with scores, reasoning, and summaries
- **Progress tracking**: Real-time processing updates
- **Error handling**: Graceful degradation with retry logic

---

## Technical Challenges & Solutions

### Challenge 1: Browser-Based Local LLM Performance Issues

**Problem**:
- Initial implementation used WebGPU (Transformers.js, WebLLM) for browser-based inference
- Severe performance issues:
  - Extremely slow inference (10-20s per professor)
  - Browser freezing and lag during processing
  - Entire system becoming unresponsive
  - Poor GPU utilization (only WebGPU, no CUDA)

**Solution**:
- **Complete architecture redesign**: Migrated from browser-based to server-based inference
- **Implemented vLLM backend**:
  - Built FastAPI service with vLLM engine
  - Dockerized for cross-platform compatibility
  - GPU-accelerated inference via CUDA
  - Batch processing for 5-10x speedup
- **Results**:
  - Inference time reduced from 10-20s to 2-3s per professor
  - No browser lag or freezing
  - Full GPU utilization (RTX 4070)
  - System remains responsive during processing

### Challenge 2: GPU Memory Management

**Problem**:
- vLLM default `gpu_memory_utilization=0.9` caused OOM errors
- Different GPUs (6GB, 8GB, 12GB+) require different settings
- Users with existing GPU workloads faced crashes

**Solution**:
```python
def load_model(self, model_id: str):
    # Dynamic GPU memory adjustment
    total_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
    
    if total_memory <= 6:
        gpu_memory_utilization = 0.65
    elif total_memory <= 12:
        gpu_memory_utilization = 0.75
    else:
        gpu_memory_utilization = 0.85
    
    self.llm = LLM(
        model=model_id,
        gpu_memory_utilization=gpu_memory_utilization,
        max_model_len=2048
    )
```
- **Adaptive memory allocation** based on detected GPU VRAM
- **Conservative defaults** to prevent OOM
- **Graceful error messages** for debugging

### Challenge 3: LLM Response Inconsistency

**Problem**:
- Local models (Qwen 0.5B/1.5B) produced overly generous scores
- 72% pass rate vs expected 20-30%
- Many professors scored 0.97-0.98 inappropriately
- JSON formatting leaked into exported CSV files

**Solution**:
1. **Stricter prompts for local models**:
   - Created separate prompt files: `local-system-prompt.txt`, `local-decision-tree-system-prompt.txt`
   - Emphasized conservative scoring and detailed reasoning
   - Clear JSON-only response format instructions

2. **Robust response parsing**:
```python
def parse_llm_response(response_text: str) -> dict:
    # Remove markdown code blocks
    text = re.sub(r'```(?:json)?\n?', '', response_text)
    
    # Try JSON parsing
    try:
        return json.loads(text)
    except:
        # Fallback: regex extraction
        score = re.search(r'"score":\s*([0-9.]+)', text)
        reasoning = re.search(r'"reasoning":\s*"([^"]+)"', text)
        # ...
```

3. **Conditional prompt loading**:
   - Cloud models use standard prompts
   - Local models use strict prompts
   - Maintains compatibility without affecting cloud API performance

### Challenge 4: Docker Deployment Complexity

**Problem**:
- Base vLLM Docker image had default `ENTRYPOINT` that intercepted commands
- Errors like: `unrecognized arguments: -m uvicorn server:app`
- `python` vs `python3` executable naming inconsistencies

**Solution**:
```dockerfile
FROM vllm/vllm-openai:latest

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Critical: Override base image entrypoint
ENTRYPOINT []

# Use python3 (not python) to match image
CMD ["python3", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "info"]
```

**Cross-platform scripts**:
- `start-backend.bat` for Windows
- `start-backend.sh` for macOS/Linux
- Automatic Docker installation detection
- Graceful error messages and troubleshooting hints

### Challenge 5: Data Management & GitHub Integration

**Problem**:
- CSRankings repo is 500MB+ with git history
- Cloning it on every deployment is inefficient
- GitHub detected CSRankings as submodule (unclickable directory)
- Need to include data but keep repo size reasonable

**Solution**:
1. **Selective data inclusion**:
   - Extracted only 3 essential CSV files (csrankings.csv, generated-author-info.csv, country-info.csv)
   - Moved to `data/csrankings/` within project
   - Pre-processed JSON data included in `public/data/`

2. **Smart `.gitignore` configuration**:
```gitignore
# Exclude CSRankings repo
CSRankings/

# But include essential files
!data/csrankings/*.csv
!public/data/*.json

# Exclude all CSV by default (user exports)
*.csv
# Re-include essential ones
!data/csrankings/*.csv
```

3. **Auto-update mechanism**:
   - Created `update-csrankings.py` to fetch latest CSV files from GitHub
   - Checks for updates on startup
   - Falls back to cached data if network fails

4. **Git submodule cleanup**:
```bash
git rm -r --cached CSRankings
git add -f data/csrankings/*.csv
git commit -m "Fix: Move CSRankings to data/csrankings"
git push -f origin main
```

---

## System Design Highlights

### 1. **Frontend State Management**
```javascript
// Pinia store with complex state logic
export const useAppStore = defineStore('app', () => {
  const professors = ref([])
  const llmProvider = ref('deepseek-chat')
  const localModelId = ref('Qwen/Qwen2.5-0.5B-Instruct')
  
  // Batch processing with progress tracking
  async function runLLMFilter() {
    const batchSize = 20
    for (let i = 0; i < filtered.length; i += batchSize) {
      const batch = filtered.slice(i, i + batchSize)
      const results = await backendLLM.evaluateBatch(batch, ...)
      // Update progress, handle errors, merge results
    }
  }
})
```

### 2. **Backend API Design**
```python
@app.post("/evaluate_batch", response_model=EvaluateResponse)
async def evaluate_batch(request: EvaluateRequest):
    """Batch evaluation endpoint with error handling"""
    if not llm_engine.is_loaded():
        raise HTTPException(status_code=400, detail="Model not loaded")
    
    # Build prompts for batch
    prompts = [build_prompt(prof, ...) for prof in request.professors]
    
    # vLLM batch inference
    outputs = llm_engine.generate_batch(prompts)
    
    # Parse and validate responses
    results = [parse_llm_response(out.text) for out in outputs]
    
    return EvaluateResponse(results=results)
```

### 3. **Prompt Engineering**
- **System prompts**: Define role, constraints, and output format
- **User prompts**: Provide professor data and research direction
- **Few-shot examples**: Guide model behavior (in prompts)
- **Structured output**: Enforce JSON format for reliable parsing

### 4. **Error Handling Strategy**
- **Frontend**: Toast notifications, retry logic, graceful degradation
- **Backend**: HTTP exceptions, detailed error messages, logging
- **Docker**: Health checks, automatic restarts, volume persistence
- **LLM**: Fallback parsing, timeout handling, batch retry

---

## Performance Metrics

### Inference Speed
| Model | Mode | Time per Professor | Batch (20) |
|-------|------|-------------------|------------|
| DeepSeek R1 | Cloud API | ~2-3s | ~40-60s |
| GPT-4 | Cloud API | ~3-5s | ~60-100s |
| Qwen 1.5B | Local (RTX 4070) | ~2-3s | ~40-60s |
| Qwen 0.5B | Local (RTX 4070) | ~1-2s | ~20-40s |

### Memory Usage
- **Frontend**: ~100-200MB (Vue app + data)
- **Backend**: ~2-4GB (FastAPI + vLLM engine)
- **GPU**: 3-6GB VRAM (Qwen 1.5B model)

### Dataset Scale
- **26,000+ professors** from top CS institutions
- **7 geographic regions** (US, Europe, Asia, Canada, etc.)
- **29 research areas** (AI, Systems, Theory, Security, etc.)
- **10+ years** of publication data (2015-2025)

---

## Key Learnings

### Technical Skills Developed
1. **Full-stack development**: Vue 3 frontend + FastAPI backend
2. **AI/ML integration**: LLM APIs, prompt engineering, local inference
3. **Docker/DevOps**: Containerization, GPU passthrough, cross-platform deployment
4. **Performance optimization**: Batch processing, memory management, caching
5. **Data engineering**: Large dataset processing, CSV parsing, JSON transformation

### Software Engineering Practices
1. **Modular architecture**: Separation of concerns (services, stores, components)
2. **API design**: RESTful endpoints, type validation, error handling
3. **Version control**: Git workflow, branch management, force push recovery
4. **Documentation**: README, inline comments, API documentation
5. **Cross-platform support**: Windows/macOS/Linux compatibility

### Problem-Solving Approach
1. **Iterative refinement**: WebGPU → vLLM migration showed willingness to redesign
2. **Performance profiling**: Identified bottlenecks (browser inference) and optimized
3. **User-centric design**: Prioritized responsiveness and ease of use
4. **Debugging skills**: Docker issues, git submodules, PowerShell configuration

---

## Future Improvements

### Technical Enhancements
- [ ] **Caching layer**: Redis for API response caching
- [ ] **Streaming responses**: Real-time result updates via WebSocket
- [ ] **Larger models**: Support for Qwen 7B, 14B on high-end GPUs
- [ ] **Multi-GPU support**: Distributed inference for faster processing
- [ ] **Vector search**: Embedding-based professor search for semantic similarity

### Feature Additions
- [ ] **Professor comparison**: Side-by-side comparison of multiple professors
- [ ] **Citation analysis**: Integration with Google Scholar metrics
- [ ] **Email templates**: Auto-generate outreach emails based on research alignment
- [ ] **Collaboration network**: Visualize professor co-authorship graphs
- [ ] **User accounts**: Save searches, bookmark professors, export history

### Infrastructure
- [ ] **Cloud deployment**: AWS/GCP hosting with auto-scaling
- [ ] **CI/CD pipeline**: Automated testing and deployment
- [ ] **Monitoring**: Prometheus + Grafana for performance tracking
- [ ] **Load balancing**: Handle multiple concurrent users

---

## Project Impact

### Practical Value
- **Time savings**: Reduces professor research from hours to minutes
- **Better matches**: AI provides objective, detailed evaluation
- **Accessibility**: Free, open-source tool for all students/researchers
- **Scalability**: Handles large-scale data (26K+ professors) efficiently

### Technical Contributions
- **Open-source**: Available on GitHub for community use and contribution
- **Documentation**: Comprehensive README and setup guides
- **Reproducibility**: Docker ensures consistent deployment across platforms
- **Best practices**: Demonstrates modern web development and AI integration

---

## Technologies Demonstrated

### Frontend Development
✅ Vue 3 Composition API  
✅ Reactive state management (Pinia)  
✅ Component-based architecture  
✅ Async/await API integration  
✅ CSV export and data visualization  

### Backend Development
✅ FastAPI REST API design  
✅ Async Python programming  
✅ Pydantic data validation  
✅ Docker containerization  
✅ CORS configuration  

### AI/ML Engineering
✅ LLM API integration (OpenAI, DeepSeek)  
✅ Local model deployment (vLLM)  
✅ Prompt engineering and optimization  
✅ GPU memory management  
✅ Batch inference optimization  

### DevOps & Deployment
✅ Docker Compose orchestration  
✅ Cross-platform scripting (Bash, Batch)  
✅ Git workflow and version control  
✅ Environment configuration  
✅ Health checks and monitoring  

### Data Engineering
✅ Large CSV processing (26K+ rows)  
✅ Data transformation pipelines  
✅ JSON/CSV parsing and validation  
✅ Data filtering and aggregation  
✅ Export functionality  

---

## Code Quality

### Best Practices Followed
- **Separation of concerns**: Services, stores, components clearly separated
- **Type safety**: Pydantic models for API, JSDoc for frontend
- **Error handling**: Try-catch blocks, HTTP exceptions, user-friendly messages
- **Code reusability**: Shared utilities, composable functions
- **Performance**: Batch processing, lazy loading, efficient data structures
- **Security**: API key management, CORS configuration, input validation

### Testing Considerations
- Manual testing across multiple scenarios
- Edge case handling (OOM, network errors, invalid inputs)
- Cross-platform validation (Windows, macOS, Linux)
- Performance benchmarking (inference speed, memory usage)

---

## Conclusion

CSProfAlign demonstrates proficiency in modern full-stack development, AI/ML integration, and DevOps practices. The project showcases:

1. **Problem-solving ability**: Identified real-world pain point and built practical solution
2. **Technical depth**: Complex architecture with frontend, backend, and AI components
3. **Adaptability**: Successfully pivoted from WebGPU to vLLM when performance issues arose
4. **Engineering rigor**: Robust error handling, cross-platform support, documentation
5. **AI expertise**: Prompt engineering, model deployment, performance optimization

This project serves as a strong portfolio piece demonstrating full-stack AI application development from concept to deployment.

---

**Repository**: [https://github.com/Tastal/CSProfAlign](https://github.com/Tastal/CSProfAlign)  
**Tech Stack**: Vue 3, FastAPI, vLLM, Docker, Python, JavaScript  
**Deployment**: Cross-platform (Windows/macOS/Linux) via Docker  
**AI Models**: DeepSeek R1, OpenAI GPT-4, Qwen 0.5B/1.5B  

