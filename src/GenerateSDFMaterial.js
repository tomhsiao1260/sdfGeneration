import { ShaderMaterial, Matrix4 } from "three";

export class GenerateSDFMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      uniforms: {
        matrix: { value: new Matrix4() },
        zValue: { value: 0 },
      },

      vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}
			`,

      fragmentShader: /* glsl */ `
				varying vec2 vUv;
        uniform float zValue;

        float smin( float a, float b, float k ) {
          float h = max(k-abs(a-b),0.0);
          return min(a, b) - h*h*0.25/k;
        }

				void main() {
          float dist = 1e10;
          vec3 p = vec3(vUv, zValue) - 0.5;

          float d1 = length(p - vec3(0.15, 0.13, 0)) - 0.15;
          float d2 = length(p - vec3(-0.2, -0.13, 0)) - 0.25;
          dist = smin(dist, d1, 0.2);
          dist = smin(dist, d2, 0.2);

					gl_FragColor = vec4( dist, 0, 0, 0 );
				}
			`
    });

    this.setValues(params);
  }
}