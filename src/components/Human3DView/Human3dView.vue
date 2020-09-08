<template>
  <div ref="human3dView" v-resize="onResize" class="overflow-hidden"></div>
</template>

<script>
  import * as THREE from 'three'
  import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
  import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
  import {CanvasTexture} from "./CanvasTexture"
  import TWEEN from '@tweenjs/tween.js'

  const MODEL_PATH = 'model/man/man.gltf'
  const EYE_SKIN_PATH = 'model/man/texture/eye.png'
  const BODY_SKIN_PATH = 'model/man/texture/body.png'
  const BODY_SKIN_SIZE = 1024
  const DEF_CAM_POS = {x: 0, y: 0, z: 2.4, rx: 0, ry: 0, rz: 0}

  export default {
    name: 'Human3DView',
    props: {
      camPos: {type: Object, default: () => ({...DEF_CAM_POS})},
      controlsDisabled: {type: Boolean, default: true},
      camMoveSmoothly: {type: Boolean, default: true},
      /**
       * chrome, point, pointLine, pointCurve
       */
      brushType: {type: String, default: 'chrome'},
      strokeDisabled: {type: Boolean, default: false},
      dermatome: {type: Array, default: () => ([])},
    },
    data: () => ({
      human3dView: null,
      camera: null,
      controls: null,
      bodyCanvasTexture: null,
      model: {},
      scene: new THREE.Scene(),
      renderer: null,
      rayCaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      camTween: null
    }),
    methods: {
      analysisStrokeArea () {
        return this.bodyCanvasTexture.analysisStrokeArea()
      },
      refresh () {
        this.bodyCanvasTexture.setDermatome(this.dermatome)
        this.bodyCanvasTexture.refresh(true)
      },
      showDermatomeInStrokeMode () {
        if (!this.strokeDisabled) this.bodyCanvasTexture.drawAllDermatome()
      },
      hideDermatomeInStrokeMode () {
        if (!this.strokeDisabled) {
          this.bodyCanvasTexture.redraw()
        }
      },
      mark (x, y, r, color) {
        this.bodyCanvasTexture.mark(x, y, r, color)
      },
      onResize () {
        if (!this.human3dView) return
        let vw = this.human3dView.clientWidth, vh = this.human3dView.clientHeight
        this.camera.aspect = vw / vh
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(vw, vh)
      },
      onViewMouseDown (event) {
        if (!this.controlsDisabled) return
        let isTouchEvent = event.type === 'touchstart'
        let uv = this.getIntersectUVPosition(isTouchEvent ? event.touches[0] : event)
        if (uv) {
          if (!this.strokeDisabled) this.bodyCanvasTexture.strokeStart(uv.x, uv.y)
          this.human3dView.addEventListener(isTouchEvent ? 'touchend' : 'mouseup', this.onViewMouseUp)
          this.human3dView.addEventListener(isTouchEvent ? 'touchmove' : 'mousemove', this.onViewMouseMove)
        }
      },
      onViewMouseMove (event) {
        let isTouchEvent = event.type === 'touchmove'
        let uv = this.getIntersectUVPosition(isTouchEvent ? event.touches[0] : event)
        if (uv) {
          if (!this.strokeDisabled) this.bodyCanvasTexture.stroke(uv.x, uv.y)
        }
      },
      onViewMouseUp (event) {
        let isTouchEvent = event.type === 'touchend'
        let uv = this.getIntersectUVPosition(isTouchEvent ? event.touches[0] : event)
        if (uv) {
          if (!this.strokeDisabled) {
            this.bodyCanvasTexture.strokeEnd(uv.x, uv.y)
          }
          this.$emit('point-pick', this.bodyCanvasTexture.getAbsCoordinator(uv.x, uv.y))
        }
        //
        this.human3dView.removeEventListener(isTouchEvent ? 'touchend' : 'mouseup', this.onViewMouseUp)
        this.human3dView.removeEventListener(isTouchEvent ? 'touchmove' : 'mousemove', this.onViewMouseMove)
      },
      getIntersectUVPosition (event) {
        let offset = this.$refs.human3dView.getBoundingClientRect()
        let uv = null
        this.mouse.x = ((event.clientX - offset.x) / this.renderer.domElement.clientWidth) * 2 - 1
        this.mouse.y = -((event.clientY - offset.y) / this.renderer.domElement.clientHeight) * 2 + 1
        this.rayCaster.setFromCamera(this.mouse, this.camera)

        // See if the ray from the camera into the world hits one of our meshes
        let intersects = this.rayCaster.intersectObject(this.model.body)
        // Toggle rotation bool for meshes that we clicked
        if (intersects.length > 0 && intersects[0].uv) {
          uv = intersects[0].uv
          // console.log('intersects[0]', intersects[0], uv.x)
          // let tuv = intersects[0].object.material.map.transformUv(uv)
          // console.log('tt -> uv', tuv)
        }
        return uv
      },
      loadModel () {
        ///
        let loader = new GLTFLoader()
        loader.load(MODEL_PATH, (gltf) => {
          this.model.body = gltf.scene.children[0]
          this.model.eye = gltf.scene.children[0].children[0]

          this.scene.add(gltf.scene)
          // eyeTexture
          let eyeTexture = new THREE.TextureLoader().load(EYE_SKIN_PATH)
          eyeTexture.flipY = false
          this.model.eye.material = new THREE.MeshPhysicalMaterial({map: eyeTexture})
          // bodyTexture
          let bodyTexture = new THREE.CanvasTexture(undefined, THREE.UVMapping,
            THREE.MirroredRepeatWrapping, THREE.MirroredRepeatWrapping)
          bodyTexture.flipY = false
          this.bodyCanvasTexture = new CanvasTexture(bodyTexture, BODY_SKIN_SIZE, BODY_SKIN_PATH)
          this.bodyCanvasTexture.setBrush(this.brushType)
          this.bodyCanvasTexture.setDermatome(this.dermatome)
          this.bodyCanvasTexture.dermatomeVisible = this.strokeDisabled
          this.model.body.material = new THREE.MeshPhysicalMaterial({map: bodyTexture})
          //
          this.animate()
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
        let c = this.camPos
        if (c && c.x !== undefined) {
          this.updateCamPos(c)
        } else {
          this.updateCamPos(c)
          this.emitCamPosUpdateEvent()
        }
      },
      initRenderer (vw, vh) {
        this.renderer = new THREE.WebGLRenderer({antialias: true})
        this.renderer.setSize(vw, vh)
        this.human3dView.appendChild(this.renderer.domElement)
      },
      initOrbitControls () {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.addEventListener('change', () => {
          this.emitCamPosUpdateEvent()
        })
        if (this.controlsDisabled) this.controls.enabled = false
      },
      updateCamPos ({x, y, z, rx, ry, rz}) {
        if (this.camMoveSmoothly) {
          this.smoothMoveCamTo({x, y, z, rx, ry, rz})
        } else {
          this.camera.position.set(x, y, z)
          this.camera.rotation.set(rx, ry, rz)
        }
      },
      smoothMoveCamTo ({x, y, z, rx, ry, rz}) {
        let transform = {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z,
          t: 0
        }
        let startQuaternion = this.camera.quaternion.clone()
        let endQuaternion = new THREE.Quaternion()
        endQuaternion.setFromEuler(new THREE.Euler(rx, ry, rz))
        if (this.camTween) this.camTween.stop()

        this.camTween = new TWEEN.Tween(transform)
        .to({
          x: x, y: y, z: z, t: 1
        }, 800)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          this.camera.position.set(transform.x, transform.y, transform.z)
          THREE.Quaternion.slerp(startQuaternion, endQuaternion, this.camera.quaternion, transform.t)
          // this.emitCamPosUpdateEvent()
        })
        .onComplete(() => {
          this.camTween = null
        })
        .start()
      },
      emitCamPosUpdateEvent () {
        let {x, y, z} = this.camera.position
        let {x: rx, y: ry, z: rz} = this.camera.rotation
        this.$emit('update:cam-pos', {x, y, z, rx, ry, rz})
      },
      animate (time) {
        requestAnimationFrame(this.animate)
        // this.controls.update()
        TWEEN.update(time)
        this.renderer.render(this.scene, this.camera)
      },
    },
    watch: {
      camPos: {
        handler (newPos) {
          let {x, y, z} = this.camera.position
          let changed = x !== newPos.x || y !== newPos.y || z !== newPos.z
          if (!changed) {
            let {x: rx, y: ry, z: rz} = this.camera.rotation
            changed = rx !== newPos.rx || ry !== newPos.ry || rz !== newPos.rz
          }
          if (changed) {
            this.updateCamPos(newPos)
          }
        },
        deep: true
      },
      controlsDisabled (disabled) {
        this.controls.enabled = !disabled
      },
      brushType (newType) {
        this.bodyCanvasTexture.setBrush(newType)
      },
      strokeDisabled (visible) {
        this.bodyCanvasTexture.dermatomeVisible = visible
        this.refresh()
      }
    },
    mounted () {
      this.human3dView = this.$refs.human3dView
      let vw = this.human3dView.clientWidth, vh = this.human3dView.clientHeight
      this.initCam(vw / vh)
      this.setupLight()
      this.initRenderer(vw, vh)
      this.initOrbitControls()  // 会改变摄像头角度
      this.updateCamPos(this.camPos)
      this.loadModel()
      // mouse event
      this.human3dView.addEventListener('mousedown', this.onViewMouseDown)
      this.human3dView.addEventListener('touchstart', this.onViewMouseDown)
      //
      setTimeout(() => {
        this.onResize()
      })
    }
  }
</script>
