<template>
  <div ref="canvasContainer" v-resize="onResize" class="overflow-hidden demo-container"></div>
</template>

<script>
  import * as THREE from 'three'
  import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
  import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'

  const MODEL_PATH = 'model/demos/bone/boneDemo.glb'

  export default {
    name: "BoneDemo",
    data: () => ({
      canvasContainer: null,
      camera: null,
      controls: null,
      model: {},
      scene: new THREE.Scene(),
      rayCaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      renderer: null,
    }),
    methods: {
      onResize () {
        if (!this.canvasContainer) return
        let vw = this.canvasContainer.clientWidth, vh = this.canvasContainer.clientHeight
        this.camera.aspect = vw / vh
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(vw, vh)
      },
      onViewMouseDown (event) {
        if (event.target.tagName !== 'CANVAS') return
        let uv = this.getIntersectUVPosition(event)
        if (uv) {
          this.canvasContainer.addEventListener('mouseup', this.onViewMouseUp)
          this.canvasContainer.addEventListener('mousemove', this.onViewMouseMove)
        }
      },
      onViewMouseMove (event) {
        if (event.target.tagName !== 'CANVAS') return
        let uv = this.getIntersectUVPosition(event)
        if (uv.length>0) console.log('uv', uv[0].point)
      },
      onViewMouseUp () {
        // if (event.target.tagName != 'CANVAS') return;
        //
        this.canvasContainer.removeEventListener('mouseup', this.onViewMouseUp)
        this.canvasContainer.removeEventListener('mousemove', this.onViewMouseMove)
      },
      getIntersectUVPosition (event) {
        let offset = this.$refs.canvasContainer.getBoundingClientRect()
        this.mouse.x = ((event.clientX - offset.x) / this.renderer.domElement.clientWidth) * 2 - 1
        this.mouse.y = -((event.clientY - offset.y) / this.renderer.domElement.clientHeight) * 2 + 1
        this.rayCaster.setFromCamera(this.mouse, this.camera)

        // See if the ray from the camera into the world hits one of our meshes
        let intersects = this.rayCaster.intersectObject(this.model)

        return intersects
      },
      loadModel () {
        ///
        let loader = new GLTFLoader()
        loader.load(MODEL_PATH, (gltf) => {
          // this.model.body = gltf.scene.children[0]
          // this.model.eye = this.model.body.children[0]
          this.scene.add(gltf.scene)
          console.log('gltf.scene', gltf.scene)
          let that = this
          gltf.scene.traverse(function (child) {

            if (child instanceof THREE.SkinnedMesh) {
              // child.skeleton.bones[0].rotation.z = 90 * Math.PI / 180
              that.model = child
            }

          })

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
        this.camera.position.set(0, 1, 6)
      },
      initRenderer (vw, vh) {
        this.renderer = new THREE.WebGLRenderer({antialias: true})
        this.renderer.setSize(vw, vh)
        this.canvasContainer.appendChild(this.renderer.domElement)
      },
      initOrbitControls () {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.enabled = false
      },
      animate () {
        requestAnimationFrame(this.animate)
        // this.controls.update()
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
      // mouse event
      this.canvasContainer.addEventListener('mousedown', this.onViewMouseDown)
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