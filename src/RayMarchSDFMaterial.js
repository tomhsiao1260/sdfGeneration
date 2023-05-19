import { ShaderMaterial, Matrix4, Vector3 } from "three";

export class RayMarchSDFMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      defines: {
        MAX_STEPS: 500,
        SURFACE_EPSILON: 0.001
      },

      uniforms: {
        surface: { value: 0 },
        sdfTex: { value: null },
        normalStep: { value: new Vector3() },
        projectionInverse: { value: new Matrix4() },
        sdfTransformInverse: { value: new Matrix4() }
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
				void main() {
					gl_FragColor = vec4( vUv, 1.0, 1.0 );
				}
			`
    });

    this.setValues(params);
  }
}