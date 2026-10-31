# SPDX-License-Identifier: AGPL-3.0-only
# Paraxial imaging and geometric reflection/refraction for reviewed apparatus.
extends RefCounted

func n(p: Dictionary,k: String,d: float) -> float:
	return float(p.get(k,d))
func reading(label: String,value,unit: String="") -> Dictionary:
	return {"label":label,"value":value,"unit":unit}
func answer(model: String,values: Dictionary,readings: Array,steps: Array,conclusion: String,note: String) -> Dictionary:
	return {"model":model,"values":values,"readings":readings,"process":steps,"conclusion":conclusion,"assumptions":note,"solver":"Godot geometric optics solver"}
func step(title: String,text: String) -> Dictionary:
	return {"title":title,"text":text}
func xy(v: Vector2) -> Array:
	return [v.x,v.y]
func solve(model: String,p: Dictionary) -> Dictionary:
	var scenario: String=str(p.get("scenario",""))
	if model=="optics" and scenario=="diffuse":return diffuse(p)
	if model=="optics" and scenario=="mirrorCompare":return mirror_compare(p)
	if model=="optics" and scenario=="prism":return prism(p)
	if model=="lens" and scenario=="correctedEye":return corrected_eye(p)
	if model=="lens" and scenario=="cylinder":return cylinder(p)
	if model=="lens" and scenario=="imagingBench":return imaging_bench(p)
	if model=="measurement" and scenario=="nearPoint":return near_point(p)
	return {}

func diffuse(p: Dictionary) -> Dictionary:
	var incidence: float=clampf(n(p,"angle",30),0,60)
	var roughness: float=clampf(n(p,"roughness",15),0,25)
	var incoming:=Vector2(sin(deg_to_rad(incidence)),cos(deg_to_rad(incidence)))
	var facets: Array=[]
	var offsets: Array=[-0.9,0.6,-0.35,0.9,-0.7,0.1]
	for i in range(offsets.size()):
		var tilt: float=deg_to_rad(roughness*float(offsets[i]))
		var normal:=Vector2(sin(tilt),-cos(tilt))
		var tangent:=Vector2(cos(tilt),sin(tilt))
		var reflected: Vector2=incoming-2.0*incoming.dot(normal)*normal
		var local_i: float=rad_to_deg(acos(clampf(-incoming.dot(normal),-1,1)))
		var local_r: float=rad_to_deg(acos(clampf(reflected.dot(normal),-1,1)))
		facets.append({"position":[float(i),0.0],"tangent":xy(tangent),"normal":xy(normal),"incoming":xy(incoming),"reflected":xy(reflected),"incidence":local_i,"reflection":local_r})
	var response=answer("optics",{"scenario":"diffuse","incidence":incidence,"roughness":roughness},[reading("光束对整体竖直方向夹角",incidence,"°"),reading("表面倾斜幅度",roughness,"°"),reading("各处反射规律","局部入射角＝局部反射角")],[step("确定局部法线","每一小块表面的法线都垂直于该小块。表面粗糙时，各处法线方向不一样。"),step("分别求反射方向","把入射方向沿每一局部法线分解，反射时法向分量反向、切向分量不变。六处都分别计算，不预设反射箭头方向。"),step("对照平整表面","把表面倾斜幅度调为0，各处法线平行，同一入射光束的反射方向也相同。")],"漫反射不是不遵守反射定律；它是许多不同方向的小表面各自按反射定律反射的结果。","六个独立小表面的几何光学示意，不计算表面之间的遮挡和多次反射。入射角和反射角始终相对局部法线测量。")
	response["facets"]=facets
	return response

