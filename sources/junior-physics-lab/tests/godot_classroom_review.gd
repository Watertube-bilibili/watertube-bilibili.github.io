# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree
var failures=[]
var checks=0
func check(condition,message):
	checks+=1
	if not condition:failures.append(message)
func _initialize():
	var solver=load("res://classroom_review.gd").new()
	var a=solver.evaluate("measurement",{"scenario":"caliper","diameter":2.5,"left":5,"right":7.5})
	check(a.values.touching and is_equal_approx(a.values.measured,2.5),"Coin must be tangent at both sides")
	a=solver.evaluate("measurement",{"scenario":"caliper","diameter":2.5,"left":5.2,"right":7.5})
	check(not a.values.touching and a.values.obstructed,"Penetrating coin must not yield accepted diameter")
	a=solver.evaluate("measurement",{"scenario":"balancePractice","objectMass":37.6,"weights":35,"rider":2.6})
	check(a.values.balanced and is_equal_approx(a.values.indicated,37.6),"Counterweights plus rider must balance")
	a=solver.evaluate("measurement",{"scenario":"balancePractice","objectMass":37.6,"weights":35,"rider":2.6,"zero":1})
	check(not a.values.balanced and a.values.difference>0,"Zero offset must change balance condition")
	for mode in ["wall","bottom","outside"]:
		a=solver.evaluate("measurement",{"scenario":"thermometerPractice","immersion":mode})
		check(not a.values.valid and a.readings[0].value==null,"Wrong immersion cannot supply valid reading: "+mode)
	a=solver.evaluate("measurement",{"scenario":"thermometerPractice","eyeLevel":"high"})
	check(not a.values.valid,"Parallax must be corrected")
	a=solver.evaluate("measurement",{"scenario":"thermometerPractice"})
	check(a.values.valid,"Correct placement should allow reading")
	var thin=solver.evaluate("thermal",{"scenario":"liquidExpansion","tubeArea":2})
	var wide=solver.evaluate("thermal",{"scenario":"liquidExpansion","tubeArea":4})
	check(is_equal_approx(thin.values.rise,wide.values.rise*2),"Half tube area gives twice liquid displacement")
	check(is_equal_approx(thin.values.extraVolume,.22),"Expansion volume units must be mL")
	a=solver.evaluate("thermal",{"scenario":"liquidExpansion","deltaT":0})
	check(a.values.rise==0,"No thermal change means no expansion")
	a=solver.evaluate("thermal",{"scenario":"infraredCompare","position":"outsideRed","blocked":false})
	check(a.values.temperature>a.values.referenceTemperature,"Unblocked outside-red detector absorbs specified heat")
	check(a.graph.points[0][1]==a.values.initial,"Thermal playback must begin at initial temperature")
	a=solver.evaluate("thermal",{"scenario":"infraredCompare","position":"outsideRed","blocked":true})
	check(a.values.temperature==a.values.referenceTemperature,"Opaque blocker removes added radiant heat")
	var covered=solver.evaluate("thermal",{"scenario":"kitchenHeat","covered":true})
	var open=solver.evaluate("thermal",{"scenario":"kitchenHeat","covered":false})
	check(covered.values.temperature>open.values.temperature,"Lid lowers prescribed heat loss and speeds heating")
	var energy=covered.values.mass*4200*(covered.values.temperature-covered.values.initial)+covered.values.evaporated*2260000+covered.values.heatLoss
	check(absf(energy-covered.values.power*covered.values.time)<.001,"Heating sensible+latent+loss equals input energy")
	a=solver.evaluate("thermal",{"scenario":"kitchenHeat","mass":.1,"initial":95,"power":500,"time":600})
	check(a.values.dry and is_equal_approx(a.values.evaporated,.1) and a.values.time<600,"Water exhaustion stops further liquid calculations")
	a=solver.evaluate("thermal",{"scenario":"kitchenHeat","activity":"cooling","initial":80,"time":600})
	check(a.values.temperature<80 and a.values.temperature>=20,"Cooling approaches ambient without crossing it")
	a=solver.evaluate("sound",{"scenario":"surfaceWave","amplitude_mm":0})
	check(a.waveStates[100].radii.is_empty() and a.waveStates[100].displacement==0,"Zero amplitude produces no wave fronts or buoy motion")
	a=solver.evaluate("sound",{"scenario":"surfaceWave","speed":.2,"frequency":1})
	check(is_equal_approx(a.values.wavelength,.2) and a.waveStates[0].displacement==0,"Given-speed wave and delayed buoy obey wave relation")
	a=solver.evaluate("emwave",{"scenario":"vacuumCompare","medium":"vacuum"})
	check(a.values.received and a.values.sourceVibrating and not a.values.audibleOutside,"Vacuum permits wireless reception but not air sound")
	a=solver.evaluate("emwave",{"scenario":"vacuumCompare","medium":"air"})
	check(a.values.received and a.values.audibleOutside,"Air counterpart carries both receiver signal and sound")
	a=solver.evaluate("emwave",{"scenario":"vacuumCompare","sourceOn":false})
	check(not a.values.received and not a.values.sourceVibrating,"No transmitter means no current reception")
	a=solver.evaluate("emwave",{"scenario":"sparkCompare","mode":"steady"})
	check(not a.values.interference,"Steady current is not modeled as continuous spark interference")
	a=solver.evaluate("emwave",{"scenario":"sparkCompare","mode":"switching","receiverOn":false})
	check(not a.values.interference and a.sourceGraph.points[0][1]>0 and a.graph.points[0][1]==0,"Receiver off does not turn off transmitter transients")
	a=solver.evaluate("measurement",{"scenario":"caliper","method":"rolling","rollTurns":1,"diameter":2.5})
	check(is_equal_approx(a.values.rollDistance,PI*2.5),"Rolling one turn gives circumference")
	var fixtures=[]
	for c in [
		["phy-coin-size","measurement",{"scenario":"caliper","diameter":2.5,"left":5,"right":7.5}],
		["phy-coin-size","measurement",{"scenario":"caliper","method":"rolling","rollTurns":1,"diameter":2.5}],
		["phy-balance-mass","measurement",{"scenario":"balancePractice","objectMass":37.6,"weights":35,"rider":2.6}],
		["phy-water-thermometer","measurement",{"scenario":"thermometerPractice","temperature":35,"immersion":"proper","eyeLevel":"level","stable":true}],
		["phy-water-thermometer","measurement",{"scenario":"thermometerPractice","temperature":35,"immersion":"bottom","eyeLevel":"high","stable":false}],
		["phy-homemade-thermometer","thermal",{"scenario":"liquidExpansion","volume":10,"tubeArea":2,"deltaT":20,"beta":.0011}],
		["phy-infrared-heating","thermal",{"scenario":"infraredCompare","position":"outsideRed","blocked":false,"time":120}],
		["phy-kitchen-phase","thermal",{"scenario":"kitchenHeat","activity":"lid","covered":true,"time":300,"ambient":20}],
		["phy-kitchen-phase","thermal",{"scenario":"kitchenHeat","mass":.1,"initial":95,"power":500,"time":600,"ambient":20,"covered":true}],
		["phy-freezing-mixture","phase",{"scenario":"mixtureObservation","stage":"cooled"}],
		["phy-water-wave-analogy","sound",{"scenario":"surfaceWave","frequency":1,"speed":.2,"amplitude_mm":3}],
		["phy-vacuum-phone","emwave",{"scenario":"vacuumCompare","medium":"vacuum","sourceOn":true,"phoneSoundOn":true}],
		["phy-vacuum-phone","emwave",{"scenario":"vacuumCompare","medium":"air","sourceOn":true,"phoneSoundOn":true}],
		["phy-spark-radio","emwave",{"scenario":"sparkCompare","mode":"switching","receiverOn":true}],
		["phy-spark-radio","emwave",{"scenario":"sparkCompare","mode":"steady","receiverOn":true}],
		["phy-emwave-transmission","emwave",{"scenario":"radioTransmission","sourceOn":false,"receiverOn":true,"frequency":100}]
	]:
		fixtures.append({"id":c[0],"model":c[1],"params":c[2],"result":solver.evaluate(c[1],c[2])})
	FileAccess.open("/tmp/classroom-review-cases.json",FileAccess.WRITE).store_string(JSON.stringify(fixtures))
	print(JSON.stringify({"checks":checks,"failures":failures}))
	quit(0 if failures.is_empty() else 1)
