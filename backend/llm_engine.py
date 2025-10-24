"""
vLLM Engine wrapper for batch inference
Handles model lifecycle, batch processing, and error handling
"""

import asyncio
import time
from typing import List, Dict, Optional
from vllm import LLM, SamplingParams
from vllm.outputs import RequestOutput
import logging

logger = logging.getLogger(__name__)


# Available models mapping
AVAILABLE_MODELS = {
    "qwen-0.5b": {
        "model_path": "Qwen/Qwen2.5-0.5B-Instruct",
        "name": "Qwen2.5-0.5B-Instruct",
        "size": "0.5B",
        "vram": "4GB",
        "recommended_batch_size": 20
    },
    "qwen-1.5b": {
        "model_path": "Qwen/Qwen2.5-1.5B-Instruct",
        "name": "Qwen2.5-1.5B-Instruct",
        "size": "1.5B",
        "vram": "8GB",
        "recommended_batch_size": 15
    },
    "qwen-7b": {
        "model_path": "Qwen/Qwen2.5-7B-Instruct",
        "name": "Qwen2.5-7B-Instruct",
        "size": "7B",
        "vram": "16GB",
        "recommended_batch_size": 8
    }
}


class LLMEngine:
    """vLLM inference engine wrapper"""
    
    def __init__(self):
        self.llm: Optional[LLM] = None
        self.current_model: Optional[str] = None
        self.sampling_params = None  # Will be set when model is loaded
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.llm is not None
    
    def get_current_model(self) -> Optional[str]:
        """Get currently loaded model ID"""
        return self.current_model
    
    async def load_model(self, model_id: str) -> None:
        """
        Load a model into memory
        
        Args:
            model_id: Model identifier (e.g., 'qwen-0.5b')
        
        Raises:
            ValueError: If model_id is not recognized
            RuntimeError: If model loading fails
        """
        if model_id not in AVAILABLE_MODELS:
            raise ValueError(
                f"Unknown model: {model_id}. "
                f"Available: {list(AVAILABLE_MODELS.keys())}"
            )
        
        # Unload existing model if any
        if self.llm is not None:
            logger.info(f"Unloading current model: {self.current_model}")
            await self.unload_model()
        
        model_config = AVAILABLE_MODELS[model_id]
        model_path = model_config["model_path"]
        
        logger.info(f"Loading model: {model_path}")
        
        try:
            # Initialize vLLM with optimized settings
            # Auto-adjust GPU memory utilization based on available VRAM
            # This ensures compatibility across different GPUs and usage scenarios
            import torch
            if torch.cuda.is_available():
                total_mem = torch.cuda.get_device_properties(0).total_memory / (1024**3)  # GB
                free_mem = (torch.cuda.get_device_properties(0).total_memory - torch.cuda.memory_allocated(0)) / (1024**3)
                
                # Calculate safe utilization ratio
                # Leave at least 1.5GB buffer for system and CUDA overhead
                if total_mem <= 6:  # Small GPU (4-6GB)
                    gpu_util = 0.65
                elif total_mem <= 12:  # Medium GPU (8-12GB)
                    gpu_util = 0.75
                else:  # Large GPU (16GB+)
                    gpu_util = 0.85
                
                logger.info(f"GPU: Total {total_mem:.1f}GB, Free {free_mem:.1f}GB, Using {gpu_util*100}% utilization")
            else:
                gpu_util = 0.75  # Default for CPU fallback
            
            # Enable INT8 quantization for large models (7B+)
            use_quantization = "7b" in model_id or "14b" in model_id
            
            if use_quantization:
                logger.info(f"Enabling INT8 quantization for {model_id}")
                self.llm = LLM(
                    model=model_path,
                    quantization="bitsandbytes",
                    load_format="bitsandbytes",
                    gpu_memory_utilization=gpu_util,
                    max_model_len=4096,
                    trust_remote_code=True,
                    download_dir="/root/.cache/huggingface"
                )
            else:
                self.llm = LLM(
                    model=model_path,
                    gpu_memory_utilization=gpu_util,
                    max_model_len=4096,
                    trust_remote_code=True,
                    download_dir="/root/.cache/huggingface"
                )
            
            self.current_model = model_id
            
            # Set sampling parameters based on model size
            # Larger models benefit from lower temperature for more focused outputs
            temperature = 0.1 if "7b" in model_id or "14b" in model_id else 0.2
            self.sampling_params = SamplingParams(
                temperature=temperature,
                top_p=0.8,
                max_tokens=128,
                repetition_penalty=1.1
            )
            
            logger.info(f"✅ Model loaded successfully: {model_id} (temp={temperature})")
            
        except Exception as e:
            logger.error(f"❌ Failed to load model {model_id}: {e}")
            self.llm = None
            self.current_model = None
            raise RuntimeError(f"Model loading failed: {str(e)}")
    
    async def unload_model(self) -> None:
        """Unload current model and free memory"""
        if self.llm is not None:
            logger.info(f"Unloading model: {self.current_model}")
            # vLLM doesn't have explicit unload, set to None for GC
            self.llm = None
            self.current_model = None
            # Give time for GPU memory cleanup
            await asyncio.sleep(1)
            logger.info("✅ Model unloaded")
    
    def generate_batch(self, prompts: List[str]) -> List[RequestOutput]:
        """
        Generate responses for a batch of prompts
        
        Args:
            prompts: List of prompt strings
        
        Returns:
            List of vLLM outputs
        
        Raises:
            RuntimeError: If model is not loaded
        """
        if self.llm is None:
            raise RuntimeError("No model loaded. Call load_model() first.")
        
        logger.info(f"Generating for batch of {len(prompts)} prompts")
        start_time = time.time()
        
        try:
            outputs = self.llm.generate(prompts, self.sampling_params)
            
            elapsed = time.time() - start_time
            rate = len(prompts) / elapsed
            logger.info(
                f"✅ Batch complete: {len(prompts)} prompts in {elapsed:.2f}s "
                f"({rate:.2f} prompts/sec)"
            )
            
            return outputs
        
        except Exception as e:
            logger.error(f"❌ Batch generation failed: {e}")
            raise RuntimeError(f"Generation failed: {str(e)}")
    
    def extract_text(self, output: RequestOutput) -> str:
        """Extract generated text from vLLM output"""
        return output.outputs[0].text
    
    def get_model_info(self) -> Dict:
        """Get information about available and loaded models"""
        return {
            "available_models": AVAILABLE_MODELS,
            "current_model": self.current_model,
            "is_loaded": self.is_loaded()
        }


# Global engine instance
llm_engine = LLMEngine()

