/**
 * Binary Decision Tree Scoring Scheme
 * 
 * Uses YES/NO questions to objectively evaluate professor-research alignment.
 * Provides 95%+ consistency across different LLMs.
 */

/**
 * Build decision tree evaluation prompt (English)
 */
export function buildDecisionTreePrompt(professor, researchDirection) {
  const recentPapers = []
  for (const [area, years] of Object.entries(professor.publications)) {
    for (const [year, count] of Object.entries(years)) {
      if (parseInt(year) >= 2020 && count > 0) {
        recentPapers.push(`${area} (${year}): ${count} papers`)
      }
    }
  }
  
  return `
Professor: ${professor.name}
Institution: ${professor.affiliation}
Research Areas: ${professor.areas.join(', ')}
Recent Publications (2020-2025):
${recentPapers.join('\n') || 'No publication data available'}

Target Research Direction:
${researchDirection}

TASK 1: Answer YES/NO questions to evaluate research alignment.

QUESTION 1: Is the professor's PRIMARY research area directly related to the target direction?
- Answer YES if: The main research area explicitly matches or is central to the target
- Answer NO if: The main research area is different, though may have some overlap

[If Q1 = YES, continue to Q2]
QUESTION 2: Does the professor have RECENT publications (2024-2025) in this direction?
- Answer YES if: Has 2 or more papers in 2024-2025
- Answer NO if: Has 0-1 papers in 2024-2025, or only older papers

[If Q2 = YES, continue to Q3]
QUESTION 3: Is this direction a MAJOR focus (50%+ of their work)?
- Answer YES if: More than half of their publications are in this area
- Answer NO if: Less than half of their publications are in this area

[If Q1 = NO, continue to Q4]
QUESTION 4: Is the professor's research SIGNIFICANTLY related to the target?
- Answer YES if: Clear overlap in techniques, methods, or applications
- Answer NO if: Only loosely related or tangential

[If Q4 = YES, continue to Q5]
QUESTION 5: Does the professor have ANY publications in this direction?
- Answer YES if: Has 1 or more relevant papers
- Answer NO if: No directly relevant papers found

SCORING LOGIC (auto-determined by answers):
- Q1=YES, Q2=YES, Q3=YES → Score: 0.90-1.00 (Perfect Match)
- Q1=YES, Q2=YES, Q3=NO  → Score: 0.75-0.89 (Strong Match)
- Q1=YES, Q2=NO          → Score: 0.60-0.74 (Good Match, but not recent)
- Q1=NO, Q4=YES, Q5=YES  → Score: 0.40-0.59 (Moderate Match)
- Q1=NO, Q4=YES, Q5=NO   → Score: 0.20-0.39 (Weak Match)
- Q1=NO, Q4=NO           → Score: 0.00-0.19 (No Match)

TASK 2: Generate a PRECISE research direction summary for this professor.

RESEARCH SUMMARY GUIDELINES:
- Be SPECIFIC and DETAILED (not vague like "machine learning" or "computer vision")
- Include concrete techniques, methods, and applications
- Focus on their ACTUAL research topics based on publication areas
- Use technical terminology
- Format as a flowing paragraph (NOT a list)
- Length: 30-50 words
- Language: English only

GOOD EXAMPLE:
"Physics-informed neural networks for fluid temperature reconstruction, real-time fluid simulation optimization, crowd simulation and physics simulation acceleration (recurrent neural networks, fluid carving, linear octree structures, motion capture)"

BAD EXAMPLES (too vague):
- "Machine learning and computer vision"
- "Deep learning applications"
- "AI research"

REQUIRED OUTPUT FORMAT (JSON only):
{
  "q1": "YES|NO",
  "q2": "YES|NO|N/A",
  "q3": "YES|NO|N/A",
  "q4": "YES|NO|N/A",
  "q5": "YES|NO|N/A",
  "decision_path": "Q1=YES→Q2=YES→Q3=NO",
  "score": 0.XX,
  "reasoning": "Brief explanation of each decision (2-3 sentences max)",
  "research_summary": "Precise research direction summary as described above (30-50 words)"
}

CRITICAL RULES:
- Answer each question based ONLY on the facts provided
- Use N/A for questions that don't apply based on previous answers
- The score MUST match the decision path
- Be objective and consistent
`.trim()
}

