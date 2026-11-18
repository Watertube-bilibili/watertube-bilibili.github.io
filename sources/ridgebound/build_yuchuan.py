"""Original Yuchuan V8 luxury expedition MPV. Blender 4.3+, bpy or CLI.
Build: python sources/ridgebound/build_yuchuan.py --preview
Coordinates: game +X = driver's LEFT, +Y up, +Z forward; metres.
This independent design uses no licensed brand badge or downloaded vehicle mesh.
"""
import argparse, json, math, sys, struct
from pathlib import Path
import bpy, bmesh
from mathutils import Matrix, Vector
BASE=Path(__file__).resolve().parent
OUT=BASE.parent.parent/'ridgebound'/'assets'
RADIUS=.405
AXLE=1.71
HALF_TRACK=.91
RIDE=.415
def cv(v): return Vector((v[0],-v[2],v[1]))
def gc(v): return [v[0],v[2],-v[1]]
def make_mat(name,hexcode,rough=.5,metal=0,alpha=1,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    rgb=[]
    for i in (0,2,4):
        v=int(hexcode[i:i+2],16)/255;rgb.append(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*rgb,1);p.inputs['Coat Weight'].default_value=.32 if metal>.2 else 0;p.inputs['Coat Roughness'].default_value=.22;p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;p.inputs['Alpha'].default_value=alpha
    if emission:p.inputs['Emission Color'].default_value=(*rgb,1);p.inputs['Emission Strength'].default_value=emission
    if alpha<1:m.surface_render_method='DITHERED';m.use_transparency_overlap=False
    m.diffuse_color=(*rgb,alpha)
    return m
class MPV:
    def __init__(self):
        self.m={
          'paint':make_mat('Deep estuary blue','324C55',.28,.38),
          'roof':make_mat('Pearl champagne','C8C2AE',.30,.28),
          'chrome':make_mat('Satin platinum','AEB9B7',.27,.75),
          'rubber':make_mat('Road and snow rubber','1E2427',.92),
          'dark':make_mat('Obsidian trim','17262C',.5,.08),
          'leather':make_mat('Almond leather','C4AE8C',.72),
          'wood':make_mat('Smoked walnut','55453B',.6),
          'glass':make_mat('Clear driver glazing','A8C8CF',.18,.0,.075),
          'privacy':make_mat('Rear privacy glazing','14242C',.14,.14,.86),
          'screen':make_mat('Instrument glass','14242B',.31,.1),
          'white':make_mat('Pearl white light','D6F0EA',.24,.1,1,.55),
          'red':make_mat('Ruby tail lamp','A83B43',.32,.1,1,.28),
          'amber':make_mat('Warm ambient light','E5B971',.38,.05,1,.25),
        }
        self.root=self.empty('YuchuanV8');self.body=self.empty('Body',self.root)
        for k,v in {'vehicle':'御川 V8','wheelbase_m':AXLE*2,'track_m':HALF_TRACK*2,'wheel_radius_m':RADIUS,'ride_height_m':RIDE,'length_m':5.60,'width_m':2.08,'height_m':2.10}.items():self.root[k]=v
        self.parts=[]
    def empty(self,name,parent=None,pos=(0,0,0)):
        o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=cv(pos);return o
    def mesh(self,name,vs,fs,mat,parent=None):
        me=bpy.data.meshes.new(name);me.from_pydata([cv(v) for v in vs],[],fs);me.validate()
        bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
        o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.parent=parent or self.body;me.materials.append(self.m[mat]);self.parts.append(o);return o
    def cube(self,name,pos,size,mat,parent=None,bevel=.015,segments=2):
        sx,sy,sz=[v/2 for v in size]
        vs=[(-sx,-sy,-sz),(sx,-sy,-sz),(sx,sy,-sz),(-sx,sy,-sz),(-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)]
        fs=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)]
        o=self.mesh(name,vs,fs,mat,parent);o.location=cv(pos)
        if bevel:
            mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bevel;mod.segments=segments;mod.affect='EDGES'
        return o
    def cyl(self,name,pos,r,d,mat,parent=None,axis='y',n=24):
        vs=[];fs=[]
        for end in (-d/2,d/2):
            for j in range(n):
                a=math.tau*j/n
                v=(end,r*math.cos(a),r*math.sin(a)) if axis=='x' else (r*math.sin(a),end,r*math.cos(a)) if axis=='y' else (r*math.cos(a),r*math.sin(a),end)
                vs.append(v)
        fs.append(tuple(reversed(range(n))));fs.append(tuple(range(n,2*n)))
        fs.extend((j,(j+1)%n,(j+1)%n+n,j+n) for j in range(n))
        o=self.mesh(name,vs,fs,mat,parent);o.location=cv(pos);return o
    def torus(self,name,pos,R,r,mat,parent=None,axis='x',n=32,k=6):
        vs=[];fs=[]
        for i in range(n):
            a=math.tau*i/n
            for j in range(k):
                b=math.tau*j/k;v=(r*math.sin(b),(R+r*math.cos(b))*math.cos(a),(R+r*math.cos(b))*math.sin(a))
                if axis=='y':v=(v[1],v[0],v[2])
                if axis=='z':v=(v[1],v[2],v[0])
                vs.append(v)
        for i in range(n):
            for j in range(k):fs.append((i*k+j,((i+1)%n)*k+j,((i+1)%n)*k+(j+1)%k,i*k+(j+1)%k))
        o=self.mesh(name,vs,fs,mat,parent);o.location=cv(pos);return o
    def rod(self,name,a,b,r,mat,parent=None):
        aa,bb=cv(a),cv(b);mid=(aa+bb)/2
        o=self.cyl(name,(0,0,0),r,(bb-aa).length,mat,parent,'y',10)
        o.location=mid;o.rotation_mode='QUATERNION';o.rotation_quaternion=(bb-aa).to_track_quat('Z','Y');return o
    def label(self,name,text,pos,size=.03,mat='chrome',parent=None):
        c=bpy.data.curves.new(name,'FONT');c.body=text;c.size=size;c.align_x='CENTER';c.align_y='CENTER';c.resolution_u=2
        o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.parent=parent or self.body;o.location=cv(pos)
        # Cabin text faces aft, readable from the driver looking +Z.
        o.rotation_euler=Matrix(((-1,0,0),(0,0,1),(0,1,0))).to_euler();c.materials.append(self.m[mat]);return o
    def prism(self,name,profile,x0,x1,mat):
        vs=[(x,y,z) for x in (x0,x1) for y,z in profile];n=len(profile);fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]
        fs.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
        o=self.mesh(name,vs,fs,mat);b=o.modifiers.new('Soft coachwork edges','BEVEL');b.width=.018;b.segments=2;return o
    def build(self):
        # Proportions first: long wheelbase and hollow, three-row cabin.
        self.cube('Flat battery underfloor',(0,-.13,-.12),(1.64,.16,4.7),'dark',bevel=.04)
        self.cube('Cabin floor',(0,.10,-.60),(1.87,.10,4.20),'dark',bevel=.025)
        self.cube('Front crush rail',(0,.10,2.32),(1.55,.22,.62),'dark',bevel=.045)
        # Side skin follows both wheel apertures. Concave polygon triangulates around openings.
        profile=[(.86,-2.83),(.86,2.33),(.80,2.53),(.63,2.65),(.22,2.68),(-.10,2.64),(-.14,2.20)]
        for j in range(17):
            a=-math.pi/2+j*math.pi/16
            profile.append((.025+.475*math.cos(a),AXLE+.475*math.sin(a)))
        # Reverse the front arc to progress rearward along the lower edge.
        profile=profile[:7]+list(reversed(profile[7:]))
        profile.append((-.14,.98));profile.append((-.14,-1.22))
        rear=[]
        for j in range(17):
            a=math.pi/2-j*math.pi/16;rear.append((.025+.475*math.cos(a),-AXLE+.475*math.sin(a)))
        profile.extend(rear);profile.extend([(-.14,-2.20),(-.14,-2.83)])
        for side in (-1,1):
            xa,xb=sorted((side*.965,side*1.04));self.prism('Sculpted MPV side',profile,xa,xb,'paint')
            self.cube('Sculpted belt shoulder',(side*1.012,.94,-.63),(.045,.075,4.34),'paint',bevel=.022)
            self.cube('Lower chrome sill',(side*1.044,-.10,-.10),(.034,.045,2.77),'chrome',bevel=.009)
            self.cube('Flush side step',(side*1.015,-.18,-.10),(.12,.07,2.64),'dark',bevel=.018)
            self.cube('Beltline chrome',(side*1.036,1.015,-.73),(.026,.025,3.92),'chrome',bevel=.007)
            # Big doors, horizontal sliding rail and flush handles.
            for z in (.52,-.98,-2.48):
                self.cube('Door panel reveal',(side*1.048,.44,z),(.009,.76,.008),'dark',bevel=.002,segments=1)
            self.cube('Sliding door rail',(side*1.05,.91,-1.44),(.016,.022,1.92),'chrome',bevel=.006)
            for z in (.68,-.86):
                self.cube('Flush door handle',(side*1.061,.80,z),(.028,.045,.22),'chrome',bevel=.015)
            self.cube('Door courtesy lamp',(side*1.067,.725,-.86),(.009,.012,.21),'white',bevel=.003,segments=1)
            # Black pillars are independent of transparent windows.
            for z in (.87,-.48,-1.65,-2.65):
                self.cube('Window pillar',(side*.967,1.32,z),(.10,.63,.08),'dark',bevel=.015)
            for z,d,material in [(.18,1.23,'glass'),(-1.06,1.10,'privacy'),(-2.17,.86,'privacy')]:
                self.cube('Panoramic side glazing',(side*.975,1.32,z),(.014,.60,d),material,bevel=.025)
            self.cube('Upper window trim',(side*.974,1.638,-.89),(.022,.023,3.64),'chrome',bevel=.006)
            # Wing mirrors on a small swept stem.
            self.rod('Mirror stalk',(side*.98,1.04,1.07),(side*1.13,1.10,1.13),.022,'dark')
            self.cube('Streamlined mirror cap',(side*1.14,1.18,1.11),(.16,.10,.30),'paint',bevel=.045,segments=4)
            self.cube('Mirror lower shroud',(side*1.14,1.125,1.11),(.15,.045,.29),'dark',bevel=.018,segments=3)
            self.cube('Mirror indicator',(side*1.14,1.145,1.255),(.10,.012,.014),'white',bevel=.006,segments=2)
            self.cube('Mirror reflective insert',(side*1.14,1.16,.952),(.125,.083,.008),'chrome',bevel=.018,segments=3)
            for z in (-AXLE,AXLE):
                # Near-circular stamped fender lips with room for suspension travel.
                vs=[];fs=[]
                for j in range(19):
                    a=-math.pi/2+j*math.pi/18
                    for x,r in [(side*1.047,.477),(side*1.061,.477),(side*1.047,.501),(side*1.061,.501)]:
                        vs.append((x,.025+r*math.cos(a),z+r*math.sin(a)))
                for j in range(18):
                    k=j*4;n=k+4;fs.extend([(k,n,n+1,k+1),(k+2,k+3,n+3,n+2),(k,k+2,n+2,n),(k+1,n+1,n+3,k+3)])
                fs.extend([(0,1,3,2),(72,74,75,73)]);self.mesh('Painted wheel opening surround',vs,fs,'paint')
        # Roof and tail pillars form a high, long van silhouette without filling the interior.
        roof_vs=[];roof_fs=[];segments=24
        for yy,ww,dd,rr in [(1.585,2.00,3.91,.14),(1.675,1.98,3.89,.20),(1.72,1.84,3.75,.23)]:
            for cx,cz,start in [(ww/2-rr,dd/2-rr,0),(-ww/2+rr,dd/2-rr,90),(-ww/2+rr,-dd/2+rr,180),(ww/2-rr,-dd/2+rr,270)]:
                for j in range(6):
                    a=math.radians(start+j*18);roof_vs.append((cx+rr*math.cos(a),yy,-.91+cz+rr*math.sin(a)))
        roof_fs.append(tuple(reversed(range(segments))));roof_fs.append(tuple(range(segments*2,segments*3)))
        for row in range(2):
            for j in range(segments):roof_fs.append((row*segments+j,row*segments+(j+1)%segments,(row+1)*segments+(j+1)%segments,(row+1)*segments+j))
        roof=self.mesh('Rounded monocoque roof',roof_vs,roof_fs,'roof')
        for face in roof.data.polygons:face.use_smooth=True
        self.cube('Roof glass insert',(0,1.727,-1.05),(1.25,.012,2.48),'screen',bevel=.005,segments=2)
        self.cube('Rear upper pillar',(0,1.34,-2.73),(1.95,.67,.08),'dark',bevel=.04)
        self.cube('Rear window',(0,1.36,-2.781),(1.77,.51,.012),'privacy',bevel=.07,segments=3)
        self.cube('Rear tailgate',(0,.48,-2.77),(1.99,.94,.13),'paint',bevel=.055,segments=3)
        self.cube('Rear chrome belt',(0,.94,-2.842),(1.86,.052,.012),'chrome',bevel=.008)
        self.cube('Rear bumper',(0,-.075,-2.73),(1.99,.18,.20),'paint',bevel=.045,segments=3)
        self.cube('Rear diffuser',(0,-.12,-2.76),(1.82,.19,.15),'dark',bevel=.045)
        for s in (-1,1):
            self.cube('Tail lamp recessed surround',(s*.878,.58,-2.847),(.16,.57,.026),'dark',bevel=.048,segments=4)
            self.cube('Continuous ruby tail lens',(s*.878,.58,-2.865),(.112,.52,.022),'red',bevel=.038,segments=4)
            for j in range(12):self.cube('Tail crystal louver',(s*.878,.355+j*.041,-2.881),(.078,.009,.010),'red',bevel=.003,segments=2)
            self.cube('Tail lamp side signature',(s*.941,.58,-2.854),(.009,.42,.012),'white',bevel=.003,segments=2)
        self.cube('Rear plate recess',(0,.34,-2.849),(.46,.12,.018),'dark',bevel=.015)
        # Sloping front windshield and long flat bonnet: broad clean face, original lamps.
        pane=[(-.93,1.00,1.63),(.93,1.00,1.63),(.925,1.61,.99),(-.925,1.61,.99)]
        self.mesh('Windshield',pane,[(0,1,2,3)],'glass')
        for s in (-1,1):self.rod('Swept A pillar',(s*.97,1.00,1.64),(s*.96,1.64,.96),.046,'roof')
        self.rod('Windshield header',(-.96,1.64,.96),(.96,1.64,.96),.036,'roof')
        self.cube('Windshield cowl',(0,.99,1.60),(1.95,.08,.16),'dark',bevel=.035)
        # Continuous bowed bonnet: center crown, falling shoulders and a rounded leading edge.
        hood_vs=[];hood_fs=[];nx=18;nz=14
        for j in range(nz+1):
            t=j/nz;z=1.55+t*1.035;half=1.005-.07*t
            for i in range(nx+1):
                u=-1+2*i/nx
                y=.925+.038*math.sin(math.pi*t)-.061*abs(u)**3
                hood_vs.append((u*half,y,z-.045*abs(u)**4))
        for j in range(nz):
            for i in range(nx):
                k=j*(nx+1)+i;hood_fs.append((k,k+1,k+nx+2,k+nx+1))
        bonnet=self.mesh('Sculpted crown bonnet',hood_vs,hood_fs,'roof')
        solid=bonnet.modifiers.new('Bonnet thickness','SOLIDIFY');solid.thickness=.035
        for f in bonnet.data.polygons:f.use_smooth=True
        for s in (-1,1):
            for j in range(10):
                z0=1.60+j*.09;z1=z0+.09
                x0=s*(.76-.045*j/10);x1=s*(.76-.045*(j+1)/10)
                self.rod('Hood contour highlight',(x0,.924,z0),(x1,.924,z1),.0028,'chrome')
        # Rounded nose shell wraps the front corners into the fenders. Its lower opening
        # has an actual cavity, with a 0.22m back wall instead of a black planar decal.
        rows=[(-.14,.88,2.61),(-.09,.97,2.72),(.0,1.015,2.79),(.16,1.035,2.81),
              (.20,1.035,2.81),(.28,1.034,2.81),(.40,1.026,2.80),(.54,1.014,2.77),
              (.58,1.008,2.75),(.70,.987,2.70),(.82,.964,2.64),(.925,.932,2.585)]
        us=[-1,-.98,-.92,-.83,-.76,-.65,-.4,0,.4,.65,.76,.83,.92,.98,1]
        nv=len(us);nr=len(rows);front_vs=[];front_fs=[]
        for yy,half,zz in rows:
            for u in us:front_vs.append((u*half,yy,zz-.18*abs(u)**4))
        total=len(front_vs);front_vs += [(x,y,z-.22) for x,y,z in front_vs]
        missing=set()
        for j in range(nr-1):
            for i in range(nv-1):
                midx=(front_vs[j*nv+i][0]+front_vs[j*nv+i+1][0])/2
                midy=(rows[j][0]+rows[j+1][0])/2
                if abs(midx)<.79 and .20<midy<.58:missing.add((j,i))
        for j in range(nr-1):
            for i in range(nv-1):
                k=j*nv+i;q=(k,k+1,k+nv+1,k+nv)
                front_fs.append(tuple(v+total for v in reversed(q)))
                if (j,i) not in missing:front_fs.append(q)
                else:
                    for edge,neighbor in [((q[0],q[1]),(j-1,i)),((q[1],q[2]),(j,i+1)),((q[2],q[3]),(j+1,i)),((q[3],q[0]),(j,i-1))]:
                        if neighbor not in missing:
                            a,b=edge;front_fs.append((a,b,b+total,a+total))
        boundary=list(range(nv))+[j*nv+nv-1 for j in range(1,nr)]+list(range((nr-1)*nv+nv-2,(nr-1)*nv-1,-1))+[j*nv for j in range(nr-2,0,-1)]
        for a,b in zip(boundary,boundary[1:]+boundary[:1]):front_fs.append((a,b,b+total,a+total))
        fascia=self.mesh('Continuous wrapped front fascia',front_vs,front_fs,'paint')
        for f in fascia.data.polygons:f.use_smooth=True
        # Low, three-section grille: sculpted recess, bright surround and separated chambers.
        def grille_z(x):return 2.807-.18*(abs(x)/1.03)**4
        for yy in (.20,.575):
            for j in range(16):
                x0=-.805+j*1.61/16;x1=x0+1.61/16
                self.rod('Grille polished surround',(x0,yy,grille_z(x0)+.008),(x1,yy,grille_z(x1)+.008),.012,'chrome')
        for x in (-.805,.805):self.rod('Grille side surround',(x,.205,grille_z(x)+.008),(x,.57,grille_z(x)+.008),.014,'chrome')
        self.cube('Recessed grille black back',(0,.385,2.647),(1.58,.36,.025),'dark',bevel=.045,segments=3)
        for x in (-.50,.50):self.cube('Grille chamber divider',(x,.385,2.745),(.036,.32,.13),'chrome',bevel=.012,segments=3)
        for y in (.275,.385,.495):
            for chamber in [(-.77,-.53),(-.47,.47),(.53,.77)]:
                a,b=chamber
                for j in range(6):
                    x0=a+(b-a)*j/6;x1=a+(b-a)*(j+1)/6
                    self.rod('Recessed horizontal grille vane',(x0,y,grille_z(x0)-.065),(x1,y,grille_z(x1)-.065),.010,'chrome')
        for x in [-.72+i*.09 for i in range(17)]:
            self.rod('Deep grille fin',(x,.235,grille_z(x)-.105),(x,.53,grille_z(x)-.105),.005,'dark')
        # Original arcing light ribbons wrap onto the corners; faceted rectangular optics
        # replace the old round dots. The warm DRL is distinct from any real badge/lamp shape.
        for s in (-1,1):
            points=[(s*.49,.805,2.726),(s*.63,.812,2.725),(s*.78,.803,2.699),
                    (s*.90,.775,2.652),(s*.966,.724,2.602),(s*.994,.662,2.558)]
            for a,b in zip(points,points[1:]):self.rod('Arcing DRL dark cradle',a,b,.026,'dark')
            for a,b in zip(points,points[1:]):
                aa=(a[0],a[1]+.002,a[2]+.012);bb=(b[0],b[1]+.002,b[2]+.012)
                self.rod('Arcing pearl DRL',aa,bb,.011,'white')
            housing=self.cube('Crystal headlight pocket',(s*.858,.642,2.639),(.265,.142,.075),'dark',bevel=.045,segments=4)
            housing.rotation_euler.z=-s*.17
            for j in range(3):
                x=s*(.774+j*.067);z=2.694-.23*(abs(x)/1.03)**4
                optic=self.cube('Crystal optical block',(x,.641,z),(.052,.071,.030),'white',bevel=.012,segments=3)
                optic.rotation_euler.z=-s*.15
                self.cube('Crystal lower facet',(x,.611,z+.017),(.041,.010,.008),'chrome',bevel=.003,segments=2)
            self.cube('Corner intake inset',(s*.926,.113,2.65),(.115,.16,.035),'dark',bevel=.035,segments=3)
        self.cube('Front lower lip',(0,-.105,2.73),(1.69,.045,.08),'chrome',bevel=.020,segments=3)
        # Small original paired-river emblem, shaped as two offset polished facets.
        for s in (-1,1):
            mark=self.cube('Yuchuan river emblem',(s*.027,.681,2.716),(.014,.055,.012),'chrome',bevel=.004,segments=2)
            mark.rotation_euler.y=s*.18
        # Concealed expedition winch and recovery points.
        self.cube('Front winch recess',(0,.25,2.77),(.44,.09,.026),'dark',bevel=.018)
        self.cyl('Winch drum',(0,.24,2.70),.07,.29,'chrome',axis='x',n=20)
        for y in (.215,.285):self.cyl('Fairlead roller',(0,y,2.795),.014,.32,'chrome',axis='x',n=12)
        self.empty('WinchOutlet',self.body,(0,.25,2.80));self.empty('RearWinchOutlet',self.body,(0,.22,-2.82))
        self.build_wheels();self.build_cabin()
    def build_wheels(self):
        for side,sign in [('L',1),('R',-1)]:
            for end,z in [('F',AXLE),('R',-AXLE)]:
                tag=end+side;pivot=self.empty('Wheel_'+tag,self.root,(sign*HALF_TRACK,0,z))
                pivot['suspension_axis']='local Y';pivot['steering_axis']='local Y'
                spin=self.empty('WheelSpin_'+tag,pivot);spin['spin_axis']='local X';spin['radius_m']=RADIUS
                self.cyl('Road tyre',(0,0,0),.389,.245,'rubber',spin,'x',32)
                for x in (-.125,.125):
                    self.torus('Rounded tyre shoulder',(x*.80,0,0),.335,.055,'rubber',spin,'x',32,6)
                    self.cyl('Wheel rim',(x,0,0),.275,.024,'chrome',spin,'x',32)
                    self.cyl('Recessed turbine hub',(x*1.13,0,0),.220,.018,'dark',spin,'x',32)
                    for j in range(10):
                        a=math.tau*j/10
                        outline=[(.085,a-.10),(.255,a+.07),(.264,a+.38),(.15,a+.50),(.09,a+.35)]
                        vs=[]
                        for xx in (x*1.23-.007,x*1.23+.007):
                            vs.extend((xx,r*math.cos(t),r*math.sin(t)) for r,t in outline)
                        fs=[(4,3,2,1,0),(5,6,7,8,9)]+[(i,(i+1)%5,(i+1)%5+5,i+5) for i in range(5)]
                        blade=self.mesh('Broad turbine alloy blade',vs,fs,'chrome',spin)
                        edge=blade.modifiers.new('Machined wheel face edge','BEVEL');edge.width=.003;edge.segments=2
                    self.cyl('Wheel centre cap',(x*1.32,0,0),.070,.016,'chrome',spin,'x',20)
                    for j in range(5):
                        a=math.tau*j/5;self.cyl('Lug',(x*1.37,.095*math.cos(a),.095*math.sin(a)),.011,.008,'dark',spin,'x',8)
                for j in range(32):
                    a=math.tau*j/32
                    tread=self.cube('All season tread',(0,.398*math.cos(a),.398*math.sin(a)),(.228,.014,.042),'rubber',spin,bevel=.004,segments=1)
                    tread.rotation_euler.x=a
                # Independent wishbone and air-spring assembly follow the chassis.
                self.rod('Lower wishbone',(sign*.46,-.09,z-.17),(sign*.85,-.04,z),.026,'dark')
                self.rod('Upper wishbone',(sign*.55,.15,z+.13),(sign*.85,.10,z),.021,'chrome')
                self.cyl('Air suspension bellows',(sign*.72,.15,z),.082,.21,'rubber',axis='y',n=16)
                self.cyl('Damper piston',(sign*.72,.30,z),.025,.20,'chrome',axis='y',n=12)
                for y in (.07,.13,.19,.25):self.torus('Air spring pleat',(sign*.72,y,z),.079,.012,'dark',axis='y',n=16,k=5)
    def build_cabin(self):
        self.empty('DriverEye',self.body,(.49,1.32,.48))
        self.empty('PassengerEye',self.body,(-.49,1.32,.48))
        self.cube('Dashboard core',(0,.93,1.28),(1.85,.30,.39),'dark',bevel=.075,segments=3)
        self.cube('Dashboard walnut inlay',(0,.935,1.071),(1.77,.08,.028),'wood',bevel=.017)
        self.cube('Dashboard ambient strip',(0,.995,1.052),(1.69,.008,.009),'amber',bevel=.002,segments=1)
        self.cube('Wide driver display',(.45,1.085,1.074),(.62,.15,.032),'screen',bevel=.025,segments=3)
        self.cube('Central floating screen',(-.18,1.02,1.045),(.48,.27,.028),'screen',bevel=.022,segments=3)
        for x in (-.31,-.18,-.05):self.cube('Display UI line',(x,1.02,1.026),(.07,.004,.004),'white',bevel=.001,segments=1)
        self.label('Display caption','YUCHUAN',(-.18,1.09,1.025),.024,'chrome')
        for x in (.86,-.86):
            self.cube('Air vent surround',(x,.95,1.069),(.16,.10,.026),'dark',bevel=.018)
            for y in (.925,.95,.975):self.cube('Vent louver',(x,y,1.048),(.13,.007,.008),'chrome',bevel=.002,segments=1)
        for cx,name in [(.61,'Speed'),(.31,'RPM')]:
            self.cyl(name+'Dial',(cx,1.08,1.045),.060,.012,'screen',axis='z',n=24)
            for j in range(9):
                a=(-125+j*31.25)*math.pi/180
                self.cube(name+'Tick',(cx+.049*math.sin(a),1.08+.049*math.cos(a),1.036),(.004,.008,.004),'chrome',bevel=.001,segments=1)
            mount=self.empty(name+'NeedleMount',self.body,(cx,1.08,1.028));mount.rotation_euler.x=math.pi/2
            needle=self.empty(name+'Needle',mount);needle['rotation_axis_glb']='local Y'
            # Blender XY blade -> GLB XZ, rotating its GLB local Y axis.
            obj=self.cube(name+'Pointer',(0,.003,-.021),(.004,.004,.044),'amber',needle,bevel=.001,segments=1)
        mount=self.empty('SteeringMount',self.body,(.49,1.00,.92));mount.rotation_euler.x=math.radians(74)
        wheel=self.empty('SteeringWheel',mount);wheel['rotation_axis_glb']='local Y';wheel['driver_side']='left_positive_X'
        self.torus('Leather steering rim',(0,0,0),.172,.019,'dark',wheel,'y',40,8)
        self.cube('Steering hub',(0,0,0),(.17,.042,.09),'dark',wheel,bevel=.024,segments=3)
        for side in (-1,1):
            self.cube('Steering spoke',(side*.113,0,0),(.10,.017,.033),'chrome',wheel,bevel=.008)
            self.cube('Wheel switch',(side*.07,-.025,0),(.036,.006,.023),'screen',wheel,bevel=.006)
        self.cube('Bottom spoke',(0,0,.103),(.024,.022,.10),'chrome',wheel,bevel=.007)
        # Wide console and six individual captain-style seats; third row centre cushion.
        self.cube('Center console',(0,.42,.45),(.29,.56,.90),'dark',bevel=.05,segments=3)
        self.cube('Console lid',(0,.72,.27),(.30,.075,.46),'leather',bevel=.035,segments=3)
        for z in (.58,.80):
            self.cyl('Cup holder rim',(0,.74,z),.07,.013,'chrome',axis='y',n=20)
            self.cyl('Cup holder interior',(0,.746,z),.059,.010,'dark',axis='y',n=20)
        for row,z in enumerate((.10,-1.13,-2.15)):
            for x in (-.49,.49):
                self.cube('Seat pedestal',(x,.20,z),(.58,.20,.55),'dark',bevel=.035)
                self.cube('Leather seat cushion',(x,.37,z),(.65,.15,.65),'leather',bevel=.055,segments=3)
                self.cube('Seat back',(x,.79,z-.32),(.65,.77,.13),'leather',bevel=.065,segments=3)
                self.cube('Quilted insert',(x,.79,z-.243),(.44,.56,.018),'roof',bevel=.026,segments=2)
                for yy in (.56,.66,.76,.86, .96):self.cube('Horizontal seat stitch',(x,yy,z-.231),(.39,.003,.003),'wood',bevel=.0005,segments=1)
                self.cube('Head restraint',(x,1.24,z-.33),(.38,.21,.13),'leather',bevel=.045,segments=3)
                for xx in (x-.23,x+.23):
                    self.cube('Seat armrest',(xx,.66,z),(.085,.075,.36),'leather',bevel=.03,segments=3)
                if row==1:
                    self.cube('Folded rear table',(x,.78,z-.402),(.40,.29,.027),'wood',bevel=.025)
        for s in (-1,1):
            for z in (.12,-1.18):
                self.cube('Door cabin trim',(s*.923,.58,z),(.045,.59,1.13),'leather',bevel=.025)
                self.cube('Door armrest',(s*.865,.70,z),(.12,.065,.49),'wood',bevel=.022)
                self.cube('Door ambient light',(s*.89,.824,z),(.008,.009,.69),'amber',bevel=.002)
        # Dedicated pedal pivots can be pressed or detached by the gameplay rig.
        for name,x in [('BrakePedal',.55),('AcceleratorPedal',.32)]:
            pedal=self.empty(name,self.body,(x,.45,1.19));pedal['press_axis']='local X'
            self.cube(name+'Arm',(0,-.11,-.055),(.023,.23,.025),'chrome',pedal,bevel=.006)
            self.cube(name+'Pad',(0,-.23,-.08),(.11 if name=='BrakePedal' else .07,.105,.027),'rubber',pedal,bevel=.012)
            for y in (-.26,-.235,-.21):self.cube(name+'Grip',(0,y,-.098),(.085 if name=='BrakePedal' else .052,.005,.004),'chrome',pedal,bevel=.001,segments=1)
        self.cube('Rear mirror',(0,1.44,1.0),(.28,.085,.03),'dark',bevel=.022)
        self.cube('Rear mirror glass',(0,1.44,.98),(.235,.052,.009),'chrome',bevel=.015)
        for x in (-.49,.49):self.cube('Sun visor',(x,1.548,.90),(.48,.08,.025),'leather',bevel=.02)
        # The high-roof sky panel remains interior detail, not a large flat obstruction.
        self.cube('Ceiling inner liner',(0,1.59,-.9),(1.84,.035,3.67),'leather',bevel=.025)
        self.cube('Ceiling starlight panel',(0,1.568,-1.23),(1.30,.012,2.15),'dark',bevel=.06,segments=3)
        for i in range(39):
            x=math.sin(i*4.71)*.57;z=-1.23+math.cos(i*2.81)*.94
            self.cyl('Starlight pixel',(x,1.555,z),.0036,.006,'white',axis='y',n=6)
