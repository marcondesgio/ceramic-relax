import { Color, MeshPhysicalMaterial, type Texture } from 'three'
import type { Finish } from '../store/useGameStore'
import { getSurface } from './paintSurface'
import { MARKS_BUMP_SCALE, getMarksTexture } from '../pottery/clayMarks'
import { GLAZE_FRAGMENT_DECL, GLAZE_VERTEX_DECL, HANDLE_CRACK, PIECE_CRACK, withHoles } from '../pottery/crackShader'

/** Biscoito: cerâmica crua, antes do esmalte */
export const BISCUIT = '#EBD9C4'

/** Antes do forno o esmalte aparece a 62% sobre o biscoito; o forno leva a 100% */
export const RAW_GLAZE_OPACITY = 0.62

export type GlazeLook = 'raw' | Finish

// uniformes compartilhados pelos dois lados da peça (o forno anima `glazeOpacity`)
export const glazeUniforms = {
  glazeOpacity: { value: RAW_GLAZE_OPACITY },
  biscuitColor: { value: new Color(BISCUIT) },
  /** semente do desenho do craquelado (da receita da peça) */
  crackleSeed: { value: 0 },
  /** kintsugi: 0 = sem ouro; sobe até ~1 enchendo as linhas de ouro de baixo para cima */
  kintsugi: { value: 0 },
  /** brilho extra do ouro durante a animação */
  kintsugiGlow: { value: 0 },
}

/**
 * Material da peça pintada: a cor base é o biscoito e a textura de pintura
 * (com transparência pré-multiplicada) entra por cima com a opacidade do esmalte.
 * MeshPhysicalMaterial para o forno: brilhante usa clearcoat, fosco usa rugosidade alta.
 * Depois da queima, as regiões que secaram no torno mostram o craquelado (aCrack);
 * com o kintsugi, as linhas viram ouro.
 */
function createGlazeMaterial(paintMap: Texture, scale = PIECE_CRACK, holes = false) {
  const material = new MeshPhysicalMaterial({ metalness: 0 })
  material.defines = { USE_UV: '', CRACK_CELLS: scale.cells, CRACK_WIDTH: scale.width }
  material.onBeforeCompile = (shader) => {
    if (holes) withHoles(shader)
    shader.uniforms.paintMap = { value: paintMap }
    shader.uniforms.glazeOpacity = glazeUniforms.glazeOpacity
    shader.uniforms.biscuitColor = glazeUniforms.biscuitColor
    shader.uniforms.crackleSeed = glazeUniforms.crackleSeed
    shader.uniforms.kintsugi = glazeUniforms.kintsugi
    shader.uniforms.kintsugiGlow = glazeUniforms.kintsugiGlow
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${GLAZE_VERTEX_DECL}`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDry = aDry;\nvCrack = aCrack;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nuniform sampler2D paintMap;\nuniform float glazeOpacity;\nuniform vec3 biscuitColor;
        uniform float crackleSeed;\nuniform float kintsugi;\nuniform float kintsugiGlow;\n${GLAZE_FRAGMENT_DECL}`,
      )
      .replace(
        '#include <map_fragment>',
        `vec4 paintTex = texture2D( paintMap, vUv );
        diffuseColor.rgb = biscuitColor * ( 1.0 - paintTex.a * glazeOpacity ) + paintTex.rgb * glazeOpacity;
        // o craquelado só aparece quando o esmalte termina de queimar (surpresa do forno)
        float fired = smoothstep( 0.9, 1.0, glazeOpacity );
        float crackle = crackLines( vUv, vCrack, crackleSeed, 0.03 * CRACK_WIDTH, CRACK_CELLS ) * fired;
        float gold = crackle * clamp( ( kintsugi * 1.25 - vUv.y ) / 0.12, 0.0, 1.0 );
        diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * 0.5 + vec3( 0.05, 0.035, 0.03 ), crackle - gold );
        diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.93, 0.72, 0.28 ), gold );
        ${holes ? 'diffuseColor.rgb *= 1.0 - 0.35 * holeEdge;' : ''}`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix( roughnessFactor, 0.28, gold );',
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = mix( metalnessFactor, 0.85, gold );',
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3( 0.95, 0.7, 0.25 ) * gold * ( 0.18 + kintsugiGlow );',
      )
  }
  material.customProgramCacheKey = () => `glaze-crackle-${scale.cells}-${holes}`
  return material
}

let materials: { outer: MeshPhysicalMaterial; inner: MeshPhysicalMaterial; handle: MeshPhysicalMaterial } | null = null

/** Os dois materiais da peça (criados uma vez, compartilhados por cena, prévias e foto) */
export function getGlazeMaterials() {
  if (!materials) {
    materials = {
      // a parede da peça recebe os furos da espátula; as alças não
      outer: createGlazeMaterial(getSurface('outer').texture, PIECE_CRACK, true),
      inner: createGlazeMaterial(getSurface('inner').texture, PIECE_CRACK, true),
      // alças: mesma receita de esmalte, com a pintura delas
      handle: createGlazeMaterial(getSurface('handle').texture, HANDLE_CRACK),
    }
    // as marquinhas do preparo continuam visíveis por baixo do esmalte
    materials.outer.bumpMap = getMarksTexture()
    materials.outer.bumpScale = MARKS_BUMP_SCALE
    applyGlazeLook('raw')
  }
  return materials
}

/** Mapa de ambiente para os reflexos do esmalte (gerado na cena, ver StudioEnv) */
export function setGlazeEnvMap(env: Texture | null) {
  const m = getGlazeMaterials()
  for (const mat of [m.outer, m.inner, m.handle]) {
    mat.envMap = env
    mat.needsUpdate = true
  }
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
  const { outer, inner, handle } = getGlazeMaterials()
  for (const m of [outer, inner, handle]) {
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
