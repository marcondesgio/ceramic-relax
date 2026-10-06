import { Color, MeshPhysicalMaterial, type Texture } from 'three'
import type { Finish } from '../store/useGameStore'
import { getSurface } from './paintSurface'

/** Biscoito: cerâmica crua, antes do esmalte */
export const BISCUIT = '#EBD9C4'

/** Antes do forno o esmalte aparece a 62% sobre o biscoito; o forno leva a 100% */
export const RAW_GLAZE_OPACITY = 0.62

export type GlazeLook = 'raw' | Finish

// uniformes compartilhados pelos dois lados da peça (o forno anima `glazeOpacity`)
export const glazeUniforms = {
  glazeOpacity: { value: RAW_GLAZE_OPACITY },
  biscuitColor: { value: new Color(BISCUIT) },
}

/**
 * Material da peça pintada: a cor base é o biscoito e a textura de pintura
 * (com transparência pré-multiplicada) entra por cima com a opacidade do esmalte.
 * MeshPhysicalMaterial para o forno: brilhante usa clearcoat, fosco usa rugosidade alta.
 */
function createGlazeMaterial(paintMap: Texture) {
  const material = new MeshPhysicalMaterial({ metalness: 0 })
  material.defines = { USE_UV: '' }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.paintMap = { value: paintMap }
    shader.uniforms.glazeOpacity = glazeUniforms.glazeOpacity
    shader.uniforms.biscuitColor = glazeUniforms.biscuitColor
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform sampler2D paintMap;\nuniform float glazeOpacity;\nuniform vec3 biscuitColor;',
      )
      .replace(
        '#include <map_fragment>',
        `vec4 paintTex = texture2D( paintMap, vUv );
        diffuseColor.rgb = biscuitColor * ( 1.0 - paintTex.a * glazeOpacity ) + paintTex.rgb * glazeOpacity;`,
      )
  }
  return material
}

let materials: { outer: MeshPhysicalMaterial; inner: MeshPhysicalMaterial } | null = null

/** Os dois materiais da peça (criados uma vez, compartilhados por cena, prévias e foto) */
export function getGlazeMaterials() {
  if (!materials) {
    materials = {
      outer: createGlazeMaterial(getSurface('outer').texture),
      inner: createGlazeMaterial(getSurface('inner').texture),
    }
    applyGlazeLook('raw')
  }
  return materials
}

/** Mapa de ambiente para os reflexos do esmalte (gerado na cena, ver StudioEnv) */
export function setGlazeEnvMap(env: Texture | null) {
  const m = getGlazeMaterials()
  m.outer.envMap = env
  m.inner.envMap = env
  m.outer.needsUpdate = true
  m.inner.needsUpdate = true
}

/**
 * Intensidades de reflexo baixas de propósito: a foto e as prévias são renderizadas
 * sem tone mapping, então a peça precisa ficar bonita sem estourar o branco.
 *
 * Aparência do esmalte:
 * - cru: fosco e um pouco opaco (antes do forno)
 * - brilhante: rugosidade baixa + clearcoat, reflexo marcado
 * - fosco: rugosidade alta e um toque de sheen (aveludado)
 */
export function applyGlazeLook(look: GlazeLook) {
  const { outer, inner } = getGlazeMaterials()
  for (const m of [outer, inner]) {
    if (look === 'glossy') {
      m.roughness = 0.3
      m.clearcoat = 1
      m.clearcoatRoughness = 0.08
      m.sheen = 0
      m.envMapIntensity = 0.32
    } else if (look === 'matte') {
      m.roughness = 0.92
      m.clearcoat = 0
      m.sheen = 0.25
      m.sheenRoughness = 0.9
      m.sheenColor.set('#FFF4E6')
      m.envMapIntensity = 0.12
    } else {
      m.roughness = 0.85
      m.clearcoat = 0
      m.sheen = 0
      m.envMapIntensity = 0.08
    }
  }
  // por dentro a luz é mais baixa; o reflexo também
  inner.envMapIntensity *= 0.6
}

/** Volta ao esmalte cru (peça nova ou de volta à pintura) */
export function resetGlaze() {
  glazeUniforms.glazeOpacity.value = RAW_GLAZE_OPACITY
  applyGlazeLook('raw')
}
