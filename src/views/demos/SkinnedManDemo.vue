<template>
  <div ref="canvasContainer" v-resize="onResize" class="overflow-hidden demo-container"></div>
</template>

<script>
  import * as THREE from 'three'
  import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
  import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
  import {CanvasTexture} from "../../components/Human3DView/CanvasTexture"

  const MODEL_PATH = 'model/demos/skinned-man/man.glb'
  const EYE_SKIN_PATH = 'model/demos/skinned-man/texture/eye.png'
  const BODY_SKIN_PATH = 'model/demos/skinned-man/texture/body.png'

  export default {
    name: "SkinnedManDemo",
    data: () => ({
      canvasContainer: null,
      camera: null,
      controls: null,
      model: {},
      scene: new THREE.Scene(),
      renderer: null,
      clock: null,
      mixer: null
    }),
    methods: {
      onResize () {
        if (!this.canvasContainer) return
        let vw = this.canvasContainer.clientWidth, vh = this.canvasContainer.clientHeight
        this.camera.aspect = vw / vh
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(vw, vh)
      },
      loadModel () {
        ///
        let loader = new GLTFLoader()
        loader.load(MODEL_PATH, (gltf) => {

          this.scene.add(gltf.scene)


          this.model.body = gltf.scene.children[0].children[1]
          this.model.eye = gltf.scene.children[0].children[1]
          // eyeTexture
          let eyeTexture = new THREE.TextureLoader().load(EYE_SKIN_PATH)
          eyeTexture.flipY = false
          // this.model.eye.material = new THREE.MeshPhysicalMaterial({map: eyeTexture})
          // bodyTexture
          let bodyTexture = new THREE.Texture(undefined, THREE.UVMapping,
            THREE.MirroredRepeatWrapping, THREE.MirroredRepeatWrapping)
          bodyTexture.flipY = false
          this.bodyCanvasTexture = new CanvasTexture(bodyTexture, 1024, BODY_SKIN_PATH)
          let material = new THREE.MeshPhysicalMaterial({map: bodyTexture})
          material.skinning = true
          this.model.body.material = material

          let animations = gltf.animations
          this.mixer = new THREE.AnimationMixer(gltf.scene)
          let action = this.mixer.clipAction(animations[1])
          action.clampWhenFinished = true
          action.loop = THREE.LoopOnce
          action.play()

          //
          this.animate()
          this.controls.update()
        }, (xhr) => {
          console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        })
      },
      setupLight () {
        this.scene.add(new THREE.AmbientLight(0x404040, 1))

        let directionalLight = new THREE.DirectionalLight(0xffddcc, .5)
        directionalLight.position.set(1, 0.75, 0.5)
        directionalLight.castShadow = true
        this.scene.add(directionalLight)

        // 左前方的光
        let light = new THREE.PointLight(0xc4c4c4, .4)
        light.position.set(2, 3, 2)
        this.scene.add(light)

        // 左后方的光
        light = new THREE.PointLight(0xc4c4c4, .5)
        light.position.set(2, 3, -2)
        this.scene.add(light)

        // 右前方的光
        light = new THREE.PointLight(0xc4c4c4, .4)
        light.position.set(-2, 3, 2)
        this.scene.add(light)

        // 右后方的光
        light = new THREE.PointLight(0xc4c4c4, .5)
        light.position.set(-2, 3, -2)
        this.scene.add(light)

        // 底部照射过来的光
        light = new THREE.PointLight(0xc4c4c4, .5)
        light.position.set(0, -2, 0)
        this.scene.add(light)
      },
      initCam (aspect) {
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.001, 1000)
        this.camera.position.set(0, 1, 3)
      },
      initRenderer (vw, vh) {
        this.renderer = new THREE.WebGLRenderer({antialias: true})
        this.renderer.setSize(vw, vh)
        this.canvasContainer.appendChild(this.renderer.domElement)
      },
      initOrbitControls () {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        if (this.controlsDisabled) this.controls.enabled = false
      },
      animate () {
        requestAnimationFrame(this.animate)
        // this.controls.update()
        this.mixer.update(this.clock.getDelta())
        this.renderer.render(this.scene, this.camera)
      },
    },
    watch: {
      controlsDisabled (disabled) {
        this.controls.enabled = !disabled
      }
    },
    mounted () {
      this.canvasContainer = this.$refs.canvasContainer
      let vw = this.canvasContainer.clientWidth, vh = this.canvasContainer.clientHeight
      this.initCam(vw / vh)
      this.setupLight()
      this.initRenderer(vw, vh)
      this.initOrbitControls()
      this.loadModel()
      this.clock = new THREE.Clock()
      //
      setTimeout(() => {
        this.onResize()
      })
    }

  }
</script>

<style scoped>
  .demo-container {
    display: flex;
    height: calc(100vh - 48px);
  }
</style>