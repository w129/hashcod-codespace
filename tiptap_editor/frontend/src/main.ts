/**
 * l8 TipTap document editor — Word-like sheet window.
 * Powered by https://github.com/ueberdosis/tiptap (v3)
 */
import './styles.css'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Typography from '@tiptap/extension-typography'
import { FontSize } from './fontSize'
import { FONT_CATALOG, ensureFontLoaded, prefetchStarterFonts } from './fonts'

const DOC_ID = 'main'
const DEFAULT_HTML = `<h1>Documento nuevo</h1>
<p>Escribe aquí. TipTap da una hoja tipográfica con formato de procesador de textos: estilos, tablas, listas, enlaces e imágenes.</p>
<ul data-type="taskList"><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Primera tarea</p></div></li></ul>`

type DocPayload = {
  ok?: boolean
  id?: string
  title?: string
  html?: string
  json?: unknown
  updated_at?: string
  error?: string
}

const root = document.getElementById('app')
if (!root) throw new Error('Missing #app')

root.innerHTML = `
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">Tt</div>
      <div>
        <h1>TipTap · Documento</h1>
        <p>Hoja directa · TipTap · Tailwind Typography · 300 fuentes</p>
      </div>
    </div>
    <input class="title-input" id="docTitle" type="text" maxlength="120" value="Documento sin título" aria-label="Título del documento" />
    <div class="file-actions">
      <button type="button" class="btn" id="btnNew" title="Nuevo">Nuevo</button>
      <button type="button" class="btn primary" id="btnSave" title="Guardar en servidor">Guardar</button>
      <button type="button" class="btn" id="btnPrint" title="Imprimir / PDF">Imprimir</button>
      <button type="button" class="btn" id="btnExportHtml" title="Descargar HTML">HTML</button>
      <button type="button" class="btn" id="btnExportJson" title="Descargar JSON TipTap">JSON</button>
      <button type="button" class="btn" id="btnFind" title="Buscar">Buscar</button>
    </div>
  </header>
  <div class="findbar" id="findBar">
    <input id="findInput" type="search" placeholder="Buscar en el documento…" />
    <button type="button" class="btn" id="findGo">Ir</button>
    <button type="button" class="btn" id="findClose">Cerrar</button>
  </div>
  <div class="ribbon" id="ribbon" role="toolbar" aria-label="Formato"></div>
  <main class="desk">
    <article class="page prose prose-stone prose-lg max-w-none"><div id="editor"></div></article>
  </main>
  <footer class="statusbar">
    <span id="statusMsg">Listo</span>
    <span id="statusCounts"><strong>0</strong> palabras · <strong>0</strong> caracteres · 300 fuentes</span>
  </footer>
`

const titleEl = document.getElementById('docTitle') as HTMLInputElement
const statusMsg = document.getElementById('statusMsg') as HTMLElement
const statusCounts = document.getElementById('statusCounts') as HTMLElement
const ribbon = document.getElementById('ribbon') as HTMLElement
const findBar = document.getElementById('findBar') as HTMLElement
const findInput = document.getElementById('findInput') as HTMLInputElement

function setStatus(text: string, kind: '' | 'ok' | 'err' = '') {
  statusMsg.textContent = text
  statusMsg.className = kind
}

function updateCounts(editor: Editor) {
  const storage = editor.storage as {
    characterCount?: { characters: () => number; words: () => number }
  }
  const chars = storage.characterCount?.characters() ?? 0
  const words = storage.characterCount?.words() ?? 0
  statusCounts.innerHTML = `<strong>${words}</strong> palabras · <strong>${chars}</strong> caracteres · <strong>${FONT_CATALOG.length}</strong> fuentes`
}

const editor = new Editor({
  element: document.getElementById('editor')!,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
    }),
    Underline,
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    Image.configure({ allowBase64: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder: 'Empieza a escribir en la hoja…' }),
    CharacterCount,
    Subscript,
    Superscript,
    Typography,
  ],
  content: DEFAULT_HTML,
  onUpdate: ({ editor: ed }) => {
    updateCounts(ed)
    setStatus('Sin guardar', '')
  },
  onSelectionUpdate: ({ editor: ed }) => {
    syncRibbon(ed)
  },
})

updateCounts(editor)