def finalize_meshes(model):
    # Convert modifier results, correct orientation and bake scale before material batching.
    for o in list(bpy.context.scene.objects):
        if o.type not in {'MESH','FONT'}:continue
        bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
        bpy.ops.object.convert(target='MESH');o=bpy.context.view_layer.objects.active
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        # Premium greenhouse taper: lean the glass/pillars inward, preserving wheel/rig axes.
        if o.parent and not o.parent.name.startswith(('Steering','Speed','RPM','Wheel','Brake','Accelerator')):
            bpy.context.view_layer.update();world=o.matrix_world.copy();inverse=world.inverted()
            for vertex in o.data.vertices:
                p=world @ vertex.co
                if p.z>1.0:p.x*=1-min(.10,(p.z-1.0)*.125)
                vertex.co=inverse @ p
        bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
    buckets={}
    for o in list(bpy.context.scene.objects):
        if o.type=='MESH':buckets.setdefault((o.parent.name,o.data.materials[0].name),[]).append(o)
    for (parent,mat),objects in buckets.items():
        if len(objects)>1:
            bpy.ops.object.select_all(action='DESELECT')
            for o in objects:o.select_set(True)
            bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
            objects[0].name=parent+'_'+mat.replace(' ','_')
    bpy.context.view_layer.update()
