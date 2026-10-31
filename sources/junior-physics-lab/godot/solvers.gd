extends Node

const ExtraSolvers = preload("res://extra_solvers.gd")
var extra_solver = ExtraSolvers.new()
const RulerSolver = preload("res://ruler_solver.gd")
var ruler_solver = RulerSolver.new()
const SoundSolver = preload("res://sound_solver.gd")
var sound_solver = SoundSolver.new()
const InductionSolver = preload("res://induction_solver.gd")
var induction_solver = InductionSolver.new()
const ElectricalReview = preload("res://electrical_review.gd")
var electrical_review = ElectricalReview.new()
const ClassroomReview = preload("res://classroom_review.gd")
var classroom_review = ClassroomReview.new()
const OpticsReview = preload("res://optics_review.gd")
var optics_review = OpticsReview.new()
const DeformationReview = preload("res://deformation_review.gd")
var deformation_review = DeformationReview.new()
const MeasurementReview = preload("res://physics_measurement_review.gd")
var measurement_review = MeasurementReview.new()
const FluidDensityReview = preload("res://fluid_density_review.gd")
var fluid_density_review = FluidDensityReview.new()

const G = 9.8

func number(p: Dictionary, key: String, fallback: float) -> float:
	var v = p.get(key, fallback)
	return float(v) if v is int or v is float or str(v).is_valid_float() else fallback

func reading(label: String, value, unit: String = "") -> Dictionary:
	return {"label": label, "value": value, "unit": unit}

func result(model: String, values: Dictionary, readings: Array, formula: String, substitution: String, conclusion: String, note: String, graph: Dictionary = {}) -> Dictionary:
	return {"model": model, "values": values, "readings": readings, "process": [{"title": "原理", "text": formula}, {"title": "代入与分析", "text": substitution}, {"title": "结果", "text": conclusion}], "conclusion": conclusion, "assumptions": note, "graph": graph, "solver": "Godot scientific solver"}

func graph(xlabel: String, ylabel: String, points: Array) -> Dictionary:
	return {"xLabel": xlabel, "yLabel": ylabel, "points": points}

func solve(model: String, p: Dictionary) -> Dictionary:
	var fluid_result=fluid_density_review.solve(model,p)
	if not fluid_result.is_empty():return fluid_result
	var measured_result=measurement_review.solve(model,p)
	if not measured_result.is_empty():return measured_result
	if model=="force" and str(p.get("scenario",""))=="deformation":return deformation_review.solve(p)
	var optical_result=optics_review.solve(model,p)
	if not optical_result.is_empty():return optical_result
	if classroom_review.can_handle(model,str(p.get("scenario",""))):
		return classroom_review.evaluate(model,p)
	if electrical_review.can_handle(model,str(p.get("scenario",""))):
		return electrical_review.evaluate(model,p)
	if model in ["sound","force"] and p.get("scenario","")=="ruler":
		return ruler_solver.solve(model,p)
	var specific=extra_solver.solve(model,p)
	if not specific.is_empty():return specific
	var scenario = str(p.get("scenario", ""))
	match model:
		"measurement": return measurement(p, scenario)
		"sound": return sound_solver.solve(p, scenario)
		"thermal": return thermal(p, scenario)
		"phase": return phase(p, scenario)
		"density": return density(p, scenario)
		"optics": return optics(p, scenario)
		"lens": return lens(p, scenario)
		"force", "spring": return force(p, scenario, model)
		"pressure": return pressure(p, scenario)
		"buoyancy": return buoyancy(p, scenario)
		"lever", "pulley", "work", "energy": return machinery(p, scenario, model)
		"molecular": return molecular(p, scenario)
		"charge": return charge(p, scenario)
		"circuit": return circuit(p, scenario)
		"joule": return joule(p, scenario)
		"household": return household(p, scenario)
		"induction": return induction_solver.solve(p,scenario)
		"magnet", "emwave": return electromagnetism(p, scenario, model)
	return {"error": "未知物理模型：" + model}

func measurement(p: Dictionary, scenario: String) -> Dictionary:
	var value = number(p, "value", 12.34)
	var division = maxf(number(p, "division", 0.1), 0.0001)
	var zero = number(p, "zero", 0.0)
	var indicated = round((value + zero) / division) * division
	var corrected = indicated - zero
	var units = {"length": "cm", "time": "s", "volume": "mL", "temperature": "℃", "balance": "g"}
	var unit = units.get(scenario, "cm")
	var response = result("measurement", {"actual": value, "division": division, "indicated": indicated, "corrected": corrected, "zero": zero}, [reading("仪表示数", indicated, unit), reading("修正值", corrected, unit), reading("分度值", division, unit)], "分度值由相邻标线差值确定；修正值＝示数－零点偏移。", "%s − %s = %s %s" % [indicated, zero, corrected, unit], "先认清量程和分度值，再读数；存在零点偏移时应修正。", "示数取至分度值；实际模拟刻度不代表随机测量误差。估读要求以具体仪器为准。")

	var count = int(number(p,"count",0))
	if count>0:
		var average = corrected/count
		response.values["count"]=count
		response.values["average"]=average
		response.readings.append(reading("累积法平均值",average,unit))
		response.process.append({"title":"用累积法求平均值","text":"将修正后的总量除以个数：%s %s ÷ %s＝%s %s。该值为单个平均量，不能当作每个样本完全相同。"%[corrected,unit,count,average,unit]})
		if scenario=="time" and corrected>0:
			response.values["perMinute"]=60.0*count/corrected
			response.readings.append(reading("折合每分钟次数",response.values.perMinute,"次/min"))
			response.process.append({"title":"统一为每分钟次数","text":"一分钟为60 s，每分钟次数＝60N/t＝60×%s/%s≈%.2f次/min。须与实际计数N配对，不能把未计数的默认值当测量。"%[count,corrected,response.values.perMinute]})
	return response

