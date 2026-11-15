# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted

# A teaching load model, NOT a fluid solver. The imposed vertical load does not
# resolve the jet, flow attachment, deformation-dependent pressure or flutter.
const LENGTH = 0.16
const WIDTH = 0.025
const THICKNESS = 0.00012
const PAPER_DENSITY = 800.0
const YOUNG_MODULUS = 3.0e9
const PRESSURE_COEFFICIENT = 0.05
const G = 9.8
const SEGMENTS = 48
const EI = YOUNG_MODULUS * WIDTH * pow(THICKNESS, 3) / 12.0
const WEIGHT_PER_LENGTH = PAPER_DENSITY * WIDTH * THICKNESS * G

func bounded(p: Dictionary, key: String, fallback: float, upper: float) -> float:
	var raw = p.get(key, fallback)
	if not (raw is int or raw is float or (raw is String and raw.is_valid_float())):
		return fallback
	var value = float(raw)
	return clampf(value, 0.0, upper) if is_finite(value) else fallback

func energy(angles: Array, load: float) -> float:
	var total = angles[0] * angles[0] # clamp-to-first-centre distance is ds/2
	for i in range(angles.size()):
		if i > 0: total += 0.5 * pow(angles[i] - angles[i-1], 2)
		total -= load * (angles.size() - i - 0.5) * sin(angles[i])
	return total

func shape(net_load: float, count: int = SEGMENTS) -> Dictionary:
	# Inextensible planar elastic strip, constant EI, uniform vertical dead load.
	# Minimise elastic energy minus external work, allowing finite rotations.
	# Segment-centre angles, with a horizontal clamp and moment-free tip:
	# U/(EI/ds) = theta[0]^2 + sum((theta[i]-theta[i-1])^2)/2
	#             - |w| ds^3/EI sum((N-i-1/2) sin(theta[i])).
	# On the load-facing branch 0<=theta<pi/2 the Hessian is positive definite.
	var ds = LENGTH / count
	var load = absf(net_load) * pow(ds, 3) / EI
	var angles: Array = []
	angles.resize(count); angles.fill(0.0)
	var residual = 0.0
	var converged = false
	for iteration in range(80):
		var diagonal: Array = []
		var rhs: Array = []
		residual = 0.0
		for i in range(count):
			var stiffness = (3.0 if i == 0 else 2.0) if i < count-1 else 1.0
			var lever = load * (count-i-0.5)
			var gradient = stiffness*angles[i] - lever*cos(angles[i])
			if i > 0: gradient -= angles[i-1]
			if i < count-1: gradient -= angles[i+1]
			residual = maxf(residual, absf(gradient))
			diagonal.append(stiffness + lever*sin(angles[i]))
			rhs.append(-gradient)
		if residual < 1.0e-12:
			converged = true
			break
		# Thomas solve for the tridiagonal Newton system (off-diagonal = -1).
		for i in range(1, count):
			var factor = -1.0 / diagonal[i-1]
			diagonal[i] += factor
			rhs[i] -= factor*rhs[i-1]
		var delta = rhs.duplicate()
		delta[count-1] /= diagonal[count-1]
		for i in range(count-2, -1, -1):
			delta[i] = (rhs[i]+delta[i+1])/diagonal[i]
		var alpha = 1.0
		var accepted = false
		var before = energy(angles, load)
		for attempt in range(50):
			var candidate: Array = []
			var inside = true
			for i in range(count):
				var a = angles[i]+alpha*delta[i]
				inside = inside and a >= 0.0 and a < PI/2.0
				candidate.append(a)
			if inside and energy(candidate, load) <= before + 1.0e-14:
				angles = candidate
				accepted = true
				break
			alpha *= 0.5
		if not accepted: break
	var points: Array = [[0.0, 0.0]]
	var x = 0.0
	var y = 0.0
	for a in angles:
		x += ds*cos(a)
		y += signf(net_load)*ds*sin(a)
		points.append([x, y]) # metres, y positive upward
	return {"points":points, "tipY":y, "tipX":x, "converged":converged,
		"residualTorque":residual*EI/ds}

