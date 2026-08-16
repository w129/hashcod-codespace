/**
 * TipTap node: Vivid Vector Alphabet (Scott C. Krause / neodigm).
 * https://github.com/neodigm/vivid_vector_alphabet
 *
 * Letters are illustrated SVG glyphs (not a CSS font-family).
 * Assets vendored under /tiptap_editor/frontend/build/vivid/ (BSD-2-Clause).
 */
import { Node, mergeAttributes } from '@tiptap/core'

export const VIVID_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL) ||
  '/tiptap_editor/frontend/build/'

const VIVID_DIR = `${VIVID_BASE.replace(/\/?$/, '/') }vivid/`

/** Map a character to the vivid SVG filename stem (without vv/ .svg). */
export function vividStem(ch: string): string | null {
  if (ch === ' ') return 'space'
  if (ch === '.') return 'period'
  if (ch === ',') return 'comma'
  const c = ch.toLowerCase()
  if (/^[a-z0-9]$/.test(c)) return c
  return null
}

export function vividSrc(ch: string): string | null {
  const stem = vividStem(ch)
  if (!stem) return null
  return `${VIVID_DIR}vv${stem}.svg`
}

export function normalizeVividText(raw: string, maxLen = 48): string {
  return Array.from(raw || '')
    .map((ch) => {
      if (vividStem(ch)) return ch
      if (ch === '\n' || ch === '\t') return ' '
      return ''
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
    .toUpperCase()
}

function buildLetterImgs(text: string): string {
  const chars = Array.from(text)
  if (!chars.length) {
    return `<img src="${VIVID_DIR}vvspace.svg" alt=" " class="vv-glyph" />`
  }
  return chars
    .map((ch) => {
      const src = vividSrc(ch) || `${VIVID_DIR}vvspace.svg`
      const alt = ch === ' ' ? 'espacio' : ch
      return `<img src="${src}" alt="${alt}" class="vv-glyph" draggable="false" />`
    })
    .join('')
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    vividVector: {
      insertVividVector: (attrs?: { text?: string; animate?: boolean }) => ReturnType
      updateVividVector: (attrs: { text?: string; animate?: boolean }) => ReturnType
    }
  }
}

export const VividVector = Node.create({
  name: 'vividVector',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      text: {
        default: 'VIVID',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-text') || 'VIVID',
        renderHTML: (attrs) => ({ 'data-text': attrs.text }),
      },
      animate: {
        default: false,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-animate') === '1',
        renderHTML: (attrs) => (attrs.animate ? { 'data-animate': '1' } : {}),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-vivid-vector]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const text = normalizeVividText(String(node.attrs.text || 'VIVID'))
    const animate = !!node.attrs.animate
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-vivid-vector': '',
        'data-text': text,
        'data-animate': animate ? '1' : '0',
        class: 'vivid-vector-block' + (animate ? ' is-animating' : ''),
        contenteditable: 'false',
      }),
      // TipTap renderHTML children as raw isn't ideal; NodeView handles live DOM.
      // Fallback plain text for serializers that ignore NodeView:
      ['span', { class: 'vv-fallback' }, text],
    ]
  },

  addNodeView() {
    return ({ node: initialNode, editor, getPos }) => {
      let node = initialNode
      const wrap = document.createElement('div')
      wrap.className = 'vivid-vector-block'
      wrap.setAttribute('data-vivid-vector', '')
      wrap.contentEditable = 'false'

      const grid = document.createElement('div')
      grid.className = 'vv-grid alpha-grd'
      wrap.appendChild(grid)

      const meta = document.createElement('div')
      meta.className = 'vv-meta'
      meta.innerHTML =
        '<span>Vivid Vector Alphabet</span> · <a href="https://github.com/neodigm/vivid_vector_alphabet" target="_blank" rel="noopener">neodigm / Scott C. Krause</a>'
      wrap.appendChild(meta)

      let timer: ReturnType<typeof setInterval> | null = null
      let msg: string[] = []

      const paintStatic = (text: string) => {
        grid.innerHTML = buildLetterImgs(text)
      }

      const stopAnim = () => {
        if (timer) {
          clearInterval(timer)
          timer = null
        }
        wrap.classList.remove('is-animating')
      }

      const startAnim = (text: string) => {
        stopAnim()
        wrap.classList.add('is-animating')
        msg = Array.from(text)
        const slots = Math.max(6, Math.min(24, Math.ceil(msg.length / 2) || 6))
        grid.innerHTML = ''
        for (let i = 0; i < slots; i++) {
          const img = document.createElement('img')
          img.className = 'vv-glyph'
          img.alt = ''
          img.src = `${VIVID_DIR}vvspace.svg`
          img.draggable = false
          grid.appendChild(img)
        }
        timer = setInterval(() => {
          const imgs = grid.querySelectorAll('img')
          imgs.forEach((img, i) => {
            const ch = msg[i] || ' '
            img.src = vividSrc(ch) || `${VIVID_DIR}vvspace.svg`
            img.alt = ch === ' ' ? ' ' : ch
          })
          if (msg.length) {
            msg.push(msg.shift() as string)
          }
        }, 200)
      }

      const render = () => {
        const text = normalizeVividText(String(node.attrs.text || 'VIVID'))
        wrap.setAttribute('data-text', text)
        if (node.attrs.animate) startAnim(text)
        else {
          stopAnim()
          paintStatic(text)
        }
      }

      wrap.addEventListener('dblclick', () => {
        if (typeof getPos !== 'function') return
        const next = window.prompt(
          'Texto Vivid Vector (A–Z, 0–9, espacio . ,)',
          String(node.attrs.text || '')
        )
        if (next === null) return
        const text = normalizeVividText(next) || 'VIVID'
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            const pos = getPos()
            if (typeof pos !== 'number') return false
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, text })
            return true
          })
          .run()
      })

      render()

      return {
        dom: wrap,
        update: (updated) => {
          if (updated.type.name !== 'vividVector') return false
          node = updated
          render()
          return true
        },
        destroy: () => stopAnim(),
        ignoreMutation: () => true,
      }
    }
  },

  addCommands() {
    return {
      insertVividVector:
        (attrs = {}) =>
        ({ commands }) => {
          const text = normalizeVividText(attrs.text || 'VIVID VECTOR') || 'VIVID'
          return commands.insertContent({
            type: this.name,
            attrs: {
              text,
              animate: !!attrs.animate,
            },
          })
        },
      updateVividVector:
        (attrs) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, {
            ...(attrs.text !== undefined
              ? { text: normalizeVividText(attrs.text) || 'VIVID' }
              : {}),
            ...(attrs.animate !== undefined ? { animate: !!attrs.animate } : {}),
          }),
    }
  },
})
