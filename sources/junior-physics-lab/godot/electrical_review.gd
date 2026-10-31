# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted

func can_handle(model: String, scenario: String) -> bool:
	return (model=="circuit" and scenario in ["ammeterPractice","voltmeterPractice","multimeterPractice"]) or (model=="magnet" and scenario in ["compassMap","craneLoad"]) or (model=="household" and scenario=="fuseCompare") or (model=="energy" and scenario=="solarWater")
func n(p: Dictionary,key: String,value: float) -> float:
	return float(p.get(key,value))
func out(model: String,v: Dictionary,readings: Array,principle: String,steps: String,conclusion: String,note: String) -> Dictionary:
	return {"model":model,"values":v,"readings":readings,"solver":"Godot classroom scientific solver","process":[{"title":"实验原理","text":principle},{"title":"按当前条件分析","text":steps},{"title":"作答与适用条件","text":conclusion+note}],"conclusion":conclusion,"assumptions":note}
func read(label: String,value,unit: String="") -> Dictionary:
	return {"label":label,"value":value,"unit":unit}
func evaluate(model: String,p: Dictionary) -> Dictionary:
	var scenario: String=str(p.get("scenario",""))
	if scenario in ["ammeterPractice","voltmeterPractice","multimeterPractice"]:return meter(p,scenario)
	if scenario=="compassMap":return compass(p)
	if scenario=="craneLoad":return crane(p)
	if scenario=="fuseCompare":return fuse(p)
	if scenario=="solarWater":return solar_water(p)
	return {"error":"未支持的课堂模型"}
func meter(p: Dictionary,s: String) -> Dictionary:
	var voltage: float=maxf(n(p,"voltage",3),0)
	var resistance: float=maxf(n(p,"resistance",20),0.001)
	var mode: String=str(p.get("mode","I" if s=="ammeterPractice" else "V"))
	var connection: String=str(p.get("connection","series" if mode=="I" else "parallel"))
	var terminal: String=str(p.get("terminal","correct"))
	var meter_range: float=maxf(n(p,"range",0.6 if mode=="I" else 3),0.001)
	var energized: bool=bool(p.get("energized",true))
	var unit: String="A" if mode=="I" else "Ω" if mode=="R" else "V"
	var faults: Array=[]
	var actual = null
	var open_circuit: bool=terminal=="open"
	var invalid_resistance: bool=mode=="R" and energized
	var short_risk: bool=mode=="I" and connection!="series" and not open_circuit and energized
	var connection_correct: bool=connection==("series" if mode=="I" else "parallel")
	var circuit_current: float=voltage/resistance if energized else 0.0
	if invalid_resistance:
		faults.append("电阻挡不能测带电元件，先断开外部电源")
	elif mode=="R":
		if open_circuit or connection!="parallel":
			faults.append("电阻挡表笔未跨接独立电阻两端，测量通路开路：OL")
		else:actual=resistance
	elif open_circuit:
		if mode=="I":
			actual=0.0;circuit_current=0.0 if connection=="series" else circuit_current
		if connection=="series":circuit_current=0.0
		faults.append("表笔未接通：电流通路断开" if mode=="I" else "表笔未接通，不能把悬空示数当作被测电压")
	elif mode=="I" and connection!="series":
		actual=null if energized else 0.0
		circuit_current=0.0
		faults.append("电流表并联使电源短路，理想模型无有限电流值" if energized else "接法错误：接通外部电源后会有短路风险")
	elif mode=="V":
		actual=voltage if energized else 0.0
		if connection!="parallel":
			circuit_current=0.0
			faults.append("电压表误串联：理想电路电流为零，电源电压几乎全部加在表上")
	else:actual=circuit_current
	if mode=="R":circuit_current=0.0
	if actual!=null and mode!="R" and terminal=="reversed":
		actual=-float(actual)
		if energized and absf(float(actual))>0:
			faults.append("正负接线柱接反：指针反偏" if s!="multimeterPractice" else "直流表笔反接：显示负号")
	var over_range: bool=actual!=null and absf(float(actual))>meter_range
	if over_range:faults.append("超过所选量程，应先改用大量程")
	var status: String="；".join(faults) if not faults.is_empty() else "正常读数"
	var ratio: float=clampf(float(actual)/meter_range,-0.12,1.08) if actual!=null else 0.0
	var display: String="禁止测量" if invalid_resistance else "OL" if (mode=="R" and actual==null) or over_range else "—" if actual==null else "number"
	var values: Dictionary={"scenario":s,"mode":mode,"voltage":voltage,"resistance":resistance,"connection":connection,"terminal":terminal,"range":meter_range,"energized":energized,"actual":actual,"unit":unit,"status":status,"faults":faults,"needleRatio":ratio,"valid":faults.is_empty(),"overRange":over_range,"display":display,"connectionCorrect":connection_correct,"shortRisk":short_risk,"circuitCurrent":circuit_current}
	return out("circuit",values,[read("理论电表响应",actual,unit),read("所选量程",meter_range,unit),read("负载电流",null if short_risk else circuit_current,"A"),read("操作判断",status)],"电流表串联、电压表并联；电流从正接线柱流入。电阻挡须断开外部电源，将表笔跨接独立电阻两端。","理想电源U＝%.3f V，负载R＝%.3f Ω；正常供电负载的I＝U/R＝%.4f A。当前%s挡、量程%.3f %s。"%[voltage,resistance,voltage/resistance,mode,meter_range,unit],status+"。","采用理想直流表与单电阻。串联电压表开路时可读电源电压，并非正确测量负载的接法；误接不模拟器材损坏。")