func thermal(p: Dictionary, scenario: String) -> Dictionary:
	if scenario in ["compression", "expansion"]:
		var initial_c=number(p,"initial",20)
		var ratio=maxf(number(p,"compressionRatio",2),1)
		var gamma=clampf(number(p,"gamma",1.4),1.01,1.67)
		var t1=maxf(initial_c+273.15,1)
		var t2=t1*pow(ratio,gamma-1) if scenario=="compression" else t1/pow(ratio,gamma-1)
		var gas_mass=maxf(number(p,"mass",.01),.000001)
		var cv=maxf(number(p,"capacity",718),.001)
		var delta_u=gas_mass*cv*(t2-t1)
		return result("thermal",{"initial":initial_c,"temperature":t2-273.15,"ratio":ratio,"workOnGas":delta_u,"deltaU":delta_u,"heat":0},[reading("初温",initial_c,"℃"),reading("模型末温",t2-273.15,"℃"),reading("内能变化",delta_u,"J")],"绝热理想气体满足 TV^(γ−1)＝常量；不传热时对气体做的功等于内能变化。","体积比 %s，γ＝%s，温度换算为 K 后计算。" %[ratio,gamma],"压缩气体做功，气体内能增加、温度升高。" if scenario=="compression" else "气体膨胀对外做功，内能减少、温度降低。","理想气体绝热可逆模型，γ取常数；初中实验侧重温度变化方向，数值属于拓展计算而非实测。")
	var mass = maxf(number(p, "mass", 1), 0.0001)
	var c = maxf(number(p, "capacity", 4200), 0.0001)
	var power = maxf(number(p, "power", 500), 0)
	var time = maxf(number(p, "time", 120), 0)
	var initial = number(p, "initial", 20)
	var heat = power * time
	var final = initial + heat / (mass * c)
	var points = []
	var formula = "Q＝Pt＝cmΔt；Δt＝Q/(cm)。"
	var conclusion = "质量、吸收热量相同时，比热容越大，温度升高越少。"
	var values = {"heat": heat, "temperature": final, "rise": final - initial, "mass": mass, "capacity": c, "power": power}
	if scenario == "mixing":
		var mass2 = maxf(number(p, "mass2", 1), 0.0001)
		var c2 = maxf(number(p, "capacity2", c), 0.0001)
		var t2 = number(p, "temperature2", 80)
		final = (mass * c * initial + mass2 * c2 * t2) / (mass * c + mass2 * c2)
		heat = mass * c * (final - initial)
		values.merge({"temperature": final, "heat": heat, "rise": final-initial, "temperature2": t2}, true)
		formula = "不计散热：高温物体放出的热量＝低温物体吸收的热量。"
		conclusion = "平衡温度位于两物体初温之间，按热容量加权。"
	elif scenario == "engine":
		var efficiency = clampf(number(p, "efficiency", 30), 0, 100) / 100
		var useful = heat * efficiency
		return result("thermal", {"heat": heat, "useful": useful, "lost": heat-useful, "efficiency": efficiency*100}, [reading("输入热量", heat,"J"),reading("有用机械能",useful,"J"),reading("效率",efficiency*100,"%")],"η＝有用机械能/燃料释放能量。","%s × %s = %s J" %[heat,efficiency,useful],"热机只将部分内能转化为机械能。","按给定效率计算能量分配，不模拟燃烧细节。")
	elif scenario == "conduction":
		var conductivity = maxf(number(p,"conductivity",1),0)
		return result("thermal",{"conductivity":conductivity,"temperature":initial,"temperature2":number(p,"temperature2",80)},[reading("导热能力（相对量）",conductivity)],"热量自发从高温物体传向低温物体。","比较两端温度与材料导热能力。","热传递改变内能；达到热平衡后净热传递停止。","导热能力为相对量，不伪造真实材料热流测量。")
	for i in range(31):
		var t = time * i / 30.0
		points.append([t, initial + (final-initial)*i/30.0])
	return result("thermal", values, [reading("吸收热量", heat, "J"),reading("末温",final,"℃"),reading("温升", final-initial,"℃")], formula, "m＝%s kg，c＝%s J/(kg·℃)，Q＝%s J。" % [mass,c,heat],conclusion,"不计散热和相变；涉及熔化或沸腾时应使用物态变化模型。",graph("加热时间 / s","温度 / ℃",points))

func water_state(energy: float, mass: float, boiling: float) -> Dictionary:
	var fusion = mass * 334000.0
	var liquid_top = fusion + mass * 4200.0 * boiling
	var vapor_top = liquid_top + mass * 2260000.0
	if energy < 0: return {"temperature":energy/(mass*2100.0),"phase":"冰","fraction":0.0}
	if energy < fusion: return {"temperature":0.0,"phase":"冰水共存","fraction":energy/fusion}
	if energy < liquid_top: return {"temperature":(energy-fusion)/(mass*4200.0),"phase":"液态水","fraction":0.0}
	if energy < vapor_top: return {"temperature":boiling,"phase":"水和水蒸气共存","fraction":(energy-liquid_top)/(mass*2260000.0)}
	return {"temperature":boiling+(energy-vapor_top)/(mass*2000.0),"phase":"水蒸气","fraction":1.0}

