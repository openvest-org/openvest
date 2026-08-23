import type { StudyContentCatalog } from '~/types/study-content'

let catalogRequest: Promise<StudyContentCatalog> | null = null

export function loadStudyContentCatalog() {
  catalogRequest ??= fetch(publicPath('/data/study-content.json'), {
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Falha ao carregar o catálogo de conteúdos.')
      }

      return response.json() as Promise<StudyContentCatalog>
    })
    .catch((error) => {
      catalogRequest = null
      throw error
    })

  return catalogRequest
}

export function normalizeStudySearchTerm(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
