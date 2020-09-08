const DEFAULT_COLOR = 'rgba(241,6,53,0.78)'
const DEFAULT_SIZE = 2

class PointBrush {
  context
  size
  color

  constructor (context, size, color) {
    this.context = context

    if (RegExp(" AppleWebKit/").test(navigator.userAgent))
      this.context.globalCompositeOperation = 'darker'

    this.size = size ? size : DEFAULT_SIZE
    this.color = color ? color : DEFAULT_COLOR
  }

  reset () {
    this.prevX = undefined
    this.prevY = undefined
  }

  strokeStart () {
  }

  stroke () {
  }

  strokeEnd (x, y) {
    this.context.strokeStyle = this.color
    this.context.fillStyle = this.color
    this.context.beginPath()
    this.context.arc(x, y, this.size, 0, 2 * Math.PI, true)
    this.context.fill()
  }
}

export {PointBrush}