func phase(p: Dictionary, scenario: String) -> Dictionary:
	var mass = maxf(number(p,"mass",.1),.0001)
	var power = maxf(number(p,"power",100),0)
	var time = maxf(number(p,"time",100),0)
	var initial = number(p,"initial",-10)
	var pressure = clampf(number(p,"pressure",101.3), 20, 150)
	var boiling = 1730.63/(8.07131-log(pressure*7.50062)/log(10.0))-233.426
	if scenario in ["evaporation","sublimation"]:
		var area = maxf(number(p,"area",1),0)
		var airflow = maxf(number(p,"airflow",1),0)
		var tendency = area * (1+airflow) * exp((initial-20)/40)
		return result("phase",{"tendency":tendency,"temperature":initial,"area":area,"airflow":airflow,"phase":"固态直接变气态" if scenario=="sublimation" else "液态变气态"},[reading("温度",initial,"℃"),reading("液面面积（相对量）",area),reading("空气流动（相对量）",airflow)],"蒸发在任何温度下均可发生；温度、表面积和空气流动影响蒸发快慢。","改变一个条件，比较变化趋势。","升华是固态直接变为气态，需要吸热。" if scenario=="sublimation" else "提高温度、增大液面面积或加快空气流动，通常可加快蒸发。","趋势指数仅用于示意，不是实测蒸发质量、速率或升华实验数据。")
	var initial_energy = mass*2100*initial if initial<0 else mass*334000+mass*4200*initial
	var direction = -1.0 if scenario in ["freezing","condensation"] else 1.0
	if scenario=="condensation": initial_energy = mass*334000+mass*4200*boiling+mass*2260000+mass*2000*maxf(initial-boiling,0)
	var energy = initial_energy+direction*power*time
	var state = water_state(energy,mass,boiling)
	var points=[]
	var phase_states=[]
	for i in range(61):
		var t=time*i/60.0
		var current_state=water_state(initial_energy+direction*power*t,mass,boiling)
		points.append([t,current_state.temperature])
		phase_states.append({"time":t,"temperature":current_state.temperature,"phase":current_state.phase,"fraction":current_state.fraction})
	var response=result("phase",{"temperature":state.temperature,"phase":state.phase,"fraction":state.fraction,"heat":power*time,"boilingPoint":boiling,"pressure":pressure},[reading("温度",state.temperature,"℃"),reading("物态",state.phase),reading("吸收/放出热量",power*time,"J")],"升温或降温时 Q＝cmΔt；晶体相变阶段吸放热而温度保持不变。","功率 %s W，时间 %s s；水的沸点约 %s ℃。" %[power,time,snappedf(boiling,.1)],"当前状态：%s。相变过程中的平台不表示没有吸收或放出热量。" %state.phase,"水/冰理想焓模型，不计容器吸热和散热。熔化热、汽化热取近似常数，沸点按水蒸气压关系估算。",graph("时间 / s","温度 / ℃",points))
	response["phaseStates"]=phase_states
	return response

func density(p: Dictionary, scenario: String) -> Dictionary:
	var mass=maxf(number(p,"mass",54),0)
	var volume=maxf(number(p,"volume",20),.0001)
	var void_volume=clampf(number(p,"voidVolume",0),0,volume-.0001)
	var rho=mass/volume
	var material_density=mass/(volume-void_volume)
	return result("density",{"mass":mass,"volume":volume,"density":rho,"densitySI":rho*1000,"materialDensity":material_density,"finalVolume":number(p,"initialVolume",40)+volume,"voidVolume":void_volume},[reading("质量",mass,"g"),reading("体积",volume,"cm³"),reading("平均密度",rho,"g/cm³")],"ρ＝m/V；1 g/cm³＝1000 kg/m³。","%s g ÷ %s cm³ = %s g/cm³。" %[mass,volume,rho],"同种均匀物质在相同状态下，密度与取样质量、体积无关。","排水法适用于不溶于水且不明显吸水的物体；空心物体的整体平均密度不同于材料密度。")

func optics(p: Dictionary, scenario: String) -> Dictionary:
	var angle=clampf(number(p,"angle",30),0,89.9)
	var n1=maxf(number(p,"n1",1),1)
	var n2=maxf(number(p,"n2",1.5),1)
	var distance=maxf(number(p,"distance",30),.001)
	var screen=maxf(number(p,"screen",20),.001)
	var height=maxf(number(p,"height",5),0)
	var refracted_sine=n1*sin(deg_to_rad(angle))/n2
	var tir=refracted_sine>1
	var refraction=null if tir else rad_to_deg(asin(refracted_sine))
	var critical=rad_to_deg(asin(n2/n1)) if n1>n2 else null
	var values={"incidence":angle,"reflection":angle,"refraction":refraction,"critical":critical,"tir":tir,"n1":n1,"n2":n2,"distance":distance,"screen":screen,"height":height}
	var reads=[reading("入射角",angle,"°"),reading("反射角",angle,"°")]
	var formula="反射角等于入射角，角度均相对法线测量。"
	var conclusion="反射光线、入射光线和法线在同一平面内，反射角等于入射角。"
	var substitution="入射角为 %s°，所以反射角也为 %s°；均从法线开始量角。"%[angle,angle]
	if scenario in ["refraction","dispersion","fiber"]:
		reads.append(reading("折射角",refraction,"°"))
		substitution="入射角 %s°，n₁=%s，n₂=%s；sin r=n₁ sin i/n₂=%s。"%[angle,n1,n2,refracted_sine]
		formula="n₁ sin i＝n₂ sin r；光从光密介质进入光疏介质才可能全反射。"
		conclusion="入射角超过临界角，发生全反射。" if tir else "折射率较大的介质中，折射光线更靠近法线。"
		if scenario=="dispersion":
			values["redAngle"]=rad_to_deg(asin(clampf(n1*sin(deg_to_rad(angle))/1.514, -1,1)))
			values["violetAngle"]=rad_to_deg(asin(clampf(n1*sin(deg_to_rad(angle))/1.532,-1,1)))
			conclusion="玻璃对不同色光的折射程度不同；此示意中紫光折射偏折比红光大。"
			reads=[reading("入射角",angle,"°"),reading("红光折射角",values.redAngle,"°"),reading("紫光折射角",values.violetAngle,"°")]
			substitution="只计算进入玻璃的第一个界面：红光折射率取1.514、紫光取1.532；折射角分别约%s°和%s°。完整三棱镜的总偏折还需第二界面。"%[values.redAngle,values.violetAngle]
	elif scenario=="mirror":
		values["imageDistance"]=-distance
		values["imageHeight"]=height
		reads=[reading("物距",distance,"cm"),reading("像距大小",distance,"cm"),reading("像高",height,"cm")]
		formula="平面镜成像：像与物到镜面距离相等，像与物等大。"
		substitution="物到镜面的距离为%s cm，所以虚像到镜面的距离也为%s cm；物高为%s cm，像高也为%s cm。"%[distance,distance,height,height]
		conclusion="像位于镜后，是正立、等大的虚像，物像连线垂直镜面。"
	elif scenario=="pinhole":
		values["imageHeight"]=-height*screen/distance
		reads=[reading("物距",distance,"cm"),reading("光屏距离",screen,"cm"),reading("像高大小",abs(values.imageHeight),"cm")]
		formula="相似三角形：像高/物高＝孔到光屏距离/物到孔距离。"
		substitution="像高大小=物高×像距/物距=%s×%s/%s=%s cm；负的像高表示相对物体倒立。"%[height,screen,distance,abs(values.imageHeight)]
		conclusion="小孔成倒立实像，像的形状由物体决定；像大小取决于物距与像距。"
	elif scenario in ["straight","shadow"]:
		values["shadowHeight"]=height*(distance+screen)/distance
		formula="光在同种均匀介质中沿直线传播。"
		conclusion="遮光物阻挡光线，在后方形成影子；本图按点光源近似。"
		reads=[reading("光源到物体",distance,"cm"),reading("物体到光屏",screen,"cm"),reading("物体高度",height,"cm"),reading("影子高度",values.shadowHeight,"cm")]
		substitution="点光源模型中，影高/物高=(光源到光屏距离)/(光源到物体距离)；影高=%s×(%s+%s)/%s=%s cm。"%[height,distance,screen,distance,values.shadowHeight]
		if scenario=="straight":
			values.beamAngle=number(p,"angle",15)
			reads=[reading("介质条件","同种、均匀"),reading("介质内部光路","直线")]
			substitution="只比较均匀介质内部的传播段；改变光束方向后，介质内各段仍为直线。"
			conclusion="光在同种均匀介质中沿直线传播；介质均匀是不能省略的条件。"
	return result("optics",values,reads,formula,substitution,conclusion,"几何光学模型；不计衍射、吸收与色散以外的材料细节。")

