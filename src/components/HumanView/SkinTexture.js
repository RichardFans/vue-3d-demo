import {ConnectedComponent} from "../../utils/gl/ConnectedComponent"
import {MarkerBrush} from "./MarkerBrush"
import {deltaE} from "../../utils/gl/gl"
// import {PointBrush} from "./PointBrush"
// import {PointLineBrush} from "./PointLineBrush"
// import {PointCurveBrush} from "./PointCurveBrush"
// import {DermatomeBrush} from "./DermatomeBrush"

// const CANVAS_SIZE = 512
// const DEFAULT_BACKGROUND_IMAGE = 'model/man/texture/defaultBody-sm.png'
const CANVAS_SIZE = 1024
const DEFAULT_BACKGROUND_IMAGE = 'model/man/texture/defaultBody.png'
// const DERMATOME_COLOR = 'rgb(6,241,221)'
// const DERMATOME_SIZE = 1
const DEFAULT_MARK_COLOR = 'rgb(241,6,217)'
const DEFAULT_MARK_SIZE = 2
const KEY_POINT_COLOR = 'rgb(241,237,6)'
const KEY_POINT_SIZE = 3
const KEY_POINT_RANGE = 6
// const DEFAULT_MARK_COLOR1= 'rgb(255,127,80)'
// const DEFAULT_MARK_COLOR2= 'rgb(255,119,255)'
// const DEFAULT_MARK_COLOR3= 'rgb(255,121,217)'
class SkinTexture {
  canvas
  dCanvas   // 用于绘制 dermatome
  sCanvas   // 用于 勾画

  context
  dContext  //
  sContext  //

  parentTexture
  brush
  brushes
  background

  strokeDisabled
  dermatome
  dermatomeVisible

  symmetric // 对称绘制

  constructor (parentTexture, size, backgroundImage) {
    this.canvas = document.createElement("canvas")
    this.dCanvas = document.createElement("canvas")
    this.sCanvas = document.createElement("canvas")
    this.canvas.width = this.canvas.height = size ? size : CANVAS_SIZE
    this.dCanvas.width = this.dCanvas.height = size ? size : CANVAS_SIZE
    this.sCanvas.width = this.sCanvas.height = size ? size : CANVAS_SIZE
    this.context = this.canvas.getContext("2d")
    this.dContext = this.dCanvas.getContext("2d")
    this.sContext = this.sCanvas.getContext("2d")

    if (parentTexture) {
      this.parentTexture = parentTexture
      parentTexture.image = this.canvas
    }

    this.brushes = {}
    this.brushes.marker = new MarkerBrush()
    this.brush = this.brushes.marker
    this.symmetricBrush = new MarkerBrush()

    if (backgroundImage) {
      let that = this
      this.background = document.createElement("img")
      this.background.addEventListener("load", function () {
        that.canvas.width = that.background.naturalWidth
        that.canvas.height = that.background.naturalHeight
        that.refresh(true)
        that.parentTexture.needsUpdate = true
      }, false)
      this.background.src = backgroundImage ? backgroundImage : DEFAULT_BACKGROUND_IMAGE
    }
  }

  activeErase (active) {
    let ctx = this.strokeDisabled ? this.dContext : this.sContext
    if (active) {
      ctx.globalCompositeOperation = 'destination-out'
    } else {
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  checkKeyPoint (x, y, path) {
    const dx2 = (path.key.x - x) * (path.key.x - x)
    const dy2 = (path.key.y - y) * (path.key.y - y)
    return dx2 + dy2 <= KEY_POINT_RANGE * KEY_POINT_RANGE
  }

  analysisStrokeArea () {
    console.time('analysisStrokeArea')
    let ctx = this.sContext
    let w = this.sCanvas.width, h = this.sCanvas.height
    let originData = ctx.getImageData(0, 0, w, h).data

    // 记录勾画过的点
    let data = {}
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * (w * 4) + x * 4
        const r = originData[i], g = originData[i + 1], b = originData[i + 2], a = originData[i + 3]
        if (a > 0) {
          let color = `rgb(${r},${g},${b})`
          if (color === this.brush.color) {
            if (!data[y]) data[y] = {}
            data[y][x] = true
          }
        }
      }
    }

    let result = []
    if (Object.keys(data).length > 0) {
      //
      console.time('ConnectedComponent')
      let brushPaths = (new ConnectedComponent(data, w, h)).getCCList()
      console.timeEnd('ConnectedComponent')
      result = this.__analysisStrokeArea(brushPaths)
      console.timeEnd('analysisStrokeArea')
    }
    return result
  }

