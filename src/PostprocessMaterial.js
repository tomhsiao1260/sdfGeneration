import { GLSL3, ShaderMaterial } from "three";

export class PostprocessMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      defines: {
        MAX_STEPS: 500,
        SURFACE_EPSILON: 0.001
      },
      glslVersion: GLSL3,
      uniforms: {
        surface: { value: 0 },
        sceneAlbedo: { value: null },
        sceneDepth: { value: null },
        raymarchAlbedo: { value: null },
        raymarchDepth: { value: null }
      },

      vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}
			`,

      fragmentShader: /* glsl */ `
		    out highp vec4 pc_fragColor;


        #include <common>
        #include <packing>

				varying vec2 vUv;
				uniform sampler2D sceneDepth;
        uniform sampler2D sceneAlbedo;

				uniform sampler2D raymarchDepth;
				uniform sampler2D raymarchAlbedo;

        const float cameraNear = .1;
        const float cameraFar = 5.;

        float readDepthFrag( float fragCoordZ, float cameraNear, float cameraFar) {
          float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
          return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
        }

        
				void main() {
          ivec2 fCoord = ivec2(gl_FragCoord.xy);

          if (vUv.x < 0.5) {
            pc_fragColor = texture(sceneAlbedo, vUv);
          } else {
            pc_fragColor = texture(raymarchAlbedo, vUv);
				  }
          if (vUv.y < 0.5) {
            if (vUv.x < 0.5) {
              float d = readDepthFrag(texture(sceneDepth, vUv).x, cameraNear, cameraFar);
              pc_fragColor = vec4(vec3(d), 1.);
            } else {
              float d = readDepthFrag(texture(raymarchDepth, vUv).x, cameraNear, cameraFar);
              pc_fragColor = vec4(vec3(d), 1.);
            }
          }
        }
			`
    });

    this.setValues(params);
  }
}
