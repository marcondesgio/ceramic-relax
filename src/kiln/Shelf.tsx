import { RoundedBox } from '@react-three/drei'
import { SHELF_TOP } from './kilnLayout'

const WOOD = '#E8C39A'
const WOOD_DARK = '#D9AE82'

const TOP_W = 2.2
const TOP_D = 1.05
const TOP_T = 0.14
const LEG_R = 0.085
// pés um pouco para dentro do tampo
const LEG_X = TOP_W / 2 - 0.2
const LEG_Z = TOP_D / 2 - 0.16

/**
 * Mesinha baixa onde a peça pronta fica exposta.
 * O grupo fica no topo do tampo (SHELF_TOP); os pés descem até o chão (y = 0).
 */
export function Shelf() {
  const height = SHELF_TOP.y
  const legLen = height - TOP_T
  const shelfY = -height * 0.62 // tabuinha de baixo

  return (
    <group position={SHELF_TOP}>
      {/* tampo */}
      <RoundedBox args={[TOP_W, TOP_T, TOP_D]} radius={0.06} position={[0, -TOP_T / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </RoundedBox>

      {/* pés arredondados, levemente mais finos embaixo */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * LEG_X, -TOP_T - legLen / 2, sz * LEG_Z]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[LEG_R, LEG_R * 0.75, legLen, 16]} />
              <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
            </mesh>
            {/* pezinho redondo */}
            <mesh position={[0, -legLen / 2 + 0.04, 0]} castShadow>
              <sphereGeometry args={[LEG_R * 0.95, 16, 10]} />
              <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
            </mesh>
          </group>
        )),
      )}

      {/* tabuinha de baixo, presa nos pés */}
      <RoundedBox
        args={[LEG_X * 2 + LEG_R * 2, 0.08, LEG_Z * 2 + LEG_R * 2]}
        radius={0.035}
        position={[0, shelfY, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </RoundedBox>

      {/* faixinha sob o tampo (avental), dá cara de móvel */}
      <RoundedBox args={[TOP_W - 0.3, 0.12, TOP_D - 0.3]} radius={0.04} position={[0, -TOP_T - 0.06, 0]}>
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </RoundedBox>
    </group>
  )
}
