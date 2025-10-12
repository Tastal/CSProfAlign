/**
 * CSRankings Area and Conference Configuration
 * Maintains consistency with csrankings.org structure
 */

export const AREA_HIERARCHY = {
  ai: {
    title: 'AI',
    color: '#377eb8',
    subareas: {
      ai: {
        title: 'Artificial intelligence',
        venues: ['aaai', 'ijcai']
      },
      vision: {
        title: 'Computer vision',
        venues: ['cvpr', 'eccv', 'iccv']
      },
      mlmining: {
        title: 'Machine learning',
        venues: ['iclr', 'icml', 'nips', 'kdd']
      },
      nlp: {
        title: 'Natural language processing',
        venues: ['acl', 'emnlp', 'naacl']
      },
      inforet: {
        title: 'The Web & information retrieval',
        venues: ['sigir', 'www']
      }
    }
  },
  systems: {
    title: 'Systems',
    color: '#ff7f00',
    subareas: {
      arch: {
        title: 'Computer architecture',
        venues: ['asplos', 'isca', 'micro', 'hpca']
      },
      comm: {
        title: 'Computer networks',
        venues: ['sigcomm', 'nsdi']
      },
      sec: {
        title: 'Computer security',
        venues: ['ccs', 'oakland', 'usenixsec', 'ndss']
      },
      mod: {
        title: 'Databases',
        venues: ['sigmod', 'vldb', 'icde', 'pods']
      },
      da: {
        title: 'Design automation',
        venues: ['dac', 'iccad']
      },
      bed: {
        title: 'Embedded & real-time systems',
        venues: ['emsoft', 'rtas', 'rtss']
      },
      hpc: {
        title: 'High-performance computing',
        venues: ['hpdc', 'ics', 'sc']
      },
      mobile: {
        title: 'Mobile computing',
        venues: ['mobicom', 'mobisys', 'sensys']
      },
      metrics: {
        title: 'Measurement & perf. analysis',
        venues: ['imc', 'sigmetrics']
      },
      ops: {
        title: 'Operating systems',
        venues: ['osdi', 'sosp', 'eurosys', 'fast', 'usenixatc']
      },
      plan: {
        title: 'Programming languages',
        venues: ['pldi', 'popl', 'icfp', 'oopsla']
      },
      soft: {
        title: 'Software engineering',
        venues: ['fse', 'icse', 'ase', 'issta']
      }
    }
  },
  theory: {
    title: 'Theory',
    color: '#4daf4a',
    subareas: {
      act: {
        title: 'Algorithms & complexity',
        venues: ['focs', 'soda', 'stoc']
      },
      crypt: {
        title: 'Cryptography',
        venues: ['crypto', 'eurocrypt']
      },
      log: {
        title: 'Logic & verification',
        venues: ['cav', 'lics']
      }
    }
  },
  interdisciplinary: {
    title: 'Interdisciplinary Areas',
    color: '#984ea3',
    subareas: {
      bio: {
        title: 'Comp. bio & bioinformatics',
        venues: ['ismb', 'recomb']
      },
      graph: {
        title: 'Computer graphics',
        venues: ['siggraph', 'siggraph-asia', 'eurographics']
      },
      csed: {
        title: 'Computer science education',
        venues: ['sigcse']
      },
      ecom: {
        title: 'Economics & computation',
        venues: ['ec', 'wine']
      },
      chi: {
        title: 'Human-computer interaction',
        venues: ['chiconf', 'ubicomp', 'uist']
      },
      robotics: {
        title: 'Robotics',
        venues: ['icra', 'iros', 'rss']
      },
      visualization: {
        title: 'Visualization',
        venues: ['vis', 'vr']
      }
    }
  }
}

export const VENUE_NAMES = {
  // AI
  'aaai': 'AAAI',
  'ijcai': 'IJCAI',
  'cvpr': 'CVPR',
  'eccv': 'ECCV',
  'iccv': 'ICCV',
  'iclr': 'ICLR',
  'icml': 'ICML',
  'nips': 'NeurIPS',
  'kdd': 'KDD',
  'acl': 'ACL',
  'emnlp': 'EMNLP',
  'naacl': 'NAACL',
  'sigir': 'SIGIR',
  'www': 'WWW',
  
  // Systems
  'asplos': 'ASPLOS',
  'isca': 'ISCA',
  'micro': 'MICRO',
  'hpca': 'HPCA',
  'sigcomm': 'SIGCOMM',
  'nsdi': 'NSDI',
  'ccs': 'CCS',
  'oakland': 'IEEE S&P ("Oakland")',
  'usenixsec': 'USENIX Security',
  'ndss': 'NDSS',
  'sigmod': 'SIGMOD',
  'vldb': 'VLDB',
  'icde': 'ICDE',
  'pods': 'PODS',
  'dac': 'DAC',
  'iccad': 'ICCAD',
  'emsoft': 'EMSOFT',
  'rtas': 'RTAS',
  'rtss': 'RTSS',
  'hpdc': 'HPDC',
  'ics': 'ICS',
  'sc': 'SC',
  'mobicom': 'MobiCom',
  'mobisys': 'MobiSys',
  'sensys': 'SenSys',
  'imc': 'IMC',
  'sigmetrics': 'SIGMETRICS',
  'osdi': 'OSDI',
  'sosp': 'SOSP',
  'eurosys': 'EuroSys',
  'fast': 'FAST',
  'usenixatc': 'USENIX ATC',
  'pldi': 'PLDI',
  'popl': 'POPL',
  'icfp': 'ICFP',
  'oopsla': 'OOPSLA',
  'fse': 'FSE',
  'icse': 'ICSE',
  'ase': 'ASE',
  'issta': 'ISSTA',
  
  // Theory
  'focs': 'FOCS',
  'soda': 'SODA',
  'stoc': 'STOC',
  'crypto': 'CRYPTO',
  'eurocrypt': 'EuroCrypt',
  'cav': 'CAV',
  'lics': 'LICS',
  
  // Interdisciplinary
  'ismb': 'ISMB',
  'recomb': 'RECOMB',
  'siggraph': 'SIGGRAPH',
  'siggraph-asia': 'SIGGRAPH Asia',
  'eurographics': 'EUROGRAPHICS',
  'sigcse': 'SIGCSE',
  'ec': 'EC',
  'wine': 'WINE',
  'chiconf': 'CHI',
  'ubicomp': 'UbiComp / Pervasive / IMWUT',
  'uist': 'UIST',
  'icra': 'ICRA',
  'iros': 'IROS',
  'rss': 'RSS',
  'vis': 'VIS',
  'vr': 'VR'
}

