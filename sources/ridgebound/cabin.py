"""Editable left-hand-drive cockpit for the Ridgebound expedition vehicle.

Dimensions are in metres. Game +X is the driver's side, +Y is up, +Z is
forward. Blender stores the same points as (x, -z, y).
"""
from math import cos, pi, radians, sin

import bmesh
import bpy
from mathutils import Matrix, Vector


DRIVER_EYE = (0.47, 1.58, -0.45)


def _blender_position(position):
    x, y, z = position
    return x, -z, y


class _CabinBuilder:
    def __init__(self, body, materials):
        self.collection = body.users_collection[0]
        self.materials = materials
        self.root = self.mount("Cabin", body, (0, 0, 0))

    def mount(self, name, parent, position):
        obj = bpy.data.objects.new(name, None)
        self.collection.objects.link(obj)
        obj.parent = parent
        obj.location = position
        obj.empty_display_size = 0.04
        return obj

    def facing_mount(self, name, position, tilt=0):
        obj = self.mount(name, self.root, _blender_position(position))
        # Local X reads right, Y reads up, and Z points at the driver.
        # The moving child rotates around Z in Blender and Y in Godot.
        obj.rotation_euler = Matrix((
            (-1, 0, 0),
            (0, -sin(tilt), cos(tilt)),
            (0, cos(tilt), sin(tilt)),
        )).to_euler()
        return obj

    def mesh(self, name, vertices, faces, material, parent, position=(0, 0, 0)):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        mesh.materials.append(self.materials[material])
        obj = bpy.data.objects.new(name, mesh)
        self.collection.objects.link(obj)
        obj.parent = parent
        obj.location = position
        return obj

    def rectangle(self, name, parent, position, dimensions, material, bevel=0):
        bm = bmesh.new()
        try:
            bmesh.ops.create_cube(bm, size=1)
            for vertex in bm.verts:
                for axis in range(3):
                    vertex.co[axis] *= dimensions[axis]
            if bevel:
                bmesh.ops.bevel(
                    bm, geom=list(bm.edges), offset=bevel, segments=2,
                    affect="EDGES", clamp_overlap=True,
                )
            mesh = bpy.data.meshes.new(name)
            bm.to_mesh(mesh)
            mesh.update()
        finally:
            bm.free()
        mesh.materials.append(self.materials[material])
        obj = bpy.data.objects.new(name, mesh)
        self.collection.objects.link(obj)
        obj.parent = parent
        obj.location = position
        return obj

    def box(self, name, position, dimensions, material, bevel=0):
        width, height, length = dimensions
        return self.rectangle(
            name, self.root, _blender_position(position),
            (width, length, height), material, bevel,
        )

    def disk(self, name, parent, position, radius, depth, material, sides=24):
        vertices = [
            (radius * cos(2 * pi * i / sides), radius * sin(2 * pi * i / sides), z)
            for z in (-depth / 2, depth / 2) for i in range(sides)
        ]
        faces = [tuple(reversed(range(sides))), tuple(range(sides, 2 * sides))]
        faces.extend(
            (i, (i + 1) % sides, sides + (i + 1) % sides, sides + i)
            for i in range(sides)
        )
        obj = self.mesh(name, vertices, faces, material, parent, position)
        for polygon in list(obj.data.polygons)[2:]:
            polygon.use_smooth = True
        return obj

    def rod(self, name, a, b, radius, material):
        start, end = Vector(_blender_position(a)), Vector(_blender_position(b))
        direction = end - start
        obj = self.disk(name, self.root, (start + end) * 0.5, radius, direction.length, material, 10)
        obj.rotation_mode = "QUATERNION"
        obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
        return obj

    def label(self, name, text, mount, position, size, material="cream"):
        font = bpy.data.curves.new(name, "FONT")
        font.body = text
        font.align_x = "CENTER"
        font.align_y = "CENTER"
        font.size = size
        font.resolution_u = 2
        obj = bpy.data.objects.new(name, font)
        self.collection.objects.link(obj)
        # Bake readable face lettering while keeping the source's clean part hierarchy.
        bpy.context.view_layer.update()
        mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.curves.remove(font)
        mesh.materials.append(self.materials[material])
        obj = bpy.data.objects.new(name, mesh)
        self.collection.objects.link(obj)
        obj.parent = mount
        obj.location = position
        return obj

    def seats_and_floor(self):
        self.box("Fitted rubber liner", (0, .435, -.26), (1.75, .034, 2.02), "black", .01)
        self.box("Transmission tunnel", (0, .56, -.05), (.26, .22, 1.4), "trim", .037)
        for center, occupant in ((.47, "Driver"), (-.47, "Passenger")):
            for offset in (-.23, .23):
                self.box(occupant + " seat rail", (center + offset, .475, -.50), (.07, .065, .78), "metal", .006)
            self.box(occupant + " seat frame", (center, .56, -.52), (.67, .13, .71), "black", .02)
            self.box(occupant + " canvas cushion", (center, .675, -.45), (.66, .16, .72), "seat", .045)
            self.box(occupant + " cushion inset", (center, .755, -.44), (.42, .024, .58), "green", .01)
            for offset in (-.265, .265):
                self.box(occupant + " side bolster", (center + offset, .75, -.45), (.13, .11, .60), "seat", .031)
            backrest = self.box(occupant + " reclined backrest", (center, 1.10, -.91), (.66, .77, .15), "seat", .046)
            backrest.rotation_euler.x = radians(-9)
            inset = self.box(occupant + " backrest canvas inset", (center, 1.105, -.828), (.44, .57, .022), "green", .009)
            inset.rotation_euler.x = backrest.rotation_euler.x
            for y in (.91, 1.02, 1.13, 1.24):
                self.box(occupant + " lumbar seam", (center, y, -.827 - (y - 1.105) * .156), (.40, .006, .012), "trim")
            for offset in (-.13, .13):
                self.rod(occupant + " head restraint post", (center + offset, 1.38, -.96),
                         (center + offset, 1.59, -.98), .012, "metal")
            self.box(occupant + " head restraint", (center, 1.605, -.98), (.42, .22, .15), "seat", .041)
            buckle_x = center - (.35 if center > 0 else -.35)
            self.box(occupant + " belt buckle", (buckle_x, .71, -.56), (.058, .15, .074), "black", .01)
            self.box(occupant + " belt release", (buckle_x, .788, -.56), (.043, .012, .049), "red", .003)
            self.box(occupant + " heel pad", (center, .466, .25), (.56, .027, .48), "trim", .008)
            for z in (.09, .16, .23, .30, .37, .44):
                self.box(occupant + " heel pad ridge", (center, .485, z), (.51, .016, .017), "black", .004)

    def dashboard(self):
        # Low cowl with a shallow curved top, leaving a clear windshield from DRIVER_EYE.
        sections = [(-.91, 1.245), (-.71, 1.273), (-.26, 1.277), (.26, 1.29), (.71, 1.284), (.91, 1.247)]
        vertices = []
        for x, top in sections:
            vertices.extend(_blender_position((x, y, z)) for y, z in (
                (.98, .75), (.96, .53), (1.07, .427),
                (top - .047, .433), (top, .515), (top - .026, .788),
            ))
        faces = [tuple(reversed(range(6)))]
        for i in range(len(sections) - 1):
            left, right = i * 6, (i + 1) * 6
            faces.extend((left+j, left+(j+1)%6, right+(j+1)%6, right+j) for j in range(6))
        faces.append(tuple(range(len(vertices) - 6, len(vertices))))
        # Recalculate topology normals independent of cross-section point order.
        fascia = self.mesh("Continuous molded dashboard shell", vertices, faces, "trim", self.root)
        bm = bmesh.new()
        try:
            bm.from_mesh(fascia.data)
            bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
            bm.to_mesh(fascia.data)
        finally:
            bm.free()
        board = self.facing_mount("Twin instrument face", (.48, 1.216, .416), radians(9))
        self.rectangle("Instrument binnacle housing", board, (0, 0, -.026), (.706, .305, .083), "black", .036)
        self.rectangle("Inset instrument faceplate", board, (0, 0, .015), (.654, .262, .018), "trim", .018)
        self.gauge(board, "Speed", -.136, .12, "km/h", ("0", "18", "36", "54", "72"))
        self.gauge(board, "RPM", .147, .111, "x1000", ("0", "1.5", "3", "4.5", "6"))
        fascia_panel = self.facing_mount("Passenger dashboard panel", (-.505, 1.089, .418), radians(7))
        self.rectangle("Recessed glovebox surround", fascia_panel, (0, 0, 0), (.62, .177, .036), "black", .015)
        self.rectangle("Pressed copper glovebox", fascia_panel, (0, 0, .019), (.574, .148, .018), "paint", .01)
        self.rectangle("Glovebox recessed latch", fascia_panel, (0, .044, .031), (.105, .025, .012), "black", .006)
        self.label("Ridgebound dashboard badge", "RIDGEBOUND", fascia_panel, (0, -.032, .029), .036)
        self.rod("Passenger grab handle", (-.77, 1.231, .379), (-.27, 1.231, .379), .021, "black")
        for x in (-.77, -.27):
            self.rod("Grab rail fixing", (x, 1.231, .379), (x, 1.231, .46), .019, "metal")
        for x in (-.845, -.235, .876):
            vent = self.facing_mount("Air outlet", (x, 1.159, .415), radians(8))
            self.rectangle("Recessed outlet rim", vent, (0, 0, 0), (.103, .11, .042), "black", .009)
            for y in (-.035, -.012, .011, .034):
                self.rectangle("Outlet vane", vent, (0, y, .024), (.079, .009, .009), "metal", .002)

    def gauge(self, board, name, center, radius, units, numbers):
        dial = self.mount(name + " gauge housing", board, (center, 0, .029))
        self.disk(name + " brushed bezel", dial, (0, 0, 0), radius, .018, "metal", 36)
        self.disk(name + " matte dial", dial, (0, 0, .009), radius * .923, .006, "black", 36)
        # Labels use the same clockwise arc as the in-game negative needle angle.
        for index in range(17):
            angle = radians(224) - index * radians(252) / 16
            major = index % 4 == 0
            distance = radius * .826
            tick = self.rectangle(name + " graduation", dial,
                                  (cos(angle) * distance, sin(angle) * distance, .014),
                                  (.016 if major else .009, .0048 if major else .0028, .0025),
                                  "cream" if name == "Speed" or index < 14 else "red")
            tick.rotation_euler.z = angle
        for index, numeral in enumerate(numbers):
            angle = radians(224) - index * radians(252) / 4
            distance = radius * .63
            self.label(name + " scale " + numeral, numeral, dial,
                       (cos(angle) * distance, sin(angle) * distance, .015), .021)
        self.label(name + " units", units, dial, (0, -.060, .015), .020)
        needle = self.mount(name + "Needle", dial, (0, 0, .021))
        # Bake the zero mark into the blade so the animation can set the whole pivot rotation.
        angle = radians(224)
        blade = self.rectangle(name + " pointer", needle,
                               (cos(angle) * .034, sin(angle) * .034, 0),
                               (radius * .93, .007, .005), "orange", .001)
        blade.rotation_euler.z = angle
        self.disk(name + " pointer cap", needle, (0, 0, .003), .014, .009, "black", 14)

    def steering_wheel(self):
        mount = self.facing_mount("Steering column mount", (.47, 1.10, .152), radians(24))
        wheel = self.mount("SteeringWheel", mount, (0, 0, 0))
        self.rod("Steering column tube", (.47, 1.10, .155), (.47, .995, .557), .054, "black")
        # Sweep a leather rim with a slightly flat lower section.
        vertices = []
        hoop_count, section_count = 36, 8
        for i in range(hoop_count):
            angle = 2 * pi * i / hoop_count
            x, y = cos(angle), sin(angle)
            for j in range(section_count):
                profile = 2 * pi * j / section_count
                radius = .207 + .021 * cos(profile)
                vertices.append((x * radius, max(-.184, y * .207) + y * .021 * cos(profile),
                                 .021 * sin(profile)))
        faces = [
            (i * section_count + j, ((i+1) % hoop_count) * section_count + j,
             ((i+1) % hoop_count) * section_count + (j+1) % section_count,
             i * section_count + (j+1) % section_count)
            for i in range(hoop_count) for j in range(section_count)
        ]
        rim = self.mesh("Leather steering rim", vertices, faces, "black", wheel)
        for face in rim.data.polygons:
            face.use_smooth = True
        for angle in (radians(12), radians(168), radians(270)):
            spoke = self.rectangle("Machined steering spoke", wheel,
                                   (.119 * cos(angle), .119 * sin(angle), -.009),
                                   (.166, .036, .020), "metal", .007)
            spoke.rotation_euler.z = angle
        self.disk("Horn hub", wheel, (0, 0, .003), .076, .047, "trim")
        self.disk("Enamel steering badge", wheel, (0, 0, .031), .040, .014, "paint", 20)
        self.label("Steering monogram", "RB", wheel, (0, 0, .039), .034)
        return wheel

    def center_controls(self):
        radio = self.facing_mount("Expedition radio panel", (-.085, 1.052, .421), radians(12))
        self.rectangle("Radio metal housing", radio, (0, 0, 0), (.246, .141, .07), "black", .011)
        self.rectangle("Radio amber display", radio, (0, .033, .037), (.194, .044, .008), "orange", .004)
        self.label("Radio channel readout", "CH 04", radio, (0, .033, .042), .027, "black")
        for x in (-.078, .078):
            self.disk("Knurled radio dial", radio, (x, -.033, .046), .024, .025, "metal", 12)
        for x in (-.034, 0, .034):
            self.rectangle("Radio preset key", radio, (x, -.033, .041), (.020, .014, .012), "trim", .003)
        self.box("Center stack support", (-.04, .829, .542), (.326, .397, .249), "trim", .024)
        switches = self.facing_mount("Transfer case controls", (0, .877, .416), radians(15))
        self.rectangle("Auxiliary switch plate", switches, (0, 0, 0), (.29, .127, .045), "trim", .01)
        for x, name, color in ((-.09, "4WD", "green"), (0, "LOW", "orange"), (.09, "WINCH", "red")):
            self.rectangle(name + " switch guard", switches, (x, .021, .026), (.055, .043, .008), "black", .005)
            self.rectangle(name + " rocker", switches, (x, .017, .033), (.034, .031, .014), "metal", .003)
            self.disk(name + " lamp", switches, (x, .043, .022), .008, .01, color, 10)
            self.label(name + " panel label", name, switches, (x, -.025, .024), .018)
        self.box("Shift boot", (0, .696, -.105), (.20, .104, .24), "black", .036)
        self.rod("Curved gear shift lower", (0, .71, -.105), (0, .892, -.105), .018, "metal")
        self.rod("Curved gear shift upper", (0, .889, -.105), (0, .976, -.164), .018, "metal")
        self.box("Gear shift handle", (0, .981, -.166), (.094, .059, .081), "trim", .019)
        self.rod("Transfer selector shaft", (-.167, .64, -.087), (-.195, .818, -.157), .012, "metal")
        self.box("Transfer selector knob", (-.195, .83, -.165), (.07, .045, .062), "black", .015)
        for x, width, name in ((.676, .083, "Clutch"), (.493, .119, "Brake"), (.315, .073, "Throttle")):
            pedal = self.facing_mount(name + " mounting plate", (x, .536, .444), radians(18))
            self.rod(name + " pivot arm", (x, .748, .555), (x, .541, .449), .014, "metal")
            self.rectangle(name + " rubber pedal pad", pedal, (0, 0, 0), (width, .125, .031), "black", .007)
            for y in (-.042, -.014, .014, .042):
                self.rectangle(name + " grip strip", pedal, (0, y, .017),
                               (width * .8, .008, .006), "trim", .001)

    def door_details(self):
        for side, name in ((1, "Driver"), (-1, "Passenger")):
            self.box(name + " stitched door card", (side * .923, .861, -.072), (.058, .455, 1.32), "trim", .023)
            self.box(name + " canvas door insert", (side * .890, .906, -.082), (.039, .255, 1.04), "seat", .015)
            self.box(name + " padded armrest", (side * .845, 1.001, -.185), (.135, .071, .49), "black", .022)
            self.box(name + " latch surround", (side * .864, 1.083, .303), (.057, .081, .172), "black", .011)
            self.box(name + " interior latch", (side * .831, 1.083, .303), (.025, .038, .137), "metal", .006)
            self.box(name + " map pocket", (side * .852, .666, -.218), (.117, .135, .56), "black", .024)
        self.rod("Rear-view mirror stem", (0, 2.034, .545), (0, 1.923, .499), .017, "black")
        self.box("Rear-view mirror shell", (0, 1.907, .48), (.341, .111, .054), "black", .017)
        self.box("Rear-view mirror plate", (0, 1.907, .447), (.300, .075, .011), "metal", .006)
        for x in (-.48, .48):
            self.box("Folded sun visor", (x, 2.035, .390), (.57, .041, .182), "cream", .014)


def add_cabin(body_parent, materials):
    cabin = _CabinBuilder(body_parent, materials)
    cabin.seats_and_floor()
    cabin.dashboard()
    wheel = cabin.steering_wheel()
    cabin.center_controls()
    cabin.door_details()
    return {
        "steering": wheel,
        "driver_camera": DRIVER_EYE,
        "steering_axis": "local Z",
        "gauge_axis": "local Z",
    }
