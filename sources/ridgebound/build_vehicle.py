"""Build the original Ridge Rover expedition 4x4 from a clean Blender scene.

    blender -b --factory-startup --python-exit-code 1 \
        -P sources/ridgebound/build_vehicle.py -- [--output-dir DIR] [--preview]

Geometry is authored in metres. Game +Z faces forward, +Y is up, and +X
is the driver's left. Blender's Z-up conversion is applied only here.
"""
import argparse
import json
import math
from pathlib import Path
import shutil
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

SOURCE = Path(__file__).resolve().parent
# The wheel centers and tread radius match the Godot suspension contact points.
TREAD_DESIGN_RADIUS = 0.64
WHEEL_RADIUS = 0.52
AXLE_Z = 1.30
TRACK_HALF_WIDTH = 0.954
BODY_WIDTH_FACTOR = 0.9
HALF_TRACK = TRACK_HALF_WIDTH / BODY_WIDTH_FACTOR
RIDE_HEIGHT = 0.53
TAU = math.tau


def blender_point(point):
    x, y, z = point
    return Vector((x, -z, y))


def material(name, hex_color, roughness, metallic=0.0, alpha=1.0, emission=0.0):
    channels = [int(hex_color[index:index+2], 16) / 255 for index in (0, 2, 4)]
    rgb = [value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4
           for value in channels]
    out = bpy.data.materials.new(name)
    out.use_nodes = True
    shader = out.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Alpha"].default_value = alpha
    if emission:
        shader.inputs["Emission Color"].default_value = (*rgb, 1)
        shader.inputs["Emission Strength"].default_value = emission
    out.diffuse_color = (*rgb, alpha)
    if alpha < 1:
        if hasattr(out, "surface_render_method"):
            out.surface_render_method = "DITHERED"
            out.use_transparency_overlap = False
        else:
            out.blend_method = "BLEND"
    return out


def vehicle_materials():
    palette = {
        "paint": ("Copper enamel", "AA5935", .32, .15),
        "cream": ("Warm limestone", "E6D8AF", .50, .06),
        "black": ("All-terrain rubber", "252A29", .90),
        "trim": ("Charcoal coating", "273532", .70, .10),
        "glass": ("Glazing", "82A6AB", .17, .0, .095),
        "metal": ("Machined aluminium", "AAAFA4", .35, .62),
        "seat": ("Olive canvas", "616951", .90),
        "orange": ("Amber lens", "E4A741", .34, .1, 1, .16),
        "red": ("Ruby lens", "9E3B37", .35, .05, 1, .10),
        "light": ("Headlamp optic", "FFF0CB", .27, .1, 1, .27),
        "green": ("Expedition olive", "667457", .80),
    }
    surfaces = {key: material(*properties) for key, properties in palette.items()}
    enamel = surfaces["paint"].node_tree.nodes.get("Principled BSDF")
    enamel.inputs["Coat Weight"].default_value = .24
    enamel.inputs["Coat Roughness"].default_value = .28
    glass = surfaces["glass"].node_tree.nodes.get("Principled BSDF")
    glass.inputs["IOR"].default_value = 1.45
    glass.inputs["Specular IOR Level"].default_value = .25
    return surfaces