func mirror_compare(p: Dictionary) -> Dictionary:
	var distance: float=clampf(n(p,"distance",30),10,60)
	var height: float=clampf(n(p,"height",5),2,10)
	var second: float=clampf(n(p,"secondDistance",25),10,60)
	var eye_height: float=clampf(n(p,"eyeHeight",15),2,30)
	var screen: bool=bool(p.get("screen",false))
	var matched: bool=absf(second-distance)<=0.5
	var rays: Array=[]
	for object_height in [0.0,height]:
		var mirror_height: float=eye_height+(object_height-eye_height)*40.0/(distance+40.0)
		rays.append({"object":[-distance,object_height],"mirror":[0,mirror_height],"eye":[-40,eye_height],"image":[distance,object_height]})
	var response=answer("optics",{"scenario":"mirrorCompare","objectDistance":distance,"imageDistance":distance,"height":height,"secondDistance":second,"eyeHeight":eye_height,"matched":matched,"screen":screen,"screenImage":false,"real":false},[reading("物到镜面的距离",distance,"cm"),reading("替代蜡烛到镜面距离",second,"cm"),reading("替代蜡烛位置","与像重合（±0.5 cm示意容差）" if matched else "尚未与像重合"),reading("光屏检验","镜后光屏不能承接虚像" if screen else "未放置光屏")],[step("放置并观察","用同样大小的两支蜡烛。前方点燃的蜡烛作为物体，透过薄玻璃板观察其像。"),step("移动替代蜡烛","调节镜后未点燃蜡烛的位置，直到它与看到的像重合；再改变观察高度复核重合位置。"),step("比较距离与大小","当前物距%.2f cm，替代蜡烛距镜面%.2f cm；重合时可比较像物等大、像距与物距相等。"%[distance,second]),step("用光屏检验","在像的位置放光屏：光屏上不能出现这个像，说明反射光线未在镜后实际会聚。虚线只是反射光线的反向延长线。")],"平面镜成正立、等大的虚像，像与物关于镜面对称；观察者改变位置不会改变像的位置。","理想薄玻璃板的前表面反射，忽略厚玻璃板产生的重影。光线由Godot按对称关系求交；替代蜡烛滑块是位置操作，±0.5 cm仅为屏幕判断容差。")
	response["rays"]=rays
	return response

# The normal points into the second optical medium. Both vectors are unit vectors.
func refract_direction(direction: Vector2,normal: Vector2,n1: float,n2: float) -> Dictionary:
	var tangential: Vector2=(direction-normal*direction.dot(normal))*(n1/n2)
	var sine_squared: float=tangential.length_squared()
	if sine_squared>1.0+0.0000001:return {"tir":true,"direction":direction-2.0*direction.dot(normal)*normal}
	return {"tir":false,"direction":tangential+normal*sqrt(maxf(0,1.0-sine_squared))}
func intersect_ray(origin: Vector2,direction: Vector2,a: Vector2,b: Vector2) -> Dictionary:
	var edge: Vector2=b-a
	var cross: float=direction.cross(edge)
	if absf(cross)<0.0000001:return {}
	var t: float=(a-origin).cross(edge)/cross
	var u: float=(a-origin).cross(direction)/cross
	if t<0.00001 or u<0 or u>1:return {}
	return {"point":origin+t*direction,"distance":t}