  __analysisStrokeArea (brushPaths) {
    brushPaths = brushPaths ?? this.brush.paths
    let result = []
    let data = this.exportDermatome()

    brushPaths.forEach((brushPath) => {
      let oneBrushPathResult = {path: {}, hitKeyPointPath: [], total: brushPath.length}
      brushPath.forEach(({x, y}) => {
        if (data[y] && data[y][x]) {
          this.dermatome.paths.some((path) => {
            if (path.color.a === data[y][x]) {
              oneBrushPathResult.path[path.name] = (oneBrushPathResult.path[path.name] ?? 0) + 1
              if (this.checkKeyPoint(x, y, path)) {
                if (oneBrushPathResult.hitKeyPointPath.indexOf(path.name) === -1) {
                  oneBrushPathResult.hitKeyPointPath.push(path.name)
                }
              }
              return true
            }
          })
        } else {
          oneBrushPathResult.path['unknown'] = (oneBrushPathResult.path['unknown'] ?? 0) + 1
        }
      })

      { // sort
        let path = oneBrushPathResult.path
        let keysSorted = Object.keys(path).sort((a, b) => {
          return path[b] - path[a]
        })
        let pathSorted = {}
        keysSorted.forEach((key) => {
          pathSorted[key] = path[key]
        })
        oneBrushPathResult.path = pathSorted
      }

      for (const key in oneBrushPathResult.path) {
        oneBrushPathResult.path[key] = (oneBrushPathResult.path[key] / brushPath.length * 100).toFixed(1) + '%'
      }

      result.push(oneBrushPathResult)
    })
    return result
  }

  setDermatome (dermatome) {
    this.dermatome = dermatome
  }

