shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx, cull_disabled;

uniform bool frozen = false;
varying vec3 world_point;

void vertex() {
	world_point = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec2 at = world_point.xz;
	float t = frozen ? 0.0 : TIME;
	float ripples = sin(dot(at, vec2(0.52, 0.69)) + t * 1.35);
	float crossing = sin(dot(at, vec2(-0.87, 0.24)) + t * 2.2);
	float shine = pow(1.0 - clamp(abs(dot(normalize(NORMAL), normalize(VIEW))), 0.0, 1.0), 3.4);
	vec3 deep = frozen ? vec3(0.37, 0.61, 0.72) : vec3(0.084, 0.22, 0.25);
	vec3 horizon = frozen ? vec3(0.73, 0.87, 0.91) : vec3(0.51, 0.67, 0.65);
	ALBEDO = mix(deep, horizon, shine * 0.83) * (0.95 + (ripples + crossing) * 0.028);
	NORMAL = normalize(NORMAL + vec3(ripples, crossing, 0.0) * (frozen ? 0.018 : 0.075));
	ROUGHNESS = frozen ? 0.22 : 0.13;
	SPECULAR = 0.54;
}