func compass(p: Dictionary) -> Dictionary:
	var x: float=n(p,"x",1.5)
	var y: float=n(p,"y",1)
	var polarity: float=-1.0 if str(p.get("pole","N"))=="S" else 1.0
	var radius: float=sqrt(x*x+y*y)
	var valid: bool=radius>=0.8
	var bx: float=polarity*(3*x*x-radius*radius)/pow(radius,5) if valid else 0.0
	var by: float=polarity*3*x*y/pow(radius,5) if valid else 0.0
	var angle: float=rad_to_deg(atan2(by,bx)) if valid else 0.0
	var field_vectors: Array=[]
	for ix in range(-3,4):
		for iy in range(-2,3):
			var r: float=sqrt(float(ix*ix+iy*iy))
			if r<0.8:continue
			field_vectors.append({"x":ix,"y":iy,"angle":rad_to_deg(atan2(polarity*3*ix*iy,polarity*(3*ix*ix-r*r)))})
	var response=out("magnet",{"x":x,"y":y,"pole":p.get("pole","N"),"angle":angle,"valid":valid,"fieldVectors":field_vectors},[read("磁针横坐标",x,"相对单位"),read("磁针纵坐标",y,"相对单位"),read("N端方向",angle if valid else null,"°")],"磁体外部小磁针静止时，N端指向该点磁场方向；本模型以磁偶极场计算各点方向。","位置(x,y)＝(%.2f,%.2f)；先判断是否位于外部近似区域，再根据该点场分量求方向。"%[x,y],"移动磁针可探测不同位置的磁场方向。" if valid else "当前位置靠近磁体中心，超出本偶极外场近似范围，请移到外部。","条形磁铁远处的偶极近似，不用于内部或极端近场的定量磁感应强度。")
	return response
