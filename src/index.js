import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from 'stats.js'
import { MeshBVH, StaticGeometryGenerator } from 'three-mesh-bvh'
import { GenerateSDFMaterial } from './GenerateSDFMaterial.js'
import { RayMarchSDFMaterial } from './RayMarchSDFMaterial.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const params = {
    gpuGeneration: true,
    resolution: 75,
    margin: 0.2,

    mode: 'raymarching',
    surface: -0.0077
}

let renderer, camera, scene, stats, boxHelper
let outputContainer, bvh, geometry, sdfTex, mesh
let generateSdfPass, raymarchPass
const inverseBoundsMatrix = new THREE.Matrix4()

init()
render()

function init() {
    outputContainer = document.getElementById('output')

    // renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    document.body.appendChild(renderer.domElement)

    // scene setup
    scene = new THREE.Scene()

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(1, 1, 1)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffffff, 0.2))

    // camera setup
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        50
    )
    camera.position.set(1, 1, 2)
    camera.far = 5
    camera.updateProjectionMatrix()

    boxHelper = new THREE.Box3Helper(new THREE.Box3())
    scene.add(boxHelper)

    new OrbitControls(camera, renderer.domElement)

    // stats setup
    stats = new Stats()
    document.body.appendChild(stats.dom)

    // sdf pass to generate the 3d texture
    generateSdfPass = new FullScreenQuad(new GenerateSDFMaterial())

    // screen pass to render the sdf ray marching
    raymarchPass = new FullScreenQuad(new RayMarchSDFMaterial())

    new OBJLoader()
        .loadAsync('tree.obj')
        .then((object) => {
            const staticGen = new StaticGeometryGenerator(object)
    // new GLTFLoader()
        // .setMeshoptDecoder(MeshoptDecoder)
        // .loadAsync('https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/stanford-bunny/bunny.glb')
        // .then((gltf) => {
            // gltf.scene.updateMatrixWorld(true)
            // const staticGen = new StaticGeometryGenerator(gltf.scene)

            staticGen.attributes = ['position', 'normal']
            staticGen.useGroups = false

            geometry = staticGen.generate().center()

            return new MeshBVH(geometry, { maxLeafTris: 1 })
        })
        .then((result) => {
            bvh = result
      
            mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial())
            scene.add(mesh)

            updateSDF()
        })

    window.addEventListener(
        'resize',
        function () {
          camera.aspect = window.innerWidth / window.innerHeight
          camera.updateProjectionMatrix()
          renderer.setSize(window.innerWidth, window.innerHeight)
        },
        false
    )
}

function updateSDF() {
    const dim = params.resolution
    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    // compute the bounding box of the geometry including the margin which is used to
    // define the range of the SDF
    geometry.boundingBox.getCenter(center)
    scale.subVectors(geometry.boundingBox.max, geometry.boundingBox.min)
    scale.x += 2 * params.margin
    scale.y += 2 * params.margin
    scale.z += 2 * params.margin
    matrix.compose(center, quat, scale)
    inverseBoundsMatrix.copy(matrix).invert()

    // update the box helper
    boxHelper.box.copy(geometry.boundingBox)
    boxHelper.box.min.x -= params.margin
    boxHelper.box.min.y -= params.margin
    boxHelper.box.min.z -= params.margin
    boxHelper.box.max.x += params.margin
    boxHelper.box.max.y += params.margin
    boxHelper.box.max.z += params.margin

    // dispose of the existing sdf
    if (sdfTex) {
        sdfTex.dispose()
    }

    const pxWidth = 1 / dim
    const halfWidth = 0.5 * pxWidth

    const startTime = window.performance.now()
    if (params.gpuGeneration) {
        // create a new 3d render target texture
        sdfTex = new THREE.WebGL3DRenderTarget(dim, dim, dim)
        sdfTex.texture.format = THREE.RedFormat
        sdfTex.texture.type = THREE.FloatType
        sdfTex.texture.minFilter = THREE.LinearFilter
        sdfTex.texture.magFilter = THREE.LinearFilter

        // prep the sdf generation material pass
        generateSdfPass.material.uniforms.bvh.value.updateFrom(bvh)
        generateSdfPass.material.uniforms.matrix.value.copy(matrix)

        // render into each layer
        for (let i = 0; i < dim; i++) {
            generateSdfPass.material.uniforms.zValue.value = i * pxWidth + halfWidth

            renderer.setRenderTarget(sdfTex, i)
            generateSdfPass.render(renderer)
        }

        // initiate read back to get a rough estimate of time taken to generate the sdf
        renderer.readRenderTargetPixels(sdfTex, 0, 0, 1, 1, new Float32Array(4))
        renderer.setRenderTarget(null)

        // renderer.setRenderTarget(null);
        // generateSdfPass.render(renderer);
    }

    // update the timing display
    const delta = window.performance.now() - startTime
    outputContainer.innerText = `${delta.toFixed(2)}ms`
}

function render() {

    stats.update();
    requestAnimationFrame( render );

    if ( ! sdfTex ) {

		// render nothing
		return;

	} else if ( params.mode === 'raymarching' ) {

        // render the ray marched texture
        camera.updateMatrixWorld();
		mesh.updateMatrixWorld();

        let tex;
        if ( sdfTex.isData3DTexture ) {

			tex = sdfTex;

		} else {

			tex = sdfTex.texture;

		}

        const { width, depth, height } = tex.image;
        raymarchPass.material.uniforms.sdfTex.value = tex;
		raymarchPass.material.uniforms.normalStep.value.set( 1 / width, 1 / height, 1 / depth );
		raymarchPass.material.uniforms.surface.value = params.surface;
		raymarchPass.material.uniforms.projectionInverse.value.copy( camera.projectionMatrixInverse );
		raymarchPass.material.uniforms.sdfTransformInverse.value.copy( mesh.matrixWorld ).invert().premultiply( inverseBoundsMatrix ).multiply( camera.matrixWorld );
		raymarchPass.render( renderer );
    }

    // renderer.render( scene, camera );
}