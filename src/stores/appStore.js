/**
 * Main application store using Pinia
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dataService from '@/services/dataService'
import { batchFilterProfessors } from '@/services/llmService'
import { localLLM } from '@/services/localLLM'
import { filterByYearRange, filterByVenues, calculateRelevantPapers } from '@/utils/filterUtils'

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
  
  // LLM settings
  const llmProvider = ref('openai')
  const llmApiKey = ref('')
  const llmModel = ref('')
  const llmBaseURL = ref('')
  const researchDirection = ref('')
  const threshold = ref(0.6)
  const maxWorkers = ref(10)
  const batchSize = ref(10)
  const maxPapers = ref(20)
  
  // Processing state
  const isProcessing = ref(false)
  const processedCount = ref(0)
  const totalCount = ref(0)
  const processingStartTime = ref(null)
  
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
    let result = [...professors.value]
    console.log('=== Filtering Candidates ===')
    console.log('Starting with:', result.length, 'professors')
    
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
        .slice(0, 500) // Show more professors initially
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
      
      const data = await dataService.loadRegions(selectedRegions.value)
      console.log('Raw data loaded:', data.length, 'professors')
      
      professors.value = data
      llmFilteredProfessors.value = []
      
      // Apply filters manually (not reactive)
      applyCandidateFilters()
      
      console.log('Professors stored:', professors.value.length)
      console.log('Filtered candidates:', cachedCandidates.value.length)
    } catch (error) {
      console.error('Failed to load professors:', error)
      console.error('Error details:', error.stack)
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
    
    if (useLocalLLM.value && !localLLM.isReady()) {
      throw new Error('Local model not loaded. Please load a model first.')
    }
    
    if (!useLocalLLM.value && !llmApiKey.value.trim()) {
      throw new Error('Please provide an API key or switch to local model')
    }
    
    isProcessing.value = true
    processedCount.value = 0
    totalCount.value = candidateProfessors.value.length
    processingStartTime.value = Date.now()
    
    try {
      let results
      
      if (useLocalLLM.value) {
        // Use local LLM
        results = []
        for (let i = 0; i < candidateProfessors.value.length; i++) {
          const prof = candidateProfessors.value[i]
          const { score, reasoning } = await localLLM.evaluateProfessor(
            prof,
            researchDirection.value
          )
          
          results.push({
            ...prof,
            matchScore: score,
            matchReasoning: reasoning
          })
          
          processedCount.value = i + 1
        }
      } else {
        // Use cloud LLM
        const config = {
          provider: llmProvider.value,
          apiKey: llmApiKey.value,
          model: llmModel.value,
          baseURL: llmBaseURL.value,
          researchDirection: researchDirection.value
        }
        
        results = await batchFilterProfessors(
          candidateProfessors.value,
          config,
          (processed, total) => {
            processedCount.value = processed
            totalCount.value = total
          }
        )
      }
      
      llmFilteredProfessors.value = results
      
      console.log(`Filtered ${results.length} professors`)
    } catch (error) {
      console.error('LLM filtering failed:', error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }
  
  async function loadLocalModel(modelName, onProgress) {
    localModelLoading.value = true
    
    try {
      await localLLM.loadModel(modelName, onProgress)
      localModelReady.value = true
    } catch (error) {
      localModelReady.value = false
      throw error
    } finally {
      localModelLoading.value = false
    }
  }
  
  function resetFilters() {
    selectedRegions.value = ['us']
    yearRange.value = [2020, 2025]
    selectedVenues.value = []
    searchQuery.value = ''
    llmFilteredProfessors.value = []
    professors.value = []
    cachedCandidates.value = []
  }
  
  function resetLLMConfig() {
    researchDirection.value = ''
    threshold.value = 0.6
    llmFilteredProfessors.value = []
  }
  
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
    loadLocalModel,
    resetFilters,
    resetLLMConfig
  }
})

