<template>
  <div>
    <div class="sketch-on-model">
      <HumanView
          ref="humanView"
          class="sketch-on-model__view" v-bind:cam-pos.sync="camPos"
          @point-pick="onPickPoint" :stroke-disabled="strokeDisabled"
          :dermatome-visible="dermatomeVisible"
          :symmetric="symmetric"
          :current-path-index="dermatomeTab"
          :dermatome="dermatome" :brush-size="brushSize" :erase-active="eraseActive"
          :controlsDisabled="controlsDisabled" :cam-move-smoothly="camMoveSmoothly"></HumanView>
      <div class="sketch-on-model__toolbar">
        <v-card width="480" class="pa-2 fill-height" outlined tile>
          <v-tabs v-model="tab">
            <v-tab>编辑</v-tab>
            <v-tab>摄像机</v-tab>
          </v-tabs>
          <v-tabs-items v-model="tab">
            <v-tab-item>
              <v-card flat class="pt-2">
                <v-slider
                    v-model="brushSize"
                    max="30"
                    min="1"
                    hide-details
                    class="align-center">
                  <template v-slot:prepend>
                    <div style="width: 72px">笔刷尺寸</div>
                  </template>
                  <template v-slot:append>
                    <div>{{brushSize}}px</div>
                  </template>
                </v-slider>
                <v-toolbar dense>
                  <v-col cols="auto" class="pl-0">
                    <v-select
                        style="width:160px"
                        v-model="mode"
                        :items="modes"
                        label="模式选择"
                        outlined
                        dense
                        @change="dermatomeVisibleInStrokeMode=false"
                        hide-details>
                    </v-select>
                  </v-col>

                  <v-spacer></v-spacer>

                  <v-btn small icon title="调整摄像机" @click="controlsDisabled=!controlsDisabled"
                         :color="controlsDisabled?'':'red'">
                    <v-icon small>mdi-video-switch</v-icon>
                  </v-btn>
                  <v-btn small icon title="橡皮擦" @click="toggleEraseActive"
                         :color="eraseActive?'red':''">
                    <v-icon small>mdi-eraser</v-icon>
                  </v-btn>
                  <v-btn small icon title="清空重绘" @click="refresh(strokeDisabled)">
                    <v-icon small>mdi-refresh</v-icon>
                  </v-btn>

                  <div v-if="strokeDisabled">
                    <v-btn small icon title="对称绘制" @click="symmetric=!symmetric"
                           :color="symmetric?'red':''">
                      <v-icon small>mdi-axis</v-icon>
                    </v-btn>

                    <v-btn small icon title="保存Dermatome" @click="saveDermatome">
                      <v-icon small>mdi-content-save</v-icon>
                    </v-btn>
                    <v-btn small icon title="导出Dermatome" @click="exportDermatome">
                      <v-icon small>mdi-file-export</v-icon>
                    </v-btn>
                    <text-file-reader @load="importDermatome" icon="mdi-file-import" small
                                      accept="application/json"
                                      title="导入Dermatome"></text-file-reader>

                    <v-btn small icon @click="createOrUpdatePath()" title="创建路径">
                      <v-icon small>mdi-plus</v-icon>
                    </v-btn>
                  </div>
                  <div v-else>
                    <v-btn small icon :title="(dermatomeVisibleInStrokeMode?'隐藏':'显示')+'Dermatome'"
                           :color="dermatomeVisibleInStrokeMode?'red':''" @click="toggleDermatomeInStrokeMode">
                      <v-icon small>mdi-draw</v-icon>
                    </v-btn>
                    <v-btn small icon title="命中区域分析" @click="analysisStrokeArea">
                      <v-icon small>mdi-chart-line</v-icon>
                    </v-btn>
                  </div>
                </v-toolbar>
                <v-tabs v-if="this.strokeDisabled" vertical @change="onPathTabChange" v-model="dermatomeTab">
                  <v-tab v-for="(path,i) in dermatome.paths" :key="i">
                    <div class="path-tab" :style="{background:`rgb(${path.color.r},${path.color.g},${path.color.b})`}">
                      {{path.name}}
                    </div>
                  </v-tab>
                  <v-tab-item v-for="(path,i) in dermatome.paths" :key="i" class="pl-2">
                    <v-card flat>
                      <v-subheader>
                        <v-checkbox v-model="path.draw" label="绘制该段" dense hide-details class="mt-0"/>
                        <v-spacer></v-spacer>

                        <v-btn small icon @click="createOrUpdatePath(path)" title="编辑路径">
                          <v-icon small>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn small icon @click="removePath(i)" title="删除路径">
                          <v-icon small>mdi-close</v-icon>
                        </v-btn>
                        <v-btn small icon @click="copyPathToClipboard(path)" title="拷贝路径">
                          <v-icon small>mdi-clipboard-outline</v-icon>
                        </v-btn>
                      </v-subheader>

                      <v-row align="center">
                        <v-col>
                          <v-text-field v-model="path.key.x" outlined type="number" step="1" hide-details
                                        label="关键点u" dense></v-text-field>
                        </v-col>
                        <v-col>
                          <v-text-field v-model="path.key.y" outlined type="number" step="1" hide-details
                                        label="关键点v" dense></v-text-field>
                        </v-col>
                        <v-col cols="auto">
                          <v-btn small icon title="镜像关键点" @click="onKeyPairChange(path)"
                                 :color="path.keyPair?'red':''">
                            <v-icon small>mdi-axis</v-icon>
                          </v-btn>
                          <v-btn small icon @click="pickPoint(path.key)" title="坐标拾取"
                                 :color="waitPickPoint===path.key?'red':''">
                            <v-icon small>mdi-eyedropper-variant</v-icon>
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-card>
                  </v-tab-item>
                </v-tabs>
                <div v-else class="overflow-y-auto" style="max-height:600px">
                  <v-card v-for="(path, i) in analysisResult" :key="i" outlined tile>
                    <v-card-subtitle>此部分共勾画了<span class="red--text">{{path.total}}</span>个点</v-card-subtitle>
                    <v-card-subtitle>命中关键点</v-card-subtitle>
                    <v-card-text>
                      <div v-if="path.hitKeyPointPath.length>0">
                        <v-chip v-for="(keyPointPathName, j) in path.hitKeyPointPath" :key="j">{{keyPointPathName}}
                        </v-chip>
                      </div>
                      <div v-else>无</div>
                    </v-card-text>

                    <v-card-subtitle>包含区域</v-card-subtitle>
                    <v-card-text>
                      <v-chip v-for="(percent, name, i) in path.path" :key="i">
                        {{name}}
                        <span class="mx-2 darken-4 green--text">
                        {{percent}}
                      </span>
                      </v-chip>
                    </v-card-text>

                  </v-card>
                </div>

              </v-card>
            </v-tab-item>
            <v-tab-item>
              <v-card flat class="pt-2">
                <v-row>
                  <v-col cols="4">
                    <v-text-field v-model="camPos.x" outlined type="number" step="0.1" hide-details
                                  label="位置x" dense></v-text-field>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field v-model="camPos.y" outlined type="number" step="0.1" hide-details
                                  label="位置y" dense></v-text-field>
                  </v-col>
                  <v-col cols="4">
                    <v-text-field v-model="camPos.z" outlined type="number" step="0.1" hide-details
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
                  <v-col>
                    <v-checkbox v-model="controlsDisabled" label="禁用控制轨道" dense hide-details/>
                  </v-col>
                  <v-col>
                    <v-checkbox v-model="camMoveSmoothly" label="摄像头平滑移动" dense hide-details/>
                  </v-col>
                </v-row>
                <v-row align="center">
                  <v-col v-for="(cam, i) in camPosList" :key="i">
                    <v-btn @click="setCamPos(cam.pos)">{{cam.name}}</v-btn>
                  </v-col>
                </v-row>
              </v-card>
            </v-tab-item>
          </v-tabs-items>
        </v-card>
      </div>
    </div>

  </div>

