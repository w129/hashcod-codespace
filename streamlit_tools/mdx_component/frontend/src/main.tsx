/**
 * MDXEditor column editor for SoroOtbedit.
 * @mdxeditor/editor — native markdown, Notion-like toolbar, source mode, outline jump.
 */
import React, { useEffect, useMemo, useRef } from 'react'
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  StrikeThroughSupSubToggles,
  CodeToggle,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  DiffSourceToggleWrapper,
  Separator,
  type MDXEditorMethods,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
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

function EditorApp({ args, disabled, theme }: ComponentProps) {
  const a = (args || {}) as Args
  const markdown = typeof a.markdown === 'string' ? a.markdown : ''
  const height = Math.max(220, Number(a.height) || 420)
  const placeholder = a.placeholder || 'Escribe markdown…'
  const readOnly = !!(a.read_only || disabled)
  const nonce = String(a.key_nonce || '')
  const jumpLine = Number.isFinite(Number(a.jump_line)) ? Number(a.jump_line) : -1
  const jumpText = typeof a.jump_text === 'string' ? a.jump_text.trim() : ''
  const jumpToken = String(a.jump_token || '')
  const editorRef = useRef<MDXEditorMethods | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const lastSent = useRef(markdown)
  const bootstrapped = useRef(false)
  const lastJump = useRef('')

  const plugins = useMemo(
    () => [
      headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5, 6] }),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      markdownShortcutPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      tablePlugin(),
      codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
      codeMirrorPlugin({
        codeBlockLanguages: {
          txt: 'Plain',
          js: 'JavaScript',
          ts: 'TypeScript',
          py: 'Python',
          md: 'Markdown',
          json: 'JSON',
          html: 'HTML',
          css: 'CSS',
        },
      }),
      diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: '' }),
      toolbarPlugin({
        toolbarContents: () => (
          <DiffSourceToggleWrapper>
            <UndoRedo />
            <Separator />
            <BoldItalicUnderlineToggles />
            <StrikeThroughSupSubToggles options={['Strikethrough']} />
            <CodeToggle />
            <Separator />
            <BlockTypeSelect />
            <Separator />
            <CreateLink />
            <InsertTable />
            <InsertThematicBreak />
            <ListsToggle />
          </DiffSourceToggleWrapper>
        ),
      }),
    ],
    []
  )

  useEffect(() => {
    Streamlit.setFrameHeight(height + 8)
  }, [height])

  // Sync external markdown (column switch / project load) into the editor.
  useEffect(() => {
    if (!bootstrapped.current) {
      bootstrapped.current = true
      lastSent.current = markdown
      return
    }
    if (editorRef.current && markdown !== lastSent.current) {
      editorRef.current.setMarkdown(markdown)
      lastSent.current = markdown
    }
  }, [markdown, nonce])

  // Outline jump (Yohaku)
  useEffect(() => {
    if (jumpLine < 0 && !jumpText) return
    const token = jumpToken || `${jumpLine}:${jumpText}`
    if (!token || token === lastJump.current) return
    lastJump.current = token

    requestAnimationFrame(() => {
      const root = wrapRef.current?.querySelector('.l8-mdx-content') as HTMLElement | null
      if (!root) return
      const nodes = Array.from(
        root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li')
      ) as HTMLElement[]
      let target: HTMLElement | null = null
      if (jumpText) {
        const needle = jumpText.toLowerCase()
        target =
          nodes.find((el) => (el.textContent || '').toLowerCase().includes(needle)) || null
      }
      if (!target && jumpLine >= 0) {
        const lines = (lastSent.current || '').split('\n')
        const lineText = (lines[jumpLine] || '').replace(/^#+\s*/, '').trim()
        if (lineText) {
          const needle = lineText.toLowerCase()
          target =
            nodes.find((el) => (el.textContent || '').toLowerCase().includes(needle)) || null
        }
      }
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      try {
        editorRef.current?.focus?.()
      } catch {
        /* ignore */
      }
    })
  }, [jumpLine, jumpText, jumpToken, markdown, nonce])

  return (
    <div
      ref={wrapRef}
      className="l8-mdx-wrap"
      style={{
        height,
        overflow: 'auto',
        border: '1px solid #d8d8d8',
        borderRadius: 8,
        background: theme?.backgroundColor || '#fff',
        color: theme?.textColor || '#111',
      }}
    >
      <MDXEditor
        key={nonce || 'mdx'}
        ref={editorRef}
        markdown={markdown}
        readOnly={readOnly}
        placeholder={placeholder}
        contentEditableClassName="l8-mdx-content"
        onChange={(md) => {
          lastSent.current = md
          Streamlit.setComponentValue(md)
        }}
        plugins={plugins}
      />
      <style>{`
        .l8-mdx-wrap .mdxeditor {
          --basePageBg: transparent;
          font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
        }
        .l8-mdx-wrap .mdxeditor-toolbar {
          background: #f7f7f7;
          border-bottom: 1px solid #e5e5e5;
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .l8-mdx-content {
          min-height: ${Math.max(160, height - 64)}px;
          padding: 12px 14px 24px;
          font-size: 14px;
          line-height: 1.55;
        }
        .l8-mdx-content:focus {
          outline: none;
        }
      `}</style>
    </div>
  )
}

export default withStreamlitConnection(EditorApp)
