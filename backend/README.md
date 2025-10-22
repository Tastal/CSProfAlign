# CSProfAlign vLLM Backend

GPU-accelerated batch inference server for professor evaluation.

## Architecture

```
Frontend (Vue + Browser)
    ↓ HTTP REST API
Backend (Docker Container)
    ├─ FastAPI Server (port 8000)
    ├─ vLLM Engine (batch inference)
    └─ GPU (CUDA/ROCm/Metal)
```

## API Endpoints

### GET /health
Health check and status
```json
{
  "status": "healthy",
  "model_loaded": true,
  "current_model": "qwen-1.5b"
}
```

### GET /models
List available models
```json
{
  "models": [
    {
      "id": "qwen-0.5b",
      "name": "Qwen 0.5B",
      "size": "512MB",
      "description": "Fast and efficient",
      "vram": "4GB"
    }
  ]
}
```

### POST /load_model
Load a model into memory
```json
Request: {
  "model_id": "qwen-1.5b"
}

Response: {
  "status": "loaded",
  "model": "qwen-1.5b",
  "message": "Model loaded successfully"
}
```

### POST /unload_model
Unload current model
```json
Response: {
  "status": "unloaded",
  "message": "Model unloaded successfully"
}
```

### POST /evaluate_batch
Batch evaluate professors (core API)
```json
Request: {
  "professors": [
    {
      "name": "John Doe",
      "affiliation": "MIT",
      "areas": ["AI", "ML"],
      "publicationList": [...]
    }
  ],
  "research_direction": "I'm interested in...",
  "batch_size": 20,
  "threshold": 0.6
}

Response: {
  "results": [
    {
      "score": 0.85,
      "reasoning": "Strong alignment...",
      "researchSummary": "..."
    }
  ],
  "processing_time": 25.3,
  "model_name": "qwen-1.5b"
}
```

## Running Locally

### Prerequisites
- Docker Desktop
- NVIDIA GPU (recommended) / AMD / Apple Silicon
- 8GB+ VRAM

### Start Backend
```bash
# Windows
start-backend.bat

# Linux/macOS
./start-backend.sh
```

### Development
```bash
# Build image
docker-compose build

# Start container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop container
docker-compose down
```

## Performance

### Batch Processing
- **Batch size**: 20 professors at once
- **Speed**: ~30 seconds per batch
- **Throughput**: ~40 professors/minute

### Example: 446 Professors
- **Batches**: 23 batches (20 each)
- **Time**: ~11.5 minutes
- **Comparison**: 100x faster than browser WebGPU

## Models

### Qwen 0.5B
- **Size**: 512MB
- **VRAM**: 4GB
- **Speed**: ~20-30s per batch
- **Use case**: Fast prototyping

### Qwen 1.5B
- **Size**: 1.5GB
- **VRAM**: 8GB
- **Speed**: ~30-40s per batch
- **Use case**: Higher accuracy

## Troubleshooting

### Backend won't start
1. Check Docker is running: `docker --version`
2. Check port 8000 is free: `netstat -an | findstr 8000`
3. View logs: `docker-compose logs -f`

### Model download slow
- First download takes 5-10 minutes
- Models cached in `./models/` directory
- Subsequent loads are instant

### GPU not detected
- Windows: Ensure WSL2 is enabled in Docker Desktop
- Linux: Install nvidia-docker2: `apt install nvidia-docker2`
- macOS: Uses CPU/Metal (slower but works)

### Out of memory
- Use smaller model (0.5B instead of 1.5B)
- Reduce batch size (not configurable in current version)
- Close other GPU applications

## Development

### File Structure
```
backend/
├── server.py           # FastAPI app
├── llm_engine.py       # vLLM wrapper
├── models.py           # Data models
├── prompt_builder.py   # Prompt templates
├── requirements.txt    # Python deps
├── Dockerfile          # Docker image
└── README.md           # This file
```

### Adding New Models
Edit `llm_engine.py`:
```python
AVAILABLE_MODELS = {
    "your-model": {
        "model_path": "HuggingFace/model-id",
        "name": "Display Name",
        "size": "1GB",
        "description": "Description",
        "vram": "8GB"
    }
}
```

## License
MIT License - see parent directory