def measure():
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];verts=[]
    for o in meshes:
        verts.extend(o.matrix_world @ v.co for v in o.data.vertices);o.data.calc_loop_triangles()
        assert all(abs(s-1)<1e-6 for s in o.scale),o.name+' unapplied scale'
        assert len(o.data.polygons)>0,o.name+' empty'
    lo=[min(v[i] for v in verts) for i in range(3)];hi=[max(v[i] for v in verts) for i in range(3)]
    return {'mesh_count':len(meshes),'triangles':sum(len(o.data.loop_triangles) for o in meshes),'bounds_blender':{'min':lo,'max':hi},'dimensions_game':[hi[0]-lo[0],hi[2]-lo[2],hi[1]-lo[1]]}
def glb_info(path):
    b=path.read_bytes();length,kind=struct.unpack_from('<II',b,12);d=json.loads(b[20:20+length]);nodes={n.get('name'):n for n in d['nodes']}
    required=['YuchuanV8','Body','DriverEye','BrakePedal','AcceleratorPedal','SteeringWheel','SpeedNeedle','RPMNeedle','WinchOutlet','RearWinchOutlet']
    required += ['Wheel_'+x for x in ('FL','FR','RL','RR')]+['WheelSpin_'+x for x in ('FL','FR','RL','RR')]
    assert all(x in nodes for x in required)
    for tag,x,z in [('FL',.91,1.71),('FR',-.91,1.71),('RL',.91,-1.71),('RR',-.91,-1.71)]:
        actual=nodes['Wheel_'+tag]['translation'];assert max(abs(actual[i]-[x,0,z][i]) for i in range(3))<1e-5
    assert nodes['DriverEye']['translation'][0]>.4
    assert not d.get('extensionsRequired'),d.get('extensionsRequired')
    return {k:{f:v for f,v in nodes[k].items() if f in ('translation','rotation','scale','extras')} for k in required}