func lens(p: Dictionary, scenario: String) -> Dictionary:
	var f=maxf(number(p,"focal",10),.001)
	if scenario in ["concave","myopia"]: f=-f
	var u=maxf(number(p,"distance",30),.001)
	var h=maxf(number(p,"height",3),0)
	var denominator=1/f-1/u
	var at_focus=abs(denominator)<.000001
	var v=null if at_focus else 1/denominator
	var magnification=null if at_focus else -v/u
	var image_height=null if at_focus else h*magnification
	var nature="光线平行射出，不能在有限远光屏上成清晰像" if at_focus else ("倒立实像" if v>0 else "正立虚像")
	var points=[]
	for i in range(1,81):
		var obj=float(i)
		if abs(1/f-1/obj)>.002: points.append([obj,1/(1/f-1/obj)])
	var response = result("lens",{"focal":f,"objectDistance":u,"imageDistance":v,"magnification":magnification,"imageHeight":image_height,"atFocus":at_focus,"real":v!=null and v>0,"nature":nature},[reading("物距",u,"cm"),reading("像距",v,"cm"),reading("放大率",magnification)],"薄透镜公式 1/f＝1/u＋1/v；放大率 m＝−v/u。","f＝%s cm，u＝%s cm。" %[f,u],nature+"。","理想薄透镜；v<0表示虚像位于物体同侧，负放大率表示倒立。矫正镜只示意会聚/发散作用。",graph("物距 / cm","像距 / cm",points))

	response.values["relativeTransmission"]=1.0-clampf(number(p,"cover",0),0,100)/100.0
	if p.has("screenDistance"):
		var screen = number(p,"screenDistance",15)
		response.values["screenDistance"]=screen
		response.values["focused"]=v!=null and v>0 and absf(v-screen)<=0.5
		response.readings.append(reading("光屏位置",screen,"cm"))
		response.readings.append(reading("光屏观察","在示意容差内清晰成像" if response.values.focused else "未在光屏上清晰成像"))
	return response

func force(p: Dictionary, scenario: String, model: String) -> Dictionary:
	var mass=maxf(number(p,"mass",1),0)
	var f=number(p,"force",10)
	var f2=number(p,"force2",10)
	if model=="spring":
		var k=maxf(number(p,"stiffness",100),.001)
		var limit=maxf(number(p,"limit",10),.001)
		var valid=abs(f)<=limit
		var extension=f/k if valid else null
		var points=[]
		for i in range(21): points.append([limit*i/20,limit*i/20/k*100])
		return result("spring",{"force":f,"stiffness":k,"extension":extension,"valid":valid,"limit":limit},[reading("拉力",f,"N"),reading("伸长量",extension*100 if valid else null,"cm")],"在弹性限度内，弹簧伸长量与所受拉力成正比：F＝kx。","F＝%s N，k＝%s N/m。" %[f,k],"仍在弹性限度内，可用胡克定律。" if valid else "超过给定弹性限度，不能继续用 F＝kx 推算形变。","忽略弹簧自重；弹性限度由模型给定。",graph("拉力 / N","伸长量 / cm",points))
	var gravity=number(p,"gravity",G)
	var weight=mass*gravity
	var direction = -1.0 if number(p,"direction",-1)<0 else 1.0
	var offset = maxf(number(p,"offset",0),0)
	var net=f+direction*f2
	var torque = -direction*f2*offset/100.0
	return result("force",{"mass":mass,"weight":weight,"force":f,"force2":f2,"netForce":net,"offset":offset,"direction":direction,"netTorque":torque,"balanced":abs(net)<.000001 and abs(torque)<.000001},[reading("重力",weight,"N"),reading("合力",net,"N"),reading("对第一作用线的力矩",torque,"N·m")],"G＝mg；两个力使物体平衡，须同时满足合力为零且合力矩为零。","G＝%s × %s＝%s N；F合＝%s＋(%s)×%s＝%s N；两作用线间距为%s cm。" %[mass,gravity,weight,f,direction,f2,net,offset],"两力平衡还要求作用在同一物体、同一直线上，且大小相等方向相反。" if scenario=="balance" else "力的作用是相互的；作用力与反作用力作用在两个不同物体上。" if scenario=="interaction" else "重力方向竖直向下，质量与重力是不同物理量。","静态受力模型，不据此虚构物体的实际运动轨迹。")

