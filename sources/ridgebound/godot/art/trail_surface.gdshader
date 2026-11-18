shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

uniform bool snow = false;
varying vec3 world_point;

float hash_cell(vec2 cell) {
	vec3 point = fract(vec3(cell.xyx) * 0.1031);
	point += dot(point, point.yzx + 33.33);
	return fract((point.x + point.y) * point.z);
}

float noise_field(vec2 coordinate) {
	vec2 cell = floor(coordinate);
	vec2 blend = fract(coordinate);
	blend = blend * blend * (3.0 - 2.0 * blend);
	return mix(
		mix(hash_cell(cell), hash_cell(cell + vec2(1.0, 0.0)), blend.x),
		mix(hash_cell(cell + vec2(0.0, 1.0)), hash_cell(cell + vec2(1.0)), blend.x),
		blend.y
	);
}

void vertex() {
	world_point = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec3 pigment = COLOR.rgb;
	if (!OUTPUT_IS_SRGB) {
		pigment = pow(max(pigment, vec3(0.0)), vec3(2.2));
	}
	vec2 ground = world_point.xz;
	float distance_to_eye = distance(world_point, CAMERA_POSITION_WORLD);
	float fine_fade = 1.0 - smoothstep(7.0, 44.0, distance_to_eye);
	float field = noise_field(ground * 0.24);
	float grit = noise_field(ground * 2.9);
	float relief = (grit - 0.5) * (0.28 + 0.72 * fine_fade);
	if (fine_fade > 0.001) {
		float detail = noise_field(ground * 11.0);
		relief += (detail - 0.5) * 0.32 * fine_fade;
	}
	float shade = mix(0.79, 1.13, field) + relief * 0.24;
	float ice = (snow ? 1.0 : 0.0) * smoothstep(0.075, 0.17, pigment.b - pigment.r);
	float wet = clamp(COLOR.a, 0.0, 1.0);
	ALBEDO = pigment * shade * (snow ? 0.90 : 1.0);
	ROUGHNESS = mix(mix(0.95, 0.61, wet), 0.28, ice);
	SPECULAR = mix(0.19, 0.37, max(ice, wet * 0.72));

	// Gravel changes the micro-normal only. Geometry and tire contact stay in step.
	vec2 gradient = vec2(dFdx(relief), dFdy(relief)) * 0.29 * fine_fade;
	vec3 tangent_x = normalize(dFdx(VERTEX) + vec3(0.0001, 0.0, 0.0));
	vec3 tangent_y = normalize(dFdy(VERTEX) + vec3(0.0, 0.0001, 0.0));
	NORMAL = normalize(NORMAL - tangent_x * clamp(gradient.x, -0.09, 0.09) - tangent_y * clamp(gradient.y, -0.09, 0.09));
}
