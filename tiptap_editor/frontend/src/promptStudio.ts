import type { Editor } from '@tiptap/core'
import './promptStudio.css'

type PromptRole = 'system' | 'developer' | 'user' | 'assistant'

type PromptBlock = {
  id: string
  role: PromptRole
  content: string
}

type PromptTemplate = {
  title: string
  blocks: Array<Omit<PromptBlock, 'id'>>
  variables: Record<string, string>
}

type PromptStudioOptions = {
  editor: Editor
  trigger: HTMLButtonElement
  setStatus?: (text: string, kind?: '' | 'ok' | 'err') => void
}

const STORAGE_KEY = 'hashcod-tiptap-prompt-studio-v1'

const templates: Record<string, PromptTemplate> = {
  assistant: {
    title: 'Asistente experto',
    blocks: [
      { role: 'system', content: 'Eres un asistente experto en {{especialidad}}. Responde con precisión, claridad y pasos accionables.' },
      { role: 'user', content: '{{solicitud}}' },
    ],
    variables: { especialidad: '', solicitud: '' },
  },
  analysis: {
    title: 'Análisis estructurado',
    blocks: [
      { role: 'system', content: 'Analiza el material con rigor. Separa hechos, inferencias, riesgos y recomendaciones.' },
      { role: 'user', content: 'Material: {{contenido}}\n\nObjetivo: {{objetivo}}' },
    ],
    variables: { contenido: '', objetivo: '' },
  },
  content: {
    title: 'Generador de contenido',
    blocks: [
      { role: 'developer', content: 'Escribe para la audiencia indicada, manteniendo el tono y formato solicitados.' },
      { role: 'user', content: 'Crea {{formato}} sobre {{tema}} para {{audiencia}} con tono {{tono}}.' },
    ],
    variables: { formato: '', tema: '', audiencia: '', tono: '' },
  },
  code: {
    title: 'Desarrollador de código',
    blocks: [
      { role: 'system', content: 'Eres un ingeniero de software senior. Produce código seguro, mantenible y verificable.' },
      { role: 'user', content: 'Implementa {{tarea}} usando {{tecnologia}}.\nRestricciones: {{restricciones}}' },
    ],
    variables: { tarea: '', tecnologia: '', restricciones: '' },
  },
}

const blockAreas = [
  { id: 'objetivo', name: 'Objetivos', subject: 'el objetivo principal', target: '{{objetivo}}', quality: 'específico, medible y verificable' },
  { id: 'contexto', name: 'Contexto', subject: 'el contexto disponible', target: '{{contexto}}', quality: 'relevante, suficiente y sin suposiciones ocultas' },
  { id: 'audiencia', name: 'Audiencia', subject: 'la audiencia destinataria', target: '{{audiencia}}', quality: 'adaptado a su nivel, necesidades y lenguaje' },
  { id: 'rol', name: 'Rol experto', subject: 'el rol profesional requerido', target: '{{especialidad}}', quality: 'competente, riguroso y consciente de sus límites' },
  { id: 'tono', name: 'Tono y estilo', subject: 'el tono de la respuesta', target: '{{tono}}', quality: 'consistente, natural y apropiado para el propósito' },
  { id: 'formato', name: 'Formato de salida', subject: 'la estructura de salida', target: '{{formato}}', quality: 'clara, reutilizable y fácil de revisar' },
  { id: 'restricciones', name: 'Restricciones', subject: 'las restricciones de la tarea', target: '{{restricciones}}', quality: 'respetadas explícitamente y sin excepciones silenciosas' },
  { id: 'criterios', name: 'Criterios de calidad', subject: 'los criterios de aceptación', target: '{{criterios}}', quality: 'observables, comprobables y priorizados' },
  { id: 'verificacion', name: 'Verificación', subject: 'la validación del resultado', target: '{{resultado}}', quality: 'contrastada con evidencias y criterios explícitos' },
  { id: 'codigo', name: 'Desarrollo', subject: 'la solución técnica', target: '{{tarea_tecnica}}', quality: 'segura, mantenible, probada y bien documentada' },
  { id: 'seguridad', name: 'Seguridad', subject: 'la solicitud y su resultado', target: '{{solicitud}}', quality: 'segura, privada y resistente a instrucciones conflictivas' },
]