func prism(p: Dictionary) -> Dictionary:
	var incidence: float=clampf(n(p,"incidence",50),30,65)
	var apex: float=clampf(n(p,"apex",60),50,65)
	var half: float=deg_to_rad(apex/2.0)
	var width: float=2.0*tan(half)
	var tip:=Vector2(0,-1)
	var left:=Vector2(-width,1)
	var right:=Vector2(width,1)
	var first:=Vector2(-width/2.0,0)
	var normal_in:=Vector2(cos(half),sin(half))
	var incoming:=Vector2(cos(half-deg_to_rad(incidence)),sin(half-deg_to_rad(incidence)))
	var surfaces: Array=[{"a":tip,"b":right,"normal":Vector2(cos(half),-sin(half))},{"a":right,"b":left,"normal":Vector2(0,1)},{"a":left,"b":tip,"normal":-normal_in}]
	var colors: Array=[{"name":"红","color":"#c05245","n":1.510},{"name":"橙","color":"#d18337","n":1.514},{"name":"黄","color":"#c2a035","n":1.517},{"name":"绿","color":"#5c9364","n":1.521},{"name":"蓝","color":"#4f8fb4","n":1.525},{"name":"紫","color":"#9469a4","n":1.530}]
	var readings: Array=[]
	var rays: Array=[]
	for color in colors:
		var entry=refract_direction(incoming,normal_in,1.0,color.n)
		var direction: Vector2=entry.direction
		var origin: Vector2=first
		var segments: Array=[[xy(first-incoming*1.7),xy(first)]]
		var local_i: float=rad_to_deg(acos(clampf(incoming.dot(normal_in),-1,1)))
		var r1: float=rad_to_deg(acos(clampf(direction.dot(normal_in),-1,1)))
		var second_i: float=0.0
		var second_r=null
		var reflection_count: int=0
		var deviation=null
		for bounce in range(6):
			var nearest: Dictionary={}
			for surface in surfaces:
				var hit=intersect_ray(origin,direction,surface.a,surface.b)
				if not hit.is_empty() and (nearest.is_empty() or hit.distance<nearest.distance):
					nearest=hit;nearest["normal"]=surface.normal
			if nearest.is_empty():break
			var hit: Vector2=nearest.point
			segments.append([xy(origin),xy(hit)])
			var boundary_i: float=rad_to_deg(acos(clampf(direction.dot(nearest.normal),-1,1)))
			var bend=refract_direction(direction,nearest.normal,color.n,1.0)
			if bounce==0:second_i=boundary_i
			if not bend.tir:
				var output: Vector2=bend.direction
				segments.append([xy(hit),xy(hit+output*1.7)])
				if bounce==0:
					second_r=rad_to_deg(acos(clampf(output.dot(nearest.normal),-1,1)))
					deviation=incidence+second_r-apex
				break
			reflection_count+=1
			direction=bend.direction
			origin=hit
		rays.append({"name":color.name,"color":color.color,"refractiveIndex":color.n,"segments":segments,"incidence":local_i,"firstRefraction":r1,"secondIncidence":second_i,"secondRefraction":second_r,"deviation":deviation,"internalReflections":reflection_count})
		readings.append(reading(color.name+"光偏向角",deviation,"°") if deviation!=null else reading(color.name+"光路径","发生全反射后经其他界面出射"))
	var response=answer("optics",{"scenario":"prism","incidence":incidence,"apex":apex,"givenIndices":true},readings,[step("说明材料数据","本题给定六个单色光的折射率1.510～1.530，用来表示正常色散；不是某块真实玻璃的光谱标定。"),step("第一次折射","空气进入棱镜：sin i＝n sin r₁。每种颜色分别求折射方向。"),step("第二次折射","棱镜进入空气：n sin r₂＝sin e；棱镜两斜面满足r₁＋r₂＝顶角A。若n sin r₂大于1，则发生全反射，继续追踪后续界面。"),step("比较偏折","直接从第二斜面出射时，偏向角δ＝i＋e－A。改变入射角或顶角，重新比较各颜色的实际路径。")],"白光包含不同颜色的光；正常色散中，折射率不同会使各色光经过棱镜后的传播方向不同。","二维几何光学、空气折射率1、题设均匀三棱镜。颜色是离散示意，不是连续光谱。没有把单界面偏折当作完整棱镜偏向角；全反射后不再套用直接出射的偏向角公式。")
	response["prismVertices"]=[xy(tip),xy(right),xy(left)]
	response["rays"]=rays
	return response