function syncRibbon(ed: Editor) {
  ribbon.querySelectorAll<HTMLElement>('[data-cmd]').forEach((el) => {
    const cmd = el.dataset.cmd || ''
    let on = false
    if (cmd === 'bold') on = ed.isActive('bold')
    else if (cmd === 'italic') on = ed.isActive('italic')
    else if (cmd === 'underline') on = ed.isActive('underline')
    else if (cmd === 'strike') on = ed.isActive('strike')
    else if (cmd === 'code') on = ed.isActive('code')
    else if (cmd === 'bullet') on = ed.isActive('bulletList')
    else if (cmd === 'ordered') on = ed.isActive('orderedList')
    else if (cmd === 'task') on = ed.isActive('taskList')
    else if (cmd === 'quote') on = ed.isActive('blockquote')
    else if (cmd === 'codeblock') on = ed.isActive('codeBlock')
    else if (cmd === 'link') on = ed.isActive('link')
    else if (cmd === 'alignLeft') on = ed.isActive({ textAlign: 'left' })
    else if (cmd === 'alignCenter') on = ed.isActive({ textAlign: 'center' })
    else if (cmd === 'alignRight') on = ed.isActive({ textAlign: 'right' })
    else if (cmd === 'alignJustify') on = ed.isActive({ textAlign: 'justify' })
    else if (cmd === 'h1') on = ed.isActive('heading', { level: 1 })
    else if (cmd === 'h2') on = ed.isActive('heading', { level: 2 })
    else if (cmd === 'h3') on = ed.isActive('heading', { level: 3 })
    else if (cmd === 'sub') on = ed.isActive('subscript')
    else if (cmd === 'sup') on = ed.isActive('superscript')
    el.classList.toggle('is-active', on)
  })
}

function btn(cmd: string, label: string, title: string, run: () => void) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'tb'
  b.dataset.cmd = cmd
  b.title = title
  b.innerHTML = label
  b.addEventListener('mousedown', (e) => e.preventDefault())
  b.addEventListener('click', () => {
    run()
    editor.commands.focus()
    syncRibbon(editor)
  })
  return b
}

function group(label: string, kids: HTMLElement[]) {
  const g = document.createElement('div')
  g.className = 'ribbon-group'
  const lab = document.createElement('div')
  lab.className = 'ribbon-label'
  lab.textContent = label
  g.appendChild(lab)
  kids.forEach((k) => g.appendChild(k))
  return g
}

