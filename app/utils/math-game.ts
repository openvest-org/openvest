export const CORRECT_ANSWERS_PER_LEVEL = 3

export type MathOperator = 'addition' | 'subtraction' | 'multiplication' | 'division'

export interface MathChallenge {
  expression: string
  answer: number
  choices: number[]
  operator: MathOperator
}

export interface MathDifficulty {
  label: string
  description: string
}

const operatorSymbols: Record<MathOperator, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷'
}

function randomInteger(minimum: number, maximum: number) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

function randomItem<T>(items: T[]) {
  return items[randomInteger(0, items.length - 1)] as T
}

function shuffled<T>(items: T[]) {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInteger(0, index)
    const current = result[index] as T
    result[index] = result[target] as T
    result[target] = current
  }

  return result
}

function challengeParts(level: number) {
  if (level === 1) {
    const left = randomInteger(1, 8)
    const right = randomInteger(1, 10 - left)
    return { left, right, operator: 'addition' as const, answer: left + right }
  }

  if (level === 2) {
    const operator = randomItem<MathOperator>(['addition', 'subtraction'])
    const first = randomInteger(4, 20)
    const second = randomInteger(1, first)

    if (operator === 'addition') {
      return { left: first, right: second, operator, answer: first + second }
    }

    return { left: first, right: second, operator, answer: first - second }
  }

  if (level === 3) {
    const operator = randomItem<MathOperator>(['addition', 'subtraction', 'multiplication'])

    if (operator === 'multiplication') {
      const left = randomInteger(2, 5)
      const right = randomInteger(2, 10)
      return { left, right, operator, answer: left * right }
    }

    const first = randomInteger(10, 30)
    const second = randomInteger(2, first)
    const answer = operator === 'addition' ? first + second : first - second
    return { left: first, right: second, operator, answer }
  }

  const factorLimit = 8 + (level - 4) * 2
  const valueLimit = 40 + (level - 4) * 20
  const operator = randomItem<MathOperator>([
    'addition',
    'subtraction',
    'multiplication',
    'division'
  ])

  if (operator === 'multiplication') {
    const left = randomInteger(2, factorLimit)
    const right = randomInteger(2, factorLimit)
    return { left, right, operator, answer: left * right }
  }

  if (operator === 'division') {
    const right = randomInteger(2, factorLimit)
    const answer = randomInteger(2, factorLimit)
    return { left: right * answer, right, operator, answer }
  }

  const first = randomInteger(Math.ceil(valueLimit / 3), valueLimit)
  const second = randomInteger(2, first)
  const answer = operator === 'addition' ? first + second : first - second
  return { left: first, right: second, operator, answer }
}

function answerChoices(answer: number, level: number) {
  const choices = new Set([answer])
  const spread = Math.max(4, Math.ceil(level * 1.5))

  while (choices.size < 4) {
    const offset = randomInteger(1, spread)
    const candidate = Math.max(0, answer + (Math.random() > 0.5 ? offset : -offset))
    choices.add(candidate)
  }

  return shuffled([...choices])
}

export function generateMathChallenge(level: number): MathChallenge {
  const normalizedLevel = Math.max(1, Math.floor(level))
  const parts = challengeParts(normalizedLevel)

  return {
    expression: `${parts.left} ${operatorSymbols[parts.operator]} ${parts.right}`,
    answer: parts.answer,
    choices: answerChoices(parts.answer, normalizedLevel),
    operator: parts.operator
  }
}

export function mathGameLevel(correctAnswers: number) {
  return Math.floor(Math.max(0, correctAnswers) / CORRECT_ANSWERS_PER_LEVEL) + 1
}

export function mathDifficulty(level: number): MathDifficulty {
  if (level === 1) {
    return { label: 'Aquecimento', description: 'Somas com resultado até 10.' }
  }

  if (level === 2) {
    return { label: 'Primeiros passos', description: 'Somas e subtrações com números maiores.' }
  }

  if (level === 3) {
    return { label: 'Entrando na tabuada', description: 'Multiplicações passam a fazer parte dos desafios.' }
  }

  if (level === 4) {
    return { label: 'Quatro operações', description: 'Soma, subtração, multiplicação e divisão.' }
  }

  return {
    label: 'Desafio crescente',
    description: 'As quatro operações continuam e os números aumentam a cada nível.'
  }
}