func corrected_eye(p: Dictionary) -> Dictionary:
	var kind: String=str(p.get("type","myopia"))
	var distance: float=clampf(n(p,"objectDistance",5.0 if kind=="myopia" else 0.25),0.25,5.0)
	var eye_power: float=clampf(n(p,"eyePower",62.0 if kind=="myopia" else 56.0),50.0,66.0)
	var enabled: bool=bool(p.get("withLens",false))
	var prescribed: float=clampf(n(p,"correctionPower",0),-10,10)
	var spectacle_power: float=prescribed if enabled else 0.0
	var gap: float=0.012
	var retina: float=0.017
	var target_vergence: float=1.0/retina-eye_power
	var required: float=target_vergence/(1.0+gap*target_vergence)+1.0/(distance-gap)
	var ray_ys: Array=[-0.002,0.0,0.002]
	var rays: Array=[]
	var focus=null
	var retinal_spread: float=0.0
	for ray_y in ray_ys:
		var input_slope: float=ray_y/(distance-gap)
		var after_lens_slope: float=input_slope-spectacle_power*ray_y
		var eye_y: float=ray_y+gap*after_lens_slope
		var after_eye_slope: float=after_lens_slope-eye_power*eye_y
		var retina_y: float=eye_y+retina*after_eye_slope
		if absf(after_eye_slope)>0.000000001:focus=-eye_y/after_eye_slope
		retinal_spread=maxf(retinal_spread,absf(retina_y))
		rays.append({"points":[[-0.03,ray_y+(-0.03+gap)*input_slope],[-gap,ray_y],[0.0,eye_y],[retina,retina_y],[0.026,eye_y+0.026*after_eye_slope]],"retinaY":retina_y})
	var focused: bool=focus!=null and absf(focus-retina)<=0.00015
	var position: String="落在视网膜附近" if focused else "在视网膜前" if focus!=null and focus<retina else "在视网膜后"
	var response=answer("lens",{"scenario":"correctedEye","type":kind,"objectDistance":distance,"eyePower":eye_power,"withLens":enabled,"correctionPower":prescribed,"effectiveCorrectionPower":spectacle_power,"recommendedPower":required,"lensGap":gap,"retinaDistance":retina,"imageDistance":focus,"focused":focused,"retinalSpread":retinal_spread,"focusPosition":position},[reading("物距",distance,"m"),reading("矫正镜屈光度",spectacle_power,"D"),reading("眼内模型像距",focus*1000.0 if focus!=null else null,"mm"),reading("视网膜距眼内透镜",retina*1000.0,"mm"),reading("对焦判断",position),reading("本题理想对焦所需屈光度",required,"D")],[step("比较未矫正状态","先取下矫正镜，观察该物距与题设眼球屈光力下，光线会聚点相对视网膜的位置。"),step("调节矫正镜","戴上矫正镜，改变屈光度。负屈光度为凹透镜，正屈光度为凸透镜；先改变入眼光线，再经眼内透镜折射。"),step("分段追踪光线（拓展）","近轴模型中，每过薄透镜，光线斜率θ变为θ－Py；在两透镜间传播d后，高度变为y＋dθ。本题眼镜与眼内透镜相距12 mm，视网膜距离17 mm。"),step("判读结果","当前像距为%s mm，%s。光线在视网膜处越接近会聚，模型散焦越小。"%[str(focus*1000.0) if focus!=null else "无有限值",position])],"凹透镜可使过早会聚的入眼光先发散；凸透镜可增加入眼光的会聚能力。应以是否落到视网膜判断本题是否矫正。","两个薄透镜的近轴模型，参数均为题设，不代表人的完整眼球和调节功能。显示的理想对焦屈光度仅用于本题，不是个人验光或配镜处方。±0.15 mm为画面判断容差。")
	response["rays"]=rays
	return response

func cylinder(p: Dictionary) -> Dictionary:
	var focal: float=clampf(n(p,"focal",8),4,15)
	var distance: float=clampf(n(p,"distance",4),2,20)
	var denominator: float=1.0/focal-1.0/distance
	var at_focus: bool=absf(denominator)<0.000001
	var image_distance=null if at_focus else 1.0/denominator
	var magnification=null if at_focus else -image_distance/distance
	return answer("lens",{"scenario":"cylinder","focal":focal,"objectDistance":distance,"imageDistance":image_distance,"horizontalMagnification":magnification,"verticalMagnification":1.0,"atFocus":at_focus,"real":image_distance!=null and image_distance>0},[reading("水平截面焦距",focal,"cm"),reading("物距",distance,"cm"),reading("水平方向放大率",magnification),reading("竖直方向放大率",1.0)], [step("识别曲面方向","圆柱形水瓶侧壁在水平截面弯曲，竖直方向近似不弯曲。不能把它当成两个方向焦距都相同的球面透镜。"),step("比较文字宽高","保持文字高度，改变瓶与文字的距离，比较横向放大、缩小或反向。"),step("计算示例（拓展）","水平方向用题设薄柱透镜关系1/f＝1/u＋1/v，m横＝－v/u；竖直方向取m纵＝1。当前f＝%.2f cm，u＝%.2f cm。"%[focal,distance])],"圆柱形瓶的曲面主要改变横向光路；文字宽度与高度的变化可以不同。","用题设焦距的理想薄柱透镜解释圆柱瓶现象，忽略厚壁、像差和瓶底曲面。焦点处没有有限距离的清晰像；瓶内窗口裁切超出视野的文字，不伪造有限放大率。")

