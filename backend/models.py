"""
Pydantic data models for API requests and responses
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class Publication(BaseModel):
    """Single publication data"""
    title: str
    year: int
    venue: str


class Professor(BaseModel):
    """Professor data model"""
    name: str
    affiliation: str
    areas: Optional[List[str]] = []
    publicationList: Optional[List[Publication]] = []


class EvaluateRequest(BaseModel):
    """Batch evaluation request"""
    professors: List[Professor]
    research_direction: str
    batch_size: int = 20
    threshold: float = 0.6


class EvaluationResult(BaseModel):
    """Single professor evaluation result"""
    score: float
    reasoning: str
    researchSummary: str


class EvaluateResponse(BaseModel):
    """Batch evaluation response"""
    model_config = {"protected_namespaces": ()}  # Fix Pydantic warning
    
    results: List[EvaluationResult]
    processing_time: float
    model_name: str


class LoadModelRequest(BaseModel):
    """Model loading request"""
    model_config = {"protected_namespaces": ()}  # Fix Pydantic warning
    
    model_id: str


class LoadModelResponse(BaseModel):
    """Model loading response"""
    status: str
    model: str
    message: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    model_config = {"protected_namespaces": ()}  # Fix Pydantic warning
    
    status: str
    model_loaded: bool
    current_model: Optional[str] = None

