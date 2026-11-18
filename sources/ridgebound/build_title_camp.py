"""Render the Ridgebound title camp backgrounds with Blender/Cycles."""
import math
import random
import sys
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

SEED = 723951
PARK = Vector((7.5, -1.5, 0.28))
rng = random.Random(SEED)


def smooth(low, high, x):
    value = max(0.0, min(1.0, (x - low) / (high - low)))
    return value * value * (3.0 - 2.0 * value)


def srgb(value):
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def rgba(hex_color):
    return (*[srgb(int(hex_color[i:i + 2], 16) / 255.0) for i in (0, 2, 4)], 1.0)


def mixed(a, b, factor):
    return tuple((1.0 - factor) * v + factor * w for v, w in zip(a, b))


def mesh(name, positions, faces, materials, indices=None):
    data = bpy.data.meshes.new(name)
    data.from_pydata(positions, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    for material in materials:
        data.materials.append(material)
    if indices is not None:
        for polygon, index in zip(data.polygons, indices):
            polygon.material_index = index
    return obj


def material(name, color, roughness=0.85, emission=0.0):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    node = result.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = rgba(color)
    node.inputs["Roughness"].default_value = roughness
    if emission > 0:
        node.inputs["Emission Color"].default_value = rgba(color)
        node.inputs["Emission Strength"].default_value = emission
    return result


def box(name, size, position, appearance, lean=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=position)
    result = bpy.context.object
    result.name = name
    result.scale = size
    result.rotation_euler.y = lean
    result.data.materials.append(appearance)
    return result


def trail(y):
    return 2.8 + 10.0 * math.sin((y + 12.0) * 0.041) - 0.135 * y + 1.2 * math.sin(y * 0.13)


def lake_distance(x, y):
    return math.hypot((x + 20.5) / 22.0, (y - 42.0) / 24.5)


def ground_height(x, y):
    raw = 0.3 * math.sin(y * .106 + x * .071) + .5 * math.cos(x * .048 - y * .034)
    raw += 2.2 * math.sin(x * .033 + y * .023) * smooth(12.0, 62.0, y)
    raw += .9 * math.cos(x * .13 - y * .065) * smooth(16.0, 110.0, abs(x))
    lake = smooth(0.90, 1.2, lake_distance(x, y))
    raw = -2.4 * (1.0 - lake) + raw * lake
    apron = smooth(3.8, 7.0, math.hypot(x - PARK.x, (y - PARK.y) * .75))
    return PARK.z + (raw - PARK.z) * apron


def terrain():
    dirt = material("Glacial soil with a dry grass crown", "a48357", 0.96)
    nodes = dirt.node_tree.nodes
    links = dirt.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    color = nodes.new("ShaderNodeVertexColor")
    color.layer_name = "Ground color"
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 5.5
    noise.inputs["Detail"].default_value = 2.6
    noise.inputs["Roughness"].default_value = .67
    texture = nodes.new("ShaderNodeTexCoord")
    links.new(texture.outputs["Object"], noise.inputs["Vector"])
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (.63, .55, .47, 1.0)
    ramp.color_ramp.elements[1].color = (1.02, .97, .90, 1.0)
    links.new(noise.outputs["Fac"], ramp.inputs[0])
    multiply = nodes.new("ShaderNodeMixRGB")
    multiply.blend_type = "MULTIPLY"
    multiply.inputs[0].default_value = .73
    links.new(color.outputs["Color"], multiply.inputs[1])
    links.new(ramp.outputs[0], multiply.inputs[2])
    links.new(multiply.outputs[0], bsdf.inputs["Base Color"])
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = .22
    bump.inputs["Distance"].default_value = .013
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    positions, faces, pigment = [], [], []
    width = 272
    length = 210
    for row in range(length + 1):
        y = -27.0 + row * .89
        at = trail(y)
        for column in range(width + 1):
            x = -121.0 + column * .89
            positions.append((x, y, ground_height(x, y)))
            grass = .45 + .22 * math.sin(x * .33 - y * .25) + .22 * math.cos(y * .16 + x * .12)
            ground = mixed(rgba("9e7841"), rgba("d4b270"), grass)
            if y > 29.0:
                ground = mixed(ground, rgba("8f9a59"), smooth(29.0, 109.0, y) * .66)
            center = abs(x - at)
            road = 1 - smooth(1.74, 2.66, center)
            parking = 1 - smooth(3.5, 7.0, math.hypot(x - PARK.x, (y - PARK.y) * .77))
            ruts = 1 - smooth(.14, .42, abs(center - 0.82 - .08 * math.sin(y * .3)))
            color = mixed(rgba("a98758"), rgba("806242"), ruts * .69)
            pigment.append(mixed(ground, color, max(road, parking * .74)))
    for row in range(length):
        for column in range(width):
            a = row * (width + 1) + column
            b = a + width + 1
            faces.append((a, a + 1, b + 1, b))
    obj = mesh("Shouldered trail and grassy valley", positions, faces, [dirt])
    attr = obj.data.color_attributes.new(name="Ground color", type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", [channel for c in pigment for channel in c])
    for poly in obj.data.polygons:
        poly.use_smooth = True


def mountain_layer(label, y, elevation, max_height, color, offset, spread):
    shade = material(label, color, 1.0, .18)
    points, faces = [], []
    pitch = 7.0
    ridge_count = 117
    for level, depth in enumerate([0.0, 40.0, 138.0, 193.0, 234.0]):
        for column in range(ridge_count):
            x = (column - ridge_count // 2) * pitch
            h = math.sin(x * .015 + offset) * .28 + math.sin(x * .031 + offset * 2) * .18
            h += math.cos(x * .061 + offset) * .12
            h += rng.uniform(-.024, .024)
            peak = elevation + h * max_height + spread * abs(math.sin(x * .009 + offset))
            height = -9.5 if level == 0 else peak * [0.0, .22, 1.0, .48, .01][level]
            points.append((x + 8 * math.sin(column * .42) * level, y + depth + 19 * math.sin(x * .019 + level), height))
    for level in range(4):
        for column in range(ridge_count - 1):
            a = level * ridge_count + column
            b = a + ridge_count
            if (level + column) % 2:
                faces += [(a, a + 1, b + 1), (a, b + 1, b)]
            else:
                faces += [(a, a + 1, b), (a + 1, b + 1, b)]
    mesh(label, points, faces, [shade])


def conifer_template(variant, foliage, trunk):
    radial = 7
    profile = [(0.0, .12), (.45, .115), (.33, .58), (.40, .88), (.53, .63), (.60, .72),
               (.69, .38), (.73, .43), (.84, .23), (1.0, .018)]
    points, faces, indices = [], [], []
    for row, (height, radius) in enumerate(profile):
        for spoke in range(radial):
            angle = spoke / radial * math.tau + .16 * (row % 3)
            wave = .82 + .22 * float((spoke * 7 + row * 3 + variant * 2) % 11) / 10.0
            points.append((math.cos(angle) * radius * wave + height * .14,
                           math.sin(angle) * radius * wave, height * 5.6))
    for row in range(len(profile) - 1):
        for spoke in range(radial):
            a = row * radial + spoke
            b = row * radial + (spoke + 1) % radial
            c = a + radial
            d = b + radial
            faces.append((a, b, d, c))
            indices.append(0 if row < 1 else 1 + ((row * 2 + spoke + variant) % len(foliage)))
    faces.append(tuple(range(radial - 1, -1, -1)))
    indices.append(0)
    faces.append(tuple(range(len(points) - radial, len(points))))
    indices.append(2)
    obj = mesh("Conifer silhouette %s" % variant, points, faces, [trunk, *foliage], indices)
    tree_data = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    return tree_data


def forest():
    trunk = material("Weathered pine bark", "634b34")
    foliage = [material("Evergreen %s" % i, code) for i, code in enumerate(
        ("3b5743", "4d6748", "516a4f", "5c7451", "405942"))]
    models = [conifer_template(i, foliage, trunk) for i in range(3)]
    positions = [(-4.8, 1.4, 1.5), (21.3, 2.6, 1.6), (-13.4, 8.0, 1.38),
                 (22.7, 13.4, 1.68), (-15.1, 19.0, 1.0), (-27.9, 13.1, 1.28),
                 (25.2, 22.4, 1.04), (28.1, 23.6, 1.28)]
    for _ in range(800):
        x = rng.uniform(-101.0, 101.0)
        y = rng.uniform(5.5, 154.0)
        if lake_distance(x, y) < 1.1 or abs(x - trail(y)) < 5.4:
            continue
        if -15.0 < x < 42.0 and y < 30.0:
            continue
        if 6.0 < x < 19.0 and 34.0 < y < 51.0:
            continue
        grove = .5 + .29 * math.sin(x * .21 + y * .12) + .22 * math.cos(x * .09 - y * .34)
        if rng.random() > grove:
            continue
        positions.append((x, y, rng.uniform(.58, 1.83)))
    for i, (x, y, size) in enumerate(positions):
        obj = bpy.data.objects.new("Pine %03d" % i, models[i % len(models)])
        bpy.context.collection.objects.link(obj)
        obj.location = (x, y, ground_height(x, y) - .09)
        width = rng.uniform(.85, 1.3)
        obj.scale = (size * width, size * width, size)
        obj.rotation_euler.z = rng.uniform(0, math.tau)


def meadow():
    palette = [material("Dry grass blade %s" % i, color, .93) for i, color in enumerate(
        ("a68543", "c3a35a", "8d753f", "ba9c50", "d4b675", "937440"))]
    verts, faces, tones = [], [], []
    for _ in range(18000):
        x, y = rng.uniform(-27.0, 42.0), rng.uniform(-11.5, 52.0)
        if lake_distance(x, y) < 1.02:
            continue
        if abs(x - trail(y)) < 2.35 or math.hypot(x - PARK.x, (y - PARK.y) * .75) < 4.7:
            continue
        if y > 14 and rng.random() > .54:
            continue
        if 9 < x < 20 and 35 < y < 45:
            continue
        z = ground_height(x, y) - .035
        tone = rng.randrange(len(palette))
        for blade in range(rng.randrange(3, 7)):
            angle = rng.random() * math.tau
            right = Vector((math.cos(angle), math.sin(angle), 0))
            width = rng.uniform(.018, .045)
            height = rng.uniform(.11, .38) * (1.0 if y < 26 else 1.32)
            base = Vector((x + rng.uniform(-.09, .09), y + rng.uniform(-.09, .09), z))
            bend = Vector((rng.uniform(.015, .16), rng.uniform(-.11, .07), height))
            middle = base + bend * .60
            start = len(verts)
            verts += [base - right * width, base + right * width,
                      middle + right * (width * .57), middle - right * (width * .57),
                      base + bend + Vector((.03, -.02, 0))]
            faces += [(start, start + 1, start + 2, start + 3),
                      (start + 3, start + 2, start + 4)]
            tones += [tone, tone]
    mesh("Clumped meadow grass", verts, faces, palette, tones)


def lake():
    apparent = material("Quiet lake", "678d96", .27, .21)
    shader = apparent.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Metallic"].default_value = .18
    noise = apparent.node_tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 15.0
    noise.inputs["Detail"].default_value = 2.0
    bump = apparent.node_tree.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = .21
    bump.inputs["Distance"].default_value = .078
    coords = apparent.node_tree.nodes.new("ShaderNodeTexCoord")
    apparent.node_tree.links.new(coords.outputs["Generated"], noise.inputs["Vector"])
    apparent.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    apparent.node_tree.links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    points = [
        (-20.5 + math.cos(i * math.tau / 120) * 23.1, 42 + math.sin(i * math.tau / 120) * 25.7, -1.77)
        for i in range(120)
    ]
    mesh("Lake waterline", points, [tuple(range(120))], [apparent])


def cabin():
    woods = [material("Camp plank %s" % i, color) for i, color in enumerate(
        ("755338", "825e45", "9c7353", "624b36"))]
    roof = material("Pine tar roofing", "474b40", .89)
    glass = material("Camp window", "eab677", .38, .7)
    building = Vector((12.15, 42.0, 0.0))
    building.z = ground_height(building.x, building.y)
    p = building
    box("Cabin foundation", (4.85, 3.75, .32), p + Vector((0, 0, .02)), woods[3])
    box("Cabin walls", (4.65, 3.6, 2.15), p + Vector((0, 0, 1.12)), woods[0])
    for row in range(9):
        z = .23 + row * .231
        box("Weatherboard facing trail", (4.72, .08, .208), p + Vector((0, -1.815, z)), woods[row % 3])
        box("Weatherboard along camp", (.08, 3.62, .208), p + Vector((-2.333, 0, z)), woods[(row + 1) % 3])
    for direction in [-1, 1]:
        box("Camp eave", (2.84, 4.25, .18), p + Vector((direction * 1.31, 0, 2.69)), roof, direction * .35)
    box("Plank door", (1.0, .09, 1.8), p + Vector((1.02, -1.88, .96)), woods[3])
    box("Window dark inset", (1.17, .08, .92), p + Vector((-1.0, -1.87, 1.43)), woods[3])
    box("Window panes", (.96, .073, .70), p + Vector((-1.0, -1.92, 1.43)), glass)
    box("Window vertical frame", (.045, .05, .70), p + Vector((-1.0, -1.98, 1.43)), woods[3])
    box("Window horizontal frame", (.96, .05, .045), p + Vector((-1.0, -1.98, 1.43)), woods[3])
    box("Dry porch step", (4.65, 1.51, .16), p + Vector((0, -2.5, .24)), woods[1])
    box("Chimney", (.38, .41, 1.6), p + Vector((1.22, .64, 3.17)), woods[3])


def rocks():
    appearances = [material("Weathered slate %d" % i, code) for i, code in enumerate(
        ("737467", "807c66", "5c625c", "8f8872"))]
    for _ in range(158):
        x, y = rng.uniform(-76.0, 76.0), rng.uniform(-9.0, 107.0)
        if lake_distance(x, y) < .97 or abs(x - trail(y)) < 2.7 or (Vector((x, y, PARK.z)) - PARK).length < 5.0:
            continue
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0, location=(x, y, ground_height(x, y)))
        obj = bpy.context.object
        obj.name = "Weathered slate"
        size = rng.uniform(.12, .56)
        obj.scale = (rng.uniform(.65, 1.4) * size, size, rng.uniform(.24, .67) * size)
        obj.rotation_euler.z = rng.uniform(0.0, math.tau)
        obj.data.materials.append(rng.choice(appearances))


def sky_color():
    world = bpy.data.worlds.new("Alpine evening")
    world.use_nodes = True
    bpy.context.scene.world = world
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    coords, separate = nodes.new("ShaderNodeTexCoord"), nodes.new("ShaderNodeSeparateXYZ")
    links.new(coords.outputs["Normal"], separate.inputs["Vector"])
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = .19
    ramp.color_ramp.elements[0].color = rgba("eac8a0")
    ramp.color_ramp.elements[1].position = .83
    ramp.color_ramp.elements[1].color = rgba("648fa9")
    warm = ramp.color_ramp.elements.new(.32)
    warm.color = rgba("f0d3b3")
    cool = ramp.color_ramp.elements.new(.53)
    cool.color = rgba("b7b7b7")
    fit = nodes.new("ShaderNodeMapRange")
    fit.inputs["From Min"].default_value = -.063
    fit.inputs["From Max"].default_value = .42
    links.new(separate.outputs["Z"], fit.inputs["Value"])
    links.new(fit.outputs["Result"], ramp.inputs[0])
    ambient = nodes.get("Background")
    ambient.inputs["Color"].default_value = rgba("ccd9f2")
    ambient.inputs["Strength"].default_value = .38
    visible = nodes.new("ShaderNodeBackground")
    visible.inputs["Strength"].default_value = .86
    links.new(ramp.outputs["Color"], visible.inputs["Color"])
    ray = nodes.new("ShaderNodeLightPath")
    mix = nodes.new("ShaderNodeMixShader")
    links.new(ray.outputs["Is Camera Ray"], mix.inputs["Fac"])
    links.new(ambient.outputs[0], mix.inputs[1])
    links.new(visible.outputs[0], mix.inputs[2])
    links.new(mix.outputs[0], nodes.get("World Output").inputs["Surface"])


def sunlight():
    data = bpy.data.lights.new("Evening sun", "SUN")
    data.color = (1.0, .79, .57)
    data.energy = 2.1
    data.angle = math.radians(4.8)
    sun = bpy.data.objects.new("Evening sun", data)
    bpy.context.collection.objects.link(sun)
    sun.rotation_euler = Vector((.66, .45, -.56)).to_track_quat("-Z", "Y").to_euler()


def render(scene, output, vertical):
    wide = not vertical
    bpy.ops.object.camera_add()
    camera = bpy.context.object
    scene.camera = camera
    scene.render.resolution_x, scene.render.resolution_y = (1164, 538) if wide else (624, 1352)
    camera.location = (1.0, -16.5, 2.29) if wide else (7.85, -16.2, 2.62)
    look = Vector((1.8, 31.0, 5.6) if wide else (4.0, 30.0, 5.7))
    camera.rotation_euler = (look - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.sensor_fit = "HORIZONTAL" if wide else "VERTICAL"
    camera.data.lens = 34 if wide else 38
    camera.data.clip_end = 950.0
    bpy.context.view_layer.update()
    goals = (.70, .32) if wide else (.53, .44)
    for index, axis in enumerate(("shift_x", "shift_y")):
        before = world_to_camera_view(scene, camera, PARK)[index]
        setattr(camera.data, axis, .001)
        after = world_to_camera_view(scene, camera, PARK)[index]
        setattr(camera.data, axis, (goals[index] - before) * .001 / (after - before))
    frame = world_to_camera_view(scene, camera, PARK)
    print("CAMP PARKING PIXEL", frame.x, 1.0 - frame.y)
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)


def main():
    destination = Path(sys.argv[-1]).resolve()
    destination.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 18
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 4
    scene.cycles.diffuse_bounces = 2
    scene.cycles.glossy_bounces = 2
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = .43
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"

    sky_color()
    sunlight()
    mountain_layer("Far blue range", 430.0, 54.5, 64.0, "afbdc3", 2.3, 27.0)
    mountain_layer("Middle range", 287.0, 36.0, 65.0, "8caaa9", .7, 25.0)
    mountain_layer("Pine foothills", 156.0, 17.2, 33.0, "76876b", 4.8, 14.0)
    terrain()
    lake()
    forest()
    meadow()
    rocks()
    cabin()
    render(scene, destination / "camp_wide.png", False)
    render(scene, destination / "camp_tall.png", True)
    print("CAMP_RENDER_OK")


if __name__ == "__main__":
    main()
