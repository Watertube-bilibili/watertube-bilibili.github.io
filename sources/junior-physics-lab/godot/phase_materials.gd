# SPDX-License-Identifier: AGPL-3.0-only
# Original phase-change teaching solver. No real experiment data is fabricated.
# Water constants are common classroom approximations. The hypo/wax heat capacities
# and transition enthalpies below are EXPLICIT GIVEN COEFFICIENTS, not measured data.
extends RefCounted

func number(p: Dictionary, key: String, fallback: float) -> float:
	var value = p.get(key, fallback)
	if not (value is int or value is float):
		return fallback
	var parsed: float = float(value)
	return parsed if is_finite(parsed) else fallback

func reading(label: String, value, unit: String = "") -> Dictionary:
	return {"label": label, "value": value, "unit": unit}

func answer(values: Dictionary, readings: Array, process: Array, conclusion: String, assumptions: String, plot: Dictionary = {}) -> Dictionary:
	var result: Dictionary = {"model":"phase", "solver":"Godot scientific solver", "values":values, "readings":readings, "process":process, "conclusion":conclusion, "assumptions":assumptions, "qualitative":values.get("qualitative",false)}
	if not plot.is_empty():
		result["graph"] = plot
	return result

func stage(title: String, description: String) -> Dictionary:
	return {"title":title,"text":description}

func solve(p: Dictionary) -> Dictionary:
	var scenario: String = str(p.get("scenario",""))
	var material: String = str(p.get("material","water"))
	if scenario in ["melting","freezing"] and material in ["water","hypo","wax"]:
		return thermal_transition(p,scenario,material)
	if scenario == "mixture":
		return alcohol_water(p)
	if scenario == "alcohol_cycle":
		return alcohol_cycle(p)
	if scenario == "condensation" and (p.has("ambient") or p.has("surface") or str(p.get("variant","")) == "cold-bottle-condensation"):
		return cold_bottle(p)
	if scenario in ["sublimation","deposition"] and material in ["iodine","naphthalene"]:
		return solid_vapor(p,scenario,material)
	# Preserve the parent's existing water-boiling / evaporation / frost solver.
	return {}

func material_data(material: String) -> Dictionary:
	if material == "water":
		return {"name":"水/冰","low":0.0,"high":0.0,"solidC":2100.0,"liquidC":4200.0,"latent":334000.0,"minimum":-50.0,"maximum":100.0,"solid":"冰","liquid":"液态水","mixture":"冰水共存","given":false}
	if material == "hypo":
		return {"name":"海波（理想晶体样品）","low":48.0,"high":48.0,"solidC":2000.0,"liquidC":2000.0,"latent":200000.0,"minimum":0.0,"maximum":80.0,"solid":"固态海波","liquid":"液态样品","mixture":"固液共存","given":true}
	return {"name":"石蜡（题设混合样品）","low":50.0,"high":60.0,"solidC":2000.0,"liquidC":2000.0,"latent":180000.0,"minimum":0.0,"maximum":80.0,"solid":"固态石蜡样品","liquid":"液态石蜡样品","mixture":"逐渐软化/熔化的示例区间","given":true}

# Specific enthalpy relative to solid at the lower transition boundary, J/kg.
func enthalpy(temperature: float, d: Dictionary, freezing: bool) -> float:
	var low: float = d.low
	var high: float = d.high
	var cs: float = d.solidC
	var cl: float = d.liquidC
	var latent: float = d.latent
	if temperature < low:
		return cs * (temperature-low)
	if high > low:
		var interval_energy: float = latent + cs * (high-low)
		if temperature <= high:
			return interval_energy * (temperature-low) / (high-low)
		return interval_energy + cl * (temperature-high)
	if is_equal_approx(temperature,low):
		# Initial state at the melting point must specify its side of the transition.
		return latent if freezing else 0.0
	return latent + cl * (temperature-low)

func state_of(specific_energy: float, d: Dictionary) -> Dictionary:
	var low: float = d.low
	var high: float = d.high
	var cs: float = d.solidC
	var cl: float = d.liquidC
	var interval_energy: float = d.latent + cs * (high-low)
	if specific_energy <= 0.0:
		return {"temperature":low+specific_energy/cs,"phase":d.solid,"fraction":0.0}
	if specific_energy < interval_energy:
		var fraction: float = specific_energy / interval_energy
		return {"temperature":low+(high-low)*fraction,"phase":d.mixture,"fraction":fraction}
	return {"temperature":high+(specific_energy-interval_energy)/cl,"phase":d.liquid,"fraction":1.0}

