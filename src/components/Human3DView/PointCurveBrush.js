const DEFAULT_COLOR = 'rgb(241,6,53)'
const DEFAULT_SIZE = 2

class PointCurveBrush {
  context
  background

  size
  color
  points
  count

  canvas

  constructor (context, size, color) {
    this.context = context

    if (RegExp(" AppleWebKit/").test(navigator.userAgent))
      this.context.globalCompositeOperation = 'darker'

    this.points = []
    this.count = 0
    this.size = size ? size : DEFAULT_SIZE
    this.color = color ? color : DEFAULT_COLOR
  }

  setBackground (background) {
    this.background = background
  }

  reset () {
    this.points = []
    this.count = 0
  }

  strokeStart () {
  }

  stroke () {
  }

  strokeEnd (x, y) {
    this.points.push({x, y})
    //
    if (this.canvas) this.canvas.refresh()
    //
    this.canvas.drawCurvePath(this.points, this.color, this.size)
  }
}

export {PointCurveBrush}