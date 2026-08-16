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
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  ListsToggle,
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
}

function EditorApp({ args, disabled, theme }: ComponentProps) {
  const a = (args || {}) as Args
  const markdown = typeof a.markdown === 'string' ? a.markdown : ''
  const height = Math.max(220, Number(a.height) || 420)
  const placeholder = a.placeholder || 'Escribe markdown…'
  const readOnly = !!(a.read_only || disabled)
  const nonce = String(a.key_nonce || '')
  const editorRef = useRef<MDXEditorMethods | null>(null)
  const lastSent = useRef(markdown)
  const bootstrapped = useRef(false)

  const plugins = useMemo(
    () => [
      headingsPlugin(),
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
      toolbarPlugin({
        toolbarContents: () => (
          <>
            <UndoRedo />
            <Separator />
            <BoldItalicUnderlineToggles />
            <CodeToggle />
            <Separator />
            <BlockTypeSelect />
            <Separator />
            <CreateLink />
            <InsertTable />
            <ListsToggle />
          </>
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

  return (
    <div
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
