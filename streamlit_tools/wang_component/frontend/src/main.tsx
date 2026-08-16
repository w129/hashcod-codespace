/**
 * wangEditor column editor for SoroOtbedit.
 * @wangeditor/editor with markdown bridge (marked ↔ turndown) for outline/#.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import '@wangeditor/editor/dist/css/style.css'
import { marked } from 'marked'
import TurndownService from 'turndown'
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

marked.setOptions({ gfm: true, breaks: false })

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
})

turndown.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: (content) => `~~${content}~~`,
})

turndown.addRule('taskList', {
  filter: (node) =>
    node.nodeName === 'INPUT' &&
    (node as HTMLInputElement).type === 'checkbox',
  replacement: (_content, node) =>
    (node as HTMLInputElement).checked ? '[x] ' : '[ ] ',
})

function mdToHtml(md: string): string {
  try {
    const html = marked.parse(md || '', { async: false }) as string
    return html && html.trim() ? html : '<p><br></p>'
  } catch {
    const safe = (md || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    return `<p>${safe}</p>`
  }
}

function htmlToMd(html: string): string {
  try {
    return turndown.turndown(html || '').trim()
  } catch {
    return html || ''
  }
}

function WangApp({ args, disabled, theme }: ComponentProps) {
  const a = (args || {}) as Args
  const markdown = typeof a.markdown === 'string' ? a.markdown : ''
  const height = Math.max(240, Number(a.height) || 420)
  const placeholder = a.placeholder || 'Escribe con wangEditor…'
  const readOnly = !!(a.read_only || disabled)
  const nonce = String(a.key_nonce || '')
  const jumpLine = Number.isFinite(Number(a.jump_line)) ? Number(a.jump_line) : -1
  const jumpText = typeof a.jump_text === 'string' ? a.jump_text.trim() : ''
  const jumpToken = String(a.jump_token || '')

  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const [html, setHtml] = useState(() => mdToHtml(markdown))
  const lastSent = useRef(markdown)
  const bootstrapped = useRef(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const lastJump = useRef('')

  useEffect(() => {
    Streamlit.setFrameHeight(height + 56)
  }, [height])

  useEffect(() => {
    return () => {
      if (editor == null) return
      try {
        editor.destroy()
      } catch {
        /* ignore */
      }
      setEditor(null)
    }
  }, [editor])

  // External markdown sync (project load / column switch)
  useEffect(() => {
    if (!bootstrapped.current) {
      bootstrapped.current = true
      lastSent.current = markdown
      return
    }
    if (markdown !== lastSent.current) {
      const next = mdToHtml(markdown)
      setHtml(next)
      lastSent.current = markdown
      if (editor) {
        try {
          editor.setHtml(next)
        } catch {
          /* ignore */
        }
      }
    }
  }, [markdown, nonce, editor])

  // Outline jump (Yohaku)
  useEffect(() => {
    if (!editor || (jumpLine < 0 && !jumpText)) return
    const token = jumpToken || `${jumpLine}:${jumpText}`
    if (!token || token === lastJump.current) return
    lastJump.current = token

    requestAnimationFrame(() => {
      const root = wrapRef.current?.querySelector('[data-slate-editor]') as HTMLElement | null
      if (!root) return
      const headings = Array.from(
        root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li')
      ) as HTMLElement[]
      let target: HTMLElement | null = null
      if (jumpText) {
        const needle = jumpText.toLowerCase()
        target =
          headings.find((el) => (el.textContent || '').toLowerCase().includes(needle)) ||
          null
      }
      if (!target && jumpLine >= 0) {
        const lines = (lastSent.current || '').split('\n')
        const lineText = (lines[jumpLine] || '').replace(/^#+\s*/, '').trim()
        if (lineText) {
          const needle = lineText.toLowerCase()
          target =
            headings.find((el) => (el.textContent || '').toLowerCase().includes(needle)) ||
            null
        }
        if (!target) target = headings[Math.min(jumpLine, headings.length - 1)] || null
      }
      if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' })
        try {
          editor.focus()
        } catch {
          /* ignore */
        }
      }
    })
  }, [editor, jumpLine, jumpText, jumpToken])

  const toolbarConfig: Partial<IToolbarConfig> = useMemo(
    () => ({
      excludeKeys: [
        'uploadImage',
        'uploadVideo',
        'insertVideo',
        'group-video',
        'fullScreen',
        'insertImage',
      ],
    }),
    []
  )

  const editorConfig: Partial<IEditorConfig> = useMemo(
    () => ({
      placeholder,
      readOnly,
      autoFocus: false,
      MENU_CONF: {
        // Prefer paste as plain/HTML that survives markdown roundtrip
      },
    }),
    [placeholder, readOnly]
  )

  return (
    <div
      ref={wrapRef}
      className="l8-wang-wrap"
      style={{
        border: '1px solid #d8d8d8',
        borderRadius: 8,
        overflow: 'hidden',
        background: theme?.backgroundColor || '#fff',
        color: theme?.textColor || '#111',
      }}
    >
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #e8e8e8', background: '#f7f7f7' }}
      />
      <Editor
        key={nonce || 'wang'}
        defaultConfig={editorConfig}
        value={html}
        onCreated={(ed) => setEditor(ed)}
        onChange={(ed) => {
          const nextHtml = ed.getHtml()
          setHtml(nextHtml)
          const md = htmlToMd(nextHtml)
          lastSent.current = md
          Streamlit.setComponentValue(md)
        }}
        mode="default"
        style={{ height: height - 8, overflowY: 'auto' }}
      />
      <style>{`
        .l8-wang-wrap .w-e-text-container {
          background: transparent !important;
        }
        .l8-wang-wrap .w-e-scroll {
          min-height: ${Math.max(160, height - 72)}px;
        }
        .l8-wang-wrap .w-e-text-container [data-slate-editor] {
          padding: 12px 14px 20px !important;
          font-size: 14px;
          line-height: 1.55;
          font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
        }
        .l8-wang-wrap .w-e-text-container h1 {
          font-size: 1.55rem;
        }
        .l8-wang-wrap .w-e-text-container h2 {
          font-size: 1.25rem;
        }
        .l8-wang-wrap .w-e-text-container h3 {
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  )
}

export default withStreamlitConnection(WangApp)