func pressure(p: Dictionary, scenario: String) -> Dictionary:
	var f=maxf(number(p,"force",100),0)
	var area=maxf(number(p,"area",20),.0001)
	var rho=maxf(number(p,"density",1000),0)
	var depth=maxf(number(p,"depth",1),0)
	var speed=maxf(number(p,"speed",2),0)
	var altitude=maxf(number(p,"height",0),0)
	var solid=f/(area*.0001)
	var liquid=rho*G*depth
	var atmosphere=101325*pow(maxf(1-2.25577e-5*altitude,.01),5.25588)
	var difference=.5*rho*speed*speed
	var values={"solidPressure":solid,"liquidPressure":liquid,"atmosphere":atmosphere,"mercuryHeight":atmosphere/(13600*G),"maxWaterHeight":atmosphere/(1000*G),"pressureDrop":difference,"areaSI":area*.0001,"density":rho,"depth":depth,"speed":speed}
	var measured=solid
	var formula="p＝F/S；面积 cm² 换算为 m² 时乘 10⁻⁴。"
	var conclusion="压力相同时，受力面积越小，压强越大。"
	var points=[]
	if scenario in ["liquid","communicating"]:
		measured=liquid
		formula="液体压强 p＝ρgh，h 是到自由液面的竖直深度。"
		conclusion="同种静止液体中，深度越深压强越大；同一深度各方向压强相等。" if scenario=="liquid" else "同种静止液体、液面上方压强相同时，连通器各液面等高。"
		for i in range(21): points.append([depth*i/20,rho*G*depth*i/20])
	elif scenario=="atmosphere":
		measured=atmosphere
		formula="大气压随高度升高通常降低；按标准大气近似关系计算。"
		conclusion="大气压不是固定不变的，也受天气影响；本模型不模拟天气变化。"
	elif scenario=="flow":
		measured=difference
		formula="同一水平流线、理想不可压缩流体：p＋ρv²/2＝常量。"
		conclusion="在模型条件下，流速较大的位置静压较小。"
	return result("pressure",values,[reading("压强差" if scenario=="flow" else "压强",measured,"Pa"),reading("液体密度",rho,"kg/m³")],formula,"F＝%s N，S＝%s m²，ρ＝%s kg/m³，h＝%s m。" %[f,area*.0001,rho,depth],conclusion,"液体压强为相对液面大气压的表压；流速关系只适用于同高理想流线。",graph("深度 / m","液体压强 / Pa",points))

func buoyancy(p: Dictionary, scenario: String) -> Dictionary:
	var mass=maxf(number(p,"mass",80),0)
	var volume=maxf(number(p,"volume",100),.0001)
	var rho=maxf(number(p,"density",1000),.0001)
	var fraction=clampf(number(p,"fraction",1),0,1)
	var object_density=mass/volume*1000
	var weight=mass/1000*G
	var buoyancy_force=rho*G*volume*.000001*fraction
	var equilibrium_fraction=object_density/rho
	var full_trend="下沉" if object_density>rho else "悬浮" if is_equal_approx(object_density,rho) else "上浮，存在漂浮平衡位置"
	if scenario in ["floating","densitymeter"] and equilibrium_fraction<=1:
		fraction=equilibrium_fraction
		buoyancy_force=weight
	var net=buoyancy_force-weight
	var state="当前浮力大于重力" if net>.0000001 else "当前浮力小于重力" if net<-.0000001 else "当前浮力等于重力"
	if scenario in ["floating","densitymeter"] and equilibrium_fraction<=1:state="漂浮平衡" if equilibrium_fraction<1 else "悬浮平衡"
	var points=[]
	for i in range(21):points.append([i/20.0,rho*G*volume*.000001*i/20.0])
	return result("buoyancy",{"weight":weight,"buoyantForce":buoyancy_force,"apparentWeight":maxf(weight-buoyancy_force,0),"objectDensity":object_density,"liquidDensity":rho,"fraction":fraction,"equilibriumFraction":equilibrium_fraction if equilibrium_fraction<=1 else null,"netUpward":net,"state":state,"fullImmersionTrend":full_trend},[reading("重力",weight,"N"),reading("浮力",buoyancy_force,"N"),reading("排开液体体积",volume*fraction,"cm³")],"F浮＝ρ液gV排；漂浮或悬浮时 F浮＝G。","ρ液＝%s kg/m³，V排＝%s m³。" %[rho,volume*fraction*.000001],"%s。若只受重力和浮力，从当前状态由静止释放，%s。另据密度判断，完全浸没后由静止释放的趋势是%s。" %[state,"初始向上运动" if net>.0000001 else "初始向下运动" if net<-.0000001 else "两力平衡",full_trend],"忽略表面张力；指定浸入比例时可由外力保持，不能把受约束状态误当自由平衡。",graph("浸入比例","浮力 / N",points))