def select_only(objects, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active or objects[0]


class Rover:
    def __init__(self):
        self.mat = vehicle_materials()
        self.root = self.empty("RidgeRover")
        self.body = self.empty("Body", self.root)
        self.body["vehicle"] = "Ridge Rover 02"
        self.body["wheelbase_m"] = 2 * AXLE_Z
        self.body["track_m"] = 2 * TRACK_HALF_WIDTH
        self.body["wheel_radius_m"] = WHEEL_RADIUS
        self.body["neutral_ride_height_m"] = RIDE_HEIGHT

    def empty(self, name, parent=None, point=(0, 0, 0)):
        obj = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = parent
        obj.location = blender_point(point)
        obj.empty_display_size = .12
        return obj

    def mesh(self, name, vertices, faces, key, parent=None, bevel=0, segments=1, smooth=False):
        data = bpy.data.meshes.new(name)
        data.from_pydata([blender_point(v) for v in vertices], [], faces)
        if data.validate():
            raise ValueError(f"Invalid mesh topology in {name}")
        editable = bmesh.new()
        editable.from_mesh(data)
        bmesh.ops.recalc_face_normals(editable, faces=list(editable.faces))
        editable.to_mesh(data)
        editable.free()
        data.update()
        data.materials.append(self.mat[key])
        obj = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = parent or self.body
        if smooth or bevel:
            for face in data.polygons:
                face.use_smooth = True
        if bevel:
            chamfer = obj.modifiers.new("Edge radius", "BEVEL")
            chamfer.width = bevel
            chamfer.segments = segments
            chamfer.limit_method = "ANGLE"
            chamfer.harden_normals = True
            normals = obj.modifiers.new("Face-weighted normals", "WEIGHTED_NORMAL")
            normals.keep_sharp = True
        return obj

    def prism(self, name, first_face, second_face, key, parent=None, **settings):
        """Build closed manufactured sections with shared edges."""
        count = len(first_face)
        assert count == len(second_face) and count >= 3
        faces = [tuple(range(count - 1, -1, -1)), tuple(range(count, 2 * count))]
        for i in range(count):
            j = (i + 1) % count
            faces.append((i, j, j + count, i + count))
        return self.mesh(name, [*first_face, *second_face], faces, key, parent, **settings)

    def box(self, name, point, size, key, parent=None, bevel=.02, segments=1):
        x, y, z = point
        dx, dy, dz = (d * .5 for d in size)
        front = [(x+sx*dx, y+sy*dy, z+dz) for sx, sy in
                 ((-1,-1),(1,-1),(1,1),(-1,1))]
        back = [(px, py, z-dz) for px, py, _ in front]
        return self.prism(name, front, back, key, parent, bevel=bevel, segments=segments)

    def tube(self, name, start, end, radius, key, parent=None, sides=12, end_radius=None):
        start, end = Vector(start), Vector(end)
        axis = (end - start).normalized()
        tangent = axis.cross(Vector((0, 0, 1)))
        if tangent.length < .01:
            tangent = axis.cross(Vector((1, 0, 0)))
        tangent.normalize()
        bitangent = axis.cross(tangent)
        directions = [tangent * math.cos(i * TAU / sides) +
                      bitangent * math.sin(i * TAU / sides) for i in range(sides)]
        return self.prism(name, [start + v * radius for v in directions],
                          [end + v * (end_radius or radius) for v in directions],
                          key, parent, smooth=sides >= 16)

    def sweep(self, name, path, radius, key, parent=None, sides=8, closed=False):
        vertices = []
        span = len(path)
        points = [Vector(p) for p in path]
        previous_tangent = radial = None
        for index, point in enumerate(points):
            before = points[(index - 1) % span] if closed else points[max(index - 1, 0)]
            after = points[(index + 1) % span] if closed else points[min(index + 1, span - 1)]
            tangent = (after - before).normalized()
            # Carry the frame along the path to avoid flips when direction
            # runs parallel to a global axis.
            if previous_tangent is None:
                radial = tangent.cross(Vector((0, 0, 1)))
                if radial.length < .01:
                    radial = tangent.cross(Vector((1, 0, 0)))
                radial.normalize()
            else:
                radial = previous_tangent.rotation_difference(tangent) @ radial
            previous_tangent = tangent
            bitangent = tangent.cross(radial)
            vertices.extend(point + radius * (math.cos(i * TAU / sides) * radial +
                            math.sin(i * TAU / sides) * bitangent) for i in range(sides))
        faces = []
        for prev in range(span if closed else span - 1):
            after = (prev + 1) % span
            for side in range(sides):
                n = (side + 1) % sides
                faces.append((prev*sides+side, prev*sides+n, after*sides+n, after*sides+side))
        if not closed:
            faces.extend((tuple(range(sides - 1, -1, -1)), tuple(range((span-1)*sides, span*sides))))
        return self.mesh(name, vertices, faces, key, parent, smooth=True)

    def turned(self, name, profile, key, parent, sides=24):
        """Revolve the closed (axial x, radial distance) profile around a wheel spindle."""
        vertices = []
        for x, radius in profile:
            vertices.extend((x, radius*math.cos(TAU*i/sides), radius*math.sin(TAU*i/sides))
                            for i in range(sides))
        faces = []
        for row in range(len(profile)):
            nrow = (row + 1) % len(profile)
            for i in range(sides):
                j = (i + 1) % sides
                faces.append((row*sides+i, row*sides+j, nrow*sides+j, nrow*sides+i))
        return self.mesh(name, vertices, faces, key, parent, smooth=True)

    def build_chassis(self):
        # Formed ladder rails, dropped crossmembers, live axles and transfer case.
        chassis = self.empty("LadderFrame", self.body)
        for side in (-1, 1):
            rail_profile = [(-2.13,.18),(-1.65,.18),(-1.37,.37),(-1.04,.37),
                            (-.75,.24),(.78,.24),(1.08,.36),(1.51,.36),(2.10,.23),
                            (2.10,.08),(1.48,.20),(1.12,.20),(.83,.08),
                            (-.81,.08),(-1.08,.21),(-1.36,.21),(-1.68,.02),(-2.13,.02)]
            self.prism("Boxed frame rail", [(side*.57,y,z) for z,y in rail_profile],
                       [(side*.73,y,z) for z,y in rail_profile], "trim", chassis, bevel=.018)
        for z, y in ((-1.99,.13),(-.83,.16),(.0,.18),(.74,.17),(1.96,.17)):
            self.box("Chassis crossmember", (0,y,z), (1.37,.13,.16), "trim", chassis)
        self.box("Transfer case", (0,.03,.18), (.40,.27,.46), "metal", chassis, bevel=.047, segments=2)
        self.box("Gearbox guard", (0,-.13,.35), (.78,.07,.82), "trim", chassis)
        self.box("Sump guard", (0,.06,1.84), (1.30,.10,.52), "metal", chassis, bevel=.04)
        self.box("Fuel tank", (-.28,.11,-1.78), (.56,.24,.50), "trim", chassis, bevel=.05)
        self.sweep("Exhaust pipe", [(.45,.18,1.15),(.45,-.02,.65),(.46,-.04,-.7),
                                  (.38,.02,-1.41),(.27,.05,-1.76),(.27,.04,-2.16)],
                   .041, "metal", chassis)
        self.box("Exhaust silencer", (.46,-.04,-.54), (.30,.16,.47), "metal", chassis, bevel=.06)
        for axle, z in (("F", AXLE_Z), ("R", -AXLE_Z)):
            self.tube("Axle housing", (-.95,0,z), (.95,0,z), .095, "trim", chassis)
            self.tube("Differential cover", (0,0,z-.14), (0,0,z+.14), .205, "trim", chassis)
            self.tube("Differential flange", (0,0,z-.164), (0,0,z-.14), .174, "metal", chassis)
            self.tube("Propeller shaft", (0,.01,.18), (0,0,z*.90), .063, "metal", chassis)
            for side, name in ((-1,"L"), (1,"R")):
                x = side * .77
                self.tube("Trailing arm", (x,.11,z*.54), (x,-.03,z), .058, "trim", chassis)
                self.tube("Spring perch", (x,.05,z), (x,.1,z), .137, "trim", chassis)
                path = [(x+.096*math.cos(TAU*t/9), .09+.36*t/45,
                         z+.096*math.sin(TAU*t/9)) for t in range(46)]
                self.sweep("Coil spring", path, .018, "orange", chassis, sides=6)
                damper_x = side * .85
                damper_z = z - .18
                self.tube("Damper body", (damper_x,.18,damper_z), (damper_x,.46,damper_z),
                          .049, "trim", chassis)
                rod_pivot = self.empty(f"ShockRod_{axle}{name}", self.body, (damper_x,.15,damper_z))
                self.tube("Chrome damper rod", (0,-.26,0), (0,.27,0), .023, "metal", rod_pivot)
                self.tube("Damper lower eye", (-.047,-.20,0), (.047,-.20,0), .045, "trim", rod_pivot)
        self.tube("Steering tie rod", (-.92,-.02,1.49), (.92,-.02,1.49), .042, "metal", chassis)

    def wheel_panel(self, name, side, z_min, z_max, axle_z):
        # Top edges follow the beltline. Contoured lower edges clear tire travel.
        top_height = 1.24 if axle_z < 0 else 1.18
        radius = .91
        arch_angles = [math.radians(-68 + 136*i/16) for i in range(17)]
        # Raise the upper arch to leave room for the full wheel compression.
        arc = [(axle_z + radius*math.sin(a), radius*math.cos(a) + .15*math.cos(a)**2)
               for a in arch_angles]
        floor = [(z_min,.32), *[(z,y) for z,y in arc if z_min < z < z_max], (z_max,.32)]
        profile = [(z_min,top_height),(z_max,top_height),*reversed(floor)]
        self.prism(name, [(side*.99,y,z) for z,y in profile],
                   [(side*.89,y,z) for z,y in profile], "paint", bevel=.021, segments=2)

    def wheel_lip(self, side, z0):
        # Continuous molded fender with an outside chamfer and dark wheel-well liner.
        ring = [(.99,.941), (1.133,.937), (1.235,.917), (1.218,.870), (1.00,.866)]
        sections = 19
        vertices = []
        for i in range(sections):
            angle = math.radians(-77 + 154*i/(sections-1))
            for x, r in ring:
                lift = .15 * math.cos(angle)**2
                vertices.append((side*x, r*math.cos(angle) + lift, z0 + r*math.sin(angle)))
        count = len(ring)
        faces = [tuple(range(count - 1, -1, -1)),
                 tuple(range((sections-1)*count,sections*count))]
        for i in range(sections-1):
            for j in range(count):
                k = (j+1) % count
                faces.append((i*count+j,i*count+k,(i+1)*count+k,(i+1)*count+j))
        return self.mesh("Molded fender flare", vertices, faces, "trim", bevel=.008)

    def shell(self):
        self.box("Cabin floor", (0,.38,-.40), (1.92,.12,2.61), "trim", bevel=.034)
        self.box("Cargo floor", (0,.62,-1.49), (1.85,.12,.93), "trim", bevel=.032)
        self.box("Firewall", (0,.80,.73), (1.86,.78,.09), "paint")
        self.box("Engine", (0,.54,1.33), (1.23,.64,1.14), "trim", bevel=.055, segments=2)
        self.box("Front fascia", (0,.92,2.055), (1.98,.51,.13), "paint", bevel=.045, segments=2)
        self.box("Rear cargo gate", (0,.865,-2.027), (1.99,.76,.12), "paint", bevel=.046, segments=2)
        self.box("Liftgate upper header", (0,2.024,-1.93), (1.96,.12,.13), "cream", bevel=.033)
        self.box("Rear lower cargo sill", (0,.43,-2.03), (1.8,.18,.16), "trim", bevel=.028)

        # A crowned hood and a thinner roof have their own profile breaks.
        def hood_outline(z, y):
            return [(-.99,y-.067,z),(-.92,y,z),(-.59,y+.035,z),(.59,y+.035,z),
                    (.92,y,z),(.99,y-.067,z),(.94,y-.105,z),(-.94,y-.105,z)]
        self.prism("Crowned bonnet", hood_outline(.75,1.218), hood_outline(2.11,1.177),
                   "paint", bevel=.025, segments=2)
        self.box("Bonnet vent insert", (0,1.244,1.004), (.68,.027,.29), "trim", bevel=.027)
        for x in (-.24,-.12,0,.12,.24):
            self.box("Bonnet vent ridge", (x,1.261,1.016), (.04,.014,.195), "metal", bevel=.004)
        self.box("Cowl", (0,1.21,.77), (1.95,.115,.18), "trim", bevel=.03)
        self.box("Windshield header", (0,2.032,.586), (1.89,.078,.1), "cream", bevel=.02)
        roof_section = [(-.98,2.04),(-.99,2.12),(-.87,2.20),(.87,2.20),
                        (.99,2.12),(.98,2.04)]
        self.prism("Stamped hardtop", [(x,y,.68) for x,y in roof_section],
                   [(x,y,-1.98) for x,y in roof_section], "cream", bevel=.039, segments=2)
        for x in (-.61,0,.61):
            self.box("Hardtop rib", (x,2.204,-.65), (.090,.020,2.34), "cream", bevel=.01)

        def glazing(name, vertices, offset):
            off = Vector(offset)
            self.prism(name, vertices, [Vector(v) + off for v in vertices], "glass")

        glazing("Raked windshield", [(-.899,1.265,.831),(.899,1.265,.831),(.862,2.006,.604),
                                      (-.862,2.006,.604)], (0,0,.008))
        glazing("Liftgate glass", [(-.86,1.26,-2.00),(.86,1.26,-2.00),(.85,1.969,-1.956),
                                     (-.85,1.969,-1.956)], (0,0,-.008))
        for side in (-1,1):
            self.wheel_panel("Stamped front wing", side, .615,2.115, AXLE_Z)
            self.wheel_panel("Stamped rear quarter", side, -2.038,-.697, -AXLE_Z)
            door_outer = [(side*.997,1.228,-.692),(side*.997,1.228,.607),
                          (side*.988,.415,.567),(side*.968,.37,-.585)]
            door_inner = [(x-side*.092,y,z) for x,y,z in door_outer]
            self.prism("Folded front door", door_outer, door_inner, "paint",
                       bevel=.035, segments=2)
            self.box("Protective rocker", (side*.973,.43,-.03), (.09,.16,1.50),"trim",
                     bevel=.025)
            self.box("Door strike plate", (side*1.005,1.08,-.507),(.027,.12,.26),"trim",
                     bevel=.022)
            self.box("Pressed door pull", (side*1.025,1.094,-.507),(.033,.042,.184),"metal",
                     bevel=.012)
            for z in (.47,-.23):
                self.box("Door hinge block", (side*1.005,.93,z),(.022,.08,.034),"paint",
                         bevel=.007)
            self.box("Step plate", (side*1.064,.26,-.069),(.32,.083,1.43),"trim", bevel=.032)
            for z in [-.63 + .105*i for i in range(12)]:
                self.box("Step grip ridge", (side*1.133,.309,z),(.11,.012,.022),"metal",
                         bevel=.004)
            for axle_z in (-AXLE_Z, AXLE_Z):
                self.wheel_lip(side, axle_z)
            # Pillars are closed tapered sections with measured glazing clearance.
            s = side
            ap = [(s*.973,1.219,.745),(s*.973,1.219,.825),(s*.944,2.09,.61),(s*.944,2.09,.504)]
            self.prism("Splayed A-pillar",ap,[(x-s*.095,y,z) for x,y,z in ap],
                       "cream", bevel=.014, segments=2)
            bp = [(s*.984,1.21,-.72),(s*.984,1.21,-.806),(s*.963,2.108,-.785),(s*.963,2.108,-.893)]
            self.prism("B-pillar", bp, [(x-s*.078,y,z) for x,y,z in bp], "cream", bevel=.016)
            cp = [(s*.978,1.201,-1.878),(s*.978,1.201,-2.033),(s*.959,2.101,-1.979),(s*.959,2.101,-1.845)]
            self.prism("C-pillar", cp, [(x-s*.106,y,z) for x,y,z in cp], "cream", bevel=.019)
            self.box("Beltline trim", (s*1.0,1.24,-.59),(.053,.064,2.65),"cream", bevel=.018)
            self.tube("Rain gutter", (s*.963,2.08,.59),(s*.963,2.08,-1.965),.024,"metal")
            glazing("Front door window",[(s*.944,1.26,.718),(s*.944,1.26,-.717),
                                         (s*.927,2.027,-.775),(s*.927,2.027,.511)],(s*.009,0,0))
            glazing("Quarter window",[(s*.946,1.26,-.801),(s*.946,1.26,-1.886),
                                       (s*.935,2.033,-1.839),(s*.935,2.033,-.891)],(s*.009,0,0))
            self.tube("Mirror stem", (s*.967,1.30,.64),(s*1.186,1.395,.62),.024,"trim")
            self.box("Mirror shell", (s*1.218,1.454,.586),(.245,.173,.123),"trim",
                     bevel=.041, segments=2)
            self.box("Mirror lens", (s*1.218,1.450,.517),(.181,.125,.021),"metal", bevel=.014)
            # Twin short wipers hug the windshield rather than bisecting the view.
            x = s * .43
            self.tube("Wiper arm", (x,1.278,.85),(x+.15,1.401,.815),.013,"trim",sides=8)
            self.tube("Wiper blade", (x+.04,1.398,.817),(x+.32,1.427,.808),.018,"trim",sides=8)

    def nose(self):
        bumper = [(-1.13,.34,2.31),(-.86,.265,2.34),(.86,.265,2.34),(1.13,.34,2.31),
                  (1.13,.49,2.31),(.94,.54,2.34),(-.94,.54,2.34),(-1.13,.49,2.31)]
        self.prism("Tapered bumper", bumper, [(x,y,z-.25) for x,y,z in bumper],
                   "trim", bevel=.033, segments=2)
        self.box("Grille pocket", (0,.942,2.135),(1.29,.344,.049),"trim", bevel=.046, segments=2)
        for z_offset, height, width in ((.009,.858,1.02),(.018,.925,1.105),(.01,.994,1.02)):
            self.box("Horizontal grille fin", (0,height,2.158+z_offset),(width,.042,.045),
                     "metal", bevel=.013)
        self.box("Rover emblem", (0,.958,2.192),(.168,.101,.026),"paint", bevel=.018)
        for x in (-.815,.815):
            self.box("Headlamp optic surround", (x,.984,2.126),(.327,.302,.091),"trim",
                     bevel=.057, segments=2)
            self.box("Upper headlamp optic", (x,1.026,2.181),(.248,.147,.035),"light",
                     bevel=.031, segments=2)
            self.box("Amber running optic", (x,.903,2.182),(.253,.060,.036),"orange",
                     bevel=.019, segments=2)
            self.box("Tow eye mounting plate", (x*.78,.371,2.356),(.142,.147,.043),"metal",
                     bevel=.018)
            loop = [(x*.78+.064*math.cos(TAU*i/16),.267+.073*math.sin(TAU*i/16),2.383)
                    for i in range(16)]
            self.sweep("Front recovery bow", loop,.019,"orange",sides=7,closed=True)
        rack = self.empty("FrontWinch", self.body)
        self.box("Winch bed", (0,.532,2.225),(.81,.087,.33),"metal",rack,bevel=.02)
        self.tube("Winch drum", (-.21,.622,2.233),(.20,.622,2.233),.116,"trim",rack,sides=20)
        for x in (-.238,.238):
            self.tube("Winch drum flange", (x-.021,.622,2.233),(x+.021,.622,2.233),.154,
                      "metal",rack,sides=18)
        windings = [(-.19+.37*i/192,.625+.116*math.cos(TAU*i/16),2.233+.116*math.sin(TAU*i/16))
                    for i in range(193)]
        self.sweep("Wound winch cable", windings,.011,"metal",rack,sides=5)
        self.tube("Winch motor housing", (-.405,.626,2.233),(-.255,.626,2.233),.125,
                  "trim",rack,sides=16)
        self.box("Winch reduction gearbox", (.330,.62,2.233),(.175,.27,.221),"trim",rack,bevel=.04)
        self.box("Winch relay housing", (.330,.794,2.207),(.186,.106,.16),"trim",rack,bevel=.024)
        self.box("Fairlead flange", (0,.47,2.394),(.516,.182,.036),"trim",rack,bevel=.027)
        for y in (.427,.513):
            self.tube("Solid fairlead roller", (-.215,y,2.432),(.215,y,2.432),.026,"metal",rack)
        for x in (-.231,.231):
            self.tube("Fairlead corner roller", (x,.415,2.431),(x,.524,2.431),.026,"metal",rack)
        self.empty("WinchOutlet", self.body, (0,.47,2.45))
        self.sweep("Recovery hook",[(0,.47,2.459),(0,.416,2.505),(0,.350,2.497),
                                    (0,.339,2.45),(0,.38,2.425)],.024,"orange",rack,sides=8)

    def tire(self, pivot, side, spare=False):
        # Shaped sidewalls, shoulder radius and inner bead instead of a solid cylinder.
        carcass = [(-.191,.309),(-.215,.413),(-.201,.513),(-.168,.580),(-.126,.609),
                   (.126,.609),(.168,.580),(.201,.513),(.215,.413),(.191,.309),
                   (.135,.307),(.097,.385),(-.097,.385),(-.135,.307)]
        self.turned("Molded tire casing",carcass,"black",pivot,sides=32)
        rim = [(-.175,.210),(-.197,.277),(-.187,.314),(-.162,.333),(-.113,.335),
               (.113,.335),(.162,.333),(.187,.314),(.197,.277),(.175,.210),(.10,.196),(-.10,.196)]
        self.turned("Pressed steel wheel",rim,"cream",pivot,sides=24)
        self.tube("Recessed rim centre", (-.175,0,0),(.175,0,0),.252,"cream",pivot,sides=24)
        self.tube("Locking hub", (side*.168,0,0),(side*.25,0,0),.116,"metal",pivot,sides=16)
        self.tube("Hub face", (side*.249,0,0),(side*.264,0,0),.08,"trim",pivot,sides=12)
        for i in range(6):
            angle = TAU*i/6
            y, z = .164*math.cos(angle), .164*math.sin(angle)
            self.tube("Hexagonal wheel nut", (side*.177,y,z),(side*.209,y,z),
                      .026,"metal",pivot,sides=6)
            y, z = .242*math.cos(angle+.26), .242*math.sin(angle+.26)
            self.tube("Recessed wheel vent", (side*.176,y,z),(side*.184,y,z),
                      .033,"trim",pivot,sides=10)
        # Use one tread mesh. Its final radius is set by the ride envelope below.
        vertices, faces = [], []
        tread_rows = 24 if not spare else 20
        for i in range(tread_rows):
            base_angle = TAU*i/tread_rows
            for sign in (-1, 1):
                corners = [(sign*x,base_angle+theta) for x,theta in
                           ((.022,-.078),(.154,-.022),(.183,.068),(.052,.036))]
                start = len(vertices)
                for outer in (False,True):
                    for x, a in corners:
                        radius = (TREAD_DESIGN_RADIUS if abs(x)<.155 else .606) if outer else (.589 if abs(x)<.155 else .566)
                        vertices.append((x,radius*math.cos(a),radius*math.sin(a)))
                faces.extend(tuple(start+index for index in face) for face in
                             ((0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)))
        self.mesh("Directional all-terrain tread",vertices,faces,"black",pivot)

    def rear(self):
        self.box("Back bumper",(0,.329,-2.137),(2.21,.212,.29),"trim",bevel=.046,segments=2)
        self.box("Rear top tread plate",(0,.447,-2.112),(1.58,.032,.196),"metal",bevel=.013)
        self.box("Rear receiver hitch",(0,.212,-2.22),(.176,.151,.19),"trim",bevel=.014)
        self.box("Rear recovery tongue",(0,.195,-2.32),(.116,.092,.124),"metal",bevel=.015)
        rear_eye = [(.052 * math.cos(TAU * i / 16),
                     .196 + .048 * math.sin(TAU * i / 16), -2.397)
                    for i in range(16)]
        self.sweep("Rear recovery bow", rear_eye, .015, "orange", sides=7, closed=True)
        self.empty("RearWinchOutlet", self.body, (0, .196, -2.414))
        for x in (-.861,.861):
            self.box("Tail lamp inset",(x,.943,-2.103),(.208,.41,.068),"trim",bevel=.034)
            self.box("Stop lamp optic",(x,.995,-2.146),(.148,.17,.033),"red",bevel=.018)
            self.box("Reverse lamp optic",(x,.862,-2.146),(.148,.059,.033),"light",bevel=.013)
            self.box("Rear hinge",(x,.705,-2.107),(.162,.061,.072),"metal",bevel=.012)
        self.box("Liftgate latch",(-.37,1.193,-2.109),(.208,.061,.036),"metal",bevel=.013)
        self.box("Spare carrier arm",(.32,1.052,-2.136),(.63,.121,.223),"trim",bevel=.023)
        spare = self.empty("SpareWheel",self.body,(.365,1.028,-2.213))
        spare.rotation_euler.z = -math.pi/2
        self.tire(spare,-1,spare=True)
        aux = self.empty("RecoveryKit",self.body)
        self.box("Fuel carrier",(-.63,.756,-2.159),(.48,.152,.277),"trim",aux,bevel=.022)
        self.box("Stamped reserve can",(-.63,1.017,-2.182),(.407,.494,.192),"green",aux,
                 bevel=.051,segments=2)
        self.box("Reserve can retention strap",(-.63,1.035,-2.286),(.07,.48,.028),"trim",aux,
                 bevel=.012)
        for x in (-.755,-.505):
            self.box("Can handle bracket",(x,1.267,-2.181),(.047,.106,.084),"green",aux,
                     bevel=.014)
        self.tube("Reserve can carry handle",(-.755,1.315,-2.181),(-.505,1.315,-2.181),
                  .025,"green",aux)
        self.tube("Fuel filler cap",(-.495,1.234,-2.225),(-.495,1.283,-2.225),.043,
                  "metal",aux,sides=12)

    def roof_load(self):
        rack = self.empty("RoofRack",self.body)
        for x in (-.753,.753):
            for z in (-1.63,.371):
                self.box("Rail foot",(x,2.235,z),(.128,.129,.14),"trim",rack,bevel=.018)
            bent = [(x,2.266,.506),(x,2.375,.464),(x,2.418,.343),
                    (x,2.418,-1.66),(x,2.356,-1.805)]
            self.sweep("Roof rail",bent,.034,"trim",rack)
        for z in (.33,-.107,-.62,-1.10,-1.58):
            self.box("Rack crossbar",(0,2.35,z),(1.54,.066,.105),"metal",rack,bevel=.02)
        self.box("Dust sealed case",(.36,2.501,-.38),(.53,.252,1.08),"trim",rack,
                 bevel=.05,segments=2)
        self.box("Case lid",(.36,2.636,-.38),(.55,.065,1.11),"green",rack,
                 bevel=.033,segments=2)
        for z in (-.78,.012):
            self.box("Lid catches",(.64,2.574,z),(.05,.091,.084),"metal",rack,bevel=.009)
        self.box("Canvas recovery bag",(-.348,2.501,-.65),(.56,.282,1.26),"seat",rack,
                 bevel=.10,segments=3)
        for z in (-.95,-.36):
            self.box("Compression strap top",(-.348,2.644,z),(.575,.026,.061),"trim",rack,bevel=.007)
            self.box("Compression strap buckle",(-.145,2.663,z),(.107,.025,.085),"metal",rack,
                     bevel=.014)
            for x in (-.626,-.071):
                self.box("Compression strap side",(x,2.493,z),(.024,.256,.061),"trim",rack,
                         bevel=.006)
        for x in (-.56,-.45):
            self.box("Traction board spine",(x,2.361,-.62),(.104,.045,1.17),"orange",rack,
                     bevel=.012)

    def build(self):
        self.build_chassis()
        self.shell()
        self.nose()
        self.rear()
        self.roof_load()
        for end, z in (("F",AXLE_Z),("R",-AXLE_Z)):
            for side, label in ((-1,"L"),(1,"R")):
                pivot = self.empty(f"Wheel_{end}{label}",self.root,(side*HALF_TRACK,0,z))
                self.tire(pivot,side)
        if str(SOURCE) not in sys.path:
            sys.path.insert(0,str(SOURCE))
        from cabin import add_cabin
        cockpit = add_cabin(self.body, self.mat)
        self.empty("DriverEye", self.body, cockpit["driver_camera"])
        bake_ride_envelope()
        verify_ride_envelope(self.body)


def shell_envelope(point, roof_load=False):
    """Map a design point in Blender axes into the finished shell and cargo."""
    x, longitudinal, height = point
    if roof_load:
        height = 2.20 + (height - 2.20) * .52
    # Leave the chassis and its lowest points intact. Lower the hood and roof
    # above the frame while carrying the cabin, window openings and pillars along.
    if height > .16:
        height = .16 + (height - .16) * .76
    if abs(longitudinal) > AXLE_Z:
        excess = (abs(longitudinal) - AXLE_Z) * .78
        longitudinal = math.copysign(AXLE_Z + excess, longitudinal)
    return Vector((x * BODY_WIDTH_FACTOR, longitudinal, height))


def owning_part(obj):
    while obj:
        if obj.name.startswith("Wheel_") or obj.name in ("SpareWheel", "RoofRack"):
            return obj
        obj = obj.parent
    return None


def bake_ride_envelope():
    """Shape the body and wheels separately while retaining rigid animation pivots."""
    bpy.context.view_layer.update()
    objects = list(bpy.context.scene.objects)
    original = {obj: obj.matrix_world.copy() for obj in objects}
    inverse = {obj: matrix.inverted() for obj, matrix in original.items()}
    owners = {obj: owning_part(obj) for obj in objects}
    adjusted = {}

    def remap(obj, point):
        part = owners[obj]
        if part is None or part.name == "RoofRack":
            return shell_envelope(point, roof_load=part is not None)
        # Work in the wheel's own frame so even the rear-mounted spare stays round.
        center = shell_envelope(original[part].translation)
        axis_point = inverse[part] @ point
        radial_scale = WHEEL_RADIUS / TREAD_DESIGN_RADIUS
        axis_point.x *= .73
        axis_point.y *= radial_scale
        axis_point.z *= radial_scale
        return center + original[part].to_3x3() @ axis_point

    for obj, matrix in original.items():
        transform = matrix.copy()
        transform.translation = remap(obj, matrix.translation)
        adjusted[obj] = transform
        if obj.type == "MESH":
            to_local = transform.inverted()
            for vertex in obj.data.vertices:
                vertex.co = to_local @ remap(obj, matrix @ vertex.co)
            obj.data.update()

    for obj, matrix in adjusted.items():
        obj.matrix_parent_inverse = Matrix.Identity(4)
        obj.matrix_basis = adjusted[obj.parent].inverted() @ matrix if obj.parent else matrix
    bpy.context.view_layer.update()


def verify_ride_envelope(body):
    for axle, longitudinal in (("F", -AXLE_Z), ("R", AXLE_Z)):
        for label, side in (("L", -1), ("R", 1)):
            pivot = bpy.data.objects[f"Wheel_{axle}{label}"]
            expected = Vector((side * TRACK_HALF_WIDTH, longitudinal, 0))
            if (pivot.matrix_world.translation - expected).length > 1e-5:
                raise ValueError(f"{pivot.name}: wheel pivot does not match suspension")
            tread = next(child for child in pivot.children
                         if child.name.startswith("Directional all-terrain tread"))
            to_wheel = pivot.matrix_world.inverted() @ tread.matrix_world
            radius = max(math.hypot(local.y, local.z)
                         for vertex in tread.data.vertices
                         for local in (to_wheel @ vertex.co,))
            if abs(radius - WHEEL_RADIUS) > 1e-5:
                raise ValueError(f"{pivot.name}: tread radius {radius} differs from physics")
    eye = bpy.data.objects["DriverEye"].matrix_world.translation
    expected_eye = Vector((.423, .45, 1.2392))
    if (eye - expected_eye).length > 1e-5:
        raise ValueError("DriverEye does not match the Godot cockpit camera")
    body["driver_eye_game_m"] = (eye.x, eye.z, -eye.y)


def summarize(objects):
    graph = bpy.context.evaluated_depsgraph_get()
    sum_triangles, sum_meshes = 0, 0
    bounds = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        evaluated = obj.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        sum_triangles += len(mesh.loop_triangles)
        sum_meshes += 1
        bounds.extend(evaluated.matrix_world @ Vector(v) for v in evaluated.bound_box)
        evaluated.to_mesh_clear()
    spans = [round(max(v[i] for v in bounds) - min(v[i] for v in bounds),3) for i in (0,1,2)]
    return {"mesh_count":sum_meshes,"triangle_count":sum_triangles,"width_length_height_m":spans}


def compact_meshes():
    """Bake and join render parts by animated parent and material after source save."""
    pivots = {"Body", "SteeringWheel", "SpeedNeedle", "RPMNeedle", "SpareWheel"}
    pivots.update(f"{kind}_{suffix}" for kind in ("Wheel", "ShockRod")
                  for suffix in ("FL", "FR", "RL", "RR"))
    groups = {}
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH" or not obj.data.materials:
            continue
        select_only([obj])
        if len(obj.modifiers):
            bpy.ops.object.convert(target="MESH")
            obj = bpy.context.object
        parent = obj.parent
        while parent and parent.name not in pivots:
            parent = parent.parent
        if parent and parent != obj.parent:
            rest_transform = obj.matrix_world.copy()
            obj.parent = parent
            obj.matrix_world = rest_transform
        # Multi-material parts keep their material-index assignments as separate meshes.
        if len(obj.data.materials) == 1:
            key = (obj.parent, obj.data.materials[0])
            groups.setdefault(key,[]).append(obj)
    for (parent, material), objects in groups.items():
        if len(objects) > 1:
            select_only(objects)
            bpy.ops.object.join()
            objects[0].name = f"{parent.name if parent else 'Rover'} · {material.name}"


def studio_preview(path):
    """Render an angled catalogue view with controlled soft light and real shadow."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 26
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 5
    scene.render.resolution_x = 900
    scene.render.resolution_y = 780
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    world = bpy.data.worlds.new("Studio reflection")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (.56,.63,.68,1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = .3
    scene.world = world

    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-WHEEL_RADIUS-.004))
    ground = bpy.context.object
    ground.data.materials.append(material("Preview cyclorama","39493E",.84))

    def area(name, position, target, power, size, color):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = power
        data.shape = "DISK"
        data.size = size
        data.color = color
        obj = bpy.data.objects.new(name,data)
        scene.collection.objects.link(obj)
        obj.location = blender_point(position)
        obj.rotation_euler = (blender_point(target)-obj.location).to_track_quat("-Z","Y").to_euler()

    area("Large warm window", (3.2,5.8,4.4),(0,.6,0),1700,5.0,(1,.86,.67))
    area("Cool bounce", (-3.9,3.1,4.7),(0,.9,0),800,4.0,(.75,.90,1))
    area("Roof and tire edge", (-3.0,4.7,-4.7),(0,1.0,0),1800,3.4,(.91,.97,1))
    data = bpy.data.cameras.new("Expedition profile")
    cam = bpy.data.objects.new("Expedition profile",data)
    scene.collection.objects.link(cam)
    cam.location = blender_point((6.2,3.13,7.5))
    cam.rotation_euler = (blender_point((0,.64,.04))-cam.location).to_track_quat("-Z","Y").to_euler()
    data.type = "ORTHO"
    data.ortho_scale = 5.82
    scene.camera = cam
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir",type=Path,help="Build isolated assets in this directory")
    parser.add_argument("--preview",action="store_true",help="Also render the project-card image")
    options = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1
    bpy.context.preferences.filepaths.save_version = 0
    rover = Rover()
    rover.build()

    assets = options.output_dir or SOURCE.parent.parent/"ridgebound"/"assets"
    source_output = options.output_dir or SOURCE
    assets.mkdir(parents=True,exist_ok=True)
    blend = source_output/"ridge-rover.blend"
    glb = assets/"ridge-rover.glb"
    select_only([rover.body])
    bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True)

    compact_meshes()
    report = summarize(bpy.context.scene.objects)
    result = bpy.ops.export_scene.gltf(filepath=str(glb),export_format="GLB",
                                       export_yup=True,export_extras=True,export_apply=True,
                                       export_animations=False,export_cameras=False,
                                       export_lights=False)
    if result != {"FINISHED"}:
        raise RuntimeError(f"glTF exporter returned {result}")
    if options.output_dir is None:
        shutil.copyfile(glb,SOURCE/"godot"/"assets"/glb.name)
    if options.preview:
        studio_preview(assets/"vehicle-preview.png")
    report.update({"bytes":glb.stat().st_size,"blender":bpy.app.version_string})
    print("RIDGE_ROVER_MODEL",json.dumps(report,sort_keys=True))


if __name__ == "__main__":
    main()