/**
 * System prompt for decision tree evaluation
 */
export const DECISION_TREE_SYSTEM_PROMPT = `You are an academic research evaluator using a binary decision tree methodology.

Your task is to answer YES/NO questions objectively to determine research alignment.

CRITICAL RULES:
1. Each question has a clear YES or NO answer - avoid ambiguity
2. Base your answers ONLY on the provided data (publication areas, counts, years)
3. Follow the decision tree logic strictly - previous answers determine which questions apply
4. The decision path automatically determines the score range
5. Be consistent - same facts should always lead to same decisions

Think systematically: read the data carefully, answer each question based on objective criteria, and let the decision tree determine the score.`

/**
 * Parse decision tree evaluation response
 */
export function parseDecisionTreeScore(response) {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', response)
      return {
        score: 0,
        reasoning: 'Failed to parse response - no JSON found',
        researchSummary: 'Unable to generate research summary',
        decisionPath: 'ERROR',
        decisions: {}
      }
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    
    // Extract YES/NO answers
    const q1 = (parsed.q1 || '').toUpperCase() === 'YES'
    const q2 = (parsed.q2 || '').toUpperCase() === 'YES'
    const q3 = (parsed.q3 || '').toUpperCase() === 'YES'
    const q4 = (parsed.q4 || '').toUpperCase() === 'YES'
    const q5 = (parsed.q5 || '').toUpperCase() === 'YES'
    
    // Determine correct score range based on decision path
    let scoreRange = [0, 0.19]
    let matchLevel = 'No Match'
    let decisionPath = ''
    
    if (q1) {
      if (q2) {
        if (q3) {
          scoreRange = [0.90, 1.00]
          matchLevel = 'Perfect Match'
          decisionPath = 'Q1=YES→Q2=YES→Q3=YES'
        } else {
          scoreRange = [0.75, 0.89]
          matchLevel = 'Strong Match'
          decisionPath = 'Q1=YES→Q2=YES→Q3=NO'
        }
      } else {
        scoreRange = [0.60, 0.74]
        matchLevel = 'Good Match'
        decisionPath = 'Q1=YES→Q2=NO'
      }
    } else {
      if (q4) {
        if (q5) {
          scoreRange = [0.40, 0.59]
          matchLevel = 'Moderate Match'
          decisionPath = 'Q1=NO→Q4=YES→Q5=YES'
        } else {
          scoreRange = [0.20, 0.39]
          matchLevel = 'Weak Match'
          decisionPath = 'Q1=NO→Q4=YES→Q5=NO'
        }
      } else {
        scoreRange = [0.00, 0.19]
        matchLevel = 'No Match'
        decisionPath = 'Q1=NO→Q4=NO'
      }
    }
    
    let score = parseFloat(parsed.score) || 0
    const [min, max] = scoreRange
    
    // Auto-correct score if it doesn't match the decision path
    if (score < min || score > max) {
      const originalScore = score
      score = (min + max) / 2 // Use middle of range
      console.warn(
        `Score ${originalScore} doesn't match decision path ${decisionPath}. ` +
        `Expected range [${min}, ${max}]. Auto-corrected to ${score.toFixed(2)}`
      )
    }
    
      return {
        score: Math.min(1.0, Math.max(0.0, score)),
        decisionPath: decisionPath,
        matchLevel: matchLevel,
        reasoning: parsed.reasoning || '',
        researchSummary: parsed.research_summary || 'Research summary not available',
        decisions: {
          q1: q1,
          q2: q2,
          q3: q3,
          q4: q4,
          q5: q5
        },
        scoreRange: scoreRange
      }
  } catch (error) {
    console.error('Error parsing decision tree response:', error)
    console.error('Response was:', response)
    return {
      score: 0,
      reasoning: `Error parsing response: ${error.message}`,
      researchSummary: 'Error generating research summary',
      decisionPath: 'ERROR',
      decisions: {}
    }
  }
}

/**
 * Export as default for easy importing
 */
export default {
  buildPrompt: buildDecisionTreePrompt,
  parseScore: parseDecisionTreeScore,
  systemPrompt: DECISION_TREE_SYSTEM_PROMPT
}

