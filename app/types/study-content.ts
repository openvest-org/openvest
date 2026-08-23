export type StudyResourceKind = 'article' | 'video' | 'course' | 'reference'

export interface StudyResource {
  title: string
  provider: string
  url: string
  kind: StudyResourceKind
}

export interface StudyTopic {
  id: string
  title: string
  description: string
  tags: string[]
  resources: StudyResource[]
}

export interface StudyArea {
  id: string
  title: string
  description: string
  icon: string
  topics: StudyTopic[]
}

export interface StudyExam {
  id: string
  title: string
  fullName: string
  description: string
  officialReference: StudyResource
  areas: StudyArea[]
}

export interface StudyContentCatalog {
  schemaVersion: '1.0'
  reviewedAt: string
  exams: StudyExam[]
}
