# SPDX-License-Identifier: AGPL-3.0-only
extends RigidBody2D
signal sampled(time: float, position_m: Vector2, velocity_m: Vector2)
var active=false
var elapsed=0.0
func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
	if not active:return
	elapsed+=state.step
	sampled.emit(elapsed,state.transform.origin/1000.0,state.linear_velocity/1000.0)
