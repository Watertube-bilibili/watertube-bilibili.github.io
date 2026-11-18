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
	float broad = sin(dot(at, vec2(0.34, 0.42)) + t * 1.15);
	float crossing = sin(dot(at, vec2(-0.77, 0.29)) + t * 1.85);
	float small = sin(dot(at, vec2(1.1, -1.6)) + crossing * 0.20 - t * 2.85);
	float grazed = 1.0 - clamp(abs(dot(normalize(NORMAL), normalize(VIEW))), 0.0, 1.0);
	float fresnel = grazed * grazed * grazed * grazed;
	vec3 deep = frozen ? vec3(0.36, 0.55, 0.64) : vec3(0.10, 0.24, 0.26);
	vec3 horizon = frozen ? vec3(0.68, 0.78, 0.82) : vec3(0.49, 0.62, 0.60);
	vec3 pigment = mix(deep, horizon, fresnel * 0.83);
	ALBEDO = pigment * (0.96 + (broad + crossing + small * 0.42) * 0.026);
	vec3 disturbance = (VIEW_MATRIX * vec4(broad + small * 0.35, 0.0, crossing, 0.0)).xyz;
	NORMAL = normalize(NORMAL + disturbance * (frozen ? 0.012 : 0.065));
	ROUGHNESS = frozen ? 0.27 : 0.18;
	SPECULAR = 0.42;
}
