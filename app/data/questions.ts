import type {
  LoadedQuestion,
  Question,
  QuestionCatalog,
  QuestionSearchIndex,
  QuestionSummary,
  SharedStimulus
} from '~/types/question'

const areaLabels: Record<string, string> = {
  'linguagens': 'Linguagens',
  'ciencias-humanas': 'Ciências Humanas',
  'ciencias-da-natureza': 'Ciências da Natureza',
  'matematica': 'Matemática'
}
const languageLabels = {
  en: 'Inglês',
  es: 'Espanhol'
}
const questionCache = new Map<string, Question>()
const stimulusCache = new Map<string, SharedStimulus>()
let catalogRequest: Promise<QuestionSummary[]> | null = null
let searchIndexRequest: Promise<Map<string, string>> | null = null

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: { accept: 'application/json' }
  })

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}.`)
  }

  return response.json() as Promise<T>
}

export function loadQuestionCatalog() {
  catalogRequest ??= fetchJson<QuestionCatalog>('/data/question-catalog.json')
    .then(catalog => catalog.questions)
    .catch((error) => {
      catalogRequest = null
      throw error
    })

  return catalogRequest
}

export function normalizeQuestionSearchTerm(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function loadQuestionSearchIndex() {
  searchIndexRequest ??= fetchJson<QuestionSearchIndex>('/data/question-search-index.json')
    .then(index => new Map(Object.entries(index.questions)))
    .catch((error) => {
      searchIndexRequest = null
      throw error
    })

  return searchIndexRequest
}

async function loadQuestion(id: string) {
  const cached = questionCache.get(id)

  if (cached) {
    return cached
  }

  const question = await fetchJson<Question>(`/data/questions/${encodeURIComponent(id)}.json`)
  questionCache.set(id, question)
  return question
}

async function loadStimulus(id: string) {
  const cached = stimulusCache.get(id)

  if (cached) {
    return cached
  }

  const stimulus = await fetchJson<SharedStimulus>(`/data/stimuli/${encodeURIComponent(id)}.json`)
  stimulusCache.set(id, stimulus)
  return stimulus
}

export async function loadQuestions(summaries: QuestionSummary[]) {
  return Promise.all(summaries.map(async (summary): Promise<LoadedQuestion> => {
    const question = await loadQuestion(summary.id)
    const sharedStimuli = await Promise.all(question.sharedStimulusIds.map(loadStimulus))

    return {
      ...question,
      sharedStimuli
    }
  }))
}

export function questionTitle(question: Question | QuestionSummary) {
  return `Questão ${String(question.source.number).padStart(2, '0')}`
}

export function questionDescription(question: Question | QuestionSummary) {
  const parts = [
    `${question.source.exam} ${question.source.year}`,
    areaLabels[question.area] ?? question.area
  ]

  if (question.source.language) {
    parts.push(languageLabels[question.source.language])
  }

  return parts.join(' · ')
}

export function areaLabel(area: string) {
  return areaLabels[area] ?? area
}