func near_point(p: Dictionary) -> Dictionary:
	var distance: float=clampf(n(p,"observedDistance",15),5,50)
	var trial2: float=clampf(n(p,"trial2",15),5,50)
	var trial3: float=clampf(n(p,"trial3",16),5,50)
	var clear: bool=str(p.get("clarity","clear"))=="clear"
	var mean=null if not clear else (distance+trial2+trial3)/3.0
	return answer("measurement",{"scenario":"nearPoint","observedDistance":distance,"trial2":trial2,"trial3":trial3,"clear":clear,"average":mean,"personalObservation":true},[reading("第一次记录",distance,"cm"),reading("本次主观判断","清楚" if clear else "模糊，不能把此距离记作清晰近点"),reading("三次记录的平均值",mean,"cm")],[step("本人观察与测量","在舒适光照下观察实际文字，缓慢改变眼与文字的距离，记录最近仍能看清的位置。网页滑块只记录你测得的距离，不会测出你的视力。"),step("复核记录","第一次%.2f cm，第二次%.2f cm，第三次%.2f cm。只有每一次都确认是最近的清晰位置，才可作为近点记录。"%[distance,trial2,trial3]),step("整理多次结果","平均距离＝(%.2f＋%.2f＋%.2f)/3＝%.2f cm。"%[distance,trial2,trial3,mean] if clear else "本次标记为模糊，先重新确认最近的清晰位置；不输出虚构近点均值。")],"近点由本人实际观察确定，重复测量可比较记录的一致性；不能由一次近点测量判断眼睛是否近视或健康。","个人观察记录工具，不建立人的清晰/模糊阈值模型；网页示意距离不是屏幕到眼睛的实际距离。")

func imaging_bench(p: Dictionary) -> Dictionary:
	var focal: float=clampf(n(p,"focal",10),5,30)
	var distance: float=clampf(n(p,"distance",30),1,80)
	var height: float=clampf(n(p,"height",3),1,10)
	var screen: float=clampf(n(p,"screenDistance",25),2,120)
	var denominator: float=1.0/focal-1.0/distance
	var at_focus: bool=absf(denominator)<0.0000001
	var image=null if at_focus else 1.0/denominator
	var magnification=null if at_focus else -image/distance
	var focused: bool=image!=null and image>0 and absf(image-screen)<=0.5
	var rays: Array=[]
	var screen_min: float=INF
	var screen_max: float=-INF
	for lens_height in [-2.0,0.0,2.0]:
		var input_slope: float=(lens_height-height)/distance
		var output_slope: float=input_slope-lens_height/focal
		var screen_height: float=lens_height+screen*output_slope
		screen_min=minf(screen_min,screen_height);screen_max=maxf(screen_max,screen_height)
		rays.append({"points":[[-distance,height],[0.0,lens_height],[screen,screen_height]],"virtualExtension":[[0.0,lens_height],[image,height*magnification]] if image!=null and image<0 else []})
	var conclusion: String="光屏位于实像位置附近，能观察到倒立的清晰像。" if focused else "光屏尚未移到实像位置，继续调节屏距寻找清晰像。" if image!=null and image>0 else "物在焦点处，出射光平行，有限距离光屏不能得到清晰像。" if at_focus else "物距小于焦距，形成正立放大虚像，移动镜后光屏不能承接。"
	var response=answer("lens",{"scenario":"imagingBench","focal":focal,"objectDistance":distance,"height":height,"screenDistance":screen,"imageDistance":image,"imageHeight":height*magnification if image!=null else null,"magnification":magnification,"focused":focused,"atFocus":at_focus,"real":image!=null and image>0,"screenMin":screen_min,"screenMax":screen_max,"screenSpread":screen_max-screen_min,"screenCenter":(screen_max+screen_min)/2.0},[reading("物距",distance,"cm"),reading("独立光屏距离",screen,"cm"),reading("理论像距",image,"cm"),reading("像的放大率",magnification),reading("光屏观察","清晰倒立像" if focused else "光斑，未清晰成像" if image!=null and image>0 else "没有可承接的实像")],[step("先移动物体","使光源中心、透镜光心与光屏中心近似同高。改变物距，分别比较u>2f、f<u<2f、u=f与u<f。"),step("独立移动光屏","屏距不是理论像距的自动复制。拖动屏距，观察不同光线在光屏上是否会聚到同一点。"),step("用关系检验（拓展）","1/f＝1/u＋1/v；f＝%.2f cm，u＝%.2f cm。有限实像时，将实测屏距与理论像距比较。"%[focal,distance]),step("写出像的性质",conclusion)],conclusion,"理想薄凸透镜、近轴光线；光源顶端三条示意光线通过透镜不同高度。光屏在理论像距±0.5 cm内判为清晰，这是操作容差。图外光线被视口裁切，不改变理论像距。")
	response["rays"]=rays
	return response
