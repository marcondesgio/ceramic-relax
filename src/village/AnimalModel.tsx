import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { MeshStandardMaterial, type Group, type Mesh } from 'three'
import { LOOKS, type AnimalId } from './animals'

// Bichinho provisório feito de formas simples (até chegarem os modelos finais):
// corpo arredondado, olhos grandes, bochechas, e um traço marcante de cada espécie.
// Origem nos pés, olhando para +z. As partes animáveis ficam expostas pela ref.

export interface AnimalParts {
  body: Group | null
  head: Group | null
  eyes: Mesh[]
  ears: Group | null
  tail: Group | null
}

const EYE = '#3B2B26'
const CHEEK = '#F4A08E'

export const AnimalModel = forwardRef<AnimalParts, { id: AnimalId }>(function AnimalModel({ id }, ref) {
  const look = LOOKS[id]
  const body = useRef<Group>(null)
  const head = useRef<Group>(null)
  const ears = useRef<Group>(null)
  const tail = useRef<Group>(null)
  const eyeL = useRef<Mesh>(null)
  const eyeR = useRef<Mesh>(null)

  useImperativeHandle(ref, () => ({
    get body() {
      return body.current
    },
    get head() {
      return head.current
    },
    get ears() {
      return ears.current
    },
    get tail() {
      return tail.current
    },
    get eyes() {
      return [eyeL.current, eyeR.current].filter(Boolean) as Mesh[]
    },
  }))

  const m = useMemo(
    () => ({
      body: new MeshStandardMaterial({ color: look.body, roughness: 0.75 }),
      belly: new MeshStandardMaterial({ color: look.belly, roughness: 0.8 }),
      accent: new MeshStandardMaterial({ color: look.accent, roughness: 0.6 }),
      eye: new MeshStandardMaterial({ color: EYE, roughness: 0.3 }),
      shine: new MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.2, emissive: '#FFFFFF', emissiveIntensity: 0.4 }),
      cheek: new MeshStandardMaterial({ color: CHEEK, roughness: 0.9, transparent: true, opacity: 0.7 }),
    }),
    [look],
  )

  const H = look.height
  const legH = look.legs === 'long' ? H * 0.42 : H * 0.12
  const bodyH = (H - legH) * 0.62
  const bodyW = look.extra === 'shell' ? bodyH * 0.95 : bodyH * 0.72
  const bodyY = legH + bodyH / 2
  const headR = H * (look.legs === 'long' ? 0.17 : 0.22)
  const headY = legH + bodyH * 0.92 + headR * 0.6

  return (
    <group>
      {/* pernas */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * bodyW * 0.45, legH / 2, 0]} material={look.legs === 'long' ? m.accent : m.body} castShadow>
          <capsuleGeometry args={[look.legs === 'long' ? 0.045 : 0.07, Math.max(0.01, legH - 0.08), 4, 10]} />
        </mesh>
      ))}

      <group ref={body} position-y={bodyY}>
        {/* corpo */}
        <mesh scale={[bodyW, bodyH / 2, bodyW * 0.85]} material={m.body} castShadow receiveShadow>
          <sphereGeometry args={[1, 28, 20]} />
        </mesh>
        {/* barriga */}
        <mesh position={[0, -bodyH * 0.05, bodyW * 0.42]} scale={[bodyW * 0.62, bodyH * 0.36, bodyW * 0.45]} material={m.belly}>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        {/* casco de tatu-bola: faixas */}
        {look.extra === 'shell' &&
          [-0.25, 0, 0.25].map((y) => (
            <mesh key={y} position-y={y * bodyH} rotation-x={Math.PI / 2} scale={[1, 1, 0.6]} material={m.accent}>
              <torusGeometry args={[bodyW * 0.98 * Math.cos(y * 1.6), 0.035, 8, 32]} />
            </mesh>
          ))}
        {/* nadadeira do boto */}
        {look.extra === 'fin' && (
          <mesh position={[0, bodyH * 0.35, -bodyW * 0.55]} rotation-x={-0.5} material={m.accent} castShadow>
            <coneGeometry args={[0.12, 0.3, 12]} />
          </mesh>
        )}
        {/* bracinhos */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * bodyW * 0.92, bodyH * 0.05, bodyW * 0.15]} rotation-z={side * 0.5} material={m.body} castShadow>
            <capsuleGeometry args={[0.055, 0.16, 4, 8]} />
          </mesh>
        ))}
        {/* rabo */}
        <group ref={tail} position={[0, -bodyH * 0.2, -bodyW * 0.8]}>
          {(look.extra === 'tail' || look.extra === 'mane') && (
            <mesh rotation-x={-0.9} position={[0, 0.1, -0.12]} material={look.extra === 'mane' ? m.accent : m.body} castShadow>
              <capsuleGeometry args={[0.06, 0.38, 4, 8]} />
            </mesh>
          )}
        </group>
      </group>

      <group ref={head} position={[0, headY, bodyW * 0.18]}>
        {/* juba do mico */}
        {look.extra === 'mane' && (
          <mesh scale={[1.35, 1.3, 1.1]} position-z={-0.03} material={m.accent} castShadow>
            <sphereGeometry args={[headR, 20, 16]} />
          </mesh>
        )}
        <mesh material={m.body} castShadow>
          <sphereGeometry args={[headR, 28, 20]} />
        </mesh>
        {/* máscara da preguiça */}
        {look.extra === 'mask' &&
          [-1, 1].map((side) => (
            <mesh key={side} position={[side * headR * 0.36, headR * 0.12, headR * 0.82]} scale={[1.3, 0.8, 0.5]} material={m.accent}>
              <sphereGeometry args={[headR * 0.26, 14, 10]} />
            </mesh>
          ))}
        {/* olhos grandes com brilho */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * headR * 0.36, headR * 0.12, headR * 0.86]}>
            <mesh ref={side < 0 ? eyeL : eyeR} material={m.eye}>
              <sphereGeometry args={[headR * 0.16, 14, 10]} />
            </mesh>
            <mesh position={[headR * 0.05, headR * 0.06, headR * 0.12]} material={m.shine}>
              <sphereGeometry args={[headR * 0.05, 8, 6]} />
            </mesh>
          </group>
        ))}
        {/* bochechas */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * headR * 0.62, -headR * 0.2, headR * 0.7]} scale={[1, 0.6, 0.3]} material={m.cheek}>
            <sphereGeometry args={[headR * 0.16, 10, 8]} />
          </mesh>
        ))}
        {/* focinho / bico */}
        {look.snout === 'blunt' && (
          <mesh position={[0, -headR * 0.22, headR * 0.82]} scale={[1, 0.75, 0.8]} material={m.belly}>
            <sphereGeometry args={[headR * 0.5, 18, 14]} />
          </mesh>
        )}
        {look.snout === 'small' && (
          <mesh position={[0, -headR * 0.2, headR * 0.92]} material={m.belly}>
            <sphereGeometry args={[headR * 0.26, 14, 10]} />
          </mesh>
        )}
        {look.snout === 'beak' && (
          <group position={[0, -headR * 0.05, headR * 0.8]}>
            <mesh rotation-x={Math.PI / 2} position-z={headR * 0.6} scale={[1, 1, 0.75]} material={m.accent} castShadow>
              <coneGeometry args={[headR * 0.42, headR * 1.5, 16]} />
            </mesh>
          </group>
        )}
        {look.snout === 'long' && (
          <mesh rotation-x={Math.PI / 2} position={[0, -headR * 0.2, headR * 1.05]} material={look.extra === 'fin' ? m.body : m.belly} castShadow>
            <capsuleGeometry args={[headR * 0.2, headR * 0.6, 4, 10]} />
          </mesh>
        )}
        <group ref={ears}>
          {look.ears === 'round' &&
            [-1, 1].map((side) => (
              <mesh key={side} position={[side * headR * 0.62, headR * 0.78, -headR * 0.1]} material={m.accent}>
                <sphereGeometry args={[headR * 0.2, 12, 10]} />
              </mesh>
            ))}
          {(look.ears === 'pointy' || look.ears === 'tall') &&
            [-1, 1].map((side) => (
              <mesh
                key={side}
                position={[side * headR * 0.5, headR * (look.ears === 'tall' ? 1.25 : 0.95), -headR * 0.05]}
                rotation-z={-side * 0.25}
                material={look.ears === 'tall' ? m.body : m.accent}
                castShadow
              >
                <coneGeometry args={[headR * (look.ears === 'tall' ? 0.3 : 0.22), headR * (look.ears === 'tall' ? 1.0 : 0.5), 12]} />
              </mesh>
            ))}
        </group>
      </group>
    </group>
  )
})
