"""
FastAPI server for vLLM backend
Provides REST API for batch professor evaluation
"""

import time
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from models import (
    EvaluateRequest, EvaluateResponse, EvaluationResult,
    LoadModelRequest, LoadModelResponse,
    HealthResponse
)
from llm_engine import llm_engine, AVAILABLE_MODELS
from prompt_builder import build_evaluation_prompt, parse_llm_response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="CSProfAlign vLLM Backend",
    description="GPU-accelerated batch inference for professor evaluation",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model_loaded=llm_engine.is_loaded(),
        current_model=llm_engine.get_current_model()
    )


@app.get("/models")
async def get_models():
    """Get available models"""
    return {
        "models": [
            {
                "id": model_id,
                **model_config
            }
            for model_id, model_config in AVAILABLE_MODELS.items()
        ]
    }


@app.post("/load_model", response_model=LoadModelResponse)
async def load_model(request: LoadModelRequest):
    """
    Load a model into memory
    
    First time will download from HuggingFace (may take 5-10 minutes)
    Subsequent loads use cached model
    """
    try:
        logger.info(f"📥 Received request to load model: {request.model_id}")
        
        await llm_engine.load_model(request.model_id)
        
        return LoadModelResponse(
            status="loaded",
            model=request.model_id,
            message=f"Model {request.model_id} loaded successfully"
        )
    
    except ValueError as e:
        logger.error(f"Invalid model ID: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Model loading failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


@app.post("/unload_model")
async def unload_model():
    """Unload current model to free memory"""
    try:
        if not llm_engine.is_loaded():
            return {"status": "no_model_loaded", "message": "No model to unload"}
        
        model_id = llm_engine.get_current_model()
        await llm_engine.unload_model()
        
        return {
            "status": "unloaded",
            "message": f"Model {model_id} unloaded successfully"
        }
    
    except Exception as e:
        logger.error(f"Unload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to unload model: {str(e)}")


@app.post("/evaluate_batch", response_model=EvaluateResponse)
async def evaluate_batch(request: EvaluateRequest):
    """
    Evaluate a batch of professors (GPU-accelerated batch inference)
    
    This is the core endpoint that processes multiple professors in parallel
    using vLLM's efficient batch inference
    """
    if not llm_engine.is_loaded():
        raise HTTPException(
            status_code=400,
            detail="No model loaded. Call /load_model first."
        )
    
    try:
        start_time = time.time()
        
        # Build prompts for all professors
        logger.info(f"📊 Building prompts for {len(request.professors)} professors")
        prompts = [
            build_evaluation_prompt(prof, request.research_direction, use_strict_prompts=True, scoring_scheme=getattr(request, 'scoring_scheme', 'original'))
            for prof in request.professors
        ]
        
        # Batch inference (vLLM handles parallelization)
        logger.info(f"🚀 Running batch inference ({len(prompts)} prompts)")
        outputs = llm_engine.generate_batch(prompts)
        
        # Parse results
        logger.info(f"📝 Parsing {len(outputs)} outputs")
        results = []
        for output in outputs:
            text = llm_engine.extract_text(output)
            parsed = parse_llm_response(text)
            results.append(EvaluationResult(**parsed))
        
        processing_time = time.time() - start_time
        
        # Log statistics
        matched_count = sum(1 for r in results if r.score >= request.threshold)
        avg_score = sum(r.score for r in results) / len(results) if results else 0
        
        logger.info(
            f"✅ Batch complete: {len(results)} professors in {processing_time:.2f}s "
            f"| Matched: {matched_count} | Avg score: {avg_score:.2f}"
        )
        
        return EvaluateResponse(
            results=results,
            processing_time=processing_time,
            model_name=llm_engine.get_current_model()
        )
    
    except Exception as e:
        logger.error(f"❌ Evaluation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CSProfAlign vLLM Backend",
        "status": "running",
        "model_loaded": llm_engine.is_loaded(),
        "current_model": llm_engine.get_current_model(),
        "endpoints": {
            "health": "/health",
            "models": "/models",
            "load_model": "/load_model (POST)",
            "unload_model": "/unload_model (POST)",
            "evaluate_batch": "/evaluate_batch (POST)"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )

