import { useGameStore, type Phase } from '../store/useGameStore'
import { playEffect } from '../audio/sounds'
import { ANIMALS, CATALOG, CHALLENGES, FIRST_VISITS, REWARD, type AnimalId, type Order } from './animals'
import { reactionLevel, readTraits } from './traits'
import { ROUTES, SPOTS, placeAt, villageRuntime, walk } from './villageRuntime'

// Regras da vila: quem vem, o que pede, aceitar, recusar e entregar.
// - Um bichinho por vez; o mesmo não vem duas vezes seguidas.
// - O próximo chega de 5 a 10 s depois da entrega, ou quando o jogador volta para a modelagem.
// - "Agora não" não tem penalidade: outro chega mais tarde.
// - Qualquer peça é aceita: só a reação muda, a recompensa é a mesma.

/** Fases em que alguém pode bater à porta (nunca no meio da pintura ou do forno) */
const KNOCK_PHASES: Phase[] = ['prep', 'modeling', 'finishing', 'result']
/** Chance de pedido especial (cerca de 1 em cada 4) */
const SPECIAL_CHANCE = 0.25
/** Com um desafio da lojinha esperando, ele costuma ser o próximo pedido */
const CHALLENGE_CHANCE = 0.6

const randBetween = (a: number, b: number) => a + Math.random() * (b - a)

export function canKnock(phase: Phase) {
  return KNOCK_PHASES.includes(phase)
}

function pickAnimal(): AnimalId {
  const { visits, lastAnimal } = useGameStore.getState().village
  if (visits < FIRST_VISITS.length) return FIRST_VISITS[visits]
  const options = ANIMALS.filter((a) => a !== lastAnimal)
  return options[Math.floor(Math.random() * options.length)]
}

function makeOrder(animal: AnimalId, firstSession: boolean): Order {
  // a primeira sessão só tem pedidos abertos, para apresentar com calma
  const kind = !firstSession && Math.random() < SPECIAL_CHANCE ? 'special' : 'open'
  const options = CATALOG[animal].filter((t) => t.kind === kind)
  const t = options[Math.floor(Math.random() * options.length)]
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    animal,
    key: t.key,
    kind: t.kind,
    wants: t.wants,
    reward: REWARD[t.kind],
  }
}

/** Desafios liberados (item comprado) e ainda não entregues */
export function pendingChallenges() {
  const { purchases, village } = useGameStore.getState()
  const done = village.challengesDone ?? []
  return Object.keys(CHALLENGES).filter((id) => purchases.includes(id) && !done.includes(id))
}

function makeChallenge(itemId: string): Order {
  const c = CHALLENGES[itemId]
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    animal: c.animal,
    key: itemId,
    kind: 'special',
    wants: c.wants,
    reward: REWARD.special,
    challenge: itemId,
  }
}

/** Toc-toc: um bichinho chega à porta com um pedido (às vezes um desafio da lojinha) */
export function startVisit() {
  const s = useGameStore.getState()
  const firstSession = s.village.visits < FIRST_VISITS.length
  // desafio esperando: vem com boa chance, sem repetir o último bichinho
  const challenges = firstSession ? [] : pendingChallenges().filter((id) => CHALLENGES[id].animal !== s.village.lastAnimal)
  const challenge = challenges.length && Math.random() < CHALLENGE_CHANCE ? challenges[Math.floor(Math.random() * challenges.length)] : null
  const animal = challenge ? CHALLENGES[challenge].animal : pickAnimal()
  const order = challenge ? makeChallenge(challenge) : makeOrder(animal, firstSession)
  s.setVillage({ visits: s.village.visits + 1, lastAnimal: animal })
  s.setVisit({ animal, order, stage: 'knocking' })
  s.setNextKnock(null)
  villageRuntime.stageT = 0
  villageRuntime.knock = 1
  s.showToast('village.knock')
  playEffect('pop', { rate: 0.55, volume: 1 })
  window.setTimeout(() => playEffect('pop', { rate: 0.5, volume: 1 }), 200)
}

/** Aceitar: o pedido fica guardado e o bichinho espera ao lado do torno */
export function acceptOrder() {
  const s = useGameStore.getState()
  if (!s.visit || s.visit.stage !== 'asking') return
  s.setVillage({ order: s.visit.order })
  s.setVisit({ ...s.visit, stage: 'waiting' })
  playEffect('pop', { rate: 1.3, volume: 0.5 })
}

/** "Agora não": despedida carinhosa, sem penalidade; outro chega mais tarde */
export function declineOrder() {
  const s = useGameStore.getState()
  if (!s.visit || s.visit.stage !== 'asking') return
  s.setVisit({ ...s.visit, stage: 'leaving', declined: true })
  villageRuntime.stageT = 0
  villageRuntime.lastDeclineAt = Date.now()
  walk(ROUTES.leaveFromWait)
  s.setNextKnock(Date.now() + randBetween(35_000, 50_000))
}

/** Entregar a peça pronta: o bichinho vem até a mesinha, reage e paga as moedinhas */
export function deliverOrder() {
  const s = useGameStore.getState()
  const order = s.village.order
  if (!order || s.deliveredTo) return
  const traits = readTraits(s.profile, s.handles, s.paint, s.finish, s.holes, s.fluting !== null)
  const level = reactionLevel(order.wants, traits)
  s.addCoins(order.reward)
  s.setDeliveredTo(order.animal)
  // desafio entregue (qualquer peça vale) fica marcado no álbum do bichinho
  const done = s.village.challengesDone ?? []
  s.setVillage({
    order: null,
    delivered: s.village.delivered + 1,
    ...(order.challenge && !done.includes(order.challenge) ? { challengesDone: [...done, order.challenge] } : {}),
  })
  s.setOrderOpen(false)
  s.setVisit({ animal: order.animal, order, stage: 'delivering', level })
  villageRuntime.stageT = 0
  walk(ROUTES.toShelf)
}

/** Ao abrir o jogo: um pedido aceito antes continua com o bichinho esperando ao lado do torno */
export function restoreVisit() {
  const s = useGameStore.getState()
  const order = s.village.order
  if (!order || s.visit) return
  s.setVisit({ animal: order.animal, order, stage: 'waiting' })
  placeAt(SPOTS.wait)
}

/** O próximo chega de 5 a 10 s depois de ir embora (ou mais tarde, depois de um "Agora não") */
export function scheduleAfterDelivery() {
  useGameStore.getState().setNextKnock(Date.now() + randBetween(5_000, 10_000))
}
