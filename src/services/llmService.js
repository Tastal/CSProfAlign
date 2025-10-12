/**
 * LLM Service for professor filtering
 * Supports multiple providers: OpenAI, Gemini, Claude, DeepSeek
 */

export class LLMService {
  constructor(config) {
    this.provider = config.provider
    this.apiKey = config.apiKey
    this.model = config.model
    this.baseURL = config.baseURL
  }

  /**
   * Main call method - routes to appropriate provider
   */
  async call(prompt, systemPrompt) {
    switch (this.provider) {
      case 'openai':
        return this.callOpenAI(prompt, systemPrompt)
      case 'gemini':
        return this.callGemini(prompt, systemPrompt)
      case 'claude':
        return this.callClaude(prompt, systemPrompt)
      case 'deepseek':
        return this.callDeepSeek(prompt, systemPrompt)
      default:
        throw new Error(`Unknown provider: ${this.provider}`)
    }
  }

  /**
   * OpenAI (ChatGPT) API
   */
  async callOpenAI(prompt, systemPrompt) {
    const url = `${this.baseURL || 'https://api.openai.com/v1'}/chat/completions`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  /**
   * Google Gemini API
   */
  async callGemini(prompt, systemPrompt) {
    const url = `${this.baseURL || 'https://generativelanguage.googleapis.com/v1beta'}/models/${this.model || 'gemini-pro'}:generateContent?key=${this.apiKey}`
    
    const fullPrompt = `${systemPrompt}\n\n${prompt}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }

  /**
   * Anthropic Claude API
   */
  async callClaude(prompt, systemPrompt) {
    const url = `${this.baseURL || 'https://api.anthropic.com/v1'}/messages`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model || 'claude-3-sonnet-20240229',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  /**
   * DeepSeek API (OpenAI-compatible)
   */
  async callDeepSeek(prompt, systemPrompt) {
    const url = `${this.baseURL || 'https://api.deepseek.com/v1'}/chat/completions`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`DeepSeek API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }
}

/**
 * Build prompt for professor evaluation
 */
export function buildProfessorPrompt(professor, researchDirection) {
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
Recent Publications (2020-2024):
${recentPapers.join('\n')}

Research Direction to Match:
${researchDirection}

Task: Evaluate how well this professor's research aligns with the specified research direction.
Provide a match score between 0.0 and 1.0, where:
- 0.0-0.3: Poor match (different field or focus)
- 0.4-0.6: Moderate match (related but not core)
- 0.7-0.9: Good match (closely aligned)
- 0.9-1.0: Excellent match (perfectly aligned)

Respond with ONLY a JSON object in this format:
{
  "score": 0.X,
  "reasoning": "Brief explanation (max 100 words)"
}
`.trim()
}

/**
 * System prompt for professor evaluation
 */
export const SYSTEM_PROMPT = `You are an academic research matching assistant. Your task is to evaluate how well a professor's research profile matches a given research direction. Be objective and consider:
1. Research area alignment
2. Recent publication activity
3. Specific topics and techniques
4. Research impact and focus

Provide accurate scores and concise reasoning.`

/**
 * Parse LLM response to extract score
 */
export function parseScore(response) {
  try {
    // Try to parse as JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        score: parseFloat(parsed.score) || 0,
        reasoning: parsed.reasoning || ''
      }
    }
    
    // Try to extract score from text
    const scoreMatch = response.match(/score[:\s]+([0-9.]+)/i)
    if (scoreMatch) {
      return {
        score: parseFloat(scoreMatch[1]) || 0,
        reasoning: response
      }
    }
    
    // Default to 0 if unable to parse
    return {
      score: 0,
      reasoning: 'Failed to parse score from response'
    }
  } catch (error) {
    console.error('Error parsing LLM response:', error)
    return {
      score: 0,
      reasoning: 'Error parsing response'
    }
  }
}

/**
 * Batch process professors with LLM
 */
export async function batchFilterProfessors(professors, config, onProgress) {
  const llmService = new LLMService(config)
  const results = []
  
  for (let i = 0; i < professors.length; i++) {
    try {
      const professor = professors[i]
      const prompt = buildProfessorPrompt(professor, config.researchDirection)
      const response = await llmService.call(prompt, SYSTEM_PROMPT)
      const { score, reasoning } = parseScore(response)
      
      results.push({
        ...professor,
        matchScore: score,
        matchReasoning: reasoning
      })
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, professors.length)
      }
      
      // Rate limiting delay
      if (i < professors.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error(`Error processing professor ${professors[i].name}:`, error)
      results.push({
        ...professors[i],
        matchScore: 0,
        matchReasoning: `Error: ${error.message}`
      })
    }
  }
  
  return results
}

export default LLMService

