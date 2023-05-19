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
				void main() {
					gl_FragColor = vec4( vUv, 1.0, 1.0 );
				}
			`
    });

    this.setValues(params);
  }
}