func solve(p: Dictionary) -> Dictionary:
	var speed = bounded(p, "speed", 2.0, 10.0)
	var density = bounded(p, "density", 1.2, 2.0)
	var dynamic_pressure = 0.5*density*speed*speed
	var difference = PRESSURE_COEFFICIENT*dynamic_pressure
	var lift_per_length = difference*WIDTH
	var net = lift_per_length-WEIGHT_PER_LENGTH
	var current = shape(net)
	var rest = shape(-WEIGHT_PER_LENGTH)
	if not current.converged or not rest.converged:
		return {"error":"纸条弯曲平衡未收敛，请调整参数后重试。"}
	var rise = current.tipY-rest.tipY
	return {
		"model":"pressure", "solver":"Godot scientific solver: finite-rotation elastic strip",
		"values":{"scenario":"flow", "variant":"blow-strip", "speed":speed, "density":density,
			"dynamicPressure":dynamic_pressure, "pressureDrop":difference,
			"liftForce":lift_per_length*LENGTH, "weight":WEIGHT_PER_LENGTH*LENGTH,
			"netLoadPerLength":net, "length":LENGTH, "width":WIDTH, "thickness":THICKNESS,
			"paperDensity":PAPER_DENSITY, "youngModulus":YOUNG_MODULUS, "flexuralRigidity":EI,
			"pressureCoefficient":PRESSURE_COEFFICIENT, "tipY":current.tipY, "tipX":current.tipX,
			"restTipY":rest.tipY, "tipRise":rise, "segments":SEGMENTS,
			"converged":current.converged, "residualTorque":current.residualTorque},
		"stripPoints":current.points, "restStripPoints":rest.points,
		"readings":[{"label":"气流动压 q", "value":dynamic_pressure, "unit":"Pa"},
			{"label":"估算上、下表面压差 Cp·q", "value":difference, "unit":"Pa"},
			{"label":"等效上举力（模型值）", "value":lift_per_length*LENGTH, "unit":"N"},
			{"label":"纸条自重（题设）", "value":WEIGHT_PER_LENGTH*LENGTH, "unit":"N"},
			{"label":"端点相对无气流抬升（模型值）", "value":rise*1000, "unit":"mm"}],
		"process":[{"title":"明确近似条件", "text":"只观察一端水平夹持的单纸条在稳定气流条件下的静态平衡；两张纸相向运动不在本场景中模拟。"},
			{"title":"由气流估算载荷", "text":"q＝ρv²/2＝%.3f Pa；取教学系数Cp＝0.05，Δp估算＝Cp·q＝%.3f Pa。动压不自动等于真实纸面压差；Fp＝Δp·bL＝%.6f N。" % [dynamic_pressure,difference,lift_per_length*LENGTH]},
			{"title":"自重与弯曲平衡", "text":"题设L＝0.16 m，b＝0.025 m，厚0.12 mm，ρ纸＝800 kg/m³，E＝3 GPa。EI＝Ebh³/12；竖直均布净载荷w＝Cp·q·b−ρ纸bhg＝%.6f N/m。Godot对不可伸长分段纸条最小化弯曲能减外力功，得到当前平衡曲线。" % net},
			{"title":"与无气流比较", "text":"无气流时上举力为0，纸条受自重下垂。当前端点比无气流平衡位置抬升约%.2f mm。形状是简化材料与等效载荷模型的结果，不是实测纸条位移。" % (rise*1000)}],
		"conclusion":"在本等效载荷模型内，流速或气体密度增大使上举载荷增大，纸条连续抬起；没有气流时回到自重下垂形态。",
		"assumptions":"稳定低速气流的动压尺度，加给定Cp＝0.05的均布竖直等效载荷；Cp和纸材常数均为教学题设，未校准。纸条为均匀、不可伸长、可有限转动的平面弹性条，一端水平夹持、另一端自由。未求真实流场、流固耦合、压差随姿态变化、湍流、颤振或瞬态响应。速度限0～10 m/s，气体密度限0～2 kg/m³（0仅作无介质零载荷对照）；越界截断，非法/非有限数回到默认值。数值只用于本模型比较，不能替代真实器材实验。",
		"graph":{}
	}
