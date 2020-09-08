const DEFAULT_COLOR = 'rgb(241,6,174)'
const DEFAULT_SIZE = 2

class DermatomeBrush {
  context
  background

  size
  color

  canvas

  constructor (context, size, color) {
    this.context = context

    if (RegExp(" AppleWebKit/").test(navigator.userAgent))
      this.context.globalCompositeOperation = 'darker'

    this.size = size ? size : DEFAULT_SIZE
    this.color = color ? color : DEFAULT_COLOR
  }

  setBackground (background) {
    this.background = background
  }

  reset () {
  }

  strokeStart () {
  }

  stroke () {
  }

  strokeEnd (x, y) {
    //
    if (this.canvas) this.canvas.refresh()
    //
    this.context.save()
    this.context.color = DEFAULT_COLOR
    this.context.beginPath()
    this.context.moveTo(x + this.size, y)
    this.context.arc(x, y, this.size, 0, 2 * Math.PI, true)
    this.context.fill()
    this.context.restore()
  }
}

export {DermatomeBrush}