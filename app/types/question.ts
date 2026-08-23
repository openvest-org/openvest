export type AlternativeId = 'A' | 'B' | 'C' | 'D' | 'E'

export interface QuestionAlternative {
  id: AlternativeId
  text: string
}

export interface QuestionMedia {
  id: string
  kind: 'image' | 'vector' | 'mixed' | 'unknown'
  path: string
  alt: string
}

export interface SharedStimulus {
  schemaVersion: '1.0'
  id: string
  text: string
  media: QuestionMedia[]
}

export interface QuestionSource {
  exam: string
  examId: string
  year: number
  day: 1 | 2
  booklet: number
  color: string
  number: number
  language: 'en' | 'es' | null
  filename: string
  sha256: string
}

export interface QuestionProvenance {
  extractor: 'enem-extractor'
  extractorVersion: string
  confidence: number
  warnings: string[]
}

export interface Question {
  schemaVersion: '1.0'
  id: string
  area: string
  statement: string
  supportText: string
  alternatives: QuestionAlternative[]
  correctAlternative: AlternativeId
  references: string[]
  media: QuestionMedia[]
  sharedStimulusIds: string[]
  source: QuestionSource
  provenance: QuestionProvenance
}

export interface LoadedQuestion extends Question {
  sharedStimuli: SharedStimulus[]
}

export interface QuestionSummary {
  id: string
  area: string
  hasMedia: boolean
  source: Pick<
    QuestionSource,
    'exam' | 'examId' | 'year' | 'day' | 'booklet' | 'color' | 'number' | 'language'
  >
}

export interface QuestionCatalog {
  schemaVersion: '1.0'
  questions: QuestionSummary[]
}

export interface QuestionSearchIndex {
  schemaVersion: '1.0'
  questions: Record<string, string>
}
