"""
Prompt building for LLM evaluation
Uses same prompts as cloud models for consistency
"""

from typing import List, Dict
from models import Professor
import os


def load_prompt_file(filename: str) -> str:
    """Load prompt from file"""
    # Prompts are in parent directory's public/prompts/
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    prompt_path = os.path.join(base_dir, 'public', 'prompts', filename)
    
    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        # Fallback to basic prompt if file not found
        print(f"Warning: Prompt file {filename} not found, using fallback")
        return get_fallback_prompt(filename)


def get_fallback_prompt(filename: str) -> str:
    """Fallback prompts if files not accessible"""
    if 'system' in filename:
        return """You are an objective academic research evaluator.

CORE MISSION:
Evaluate how well a professor's research profile matches a given research direction.
Output a match score between 0.0 and 1.0.

UNIVERSAL RULES:
1. Be objective - base your evaluation ONLY on the provided evidence
2. Consider research area alignment AND publication activity
3. Recent papers (2023-2025) are more valuable than older work
4. Be STRICT - most professors should score 0.3-0.7
5. Only truly exceptional matches should exceed 0.8

CRITICAL: Do NOT give high scores easily. Be selective and critical."""
    else:
        return """Professor: {{professor.name}}
Institution: {{professor.affiliation}}
Research Areas: {{professor.areas}}
Recent Publications: {{publications}}

Target Research Direction: {{researchDirection}}

Evaluate match score (0.0-1.0) and provide reasoning.
Be STRICT in scoring. Most matches should be 0.3-0.7."""


def build_evaluation_prompt(professor: Professor, research_direction: str, use_strict_prompts: bool = True, scoring_scheme: str = 'original') -> str:
    """
    Build evaluation prompt for a professor
    
    Args:
        professor: Professor data
        research_direction: Target research direction
        use_strict_prompts: If True, use stricter local-model prompts. If False, use basic prompts.
        scoring_scheme: 'original' for basic method, 'decision_tree' for decision tree method
    """
    # Choose prompt files based on model type and scoring scheme
    if use_strict_prompts:
        # Use STRICT prompts for local models (more demanding criteria)
        if scoring_scheme == 'decision_tree':
            system_prompt = load_prompt_file('local-decision-tree-system-prompt.txt')
            user_template = load_prompt_file('local-decision-tree-user-prompt.txt')
        else:  # original/basic
            system_prompt = load_prompt_file('local-system-prompt.txt')
            user_template = load_prompt_file('local-user-prompt.txt')
    else:
        # Use basic prompts for cloud models (balanced criteria)
        if scoring_scheme == 'decision_tree':
            system_prompt = load_prompt_file('decision-tree-system-prompt.txt')
            user_template = load_prompt_file('decision-tree-user-prompt.txt')
        else:  # original/basic
            system_prompt = load_prompt_file('basic-system-prompt.txt')
            user_template = load_prompt_file('basic-user-prompt.txt')
    
    # Extract recent publications
    papers_text = ""
    if professor.publicationList and len(professor.publicationList) > 0:
        recent_papers = [
            p for p in professor.publicationList 
            if p.year >= 2020
        ][:20]  # Use 20 papers like cloud models
        
        if recent_papers:
            papers_text = "\n".join([
                f"{p.title} ({p.venue}, {p.year})"
                for p in recent_papers
            ])
        else:
            papers_text = "No recent publications (2020-2025)"
    else:
        papers_text = "Publication data not available"
    
    # Render user prompt with template variables
    user_prompt = user_template
    user_prompt = user_prompt.replace('{{professor.name}}', professor.name)
    user_prompt = user_prompt.replace('{{professor.affiliation}}', professor.affiliation)
    user_prompt = user_prompt.replace('{{professor.areas}}', ", ".join(professor.areas) if professor.areas else "Not specified")
    user_prompt = user_prompt.replace('{{publications}}', papers_text)
    user_prompt = user_prompt.replace('{{researchDirection}}', research_direction)
    
    # Combine system and user prompts
    return f"{system_prompt}\n\n{user_prompt}"


