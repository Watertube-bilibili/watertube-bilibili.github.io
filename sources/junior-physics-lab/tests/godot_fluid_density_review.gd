# SPDX-License-Identifier: AGPL-3.0-only
extends SceneTree
var failures: Array=[]
var checks: int=0
func verify(condition: bool,message: String) -> void:
	checks+=1
	if not condition:failures.append(message)
func close(actual: float,expected: float,message: String) -> void:
	verify(absf(actual-expected)<0.000001,message+": "+str(actual)+" expected "+str(expected))
func _initialize() -> void:
	var solver=load("res://fluid_density_review.gd").new()
	for material in ["aluminum","iron","wood"]:
		for step in [2,10,20]:
			for index in [1,3,5]:
				var r=solver.solve("density",{"scenario":"materialSeries","material":material,"volumeStep":step,"sampleIndex":index})
				verify(r.samples.size()==5,"five data points for each material")
				for sample in r.samples:
					close(sample.mass/sample.volume,r.values.density,"same material has invariant mass/volume ratio")
					close(pow(sample.sideLength,3),sample.volume,"cube dimensions represent volume")
				close(r.values.mass,r.samples[index-1].mass,"selected sample mass is actual row")
				verify(r.table.derivedColumns==[3,5],"hide calculated density columns until analysis")
	for density in [500,1000,2000]:
		for depth in [0,0.25,0.5]:
			for liquid in [800,1000,1400]:
				var pressures: Array=[]
				for direction in ["up","down","left","right"]:
					var r=solver.solve("pressure",{"scenario":"liquidProbe","density":density,"depth":depth,"probeDirection":direction,"manometerDensity":liquid})
					pressures.append(r.values.liquidPressure)
					close(r.values.liquidPressure,density*9.8*depth,"probe hydrostatic pressure")
					close(r.values.heightDifference,r.values.liquidPressure/(liquid*9.8),"manometer uses its liquid density")
				verify(pressures.all(func(x):return x==pressures[0]),"all probe directions same pressure")
	for speed in [0,3,10]:
		for ratio in [1,2,4]:
			for gas in [0.8,1.2,2.0]:
				for liquid in [800,1000,1400]:
					var r=solver.solve("pressure",{"scenario":"venturi","wideSpeed":speed,"areaRatio":ratio,"gasDensity":gas,"manometerDensity":liquid})
					close(r.values.narrowSpeed/ratio,speed,"continuity preserves volume flow")
					close(r.values.pressureDifference,0.5*gas*(pow(speed*ratio,2)-pow(speed,2)),"Bernoulli compares two moving sections")
					close(r.values.pressureDifference,(liquid-gas)*9.8*r.values.heightDifference,"differential gas/liquid manometer")
					if speed==0 or ratio==1:close(r.values.pressureDifference,0,"no false pressure difference at no flow or equal area")
	var cases: Array=[
		["phy-mass-volume","density",{"scenario":"materialSeries","material":"aluminum","comparisonMaterial":"iron","volumeStep":10,"sampleIndex":3}],
		["phy-mass-volume","density",{"scenario":"materialSeries","material":"wood","comparisonMaterial":"aluminum","volumeStep":20,"sampleIndex":5}],
		["phy-mass-volume","density",{"scenario":"materialSeries","material":"iron","comparisonMaterial":"iron","volumeStep":2,"sampleIndex":1}],
		["phy-liquid-pressure","pressure",{"scenario":"liquidProbe","density":1000,"depth":0.3,"probeDirection":"right"}],
		["phy-liquid-pressure","pressure",{"scenario":"liquidProbe","density":1000,"depth":0.3,"probeDirection":"up"}],
		["phy-liquid-pressure","pressure",{"scenario":"liquidProbe","density":2000,"depth":0.5,"probeDirection":"down","manometerDensity":800}],
		["phy-liquid-pressure","pressure",{"scenario":"liquidProbe","density":1000,"depth":0,"probeDirection":"left"}],
		["phy-flow-pressure-sensors","pressure",{"scenario":"venturi","wideSpeed":6,"areaRatio":3,"gasDensity":1.2}],
		["phy-flow-pressure-sensors","pressure",{"scenario":"venturi","wideSpeed":10,"areaRatio":1,"gasDensity":1.2}],
		["phy-flow-pressure-sensors","pressure",{"scenario":"venturi","wideSpeed":0,"areaRatio":3,"gasDensity":1.2}],
		["phy-flow-pressure-sensors","pressure",{"scenario":"venturi","wideSpeed":10,"areaRatio":4,"gasDensity":2,"manometerDensity":800}]]
	var fixtures: Array=[]
	for data in cases:fixtures.append({"id":data[0],"model":data[1],"params":data[2],"result":solver.solve(data[1],data[2])})
	var file=FileAccess.open("/tmp/lab-fluid-density-review.json",FileAccess.WRITE)
	file.store_string(JSON.stringify(fixtures));file.close()
	print(JSON.stringify({"checks":checks,"failures":failures,"fixtures":fixtures.size()}))
	quit(0 if failures.is_empty() else 1)
