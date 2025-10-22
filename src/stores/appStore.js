/**
 * Main application store using Pinia
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import dataService from '@/services/dataService'
import { batchFilterProfessors } from '@/services/llmService'
import { backendLLM } from '@/services/backendLLM'
import { logService } from '@/services/logService'
import { publicationService } from '@/services/publicationService'
import { filterByYearRange, filterByVenues, calculateRelevantPapers } from '@/utils/filterUtils'

// LLM Settings persistence
const LLM_CONFIG_KEY = 'csprofalign-llm-config'

function loadLLMSettings() {
  try {
    const saved = localStorage.getItem(LLM_CONFIG_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.warn('Failed to load LLM settings from localStorage:', error)
  }
  return null
}

function saveLLMSettings(settings) {
  try {
    localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(settings))
  } catch (error) {
    console.warn('Failed to save LLM settings to localStorage:', error)
  }
}

export const useAppStore = defineStore('app', () => {
  // State
  const loading = ref(false)
  const loadingMessage = ref('')
  const professors = ref([])
  const filteredProfessors = ref([])
  const llmFilteredProfessors = ref([])
  
  // Filter settings
  const selectedRegions = ref(['us'])
  const yearRange = ref([2020, 2025]) // Default to recent years
  const selectedVenues = ref([])
  const searchQuery = ref('')
  
  // Load saved LLM settings
  const savedSettings = loadLLMSettings()
  
  // LLM settings (with defaults from localStorage)
  const llmProvider = ref(savedSettings?.llmProvider || 'openai')
  const llmApiKey = ref(savedSettings?.llmApiKey || '')
  const llmModel = ref(savedSettings?.llmModel || '')
  const llmBaseURL = ref(savedSettings?.llmBaseURL || '')
  const researchDirection = ref(savedSettings?.researchDirection || '')
  const threshold = ref(savedSettings?.threshold ?? 0.6)
  const maxWorkers = ref(savedSettings?.maxWorkers || 10)
  const batchSize = ref(savedSettings?.batchSize || 10)
  const maxPapers = ref(savedSettings?.maxPapers || 20)
  const scoringScheme = ref(savedSettings?.scoringScheme || 'original') // 'original' or 'decision_tree'
  const publicationSource = ref(savedSettings?.publicationSource || 'hybrid') // 'hybrid' or 'scholar'
  const dblpConcurrency = ref(savedSettings?.dblpConcurrency ?? 5) // DBLP API concurrency, default 5, adjustable 1-10
  const publicationStats = ref({
    csrankingsCount: 0,
    dblpCount: 0,
    scholarCount: 0,
    totalCount: 0
  })
  
  // Processing state
  const isProcessing = ref(false)
  const processedCount = ref(0)
  const totalCount = ref(0)
  const processingStartTime = ref(null)
  const abortController = ref(null)
  
  // Local LLM state
  const useLocalLLM = ref(false)
  const localModelLoading = ref(false)
  const localModelReady = ref(false)
  
  // Computed
  const processingProgress = computed(() => {
    if (totalCount.value === 0) return 0
    return Math.round((processedCount.value / totalCount.value) * 100)
  })
  
  const estimatedTimeRemaining = computed(() => {
    if (!processingStartTime.value || processedCount.value === 0) {
      return null
    }
    
    const elapsed = Date.now() - processingStartTime.value
    const avgTime = elapsed / processedCount.value
    const remaining = (totalCount.value - processedCount.value) * avgTime
    
    return Math.ceil(remaining / 1000) // seconds
  })
  
  // Cached filtered professors (not reactive to avoid auto-update)
  const cachedCandidates = ref([])
  
  const candidateProfessors = computed(() => {
    // Return cached results unless explicitly updated
    if (cachedCandidates.value.length > 0 || professors.value.length === 0) {
      return cachedCandidates.value
    }
    return professors.value
  })
  
  // Manual filter function (called explicitly, not reactive)
  function applyCandidateFilters() {
    // Clear LLM filtered results when applying new filters
    llmFilteredProfessors.value = []
    
    let result = [...professors.value]
    console.log('=== Filtering Candidates ===')
    console.log('Starting with:', result.length, 'professors')
    logService.log('filter', 'info', `Applying filters to ${result.length} professors`)
    
    // Apply year range filter
    result = filterByYearRange(result, yearRange.value[0], yearRange.value[1])
    console.log('After year filter:', result.length)
    
    // Apply venue filter
    if (selectedVenues.value.length > 0) {
      console.log('Filtering by venues:', selectedVenues.value)
      result = filterByVenues(result, selectedVenues.value)
      console.log('After venue filter:', result.length)
    } else {
      console.log('No venue filter (showing all areas)')
    }
    
    // Calculate relevant papers
    result = result.map(prof => ({
      ...prof,
      relevantPapers: calculateRelevantPapers(
        prof,
        selectedVenues.value,
        yearRange.value[0],
        yearRange.value[1]
      )
    }))
    
    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(prof => 
        prof.name.toLowerCase().includes(query) ||
        prof.affiliation.toLowerCase().includes(query)
      )
      console.log('After search filter:', result.length)
    }
    
    console.log('Final candidate professors:', result.length)
    cachedCandidates.value = result
    return result
  }
  
  const displayProfessors = computed(() => {
    if (llmFilteredProfessors.value.length > 0) {
      // Show LLM filtered results
      const filtered = llmFilteredProfessors.value.filter(prof => 
        prof.matchScore >= threshold.value
      )
      return filtered.sort((a, b) => b.matchScore - a.matchScore)
    }
    
    // Show all candidate professors (before LLM filtering)
    if (professors.value.length > 0) {
      return candidateProfessors.value
        .sort((a, b) => (b.relevantPapers || 0) - (a.relevantPapers || 0))
    }
    
    return []
  })
  
  // Actions
  async function loadProfessors() {
    loading.value = true
    loadingMessage.value = 'Loading professor data...'
    
    try {
      console.log('=== Loading Professors ===')
      console.log('Selected regions:', selectedRegions.value)
      console.log('Year range:', yearRange.value)
      console.log('Selected venues:', selectedVenues.value)
      logService.log('data', 'info', `Loading professors from: ${selectedRegions.value.join(', ')}`)
      
      const data = await dataService.loadRegions(selectedRegions.value)
      console.log('Raw data loaded:', data.length, 'professors')
      logService.log('data', 'success', `Data loaded: ${data.length} professors`)
      
      professors.value = data
      llmFilteredProfessors.value = []
      
      // Apply filters manually (not reactive)
      applyCandidateFilters()
      
      console.log('Professors stored:', professors.value.length)
      console.log('Filtered candidates:', cachedCandidates.value.length)
    } catch (error) {
      console.error('Failed to load professors:', error)
      console.error('Error details:', error.stack)
      logService.log('data', 'error', 'Failed to load professors: ' + error.message)
      throw error
    } finally {
      loading.value = false
      loadingMessage.value = ''
    }
  }
  
  async function runLLMFilter() {
    if (!researchDirection.value.trim()) {
      throw new Error('Please provide a research direction')
    }
    
    const isUsingLocal = useLocalLLM.value || llmProvider.value === 'local'
    
    if (isUsingLocal && !backendLLM.isReady) {
      throw new Error('Local model not loaded. Please load a model first.')
    }
    
    if (!isUsingLocal && !llmApiKey.value.trim()) {
      throw new Error('Please provide an API key or switch to local model')
    }
    
    // Create new AbortController for this processing session
    abortController.value = new AbortController()
    
    isProcessing.value = true
    processedCount.value = 0
    totalCount.value = candidateProfessors.value.length
    processingStartTime.value = Date.now()
    logService.resetTimer()
    logService.log('llm', 'info', `Starting LLM filter for ${totalCount.value} professors`)
    
    try {
      let results
      
      if (useLocalLLM.value || llmProvider.value === 'local') {
        // Use backend LLM (vLLM) with batch processing
        results = []
        const BATCH_SIZE = 20 // Process 20 professors at a time (GPU-accelerated batch)
        const professors = candidateProfessors.value
        
        // Split into batches
        const batches = []
        for (let i = 0; i < professors.length; i += BATCH_SIZE) {
          batches.push(professors.slice(i, i + BATCH_SIZE))
        }
        
        console.log(`🚀 Backend LLM: Processing ${professors.length} professors in ${batches.length} batches (${BATCH_SIZE} per batch)`)
        logService.log('llm', 'info', `Backend LLM batch processing: ${batches.length} batches, ${BATCH_SIZE} professors per batch`)
        
        let processedSoFar = 0
        const startTime = Date.now()
        
        // Clear old results
        llmFilteredProfessors.value = []
        
        // Process each batch sequentially (backend handles parallelization)
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex]
          const batchStartTime = Date.now()
          
          console.log(`[Batch ${batchIndex + 1}/${batches.length}] Processing ${batch.length} professors via backend API...`)
          
          try {
            // Fetch publication data for all professors in batch
            const enrichedBatch = await Promise.all(
              batch.map(async (prof) => {
                const enrichedProf = { ...prof }
                
                if (publicationSource.value === 'hybrid') {
                  try {
                    const pubResult = await publicationService.getPublicationsHybrid(prof, {
                      allowScholar: false,
                      maxPapers: maxPapers.value || 20,
                      enableDBLP: true
                    })
                    enrichedProf.publicationList = pubResult.papers
                    enrichedProf.publicationSources = pubResult.sources
                  } catch (error) {
                    console.warn(`⚠️ Failed to get publications for ${prof.name}:`, error)
                  }
                }
                
                return enrichedProf
              })
            )
            
            // Call backend API for batch evaluation
            const response = await backendLLM.evaluateBatch(
              enrichedBatch,
              researchDirection.value,
              threshold.value
            )
            
            // Map results back to professor objects
            const batchResults = response.results.map((result, idx) => ({
              ...enrichedBatch[idx],
              matchScore: result.score,
              matchReasoning: result.reasoning,
              researchSummary: result.researchSummary
            }))
            
            results.push(...batchResults)
            
            // Update progress
            processedSoFar += batchResults.length
            processedCount.value = processedSoFar
            
            // Filter and add matched professors to display in real-time
            const matchedInBatch = batchResults.filter(p => p.matchScore >= threshold.value)
            if (matchedInBatch.length > 0) {
              llmFilteredProfessors.value.push(...matchedInBatch)
            }
            
            const elapsed = (Date.now() - startTime) / 1000
            const rate = (processedSoFar / elapsed).toFixed(2)
            const batchTime = ((Date.now() - batchStartTime) / 1000).toFixed(2)
            
            console.log(`✅ Backend batch ${batchIndex + 1}/${batches.length} done in ${batchTime}s (${rate} profs/sec) - Matched: ${matchedInBatch.length}`)
            logService.log('progress', 'success', `Backend batch ${batchIndex + 1}/${batches.length} completed in ${batchTime}s (${rate} profs/sec)`)
            logService.log('results', 'success', `Matched: +${matchedInBatch.length} professors (Total: ${llmFilteredProfessors.value.length})`)
            
            // Check for abort
            if (abortController.value?.signal?.aborted) {
              throw new Error('Processing cancelled by user')
            }
            
          } catch (error) {
            console.error(`❌ Error processing batch ${batchIndex + 1}:`, error)
            // Continue with next batch
          }
        }
      } else {
        // Use cloud LLM
        const config = {
          provider: llmProvider.value,
          apiKey: llmApiKey.value,
          model: llmModel.value,
          baseURL: llmBaseURL.value,
          researchDirection: researchDirection.value,
          threshold: threshold.value, // Pass threshold for real-time filtering
          maxWorkers: maxWorkers.value, // Pass concurrency config
          batchSize: batchSize.value,
          maxPapers: maxPapers.value,
          scoringScheme: scoringScheme.value, // Pass scoring scheme
          publicationSource: publicationSource.value, // Pass publication source
          dblpConcurrency: dblpConcurrency.value, // Pass DBLP concurrency
          signal: abortController.value.signal, // Pass abort signal
          
          // Real-time callback for batch completion
          onBatchComplete: (matchedProfessors, processed, shouldClear) => {
            if (shouldClear) {
              // Clear old results on first call
              llmFilteredProfessors.value = []
              console.log('🔄 Cleared old results, starting fresh')
            }
            
            // Add new matched professors
            if (matchedProfessors.length > 0) {
              llmFilteredProfessors.value.push(...matchedProfessors)
              console.log(`📊 Real-time update: +${matchedProfessors.length} professors (Total: ${llmFilteredProfessors.value.length})`)
            }
            
            // Update processed count
            processedCount.value = processed
          }
        }
        
        console.log(`🚀 Starting LLM filter with ${maxWorkers.value} concurrent workers`)
        
        results = await batchFilterProfessors(
          candidateProfessors.value,
          config,
          (processed, total) => {
            processedCount.value = processed
            totalCount.value = total
          }
        )
      }
      
      // Final update: ensure all results are captured (in case callback missed any)
      llmFilteredProfessors.value = results.filter(p => p.matchScore >= threshold.value)
      
      // Debug: Show score distribution
      const scoreDistribution = {}
      results.forEach(prof => {
        const scoreRange = Math.floor(prof.matchScore * 10) / 10
        scoreDistribution[scoreRange] = (scoreDistribution[scoreRange] || 0) + 1
      })
      
      console.log(`✅ Processed ${results.length} professors`)
      console.log(`📊 Score distribution:`, scoreDistribution)
      
      const passedFilter = results.filter(prof => prof.matchScore >= threshold.value)
      console.log(`🎯 Professors passing threshold (${threshold.value}): ${passedFilter.length}/${results.length}`)
      
      if (passedFilter.length < 10 && passedFilter.length > 0) {
        console.log(`📝 Professors who passed:`)
        passedFilter.forEach(prof => {
          console.log(`  - ${prof.name}: ${prof.matchScore.toFixed(2)} | ${prof.researchSummary?.substring(0, 80)}...`)
        })
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('LLM filtering was aborted by user')
        logService.log('llm', 'warning', 'LLM filtering was aborted by user')
      } else {
        console.error('LLM filtering failed:', error)
        logService.log('llm', 'error', 'LLM filtering failed: ' + error.message)
        throw error
      }
    } finally {
      isProcessing.value = false
      abortController.value = null
      const stats = logService.getStats()
      logService.log('llm', 'success', `LLM filter completed. Processed: ${processedCount.value}/${totalCount.value}, Elapsed: ${stats.elapsed}s`)
    }
  }
  
  function stopLLMFilter() {
    if (abortController.value) {
      abortController.value.abort()
      console.log('🛑 Aborting LLM filtering...')
    }
    isProcessing.value = false
    processedCount.value = 0
    totalCount.value = 0
    abortController.value = null
  }
  
  async function loadLocalModel(modelName, onProgress) {
    localModelLoading.value = true
    
    try {
      await backendLLM.loadModel(modelName, onProgress)
      localModelReady.value = true
    } catch (error) {
      localModelReady.value = false
      throw error
    } finally {
      localModelLoading.value = false
    }
  }
  
  async function unloadLocalModel() {
    try {
      await backendLLM.unloadModel()
      localModelReady.value = false
      localModelLoading.value = false
      console.log('✅ Backend model unloaded from store')
    } catch (error) {
      console.error('Error unloading backend model:', error)
      // Force reset state even if error
      localModelReady.value = false
      localModelLoading.value = false
      throw error
    }
  }
  
  function resetFilters() {
    selectedRegions.value = ['us']
    yearRange.value = [2020, 2025]
    selectedVenues.value = []
    searchQuery.value = ''
    // Keep llmFilteredProfessors to allow export after reset
    professors.value = []
    cachedCandidates.value = []
  }
  
  function resetLLMConfig() {
    researchDirection.value = ''
    threshold.value = 0.6
    llmFilteredProfessors.value = []
  }
  
  // Watch for LLM settings changes and save to localStorage
  watch(
    [
      llmProvider,
      llmApiKey,
      llmModel,
      llmBaseURL,
      researchDirection,
      threshold,
      maxWorkers,
      batchSize,
      maxPapers,
      scoringScheme,
      publicationSource,
      dblpConcurrency
    ],
    () => {
      saveLLMSettings({
        llmProvider: llmProvider.value,
        llmApiKey: llmApiKey.value,
        llmModel: llmModel.value,
        llmBaseURL: llmBaseURL.value,
        researchDirection: researchDirection.value,
        threshold: threshold.value,
        maxWorkers: maxWorkers.value,
        batchSize: batchSize.value,
        maxPapers: maxPapers.value,
        scoringScheme: scoringScheme.value,
        publicationSource: publicationSource.value,
        dblpConcurrency: dblpConcurrency.value
      })
    },
    { deep: true }
  )
  
  return {
    // State
    loading,
    loadingMessage,
    professors,
    filteredProfessors,
    llmFilteredProfessors,
    
    // Filter settings
    selectedRegions,
    yearRange,
    selectedVenues,
    searchQuery,
    
    // LLM settings
    llmProvider,
    llmApiKey,
    llmModel,
    llmBaseURL,
    researchDirection,
    threshold,
    maxWorkers,
    batchSize,
    maxPapers,
    scoringScheme,
    publicationSource,
    dblpConcurrency,
    publicationStats,
    
    // Processing state
    isProcessing,
    processedCount,
    totalCount,
    processingStartTime,
    
    // Local LLM state
    useLocalLLM,
    localModelLoading,
    localModelReady,
    
    // Computed
    processingProgress,
    estimatedTimeRemaining,
    candidateProfessors,
    displayProfessors,
    
    // Actions
    loadProfessors,
    applyCandidateFilters,
    runLLMFilter,
    stopLLMFilter,
    loadLocalModel,
    unloadLocalModel,
    resetFilters,
    resetLLMConfig
  }
})

