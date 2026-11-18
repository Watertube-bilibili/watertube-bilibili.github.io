extends RefCounted
## Collision data derived from the same geometry and world transform as the renderer.

static func mesh(faces: PackedVector3Array, transform: Transform3D, kind: String = "convex") -> Dictionary:
	var vertices := PackedVector3Array()
	vertices.resize(faces.size())
	var radius_squared := 0.0
	for index: int in range(faces.size()):
		var offset: Vector3 = transform.basis * faces[index]
		vertices[index] = transform.origin + offset
		radius_squared = maxf(radius_squared, offset.x * offset.x + offset.z * offset.z)
	return {
		"kind": kind, "x": transform.origin.x, "y": transform.origin.y, "z": transform.origin.z,
		"r": sqrt(radius_squared), "top": vertices,
	}

static func box(center: Vector3, half: Vector3, basis: Basis) -> Dictionary:
	var radius_squared := 0.0
	for x: float in [-half.x, half.x]:
		for y: float in [-half.y, half.y]:
			for z: float in [-half.z, half.z]:
				var corner: Vector3 = basis * Vector3(x, y, z)
				radius_squared = maxf(radius_squared, corner.x * corner.x + corner.z * corner.z)
	return {
		"kind": "box", "x": center.x, "y": center.y, "z": center.z,
		"half": half, "basis": basis, "r": sqrt(radius_squared),
	}