function buildRibbon() {
  ribbon.innerHTML = ''

  const history = group('Edición', [
    btn('undo', '↶', 'Deshacer (⌘Z)', () => editor.chain().focus().undo().run()),
    btn('redo', '↷', 'Rehacer (⌘⇧Z)', () => editor.chain().focus().redo().run()),
  ])

  const inline = group('Fuente', [
    btn('bold', 'B', 'Negrita', () => editor.chain().focus().toggleBold().run()),
    btn('italic', 'I', 'Cursiva', () => editor.chain().focus().toggleItalic().run()),
    btn('underline', 'U', 'Subrayado', () => editor.chain().focus().toggleUnderline().run()),
    btn('strike', 'S', 'Tachado', () => editor.chain().focus().toggleStrike().run()),
    btn('code', '</>', 'Código', () => editor.chain().focus().toggleCode().run()),
    btn('sub', 'x₂', 'Subíndice', () => editor.chain().focus().toggleSubscript().run()),
    btn('sup', 'x²', 'Superíndice', () => editor.chain().focus().toggleSuperscript().run()),
  ])

  const fontSel = document.createElement('select')
  fontSel.className = 'tb-select'
  fontSel.title = `Familia tipográfica (${FONT_CATALOG.length} únicas)`
  fontSel.style.maxWidth = '180px'
  const placeholder = document.createElement('option')
  placeholder.value = ''
  placeholder.textContent = `Fuente (${FONT_CATALOG.length})`
  fontSel.appendChild(placeholder)

  const kindLabel: Record<string, string> = {
    serif: 'Serif',
    sans: 'Sans',
    display: 'Display',
    hand: 'Script / mano',
    mono: 'Mono',
  }
  const byKind = new Map<string, typeof FONT_CATALOG>()
  for (const f of FONT_CATALOG) {
    const list = byKind.get(f.kind) || []
    list.push(f)
    byKind.set(f.kind, list)
  }
  for (const kind of ['serif', 'sans', 'display', 'hand', 'mono'] as const) {
    const list = byKind.get(kind) || []
    if (!list.length) continue
    const og = document.createElement('optgroup')
    og.label = `${kindLabel[kind]} (${list.length})`
    for (const f of list) {
      const o = document.createElement('option')
      o.value = f.css
      o.textContent = f.name
      o.dataset.fontName = f.name
      og.appendChild(o)
    }
    fontSel.appendChild(og)
  }
  fontSel.addEventListener('change', () => {
    const chain = editor.chain().focus() as ReturnType<Editor['chain']> & {
      unsetFontFamily?: () => ReturnType<Editor['chain']>
      setFontFamily?: (f: string) => ReturnType<Editor['chain']>
    }
    if (!fontSel.value) {
      chain.unsetFontFamily?.().run()
      return
    }
    const opt = fontSel.selectedOptions[0]
    const name = opt?.dataset.fontName || opt?.textContent || ''
    const entry = FONT_CATALOG.find((f) => f.name === name)
    if (entry) ensureFontLoaded(entry)
    chain.setFontFamily?.(fontSel.value).run()
  })

  const sizeSel = document.createElement('select')
  sizeSel.className = 'tb-select'
  sizeSel.title = 'Tamaño'
  ;['', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'].forEach((s) => {
    const o = document.createElement('option')
    o.value = s
    o.textContent = s || 'Tamaño'
    sizeSel.appendChild(o)
  })
  sizeSel.addEventListener('change', () => {
    const chain = editor.chain().focus() as ReturnType<Editor['chain']> & {
      unsetFontSize?: () => ReturnType<Editor['chain']>
      setFontSize?: (s: string) => ReturnType<Editor['chain']>
    }
    if (!sizeSel.value) chain.unsetFontSize?.().run()
    else chain.setFontSize?.(sizeSel.value).run()
  })

  const colorInk = document.createElement('input')
  colorInk.type = 'color'
  colorInk.value = '#1a1a1a'
  colorInk.title = 'Color de texto'
  colorInk.addEventListener('input', () => {
    const chain = editor.chain().focus() as ReturnType<Editor['chain']> & {
      setColor?: (c: string) => ReturnType<Editor['chain']>
    }
    chain.setColor?.(colorInk.value).run()
  })
  const colorHi = document.createElement('input')
  colorHi.type = 'color'
  colorHi.value = '#ffe566'
  colorHi.title = 'Resaltado'
  colorHi.addEventListener('input', () => {
    editor.chain().focus().toggleHighlight({ color: colorHi.value }).run()
  })
  const colorWrap = document.createElement('span')
  colorWrap.className = 'color-wrap'
  colorWrap.append('A', colorInk, '▮', colorHi)

  const fonts = group('Tipografía', [fontSel, sizeSel, colorWrap])

  const blocks = group('Párrafo', [
    btn('h1', 'H1', 'Título 1', () => editor.chain().focus().toggleHeading({ level: 1 }).run()),
    btn('h2', 'H2', 'Título 2', () => editor.chain().focus().toggleHeading({ level: 2 }).run()),
    btn('h3', 'H3', 'Título 3', () => editor.chain().focus().toggleHeading({ level: 3 }).run()),
    btn('bullet', '•', 'Lista', () => editor.chain().focus().toggleBulletList().run()),
    btn('ordered', '1.', 'Lista numerada', () => editor.chain().focus().toggleOrderedList().run()),
    btn('task', '☑', 'Tareas', () => editor.chain().focus().toggleTaskList().run()),
    btn('quote', '“”', 'Cita', () => editor.chain().focus().toggleBlockquote().run()),
    btn('codeblock', '{ }', 'Bloque código', () => editor.chain().focus().toggleCodeBlock().run()),
    btn('hr', '—', 'Separador', () => editor.chain().focus().setHorizontalRule().run()),
  ])

  const align = group('Alinear', [
    btn('alignLeft', '⫷', 'Izquierda', () => editor.chain().focus().setTextAlign('left').run()),
    btn('alignCenter', '☰', 'Centro', () => editor.chain().focus().setTextAlign('center').run()),
    btn('alignRight', '⫸', 'Derecha', () => editor.chain().focus().setTextAlign('right').run()),
    btn('alignJustify', '≣', 'Justificar', () => editor.chain().focus().setTextAlign('justify').run()),
  ])

  const insert = group('Insertar', [
    btn('link', '🔗', 'Enlace', () => {
      const prev = editor.getAttributes('link').href as string | undefined
      const url = window.prompt('URL del enlace', prev || 'https://')
      if (url === null) return
      if (!url.trim()) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    }),
    btn('image', '🖼', 'Imagen (URL)', () => {
      const url = window.prompt('URL de la imagen', 'https://')
      if (!url) return
      editor.chain().focus().setImage({ src: url.trim() }).run()
    }),
    btn('table', '▦', 'Tabla 3×3', () => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }),
    btn('addCol', '+Col', 'Añadir columna', () => editor.chain().focus().addColumnAfter().run()),
    btn('addRow', '+Fila', 'Añadir fila', () => editor.chain().focus().addRowAfter().run()),
    btn('delTable', '✕Tabla', 'Eliminar tabla', () => editor.chain().focus().deleteTable().run()),
  ])

  ;[history, inline, fonts, blocks, align, insert].forEach((g) => ribbon.appendChild(g))
  syncRibbon(editor)
}

