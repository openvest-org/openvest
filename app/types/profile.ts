export interface QuestionProgress {
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
  attempts: number
  firstAnsweredAt: string
  lastAnsweredAt: string
}

export interface LocalProfile {
  schemaVersion: 1
  id: 'local'
  displayName: string
  createdAt: string
  updatedAt: string
  questionProgress: Record<string, QuestionProgress>
}
