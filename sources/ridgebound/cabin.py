"""Original LEFT HAND DRIVE Ridgebound cockpit, built in Blender.

The vehicle faces game +Z, so screen-left is game +X from the driver seat.
Cabin authoring positions are reflected into that left-hand-drive layout without
negative mesh scales; text glyphs and face winding remain unchanged.
SteeringWheel/SpeedNeedle/RPMNeedle are animatable pivots under fixed mounts.
"""
import bpy
import math
from mathutils import Matrix


def add_cabin(bodyParent, materials):
    m = materials
    def game(p):
        # Reposition cabin parts across X only. This does not mirror their mesh data,
        # preserving readable gauge text, normals and positive object scales.
        return (-p[0], -p[2], p[1])
    def finish(obj, name, material, parent=bodyParent):
        obj.name = name
        obj.parent = parent
        if material:
            obj.data.materials.append(material)
        return obj
    def cube(name, p, size, material, bevel=0):
        bpy.ops.mesh.primitive_cube_add(size=1, location=game(p))
        o = finish(bpy.context.object, name, material)
        o.dimensions = (size[0], size[2], size[1])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        if bevel:
            mod = o.modifiers.new('Soft manufactured edges', 'BEVEL')
            mod.width = bevel
            mod.segments = 1
            mod.affect = 'EDGES'
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=mod.name)
        return o
    def cylinder(name, p, radius, depth, material, vertices=20):
        bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=game(p), rotation=(math.pi/2, 0, 0))
        return finish(bpy.context.object, name, material)
    def sphere(name, p, scale, material):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=1, location=game(p))
        o=finish(bpy.context.object,name,material)
        o.scale=(scale[0],scale[2],scale[1])
        return o
    def empty(name, parent, loc=(0,0,0), rotation=(0,0,0)):
        o=bpy.data.objects.new(name,None)
        bpy.context.collection.objects.link(o)
        o.parent=parent
        o.location=loc
        o.rotation_euler=rotation
        return o
    def local_cube(name, parent, p, size, material):
        bpy.ops.mesh.primitive_cube_add(size=1)
        o=finish(bpy.context.object,name,material,parent)
        o.location=p
        o.dimensions=size
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        return o
    def label(name, text, p, size=.034, material=None):
        curve=bpy.data.curves.new(name, 'FONT')
        curve.body=text
        curve.align_x='CENTER'
        curve.align_y='CENTER'
        curve.size=size
        curve.extrude=0
        curve.resolution_u=2
        obj=bpy.data.objects.new(name,curve)
        bpy.context.collection.objects.link(obj)
        obj.parent=bodyParent
        obj.location=game(p)
        obj.rotation_euler=Matrix(((-1,0,0),(0,0,1),(0,1,0))).to_euler()
        obj.data.materials.append(material or m['cream'])
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target='MESH')
        return obj

    # Open footwell, individual seats and fabric inserts; no solid block in the cabin.
    cube('Rubber cabin floor',(0,.39,-.46),(1.78,.07,2.45),m['black'])
    cube('Transmission tunnel',(0,.53,-.10),(.29,.26,1.35),m['trim'],.035)
    for x,side in [(-.49,'Driver'),(.49,'Passenger')]:
        cube(side+' seat pedestal',(x,.53,-.44),(.64,.24,.65),m['black'],.03)
        cube(side+' seat cushion',(x,.69,-.37),(.75,.17,.78),m['seat'],.055)
        cube(side+' cushion insert',(x,.785,-.37),(.53,.025,.61),m['trim'],.012)
        cube(side+' seat back',(x,1.11,-.78),(.75,.92,.16),m['seat'],.045)
        cube(side+' back insert',(x,1.12,-.682),(.53,.65,.022),m['trim'],.015)
        for z in [-.58,-.40,-.22]:
            cube(side+' cushion stitch',(x,.801,z),(.49,.012,.009),m['black'])
        for y in [.9,1.08,1.26]:
            cube(side+' back stitch',(x,y,-.667),(.50,.009,.008),m['black'])
        for xx in [x-.18,x+.18]:
            cube(side+' headrest rail',(xx,1.58,-.78),(.025,.18,.025),m['metal'])
        cube(side+' headrest',(x,1.72,-.78),(.48,.28,.18),m['seat'],.035)
        cube(side+' belt clasp',(x+(.40 if x<0 else -.40),.75,-.42),(.08,.13,.09),m['black'],.01)
        cube(side+' belt button',(x+(.40 if x<0 else -.40),.824,-.42),(.055,.012,.055),m['red'])
    cube('Rear bench cushion',(0,.67,-1.39),(1.60,.18,.46),m['seat'],.04)
    cube('Rear bench back',(0,1.00,-1.69),(1.60,.65,.12),m['seat'],.04)

    # Padded top, painted metal fascia, center switches and passenger grab bar.
    cube('Dashboard structure',(0,1.06,.62),(1.87,.34,.34),m['trim'],.045)
    cube('Dashboard padded top',(0,1.245,.60),(1.90,.085,.37),m['black'],.025)
    cube('Instrument binnacle',(-.46,1.12,.423),(.71,.28,.065),m['black'],.035)
    cube('Passenger glove compartment',(.52,1.045,.438),(.64,.23,.045),m['paint'],.012)
    cube('Glovebox handle',(.52,1.108,.409),(.14,.025,.035),m['metal'],.005)
    cube('Passenger grab rail',(.53,1.27,.37),(.48,.035,.035),m['metal'],.01)
    for x in [.30,.76]:
        cube('Grab rail standoff',(x,1.27,.42),(.025,.025,.10),m['metal'])
    for x in [-.84,.10,.86]:
        cube('Air vent surround',(x,1.12,.422),(.13,.14,.04),m['black'],.01)
        for y in [1.07,1.105,1.14,1.175]:
            cube('Vent horizontal louver',(x,y,.395),(.105,.008,.01),m['metal'])

    # Twin mechanical gauges. Labels and scale are separate from moving needles.
    for center,name,max_value in [(-.615,'Speed',120),(-.305,'RPM',6)]:
        cy,cz=1.13,.382
        cylinder(name+' polished bezel',(center,cy,cz),.137,.025,m['metal'],24)
        cylinder(name+' black dial',(center,cy,cz-.017),.123,.012,m['black'],24)
        for i in range(13):
            a=math.radians(-130+260*i/12)
            # Geometry readable facing the driver; minor ticks alternate shorter.
            rr=.107
            xx=center+math.sin(a)*rr
            yy=cy+math.cos(a)*rr
            tick=cube(name+' tick',(xx,yy,cz-.025),(.010,.019 if i%2==0 else .011,.004),m['cream'])
            tick.rotation_euler[1]=a
        for i in range(0,7,2):
            a=math.radians(-130+260*i/6)
            label(name+' numeral '+str(i),str(round(max_value*i/6)),(center+math.sin(a)*.082,cy+math.cos(a)*.082,cz-.030),.025)
        label(name+' units','KM/H' if name=='Speed' else 'RPM',(center,cy-.053,cz-.030),.019)
        mount=empty(name+'NeedleMount',bodyParent,game((center,cy,cz-.038)),(math.pi/2,0,0))
        pivot=empty(name+'Needle',mount)
        verts=[(-.009,-.018,0),(.009,-.018,0),(.004,.103,0),(-.004,.103,0)]
        geo=bpy.data.meshes.new(name+' needle geometry')
        geo.from_pydata(verts,[],[(0,1,2,3)])
        geo.materials.append(m['orange'])
        needle=bpy.data.objects.new(name+' needle blade',geo)
        bpy.context.collection.objects.link(needle)
        needle.parent=pivot
        bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.015,depth=.008)
        cap=finish(bpy.context.object,name+' needle hub',m['metal'],pivot)
        cap.location=(0,0,-.002)

    # Three-spoke wheel: fixed tilted mounting, pure local-Z rotation on child pivot.
    column=cylinder('Steering column',(-.47,1.08,.43),.045,.36,m['black'],12)
    column.rotation_euler[0]=math.radians(70)
    mount=empty('SteeringMount',bodyParent,game((-.47,1.15,.25)),(math.radians(70),0,0))
    wheel=empty('SteeringWheel',mount)
    bpy.ops.mesh.primitive_torus_add(major_radius=.244,minor_radius=.025,major_segments=32,minor_segments=6)
    rim=finish(bpy.context.object,'Leather steering rim',m['black'],wheel)
    rim.location=(0,0,0)
    for angle in [math.radians(90),math.radians(210),math.radians(330)]:
        spoke=local_cube('Brushed steering spoke',wheel,(math.cos(angle)*.115,math.sin(angle)*.115,0),(.20,.032,.018),m['metal'])
        spoke.rotation_euler[2]=angle
    bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=.073,depth=.038)
    hub=finish(bpy.context.object,'Steering horn pad',m['trim'],wheel)
    hub.location=(0,0,-.009)
    for off in [-.022,.022]:
        bolt=local_cube('Horn detail',wheel,(off,0,-.031),(.010,.010,.003),m['metal'])

    # Mechanical controls and a small original expedition radio.
    cube('Center radio housing',(.02,.99,.413),(.25,.12,.04),m['black'],.008)
    cube('Radio amber display',(.02,1.012,.387),(.14,.035,.006),m['orange'])
    for x in [-.075,.115]:
        cylinder('Radio tuning knob',(x,.97,.38),.023,.022,m['metal'],12)
    for x in [-.09,.0,.09]:
        cube('Auxiliary switch',(x,.87,.414),(.043,.046,.022),m['black'],.003)
    label('Switch labels','4WD  LOW  WINCH',(.0,.82,.394),.018)
    for x,color in [(-.087,'green'),(.0,'orange'),(.087,'red')]:
        cylinder('Dashboard status lamp',(x,.925,.395),.012,.009,m[color],10)
    cube('Gear lever gaiter',(0,.695,-.04),(.19,.09,.22),m['black'],.02)
    cube('Gear lever shaft',(0,.85,-.02),(.026,.28,.026),m['metal'])
    sphere('Gear lever knob',(0,1.005,-.02),(.058,.052,.058),m['black'])
    cube('Transfer lever shaft',(.19,.755,-.12),(.020,.20,.020),m['metal'])
    sphere('Transfer lever knob',(.19,.865,-.12),(.043,.039,.043),m['black'])
    for x,w in [(-.68,.085),(-.49,.10),(-.31,.075)]:
        cube('Pedal stalk',(x,.59,.43),(.025,.22,.025),m['metal'])
        ped=cube('Textured pedal',(x,.51,.34),(w,.14,.035),m['black'],.007)
        ped.rotation_euler[0]=math.radians(-15)
        for y in [.47,.50,.53,.56]:
            cube('Pedal grip rib',(x,y,.315),(w*.8,.006,.008),m['metal'])

    for side in [-1,1]:
        cube('Door trim panel',(side*.94,.89,-.10),(.055,.55,1.35),m['trim'],.022)
        cube('Door pull armrest',(side*.88,1.005,-.16),(.14,.07,.46),m['black'],.013)
        cube('Door inner handle',(side*.90,1.20,.19),(.035,.045,.15),m['metal'],.006)
        cube('Door storage pocket',(side*.90,.67,-.25),(.09,.16,.65),m['black'],.015)
        cylinder('Manual window crank hub',(side*.88,.88,.26),.04,.026,m['metal'],12)
        cube('Window crank arm',(side*.87,.84,.26),(.025,.11,.025),m['metal'])
    cube('Rear view mirror stem',(0,1.91,.60),(.025,.16,.025),m['metal'])
    cube('Rear view mirror surround',(0,1.865,.535),(.34,.13,.045),m['black'],.015)
    cube('Rear view mirror glass',(0,1.865,.505),(.30,.093,.006),m['glass'])
    for x in [-.47,.47]:
        cube('Folded sun visor',(x,1.97,.53),(.59,.12,.035),m['cream'],.012)
    return {'steering':wheel, 'driver_camera':(.47,1.58,-.45), 'steering_axis':'local Z', 'gauge_axis':'local Z'}