def validate_llm_response(text: str) -> tuple[bool, str]:
    """
    Validate LLM output quality
    Returns (is_valid, error_message)
    """
    import re
    
    if not text or not isinstance(text, str):
        return False, "Empty or invalid response"
    
    text_stripped = text.strip()
    
    # Check minimum length
    if len(text_stripped) < 20:
        return False, "Output too short"
    
    # Check for invalid patterns
    invalid_patterns = [
        (r'^\s*$', "Empty/whitespace only"),
        (r'^\*+$', "Only asterisks"),
        (r'^[^\w\s]{10,}', "Too many special characters"),
        (r'(.)\1{20,}', "Repeated characters"),
        (r'^(Error|Failed|Unable|Invalid)', "Error message output"),
    ]
    
    for pattern, desc in invalid_patterns:
        if re.search(pattern, text_stripped):
            return False, f"Invalid pattern: {desc}"
    
    # Check if it looks like valid output (has score or JSON)
    has_score = bool(re.search(r'(?:score|Score)[:\s]*[0-9.]+', text_stripped))
    has_json = bool(re.search(r'\{.*"score".*\}', text_stripped, re.DOTALL))
    
    if not (has_score or has_json):
        return False, "No score found in output"
    
    return True, None


def parse_llm_response(response_text: str) -> dict:
    """
    Parse LLM response to extract score and reasoning
    Cleans markdown code blocks and JSON artifacts
    
    Args:
        response_text: Raw LLM output
    
    Returns:
        Dict with score, reasoning, researchSummary
    """
    try:
        import re
        import json
        
        # Step 1: Remove markdown code blocks
        cleaned = re.sub(r'```(?:json)?\s*', '', response_text)
        cleaned = re.sub(r'```', '', cleaned).strip()
        
        # Step 2: Try JSON parsing first
        json_match = re.search(r'\{[^{}]*"score"[^{}]*\}', cleaned, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group(0))
                score = float(data.get("score", 0.0))
                if score > 1.0:
                    score = score / 10.0
                score = max(0.0, min(1.0, score))
                
                reasoning = str(data.get("reasoning", ""))
                summary = str(data.get("research_summary", data.get("researchSummary", reasoning)))
                
                # Clean JSON artifacts
                reasoning = re.sub(r'["{}\[\]]', '', reasoning).strip()
                summary = re.sub(r'["{}\[\]]', '', summary).strip()
                
                return {
                    "score": score,
                    "reasoning": reasoning[:200] if reasoning else "No reasoning provided",
                    "researchSummary": summary[:200] if summary else reasoning[:200]
                }
            except (json.JSONDecodeError, ValueError, KeyError):
                pass  # Fallback to regex
        
        # Step 3: Regex fallback
        score = 0.0
        reasoning = ""
        research_summary = ""
        
        score_match = re.search(r'(?:Score|score)[:\s]+([0-9.]+)', cleaned, re.IGNORECASE)
        if score_match:
            score = float(score_match.group(1))
            if score > 1.0:
                score = score / 10.0
            score = max(0.0, min(1.0, score))
        
        reason_match = re.search(r'(?:Reason|reasoning)[:\s]+(.+?)(?:\n\n|Research Summary:|research_summary:|$)', cleaned, re.IGNORECASE | re.DOTALL)
        if reason_match:
            reasoning = reason_match.group(1).strip()
        
        summary_match = re.search(r'(?:Research Summary|research_summary)[:\s]+(.+?)(?:\n\n|$)', cleaned, re.IGNORECASE | re.DOTALL)
        if summary_match:
            research_summary = summary_match.group(1).strip()
        else:
            research_summary = reasoning
        
        # Clean up artifacts
        reasoning = re.sub(r'["{}\[\]]', '', reasoning).strip()
        research_summary = re.sub(r'["{}\[\]]', '', research_summary).strip()
        
        reasoning = reasoning[:200] if reasoning else "No reasoning provided"
        research_summary = research_summary[:200] if research_summary else reasoning
        
        return {
            "score": score,
            "reasoning": reasoning,
            "researchSummary": research_summary
        }
    
    except Exception as e:
        print(f"❌ Parse error: {e}")
        print(f"Raw response: {response_text[:300]}")
        return {
            "score": 0.0,
            "reasoning": "Parse error occurred",
            "researchSummary": "Failed to extract response"
        }