export const REGION_CONFIG = {
  byContinent: [
    { value: 'world', label: 'Worldwide' },
    { value: 'africa', label: 'Africa' },
    { value: 'asia', label: 'Asia' },
    { value: 'australasia', label: 'Australasia' },
    { value: 'europe', label: 'Europe' },
    { value: 'northamerica', label: 'North America' },
    { value: 'southamerica', label: 'South America' }
  ],
  byCountry: [
    { value: 'ar', label: 'Argentina', continent: 'southamerica' },
    { value: 'au', label: 'Australia', continent: 'australasia' },
    { value: 'at', label: 'Austria', continent: 'europe' },
    { value: 'be', label: 'Belgium', continent: 'europe' },
    { value: 'br', label: 'Brazil', continent: 'southamerica' },
    { value: 'ca', label: 'Canada', continent: 'northamerica' },
    { value: 'cl', label: 'Chile', continent: 'southamerica' },
    { value: 'cn', label: 'China', continent: 'asia' },
    { value: 'cz', label: 'Czech Republic', continent: 'europe' },
    { value: 'dk', label: 'Denmark', continent: 'europe' },
    { value: 'eg', label: 'Egypt', continent: 'africa' },
    { value: 'fi', label: 'Finland', continent: 'europe' },
    { value: 'fr', label: 'France', continent: 'europe' },
    { value: 'de', label: 'Germany', continent: 'europe' },
    { value: 'gr', label: 'Greece', continent: 'europe' },
    { value: 'hk', label: 'Hong Kong', continent: 'asia' },
    { value: 'in', label: 'India', continent: 'asia' },
    { value: 'ie', label: 'Ireland', continent: 'europe' },
    { value: 'il', label: 'Israel', continent: 'europe' },
    { value: 'it', label: 'Italy', continent: 'europe' },
    { value: 'jp', label: 'Japan', continent: 'asia' },
    { value: 'kr', label: 'South Korea', continent: 'asia' },
    { value: 'my', label: 'Malaysia', continent: 'asia' },
    { value: 'nl', label: 'Netherlands', continent: 'europe' },
    { value: 'nz', label: 'New Zealand', continent: 'australasia' },
    { value: 'no', label: 'Norway', continent: 'europe' },
    { value: 'pk', label: 'Pakistan', continent: 'asia' },
    { value: 'pl', label: 'Poland', continent: 'europe' },
    { value: 'pt', label: 'Portugal', continent: 'europe' },
    { value: 'ro', label: 'Romania', continent: 'europe' },
    { value: 'sa', label: 'Saudi Arabia', continent: 'asia' },
    { value: 'sg', label: 'Singapore', continent: 'asia' },
    { value: 'za', label: 'South Africa', continent: 'africa' },
    { value: 'es', label: 'Spain', continent: 'europe' },
    { value: 'se', label: 'Sweden', continent: 'europe' },
    { value: 'ch', label: 'Switzerland', continent: 'europe' },
    { value: 'tw', label: 'Taiwan', continent: 'asia' },
    { value: 'th', label: 'Thailand', continent: 'asia' },
    { value: 'tr', label: 'Turkey', continent: 'europe' },
    { value: 'ae', label: 'UAE', continent: 'asia' },
    { value: 'uk', label: 'United Kingdom', continent: 'europe' },
    { value: 'us', label: 'USA', continent: 'northamerica' }
  ]
}

export const REGIONS = REGION_CONFIG.byContinent

/**
 * Get all venues from a top-level area
 */
export function getVenuesForArea(areaKey) {
  const area = AREA_HIERARCHY[areaKey]
  if (!area) return []
  
  const venues = []
  for (const subarea of Object.values(area.subareas)) {
    venues.push(...subarea.venues)
  }
  return venues
}

/**
 * Get all venues from all areas
 */
export function getAllVenues() {
  const venues = []
  for (const area of Object.values(AREA_HIERARCHY)) {
    for (const subarea of Object.values(area.subareas)) {
      venues.push(...subarea.venues)
    }
  }
  return venues
}

/**
 * Map venue to its parent subarea and top area
 */
export function getVenueHierarchy(venue) {
  for (const [areaKey, area] of Object.entries(AREA_HIERARCHY)) {
    for (const [subareaKey, subarea] of Object.entries(area.subareas)) {
      if (subarea.venues.includes(venue)) {
        return {
          venue,
          subarea: subareaKey,
          subareaTitle: subarea.title,
          area: areaKey,
          areaTitle: area.title,
          color: area.color
        }
      }
    }
  }
  return null
}

