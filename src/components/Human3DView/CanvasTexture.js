import {ChromeBrush} from "./ChromeBrush"
import {ConnectedComponent} from "../../utils/gl/ConnectedComponent"
// import {PointBrush} from "./PointBrush"
// import {PointLineBrush} from "./PointLineBrush"
// import {PointCurveBrush} from "./PointCurveBrush"
// import {DermatomeBrush} from "./DermatomeBrush"

// const CANVAS_SIZE = 512
// const DEFAULT_BACKGROUND_IMAGE = 'model/man/texture/defaultBody-sm.png'
const CANVAS_SIZE = 1024
const DEFAULT_BACKGROUND_IMAGE = 'model/man/texture/defaultBody.png'
const DERMATOME_COLOR = 'rgb(6,241,221)'
const DERMATOME_SIZE = 1
const DEFAULT_MARK_COLOR = 'rgb(241,6,217)'
const DEFAULT_MARK_SIZE = 2
const KEY_POINT_COLOR = 'rgb(69,6,241)'
const KEY_POINT_SIZE = 3
const KEY_POINT_RANGE = 6

class CanvasTexture {
  canvas
  context
  parentTexture
  brush
  brushes
  background
  dermatome
  dermatomeVisible

  constructor (parentTexture, size, backgroundImage) {
    this.canvas = document.createElement("canvas")
    this.canvas.width = this.canvas.height = size ? size : CANVAS_SIZE
    this.context = this.canvas.getContext("2d")

    if (parentTexture) {
      this.parentTexture = parentTexture
      parentTexture.image = this.canvas
    }

    this.brushes = {}
    this.brushes.chrome = new ChromeBrush(this.context)
    // this.brushes.point = new PointBrush(this.context)
    // this.brushes.pointLine = new PointLineBrush(this.context)
    // this.brushes.pointCurve = new PointCurveBrush(this.context)
    // this.brushes.pointCurve.canvas = this
    // this.brushes.dermatome = new DermatomeBrush(this.context)
    // this.brushes.dermatome.canvas = this
    this.brush = this.brushes.chrome

    let that = this
    this.background = document.createElement("img")
    this.background.addEventListener("load", function () {
      that.canvas.width = that.background.naturalWidth
      that.canvas.height = that.background.naturalHeight
      //
      // that.context.drawImage(that.background, 0, 0)
      that.refresh()
      that.parentTexture.needsUpdate = true
    }, false)
    this.background.src = backgroundImage ? backgroundImage : DEFAULT_BACKGROUND_IMAGE
  }

  checkKeyPoint (x, y, path) {
    const dx2 = (path.key.x - x) * (path.key.x - x)
    const dy2 = (path.key.y - y) * (path.key.y - y)
    return dx2 + dy2 <= KEY_POINT_RANGE * KEY_POINT_RANGE
  }