def preview(path,cockpit=False):
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=128;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.018;scene.cycles.use_denoising=False
    scene.render.resolution_x=800;scene.render.resolution_y=600;scene.render.resolution_percentage=100
    if scene.world is None:scene.world=bpy.data.worlds.new('Review environment')
    scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.20,.23,.26,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.38;scene.view_settings.view_transform='AgX'
    lamps=[]
    for name,pos,energy,size in [('Key',(5,7,6),1500,6),('Fill',(-5,3,2),900,5),('Rim',(0,5,-7),1700,5)]:
        data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
        o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=cv(pos);o.rotation_euler=(cv((0,.5,0))-o.location).to_track_quat('-Z','Y').to_euler();lamps.append(o)
    cd=bpy.data.cameras.new('ReviewCamera');camera=bpy.data.objects.new('ReviewCamera',cd);scene.collection.objects.link(camera);scene.camera=camera
    if cockpit:
        camera.location=cv((.49,1.32,.48));target=cv((.48,1.05,2.80));cd.type='PERSP';cd.lens=18;cd.clip_start=.03
    else:
        camera.location=cv((6.5,2.9,7.6));target=cv((0,.54,-.15));cd.type='PERSP';cd.lens=50;cd.clip_start=.03
    camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
    ground=None
    if not cockpit:
        bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.410))
        ground=bpy.context.object;ground.name='Review floor';ground.data.materials.append(make_mat('Studio floor','343B40',.32,.10))
    else:
        data=bpy.data.lights.new('Cabin bounce card','AREA');data.energy=12;data.size=1.1
        fill=bpy.data.objects.new('Cabin bounce card',data);scene.collection.objects.link(fill);fill.location=cv((0,1.48,.44));fill.rotation_euler=(cv((0,.9,1.1))-fill.location).to_track_quat('-Z','Y').to_euler();lamps.append(fill)
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(path);scene.render.film_transparent=False
    bpy.ops.render.render(write_still=True)
    for o in lamps+[camera]+([ground] if ground else []):bpy.data.objects.remove(o,do_unlink=True)