func thermal_transition(p: Dictionary, scenario: String, material: String) -> Dictionary:
	var d: Dictionary = material_data(material)
	var freezing: bool = scenario == "freezing"
	var mass: float = maxf(number(p,"mass",0.1),0.000001)
	var power: float = maxf(number(p,"power",100.0),0.0)
	var requested_time: float = maxf(number(p,"time",300.0),0.0)
	var initial: float = number(p,"initial",20.0 if freezing or material != "water" else -10.0)
	var min_temp: float = d.minimum
	var max_temp: float = d.maximum
	if initial < min_temp or initial > max_temp:
		return answer({"scenario":scenario,"material":material,"valid":false,"domainLimited":true,"qualitative":true},[reading("输入范围","初温超出该教学模型范围")],[stage("检查初温","%s的本模型只讨论 %.1f～%.1f ℃，输入为 %.1f ℃。"%[d.name,min_temp,max_temp,initial]),stage("处理方法","调整初温后重新计算；不把超范围状态冒充已建模物态。")],"初温超出适用范围，未生成温度曲线。","本页只比较固液转变，不建立分解、燃烧、过热蒸气等高温模型。")
	var initial_energy: float = enthalpy(initial,d,freezing)
	var direction: float = -1.0 if freezing else 1.0
	var endpoint: float = enthalpy(min_temp if freezing else max_temp,d,freezing)
	var available_energy: float = maxf(0.0,direction*(endpoint-initial_energy)*mass)
	var applied_energy: float = minf(power*requested_time,available_energy)
	var valid_time: float = applied_energy/power if power>0.0 else requested_time
	var domain_limited: bool = power*requested_time > available_energy+0.0000001
	var final_energy: float = initial_energy + direction*applied_energy/mass
	var state: Dictionary = state_of(final_energy,d)
	var points: Array = []
	for i in range(61):
		var t: float = valid_time*float(i)/60.0
		var curve_state: Dictionary = state_of(initial_energy+direction*power*t/mass,d)
		points.append([t,curve_state.temperature])
	var assumptions: String = "恒定有效功率，不计容器吸热和散热；无过冷、过热或成分变化。质量kg、功率W、时间s，Q=Pt以J计。"
	var transition_description: String
	if material == "water":
		assumptions += "按常压水近似，c冰=2100、c水=4200 J/(kg·℃)，熔化热334000 J/kg；此分支止于-50～100 ℃，不继续计算沸腾。"
		transition_description = "常压纯水/冰的理想固液转变温度为0 ℃。相变期间吸放热而温度不变。"
	elif material == "hypo":
		assumptions += "海波平台取48 ℃；c固=c液=2000 J/(kg·℃)、相变热200000 J/kg均为本题给定系数，不是该样品的实测物性或实测温度曲线。"
		transition_description = "海波按理想晶体处理，48 ℃固液共存；平台的持续时间由题设质量、功率与相变热决定。"
	else:
		assumptions += "石蜡成分依样品而异；本题仅指定50～60 ℃软化/熔化区间，c固=c液=2000 J/(kg·℃)，区间额外吸热180000 J/kg。额外热量均匀分配于区间，均为给定模型系数。"
		transition_description = "本题石蜡样品在50～60 ℃逐渐软化/熔化，没有固定温度平台；该区间不是所有石蜡通用的物性常数。"
	var values: Dictionary = {"scenario":scenario,"material":material,"temperature":state.temperature,"phase":state.phase,"fraction":state.fraction,"mass":mass,"power":power,"time":valid_time,"requestedTime":requested_time,"initial":initial,"heat":applied_energy,"requestedHeat":power*requested_time,"initialSpecificEnthalpy":initial_energy,"finalSpecificEnthalpy":final_energy,"domainLimited":domain_limited,"valid":true,"qualitative":false,"transitionLow":d.low,"transitionHigh":d.high,"solidHeatCapacity":d.solidC,"liquidHeatCapacity":d.liquidC,"transitionHeat":d.latent,"givenCoefficients":d.given}
	var readings: Array = [reading("模型温度",state.temperature,"℃"),reading("物态",state.phase),reading("已计入放热量" if freezing else "已计入吸热量",applied_energy,"J"),reading("已建模时长",valid_time,"s")]
	if d.given:
		readings.append(reading("数据性质","题设系数下的演算曲线，并非实测"))
	if domain_limited:
		readings.append(reading("适用边界","已在模型温度范围边界截停"))
	var process: Array = [stage("说明材料与条件",transition_description),stage("统一单位与热量","m=%.6f kg，P=%.4f W，设定t=%.4f s；Q设定=Pt=%.4f J。"%[mass,power,requested_time,power*requested_time]),stage("按阶段处理能量","非相变段用Q=mcΔT；晶体平台用Q=mL。石蜡示例将额外吸热分布在给定温区，不能套固定熔点平台。"),stage("代入与求解","初态比焓%.4f J/kg，%s%.4f J后，比焓为%.4f J/kg；求得T=%.4f ℃，当前%s。"%[initial_energy,"放出" if freezing else "吸收",applied_energy,final_energy,state.temperature,state.phase]),stage("解释边界",assumptions)]
	var conclusion: String = "当前为%s，模型温度 %.4f ℃。%s"%[state.phase,state.temperature,transition_description]
	if domain_limited:
		conclusion += "设定能量超过本页范围，曲线在适用边界截停；剩余能量不继续解释为已建模状态。"
	return answer(values,readings,process,conclusion,assumptions,{"xLabel":"已建模时间 / s","yLabel":"模型温度 / ℃","points":points})

