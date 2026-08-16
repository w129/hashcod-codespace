import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  KeyBindingUtil,
  ContentState,
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
}

function mdToState(md: string): EditorState {
  try {
    const content = stateFromMarkdown(md || '') as ContentState
    return EditorState.createWithContent(content)
  } catch {
    return EditorState.createEmpty()
  }
}

function stateToMd(state: EditorState): string {
  try {
    return (stateToMarkdown(state.getCurrentContent()) || '').trim()
  } catch {
    return state.getCurrentContent().getPlainText('\n')
  }
}

function ToolBtn({
  active,
  label,
  title,
  onClick,
}: {
  active?: boolean
  label: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      style={{
        border: '1px solid ' + (active ? '#111' : '#d0d0d0'),
        background: active ? '#111' : '#fff',
        color: active ? '#fff' : '#222',
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
        cursor: 'pointer',
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

  const [editorState, setEditorState] = useState(() => mdToState(markdown))
  const lastSent = useRef(markdown)
  const bootstrapped = useRef(false)
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    Streamlit.setFrameHeight(height + 52)
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

  const toggleInline = (style: string) => {
    const next = RichUtils.toggleInlineStyle(editorState, style)
    onChange(next)
  }

  const toggleBlock = (type: string) => {
    const next = RichUtils.toggleBlockType(editorState, type)
    onChange(next)
  }

  const currentStyle = editorState.getCurrentInlineStyle()
  const blockType = useMemo(() => {
    const sel = editorState.getSelection()
    return editorState.getCurrentContent().getBlockForKey(sel.getStartKey()).getType()
  }, [editorState])

  const handleKeyCommand = (command: string, state: EditorState) => {
    const next = RichUtils.handleKeyCommand(state, command)
    if (next) {
      onChange(next)
      return 'handled'
    }
    return 'not-handled'
  }

  const mapKeyToEditorCommand = (e: React.KeyboardEvent) => {
    if (e.keyCode === 9 /* TAB */) {
      const newState = RichUtils.onTab(e as unknown as React.KeyboardEvent, editorState, 2)
      if (newState) onChange(newState)
      return null
    }
    if (KeyBindingUtil.hasCommandModifier(e) && e.key === 'b') return 'bold'
    if (KeyBindingUtil.hasCommandModifier(e) && e.key === 'i') return 'italic'
    return getDefaultKeyBinding(e as unknown as React.KeyboardEvent)
  }

  return (
    <div
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
        <ToolBtn active={currentStyle.has('BOLD')} label="B" title="Negrita" onClick={() => toggleInline('BOLD')} />
        <ToolBtn active={currentStyle.has('ITALIC')} label="I" title="Cursiva" onClick={() => toggleInline('ITALIC')} />
        <ToolBtn active={currentStyle.has('UNDERLINE')} label="U" title="Subrayado" onClick={() => toggleInline('UNDERLINE')} />
        <ToolBtn active={currentStyle.has('CODE')} label="<>" title="Código" onClick={() => toggleInline('CODE')} />
        <span style={{ width: 1, background: '#ddd', margin: '0 2px' }} />
        <ToolBtn active={blockType === 'header-one'} label="H1" title="Título 1" onClick={() => toggleBlock('header-one')} />
        <ToolBtn active={blockType === 'header-two'} label="H2" title="Título 2" onClick={() => toggleBlock('header-two')} />
        <ToolBtn active={blockType === 'header-three'} label="H3" title="Título 3" onClick={() => toggleBlock('header-three')} />
        <ToolBtn active={blockType === 'unordered-list-item'} label="• Lista" title="Lista" onClick={() => toggleBlock('unordered-list-item')} />
        <ToolBtn active={blockType === 'ordered-list-item'} label="1. Lista" title="Lista numerada" onClick={() => toggleBlock('ordered-list-item')} />
        <ToolBtn active={blockType === 'blockquote'} label="“”" title="Cita" onClick={() => toggleBlock('blockquote')} />
        <ToolBtn active={blockType === 'code-block'} label="{ }" title="Bloque código" onClick={() => toggleBlock('code-block')} />
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
        .l8-draft-wrap h1, .l8-draft-wrap .public-DraftStyleDefault-header-one {
          font-size: 1.55rem;
          font-weight: 700;
        }
        .l8-draft-wrap h2, .l8-draft-wrap .public-DraftStyleDefault-header-two {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .l8-draft-wrap h3, .l8-draft-wrap .public-DraftStyleDefault-header-three {
          font-size: 1.1rem;
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
