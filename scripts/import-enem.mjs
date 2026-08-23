import { copyFile, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const contentRoot = join(projectRoot, 'content')
const questionRoot = join(contentRoot, 'questions')
const stimulusRoot = join(contentRoot, 'stimuli')
const publicRoot = join(projectRoot, 'public')
const catalogPath = join(contentRoot, 'question-catalog.json')
const searchIndexPath = join(contentRoot, 'question-search-index.json')
const reportPath = join(contentRoot, 'import-report.json')
const argumentsList = process.argv.slice(2)
const managedMedia = new Set()

function argumentValues(name) {
  return argumentsList.flatMap((value, index) => {
    const nextValue = argumentsList[index + 1]
    return value === name && nextValue && !nextValue.startsWith('--') ? [nextValue] : []
  })
}

async function readOptionalJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return fallback
    }

    throw error
  }
}

function answerFor(exam, question) {
  const answer = exam.answer_key?.answers.find(entry =>
    entry.question_number === question.number
    && entry.language === question.language
  )

  if (!answer || answer.status !== 'answered' || !answer.answer) {
    throw new Error('Gabarito válido não encontrado.')
  }

  return answer.answer
}

async function adaptMedia(sourceRoot, exam, questionNumber, media) {
  return Promise.all(media.map(async (item) => {
    const relativePath = posix.join('content', exam.exam_id, item.image)
    const targetPath = join(publicRoot, relativePath)

    managedMedia.add(`/${relativePath}`)
    await mkdir(dirname(targetPath), { recursive: true })
    await copyFile(join(sourceRoot, item.image), targetPath)

    return {
      id: item.id,
      kind: item.kind,
      path: `/${relativePath}`,
      alt: `Conteúdo visual da questão ${questionNumber} do ENEM ${exam.metadata.year}`
    }
  }))
}

async function adaptStimulus(exam, sourceRoot, stimulus, questionNumber) {
  if (stimulus.warnings.length) {
    throw new Error(`Texto compartilhado ${stimulus.id} requer revisão.`)
  }

  return {
    schemaVersion: '1.0',
    id: stimulus.id,
    text: stimulus.normalized_text,
    media: await adaptMedia(sourceRoot, exam, questionNumber, stimulus.media)
  }
}

async function adaptQuestion(exam, sourceRoot, question, stimuliById) {
  if (question.warnings.length || question.confidence < 0.85) {
    throw new Error('Questão requer revisão ou possui baixa confiança.')
  }

  const correctAlternative = answerFor(exam, question)
  const alternatives = question.alternatives.map(alternative => ({
    id: alternative.label,
    text: alternative.normalized_text
  }))

  if (
    alternatives.map(alternative => alternative.id).join('') !== 'ABCDE'
    || !alternatives.some(item => item.id === correctAlternative)
  ) {
    throw new Error('Alternativas inválidas.')
  }

  for (const stimulusId of question.shared_stimulus_ids) {
    const stimulus = exam.shared_stimuli.find(item => item.id === stimulusId)

    if (!stimulus) {
      throw new Error(`Texto compartilhado ${stimulusId} não encontrado.`)
    }

    stimuliById.set(
      stimulus.id,
      await adaptStimulus(exam, sourceRoot, stimulus, question.number)
    )
  }

  return {
    schemaVersion: '1.0',
    id: question.id,
    area: question.area,
    statement: question.prompt,
    supportText: question.support_text,
    alternatives,
    correctAlternative,
    references: question.references,
    media: await adaptMedia(sourceRoot, exam, question.number, question.media),
    sharedStimulusIds: question.shared_stimulus_ids,
    source: {
      exam: 'ENEM',
      examId: exam.exam_id,
      year: exam.metadata.year,
      day: exam.metadata.day,
      booklet: exam.metadata.booklet,
      color: exam.metadata.color,
      number: question.number,
      language: question.language,
      filename: exam.source.filename,
      sha256: exam.source.sha256
    },
    provenance: {
      extractor: 'enem-extractor',
      extractorVersion: exam.extractor_version,
      confidence: question.confidence,
      warnings: question.warnings
    }
  }
}

function questionSummary(question, stimuliById) {
  return {
    id: question.id,
    area: question.area,
    hasMedia: Boolean(
      question.media.length
      || question.sharedStimulusIds.some(id => stimuliById.get(id)?.media.length)
    ),
    source: {
      exam: question.source.exam,
      examId: question.source.examId,
      year: question.source.year,
      day: question.source.day,
      booklet: question.source.booklet,
      color: question.source.color,
      number: question.source.number,
      language: question.source.language
    }
  }
}

function normalizeSearchText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function questionSearchText(question, stimuliById) {
  const sharedTexts = question.sharedStimulusIds
    .map(id => stimuliById.get(id)?.text)
    .filter(Boolean)

  const normalized = normalizeSearchText([
    question.statement,
    question.supportText,
    ...question.alternatives.map(alternative => alternative.text),
    ...question.references,
    ...sharedTexts
  ].filter(Boolean).join(' '))

  return [...new Set(normalized.split(' '))].join(' ')
}

