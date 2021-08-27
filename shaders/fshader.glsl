#version 300 es

precision highp float;

#define FAR 30.0

uniform vec2 u_window;
uniform float u_time;
uniform mat4 u_camera;

out vec4 color;

struct Surface {
    float sd;
    vec3 col;
};

Surface box(vec3 p, vec3 b, vec3 col) {
    vec3 q = abs(p) - b;
    return Surface(length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0), col);
}

Surface map(vec3 p) {
    return box(p, vec3(1.0), vec3(1.0));
}

Surface raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    Surface co;
    for (int i = 0; i < 96; i++) {
        co = map(ro + rd * t);
        if (co.sd < 0.002 * t || t > FAR) break;
        t += co.sd;
    }
    co.sd = t;
    return co;
}

vec3 calcNormal(vec3 p) {
    const float h = 0.0001;
    const vec2 k = vec2(1.0, -1.0);
    return normalize(
        k.xyy * map(p + k.xyy * h).sd +
        k.yyx * map(p + k.yyx * h).sd +
        k.yxy * map(p + k.yxy * h).sd +
        k.xxx * map(p + k.xxx * h).sd
    );
}

vec3 render(vec3 ro, vec3 rd, vec3 lp) {
    Surface co = raymarch(ro, rd); 

    vec3 p = ro + rd * co.sd;
    vec3 sn = calcNormal(p);
    vec3 ld = normalize(lp - p);

    float dif = max(0.0, dot(sn, ld));

    return co.col * dif;
}

void main() {
    vec2 uv = (-u_window + 2.0 * gl_FragCoord.xy) / u_window.y;

    vec3 ro = vec3(u_camera[3][0], u_camera[3][1], u_camera[3][2]);
    vec3 rd = normalize(vec3(uv, 1.0));
    rd = mat3(u_camera) * rd;

    vec3 lp = ro + vec3(0.0, 5.0, 0.0);

    vec3 col = render(ro, rd, lp);

    color = vec4(col, 1.0);
}