def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]
    ap=argparse.ArgumentParser();ap.add_argument('--preview',action='store_true');opt=ap.parse_args(args)
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1
    model=MPV();model.build();finalize_meshes(model);before=measure();assert before['triangles']<70000,before
    OUT.mkdir(parents=True,exist_ok=True);blend=BASE/'yuchuan-v8.blend';glb=OUT/'yuchuan-v8.glb'
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)
    nodes=glb_info(glb)
    spec={'name':'御川 V8','id':'yuchuan_v8','game_axes':'+X driver left, +Y up, +Z forward','wheelbase_m':3.42,'track_m':1.82,'wheel_radius_m':.405,'tyre_width_m':.245,'ride_height_m':.415,'body_length_m':5.60,'body_width_m':2.08,'height_m':2.10,'driver_eye':[.49,1.32,.48],'wheel_spin_axis':'WheelSpin_* local X','wheel_steer_axis':'Wheel_* local Y','steering_gauge_axis':'local Y after GLB conversion','steering_gain_sign':'positive local Y viewed from behind is clockwise; game may set negative for left steering','nodes':nodes,'measured':before}
    # Actual round-trip through Blender importer, geometry/bounds and named rigs measured again.
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(glb));after=measure()
    assert max(abs(a-b) for a,b in zip(before['dimensions_game'],after['dimensions_game']))<.001,(before,after)
    assert before['triangles']==after['triangles'],(before,after)
    spec['roundtrip']={'passed':True,'triangles':after['triangles'],'dimensions_game':after['dimensions_game']}
    (OUT/'yuchuan-v8-spec.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
    if opt.preview:preview(OUT/'yuchuan-v8-preview.png');preview(OUT/'yuchuan-v8-cockpit.png',True)
    print('RESULT '+json.dumps(spec,ensure_ascii=False))
if __name__=='__main__':main()
