/**
 * LLM Service for professor filtering
 * Supports multiple providers: OpenAI, Gemini, Claude, DeepSeek
 */

import { publicationService, DataSource } from './publicationService'
import { promptService } from './promptService'
import { logService } from './logService'

export class LLMService {
  constructor(config) {
    this.provider = config.provider
    this.apiKey = config.apiKey
    this.model = config.model
    this.baseURL = config.baseURL
    this.signal = config.signal
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
      signal: this.signal,
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
      signal: this.signal,
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
      signal: this.signal,
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
      signal: this.signal,
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
 * Build prompt for professor evaluation (Basic Method)
 * Now loads from external text file
 */
export async function buildProfessorPrompt(professor, researchDirection) {
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
  const template = await promptService.loadPrompt('basic-user-prompt.txt')
  
  // Render with variables
  return promptService.renderPrompt(template, {
    'professor.name': professor.name,
    'professor.affiliation': professor.affiliation,
    'professor.areas': professor.areas ? professor.areas.join(', ') : 'Not specified',
    'publications': recentPapers.length > 0 ? recentPapers.join('\n') : 'No recent publications found',
    'researchDirection': researchDirection
  })
}

/**
 * Get system prompt for Basic Method
 * Now loads from external text file
 */
export async function getBasicSystemPrompt() {
  return await promptService.loadPrompt('basic-system-prompt.txt')
}

// Legacy export for backward compatibility (will load on first use)
export let SYSTEM_PROMPT = null
promptService.loadPrompt('basic-system-prompt.txt').then(text => {
  SYSTEM_PROMPT = text
})

/**
 * Parse LLM response to extract score
 */
export function parseScore(response) {
  try {
    // Try to parse as JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      // Clean up common JSON formatting issues from LLM (same as Decision Tree)
      let jsonText = jsonMatch[0]
      jsonText = jsonText.replace(/""(\w+)":/g, '"$1":') // Fix double quotes
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1')   // Fix trailing commas
      
      const parsed = JSON.parse(jsonText)
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
  
  // Debug: Log entire config
  console.log('🔧 Config received in batchFilterProfessors:', {
    publicationSource: config.publicationSource,
    scoringScheme: config.scoringScheme,
    maxWorkers: config.maxWorkers,
    maxPapers: config.maxPapers
  })
  logService.log('llm', 'info', 'LLM processing started', config)
  
  // Preload prompts
  console.log('📄 Preloading prompt templates...')
  logService.log('llm', 'info', 'Preloading prompt templates')
  await promptService.preloadAll()
  
  // Configure DBLP request queue and abort signal
  if (config.publicationSource === 'hybrid' || config.publicationSource === 'dblp-priority') {
    const dblpConcurrency = config.dblpConcurrency || 3
    publicationService.configureDBLPQueue(dblpConcurrency, 500) // Increased to 500ms to avoid rate limiting
    publicationService.setAbortSignal(config.signal) // Pass abort signal for cancellation
  }
  
  // Select scoring scheme
  let buildPrompt, parseScoreFn, systemPrompt
  
  if (config.scoringScheme === 'decision_tree') {
    // Use decision tree scoring
    const decisionTree = await import('./scoringSchemes/decisionTree.js')
    buildPrompt = decisionTree.buildDecisionTreePrompt
    parseScoreFn = decisionTree.parseDecisionTreeScore
    systemPrompt = await promptService.loadPrompt('decision-tree-system-prompt.txt')
    console.log('📋 Using Decision Tree scoring method (95% consistency)')
  } else {
    // Use original scoring
    buildPrompt = buildProfessorPrompt
    parseScoreFn = parseScore
    systemPrompt = await promptService.loadPrompt('basic-system-prompt.txt')
    console.log('📋 Using Original scoring method')
  }
  
  // Parallel processing with configurable concurrency
  const CONCURRENT_REQUESTS = config.maxWorkers || 10 // Use user-configured concurrency
  const BATCH_DELAY = 50 // Delay between batches (ms)
  
  console.log(`🚀 Starting parallel processing with ${CONCURRENT_REQUESTS} concurrent requests`)
  console.log(`📊 Total professors to process: ${professors.length}`)
  console.log(`📄 Publication source configured: ${config.publicationSource || 'NOT SET'}`)
  logService.log('llm', 'success', `Starting parallel processing with ${CONCURRENT_REQUESTS} concurrent requests, Total: ${professors.length}`)
  
  // Clear old results at the start (real-time display)
  if (config.onBatchComplete) {
    config.onBatchComplete([], 0, true) // true = shouldClear
  }
  
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
        // Get publications based on configured source
        let publicationSources = []
        let enrichedProfessor = { ...professor }
        
        // Debug log for first professor in first batch
        if (batchIndex === 0 && batch.indexOf(professor) === 0) {
          console.log(`🔍 DEBUG: config.publicationSource = "${config.publicationSource}"`)
          console.log(`🔍 DEBUG: Will use ${config.publicationSource === 'hybrid' ? 'HYBRID' : 'SCHOLAR'} method`)
        }
        
        if (config.publicationSource === 'hybrid') {
          // Use new hybrid method (CSRankings + DBLP)
          try {
            const pubResult = await publicationService.getPublicationsHybrid(professor, {
              allowScholar: false,
              maxPapers: config.maxPapers || 20,
              enableDBLP: true // Enabled: Get real paper titles from DBLP API
            })
            
            // Add publication data to professor object
            enrichedProfessor.publicationList = pubResult.papers
            publicationSources = pubResult.sources
            
            // Debug: Log paper count for first professor
            if (batchIndex === 0 && batch.indexOf(professor) === 0) {
              console.log(`📄 ${professor.name}: Got ${pubResult.papers.length} papers from ${pubResult.sources.join('+')}`)
              if (pubResult.papers.length > 0) {
                console.log(`   Sample papers:`, pubResult.papers.slice(0, 3).map(p => `${p.title} (${p.year})`))
              }
            }
          } catch (error) {
            console.warn(`⚠️ Hybrid method failed for ${professor.name}, using original data:`, error)
            // Fallback to original publications object
            publicationSources = [DataSource.SCHOLAR_SCRAPER]
          }
        } else {
          // Use original scholar scraper method
          publicationSources = [DataSource.SCHOLAR_SCRAPER]
        }
        
        const prompt = await buildPrompt(enrichedProfessor, config.researchDirection)
        const response = await llmService.call(prompt, systemPrompt)
        const result = parseScoreFn(response)
        
        return {
          ...professor,
          matchScore: result.score,
          matchReasoning: result.reasoning,
          researchSummary: result.researchSummary || result.reasoning,
          decisionPath: result.decisionPath,
          matchLevel: result.matchLevel,
          publicationSources // Add data source information
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
    logService.log('progress', 'success', `Batch ${batchIndex + 1}/${batches.length} completed in ${batchTime}s (${rate} profs/sec)`)
    
    if (onProgress) {
      onProgress(processedCount, professors.length)
    }
    
    // Real-time callback with matched professors only
    if (config.onBatchComplete) {
      const matchedInBatch = batchResults.filter(p => p.matchScore >= config.threshold)
      if (matchedInBatch.length > 0) {
        config.onBatchComplete(matchedInBatch, processedCount, false)
        logService.log('results', 'success', `Matched: +${matchedInBatch.length} professors (Total: ${processedCount})`)
      }
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

