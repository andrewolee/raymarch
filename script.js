"use strict";

const {vec3, mat4, vec4, quat} = glMatrix;

class WebGLCanvas {
  constructor(canvas, vsSource, fsSource) {
    this.canvas = canvas;
    this.vsSource = vsSource;
    this.fsSource = fsSource;

    this.gl = canvas.getContext("webgl2");
    if (!this.gl) {
      alert("Your browser or machine does not support WebGL");
      return;
    }
    this.camera = {
      v: vec3.fromValues(0, 0, -5),
      q: quat.create(),
      pitch: 0,
      yaw: 0,
      dir: vec3.create()
    }
    this.keys = {};
    this.mouse = {};

    this.initProgram();
    this.initBuffer();
    this.initUniforms();
    this.setWindowDim();
    this.addEventListeners();
    this.animate();
  }

  compileShader(type, source) {
    const shader = this.gl.createShader(type);

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.log(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      alert("An error occured compiling the shaders");
      return null;
    }
    return shader;
  }

  initProgram() {
    this.shaderProgram = this.gl.createProgram();

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, this.vsSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, this.fsSource);

    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);

    this.gl.linkProgram(this.shaderProgram);
    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      console.log(gl.getProgramInfoLog(this.shaderProgram));
      this.gl.deleteProgram(program);
      alert("Unable to initialize the shader program");
      return null;
    }
    this.gl.useProgram(this.shaderProgram);
  }

  initBuffer() {
    const vertexBuffer = this.gl.createBuffer();

    const vertices = [-1, 1, -1, -1, 1, -1, -1, 1, 1, 1, 1, -1];

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    const a_pos = this.gl.getAttribLocation(this.shaderProgram, "a_pos");
    this.gl.enableVertexAttribArray(a_pos);
    this.gl.vertexAttribPointer(a_pos, 2, this.gl.FLOAT, false, 2 * Float32Array.BYTES_PER_ELEMENT, 0);
  }

  initUniforms() {
    this.u_window = [];
    this.u_time = 0;
    this.u_camera = mat4.create();
    this.uniforms = {
      u_window: this.gl.getUniformLocation(this.shaderProgram, "u_window"),
      u_time: this.gl.getUniformLocation(this.shaderProgram, "u_time"),
      u_camera: this.gl.getUniformLocation(this.shaderProgram, "u_camera"),
    };
  }

  renderScene() {
    this.gl.uniform2fv(this.uniforms.u_window, this.u_window);
    this.gl.uniform1f(this.uniforms.u_time, this.u_time);
    this.gl.uniformMatrix4fv(this.uniforms.u_camera, false, this.u_camera);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  setWindowDim() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.u_window = [this.canvas.width, this.canvas.height];
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.renderScene();
  }

  addEventListeners() {
    window.addEventListener("resize", this.setWindowDim.bind(this));
    window.addEventListener("keydown", e => this.keys[e.code] = true);
    window.addEventListener("keyup", e => this.keys[e.code] = false);
    window.addEventListener("mousemove", e => {
      this.mouse.offsetX = this.mouse.x - e.offsetX;
      this.mouse.offsetY = this.mouse.y - e.offsetY;
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
    });
    window.addEventListener("mousedown", e => this.mouse.down = true);
    window.addEventListener("mouseup", e => this.mouse.down = false);
  }

  translateCamera(x, y, z) {
    const PAN_SPEED = 0.09;
    vec3.set(this.camera.dir, x, y, z);
    vec3.transformQuat(this.camera.dir, this.camera.dir, this.camera.q);
    vec3.scaleAndAdd(this.camera.v, this.camera.v, this.camera.dir, PAN_SPEED);
  }

  moveCamera() {
    const ROT_SPEED = 0.1;
    if (this.keys["KeyW"] || this.keys["ArrowUp"]) {
      this.translateCamera(0, 0, 1);
    }
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) {
      this.translateCamera(0, 0, -1);
    }
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) {
      this.translateCamera(-1, 0, 0);
    }
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) {
      this.translateCamera(1, 0, 0);
    }
    if (this.mouse.down) {
      this.camera.pitch += this.mouse.offsetY * ROT_SPEED;
      this.camera.yaw += this.mouse.offsetX * ROT_SPEED;
      quat.fromEuler(this.camera.q, this.camera.pitch, this.camera.yaw, 0);
      this.mouse.offsetY = 0;
      this.mouse.offsetX = 0;
    }
  }

  animate() {
    this.moveCamera();
    mat4.fromRotationTranslation(this.u_camera, this.camera.q, this.camera.v);
    this.u_time += 1;
    this.renderScene();
    window.requestAnimationFrame(this.animate.bind(this));
  }
}

async function loadShader(source) {
  const shader = await fetch(source).then(response => response.text());
  return shader;
}

async function main() {
  const vsSource = await loadShader("shaders/vshader.glsl");
  const fsSource = await loadShader("shaders/fshader.glsl");

  const canvas = document.getElementById("canvas");
  const raymarch = new WebGLCanvas(canvas, vsSource, fsSource);
}

window.onload = main;