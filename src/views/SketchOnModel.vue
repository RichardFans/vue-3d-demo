<template>
  <div class="sketch-on-model">
    <Human3dView class="sketch-on-model__view" v-bind:cam-pos.sync="camPos"
                 :controlsDisabled="controlsDisabled" :cam-move-smoothly="camMoveSmoothly"></Human3dView>
    <div class="sketch-on-model__toolbar">
      <v-card width="480" class="pa-2 fill-height" outlined tile>
        <v-subheader>摄像头</v-subheader>
        <v-row>
          <v-col cols="4">
            <v-text-field v-model="camPos.x" outlined type="number" step="0.1"
                          label="位置x" dense></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-text-field v-model="camPos.y" outlined type="number" step="0.1"
                          label="位置y" dense></v-text-field>
          </v-col>
          <v-col cols="4">
            <v-text-field v-model="camPos.z" outlined type="number" step="0.1"
                          label="位置z" dense></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="3">
            <v-text-field v-model="rx" outlined type="number"
                          label="旋转x°" dense></v-text-field>
          </v-col>
          <v-col cols="3">
            <v-text-field v-model="ry" outlined type="number"
                          label="旋转y°" dense></v-text-field>
          </v-col>
          <v-col cols="3">
            <v-text-field v-model="rz" outlined type="number"
                          label="旋转z°" dense></v-text-field>
          </v-col>
        </v-row>
        <v-row align="center">
          <v-col><v-checkbox v-model="controlsDisabled" label="禁用控制轨道" dense/></v-col>
          <v-col><v-checkbox v-model="camMoveSmoothly" label="摄像头平滑移动" dense/></v-col>
        </v-row>
        <v-row align="center">
          <v-col v-for="(cam, i) in camPosList" :key="i">
            <v-btn @click="setCamPos(cam.pos)">{{cam.name}}</v-btn>
          </v-col>
        </v-row>
      </v-card>
    </div>
  </div>
</template>

<script>
  // @ is an alias to /src
  import Human3dView from "../components/Human3DView/Human3dView"

  const DEF_CAM_POS = {x: 0, y: 0, z: 2.8, rx: 0, ry: 0, rz: 0}
  const CAM_POS_LIST = [
    {name: '初始位置', pos: {...DEF_CAM_POS}}, // default
    {name: '小腿前方', pos: {x: 0, y: -0.3, z: 1.06, rx: -24, ry: 0, rz: 0}},
    {name: '小腿后侧', pos: {x: 0, y: -0.64, z: -1.06, rx: 180, ry: 0, rz: -180}},
    {name: '小腿右外侧/左内侧', pos: {x: -.95, y: -0.65, z: 0.45, rx: 0, ry: -66, rz: 0}},
    {name: '小腿左外侧/右内侧', pos: {x: .95, y: -0.65, z: 0.45, rx: 0, ry: 66, rz: 0}},
    {name: '大腿后侧', pos: {x: 0, y: -0.2, z: -0.9, rx: 180, ry: 0, rz: -180}},
    {name: '大腿前方', pos: {x: 0, y: -0.24, z: 0.95, rx: 0, ry: 0, rz: -0}},
    {name: '大腿右外侧/左内侧', pos: {x: -.57, y: -0.12, z: 0.5, rx: 0, ry: -49, rz: 0}},
    {name: '大腿左外侧/右内侧', pos: {x: .57, y: -.12, z: 0.5, rx: 0, ry: 49, rz: 0}},
    {name: '臀部', pos: {x: 0, y: 0, z: -0.75, rx: 180, ry: 0, rz: -180}},
    {name: '脚掌', pos: {x: 0, y: -2, z: 0.1, rx: 90, ry: 0, rz: -0}},
  ]

  export default {
    name: 'SketchOnModel',
    data: () => ({
      camPos: CAM_POS_LIST[0].pos,
      camPosList: CAM_POS_LIST,
      controlsDisabled: true,
      camMoveSmoothly: false,
    }),
    components: {
      Human3dView
    },
    computed: {
      rx: {
        get () {
          return this.camPos.rx / Math.PI * 180
        },
        set (val) {
          this.camPos.rx = val * Math.PI / 180
        }
      },
      ry: {
        get () {
          return this.camPos.ry / Math.PI * 180
        },
        set (val) {
          this.camPos.ry = val * Math.PI / 180
        }
      },
      rz: {
        get () {
          return this.camPos.rz / Math.PI * 180
        },
        set (val) {
          this.camPos.rz = val * Math.PI / 180
        }
      }
    },
    methods: {
      setCamPos ({x, y, z, rx, ry, rz}) {
        this.camPos = {x, y, z, rx: rx * Math.PI / 180, ry: ry * Math.PI / 180, rz: rz * Math.PI / 180}
      },
    }
  }
</script>

<style scoped lang="scss">
  .sketch-on-model {
    display: flex;
    height: calc(100vh - 48px);

    &__view {
      flex: 1 1 auto;
    }

    &__toolbar {
      flex: 0 0 480px;
      @media (max-width: 568px) {
        display: none;
      }
    }
  }
</style>