  exportDermatome () {
    let ctx = this.dContext
    let w = this.dCanvas.width, h = this.dCanvas.height
    let originData = ctx.getImageData(0, 0, w, h).data
    // console.log('originData', originData)
    let data = {}
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * (w * 4) + x * 4
        const r = originData[i], g = originData[i + 1], b = originData[i + 2], a = originData[i + 3]
        if (a > 0) {
          this.dermatome.paths.some((path) => {
            const c = path.color
            if (c.r === r && c.g === g && c.b === b) {
              if (!data[y]) data[y] = {}
              data[y][x] = c.a
              return true
            }
          })
          if (!data[y] || !data[y][x]) { // 如果没有找到相同的颜色，则可能是遇到了抗锯齿边缘，那么寻找相似度最高的颜色
            if (!data[y]) data[y] = {}
            this.dermatome.paths.reduce((minDeltaE, path) => {
              const c = path.color
              const curDeltaE = deltaE(c.r, c.g, c.b, r, g, b)
              if (curDeltaE < minDeltaE) {
                data[y][x] = c.a
              }
              return Math.min(curDeltaE, minDeltaE)
            }, 100)
          }
        }
      }
    }
    return data
  }

  setBrush (brushType) {
    this.brush = this.brushes[brushType]
  }

  setBrushColor (color) {
    this.brush.color = color
    this.symmetricBrush.color = color
  }

  setBrushSize (r) {
    this.brush.size = r
    this.symmetricBrush.size = r
  }

  getAbsCoordinator (u, v) {
    return {x: Math.floor(u * this.canvas.width), y: Math.floor(v * this.canvas.height)}
  }

  getSymmetricX (x, y) {
    if (x < 800) {
      let mid = 389
      if ((x < 200 && y > 80 * x / 199 + 812) ||
        ((x >= 200 && x <= 380 && y > -80 * x / 199 + 972))) {
        mid = 199
      }
      return 2 * mid - x
    }
    return -1
  }

  strokeStart (u0, v0) {
    let {x, y} = this.getAbsCoordinator(u0, v0)
    // console.log('x, y', x, y)
    let ctx = this.strokeDisabled ? this.dContext : this.sContext
    if (this.background) this.context.drawImage(this.background, 0, 0)
    this.brush.strokeStart(ctx, x, y)
    if (this.strokeDisabled) {
      let sx
      if (this.symmetric && (sx = this.getSymmetricX(x, y)) >= 0) this.symmetricBrush.strokeStart(ctx, sx, y)
      this.drawDermatomeLayer()
    } else {
      if (this.dermatomeVisible) this.drawDermatomeLayer()
      this.drawStrokeLayer()
    }
  }

  stroke (u0, v0) {
    let {x, y} = this.getAbsCoordinator(u0, v0)

    let ctx = this.strokeDisabled ? this.dContext : this.sContext
    if (this.background) this.context.drawImage(this.background, 0, 0)
    this.brush.stroke(ctx, x, y)
    if (this.strokeDisabled) {
      let sx
      if (this.symmetric && (sx = this.getSymmetricX(x, y)) >= 0) this.symmetricBrush.stroke(ctx, sx, y)
      // console.log(this.symmetric, x, sx, y);
      this.drawDermatomeLayer()
    } else {
      if (this.dermatomeVisible) this.drawDermatomeLayer()
      this.drawStrokeLayer()
    }
    this.parentTexture.needsUpdate = true
  }

  strokeEnd (u0, v0) {
    if (u0 !== undefined) {
      let {x, y} = this.getAbsCoordinator(u0, v0)
      let ctx = this.strokeDisabled ? this.dContext : this.sContext
      if (this.background) this.context.drawImage(this.background, 0, 0)
      this.brush.strokeEnd(ctx, x, y)
      if (this.strokeDisabled) {
        let sx
        if (this.symmetric && (sx = this.getSymmetricX(x, y)) >= 0) this.symmetricBrush.strokeEnd(ctx, sx, y)
        this.drawDermatomeLayer()
      } else {
        if (this.dermatomeVisible) this.drawDermatomeLayer()
        this.drawStrokeLayer()
      }
      this.parentTexture.needsUpdate = true
    } else this.brush.strokeEnd()
  }

  restroke () {
    if (!this.strokeDisabled) {
      if (this.background) this.context.drawImage(this.background, 0, 0)
      if (this.dermatomeVisible) this.drawDermatomeLayer()
      this.drawStrokeLayer()
      this.parentTexture.needsUpdate = true
    }
  }

  drawStrokeLayer () {
    // this.context.globalAlpha = .8
    this.context.drawImage(this.sCanvas, 0, 0)
    // this.context.globalAlpha = 1
  }

  refresh (reloadDermatome) {
    // console.log('reloadDermatome', reloadDermatome)
    if (this.background) this.context.drawImage(this.background, 0, 0)
    if (reloadDermatome) this.loadDermatome(this.dermatome)
    if (this.dermatomeVisible) this.drawDermatomeLayer()
    this.sContext.clearRect(0, 0, this.sCanvas.width, this.sCanvas.height)  // 清除勾画痕迹
    this.parentTexture.needsUpdate = true
  }

  drawDermatomeLayer () {
    if (!this.strokeDisabled) this.context.globalAlpha = .6
    let ctx = this.context
    ctx.drawImage(this.dCanvas, 0, 0)
    this.dermatome.paths.forEach((path) => {
      if (path.draw) {
        this.mark(path.key.x, path.key.y, KEY_POINT_SIZE, KEY_POINT_COLOR, path.name)
        if (path.keyPair) {
          this.mark(path.keyPair.x, path.keyPair.y, KEY_POINT_SIZE, KEY_POINT_COLOR, path.name)
        }
      }
    })
    if (!this.strokeDisabled) this.context.globalAlpha = 1
  }

  loadDermatome (dermatome) {
    this.dContext.clearRect(0, 0, this.dCanvas.width, this.dCanvas.height)
    let ctx = this.dContext
    let backupFillStyle = ctx.fillStyle

    Object.keys(dermatome.data).forEach((y) => {
      Object.keys(dermatome.data[y]).forEach((x) => {
        dermatome.paths.some((path) => {
          const {r, g, b, a} = path.color
          if (path.draw && a === dermatome.data[y][x]) {
            ctx.fillStyle = `rgb(${r},${g},${b})`
            ctx.fillRect(x, y, 1, 1)
            return true
          }
        })
      })
    })
    ctx.fillStyle = backupFillStyle
  }

  mark (x, y, r, color, name) {
    let ctx = this.context
    color = color ? color : DEFAULT_MARK_COLOR
    r = r ? r : DEFAULT_MARK_SIZE
    ctx.save()
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arc(x, y, r, 0, 2 * Math.PI, true)
    ctx.fill()

    if (name) {
      ctx.fillStyle = 'white'
      ctx.font = '8px sans-serif'
      ctx.fillText(name, x + r / 2, y)
    }
    ctx.restore()
    this.parentTexture.needsUpdate = true
  }
}

export {SkinTexture}