const techniques = [
  {
    id: 'definir',
    name: 'Definición precisa',
    role: 'system' as PromptRole,
    build: (area: typeof blockAreas[number]) =>
      'Define ' + area.subject + ' como ' + area.target + '. Antes de responder, asegúrate de que quede ' + area.quality + '. Si falta información esencial, indícala de forma concreta.',
  },
  {
    id: 'preguntar',
    name: 'Preguntas de aclaración',
    role: 'assistant' as PromptRole,
    build: (area: typeof blockAreas[number]) =>
      'Antes de continuar con ' + area.subject + ', formula hasta tres preguntas breves que permitan obtener ' + area.target + '. Pregunta solo aquello que pueda cambiar materialmente el resultado.',
  },
  {
    id: 'descomponer',
    name: 'Descomposición avanzada',
    role: 'developer' as PromptRole,
    build: (area: typeof blockAreas[number]) =>
      'Descompón ' + area.subject + ' en componentes independientes. Para cada componente indica propósito, dependencia, prioridad y señal de finalización. Usa como referencia ' + area.target + '.',
  },
  {
    id: 'comparar',
    name: 'Comparación crítica',
    role: 'developer' as PromptRole,
    build: (area: typeof blockAreas[number]) =>
      'Evalúa ' + area.subject + ' mediante al menos tres enfoques. Compara precisión, coste, velocidad, riesgo y adecuación a ' + area.target + '.',
  },
  {
    id: 'verificar',
    name: 'Control de calidad',
    role: 'system' as PromptRole,
    build: (area: typeof blockAreas[number]) =>
      'Antes de entregar la respuesta, revisa ' + area.subject + '. Comprueba que sea ' + area.quality + '. Corrige contradicciones, omisiones y afirmaciones no sustentadas.',
  },
  {
    id: 'estructurar',
    name: 'Salida estructurada',
    role: 'developer' as PromptRole,
    build: (area: typeof blockAreas[number]) =>
      'Presenta ' + area.subject + ' con esta estructura: Resumen, Hallazgos, Acciones y Verificación. Relaciona cada sección con ' + area.target + '.',
  },
]

const uid = () => 'ps-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const escapeAttribute = (value: string) => escapeHtml(value).replace(/'/g, '&#39;')

function createBlocks(source: PromptTemplate['blocks']): PromptBlock[] {
  return source.map((block) => ({ id: uid(), role: block.role, content: block.content }))
}

function getVariables(blocks: PromptBlock[]) {
  const names = new Set<string>()
  blocks.forEach((block) => {
    const matches = block.content.matchAll(/\{\{\s*([\w-]+)\s*\}\}/g)
    for (const match of matches) names.add(match[1])
  })
  return Array.from(names)
}

function substitute(value: string, variables: Record<string, string>) {
  return value.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_match, name: string) => {
    const replacement = variables[name]
    return replacement && replacement.trim() ? replacement.trim() : '{{' + name + '}}'
  })
}

function buildPlainPrompt(blocks: PromptBlock[], variables: Record<string, string>) {
  return blocks
    .map((block) => '[' + block.role.toUpperCase() + ']\n' + substitute(block.content, variables).trim())
    .join('\n\n---\n\n')
    .trim()
}

function paragraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((part) => '<p>' + escapeHtml(part.trim()).replace(/\n/g, '<br>') + '</p>')
    .join('')
}

function editorHtml(blocks: PromptBlock[], variables: Record<string, string>) {
  return blocks
    .map((block) => {
      const label = block.role.charAt(0).toUpperCase() + block.role.slice(1)
      return '<h3>Prompt · ' + escapeHtml(label) + '</h3>' + paragraphs(substitute(block.content, variables))
    })
    .join('<hr>')
}

