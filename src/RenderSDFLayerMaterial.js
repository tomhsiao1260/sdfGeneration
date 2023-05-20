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
        precision highp sampler3D;
				varying vec2 vUv;
        uniform sampler3D sdfTex;
        uniform float layer;
        uniform float layers;
				void main() {
          #if DISPLAY_GRID
					gl_FragColor = vec4( vUv, 1.0, 1.0 );
          #else
          float dist = texture( sdfTex, vec3( vUv, layer ) ).r;
					gl_FragColor.rgb = dist > 0.0 ? vec3( 0, dist, 0 ) : vec3( - dist, 0, 0 );
					gl_FragColor.a = 1.0;
          #endif
				}
			`
    });

    this.setValues(params);
  }
}