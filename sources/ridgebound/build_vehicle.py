"""Rebuild the original Ridge Rover asset with Blender 4.3+.
Run: blender --background --python sources/ridgebound/build_vehicle.py
Game coordinates are X right, Y up, Z forward; exported GLB uses the same frame.
"""
import bpy, math, os, sys
from mathutils import Vector
from pathlib import Path
BASE=Path(__file__).resolve().parent
OUT=BASE.parent.parent/'ridgebound'/'assets'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for m in list(bpy.data.materials): bpy.data.materials.remove(m)
def mat(name,hexcolor,rough=.65,metallic=0,alpha=1,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');rgb=tuple((lambda s:s/12.92 if s<=.04045 else ((s+.055)/1.055)**2.4)(int(hexcolor[i:i+2],16)/255) for i in (0,2,4));bs.inputs['Base Color'].default_value=(*rgb,alpha);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metallic;bs.inputs['Alpha'].default_value=alpha
 if emission: bs.inputs['Emission Color'].default_value=(*rgb,1);bs.inputs['Emission Strength'].default_value=emission
 if alpha<1: m.surface_render_method='DITHERED';m.use_transparency_overlap=False
 m.diffuse_color=(*rgb,alpha);return m
M={'paint':mat('Ochre enamel','B87546',.48,.15),'cream':mat('Warm ivory','DCD5BA',.55,.08),'black':mat('Rubber','202A29',.9),'trim':mat('Charcoal interior','36413D',.8),'glass':mat('Pale glazing','9ABDB8',.15,.05,.12),'metal':mat('Brushed steel','929B96',.36,.65),'seat':mat('Saddle canvas','736C50',.9),'orange':mat('Amber lens','E2AA52',.32,.1,1,.15),'red':mat('Tail lamps','AC4B39',.3,.1,1,.15),'light':mat('Headlight glass','F0E6BC',.25,.2,1,.2),'green':mat('Luggage olive','717A56',.9)}
def conv(p):return (p[0],-p[2],p[1])
def empty(name,parent=None,pos=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=conv(pos);o.parent=parent;return o
ROOT=empty('RidgeRover');BODY=empty('Body',ROOT)
def assign(o,name,material,parent):o.name=name;o.data.materials.append(material);o.parent=parent;return o
def box(name,pos,dims,material,parent=BODY,bevel=0,rotation=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=conv(pos));o=bpy.context.object;o.dimensions=(dims[0],dims[2],dims[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if rotation:o.rotation_euler=rotation
 if bevel:
  mod=o.modifiers.new('Soft folded edges','BEVEL');mod.width=bevel;mod.segments=1;mod.affect='EDGES';bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 return assign(o,name,material,parent)
def cyl(name,pos,radius,depth,material,parent=BODY,axis='y',verts=16):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=radius,depth=depth,location=conv(pos));o=bpy.context.object
 if axis=='x':o.rotation_euler[1]=math.pi/2
 elif axis=='z':o.rotation_euler[0]=math.pi/2
 return assign(o,name,material,parent)
def sphere(name,pos,scale,material,parent=BODY):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=6,radius=1,location=conv(pos));o=bpy.context.object;o.scale=(scale[0],scale[2],scale[1]);return assign(o,name,material,parent)
def torus(name,pos,major,minor,material,parent=BODY,axis='z',segments=24):
 bpy.ops.mesh.primitive_torus_add(major_segments=segments,minor_segments=5,major_radius=major,minor_radius=minor,location=conv(pos));o=bpy.context.object
 if axis=='x':o.rotation_euler[1]=math.pi/2
 elif axis=='z':o.rotation_euler[0]=math.pi/2
 return assign(o,name,material,parent)
def rod(name,a,b,r,material,parent=BODY,verts=8):
 a,b=Vector(conv(a)),Vector(conv(b));v=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=v.length,location=(a+b)*.5);o=bpy.context.object;o.rotation_mode='QUATERNION';o.rotation_quaternion=v.to_track_quat('Z','Y');return assign(o,name,material,parent)
def poly(name,verts,faces,material,parent=BODY):
 g=bpy.data.meshes.new(name);g.from_pydata([conv(v) for v in verts],[],faces);g.materials.append(material);o=bpy.data.objects.new(name,g);bpy.context.collection.objects.link(o);o.parent=parent;return o
# Exposed ladder frame, driveline and suspended axles.
for x in (-.62,.62):box('Ladder frame rail',(x,.02,0),(.16,.21,3.8),M['trim'],bevel=.035)
for z in (-1.45,-.5,.55,1.5):box('Crossmember',(0,.02,z),(1.36,.14,.12),M['trim'],bevel=.02)
rod('Prop shaft',(0,-.08,-1.25),(0,-.08,1.25),.065,M['metal'])
for z in (-1.3,1.3):
 cyl('Axle',(0,0,z),.105,1.95,M['trim'],axis='x');sphere('Differential',(0,-.02,z),(.26,.19,.23),M['trim'])
 for x in (-.78,.78):
  rod('Damper',(x,.02,z-.13),(x,.44,z+.08),.055,M['metal'])
  for j in range(5):torus('Coil spring',(x,.05+j*.07,z+.16),.09,.017,M['trim'],axis='y',segments=10)
# A hollow cabin: separate floor, doors, pillars, roof and cargo panels.
box('Cabin floor',(0,.35,-.25),(1.92,.12,2.25),M['trim'],bevel=.035)
box('Rear cargo floor',(0,.57,-1.4),(1.96,.14,1.15),M['paint'],bevel=.035)
for x in (-.98,.98):
 box('Door lower skin',(x,.78,-.07),(.1,.75,1.45),M['paint'],bevel=.045)
 box('Rear quarter upper',(x,1.02,-1.35),(.1,.47,1.12),M['paint'],bevel=.035)
 box('Hood side',(x,1.0,1.3),(.1,.37,1.42),M['paint'],bevel=.035)
 box('Door sill',(x,.41,-.09),(.16,.12,1.46),M['trim'],bevel=.025)
 box('Side step',(x*1.13,.16,-.08),(.3,.095,1.53),M['metal'],bevel=.025)
 for z in (-.7,.59):box('Door seam',(x*1.058,.78,z),(.015,.62,.012),M['trim'])
 for z in (-.58,.48):box('Door hinge',(x*1.063,.74,z),(.025,.11,.07),M['metal'],bevel=.01)
 box('Recessed handle plate',(x*1.058,1.025,-.52),(.022,.11,.26),M['trim'],bevel=.017)
 box('Door pull',(x*1.085,1.045,-.52),(.045,.035,.19),M['metal'],bevel=.009)
 box('Cabin beltline',(x,1.19,-.49),(.12,.085,2.53),M['cream'],bevel=.015)
 for z in (-1.83,-.83,.72):box('Pillar',(x,1.65,z),(.12,.95,.1),M['cream'],bevel=.018)
 box('Front side window',(x*.995,1.64,-.035),(.016,.77,1.35),M['glass'])
 box('Rear quarter window',(x*.995,1.64,-1.34),(.016,.77,.84),M['glass'])
 # Wing mirrors with support arm, bevel housing and inset reflective face.
 rod('Mirror bracket',(x,1.31,.56),(x*1.22,1.36,.58),.03,M['trim'])
 box('Mirror housing',(x*1.24,1.47,.58),(.11,.29,.23),M['trim'],bevel=.04)
 box('Mirror face',(x*1.25,1.47,.46),(.082,.23,.018),M['metal'],bevel=.014)
# Upper hood with subtle central pressing.
box('Hood',(0,1.16,1.34),(1.97,.13,1.36),M['paint'],bevel=.055)
box('Hood centre pressing',(0,1.235,1.35),(.9,.03,1.13),M['paint'],bevel=.013)
for x in (-.86,.86):
 box('Hood catch',(x,1.07,.88),(.045,.17,.07),M['trim'],bevel=.012)
 box('Hood seam',(x,1.23,1.37),(.012,.009,1.02),M['trim'])
# Windshield frame deliberately leaves a clear driver sightline.
box('Windshield lower frame',(0,1.23,.75),(2.05,.13,.1),M['cream'],bevel=.022)
box('Windshield upper frame',(0,2.08,.75),(2.05,.1,.1),M['cream'],bevel=.02)
box('Windshield centre divider',(0,1.66,.77),(.055,.79,.06),M['cream'],bevel=.009)
box('Windshield',(0,1.66,.785),(1.87,.76,.015),M['glass'])
for x in (-.47,.47):rod('Wiper arm',(x,1.265,.81),(x+.21,1.52,.815),.013,M['trim']);rod('Wiper blade',(x+.11,1.43,.82),(x+.35,1.68,.82),.018,M['trim'])
box('Rear tailgate',(0,1.03,-1.92),(2.05,.5,.13),M['paint'],bevel=.035)
box('Rear window',(0,1.67,-1.925),(1.8,.77,.016),M['glass'])
box('Rear header',(0,2.08,-1.91),(2.05,.11,.1),M['cream'],bevel=.02)
box('Roof',(0,2.15,-.59),(2.16,.16,2.86),M['cream'],bevel=.06)
for x in (-1.09,1.09):box('Rain gutter',(x,2.1,-.59),(.045,.045,2.9),M['metal'],bevel=.009)
# Wheel arches: curved lip strips and top fender shelves, not solid boxes.
def arch(x,z):
 verts=[];steps=12
 for a in [(-math.pi/2)+math.pi*j/steps for j in range(steps+1)]:
  for xx,rr in [(x-.12,.71),(x+.12,.71),(x-.12,.84),(x+.12,.84)]:verts.append((xx,rr*math.cos(a)+.03,z+rr*math.sin(a)))
 faces=[]
 for j in range(steps):
  k=j*4;n=k+4
  faces.extend([(k,n,n+1,k+1),(k+2,k+3,n+3,n+2),(k,k+2,n+2,n),(k+1,n+1,n+3,k+3)])
 faces.extend([(0,1,3,2),(steps*4,steps*4+2,steps*4+3,steps*4+1)])
 poly('Curved wheel arch',verts,faces,M['trim'])
for x in (-1.03,1.03):
 for z in (-1.3,1.3):arch(x,z)
# Front face, radiator slots, headlamp bowls, marker lamps.
box('Front face',(0,.92,2.02),(1.98,.53,.14),M['paint'],bevel=.04)
box('Grille inset',(0,.92,2.105),(1.13,.37,.04),M['trim'],bevel=.025)
for x in [-.45+j*.15 for j in range(7)]:box('Grille bar',(x,.92,2.135),(.043,.31,.045),M['metal'],bevel=.012)
for x in (-.76,.76):
 cyl('Headlamp bezel',(x,.96,2.13),.217,.1,M['metal'],axis='z',verts=24)
 cyl('Headlamp bowl',(x,.96,2.19),.181,.035,M['black'],axis='z',verts=24)
 cyl('Headlamp lens',(x,.96,2.211),.162,.024,M['light'],axis='z',verts=24)
 for dx in (-.06,.0,.06):box('Lens rib',(x+dx,.96,2.227),(.009,.25,.009),M['cream'])
 box('Marker lens',(x,.68,2.113),(.17,.09,.035),M['orange'],bevel=.022)
box('Front bumper',(0,.36,2.18),(2.34,.19,.25),M['trim'],bevel=.045)
box('Bumper centre steel',(0,.36,2.325),(1.06,.15,.06),M['metal'],bevel=.015)
for x in (-.94,.94):box('Bumper end cap',(x,.385,2.19),(.38,.23,.3),M['trim'],bevel=.05)
box('Skid plate',(0,.035,1.82),(1.26,.1,.72),M['metal'],bevel=.035,rotation=(.2,0,0))
for x in (-.5,.5):torus('Recovery shackle',(x,.27,2.34),.088,.024,M['orange'],axis='z',segments=12)
# Functionally visible front winch, central cable drum and four roller fairlead.
box('Winch platform',(0,.48,2.18),(.9,.08,.39),M['metal'],bevel=.015)
cyl('Winch cable drum',(0,.61,2.2),.125,.42,M['trim'],axis='x',verts=20)
for x in (-.25,.25):cyl('Drum flange',(x,.61,2.2),.17,.055,M['metal'],axis='x',verts=20)
for i in range(12):torus('Cable winding',(-.18+i*.033,.61,2.2),.125,.012,M['metal'],axis='x',segments=16)
cyl('Winch motor',(-.39,.61,2.2),.13,.2,M['trim'],axis='x',verts=12)
box('Winch control box',(.28,.78,2.18),(.23,.16,.2),M['trim'],bevel=.025)
for y in (.45,.56):cyl('Fairlead roller',(0,y,2.47),.035,.44,M['metal'],axis='x',verts=10)
for x in (-.24,.24):cyl('Fairlead side roller',(x,.5,2.47),.035,.16,M['metal'],axis='y',verts=10)
rod('Winch cable end',(0,.5,2.49),(0,.4,2.61),.015,M['metal']);torus('Winch hook',(0,.36,2.63),.075,.023,M['orange'],axis='z',segments=12)
# Rear bumper, lamps, spare tyre and expedition fuel can.
box('Rear bumper',(0,.32,-2.07),(2.28,.2,.27),M['trim'],bevel=.04)
for x in (-.85,.85):
 box('Tail lamp housing',(x,1.01,-2.015),(.19,.38,.09),M['trim'],bevel=.025)
 box('Red stop light',(x,1.07,-2.069),(.15,.17,.025),M['red'],bevel=.013)
 box('Amber rear light',(x,.92,-2.069),(.15,.085,.025),M['orange'],bevel=.01)
box('Tailgate handle',(.02,1.19,-2.012),(.23,.05,.045),M['metal'],bevel=.012)
cyl('Spare tyre',(.35,1.08,-2.15),.59,.32,M['black'],axis='z',verts=24)
cyl('Spare hub',(.35,1.08,-2.335),.29,.07,M['cream'],axis='z',verts=16)
cyl('Spare hub cap',(.35,1.08,-2.382),.105,.04,M['metal'],axis='z',verts=12)
for i in range(20):
 a=i*2*math.pi/20;box('Spare tyre tread',(.35+.58*math.sin(a),1.08+.58*math.cos(a),-2.15),(.18,.09,.35),M['black'],rotation=(0,a,0))
box('Jerry can',(-.62,.99,-2.12),(.42,.69,.24),M['green'],bevel=.045)
box('Jerry can strap',(-.62,.99,-2.259),(.046,.7,.025),M['metal'])
box('Jerry can handle',(-.62,1.4,-2.12),(.25,.1,.12),M['green'],bevel=.025)
for a,b in [((-.77,.77,-2.25),(-.47,1.21,-2.25)),((-.47,.77,-2.25),(-.77,1.21,-2.25))]:rod('Jerry can pressing',a,b,.014,M['green'])
# Low rack, wooden slats, weathered luggage and securing straps.
for x in (-.83,.83):
 for z in (-1.6,.45):box('Rack foot',(x,2.29,z),(.1,.18,.15),M['trim'],bevel=.02)
 rod('Rack rail',(x,2.49,-1.73),(x,2.49,.56),.042,M['trim'])
for z in (-1.73,.56):rod('Rack cross rail',(-.83,2.49,z),(.83,2.49,z),.042,M['trim'])
for z in [-1.6+i*.33 for i in range(7)]:box('Rack deck',(0,2.34,z),(1.7,.055,.065),M['trim'],bevel=.012)
box('Expedition duffel',(-.24,2.57,-.75),(1.12,.4,1.11),M['green'],bevel=.11)
box('Tool case',(.52,2.56,.07),(.44,.35,.64),M['trim'],bevel=.045)
for z in (-1.1,-.45):
 box('Luggage strap',(-.24,2.781,z),(1.12,.025,.05),M['black'])
 for x in (-.81,.32):box('Luggage strap side',(x,2.57,z),(.025,.4,.05),M['black'])
box('Blank expedition badge',(-.24,2.57,-1.315),(.22,.12,.025),M['cream'],bevel=.012)
# Independent wheel pivots for steering and rotation in the game.
for side,x in [('L',-1.06),('R',1.06)]:
 for end,z in [('F',1.3),('R',-1.3)]:
  pivot=empty('Wheel_'+end+side,ROOT,(x,0,z))
  cyl('Tyre carcass',(0,0,0),.595,.43,M['black'],pivot,'x',24)
  for xx in (-.23,.23):
   torus('Raised sidewall',(xx,0,0),.41,.12,M['black'],pivot,'x',24)
   cyl('Recessed wheel rim',(xx,0,0),.313,.045,M['cream'],pivot,'x',16)
   cyl('Wheel centre',(xx*1.12,0,0),.13,.055,M['metal'],pivot,'x',12)
   for j in range(6):
    a=j*math.pi/3;cyl('Wheel lug',(xx*1.17,.205*math.cos(a),.205*math.sin(a)),.028,.025,M['metal'],pivot,'x',6)
  for j in range(24):
   a=j*math.pi/12
   for xx,shift in [(-.12,-.05),(.12,.05)]:
    t=box('All terrain tread',(xx,.61*math.cos(a),.61*math.sin(a)),(.215,.08,.17),M['black'],pivot,bevel=.012,rotation=(a,0,shift))
# Cabin helper is authored independently and included in the source release.
if str(BASE) not in sys.path:sys.path.insert(0,str(BASE))
try:
 from cabin import add_cabin
 add_cabin(BODY,M)
except ImportError:
 print('CABIN_HELPER_MISSING');raise
# Merge static mesh pieces by material and parent, retaining named moving pivots.
bpy.ops.object.select_all(action='DESELECT')
buckets={}
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.data.materials:
  key=(o.parent.name if o.parent else '',o.data.materials[0].name)
  buckets.setdefault(key,[]).append(o)
for key,objects in buckets.items():
 if len(objects)>1:
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=key[0]+'_'+key[1].replace(' ','_')
# Asset-only scene: no ground, cameras or lights exported.
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.context.view_layer.objects.active=BODY
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'ridge-rover.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'ridge-rover.glb'),export_format='GLB',export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
triangles=0
for o in bpy.context.scene.objects:
 if o.type=='MESH':o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
print('RIDGE_ROVER_MODEL',len([o for o in bpy.context.scene.objects if o.type=='MESH']),'meshes',triangles,'triangles')
print('EXPORTED',OUT/'ridge-rover.glb')
