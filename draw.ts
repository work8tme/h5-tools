import html2canvas from 'html2canvas'
import { sleep } from 'radash'
import { isNumberStr } from './is'

export class DrawCanvas {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement

  width: number
  height: number
  ratio: number
  constructor(options: Draw.CanvasOptions) {
    const { canvasId, width, height } = options
    const canvas = document.querySelector(`#${canvasId}`) as HTMLCanvasElement

    this.canvas = canvas
    this.width = width
    this.height = height
    this.ratio = window.devicePixelRatio || 1

    canvas.width = width * this.ratio
    canvas.height = height * this.ratio

    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    // 检查是否支持 willReadFrequently 属性
    if ('willReadFrequently' in this.ctx) {
      // 设置 willReadFrequently 为 true
      this.ctx.willReadFrequently = true
    }
    this.ctx.scale(this.ratio, this.ratio)
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const image = new Image()

      image.onload = () => {
        res(image)
      }

      image.onerror = e => {
        rej(e)
      }

      image.crossOrigin = 'anonymous'
      image.src = url
    })
  }

  async drawImage(url: string, options: Draw.DrawImageOptions) {
    const { w, h, x, y } = options
    const image = await this.loadImage(url)
    this.ctx.drawImage(image, x, y, w, h)
  }

  getValidTextSingleLine(text: string, maxWith: number) {
    const { width } = this.ctx.measureText(text)

    if (width <= maxWith) {
      return text
    }

    let n = text.length - 1
    let validText = text.slice(0, n) + '...'
    while (this.ctx.measureText(validText).width > maxWith) {
      n--
      validText = text.slice(0, n) + '...'
    }

    return validText
  }

  async drawText(txt: string, options: Draw.DrawTextOptions) {
    const {
      x,
      y,
      maxWidth = 700,
      fontFamily = 'SF',
      fontSize = 14,
      color = '#000',
      bold,
      textAlign = 'left',
      textBaseline = 'top',
      drawBgOptions,
    } = options

    this.ctx.save()
    if (drawBgOptions) {
      await this.drawImage(drawBgOptions?.bg, drawBgOptions)
    }

    const fonts = [
      bold && 'bold',
      isNumberStr(fontSize.toString()) ? `${fontSize}px` : fontSize,
      fontFamily,
    ]
    this.ctx.font = fonts.join(' ')
    if (color) {
      this.ctx.fillStyle = color
    }
    this.ctx.textBaseline = textBaseline
    this.ctx.textAlign = textAlign

    // const text = this.getValidTextSingleLine(txt, maxWidth)
    // const { width } = this.ctx.measureText(text)
    this.ctx.fillText(txt, x, y)
    this.ctx.restore()

    // return width
  }

  drawRoundedPath(options: Draw.DrawRoundedRect) {
    const { x, y, w, h, radius } = options
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + w - radius, y)
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
    this.ctx.lineTo(x + w, y + h - radius)
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
    this.ctx.lineTo(x + radius, y + h)
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
    this.ctx.stroke()
  }

  async drawRect(options: Draw.DrawRectOptions) {
    const {
      x,
      y,
      w,
      h,
      backgroundColor,
      backgroundImage,
      createBackgroundGradient,

      border,
    } = options

    const drawBorder = (border: NonNullable<Draw.DrawRectOptions['border']>) => {
      const { radius = 0, color, width = 0 } = border
      if (color) {
        this.ctx.strokeStyle = color
      }

      if (width) {
        this.ctx.lineWidth = width
      }

      if (radius > 0) {
        this.drawRoundedPath({
          ...options,
          radius,
        })
      } else {
        this.ctx.strokeRect(x, y, w, h)
      }
    }

    if (backgroundImage) {
      await this.drawImage(backgroundImage, options)
    } else {
      // 背景色
      if (backgroundColor) {
        this.ctx.fillStyle = backgroundColor
      }
      // 渐变色
      else if (createBackgroundGradient) {
        const gradient = createBackgroundGradient(this.ctx)
        this.ctx.fillStyle = gradient
      }

      const borderWidth = border?.width ?? 0
      this.ctx.fillRect(x + borderWidth / 2, y + borderWidth / 2, w - borderWidth, h - borderWidth)
    }

    // 设置边框属性
    if (border) {
      drawBorder(border)
    }
  }

  toImageUrl(options?: { base64?: boolean; removeCanvas?: boolean }) {
    let url = this.canvas.toDataURL()

    if (options?.base64) {
      url = url?.substring(22)
    }

    if (options?.removeCanvas) {
      this.canvas.remove()
    }

    return url
  }
}

// 获取元素转化的图片
export const getElementImage = async (options: {
  selector: string
  width: number
  backgroundColor?: string
  onClone?: (element: HTMLElement) => void
}) => {
  const { selector, width, backgroundColor = 'transparent', onClone } = options
  const element = document.querySelector(selector) as HTMLElement

  // 等待字体加载完成
  await document.fonts.ready

  const canvas = await html2canvas(element, {
    backgroundColor,
    useCORS: true,
    onclone: async (documentClone, element) => {
      onClone?.(element)
      await documentClone.fonts.ready
      // 等待样式应用
      await sleep(1e3)
    },
  })

  return {
    url: canvas.toDataURL(),
    width,
    height: width / (canvas.width / canvas.height),
  }
}
