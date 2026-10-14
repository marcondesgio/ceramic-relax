import { useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { useGameStore } from '../store/useGameStore'
import { playEffect } from '../audio/sounds'
import { canKnock, restoreVisit, scheduleAfterDelivery, startVisit } from './village'
import { FACE_ROOM, ROUTES, onLastLeg, stepWalk, villageRuntime as rt, walk } from './villageRuntime'

// Conduz a visita a cada quadro:
// toc-toc → porta abre e o bichinho entra → pede → espera ao lado do torno →
// (entrega) vai até a mesinha → reage → vai embora pela porta.

const KNOCK_TIME = 1.3
export const REACT_TIME = 3.2
/** Primeira visita da sessão: logo depois de começar uma peça */
const FIRST_KNOCK_DELAY = 3000
/** Voltar para a modelagem chama o próximo logo */
const BACK_TO_WHEEL_DELAY = 2500

export function VillageController() {
  useEffect(() => {
    restoreVisit()
    return useGameStore.subscribe((s, prev) => {
      if (s.phase === prev.phase || s.visit || s.village.order) return
      const now = Date.now()
      if ((s.phase === 'prep' || s.phase === 'modeling') && s.nextKnockAt === null) {
        s.setNextKnock(now + FIRST_KNOCK_DELAY)
      } else if (s.phase === 'modeling' && s.nextKnockAt !== null && now - rt.lastDeclineAt > 30_000) {
        s.setNextKnock(Math.min(s.nextKnockAt, now + BACK_TO_WHEEL_DELAY))
      }
    })
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const s = useGameStore.getState()
    rt.stageT += dt
    rt.knock = Math.max(0, rt.knock - dt * 0.9)
    rt.door = MathUtils.damp(rt.door, rt.doorTarget, 6, dt)

    const visit = s.visit
    if (!visit) {
      rt.doorTarget = 0
      if (!s.village.order && s.nextKnockAt !== null && Date.now() >= s.nextKnockAt && canKnock(s.phase) && !s.optionsOpen) {
        startVisit()
      }
      return
    }

    stepWalk(dt)
    // parado: olha para a sala
    if (!rt.moving) {
      const want = Math.atan2(FACE_ROOM.x - rt.pos.x, FACE_ROOM.z - rt.pos.z)
      let d = want - rt.heading
      d = Math.atan2(Math.sin(d), Math.cos(d))
      rt.heading += d * Math.min(1, dt * 5)
    }

    switch (visit.stage) {
      case 'knocking':
        if (rt.stageT > KNOCK_TIME) {
          s.setVisit({ ...visit, stage: 'arriving' })
          rt.stageT = 0
          rt.doorTarget = 1
          walk(ROUTES.arrive)
        }
        break
      case 'arriving':
        // já passou da porta: fecha
        if (rt.index >= 2) rt.doorTarget = 0
        if (rt.arrived) {
          s.setVisit({ ...visit, stage: 'asking' })
          playEffect('pop', { rate: 1.2, volume: 0.45 })
        }
        break
      case 'delivering':
        if (rt.arrived) {
          s.setVisit({ ...visit, stage: 'reacting' })
          rt.stageT = 0
          // moedinhas tilintando
          playEffect('ding', { rate: 1.5, volume: 0.6 })
          for (let k = 0; k < 4; k++) {
            window.setTimeout(() => playEffect('pop', { rate: 1.6 + k * 0.1, volume: 0.35 }), 250 + k * 110)
          }
        }
        break
      case 'reacting':
        if (rt.stageT > REACT_TIME) {
          s.setVisit({ ...visit, stage: 'leaving' })
          rt.stageT = 0
          walk(ROUTES.leaveFromShelf)
        }
        break
      case 'leaving':
        if (onLastLeg()) rt.doorTarget = 1
        if (rt.arrived) {
          s.setVisit(null)
          rt.doorTarget = 0
          if (!visit.declined) scheduleAfterDelivery()
        }
        break
    }
  })

  return null
}
