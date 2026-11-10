# Otimiza um personagem (OBJ gerado com 1,5 mi de triângulos) para o jogo:
# reduz a malha, normaliza (pés no chão, altura 1), refaz o material com texturas 1024 e
# exporta GLB com Draco + prévias de frente, de lado e de costas (PNG 512 px).
#
# Uso (caminhos absolutos; testado no Blender 5.2):
#   blender -b --factory-startup --python tools/blender/process_character.py -- \
#     <pasta_obj> <saida.glb> <previa_prefixo> <triangulos> [angulo_bracos]
#
# - pasta_obj: docs/characters/<id> (OBJ + texture_pbr_20250901.png e _normal.png; não versionados)
# - saida.glb: public/models/characters/<id>.glb (depois, preencher CHARACTER_FILES em src/scene/models.ts)
# - triangulos: 20000 deixa cada bichinho entre 200 e 330 KB
# - angulo_bracos: quanto baixar os braços da pose em T, em graus (padrão 62; a Tatá usa 0)
#
# Exemplo:
#   blender -b --factory-startup --python tools/blender/process_character.py -- \
#     C:/.../docs/characters/capi C:/.../public/models/characters/capi.glb C:/tmp/capi 20000
import bpy, sys, os, glob, math
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src_dir, out_glb, preview, target_tris = args[0], args[1], args[2], int(args[3])
TEX = 1024
work = os.path.dirname(out_glb)

bpy.ops.wm.read_factory_settings(use_empty=True)
obj_path = glob.glob(os.path.join(src_dir, '*.obj'))[0]
bpy.ops.wm.obj_import(filepath=obj_path)
ob = [o for o in bpy.context.scene.objects if o.type == 'MESH'][0]
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
src_tris = len(ob.data.polygons)

# 1. reduz a malha (colapso de arestas, mantém UV)
dec = ob.modifiers.new('dec', 'DECIMATE')
dec.ratio = min(1.0, target_tris / max(1, src_tris))
dec.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=dec.name)
bpy.ops.object.shade_smooth()

# 2. normaliza: pés em z=0, centro em x/y, altura 1
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
vs = [v.co for v in ob.data.vertices]
mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
h = mx.z - mn.z
s = 1.0 / h
cx, cy = (mn.x + mx.x) / 2, (mn.y + mx.y) / 2
for v in ob.data.vertices:
    v.co = Vector(((v.co.x - cx) * s, (v.co.y - cy) * s, (v.co.z - mn.z) * s))
ob.data.update()

# 2b. baixa os braços da T-pose: acha o ombro (onde a silhueta afina para a espessura do braço)
# e gira o braço para baixo em volta dele, com transição suave (sem esqueleto)
ARM_ANGLE = math.radians(float(args[4]) if len(args) > 4 else 62)
if ARM_ANGLE > 0:
    vs = [v.co for v in ob.data.vertices]
    xmax = max(abs(v.x) for v in vs)
    tips = sorted(v.z for v in vs if abs(v.x) > 0.85 * xmax)
    zc = tips[len(tips) // 2]
    t = max(0.03, tips[int(len(tips) * 0.95)] - tips[int(len(tips) * 0.05)])
    # espessura vertical da silhueta em faixas de |x|, de dentro para fora
    bins = 60
    ext = []
    for b in range(bins):
        lo, hi = xmax * b / bins, xmax * (b + 1) / bins
        zs = [v.z for v in vs if lo <= abs(v.x) < hi]
        ext.append((max(zs) - min(zs)) if zs else 0)
    sx = next((xmax * b / bins for b in range(bins) if 0 < ext[b] < 2.2 * t), 0.5 * xmax)
    blend = 0.7 * t
    px = sx - 0.35 * t
    for v in ob.data.vertices:
        ax = abs(v.co.x)
        if ax <= px - blend or abs(v.co.z - zc) > 2.2 * t + 0.4 * max(0, ax - px):
            continue
        k = min(1.0, max(0.0, (ax - (px - blend)) / (2 * blend)))
        w = k * k * (3 - 2 * k)
        a = ARM_ANGLE * w
        dx, dz = ax - px, v.co.z - zc
        nx = dx * math.cos(a) + dz * math.sin(a)
        nz = -dx * math.sin(a) + dz * math.cos(a)
        v.co.x = math.copysign(px + nx, v.co.x)
        v.co.z = zc + nz
    ob.data.update()
    print('ARMS', 'xmax', round(xmax, 3), 'shoulder', round(sx, 3), 'arm_z', round(zc, 3), 'thick', round(t, 3))
    # re-normaliza a altura (as mãos podem ter ficado abaixo dos pés? não deveriam) e a largura muda
    vs = [v.co for v in ob.data.vertices]
    zmin = min(v.z for v in vs)
    if zmin < 0:
        for v in ob.data.vertices:
            v.co.z -= zmin
        ob.data.update()

# 3. material novo: cor + relevo em 1024 px; pelúcia fosca (sem metal)
def load_resized(name, colorspace):
    path = os.path.join(src_dir, name)
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = colorspace
    if img.size[0] > TEX:
        img.scale(TEX, TEX)
    return img

base = load_resized('texture_pbr_20250901.png', 'sRGB')
normal = load_resized('texture_pbr_20250901_normal.png', 'Non-Color')
mat = bpy.data.materials.new('Pelucia')
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes['Principled BSDF']
tb = nt.nodes.new('ShaderNodeTexImage'); tb.image = base
nt.links.new(tb.outputs['Color'], bsdf.inputs['Base Color'])
tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = normal
nm = nt.nodes.new('ShaderNodeNormalMap')
nt.links.new(tn.outputs['Color'], nm.inputs['Color'])
nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
bsdf.inputs['Metallic'].default_value = 0.0
bsdf.inputs['Roughness'].default_value = 0.8
ob.data.materials.clear()
ob.data.materials.append(mat)
ob.name = os.path.splitext(os.path.basename(out_glb))[0]

# 4. exporta GLB (Y para cima, Draco, texturas JPEG)
bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format='GLB',
    use_selection=True,
    export_yup=True,
    export_apply=True,
    export_image_format='JPEG',
    export_jpeg_quality=86,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14,
    export_draco_texcoord_quantization=12,
    export_draco_normal_quantization=10,
    export_materials='EXPORT',
)

# 5. prévias de frente (-Y) e de lado (+X) com textura (Workbench, rápido)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'TEXTURE'
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.film_transparent = False
cam_data = bpy.data.cameras.new('cam'); cam_data.type = 'ORTHO'; cam_data.ortho_scale = 1.25
cam = bpy.data.objects.new('cam', cam_data); scene.collection.objects.link(cam); scene.camera = cam
for tag, loc, rot in [('front', (0, -3, 0.5), (math.radians(90), 0, 0)), ('side', (3, 0, 0.5), (math.radians(90), 0, math.radians(90))), ('back', (0, 3, 0.5), (math.radians(90), 0, math.radians(180)))]:
    cam.location = loc
    cam.rotation_euler = rot
    scene.render.filepath = f'{preview}_{tag}.png'
    bpy.ops.render.render(write_still=True)

vs = [v.co for v in ob.data.vertices]
print('RESULT', ob.name, 'src_tris', src_tris, 'tris', len(ob.data.polygons), 'verts', len(vs),
      'width', round(max(v.x for v in vs) - min(v.x for v in vs), 3), 'depth', round(max(v.y for v in vs) - min(v.y for v in vs), 3),
      'glb_kb', os.path.getsize(out_glb) // 1024)
