/**
 * Draft.js column editor for SoroOtbedit.
 * Uses facebookarchive/draft-js: Editor, RichUtils, entities/decorators,
 * undo stack, markdown shortcuts, and markdown import/export.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  KeyBindingUtil,
  ContentState,
  CompositeDecorator,
  SelectionState,
  Modifier,
  AtomicBlockUtils,
} from 'draft-js'
import { stateToMarkdown } from 'draft-js-export-markdown'
import { stateFromMarkdown } from 'draft-js-import-markdown'
import 'draft-js/dist/Draft.css'
import {
  Streamlit,
  withStreamlitConnection,
  ComponentProps,
} from 'streamlit-component-lib'

type Args = {
  markdown?: string
  height?: number
  placeholder?: string
  read_only?: boolean
  key_nonce?: string
  jump_line?: number
  jump_text?: string
  jump_token?: string
}

function findLinkEntities(
  contentBlock: { findEntityRanges: (fn: (c: { getEntity: () => string | null }) => boolean, cb: (s: number, e: number) => void) => void },
  callback: (start: number, end: number) => void,
  contentState: ContentState
) {
  contentBlock.findEntityRanges((character) => {
    const key = character.getEntity()
    return key !== null && contentState.getEntity(key).getType() === 'LINK'
  }, callback)
}

function LinkSpan(props: {
  contentState: ContentState
  entityKey: string
  children: React.ReactNode
}) {
  const data = props.contentState.getEntity(props.entityKey).getData() as { url?: string }
  const url = data.url || '#'
  return (
    <a href={url} title={url} style={{ color: '#0b57d0', textDecoration: 'underline' }}>
      {props.children}
    </a>
  )
}

const linkDecorator = new CompositeDecorator([
  { strategy: findLinkEntities as never, component: LinkSpan as never },
])

function mdToState(md: string): EditorState {
  try {
    const content = stateFromMarkdown(md || '') as ContentState
    return EditorState.createWithContent(content, linkDecorator)
  } catch {
    return EditorState.createEmpty(linkDecorator)
  }
}

function stateToMd(state: EditorState): string {
  try {
    return (stateToMarkdown(state.getCurrentContent()) || '').trim()
  } catch {
    return state.getCurrentContent().getPlainText('\n')
  }
}

const styleMap: Record<string, React.CSSProperties> = {
  CODE: {
    background: '#f0f0f0',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '0.9em',
    padding: '1px 4px',
    borderRadius: 4,
  },
  STRIKETHROUGH: {
    textDecoration: 'line-through',
    color: '#666',
  },
}

function ToolBtn({
  active,
  label,
  title,
  onClick,
  disabled,
}: {
  active?: boolean
  label: string
  title: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault()
        if (!disabled) onClick()
      }}
      style={{
        border: '1px solid ' + (active ? '#111' : '#d0d0d0'),
        background: active ? '#111' : '#fff',
        color: active ? '#fff' : '#222',
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        lineHeight: 1.2,
      }}
    >
      {label}
    </button>
  )
}

function DraftApp({ args, disabled, theme }: ComponentProps) {
  const a = (args || {}) as Args
  const markdown = typeof a.markdown === 'string' ? a.markdown : ''
  const height = Math.max(240, Number(a.height) || 420)
  const placeholder = a.placeholder || 'Escribe con Draft.js…'
  const readOnly = !!(a.read_only || disabled)
  const nonce = String(a.key_nonce || '')
  const jumpLine = Number.isFinite(Number(a.jump_line)) ? Number(a.jump_line) : -1
  const jumpText = typeof a.jump_text === 'string' ? a.jump_text.trim() : ''
  const jumpToken = String(a.jump_token || '')

  const [editorState, setEditorState] = useState(() => mdToState(markdown))
  const lastSent = useRef(markdown)
  const bootstrapped = useRef(false)
  const editorRef = useRef<Editor | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const lastJump = useRef('')

  useEffect(() => {
    Streamlit.setFrameHeight(height + 56)
  }, [height])

  // External markdown sync
  useEffect(() => {
    if (!bootstrapped.current) {
      bootstrapped.current = true
      lastSent.current = markdown
      return
    }
    if (markdown !== lastSent.current) {
      setEditorState(mdToState(markdown))
      lastSent.current = markdown
    }
  }, [markdown, nonce])

  const emit = useCallback((state: EditorState) => {
    const md = stateToMd(state)
    lastSent.current = md
    Streamlit.setComponentValue(md)
  }, [])

  const onChange = (state: EditorState) => {
    setEditorState(state)
    emit(state)
  }

  // Outline jump (Yohaku): select block by line or heading text
  useEffect(() => {
    if (jumpLine < 0 && !jumpText) return
    const token = jumpToken || `${jumpLine}:${jumpText}`
    if (!token || token === lastJump.current) return
    lastJump.current = token

    const content = editorState.getCurrentContent()
    const blocks = content.getBlocksAsArray()
    let targetKey: string | null = null
    let start = 0
    let end = 0

    if (jumpText) {
      const needle = jumpText.toLowerCase()
      for (const b of blocks) {
        const t = b.getText()
        if (t.toLowerCase().includes(needle)) {
          targetKey = b.getKey()
          const idx = t.toLowerCase().indexOf(needle)
          start = Math.max(0, idx)
          end = Math.min(t.length, start + jumpText.length)
          break
        }
      }
    }
    if (!targetKey && jumpLine >= 0) {
      // Map markdown line → Draft block by walking plain lines
      const plain = content.getPlainText('\n')
      const lines = plain.split('\n')
      let charPos = 0
      for (let i = 0; i < jumpLine && i < lines.length; i++) {
        charPos += lines[i].length + 1
      }
      let walked = 0
      for (const b of blocks) {
        const len = b.getLength()
        if (charPos <= walked + len) {
          targetKey = b.getKey()
          start = Math.max(0, charPos - walked)
          end = Math.min(len, start + (lines[jumpLine]?.length || 0))
          break
        }
        walked += len + 1
      }
      if (!targetKey && blocks[jumpLine]) {
        targetKey = blocks[jumpLine].getKey()
        end = blocks[jumpLine].getLength()
      }
    }
    if (!targetKey) return

    const selection = SelectionState.createEmpty(targetKey).merge({
      anchorOffset: start,
      focusOffset: end,
      hasFocus: true,
    }) as SelectionState
    const next = EditorState.forceSelection(editorState, selection)
    setEditorState(next)
    requestAnimationFrame(() => {
      const el = wrapRef.current?.querySelector(
        `[data-offset-key^="${targetKey}"]`
      ) as HTMLElement | null
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      editorRef.current?.focus()
    })
  }, [jumpLine, jumpText, jumpToken, editorState])

  const toggleInline = (style: string) => {
    onChange(RichUtils.toggleInlineStyle(editorState, style))
  }

  const toggleBlock = (type: string) => {
    onChange(RichUtils.toggleBlockType(editorState, type))
  }

  const undo = () => onChange(EditorState.undo(editorState))
  const redo = () => onChange(EditorState.redo(editorState))

  const promptLink = () => {
    const selection = editorState.getSelection()
    if (selection.isCollapsed()) {
      window.alert('Selecciona texto para crear un enlace.')
      return
    }
    const url = window.prompt('URL del enlace', 'https://')
    if (url === null) return
    if (!url.trim()) {
      onChange(RichUtils.toggleLink(editorState, selection, null))
      return
    }
    const content = editorState.getCurrentContent()
    const withEntity = content.createEntity('LINK', 'MUTABLE', { url: url.trim() })
    const entityKey = withEntity.getLastCreatedEntityKey()
    let next = EditorState.set(editorState, { currentContent: withEntity })
    next = RichUtils.toggleLink(next, next.getSelection(), entityKey)
    onChange(next)
  }

  const insertHr = () => {
    const content = editorState.getCurrentContent()
    const withEntity = content.createEntity('HORIZONTAL_RULE', 'IMMUTABLE', {})
    const entityKey = withEntity.getLastCreatedEntityKey()
    let next = EditorState.set(editorState, { currentContent: withEntity })
    next = AtomicBlockUtils.insertAtomicBlock(next, entityKey, ' ')
    onChange(next)
  }

  const currentStyle = editorState.getCurrentInlineStyle()
  const blockType = useMemo(() => {
    const sel = editorState.getSelection()
    return editorState.getCurrentContent().getBlockForKey(sel.getStartKey()).getType()
  }, [editorState])

  const handleKeyCommand = (command: string, state: EditorState) => {
    if (command === 'undo') {
      onChange(EditorState.undo(state))
      return 'handled'
    }
    if (command === 'redo') {
      onChange(EditorState.redo(state))
      return 'handled'
    }
    if (command === 'strikethrough') {
      onChange(RichUtils.toggleInlineStyle(state, 'STRIKETHROUGH'))
      return 'handled'
    }
    if (command === 'link') {
      promptLink()
      return 'handled'
    }
    const next = RichUtils.handleKeyCommand(state, command)
    if (next) {
      onChange(next)
      return 'handled'
    }
    return 'not-handled'
  }

  const mapKeyToEditorCommand = (e: React.KeyboardEvent) => {
    if (e.keyCode === 9 /* TAB */) {
      const newState = RichUtils.onTab(e as unknown as React.KeyboardEvent, editorState, 4)
      if (newState) onChange(newState)
      return null
    }
    if (KeyBindingUtil.hasCommandModifier(e)) {
      if (e.key === 'b') return 'bold'
      if (e.key === 'i') return 'italic'
      if (e.key === 'u') return 'underline'
      if (e.key === 'k') return 'link'
      if (e.key === 'z' && !e.shiftKey) return 'undo'
      if (e.key === 'z' && e.shiftKey) return 'redo'
      if (e.key === 'y') return 'redo'
      if (e.key === 'x' && e.shiftKey) return 'strikethrough'
    }
    return getDefaultKeyBinding(e as unknown as React.KeyboardEvent)
  }

  // Markdown shortcuts (Draft.js beforeInput pattern): # / ## / - / > + space
  const handleBeforeInput = (chars: string, state: EditorState) => {
    if (chars !== ' ') return 'not-handled'
    const selection = state.getSelection()
    if (!selection.isCollapsed()) return 'not-handled'
    const block = state.getCurrentContent().getBlockForKey(selection.getStartKey())
    if (block.getType() !== 'unstyled') return 'not-handled'
    const text = block.getText().slice(0, selection.getStartOffset())
    const map: Record<string, string> = {
      '#': 'header-one',
      '##': 'header-two',
      '###': 'header-three',
      '####': 'header-four',
      '*': 'unordered-list-item',
      '-': 'unordered-list-item',
      '+': 'unordered-list-item',
      '1.': 'ordered-list-item',
      '>': 'blockquote',
      '```': 'code-block',
    }
    const type = map[text]
    if (!type) return 'not-handled'
    const without = Modifier.replaceText(
      state.getCurrentContent(),
      selection.merge({
        anchorOffset: 0,
        focusOffset: selection.getStartOffset(),
      }) as SelectionState,
      ''
    )
    let next = EditorState.push(state, without, 'remove-range')
    next = RichUtils.toggleBlockType(next, type)
    onChange(next)
    return 'handled'
  }

  const blockRenderer = (block: { getType: () => string }) => {
    if (block.getType() === 'atomic') {
      return {
        component: () => (
          <hr
            style={{
              border: 0,
              borderTop: '2px solid #ccc',
              margin: '12px 0',
            }}
          />
        ),
        editable: false,
      }
    }
    return null
  }

  return (
    <div
      ref={wrapRef}
      className="l8-draft-wrap"
      style={{
        border: '1px solid #d8d8d8',
        borderRadius: 8,
        overflow: 'hidden',
        background: theme?.backgroundColor || '#fff',
        color: theme?.textColor || '#111',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          padding: '8px 10px',
          borderBottom: '1px solid #e8e8e8',
          background: '#f7f7f7',
        }}
      >
        <ToolBtn label="↶" title="Deshacer (⌘Z)" onClick={undo} disabled={readOnly} />
        <ToolBtn label="↷" title="Rehacer (⌘⇧Z)" onClick={redo} disabled={readOnly} />
        <span style={{ width: 1, background: '#ddd', margin: '0 2px' }} />
        <ToolBtn active={currentStyle.has('BOLD')} label="B" title="Negrita (⌘B)" onClick={() => toggleInline('BOLD')} disabled={readOnly} />
        <ToolBtn active={currentStyle.has('ITALIC')} label="I" title="Cursiva (⌘I)" onClick={() => toggleInline('ITALIC')} disabled={readOnly} />
        <ToolBtn active={currentStyle.has('UNDERLINE')} label="U" title="Subrayado (⌘U)" onClick={() => toggleInline('UNDERLINE')} disabled={readOnly} />
        <ToolBtn active={currentStyle.has('STRIKETHROUGH')} label="S" title="Tachado" onClick={() => toggleInline('STRIKETHROUGH')} disabled={readOnly} />
        <ToolBtn active={currentStyle.has('CODE')} label="<>" title="Código" onClick={() => toggleInline('CODE')} disabled={readOnly} />
        <ToolBtn label="🔗" title="Enlace (⌘K)" onClick={promptLink} disabled={readOnly} />
        <span style={{ width: 1, background: '#ddd', margin: '0 2px' }} />
        <ToolBtn active={blockType === 'header-one'} label="H1" title="# + espacio" onClick={() => toggleBlock('header-one')} disabled={readOnly} />
        <ToolBtn active={blockType === 'header-two'} label="H2" title="## + espacio" onClick={() => toggleBlock('header-two')} disabled={readOnly} />
        <ToolBtn active={blockType === 'header-three'} label="H3" title="### + espacio" onClick={() => toggleBlock('header-three')} disabled={readOnly} />
        <ToolBtn active={blockType === 'header-four'} label="H4" title="#### + espacio" onClick={() => toggleBlock('header-four')} disabled={readOnly} />
        <ToolBtn active={blockType === 'unordered-list-item'} label="•" title="Lista (- + espacio)" onClick={() => toggleBlock('unordered-list-item')} disabled={readOnly} />
        <ToolBtn active={blockType === 'ordered-list-item'} label="1." title="Lista numerada" onClick={() => toggleBlock('ordered-list-item')} disabled={readOnly} />
        <ToolBtn active={blockType === 'blockquote'} label="“”" title="Cita (> + espacio)" onClick={() => toggleBlock('blockquote')} disabled={readOnly} />
        <ToolBtn active={blockType === 'code-block'} label="{ }" title="Bloque código" onClick={() => toggleBlock('code-block')} disabled={readOnly} />
        <ToolBtn label="—" title="Separador horizontal" onClick={insertHr} disabled={readOnly} />
      </div>
      <div
        style={{
          height: height - 8,
          overflowY: 'auto',
          padding: '12px 14px 20px',
          cursor: 'text',
          fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
          fontSize: 14,
          lineHeight: 1.55,
        }}
        onClick={() => editorRef.current?.focus()}
      >
        <Editor
          key={nonce || 'draft'}
          ref={editorRef}
          editorState={editorState}
          onChange={onChange}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          handleBeforeInput={handleBeforeInput}
          blockRendererFn={blockRenderer}
          customStyleMap={styleMap}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck
        />
      </div>
      <style>{`
        .l8-draft-wrap .public-DraftEditorPlaceholder-root {
          color: #999;
        }
        .l8-draft-wrap .public-DraftStyleDefault-block {
          margin: 0.35em 0;
        }
        .l8-draft-wrap .public-DraftStyleDefault-header-one {
          font-size: 1.55rem;
          font-weight: 700;
        }
        .l8-draft-wrap .public-DraftStyleDefault-header-two {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .l8-draft-wrap .public-DraftStyleDefault-header-three {
          font-size: 1.1rem;
          font-weight: 650;
        }
        .l8-draft-wrap .public-DraftStyleDefault-header-four {
          font-size: 1rem;
          font-weight: 650;
        }
        .l8-draft-wrap .public-DraftStyleDefault-blockquote {
          border-left: 3px solid #ccc;
          padding-left: 10px;
          color: #555;
        }
        .l8-draft-wrap .public-DraftStyleDefault-pre {
          background: #f4f4f4;
          padding: 8px 10px;
          border-radius: 6px;
          font-family: ui-monospace, monospace;
          font-size: 12.5px;
        }
      `}</style>
    </div>
  )
}

export default withStreamlitConnection(DraftApp)