func machinery(p: Dictionary, scenario: String, model: String) -> Dictionary:
	if model=="energy" and scenario in ["solar", "solarFan", "solarWater", "conversionPower"]:
		var input_power=maxf(number(p,"power",500),0)
		var efficiency=clampf(number(p,"efficiency",20),0,100)/100
		var time=maxf(number(p,"time",120),0)
		var output_power=input_power*efficiency
		return result(model,{"inputPower":input_power,"outputPower":output_power,"inputEnergy":input_power*time,"usefulEnergy":output_power*time,"lostEnergy":input_power*(1-efficiency)*time,"efficiency":efficiency*100},[reading("输入功率",input_power,"W"),reading("有效输出功率",output_power,"W"),reading("有效输出能量",output_power*time,"J")],"有效输出功率＝输入功率×转换效率；能量＝功率×时间。","%s×%s＝%s W。" %[input_power,efficiency,output_power],"太阳能可以转化为电能、内能等其他形式，实际装置存在损耗。","按给定整体效率估算，不把输入光功率直接当作风扇动能或水的温升。")
	if model=="lever":
		var force_value=number(p,"force",10)
		var arm=maxf(number(p,"arm",30),.0001)
		var load=number(p,"load",15)
		var load_arm=maxf(number(p,"loadArm",20),.0001)
		var torque1=force_value*arm/100
		var torque2=load*load_arm/100
		var needed=load*load_arm/arm
		return result(model,{"torque1":torque1,"torque2":torque2,"netTorque":torque1-torque2,"neededForce":needed,"balanced":is_equal_approx(torque1,torque2)},[reading("动力矩",torque1,"N·m"),reading("阻力矩",torque2,"N·m"),reading("平衡所需动力",needed,"N")],"杠杆平衡条件：F₁l₁＝F₂l₂。","%s×%s 与 %s×%s（N·cm）比较。" %[force_value,arm,load,load_arm],"力臂是支点到力的作用线的垂直距离；动力臂更长可省力。","刚性轻质杠杆、忽略支点摩擦。")
	if model=="pulley":
		var load=maxf(number(p,"load",20),0)
		var strands=int(clampf(number(p,"strands",2),1,8))
		if scenario=="fixed":strands=1
		if scenario=="movable":strands=2
		var h=maxf(number(p,"height",1),0)
		var eta=clampf(number(p,"efficiency",80),1,100)/100
		if scenario in ["fixed","movable"]:eta=1.0
		var pull=load/(strands*eta)
		var rope_distance=h*strands
		return result(model,{"pull":pull,"ropeDistance":rope_distance,"height":h,"strands":strands,"usefulWork":load*h,"totalWork":load*h/eta,"efficiency":eta*100},[reading("拉力",pull,"N"),reading("绳端移动距离",rope_distance,"m"),reading("机械效率",eta*100,"%")],"s＝nh；理想 F＝G/n；考虑效率时 F＝G/(nη)。","G＝%s N，n＝%s，h＝%s m。" %[load,strands,h],"省力要多移动距离；任何机械都不省功。","定/动滑轮按理想无重无摩擦处理；滑轮组按给定效率处理。")
	if model=="work":
		var f=number(p,"force",20)
		var distance=maxf(number(p,"distance",2),0)
		var time=maxf(number(p,"time",4),.0001)
		var angle=number(p,"angle",0)
		var work=f*distance*cos(deg_to_rad(angle))
		var useful=number(p,"useful",20)
		var eta=useful/work*100 if work>0 and useful>=0 and useful<=work else null
		return result(model,{"work":work,"power":work/time,"efficiency":eta,"force":f,"distance":distance,"time":time},[reading("功",work,"J"),reading("功率",work/time,"W"),reading("机械效率",eta,"%")],"沿位移方向做功 W＝Fs；一般方向 W＝Fs cosθ；P＝W/t。","W＝%s×%s×cos(%s°)＝%s J。" %[f,distance,angle,work],"有力且在力的方向上有位移才做功；功率表示做功快慢。","效率只有在 0≤有用功≤总功且总功>0 时定义；不合理输入显示无有效效率。")
	var mass=maxf(number(p,"mass",1),0)
	var velocity=number(p,"velocity",2)
	var height=maxf(number(p,"height",2),0)
	var kinetic=.5*mass*velocity*velocity
	var potential=mass*G*height
	var points=[]
	for i in range(21):
		var h=height*i/20
		points.append([h,mass*G*h])
	return result(model,{"kinetic":kinetic,"potential":potential,"total":kinetic+potential,"mass":mass,"velocity":velocity,"height":height},[reading("动能",kinetic,"J"),reading("重力势能",potential,"J"),reading("机械能",kinetic+potential,"J")],"动能 Eₖ＝mv²/2；重力势能 Eₚ＝mgh；机械能是两者之和。","m＝%s kg，v＝%s m/s，h＝%s m。" %[mass,velocity,height],"质量一定时，速度越大动能越大，高度越高重力势能越大。","动能与势能数值为模型计算；初中课堂可按教材要求侧重定性比较。",graph("高度 / m","重力势能 / J",points))

func molecular(p: Dictionary, scenario: String) -> Dictionary:
	var temperature=number(p,"temperature",20)
	var time=maxf(number(p,"time",3),0)
	var distance=maxf(number(p,"distance",1.2),.2)
	var index=1-exp(-time*sqrt(maxf(temperature+273.15,1)/293.15)/5)
	var equilibrium=pow(2,1.0/6)
	var relative_force=24*(2/pow(distance,13)-1/pow(distance,7))
	var tendency="斥力占优势" if distance<equilibrium else "引力占优势" if distance>equilibrium else "相互作用平衡"
	var points=[]
	for i in range(41):points.append([i/4.0,1-exp(-i/4.0*sqrt(maxf(temperature+273.15,1)/293.15)/5)])
	return result("molecular",{"temperature":temperature,"mixingIndex":index,"distance":distance,"relativeForce":relative_force,"tendency":tendency},[reading("温度",temperature,"℃"),reading("观察",tendency if scenario in ["attraction","repulsion"] else "扩散混合程度随时间增加")],"分子不停地做无规则运动；分子间同时存在引力和斥力。","在其他条件相同时比较温度或分子间距。","温度越高，分子无规则运动通常越剧烈。" if scenario=="diffusion" else tendency+"，不是只有一种分子力存在。","相对扩散指数和势能相互作用为定性模型，不代表真实分子数、距离或实测扩散率。",graph("观察进度（相对量）","混合程度（相对量）",points))

func charge(p: Dictionary, scenario: String) -> Dictionary:
	var q1=number(p,"charge1",3)
	var q2=number(p,"charge2",3)
	var distance=maxf(number(p,"distance",2),.1)
	var transferred=q1+q2
	if scenario in ["transfer","conduction"]:
		q1=transferred/2
		q2=q1
	var force_index=q1*q2/(distance*distance)
	var interaction="相互排斥" if q1*q2>0 else "相互吸引" if q1*q2<0 else "未给出净电荷间作用"
	var angle=clampf(abs(q1)*8,0,65)
	if scenario=="rubbing":interaction="摩擦使电子发生转移，不是创造了电荷"
	return result("charge",{"charge1":q1,"charge2":q2,"totalCharge":q1+q2,"forceIndex":force_index,"leafAngle":angle,"interaction":interaction},[reading("电荷一（相对量）",q1),reading("电荷二（相对量）",q2),reading("现象",interaction)],"同种电荷相互排斥，异种电荷相互吸引；电荷总量守恒。","两物体相对电荷为 %s 与 %s。" %[q1,q2],interaction+"。验电器只能定性检验带电情况。","相对电荷与箔片角度仅为示意。接触均分模型只适用于相同导体；带电体也可因静电感应吸引轻小中性物体。")

