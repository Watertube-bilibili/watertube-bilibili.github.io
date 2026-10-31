# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted

func solve(p: Dictionary, scenario: String) -> Dictionary:
	var field: float=float(p.get("field",0.2))
	var angle: float=float(p.get("angle",90))
	var closed: bool=bool(p.get("closed",true))
	var values: Dictionary={"field":field,"angle":angle,"closed":closed}
	var readings: Array=[]
	var process: Array=[]
	var response: Dictionary={"model":"induction","solver":"Godot scientific solver","values":values,"readings":readings,"process":process}
	if scenario in ["generator","coil"]:
		var turns: float=maxf(float(p.get("turns",20)),1.0)
		var area: float=maxf(float(p.get("area",0.02)),0.0)
		var frequency: float=maxf(float(p.get("frequency",2)),0.0)
		var direction: float=-1.0 if float(p.get("rotationDirection",1))<0 else 1.0
		var omega: float=TAU*frequency*direction
		var signed_peak: float=turns*field*area*omega
		var initial_angle: float=deg_to_rad(float(p.get("angle",0)))
		var states: Array=[]
		var points: Array=[]
		for i in range(241):
			var t: float=float(i)/240.0
			var theta: float=initial_angle+omega*t
			var emf: float=signed_peak*sin(theta)
			states.append({"time":t,"angleDeg":rad_to_deg(theta),"emf":emf})
			points.append([t,emf])
		values.merge({"emf":states[-1].emf,"peak":absf(signed_peak),"turns":turns,"area":area,"frequency":frequency,"rotationDirection":direction,"angle":states[-1].angleDeg,"angularVelocity":omega},true)
		readings.append({"label":"末时刻感应电动势","value":states[-1].emf,"unit":"V"})
		readings.append({"label":"感应电动势峰值","value":absf(signed_peak),"unit":"V"})
		process.append({"title":"明确转动条件","text":"转速f＝%.3f Hz，ω＝2πf×方向＝%.4f rad/s；θ为线圈法线与磁场的夹角。"%[frequency,omega]})
		process.append({"title":"计算电动势","text":"理想匀强磁场中，Φ＝BS cosθ，ε＝NBSω sinθ；N＝%.0f，B＝%.4f T，S＝%.4f m²。峰值为%.4f V。"%[turns,field,area,absf(signed_peak)]})
		response["rotationStates"]=states
		response["graph"]={"xLabel":"转动时间 / s","yLabel":"感应电动势 / V","points":points}
		response["conclusion"]="转动线圈可产生交变电动势；磁场、匝数、面积和转速共同影响峰值。零转速时不产生本模型的感应电动势。"
		response["assumptions"]="外界维持均匀转动，忽略负载反作用；只画1 s内的线圈角度和电动势，不把电压当成无负载条件下已测出的电流。"
	else:
		var length: float=maxf(float(p.get("length",0.5)),0.0)
		var velocity: float=float(p.get("velocity",2))
		var emf: float=field*length*velocity*sin(deg_to_rad(angle))
		var trajectory: Array=[]
		for i in range(121):
			var t: float=float(i)/120.0
			trajectory.append([t,velocity*t,emf])
		values.merge({"emf":emf,"length":length,"velocity":velocity,"inducedCurrentPossible":closed and absf(emf)>0.000000001},true)
		readings.append({"label":"感应电动势","value":emf,"unit":"V"})
		readings.append({"label":"电路条件","value":"闭合" if closed else "断开","unit":""})
		readings.append({"label":"检流计","value":"偏转方向随电动势符号改变" if values.inducedCurrentPossible else "不偏转","unit":""})
		process.append({"title":"判断产生电流的条件","text":"先判断电路是否闭合，再判断导体是否切割磁感线。电路断开时，即使存在感应电动势，也没有持续闭合电流。"})
		process.append({"title":"计算电动势（拓展）","text":"ε＝Blv sinθ＝%.4f×%.4f×%.4f×sin(%.2f°)＝%.4f V。"%[field,length,velocity,angle,emf]})
		response["trajectory"]=trajectory
		response["trajectoryKind"]="inductionDisplacement"
		response["conclusion"]="闭合回路的一部分导体切割磁感线时可产生感应电流；反转磁场或切割速度，会改变电流方向。"
		response["assumptions"]="匀强磁场，外界规定1 s匀速运动；不计电磁阻力对外界驱动的影响。未给出电路电阻，因此只判断检流计偏转方向，不编造电流大小。"
	process.append({"title":"解释观察结果","text":response.conclusion+response.assumptions})
	return response
