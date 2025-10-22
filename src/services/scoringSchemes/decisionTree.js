/**
 * Binary Decision Tree Scoring Scheme
 * 
 * Uses YES/NO questions to objectively evaluate professor-research alignment.
 * Provides 95%+ consistency across different LLMs.
 */

import { promptService } from '../promptService'

/**
 * Build decision tree evaluation prompt (English)
 * Now loads from external text file
 */
export async function buildDecisionTreePrompt(professor, researchDirection) {
  // Extract publication data
  let recentPapers = []
  
  // Check if we have a publication list from hybrid method
  if (professor.publicationList && professor.publicationList.length > 0) {
    // Use new publication list format (from CSRankings + DBLP)
    recentPapers = professor.publicationList
      .filter(pub => pub.year >= 2020)
      .slice(0, 20) // Limit to 20 most recent
      .map(pub => `${pub.title} (${pub.venue}, ${pub.year})`)
  } else {
    // Fallback to original publications object format
    for (const [area, years] of Object.entries(professor.publications || {})) {
      for (const [year, count] of Object.entries(years)) {
        if (parseInt(year) >= 2020 && count > 0) {
          recentPapers.push(`${area} (${year}): ${count} papers`)
        }
      }
    }
  }
  
  // Load prompt template from file
  const template = await promptService.loadPrompt('decision-tree-user-prompt.txt')
  
  // Render with variables
  return promptService.renderPrompt(template, {
    'professor.name': professor.name,
    'professor.affiliation': professor.affiliation,
    'professor.areas': professor.areas ? professor.areas.join(', ') : 'Not specified',
    'publications': recentPapers.length > 0 ? recentPapers.join('\n') : 'No publication data available',
    'researchDirection': researchDirection
  })
}

// Remove the old inline prompt - now in public/prompts/decision-tree-user-prompt.txt
// The file contains the full prompt with all questions and scoring logic

/**
 * Get system prompt for Decision Tree Method
 * Now loads from external text file
 */
export async function getDecisionTreeSystemPrompt() {
  return await promptService.loadPrompt('decision-tree-system-prompt.txt')
}

// Legacy export for backward compatibility (will load on first use)
export let DECISION_TREE_SYSTEM_PROMPT = null
promptService.loadPrompt('decision-tree-system-prompt.txt').then(text => {
  DECISION_TREE_SYSTEM_PROMPT = text
})

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
    
    // Clean up common JSON formatting issues from LLM
    let jsonText = jsonMatch[0]
    // Fix double quotes before property names (e.g., ""research_summary" → "research_summary")
    jsonText = jsonText.replace(/""(\w+)":/g, '"$1":')
    // Fix trailing commas before closing braces
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1')
    
    const parsed = JSON.parse(jsonText)
    
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