func circuit(p: Dictionary, scenario: String) -> Dictionary:
	var voltage=maxf(number(p,"voltage",6),0)
	var r1=maxf(number(p,"resistance",10),.001)
	var r2=maxf(number(p,"resistance2",20),.001)
	var slider=clampf(number(p,"slider",50),0,100)/100
	var equivalent=r1
	var current=voltage/r1
	var current1=current
	var current2=0.0
	var u1=voltage
	var u2=0.0
	var note="理想直流电源与定值电阻，不计导线电阻。"
	var formula="欧姆定律 I＝U/R；电功率 P＝UI。"
	var conclusion="电阻一定时，电流与电压成正比；电压一定时，电流与电阻成反比。"
	var material=str(p.get("material","nichrome"))
	if scenario=="battery":
		var cells=int(clampf(number(p,"cells",2),1,8))
		var cell_voltage=maxf(number(p,"cellVoltage",1.5),0)
		voltage=cells*cell_voltage
		if str(p.get("orientation","forward"))=="reverse":voltage=-voltage
		current=voltage/r1
		current1=current
		u1=voltage
		conclusion="串联电池同向连接时电压相加；整体反接会改变电流方向。"
		note="理想相同电池串联，忽略内阻；不允许直接连接电池两极。"
	if scenario=="conductivity":
		var conducting=material in ["copper","aluminum","iron","graphite","nichrome"]
		r1=10.0 if conducting else 1000000000.0
		equivalent=r1
		current=voltage/r1
		current1=current
		conclusion="该材料在此模型中属于导体。" if conducting else "该材料在常规低压干燥条件下作为绝缘体。"
		note="导体与绝缘体用两档代表电阻作定性演示，不代表材料实测电阻；导电性受状态与条件影响。"
	var length=maxf(number(p,"length",1),.0001)
	var area=maxf(number(p,"area",.1),.0001)
	var temperature=number(p,"temperature",20)
	if scenario in ["resistance","material","length","area","temperature"]:
		var resistivity={"copper":.0175,"aluminum":.0282,"nichrome":1.1,"iron":.1}.get(material,1.1)
		var alpha=.0004 if material=="nichrome" else .0039
		r1=maxf(resistivity*length/area*(1+alpha*(temperature-20)),.001)
		equivalent=r1
		current=voltage/r1
		current1=current
		formula="同种材料、温度一定时，R 与长度成正比，与横截面积成反比。"
		note="材料电阻率为20℃近似值，温度系数取线性近似；面积单位mm²。"
	if scenario in ["series","rheostat","voltmeter","ammeter"]:
		if scenario=="rheostat":r2*=slider
		equivalent=r1+r2
		current=voltage/equivalent
		current1=current
		current2=current
		u1=current*r1
		u2=current*r2
		formula="串联电路电流处处相等，U＝U₁＋U₂，R＝R₁＋R₂。"
		conclusion="串联分压与电阻成正比；改变滑动变阻器接入阻值可调节电流。" if scenario=="rheostat" else "串联各部分电压之和等于电源电压，电流相等。"
	elif scenario=="parallel":
		equivalent=r1*r2/(r1+r2)
		current1=voltage/r1
		current2=voltage/r2
		current=current1+current2
		u1=voltage
		u2=voltage
		formula="并联各支路电压相等，I＝I₁＋I₂，1/R＝1/R₁＋1/R₂。"
		conclusion="各支路独立分流；总电阻小于任一支路电阻。"
	elif scenario=="open":
		equivalent=null
		current=0.0
		current1=0.0
		u1=0.0
		conclusion="断路使闭合电流路径中断，该支路无电流。"
	elif scenario in ["short","shortedBulb"]:
		if scenario=="shortedBulb":
			equivalent=r2
			current=voltage/r2
			current1=0.0
			current2=current
			u1=0.0
			u2=voltage
			conclusion="被导线短接的灯泡两端电压近似为零，另一串联电阻仍限制电流。"
		else:
			equivalent=maxf(number(p,"internalResistance",.5),.01)
			current=voltage/equivalent
			current1=current
			u1=0.0
			conclusion="电源短路电流很大，可能损坏电源和导线。只在模拟中观察。"
			note="为避免理想电源短路的数学无穷大，显式使用电源内阻 %s Ω。" %equivalent
	elif scenario in ["lamp","filament","led"]:
		var rated_voltage=maxf(number(p,"ratedVoltage",3),.001)
		var rated_power=maxf(number(p,"ratedPower",1.5),.001)
		var rated_resistance=rated_voltage*rated_voltage/rated_power
		if scenario=="filament":
			# Qualitative temperature-sensitive resistance; calibrated only at rated point.
			r1=rated_resistance*(.15+.85*sqrt(maxf(voltage/rated_voltage,0)))
			note="灯丝随温度升高电阻增大；采用示意性热电阻关系，仅额定点由给定参数确定，不是实测伏安曲线。"
		elif scenario=="led":
			if str(p.get("orientation","forward"))=="reverse":voltage=-absf(voltage)
			current=maxf(voltage-2.0,0)/r1
			equivalent=voltage/current if current>0 else null
			current1=current
			current2=current
			u1=minf(voltage,2.0)
			u2=maxf(voltage-2.0,0)
			conclusion="发光二极管有单向导电性，需要串联限流电阻；本模型使用2V正向压降近似。"
			note="正向2V恒压降简化；反接或低于开启电压时不导通，不模拟击穿。"
		else:
			r1=rated_resistance
			note="按额定点电阻不变近似，真实灯丝电阻随温度变化。"
		if scenario!="led":
			equivalent=r1
			current=voltage/r1
			current1=current
			conclusion="实际功率与额定功率需区分；灯泡亮度主要取决于实际功率。"
	var power=voltage*current
	var points=[]
	for i in range(31):
		var u=voltage*i/30
		var amp=u/equivalent if equivalent!=null and equivalent>0 else 0.0
		if scenario=="open":amp=0
		if scenario=="led":amp=maxf(u-2,0)/r1
		if scenario=="filament":
			var rv=maxf(number(p,"ratedVoltage",3),.001)
			var rp=maxf(number(p,"ratedPower",1.5),.001)
			amp=u/((rv*rv/rp)*(.15+.85*sqrt(maxf(u/rv,0))))
		points.append([u,amp])
	var values={"voltage":voltage,"resistance":r1,"resistance2":r2,"equivalentResistance":equivalent,"current":current,"current1":current1,"current2":current2,"voltage1":u1,"voltage2":u2,"power":power,"power1":u1*current1,"power2":u2*current2,"slider":slider,"material":material}
	return result("circuit",values,[reading("总电流",current,"A"),reading("等效通路","断路，无有限等效电阻") if scenario=="open" else reading("等效电阻",equivalent,"Ω"),reading("总功率",power,"W"),reading("R₁两端电压",u1,"V")],formula,"U＝%s V，R₁＝%s Ω，R₂＝%s Ω。" %[voltage,r1,r2],conclusion,note,graph("电压 / V","电流 / A",points))

