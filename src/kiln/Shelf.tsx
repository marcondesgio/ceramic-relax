import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { Shape } from 'three'
import { SHELF_TOP } from './kilnLayout'

const WOOD = '#E8C39A'
const WOOD_DARK = '#D9AE82'

/** Mão-francesa: triângulo com a ponta de baixo arredondada */
function useBracketShape() {
  return useMemo(() => {
    const s = new Shape()
    s.moveTo(0, 0)
    s.lineTo(0.7, 0)
    s.quadraticCurveTo(0.5, -0.3, 0.06, -0.62)
    s.quadraticCurveTo(0, -0.66, 0, -0.56)
    s.closePath()
    return s
  }, [])
}

/** Prateleira onde a peça pronta fica exposta */
export function Shelf() {
  const bracket = useBracketShape()
  return (
    <group position={SHELF_TOP}>
      <RoundedBox args={[2.4, 0.14, 1.1]} radius={0.06} position={[0, -0.07, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </RoundedBox>
      {/* mãos-francesas, presas na parte de trás da tábua */}
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x - 0.04, -0.14, -0.5]} rotation={[0, -Math.PI / 2, 0]} castShadow>
          <extrudeGeometry args={[bracket, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}