func alcohol_water(p: Dictionary) -> Dictionary:
	var concentration: float = clampf(number(p,"concentration",10),0,100)
	var action: String = str(p.get("action","cooling"))
	var progress: float = clampf(number(p,"progress",0.5),0,1)
	var pure: bool = is_zero_approx(concentration)
	var trend: String
	if pure:
		trend = "0%为纯水极限：在常压平衡条件下，固液相变温度为0 ℃。"
	elif concentration >= 100.0:
		trend = "100%为纯乙醇极限；不能使用水的0 ℃凝固平台。此页未设置乙醇凝固点数据。"
	else:
		trend = "含乙醇的水溶液不应套用纯水0 ℃平台；冻结温度与组成有关，常表现为一段逐渐变化的冻结过程。"
	var process: Array = [stage("明确组成","题设乙醇质量分数为 %.2f%%。"%concentration),stage("比较过程","当前%s，观察阶段 %.0f%%；阶段进度不是温度或结冰百分比。"%["冷却" if action=="cooling" else "温热",progress*100]),stage("判断适用关系",trend),stage("数据边界","没有给定该组成的相图、传热和实际测温数据，因此不计算虚构的凝固温度曲线或固体比例。")]
	var values: Dictionary = {"scenario":"mixture","material":"ethanol-water","concentration":concentration,"action":action,"progress":progress,"qualitative":true,"pureWaterLimit":pure,"phase":"需由实际温度与组成判定，页面仅比较趋势"}
	var readings: Array = [reading("乙醇质量分数",concentration,"%"),reading("过程","冷却" if action=="cooling" else "温热"),reading("温度读数","未提供实测温度")]
	if pure:
		values["freezingPoint"]=0.0
		readings.append(reading("纯水极限的相变温度",0.0,"℃"))
	return answer(values,readings,process,trend,"定性组成比较；不把演示进度当作真实温度或凝固率。纯水极限按常压理想平衡。")

func alcohol_cycle(p: Dictionary) -> Dictionary:
	var action: String = str(p.get("action","warming"))
	var progress: float = clampf(number(p,"progress",0.5),0,1)
	var warming: bool = action == "warming"
	var conclusion: String = "温热促进液态酒精汽化，袋内气相增多，软袋可能鼓起。" if warming else "冷却可使酒精蒸气液化，袋内气相减少，软袋可能收缩并出现液滴。"
	return answer({"scenario":"alcohol_cycle","material":"ethanol","action":action,"progress":progress,"qualitative":true,"phase":"汽化趋势（液态→气态）" if warming else "液化趋势（气态→液态）","condensing":not warming},[reading("过程","汽化吸热" if warming else "液化放热"),reading("容器现象","可能鼓起" if warming else "可能收缩并出现液滴")],[stage("设定操作","对同一含少量酒精的软袋进行温热/冷却现象比较。"),stage("观察证据",conclusion),stage("分析依据","酒精汽化与液化改变气相数量；袋内原有空气的热胀冷缩也会影响体积，不能只凭鼓缩计算汽化质量。"),stage("数据边界","没有输入实际温度、蒸气压、袋内气体量与体积约束，故不输出虚构的温度曲线或气体体积。")],conclusion,"仅解释物态变化趋势；不使用水的100 ℃液化或0 ℃凝固曲线。酒精易燃，课堂仅按教师规定观察，不靠近火源。")