func joule(p: Dictionary, scenario: String) -> Dictionary:
	var current=number(p,"current",1)
	var resistance=maxf(number(p,"resistance",10),0)
	var time=maxf(number(p,"time",60),0)
	var heat=current*current*resistance*time
	var points=[]
	for i in range(21):points.append([time*i/20,current*current*resistance*time*i/20])
	return result("joule",{"current":current,"resistance":resistance,"time":time,"heat":heat,"power":current*current*resistance},[reading("产生热量",heat,"J"),reading("热功率",current*current*resistance,"W")],"焦耳定律 Q＝I²Rt。","%s² × %s × %s = %s J。" %[current,resistance,time,heat],"电流、通电时间相同时，电阻越大发热越多；比较时必须控制其余条件。","电流与电阻保持恒定，忽略热损失；U²t/R形式仅适用于纯电阻。",graph("通电时间 / s","产生热量 / J",points))

func household(p: Dictionary, scenario: String) -> Dictionary:
	var power=maxf(number(p,"power",2200),0)
	var time=maxf(number(p,"time",2),0)
	var voltage=maxf(number(p,"voltage",220),.001)
	var limit=maxf(number(p,"limit",10),0)
	var current=power/voltage
	var energy=power*time/1000
	var overload=current>limit
	return result("household",{"power":power,"current":current,"energyKWh":energy,"energyJ":energy*3600000,"overload":overload,"limit":limit},[reading("总电流",current,"A"),reading("消耗电能",energy,"kW·h"),reading("状态","超过额定电流" if overload else "未超过额定电流")],"I＝P/U；W＝Pt；1 kW·h＝3.6×10⁶ J。","%s W ÷ %s V＝%s A；电能＝%s kW·h。" %[power,voltage,current,energy],"用电器总功率越大，总电流越大；保险装置应与线路额定电流匹配。","仅作家庭电路原理模拟。接地、漏电保护和熔断器作用不同，禁止据模拟进行带电操作。")

func electromagnetism(p: Dictionary, scenario: String, model: String) -> Dictionary:
	if model=="emwave":
		var frequency=maxf(number(p,"frequency",100),.000001)
		var wavelength=299792458.0/(frequency*1000000)
		var receiver_frequency=maxf(number(p,"receiverFrequency",frequency),.000001)
		var bandwidth=maxf(number(p,"bandwidth",1),.00001)
		var reception=1/(1+pow((frequency-receiver_frequency)/bandwidth,2))
		var points=[]
		for i in range(61):points.append([i/60.0*3,sin(TAU*i/20.0)])
		return result(model,{"frequencyMHz":frequency,"frequencyHz":frequency*1000000,"wavelength":wavelength,"speed":299792458.0,"receiverFrequency":receiver_frequency,"receptionIndex":reception},[reading("频率",frequency,"MHz"),reading("波长",wavelength,"m"),reading("真空波速",299792458.0,"m/s")],"电磁波在真空中能传播，c＝λf；MHz 换算 Hz 乘10⁶。","λ＝299792458 ÷ (%s×10⁶)＝%s m。" %[frequency,wavelength],"电磁波频率越高，真空中的波长越短；声音不能在真空传播。","真空理想电磁波，正弦曲线只表示相对场强。",graph("相对位置","相对场强",points))
	var angle=number(p,"angle",90 if model=="induction" else 45)

	var current=number(p,"current",1)
	if scenario in ["wireForce","wire-force"]:
		var field=number(p,"field",.2)
		var length=maxf(number(p,"length",.5),0)
		var force_value=field*current*length*sin(deg_to_rad(angle))
		return result(model,{"force":force_value,"current":current,"field":field,"length":length,"angle":angle},[reading("电流",current,"A"),reading("磁场作用力",force_value,"N")],"直导线受磁场作用力的模型 F＝BIL sinθ。","B＝%s T，I＝%s A，L＝%s m，θ＝%s°。" %[field,current,length,angle],"改变电流方向或磁场方向，通电导体受力方向改变。","均匀磁场中直导线模型，θ为电流方向与磁场夹角；数值关系为课堂现象的拓展。")
	var turns=maxf(number(p,"turns",100),1)
	var core=str(p.get("core","iron"))
	var strength=current*turns*(5 if core=="iron" else 1)/100
	var torque=strength*sin(deg_to_rad(angle))
	return result(model,{"current":current,"turns":turns,"core":core,"fieldIndex":strength,"torqueIndex":torque,"angle":angle,"polarity":"反向" if current<0 else "正向" if current>0 else "无电流磁场"},[reading("电流",current,"A"),reading("匝数",turns),reading("磁场强弱（相对量）",abs(strength))],"通电线圈产生磁场；电流、匝数和铁芯影响电磁铁磁性。","保持其他条件相同，比较电流或匝数，铁芯影响只作定性示意。","电动机将电能转化为机械能。" if scenario in ["motor","coil","torque"] else "电流反向时磁极对调；断电后理想电磁铁失去磁性。","相对场强与力矩不是实测磁感应强度或吸引力；铁芯使用有限增强系数，不模拟磁饱和、磁滞和剩磁。")
