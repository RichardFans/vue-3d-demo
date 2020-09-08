<template>
  <div>
    <div class="sketch-on-model">
      <Human3dView
          ref="human3dView"
          class="sketch-on-model__view" v-bind:cam-pos.sync="camPos"
          @point-pick="onPickPoint" :stroke-disabled="strokeDisabled" :dermatome="dermatome"
          :controlsDisabled="controlsDisabled" :cam-move-smoothly="camMoveSmoothly"></Human3dView>
      <div class="sketch-on-model__toolbar">
        <v-card width="480" class="pa-2 fill-height" outlined tile>
          <v-tabs v-model="tab">
            <v-tab>编辑</v-tab>
            <v-tab>摄像机</v-tab>
          </v-tabs>
          <v-tabs-items v-model="tab">
            <v-tab-item>
              <v-card flat class="pt-2">
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

                  <div v-if="strokeDisabled">
                    <v-btn small icon title="清空重绘" @click="refresh">
                      <v-icon small>mdi-refresh</v-icon>
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
                    <v-btn small icon title="调整摄像机" @click="controlsDisabled=!controlsDisabled"
                           :color="controlsDisabled?'':'red'">
                      <v-icon small>mdi-video-switch</v-icon>
                    </v-btn>
                    <v-btn small icon title="切换Dermatome" @click="toggleDermatomeInStrokeMode"
                           :color="dermatomeVisibleInStrokeMode?'red':''">
                      <v-icon small>mdi-draw</v-icon>
                    </v-btn>
                    <v-btn small icon title="擦除" @click="erase">
                      <v-icon small>mdi-eraser</v-icon>
                    </v-btn>
                    <v-btn small icon title="命中区域分析" @click="analysisStrokeArea">
                      <v-icon small>mdi-chart-line</v-icon>
                    </v-btn>
                  </div>
                </v-toolbar>
                <v-tabs v-if="this.strokeDisabled" vertical @change="onPathTabChange">
                  <v-tab v-for="(path,i) in dermatome" :key="i" v-model="dermatomeTab">
                    {{path.name}}
                  </v-tab>
                  <v-tab-item v-for="(path,i) in dermatome" :key="i" v-model="dermatomeTab" class="pl-2">
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
                          <v-btn small icon @click="pickPoint(path.key,true)" title="坐标拾取"
                                 :color="waitPickPoint===path.key?'red':''">
                            <v-icon small>mdi-eyedropper-variant</v-icon>
                          </v-btn>
                        </v-col>
                      </v-row>

                      <v-subheader>
                        路径点
                        {{dermatomeTab?dermatomeTab.name:'x'}}
                        <v-spacer></v-spacer>
                        <v-btn small icon @click="toggleAutoPickMode(path)" :color="path.autoPickMode?'red':''"
                               title="拾取后自动切到下一个点">
                          <v-icon small>mdi-animation</v-icon>
                        </v-btn>
                        <v-btn small icon @click="addPoint(path)">
                          <v-icon small>mdi-plus</v-icon>
                        </v-btn>
                      </v-subheader>

                      <v-container class="overflow-y-auto" style="max-height:600px">
                        <v-row v-for="(point,j) in path.path" :key="j" dense align="center">
                          <v-col cols="auto">{{j+1}}.</v-col>
                          <v-col>
                            <v-text-field v-model="point.x" outlined type="number" step="1" hide-details
                                          label="x" dense></v-text-field>
                          </v-col>
                          <v-col>
                            <v-text-field v-model="point.y" outlined type="number" step="1" hide-details
                                          label="y" dense></v-text-field>
                          </v-col>
                          <v-col cols="auto">
                            <v-btn small icon>
                              <v-icon small @click="removePoint(path, j)">mdi-close</v-icon>
                            </v-btn>
                            <v-btn small icon @click="addPoint(path, j)">
                              <v-icon small>mdi-plus</v-icon>
                            </v-btn>
                            <v-btn small icon @click="pickPoint(path.path[j])" title="坐标拾取"
                                   :color="waitPickPoint===path.path[j]?'red':''">
                              <v-icon small>mdi-eyedropper-variant</v-icon>
                            </v-btn>
                          </v-col>
                        </v-row>
                      </v-container>

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
  import Human3dView from "../components/Human3DView/Human3dView"
  import PathDlg from "./EditDermatome/PathDlg"
  import {RETRIEVE_DERMATOME, SET_DERMATOME} from "../store/mutation-types"
  import store from '../store'
  import FileSaver from 'file-saver'
  import TextFileReader from "../components/TextFileReader"
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

  const DERMATOME = [
    {
      name: "S2",
      draw: true,
      autoPickMode: false,
      key: {x: 518, y: 629},
      path: [{x: 488, y: 592}, {x: 491, y: 621}, {x: 501, y: 646}, {x: 512, y: 669}, {x: 523, y: 687}, {
        x: 538,
        y: 697
      }, {x: 551, y: 697}, {x: 560, y: 678}, {x: 550, y: 654}, {x: 541, y: 621}, {x: 530, y: 591}, {
        x: 509,
        y: 582
      }, {x: 494, y: 586}, {x: 488, y: 592}, {x: 486, y: 600}, {x: 488, y: 612}, {x: 491, y: 621}, {x: 488, y: 592}]
    },
    {
      name: "S1",
      draw: true,
      autoPickMode: false,
      key: {x: 2, y: 3},
      path: [{x: 508, y: 709}, {x: 509, y: 734}, {x: 511, y: 747}, {x: 519, y: 766}, {x: 532, y: 773}, {
        x: 547,
        y: 779
      }, {x: 566, y: 790}, {x: 581, y: 788}, {x: 578, y: 773}, {x: 572, y: 759}, {x: 570, y: 726}, {
        x: 551,
        y: 711
      }, {x: 532, y: 706}, {x: 521, y: 707}, {x: 522, y: 707}, {x: 519, y: 706}, {x: 514, y: 707}, {
        x: 508,
        y: 707
      }, {x: 507, y: 712}, {x: 507, y: 720}, {x: 508, y: 709}]
    },
  ]

  export default {
    name: 'SketchOnModel',
    data: () => ({
      camPos: CAM_POS_LIST[0].pos,
      camPosList: CAM_POS_LIST,
      controlsDisabled: true,
      camMoveSmoothly: false,
      tab: null,
      dermatomeTab: null,
      dermatome: DERMATOME,
      curPath: null,
      waitPickPoint: null,
      mode: 'dermatome',
      modes: ['stroke', 'dermatome'],
      dermatomeVisibleInStrokeMode: false,
      analysisResult: []
    }),
    components: {
      TextFileReader,
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
      },
      strokeDisabled () {
        return this.mode !== 'stroke'
      }
    },
    methods: {
      toggleDermatomeInStrokeMode () {
        this.dermatomeVisibleInStrokeMode = !this.dermatomeVisibleInStrokeMode
        if (this.dermatomeVisibleInStrokeMode) {
          this.$refs.human3dView.showDermatomeInStrokeMode()
        } else {
          this.$refs.human3dView.hideDermatomeInStrokeMode()
        }
      },
      analysisStrokeArea () {
        this.analysisResult = this.$refs.human3dView.analysisStrokeArea()
      },
      refresh () {
        this.$refs.human3dView.refresh()
      },
      erase () {
        this.refresh()
        this.dermatomeVisibleInStrokeMode = false
      },
      saveDermatome () {
        store.commit(SET_DERMATOME, this.dermatome)
      },
      exportDermatome () {
        let text = JSON.stringify(this.dermatome)
        // text = text.replace(/"([^"]+)":/g, '$1:')
        let blob = new Blob([text], {type: "text/plain;charset=utf-8"})
        FileSaver.saveAs(blob, "dermatome.json")
      },
      importDermatome (text) {
        this.dermatome = JSON.parse(text)
      },
      setCamPos ({x, y, z, rx, ry, rz}) {
        this.camPos = {x, y, z, rx: rx * Math.PI / 180, ry: ry * Math.PI / 180, rz: rz * Math.PI / 180}
      },
      removePoint (path, j) {
        if (path.path.length < 2) {
          this.msg('再删就没点啦亲')
        } else {
          if (this.waitPickPoint === path.path[j]) this.waitPickPoint = null
          path.path.splice(j, 1)
          this.refresh()
        }
      },
      addPoint (path, j) {
        if (j === undefined) j = path.path.length
        let p1 = path.path[j % path.path.length], p2 = path.path[(j + 1) % path.path.length]
        let newPoint = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2}
        path.path.splice(j + 1, 0, newPoint)
        this.pickPoint(newPoint)
      },
      async createOrUpdatePath (path) {
        const result = await this.$dialog.showAndWait(PathDlg, {target: path})
        if (result && result.data) {
          if (result.target) {
            path.name = result.data.name
          } else {
            this.dermatome.push({
              name: result.data.name,
              draw: true,
              autoPickMode: false,
              key: {x: 0, y: 0},
              path: [{x: 0, y: 0}]
            })
          }
        }
      },
      async removePath (i) {
        if (this.dermatome.length < 2) {
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
          this.dermatome.splice(i, 1)
          this.waitPickPoint = null
        }
      },
      copyPathToClipboard (path) {
        let text = JSON.stringify(path)
        // text = text.replace(/"([^"]+)":/g, '$1:')
        this.$copyText(text).then(() => {
          this.msg('已拷贝到剪贴板')
        })
      },
      pickPoint (point, isKeyPoint) {
        if (isKeyPoint) this.curPath.autoPickMode = false
        this.waitPickPoint = point
        this.refresh()
        this.$refs.human3dView.mark(point.x, point.y)
      },
      onPickPoint (uv) {
        if (!this.strokeDisabled) return
        if (this.waitPickPoint) {
          this.waitPickPoint.x = uv.x
          this.waitPickPoint.y = uv.y
          if (this.curPath.autoPickMode) {
            let i = this.curPath.path.indexOf(this.waitPickPoint)
            if (i === -1) {
              this.waitPickPoint = null
            } else {
              if (i === this.curPath.path.length - 1) {
                this.addPoint(this.curPath)
              }
              this.pickPoint(this.curPath.path[i + 1])
            }
          } else {
            // this.waitPickPoint = null
            this.pickPoint(this.waitPickPoint)
          }
        }
      },
      toggleAutoPickMode (path) {
        path.autoPickMode = !path.autoPickMode
        if (path.autoPickMode) {
          if (!this.waitPickPoint || path.path.indexOf(this.waitPickPoint) === -1) {
            this.pickPoint(path.path[0])
          }
        }
      },
      onPathTabChange (i) {
        this.curPath = this.dermatome[i]
      },
      msg (text) {
        this.$dialog.message.info(text, {position: 'top-center'})
      }
    },
    mounted () {
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
      store.commit(RETRIEVE_DERMATOME)
      this.dermatome = JSON.parse(JSON.stringify(store.state.dermatome.data))
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