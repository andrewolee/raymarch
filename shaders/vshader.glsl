#version 300 es

precision highp float;

in vec2 a_pos;

void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
}