  analysisStrokeArea () {
    console.time('analysisStrokeArea')
    let ctx = this.context
    let w = this.canvas.width, h = this.canvas.height
    let originData = ctx.getImageData(0, 0, w, h).data

    // 记录勾画过的点
    let data = {}
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * (w * 4) + x * 4
        const r = originData[i], g = originData[i + 1], b = originData[i + 2]
        let color = `rgb(${r},${g},${b})`
        if (color === this.brush.color) {
          if (!data[y]) data[y] = {}
          data[y][x] = true
        }
      }
    }
    //
    console.time('ConnectedComponent')
    let brushPaths = (new ConnectedComponent(data, w, h)).getCCList()
    console.timeEnd('ConnectedComponent')

    let result = this.__analysisStrokeArea(brushPaths)

    console.timeEnd('analysisStrokeArea')
    return result
  }

  __analysisStrokeArea (brushPaths) {
    brushPaths = brushPaths ?? this.brush.paths
    let result = []

    brushPaths.forEach((brushPath) => {
      let oneBrushPathResult = {path: {}, hitKeyPointPath: [], total: brushPath.length}
      brushPath.forEach(({x, y}) => {
        let unknown = true
        this.dermatome.some((path) => {
          if (this.context.isPointInPath(path.instance, x, y)) {
            oneBrushPathResult.path[path.name] = (oneBrushPathResult.path[path.name] ?? 0) + 1
            if (this.checkKeyPoint(x, y, path)) {
              if (oneBrushPathResult.hitKeyPointPath.indexOf(path.name) === -1) {
                oneBrushPathResult.hitKeyPointPath.push(path.name)
              }
            }
            unknown = false
            return true
          }
        })
        if (unknown) oneBrushPathResult.path['unknown'] = (oneBrushPathResult.path['unknown'] ?? 0) + 1
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
    this.dermatome.forEach((path) => {
      path.instance = this.getPath2DInstance(path.path)
    })
  }

  getPath2DInstance (path) {
    let path2D = new Path2D()
    let {x: x0, y: y0} = path[0]
    path2D.moveTo(x0, y0)
    if (path.length < 3) {
      for (let i = 1; i < path.length; i++) {
        let {x, y} = path[i]
        path2D.lineTo(x, y)
      }
    } else {
      let i
      for (i = 1; i < path.length - 2; i++) {
        let {x, y} = path[i]
        let {x: x1, y: y1} = path[i + 1]
        path2D.quadraticCurveTo(x, y, (x + x1) / 2, (y + y1) / 2)
        // this.context.lineTo(x, y)
      }
      let {x, y} = path[i]
      let {x: x1, y: y1} = path[i + 1]
      path2D.quadraticCurveTo(x, y, x1, y1)
    }
    path2D.closePath()
    return path2D
  }

  setBrush (brushType) {
    this.brush = this.brushes[brushType]
  }

  getAbsCoordinator (u, v) {
    return {x: Math.floor(u * this.canvas.width), y: Math.floor(v * this.canvas.height)}
  }

  strokeStart (u0, v0) {
    let {x, y} = this.getAbsCoordinator(u0, v0)
    this.brush.strokeStart(x, y)
  }

  stroke (u0, v0) {
    let {x, y} = this.getAbsCoordinator(u0, v0)
    this.brush.stroke(x, y)
    this.parentTexture.needsUpdate = true
  }

  strokeEnd (u0, v0) {
    if (u0 !== undefined) {
      let {x, y} = this.getAbsCoordinator(u0, v0)
      this.brush.strokeEnd(x, y)
      this.parentTexture.needsUpdate = true
    } else this.brush.strokeEnd()
  }

  refresh (resetBrushes) {
    this.context.save()
    this.context.drawImage(this.background, 0, 0)
    this.drawDermatome()
    this.context.restore()
    if (resetBrushes) {
      for (const brush of Object.entries(this.brushes)) {
        brush[1].reset()
      }
    }
    this.parentTexture.needsUpdate = true
  }

  drawDermatome () {
    if (this.dermatomeVisible && this.dermatome) {
      this.dermatome.forEach((path) => {
        if (path.draw) {
          this.mark(path.key.x, path.key.y, KEY_POINT_SIZE, KEY_POINT_COLOR)
          this.drawCurvePath(path.path, path.instance, DERMATOME_COLOR, DERMATOME_SIZE)
          // this.drawCurveArrowPath(path.path, DERMATOME_COLOR, DERMATOME_SIZE)
        }
      })
    }
  }

  drawAllDermatome () {
    this.context.save()
    this.dermatome.forEach((path) => {
      this.mark(path.key.x, path.key.y, KEY_POINT_SIZE, KEY_POINT_COLOR)
      this.drawCurvePath(path.path, path.instance, DERMATOME_COLOR, DERMATOME_SIZE, [5, 3])
    })
    this.context.restore()
  }

  redraw () {
    this.refresh()
    if (this.brush.redraw) {
      this.brush.redraw()
    }
  }

  mark (x, y, r, color) {
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
    ctx.restore()
    this.parentTexture.needsUpdate = true
  }

  drawCurvePath (path, instance, color, size, dashedLine) {
    //
    this.context.save()
    this.context.lineWidth = size / 2
    this.context.strokeStyle = color
    this.context.fillStyle = color
    if (dashedLine) {
      this.context.setLineDash(dashedLine)
    }

    this.context.beginPath()
    for (let i = 0; i < path.length; i++) {
      let {x, y} = path[i]
      this.context.moveTo(x + size, y)
      this.context.arc(x, y, size, 0, 2 * Math.PI, true)
    }
    this.context.fill()
    //
    this.context.stroke(instance)
    this.context.restore()
  }

  drawCurveArrowPath (path, color, size) {
    this.context.lineWidth = size / 2

    let {x: x0, y: y0} = path[0]
    if (path.length < 3) {
      this.context.beginPath()
      this.context.moveTo(x0, y0)
      for (let i = 1; i < path.length; i++) {
        let {x, y} = path[i]
        this.context.lineTo(x, y)
      }
      this.context.closePath()
      this.context.stroke()
    } else {
      let i
      for (i = 1; i < path.length - 2; i++) {
        let {x, y} = path[i]
        let {x: x1, y: y1} = path[i + 1]
        this.drawCurveArrow(x0, y0, (x + x1) / 2, (y + y1) / 2, x, y, size * 4, color)
        x0 = (x + x1) / 2
        y0 = (y + y1) / 2
      }
      let {x, y} = path[i]
      let {x: x1, y: y1} = path[i + 1]
      this.context.quadraticCurveTo(x, y, x1, y1)
      this.drawCurveArrow(x0, y0, x1, y1, x, y, size * 4, color)
    }
  }

  drawCurveArrow (startPointX, startPointY,
                  endPointX, endPointY,
                  quadPointX, quadPointY, arrowWidth, color) {
    let ctx = this.context
    ctx.save()
    ctx.strokeStyle = color
    // angle of the end tangeant, useful for drawing the arrow head
    let arrowAngle = Math.atan2(quadPointX - endPointX, quadPointY - endPointY) + Math.PI

    // start a new path
    ctx.beginPath()
    // Body of the arrow
    ctx.moveTo(startPointX, startPointY)
    ctx.quadraticCurveTo(quadPointX, quadPointY, endPointX, endPointY)
    // Head of the arrow
    ctx.moveTo(endPointX - (arrowWidth * Math.sin(arrowAngle - Math.PI / 6)),
      endPointY - (arrowWidth * Math.cos(arrowAngle - Math.PI / 6)))

    ctx.lineTo(endPointX, endPointY)

    ctx.lineTo(endPointX - (arrowWidth * Math.sin(arrowAngle + Math.PI / 6)),
      endPointY - (arrowWidth * Math.cos(arrowAngle + Math.PI / 6)))

    ctx.stroke()
    ctx.closePath()
    ctx.restore()
  }
}

export {CanvasTexture}