func crane(p: Dictionary) -> Dictionary:
	var current: float=n(p,"current",1)
	var turns: float=maxf(n(p,"turns",100),1)
	var iron: bool=str(p.get("core","iron"))=="iron"
	var mass: float=maxf(n(p,"load",20),0)/1000.0
	var mu0: float=4.0*PI*0.0000001
	var gap: float=0.003
	var field: float=mu0*turns*current/(gap+0.1/(500.0 if iron else 1.0))
	var force_value: float=field*field*0.0001/(2.0*mu0)
	var weight: float=mass*9.8
	var held: bool=force_value>=weight and absf(current)>0 and mass>0
	return out("magnet",{"current":current,"turns":turns,"core":"iron" if iron else "air","load":mass*1000,"field":field,"force":force_value,"weight":weight,"held":held},[read("载荷重力",weight,"N"),read("题设吸力",force_value,"N"),read("模型判断","可托住给定载荷" if held else "不能托住给定载荷")],"比较吸力与载荷重力；G＝mg。给定简单磁路中B≈μ₀NI/(δ＋l/μr)，F≈B²S/(2μ₀)。","m＝%.3f kg，G＝%.4f N；按题设磁路算得F≈%.4f N。"%[mass,weight,force_value],"改变电流、匝数、铁芯或载荷，比较能否托住；电流反向改变极性，不会把对软铁的吸引变成排斥。","面积1 cm²、气隙3 mm、磁路长10 cm、铁芯相对磁导率500均为题设。忽略漏磁与饱和，不能据此确定真实起重机额定载荷。")
func fuse(p: Dictionary) -> Dictionary:
	var material: String=str(p.get("material","alloy"))
	# Given educational specimen: resistivity, density, heat capacity, melting point, latent heat.
	var data: Dictionary={"alloy":[0.00000015,8500.0,150.0,180.0,25000.0],"copper":[0.000000017,8960.0,385.0,1085.0,205000.0],"iron":[0.00000010,7870.0,450.0,1538.0,247000.0]}
	var constants: Array=data.get(material,data["alloy"])
	var current: float=maxf(n(p,"current",2),0)
	var duration: float=maxf(n(p,"time",10),0)
	var diameter: float=maxf(n(p,"diameter",0.3),0.01)/1000.0
	var area: float=PI*diameter*diameter/4.0
	var resistance: float=constants[0]*0.1/area
	var mass: float=constants[1]*area*0.1
	var sensible: float=mass*constants[2]*(constants[3]-20.0)
	var latent: float=mass*constants[4]
	var power_value: float=current*current*resistance
	var reach_time: float=sensible/power_value if power_value>0 else INF
	var break_time: float=(sensible+latent)/power_value if power_value>0 else INF
	var times: Array=[]
	for i in range(61):times.append(duration*i/60.0)
	for event_time in [reach_time,break_time]:
		if event_time>0 and event_time<duration and not times.has(event_time):times.append(event_time)
	times.sort()
	var states: Array=[]
	var points: Array=[]
	for t in times:
		var energy: float=minf(power_value*t,sensible+latent)
		var fraction: float=clampf((energy-sensible)/latent,0.0,1.0)
		var temperature: float=minf(20.0+energy/(mass*constants[2]),constants[3])
		var fused: bool=power_value>0 and t>=break_time
		states.append({"time":t,"temperature":temperature,"reachedMelting":power_value>0 and t>=reach_time,"meltedFraction":fraction,"fused":fused,"current":0.0 if fused else current,"jouleEnergy":energy})
		points.append([t,temperature])
	var final: Dictionary=states[-1]
	var status: String="已熔化断开，电流为零" if final.fused else "熔化吸热中，温度保持在给定熔点" if final.reachedMelting else "尚未达到熔点"
	var response=out("household",{"material":material,"current":final.current,"givenCurrent":current,"diameter":diameter*1000,"resistance":resistance,"mass":mass,"specificHeat":constants[2],"latentHeat":constants[4],"temperature":final.temperature,"meltingPoint":constants[3],"reachedMelting":final.reachedMelting,"meltedFraction":final.meltedFraction,"fused":final.fused,"reachTime":reach_time if power_value>0 else null,"breakTime":break_time if power_value>0 else null,"jouleEnergy":final.jouleEnergy,"sensibleEnergy":sensible,"latentEnergy":latent,"heatingStates":states},[read("细丝电阻",resistance,"Ω"),read("模型温度",final.temperature,"℃"),read("已熔化比例",final.meltedFraction*100,"%"),read("当前电流",final.current,"A"),read("状态",status)],"未相变时I²Rt＝mcΔT；达到熔点后继续吸热mL。题设在全段熔化后断丝，断开后电流为零，不再产生焦耳热。","长10 cm，直径%.3f mm，R＝%.5f Ω，m＝%.6f kg。升至熔点需%.3f J；L＝%.0f J/kg，完成熔化另需%.3f J。"%[diameter*1000,resistance,mass,sensible,constants[4],latent],status+"；不能用铜丝或铁丝替代符合规格的保险丝。","材料常数、均匀受热、绝热与断前定电流均为题设；全段熔化即断开的规则用于比较，不是实际保险丝时间电流曲线。断后忽略冷却，不模拟电弧。")
	response["graph"]={"xLabel":"过程时间 / s","yLabel":"细丝模型温度 / ℃","points":points}
	return response

