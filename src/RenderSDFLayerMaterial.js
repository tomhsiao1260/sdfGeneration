import { ShaderMaterial } from "three";

export class RenderSDFLayerMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      defines: {
        DISPLAY_GRID: 0
      },

      uniforms: {
        sdfTex: { value: null },
        layer: { value: 0 },
        layers: { value: 0 }
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
					gl_FragColor = vec4( vUv, 0.0, 1.0 );
				}
			`
    });

    this.setValues(params);
  }
}