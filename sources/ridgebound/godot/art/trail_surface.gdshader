shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

uniform bool snow = false;
varying vec3 world_point;

float hash_cell(vec2 cell) {
	vec3 point = fract(vec3(cell.xyx) * 0.1031);
	point += dot(point, point.yzx + 33.33);
	return fract((point.x + point.y) * point.z);
}

float noise_field(vec2 position) {
	vec2 cell = floor(position);
	vec2 t = fract(position);
	t = t * t * (3.0 - 2.0 * t);
	return mix(mix(hash_cell(cell), hash_cell(cell + vec2(1.0, 0.0)), t.x),
		mix(hash_cell(cell + vec2(0.0, 1.0)), hash_cell(cell + vec2(1.0)), t.x), t.y);
}

void vertex() {
	world_point = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec3 pigment = COLOR.rgb;
	if (!OUTPUT_IS_SRGB) {
		pigment = pow(max(pigment, vec3(0.0)), vec3(2.2));
	}
	vec2 at = world_point.xz;
	float distance_to_eye = distance(world_point, CAMERA_POSITION_WORLD);
	float detail = 1.0 - smoothstep(30.0, 155.0, distance_to_eye);
	float patch = noise_field(at * 0.37);
	float gravel = noise_field(at * 9.0) * (1.0 - smoothstep(5.0, 36.0, distance_to_eye));
	float lines = noise_field(vec2(at.x + at.y * 0.37, at.y * 0.18) * 2.7);
	float shade = mix(0.92, 1.08, patch) + (gravel - 0.20 + (lines - 0.5) * 0.25) * detail * 0.37;
	ALBEDO = clamp(pigment * shade, vec3(0.025), vec3(1.0));
	float ice = float(snow) * smoothstep(0.015, 0.08, pigment.b - pigment.r);
	ROUGHNESS = mix(0.94, 0.24, ice) - gravel * 0.09;
	SPECULAR = mix(0.20, 0.46, ice);
}