func solar_water(p: Dictionary) -> Dictionary:
	var power: float=maxf(n(p,"power",500),0)
	var efficiency: float=clampf(n(p,"efficiency",20),0,100)/100.0
	var duration: float=maxf(n(p,"time",120),0)
	var mass: float=maxf(n(p,"mass",0.5),0.01)
	var initial: float=clampf(n(p,"initial",20),0,100)
	var rate: float=power*efficiency
	var available_energy: float=rate*duration
	var boiling_energy: float=mass*4200*(100-initial)
	var total_energy: float=boiling_energy+mass*2260000
	var dry_time: float=total_energy/rate if rate>0 else INF
	var times: Array=[]
	for i in range(61):times.append(duration*i/60.0)
	for event_time in [boiling_energy/rate if rate>0 else INF,dry_time]:
		if event_time>0 and event_time<duration and not times.has(event_time):times.append(event_time)
	times.sort()
	var states: Array=[]
	var points: Array=[]
	for t in times:
		var heat: float=minf(rate*t,total_energy)
		var remaining: float=maxf(0,mass-minf(mass,maxf(0,heat-boiling_energy)/2260000))
		var dry: bool=rate>0 and t>=dry_time
		if dry:remaining=0
		var temp = null if dry else minf(100,initial+heat/(mass*4200))
		states.append({"time":t,"temperature":temp,"remainingMass":remaining,"dry":dry,"absorbedEnergy":heat})
		if t<=dry_time:points.append([t,100 if dry else temp])
	var final: Dictionary=states[-1]
	var response=out("energy",{"inputPower":power,"efficiency":efficiency*100,"mass":mass,"initial":initial,"temperature":final.temperature,"usefulEnergy":final.absorbedEnergy,"availableEnergy":available_energy,"unmodeledEnergy":maxf(0,available_energy-total_energy),"remainingMass":final.remainingMass,"dry":final.dry,"dryTime":dry_time if rate>0 else null,"thermalStates":states},[read("水已吸收热量",final.absorbedEnergy,"J"),read("液态水温",final.temperature,"℃"),read("剩余液态水",final.remainingMass,"kg"),read("状态","液态水已耗尽，停止温度预测" if final.dry else "常压沸腾吸热" if final.temperature==100 else "液态升温")],"有水时按题设效率Q＝ηPt；液态升温Q＝mcΔT，常压达到100 ℃后用于汽化。水全部汽化后不继续给出液态水温。","可供传热量ηPt＝%.3f×%.2f×%.2f＝%.2f J。水从%.2f ℃升至100 ℃需%.2f J，再全部汽化需%.2f J。"%[efficiency,power,duration,available_energy,initial,boiling_energy,mass*2260000],"液态水已耗尽，后续输入能量未在本水模型中分配。" if final.dry else "相同输入能量与效率下，水量越少升温越快；效率不是温度。","效率已包含未吸收损失；忽略额外散热与容器热容。达到汽化总能量后截停水的吸热统计，不预测蒸气或干烧装置温度。")
	response["graph"]={"xLabel":"受热时间 / s","yLabel":"液态水温 / ℃","points":points}
	return response
