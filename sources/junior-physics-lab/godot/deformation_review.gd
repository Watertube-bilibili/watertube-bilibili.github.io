# SPDX-License-Identifier: AGPL-3.0-only
extends RefCounted
func solve(p: Dictionary) -> Dictionary:
	var material: String="clay" if str(p.get("material","spring"))=="clay" else "spring"
	var stage: String="unloaded" if str(p.get("stage","loaded"))=="unloaded" else "loaded"
	var maximum_force: float=clampf(float(p.get("force",4)),0,8)
	var force_value: float=maximum_force if stage=="loaded" else 0.0
	var stiffness: float=500.0
	var yield_force: float=2.0
	var hardening: float=500.0
	# Each evaluation is one fresh specimen: monotonic loading from zero to
	# the stipulated peak, then either observation at the peak or full unloading.
	# The slider is a loading-history parameter, not a live force history buffer.
	var plastic: float=maxf(maximum_force-yield_force,0)/hardening if material=="clay" else 0.0
	var elastic: float=force_value/stiffness
	var deformation: float=elastic+plastic
	var height: float=0.05-deformation if material=="clay" else 0.05+deformation
	var width_ratio: float=sqrt(0.05/height) if material=="clay" else 1.0
	var conclusion: String="卸载后，理想弹簧恢复原长。" if material=="spring" else "最大加载力不超过2 N时只有弹性形变；超过后出现塑性形变。完全卸载只恢复弹性分量，仍保留塑性形变。"
	return {"model":"force","solver":"Godot elastic-plastic teaching solver","values":{"material":material,"stage":stage,"maximumForce":maximum_force,"force":force_value,"deformation":deformation,"elasticDeformation":elastic,"plasticDeformation":plastic,"height":height,"initialHeight":0.05,"widthRatio":width_ratio,"stiffness":stiffness,"yieldForce":yield_force,"hardening":hardening},"readings":[{"label":"本次试验最大加载力","value":maximum_force,"unit":"N"},{"label":"当前外力","value":force_value,"unit":"N"},{"label":"当前长度/高度","value":height*1000,"unit":"mm"},{"label":"卸载后残余形变","value":plastic*1000,"unit":"mm"}],"process":[{"title":"规定本次加载历史","text":"每个最大加载力对应一份全新试样：从零单调加载至设定最大力，再选择观察最大加载时或完全卸载后。改变最大力会重设这次试验，不表示对已发生塑性形变的试样继续减小外力。"},{"title":"控制条件","text":"保持设定最大力不变，比较同一试样的加载与卸载状态。只看加载时的形变不能判断撤力后能否恢复。"},{"title":"题设模型","text":"弹性分量Δl弹=F/k，k=500 N/m。软材料屈服阈值2 N、硬化参数500 N/m；塑性分量Δl塑=max(F最大−2 N,0)/(500 N/m)。当前形变为两分量之和；卸载后F=0，弹性分量为零。"},{"title":"代入与观察","text":"最大加载力%.2f N，当前外力%.2f N；弹性形变%.2f mm，残余塑性形变%.2f mm。"%[maximum_force,force_value,elastic*1000,plastic*1000]},{"title":"结论","text":conclusion}],"conclusion":conclusion,"assumptions":"每组参数表示全新试样的一次单调加载及完全卸载，不累计滑块操作历史。弹簧拉伸、软材料压缩，均为给定的一维本构教学模型，不是橡皮泥实测参数；初长/高50 mm。软材料按体积不变、两个横向尺寸同比例展宽近似，只说明弹性与塑性差别。"}
