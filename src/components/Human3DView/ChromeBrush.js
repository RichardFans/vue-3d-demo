// todo: 保持画笔的透明度小于1,这是后面计算勾画区域的依据
const DEFAULT_COLOR = 'rgb(236,0,128)'
const DEFAULT_SIZE = 3
const MIN_DISTANCE = 10 ** 2

class ChromeBrush {
  context
  prevX
  prevY

  points
  count
  size
  color

  paths

  constructor (context, size, color) {
    this.context = context

    if (RegExp(" AppleWebKit/").test(navigator.userAgent))
      this.context.globalCompositeOperation = 'darker'

    this.points = []
    this.paths = []
    this.count = 0
    this.size = size ? size : DEFAULT_SIZE
    this.color = color ? color : DEFAULT_COLOR
  }

  reset () {
    this.points = []
    this.paths = []
    this.count = 0
    this.prevX = undefined
    this.prevY = undefined
    this.context.lineWidth = this.size
    this.context.strokeStyle = this.color
  }

  strokeStart (x, y) {
    this.prevX = x
    this.prevY = y
    this.paths.push([{x, y}])
  }

  stroke (x, y) {
    let i, dx, dy, d

    this.points.push([x, y])
    this.paths[this.paths.length - 1].push({x, y})

    this.context.save()
    this.context.lineWidth = this.size
    this.context.strokeStyle = this.color

    dx = x - this.prevX
    dy = y - this.prevY
    d = dx * dx + dy * dy

    if (d < MIN_DISTANCE) {
      this.context.beginPath()
      this.context.moveTo(this.prevX, this.prevY)
      this.context.lineTo(x, y)
      this.context.stroke()
    }

    for (i = 0; i < this.points.length; i++) {
      dx = this.points[i][0] - this.points[this.count][0]
      dy = this.points[i][1] - this.points[this.count][1]
      d = dx * dx + dy * dy
      if (d < MIN_DISTANCE) {
        this.context.strokeStyle = this.color
        this.context.beginPath()
        this.context.moveTo(this.points[this.count][0] + (dx * 0.2), this.points[this.count][1] + (dy * 0.2))
        this.context.lineTo(this.points[i][0] - (dx * 0.2), this.points[i][1] - (dy * 0.2))
        this.context.stroke()
      }
    }
    this.context.restore()

    this.prevX = x
    this.prevY = y

    this.count++
  }

  strokeEnd () {

  }

  redraw () {
    let paths = this.paths
    this.context.save()
    this.reset()
    paths.forEach((path) => {
      path.forEach((point, i) => {
        if (i === 0) {
          this.strokeStart(point.x, point.y)
        } else {
          this.stroke(point.x, point.y)
        }
      })
    })
    this.context.restore()
  }
}

export {ChromeBrush}