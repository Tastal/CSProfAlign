/**
 * Web Worker for LLM processing
 * Enables parallel processing of professor evaluations
 */

// Import LLM service (note: this may need adjustments based on bundler)
self.addEventListener('message', async (e) => {
  const { type, data } = e.data
  
  switch (type) {
    case 'FILTER_PROFESSOR':
      await filterProfessor(data)
      break
    
    case 'BATCH_FILTER':
      await batchFilter(data)
      break
    
    default:
      self.postMessage({
        type: 'ERROR',
        error: `Unknown message type: ${type}`
      })
  }
})

/**
 * Filter a single professor
 */
async function filterProfessor(data) {
  const { professor, config, index } = data
  
  try {
    const prompt = buildPrompt(professor, config.researchDirection)
    const response = await callLLM(prompt, config)
    const { score, reasoning } = parseScore(response)
    
    self.postMessage({
      type: 'RESULT',
      data: {
        index,
        professor: {
          ...professor,
          matchScore: score,
          matchReasoning: reasoning
        }
      }
    })
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: {
        index,
        error: error.message,
        professor
      }
    })
  }
}

/**
 * Process a batch of professors
 */
async function batchFilter(data) {
  const { professors, config } = data
  const results = []
  
  for (let i = 0; i < professors.length; i++) {
    try {
      const professor = professors[i]
      const prompt = buildPrompt(professor, config.researchDirection)
      const response = await callLLM(prompt, config)
      const { score, reasoning } = parseScore(response)
      
      results.push({
        ...professor,
        matchScore: score,
        matchReasoning: reasoning
      })
      
      // Report progress
      self.postMessage({
        type: 'PROGRESS',
        data: {
          processed: i + 1,
          total: professors.length
        }
      })
    } catch (error) {
      results.push({
        ...professors[i],
        matchScore: 0,
        matchReasoning: `Error: ${error.message}`
      })
    }
    
    // Rate limiting
    if (i < professors.length - 1) {
      await sleep(100)
    }
  }
  
  self.postMessage({
    type: 'BATCH_COMPLETE',
    data: results
  })
}

/**
 * Build evaluation prompt
 */
function buildPrompt(professor, researchDirection) {
  const recentPapers = []
  for (const [area, years] of Object.entries(professor.publications || {})) {
    for (const [year, count] of Object.entries(years)) {
      if (parseInt(year) >= 2020 && count > 0) {
        recentPapers.push(`${area} (${year}): ${count} papers`)
      }
    }
  }
  
  return `
Professor: ${professor.name}
Institution: ${professor.affiliation}
Research Areas: ${(professor.areas || []).join(', ')}
Recent Publications (2020-2024):
${recentPapers.join('\n') || 'No recent publications found'}

Research Direction to Match:
${researchDirection}

Task: Evaluate how well this professor's research aligns with the specified research direction.
Provide a match score between 0.0 and 1.0.

Respond with ONLY a JSON object:
{
  "score": 0.X,
  "reasoning": "Brief explanation"
}
`.trim()
}

/**
 * Call LLM API
 */
async function callLLM(prompt, config) {
  const systemPrompt = `You are an academic research matching assistant. Evaluate how well a professor's research matches a given research direction. Be objective and accurate.`
  
  let url, headers, body
  
  switch (config.provider) {
    case 'openai':
      url = `${config.baseURL || 'https://api.openai.com/v1'}/chat/completions`
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
      body = {
        model: config.model || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      }
      break
    
    case 'deepseek':
      url = `${config.baseURL || 'https://api.deepseek.com/v1'}/chat/completions`
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
      body = {
        model: config.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      }
      break
    
    // Add other providers as needed
    default:
      throw new Error(`Unsupported provider in worker: ${config.provider}`)
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.choices[0].message.content
}

/**
 * Parse LLM response
 */
function parseScore(response) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        score: parseFloat(parsed.score) || 0,
        reasoning: parsed.reasoning || ''
      }
    }
    
    const scoreMatch = response.match(/score[:\s]+([0-9.]+)/i)
    if (scoreMatch) {
      return {
        score: parseFloat(scoreMatch[1]) || 0,
        reasoning: response
      }
    }
    
    return {
      score: 0,
      reasoning: 'Failed to parse score'
    }
  } catch (error) {
    return {
      score: 0,
      reasoning: 'Error parsing response'
    }
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