buildRibbon()

async function apiGet(): Promise<DocPayload> {
  const res = await fetch(`/api/tiptap/doc?id=${encodeURIComponent(DOC_ID)}`, {
    credentials: 'same-origin',
  })
  return (await res.json()) as DocPayload
}

async function apiSave(): Promise<DocPayload> {
  const body = {
    id: DOC_ID,
    title: titleEl.value.trim() || 'Documento sin título',
    html: editor.getHTML(),
    json: editor.getJSON(),
  }
  const res = await fetch('/api/tiptap/doc', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json()) as DocPayload
}

async function loadDoc() {
  try {
    setStatus('Cargando…')
    const data = await apiGet()
    if (!data.ok) {
      setStatus(data.error || 'No se pudo cargar', 'err')
      return
    }
    if (data.title) titleEl.value = data.title
    if (data.html && data.html.trim()) {
      editor.commands.setContent(data.html, false)
    } else if (data.json) {
      editor.commands.setContent(data.json as never, false)
    }
    updateCounts(editor)
    setStatus(data.updated_at ? `Cargado · ${data.updated_at}` : 'Cargado', 'ok')
  } catch {
    setStatus('Error de red al cargar', 'err')
  }
}

async function saveDoc() {
  try {
    setStatus('Guardando…')
    const data = await apiSave()
    if (!data.ok) {
      setStatus(data.error || 'No se pudo guardar', 'err')
      return
    }
    setStatus(data.updated_at ? `Guardado · ${data.updated_at}` : 'Guardado', 'ok')
  } catch {
    setStatus('Error de red al guardar', 'err')
  }
}

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

document.getElementById('btnSave')!.addEventListener('click', () => void saveDoc())
document.getElementById('btnNew')!.addEventListener('click', () => {
  if (!window.confirm('¿Empezar un documento nuevo? Se perderán cambios no guardados.')) return
  titleEl.value = 'Documento sin título'
  editor.commands.setContent(DEFAULT_HTML)
  updateCounts(editor)
  setStatus('Documento nuevo')
})
document.getElementById('btnPrint')!.addEventListener('click', () => window.print())
document.getElementById('btnExportHtml')!.addEventListener('click', () => {
  const title = titleEl.value.trim() || 'documento'
  download(
    `${title}.html`,
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${editor.getHTML()}</body></html>`,
    'text/html'
  )
})
document.getElementById('btnExportJson')!.addEventListener('click', () => {
  const title = titleEl.value.trim() || 'documento'
  download(`${title}.tiptap.json`, JSON.stringify(editor.getJSON(), null, 2), 'application/json')
})
document.getElementById('btnFind')!.addEventListener('click', () => {
  findBar.classList.add('open')
  findInput.focus()
})
document.getElementById('findClose')!.addEventListener('click', () => {
  findBar.classList.remove('open')
})
document.getElementById('findGo')!.addEventListener('click', () => {
  const q = findInput.value.trim()
  if (!q) return
  const text = editor.state.doc.textContent
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) {
    setStatus('No encontrado', 'err')
    return
  }
  let pos = 0
  let from = -1
  editor.state.doc.descendants((node, nodePos) => {
    if (from >= 0) return false
    if (!node.isText || !node.text) return
    const next = pos + node.text.length
    if (idx >= pos && idx < next) {
      from = nodePos + (idx - pos)
    }
    pos = next
  })
  if (from >= 0) {
    const to = from + q.length
    editor.chain().focus().setTextSelection({ from, to }).run()
    setStatus(`Encontrado · “${q}”`, 'ok')
  }
})

document.addEventListener('keydown', (e) => {
  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key.toLowerCase() === 's') {
    e.preventDefault()
    void saveDoc()
  }
  if (meta && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    findBar.classList.add('open')
    findInput.focus()
  }
})

const fontsLink = document.createElement('link')
fontsLink.rel = 'stylesheet'
fontsLink.href =
  'https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600;7..72,700&family=Source+Sans+3:wght@400;600;700&display=swap'
document.head.appendChild(fontsLink)
prefetchStarterFonts()

void loadDoc()
