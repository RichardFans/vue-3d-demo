const DEFAULT_COLOR = 'rgb(241,6,53)'
const DEFAULT_SIZE = 2
const MIN_DISTANCE = 50 ** 2

class MarkerBrush {
  size
  color
  prevX
  prevY

  constructor (size, color) {
    this.size = size ? size : DEFAULT_SIZE
    this.color = color ? color : DEFAULT_COLOR
  }

  reset () {
    this.prevX = undefined
    this.prevY = undefined
  }

  strokeStart (ctx, x, y) {
    this.prevX = x
    this.prevY = y
    ctx.beginPath()
    ctx.save()
    ctx.lineWidth = this.size * 2
    ctx.strokeStyle = this.color
    ctx.lineJoin = ctx.lineCap = 'round'
    ctx.moveTo(x, y)
  }

  stroke (ctx, x, y) {
    let dx, dy, d
    dx = x - this.prevX
    dy = y - this.prevY
    d = dx * dx + dy * dy
    // console.log(d, dx, dy, 'x,y', x, y, 'px,py', this.prevX, this.prevY)

    ctx.moveTo(this.prevX, this.prevY)
    if (d <= MIN_DISTANCE) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    this.prevX = x
    this.prevY = y
  }

  strokeEnd (ctx) {
    ctx.restore()
  }
}

export {MarkerBrush}
