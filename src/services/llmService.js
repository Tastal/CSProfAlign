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
        reasoning: parsed.reasoning || '',
        researchSummary: parsed.research_summary || null
      }
    }
    
    // Try to extract score from text
    const scoreMatch = response.match(/score[:\s]+([0-9.]+)/i)
    if (scoreMatch) {
      return {
        score: parseFloat(scoreMatch[1]) || 0,
        reasoning: response,
        researchSummary: null
      }
    }
    
    // Default to 0 if unable to parse
    return {
      score: 0,
      reasoning: 'Failed to parse score from response',
      researchSummary: null
    }
  } catch (error) {
    console.error('Error parsing LLM response:', error)
    return {
      score: 0,
      reasoning: 'Error parsing response',
      researchSummary: null
    }
  }
}

/**
 * Batch process professors with LLM (Parallel Processing)
 */
export async function batchFilterProfessors(professors, config, onProgress) {
  const llmService = new LLMService(config)
  const results = []
  
  // Select scoring scheme
  let buildPrompt, parseScoreFn, systemPrompt
  
  if (config.scoringScheme === 'decision_tree') {
    // Use decision tree scoring
    const decisionTree = await import('./scoringSchemes/decisionTree.js')
    buildPrompt = decisionTree.buildDecisionTreePrompt
    parseScoreFn = decisionTree.parseDecisionTreeScore
    systemPrompt = decisionTree.DECISION_TREE_SYSTEM_PROMPT
    console.log('📋 Using Decision Tree scoring method (95% consistency)')
  } else {
    // Use original scoring
    buildPrompt = buildProfessorPrompt
    parseScoreFn = parseScore
    systemPrompt = SYSTEM_PROMPT
    console.log('📋 Using Original scoring method')
  }
  
  // Parallel processing with configurable concurrency
  const CONCURRENT_REQUESTS = config.maxWorkers || 10 // Use user-configured concurrency
  const BATCH_DELAY = 50 // Delay between batches (ms)
  
  console.log(`🚀 Starting parallel processing with ${CONCURRENT_REQUESTS} concurrent requests`)
  console.log(`📊 Total professors to process: ${professors.length}`)
  
  // Split professors into batches
  const batches = []
  for (let i = 0; i < professors.length; i += CONCURRENT_REQUESTS) {
    batches.push(professors.slice(i, i + CONCURRENT_REQUESTS))
  }
  
  console.log(`📦 Split into ${batches.length} batches`)
  
  let processedCount = 0
  const startTime = Date.now()
  
  // Process each batch in parallel
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    const batchStartTime = Date.now()
    
    const batchPromises = batch.map(async (professor) => {
      try {
        const prompt = buildPrompt(professor, config.researchDirection)
        const response = await llmService.call(prompt, systemPrompt)
        const result = parseScoreFn(response)
        
        return {
          ...professor,
          matchScore: result.score,
          matchReasoning: result.reasoning,
          researchSummary: result.researchSummary || result.reasoning,
          decisionPath: result.decisionPath,
          matchLevel: result.matchLevel
        }
      } catch (error) {
        console.error(`Error processing professor ${professor.name}:`, error)
        return {
          ...professor,
          matchScore: 0,
          matchReasoning: `Error: ${error.message}`
        }
      }
    })
    
    // Wait for all professors in this batch to complete
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Update progress
    processedCount += batchResults.length
    const elapsed = (Date.now() - startTime) / 1000
    const rate = (processedCount / elapsed).toFixed(2)
    const batchTime = ((Date.now() - batchStartTime) / 1000).toFixed(2)
    
    console.log(`✅ Batch ${batchIndex + 1}/${batches.length} completed in ${batchTime}s (${rate} profs/sec)`)
    
    if (onProgress) {
      onProgress(processedCount, professors.length)
    }
    
    // Small delay between batches to avoid rate limiting
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
  const avgRate = (professors.length / totalTime).toFixed(2)
  console.log(`🎉 All processing completed in ${totalTime}s (avg: ${avgRate} profs/sec)`)
  
  return results
}

export default LLMService

