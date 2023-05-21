import { ShaderMaterial, Vector2, Vector3 } from "three";

export class VolumeMaterial extends ShaderMaterial {
  constructor(params) {
    super({
      uniforms: {
        data: { value: null },
        cmdata: { value: null },
        size: { value: new Vector3() },
        clim: { value: new Vector2() },
        renderthreshold: { value: 0 },
        renderstyle: { value: 0 }, // 0: MIP, 1: ISO
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
        uniform vec2 clim;
        uniform sampler3D data;
        uniform sampler2D cmdata;
				void main() {
					gl_FragColor = vec4(vec3(texture(data, vec3(vUv , clim.x)).r), 1.0);
					// gl_FragColor = texture2D(cmdata, vUv);
					// gl_FragColor = vec4(vUv, 1.0, 1.0);
				}
			`
    });

    this.setValues(params);
  }
}