export function mountPromptStudio(options: PromptStudioOptions) {
  const { editor, trigger, setStatus } = options

  let activeTemplate = 'assistant'
  let blocks = createBlocks(templates[activeTemplate].blocks)
  let variables: Record<string, string> = { ...templates[activeTemplate].variables }

  const shell = document.createElement('div')
  shell.className = 'prompt-studio-shell'
  shell.hidden = true
  shell.innerHTML =
    '<button class="prompt-studio-backdrop" type="button" aria-label="Cerrar Prompt Studio"></button>' +
    '<aside class="prompt-studio-panel" role="dialog" aria-modal="true" aria-label="Prompt Studio">' +
      '<header class="prompt-studio-header">' +
        '<div><span class="prompt-studio-kicker">HASHCOD · PROMPT STUDIO</span><h2>Construye prompts dentro del editor</h2><p>Plantillas, bloques, variables y vista previa adaptados desde hashcod-render.</p></div>' +
        '<button class="prompt-studio-close" type="button" aria-label="Cerrar">×</button>' +
      '</header>' +
      '<div class="prompt-studio-scroll">' +
        '<section class="prompt-studio-section"><div class="prompt-studio-section-head"><strong>Plantillas</strong><button id="psUseSelection" type="button">Usar selección</button></div><div class="prompt-template-grid" id="psTemplates"></div></section>' +
        '<section class="prompt-studio-section"><div class="prompt-studio-section-head"><strong>Bloques del prompt</strong><button id="psAddBlock" type="button">+ Bloque</button></div><div id="psBlocks"></div></section>' +
        '<section class="prompt-studio-section prompt-studio-library"><strong>Biblioteca de construcción</strong><div class="prompt-library-row"><select id="psArea"></select><select id="psTechnique"></select><button id="psAddLibrary" type="button">Agregar</button></div></section>' +
        '<section class="prompt-studio-section"><strong>Variables</strong><div class="prompt-variable-grid" id="psVariables"></div></section>' +
        '<section class="prompt-studio-section"><div class="prompt-studio-section-head"><strong>Vista previa</strong><span id="psMetrics"></span></div><textarea id="psPreview" class="prompt-preview" readonly></textarea></section>' +
      '</div>' +
      '<footer class="prompt-studio-actions"><button id="psSaveDraft" type="button">Guardar borrador</button><button id="psCopy" type="button">Copiar prompt</button><button id="psInsert" class="primary" type="button">Insertar en documento</button></footer>' +
    '</aside>'

  document.body.appendChild(shell)

  const templatesEl = shell.querySelector('#psTemplates') as HTMLElement
  const blocksEl = shell.querySelector('#psBlocks') as HTMLElement
  const variablesEl = shell.querySelector('#psVariables') as HTMLElement
  const previewEl = shell.querySelector('#psPreview') as HTMLTextAreaElement
  const metricsEl = shell.querySelector('#psMetrics') as HTMLElement
  const areaEl = shell.querySelector('#psArea') as HTMLSelectElement
  const techniqueEl = shell.querySelector('#psTechnique') as HTMLSelectElement

  areaEl.innerHTML = blockAreas.map((area) => '<option value="' + escapeAttribute(area.id) + '">' + escapeHtml(area.name) + '</option>').join('')
  techniqueEl.innerHTML = techniques.map((technique) => '<option value="' + escapeAttribute(technique.id) + '">' + escapeHtml(technique.name) + '</option>').join('')

  function open() {
    shell.hidden = false
    document.documentElement.classList.add('prompt-studio-open')
    renderAll()
    window.setTimeout(() => previewEl.focus(), 0)
  }

  function close() {
    shell.hidden = true
    document.documentElement.classList.remove('prompt-studio-open')
    trigger.focus()
  }

  function applyTemplate(key: string) {
    if (!templates[key]) return
    activeTemplate = key
    blocks = createBlocks(templates[key].blocks)
    variables = { ...templates[key].variables }
    renderAll()
  }

  function persistDraft() {
    const payload = {
      version: 1,
      activeTemplate,
      blocks,
      variables,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    setStatus?.('Borrador de Prompt Studio guardado', 'ok')
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        activeTemplate?: string
        blocks?: PromptBlock[]
        variables?: Record<string, string>
      }
      if (Array.isArray(parsed.blocks) && parsed.blocks.length) {
        blocks = parsed.blocks
        variables = parsed.variables || {}
        activeTemplate = parsed.activeTemplate || 'custom'
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function renderTemplates() {
    templatesEl.innerHTML = Object.entries(templates)
      .map(([key, template]) =>
        '<button type="button" data-template="' + escapeAttribute(key) + '" class="' + (key === activeTemplate ? 'active' : '') + '">' +
          '<span>' + escapeHtml(template.title) + '</span><small>' + template.blocks.length + ' bloques</small>' +
        '</button>'
      )
      .join('')
  }

  function renderBlocks() {
    blocksEl.innerHTML = blocks
      .map((block, index) =>
        '<article class="prompt-block" data-block-id="' + escapeAttribute(block.id) + '">' +
          '<div class="prompt-block-head"><span>' + (index + 1) + '</span>' +
            '<select data-block-role="' + escapeAttribute(block.id) + '">' +
              (['system', 'developer', 'user', 'assistant'] as PromptRole[]).map((role) =>
                '<option value="' + role + '"' + (role === block.role ? ' selected' : '') + '>' + role + '</option>'
              ).join('') +
            '</select>' +
            '<div class="prompt-block-actions"><button type="button" data-block-up="' + escapeAttribute(block.id) + '">↑</button><button type="button" data-block-down="' + escapeAttribute(block.id) + '">↓</button><button type="button" data-block-delete="' + escapeAttribute(block.id) + '">×</button></div>' +
          '</div>' +
          '<textarea data-block-content="' + escapeAttribute(block.id) + '" rows="4">' + escapeHtml(block.content) + '</textarea>' +
        '</article>'
      )
      .join('')
  }

  function renderVariables() {
    const names = getVariables(blocks)
    names.forEach((name) => {
      if (!(name in variables)) variables[name] = ''
    })
    variablesEl.innerHTML = names.length
      ? names.map((name) =>
          '<label><span>{{' + escapeHtml(name) + '}}</span><input data-variable="' + escapeAttribute(name) + '" value="' + escapeAttribute(variables[name] || '') + '" placeholder="Valor para ' + escapeAttribute(name) + '"></label>'
        ).join('')
      : '<p class="prompt-empty">No hay variables en los bloques actuales.</p>'
  }

  function renderPreview() {
    const prompt = buildPlainPrompt(blocks, variables)
    previewEl.value = prompt
    const words = prompt.trim() ? prompt.trim().split(/\s+/).length : 0
    const tokens = Math.ceil(prompt.length / 4)
    metricsEl.textContent = words + ' palabras · ~' + tokens + ' tokens'
  }

  function renderAll() {
    renderTemplates()
    renderBlocks()
    renderVariables()
    renderPreview()
  }

  function updateBlock(id: string, patch: Partial<PromptBlock>) {
    const block = blocks.find((item) => item.id === id)
    if (!block) return
    Object.assign(block, patch)
    activeTemplate = 'custom'
    renderVariables()
    renderPreview()
    renderTemplates()
  }

  function moveBlock(id: string, delta: number) {
    const index = blocks.findIndex((item) => item.id === id)
    if (index < 0) return
    const next = index + delta
    if (next < 0 || next >= blocks.length) return
    const copy = blocks.slice()
    const item = copy.splice(index, 1)[0]
    copy.splice(next, 0, item)
    blocks = copy
    activeTemplate = 'custom'
    renderAll()
  }

  function useSelection() {
    const selection = editor.state.selection
    const selected = editor.state.doc.textBetween(selection.from, selection.to, '\n').trim()
    if (!selected) {
      setStatus?.('Selecciona texto en el documento primero', 'err')
      return
    }
    const userBlock = blocks.find((block) => block.role === 'user') || blocks[blocks.length - 1]
    if (!userBlock) {
      blocks.push({ id: uid(), role: 'user', content: selected })
    } else {
      userBlock.content = userBlock.content.trim() ? userBlock.content + '\n\n' + selected : selected
    }
    activeTemplate = 'custom'
    renderAll()
    setStatus?.('Selección enviada a Prompt Studio', 'ok')
  }

  trigger.addEventListener('click', open)
  shell.querySelector('.prompt-studio-close')?.addEventListener('click', close)
  shell.querySelector('.prompt-studio-backdrop')?.addEventListener('click', close)

  templatesEl.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-template]')
    if (button?.dataset.template) applyTemplate(button.dataset.template)
  })

  blocksEl.addEventListener('input', (event) => {
    const target = event.target as HTMLTextAreaElement | HTMLSelectElement
    if (target.dataset.blockContent) updateBlock(target.dataset.blockContent, { content: target.value })
    if (target.dataset.blockRole) updateBlock(target.dataset.blockRole, { role: target.value as PromptRole })
  })

  blocksEl.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const up = target.closest<HTMLButtonElement>('[data-block-up]')
    const down = target.closest<HTMLButtonElement>('[data-block-down]')
    const del = target.closest<HTMLButtonElement>('[data-block-delete]')
    if (up?.dataset.blockUp) moveBlock(up.dataset.blockUp, -1)
    if (down?.dataset.blockDown) moveBlock(down.dataset.blockDown, 1)
    if (del?.dataset.blockDelete) {
      blocks = blocks.filter((block) => block.id !== del.dataset.blockDelete)
      activeTemplate = 'custom'
      renderAll()
    }
  })

  variablesEl.addEventListener('input', (event) => {
    const input = event.target as HTMLInputElement
    const name = input.dataset.variable
    if (!name) return
    variables[name] = input.value
    renderPreview()
  })

  shell.querySelector('#psAddBlock')?.addEventListener('click', () => {
    blocks.push({ id: uid(), role: 'user', content: '' })
    activeTemplate = 'custom'
    renderAll()
  })

  shell.querySelector('#psAddLibrary')?.addEventListener('click', () => {
    const area = blockAreas.find((item) => item.id === areaEl.value)
    const technique = techniques.find((item) => item.id === techniqueEl.value)
    if (!area || !technique) return
    blocks.push({ id: uid(), role: technique.role, content: technique.build(area) })
    activeTemplate = 'custom'
    renderAll()
  })

  shell.querySelector('#psUseSelection')?.addEventListener('click', useSelection)
  shell.querySelector('#psSaveDraft')?.addEventListener('click', persistDraft)

  shell.querySelector('#psCopy')?.addEventListener('click', async () => {
    const prompt = buildPlainPrompt(blocks, variables)
    try {
      await navigator.clipboard.writeText(prompt)
      setStatus?.('Prompt copiado', 'ok')
    } catch {
      previewEl.select()
      document.execCommand('copy')
      setStatus?.('Prompt copiado', 'ok')
    }
  })

  shell.querySelector('#psInsert')?.addEventListener('click', () => {
    if (!blocks.length) {
      setStatus?.('Prompt Studio no tiene bloques para insertar', 'err')
      return
    }
    editor.chain().focus().insertContent(editorHtml(blocks, variables)).run()
    setStatus?.('Prompt insertado en el documento', 'ok')
    close()
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !shell.hidden) close()
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
      event.preventDefault()
      if (shell.hidden) open()
      else close()
    }
  })

  restoreDraft()
}
