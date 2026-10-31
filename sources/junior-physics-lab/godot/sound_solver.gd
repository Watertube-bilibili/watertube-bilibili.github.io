# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted

func solve(p: Dictionary, scenario: String) -> Dictionary:
	var frequency: float = maxf(float(p.get("frequency",440)),0.001)
	var amplitude: float = maxf(float(p.get("amplitude",2)),0.0)
	var medium: String = str(p.get("medium","vacuum" if scenario=="vacuum" else "air"))
	var speed: float = {"air":340.0,"water":1500.0,"steel":5200.0,"vacuum":0.0}.get(medium,340.0)
	var received: float = 0.0 if medium=="vacuum" else 1.0
	var distance: float = maxf(float(p.get("distance",34)),0.0)
	var values: Dictionary = {"scenario":scenario,"medium":medium}
	var formula: String = "v＝λf；传播时间t＝s/v，回声时间t＝2s/v。"
	var substitution: String = "频率%.2f Hz，单程距离%.2f m，常温介质声速取近似值。"%[frequency,distance]
	var conclusion: String = "频率越高，音调越高；其他条件相同时，振幅增大通常使响度增大。"
	var assumptions: String = "相对振幅和合成波形用于规律比较，不代表实测声压或分贝；不模拟复杂传播损耗。"
	if scenario=="bottleStrike":
		var water_level: float = clampf(float(p.get("waterLevel",50)),0.0,100.0)
		# Given illustrative effective mass, never a claimed universal bottle calibration.
		frequency = 800.0/sqrt(1.0+3.0*water_level/100.0)
		values["waterLevel"]=water_level
		formula="敲击同一玻璃瓶时，瓶体与水共同振动；本题给定等效质量比1＋3w，示例基频f＝800/√(1＋3w)。"
		substitution="水位w＝%.2f%%，按给定示例系数算得f＝%.2f Hz。"%[water_level,frequency]
		conclusion="敲击同样的瓶子，水增多时音调通常降低；向瓶口吹气属于另一种空气柱振动实验。"
		assumptions+="800 Hz与等效质量系数3为题设示例，并非真实瓶子的标定值；真实频率依瓶形、材料和水量而变。"
	elif scenario=="airColumn":
		var length_cm: float = clampf(float(p.get("length_cm",20)),5.0,50.0)
		frequency=340.0/(4.0*length_cm/100.0)
		values["length_cm"]=length_cm
		formula="一端封闭、一端开口的理想空气柱，基频f≈v/(4L)。"
		substitution="L＝%.2f cm＝%.4f m，v≈340 m/s；f≈340/(4×%.4f)＝%.2f Hz。"%[length_cm,length_cm/100.0,length_cm/100.0,frequency]
		conclusion="活塞使有效空气柱变短，基频升高；变长则基频降低。"
		assumptions+="忽略管口修正，空气柱端点由活塞与开口界定；公式为初中观察的拓展解释。"
	elif scenario=="telephone":
		var state: String = str(p.get("stringState","tight"))
		received={"tight":1.0,"slack":0.15,"pinched":0.08,"broken":0.0}.get(state,0.0)
		values["stringState"]=state
		formula="说话使杯底振动；绷紧且连续的线可以把振动传到另一杯。"
		substitution="比较绷紧、松弛、被捏住与断开的线，保持发声条件不变。"
		conclusion="线绷紧且畅通时，沿线传递振动更明显；松弛或被捏住时减弱，断线时这条传播路径中断。"
		assumptions+="1、0.15、0.08、0为图示对比系数，不是测得的衰减率；不计空气中仍可能听见的声音。"
	elif scenario=="insulation":
		var attenuation: float = clampf(float(p.get("attenuation",0.5)),0.0,1.0)
		received=1.0-attenuation
		values["attenuation"]=attenuation
		formula="保持声源、距离与接收条件相同，比较传播路径改变后的接收振动。"
		substitution="按题设幅度减弱系数%.2f，相对接收幅度为声源的%.2f倍。"%[attenuation,received]
		conclusion="传播路径中的材料可能减弱声音；不能仅凭本示意确定实际材料的隔声性能。"
		assumptions+="减弱系数为输入条件，不是对海绵、玻璃等具体材料的实测排名或分贝。"
	elif medium=="vacuum":
		conclusion="铃仍能振动，但真空不能传播声音；不能由听不到声音断言声源停止振动。"
	elif scenario=="echo":
		conclusion="回声走过往返路程，单程距离s＝vt/2。"
	var travel = distance/speed if speed>0 else null
	values.merge({"frequency":frequency,"amplitude":amplitude,"sourceAmplitude":amplitude,"relativeReceived":received,"receivedAmplitude":amplitude*received,"speed":speed,"wavelength":speed/frequency if speed>0 else null,"travelTime":travel,"echoTime":travel*2 if travel!=null else null,"audible":frequency>=20 and frequency<=20000 and amplitude*received>0},true)
	var source_points: Array=[]
	var received_points: Array=[]
	for i in range(241):
		var t: float = float(i)/240.0*3.0/frequency
		var displacement: float = amplitude*sin(TAU*frequency*t)
		source_points.append([t*1000.0,displacement])
		received_points.append([t*1000.0,displacement*received])
	var readings: Array=[{"label":"模型频率","value":frequency,"unit":"Hz"},{"label":"声源相对振幅","value":amplitude,"unit":""}]
	if scenario in ["telephone","insulation"]:
		readings.append({"label":"传播情况","value":"沿该路径未收到振动" if is_zero_approx(received) else "较明显" if received>=1.0 else "减弱（定性示意）","unit":""})
	elif scenario not in ["bottleStrike","airColumn"]:
		readings.append({"label":"回声时间" if scenario=="echo" else "传播时间","value":travel*2 if scenario=="echo" and travel!=null else travel,"unit":"s"})
	return {"model":"sound","solver":"Godot scientific solver","values":values,"readings":readings,"process":[{"title":"原理","text":formula},{"title":"条件与分析","text":substitution},{"title":"结论与适用范围","text":conclusion+assumptions}],"conclusion":conclusion,"assumptions":assumptions,"graph":{"xLabel":"时间 / ms","yLabel":"接收相对振幅","points":received_points},"sourceGraph":{"xLabel":"时间 / ms","yLabel":"声源相对振幅","points":source_points}}