func cold_bottle(p: Dictionary) -> Dictionary:
	var ambient: float = number(p,"ambient",25)
	var surface: float = number(p,"surface",8)
	var dew_point: float = number(p,"dewPoint",15)
	var valid: bool = dew_point <= ambient and surface >= 0.0
	var condensing: bool = valid and surface < dew_point and surface < ambient
	var interpretation: String = "瓶壁低于空气露点，邻近空气中的水蒸气可在外壁液化成小水滴。" if condensing else "瓶壁未低于给定露点，本模型不预期出现新的明显凝露。"
	if dew_point > ambient:
		interpretation = "给定露点高于环境温度，不符合本题通常未过饱和空气条件，请调整输入。"
	elif surface < 0.0:
		interpretation = "瓶壁低于0 ℃，可能涉及凝华、过冷水和结冰，本液滴模型不作唯一物态预测。"
	return answer({"scenario":"condensation","material":"water","ambient":ambient,"surface":surface,"dewPoint":dew_point,"temperature":surface,"condensing":condensing,"valid":valid,"qualitative":true,"phase":"外壁液态小水滴" if condensing else "本模型未形成新的凝露"},[reading("环境温度",ambient,"℃"),reading("瓶壁温度",surface,"℃"),reading("空气露点",dew_point,"℃"),reading("条件判断","具备凝露条件" if condensing else "未满足模型条件")],[stage("原理","水蒸气遇到低于露点的表面可发生凝结；水滴通常来自周围空气，不是透过瓶壁的水。"),stage("比较温度","瓶壁 %.2f ℃，露点 %.2f ℃，环境 %.2f ℃；先检查露点不高于环境温度，再比较瓶壁是否低于露点。"%[surface,dew_point,ambient]),stage("判断",interpretation),stage("边界","仅判定凝露条件，不由温差编造凝结质量；边界值等于露点时不预测持续净凝结增长。")],interpretation,"近似静止空气、露点为题设；只讨论0 ℃及以上冷表面上的液态凝露，不把它建模为100 ℃水蒸气降温。")

func solid_vapor(p: Dictionary, scenario: String, material: String) -> Dictionary:
	var action: String = str(p.get("action","cooling" if scenario=="deposition" else "heating"))
	var progress: float = clampf(number(p,"progress",0.5),0,1)
	var heating: bool = action == "heating"
	var name: String = "碘" if material == "iodine" else "萘（教师演示资料）"
	var phase: String = "固态直接变为气态" if heating else "气态直接变为固态"
	var observation: String
	if material == "iodine":
		observation = "适当温和加热固态碘，可观察到紫色碘蒸气。" if heating else "碘蒸气接触较冷部位，可析出固态碘。"
	else:
		observation = "适当条件下固态萘可直接进入气相；本页不以可见烟雾代替萘蒸气。" if heating else "气态萘在适当较冷部位可形成固态物质；本页不预测晶体形貌或产量。"
	return answer({"scenario":scenario,"material":material,"action":action,"progress":progress,"phase":phase,"deposition":not heating,"qualitative":true},[reading("材料",name),reading("物态变化",phase),reading("热量方向","吸热" if heating else "放热")],[stage("控制条件","比较同一密闭教师演示装置温和加热与冷却时的现象。"),stage("观察证据",observation),stage("概念判断",("升华" if heating else "凝华")+"不经过可观察到的液态阶段。"),stage("模型边界","未给出温度、蒸气压、热量或真实实验时间，进度只表示观察阶段；不计算未经测定的速率和产率。")],observation,"具体物质的定性物态变化模型；不将加热到任意温度都一概判为升华。碘和萘仅作教师受控演示资料，不建议家庭操作。")
