import { ShaderMaterial, Matrix4 } from "three";
import { MeshBVHUniformStruct } from "three-mesh-bvh";

export class GenerateSDFMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      uniforms: {
        matrix: { value: new Matrix4() },
        zValue: { value: 0 },
        bvh: { value: new MeshBVHUniformStruct() }
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
				void main() {
                    float dist = length(vec3(vUv, zValue) - 0.5) - 0.3;
					gl_FragColor = vec4( dist, 0, 0, 0 );
				}
			`
    });

    this.setValues(params);
  }
}