function mediaPaths(question, stimuliById) {
  const paths = question.media.map(media => media.path)

  for (const stimulusId of question.sharedStimulusIds) {
    const stimulus = stimuliById.get(stimulusId)
    paths.push(...(stimulus?.media.map(media => media.path) ?? []))
  }

  return paths
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const sourcePaths = argumentValues('--source').map(path => resolve(path))
const selectedIds = argumentValues('--questions')
  .flatMap(value => value.split(','))
  .map(value => value.trim())
  .filter(Boolean)
const importAll = argumentsList.includes('--all')

if (!sourcePaths.length) {
  throw new Error('Informe ao menos um --source.')
}

if (importAll === Boolean(selectedIds.length)) {
  throw new Error('Use --all ou --questions, mas não ambos.')
}

if (new Set(selectedIds).size !== selectedIds.length) {
  throw new Error('A seleção contém questões duplicadas.')
}

const existingCatalog = await readOptionalJson(catalogPath, {
  schemaVersion: '1.0',
  questions: []
})
const questionsById = new Map()
const stimuliById = new Map()

for (const summary of existingCatalog.questions) {
  const question = await readOptionalJson(join(questionRoot, `${summary.id}.json`), null)

  if (!question) {
    continue
  }

  questionsById.set(question.id, question)

  for (const stimulusId of question.sharedStimulusIds) {
    if (!stimuliById.has(stimulusId)) {
      const stimulus = await readOptionalJson(join(stimulusRoot, `${stimulusId}.json`), null)
      if (stimulus) {
        stimuliById.set(stimulus.id, stimulus)
      }
    }
  }
}

const imported = []
const rejected = []
const foundIds = new Set()

for (const sourceRoot of sourcePaths) {
  let exam

  try {
    exam = JSON.parse(await readFile(join(sourceRoot, 'exam.json'), 'utf8'))
  } catch (error) {
    rejected.push({ source: basename(sourceRoot), reason: `Falha ao ler exam.json: ${error.message}` })
    continue
  }

  if (exam.status !== 'valid' || exam.errors.length || exam.warnings.length) {
    rejected.push({ source: sourceRoot, reason: 'Extração inválida ou com alertas globais.' })
    continue
  }

  const candidates = importAll
    ? exam.questions
    : exam.questions.filter(question => selectedIds.includes(question.id))

  for (const question of candidates) {
    foundIds.add(question.id)

    try {
      const previous = questionsById.get(question.id)
      if (previous) {
        mediaPaths(previous, stimuliById).forEach(path => managedMedia.add(path))
      }

      const adapted = await adaptQuestion(exam, sourceRoot, question, stimuliById)
      questionsById.set(adapted.id, adapted)
      imported.push({ id: adapted.id, source: exam.exam_id })
    } catch (error) {
      rejected.push({ id: question.id, source: exam.exam_id, reason: error.message })
    }
  }
}

for (const id of selectedIds.filter(id => !foundIds.has(id))) {
  rejected.push({ id, source: null, reason: 'Questão não encontrada nas fontes informadas.' })
}

for (const question of questionsById.values()) {
  await writeJson(join(questionRoot, `${question.id}.json`), question)
}

for (const stimulus of stimuliById.values()) {
  await writeJson(join(stimulusRoot, `${stimulus.id}.json`), stimulus)
}

const summaries = [...questionsById.values()]
  .map(question => questionSummary(question, stimuliById))
  .sort((a, b) =>
    b.source.year - a.source.year
    || a.source.day - b.source.day
    || a.source.number - b.source.number
    || (a.source.language ?? '').localeCompare(b.source.language ?? '')
  )
const catalog = {
  schemaVersion: '1.0',
  questions: summaries
}

await writeJson(catalogPath, catalog)

await writeJson(searchIndexPath, {
  schemaVersion: '1.0',
  questions: Object.fromEntries(
    summaries.map(summary => [
      summary.id,
      questionSearchText(questionsById.get(summary.id), stimuliById)
    ])
  )
})

const referencedMedia = new Set(
  [...questionsById.values()].flatMap(question => mediaPaths(question, stimuliById))
)
const removedMedia = []

for (const publicPath of managedMedia) {
  if (referencedMedia.has(publicPath) || !publicPath.startsWith('/content/')) {
    continue
  }

  try {
    await unlink(join(publicRoot, publicPath.slice(1)))
    removedMedia.push(publicPath)
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }
}

await writeJson(reportPath, {
  schemaVersion: '1.0',
  importedAt: new Date().toISOString(),
  sources: sourcePaths.map(path => basename(path)),
  imported,
  rejected,
  removedMedia
})

console.log(`${imported.length} questões importadas; ${rejected.length} rejeitadas.`)
console.log(`Catálogo com ${summaries.length} questões em ${catalogPath}.`)

if (!imported.length && rejected.length) {
  process.exitCode = 1
}