</template>

<script>
  // @ is an alias to /src
  import HumanView from "../components/HumanView/HumanView"
  import PathDlg from "./EditDermatome2/PathDlg"
  import FileSaver from 'file-saver'
  import TextFileReader from "../components/TextFileReader"
  import {hexToRGB, RGBToHex} from "../utils/gl/gl"
  // import {ConnectedComponent} from "../utils/gl/ConnectedComponent"

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

  const DERMATOME = {
    paths: [
      {
        name: "L1",
        draw: true,
        key: {x: 0, y: 0},
        keyPair: {x: 0, y: 0},
        color: {r: 192, g: 192, b: 192, a: 255},  // 这个是PathDlg中的第一个颜色 '#C0C0C0'
      }
    ],
    data: {}
  }

  export default {
    name: 'EditDermatome2',
    data: () => ({
      camPos: CAM_POS_LIST[0].pos,
      camPosList: CAM_POS_LIST,
      controlsDisabled: true,
      camMoveSmoothly: false,
      tab: null,
      brushSize: 3,
      eraseActive: false,
      dermatomeTab: 0,
      dermatome: DERMATOME,
      waitPickPoint: null,
      mode: 'dermatome',
      symmetric: true,
      modes: ['stroke', 'dermatome'],
      dermatomeVisibleInStrokeMode: false,
      analysisResult: []
    }),
    components: {
      TextFileReader,
      HumanView
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
      },
      strokeDisabled () {
        return this.mode !== 'stroke'
      },
      dermatomeVisible () {
        return this.strokeDisabled || this.dermatomeVisibleInStrokeMode
      }
    },
    methods: {
      onKeyPairChange (path) {
        // path.keyPair = path.keyPair ? false : this.$refs.humanView.getBodyCanvasSymmetricPoint(path.key)
        this.$set(path, 'keyPair', path.keyPair ? false : this.$refs.humanView.getBodyCanvasSymmetricPoint(path.key))
        this.refresh()
      },
      toggleDermatomeInStrokeMode () {
        this.dermatomeVisibleInStrokeMode = !this.dermatomeVisibleInStrokeMode
      },
      toggleEraseActive () {
        this.eraseActive = !this.eraseActive
        this.waitPickPoint = null
      },
      analysisStrokeArea () {
        this.analysisResult = this.$refs.humanView.analysisStrokeArea()
        if (this.analysisResult.length === 0) {
          this.msg('请先勾画疼痛部位！')
        }
      },
      refresh (loadDermatome) {
        this.$refs.humanView.refresh(loadDermatome)
      },
      saveDermatome () {
        this.dermatome.data = this.$refs.humanView.exportDermatome()
        localStorage.setItem('dermatome2', JSON.stringify(this.dermatome))
      },
      exportDermatome () {
        let text = JSON.stringify(this.dermatome)
        // text = text.replace(/"([^"]+)":/g, '$1:')
        let blob = new Blob([text], {type: "text/plain;charset=utf-8"})
        FileSaver.saveAs(blob, "dermatome.json")
      },
      importDermatome (text) {
        this.dermatome = JSON.parse(text)
        this.$nextTick(() => {
          this.refresh(this.strokeDisabled)
        })
      },
      setCamPos ({x, y, z, rx, ry, rz}) {
        this.camPos = {x, y, z, rx: rx * Math.PI / 180, ry: ry * Math.PI / 180, rz: rz * Math.PI / 180}
      },
      async createOrUpdatePath (path) {
        let paths = this.dermatome.paths
        if (path) paths = paths.filter((p) => path.name !== p.name)
        const excludeColors = paths.map(({color: {r, g, b}}) => RGBToHex(r, g, b).toUpperCase())
        const result = await this.$dialog.showAndWait(PathDlg, {target: path, excludeColors: excludeColors})
        if (result && result.data) {
          const resultName = result.data.name.toUpperCase()
          if (paths.findIndex((p) => p.name === resultName) !== -1) {
            this.msg('路径名称不能重复')
            return
          }
          const color = hexToRGB(result.data.color, result.data.alpha, true)
          if (path) {
            path.name = resultName
            path.color = color
          } else {
            this.dermatome.paths.push({
              name: resultName,
              color: color,
              draw: true,
              key: {x: 0, y: 0},
            })
            this.dermatomeTab = this.dermatome.paths.length - 1
          }
        }
      },
      async removePath (i) {
        if (this.dermatome.paths.length < 2) {
          this.msg('再删就没路径啦亲')
          return
        }
        let res = await this.$dialog.confirm({
          text: '你确定要删除此路径吗？',
          persistent: true,
          actions: {
            No: "取消",
            Yes: "确定"
          }
        })
        if (res === 'Yes') {
          this.dermatome.paths.splice(i, 1)
          this.waitPickPoint = null
          this.refresh(true)
        }
      },
      copyPathToClipboard (path) {
        let text = JSON.stringify(path)
        // text = text.replace(/"([^"]+)":/g, '$1:')
        this.$copyText(text).then(() => {
          this.msg('已拷贝到剪贴板')
        })
      },
      pickPoint (point) {
        if (this.waitPickPoint !== point) {
          this.waitPickPoint = point
          this.eraseActive = false
          this.refresh()
          this.$refs.humanView.mark(point.x, point.y)
        } else {
          this.waitPickPoint = null
          this.refresh()
        }
      },
      onPickPoint ({x, y}) {
        if (!this.strokeDisabled) return
        if (this.waitPickPoint &&
          (this.waitPickPoint.x !== x || this.waitPickPoint.y !== y)) {
          this.waitPickPoint.x = x
          this.waitPickPoint.y = y
          this.refresh()
          this.$refs.humanView.mark(x, y)
        }
      },
      onPathTabChange () {
        this.waitPickPoint = null
        this.refresh()
      },
      msg (text) {
        this.$dialog.message.info(text, {position: 'top-center'})
      }
    },
    mounted () {
      this.setCamPos(this.camPosList[8].pos)
      // const d = {
      //   0: {1: true, 2: true, 3: true, 4: true, 5: true, 9: true, 10: true, 11: true, 12: true},
      //   1: {5: true, 6: true, 8: true, 9: true},
      //   2: {1: true, 2: true, 3: true, 6: true, 7: true},
      // }
      // const d = {
      //   0: [1, 2, 3, 4, 5, 9, 10, 11, 12],
      //   1: [5, 6, 8, 9],
      //   2: [1, 2, 3, 6, 7],
      // }
      // console.log('cc', (new ConnectedComponent(d, 4, 14)).getCCList())
    },
    beforeMount () {
      // store.commit(RETRIEVE_DERMATOME2)
      let dermatomeStr = localStorage.getItem('dermatome2')
      if (dermatomeStr) {
        this.dermatome = JSON.parse(dermatomeStr)
      }
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

  .path-tab {
    width: 80px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
  }
</style>