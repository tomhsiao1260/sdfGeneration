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
        precision highp sampler3D;
				varying vec2 vUv;
        uniform float surface;
				uniform sampler3D sdfTex;
				uniform vec3 normalStep;
				uniform mat4 projectionInverse;
				uniform mat4 sdfTransformInverse;
        #include <common>
				#include <packing>

				void main() {
          float dx = texture( sdfTex, vec3(vUv, 0.5) ).r;
					gl_FragColor = vec4( vec3(dx), 1.0 );
				}
			`
    });

    this.setValues(params);
  }
}