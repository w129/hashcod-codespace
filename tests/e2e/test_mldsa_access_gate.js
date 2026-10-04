'use strict';

const fs=require('node:fs');
const assert=require('node:assert/strict');

const gate=fs.readFileSync('mldsa-access.php','utf8');
const api=fs.readFileSync('mldsa-access-api.php','utf8');
const css=fs.readFileSync('components/mldsa-access-gate.css','utf8');
const js=fs.readFileSync('components/mldsa-access-gate.js','utf8');
const component=fs.readFileSync('first-screen-branched-menu-build/BranchedMenu.jsx','utf8');
const componentCss=fs.readFileSync('first-screen-branched-menu-build/BranchedMenu.css','utf8');
const entry=fs.readFileSync('first-screen-branched-menu-build/entry.jsx','utf8');
const pkg=JSON.parse(fs.readFileSync('first-screen-branched-menu-build/package.json','utf8'));
const centerEmptyState=fs.readFileSync('center-empty-state-build/EmptyState.jsx','utf8');
const centerEmptyStateEntry=fs.readFileSync('center-empty-state-build/entry.jsx','utf8');
const centerEmptyStateCss=fs.readFileSync('center-empty-state-build/empty-state.css','utf8');
const centerEmptyStateEntryCss=fs.readFileSync('center-empty-state-build/entry.css','utf8');
const centerEmptyStatePkg=JSON.parse(fs.readFileSync('center-empty-state-build/package.json','utf8'));
const codeAccessLib=fs.readFileSync('code-access-lib.php','utf8');
const codeAccessApi=fs.readFileSync('code-access-api.php','utf8');
const codeAccessEntry=fs.readFileSync('code-access-build/entry.jsx','utf8');
const codeAccessCss=fs.readFileSync('code-access-build/entry.css','utf8');
const codeAccessPkg=JSON.parse(fs.readFileSync('code-access-build/package.json','utf8'));
const rotatingCss=fs.readFileSync('components/react-bits-rotating-text.css','utf8');
const rotatingJs=fs.readFileSync('components/react-bits-rotating-text.js','utf8');
const animateCursorCss=fs.readFileSync('components/animate-ui-global-cursor.css','utf8');
const animateCursorJs=fs.readFileSync('components/animate-ui-global-cursor.js','utf8');
const bookCursorFollow=fs.readFileSync('components/book-cursor-follow.svg','utf8');
const l8=fs.readFileSync('l8-html.php','utf8');
const router=fs.readFileSync('router.php','utf8');
const pub=fs.readFileSync('config/mldsa87-access-public.b64','utf8').replace(/\s+/g,'');

function crc32(str){
  let table=crc32.t;
  if(!table){
    table=crc32.t=Array.from({length:256},(_,n)=>{
      let c=n;
      for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
      return c>>>0;
    });
  }
  let crc=0xffffffff;
  for(let i=0;i<str.length;i++)crc=table[(crc^str.charCodeAt(i))&255]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}

// Existing security backend remains intact.
assert.strictEqual(pub.length,3456,'ML-DSA-87 public key Base64 length must be exact');
assert.strictEqual(Buffer.from(pub,'base64').length,2592,'ML-DSA-87 public key must decode to 2592 bytes');
assert.strictEqual(crc32(pub).toString(16).padStart(8,'0'),'25eb08f5','production ML-DSA-87 public key checksum mismatch');
assert(gate.includes("function mldsaConsumeJti"),'atomic anti-replay JTI consumption missing');
assert(gate.includes("function mldsaOriginAllowed"),'same-origin request binding missing');
assert(api.includes("protocol'=>'ML-DSA-87-2PHASE"),'two-phase protocol marker missing');
assert(api.includes("replay_detected"),'replay rejection missing');
assert(router.includes("'/api/mldsa-access'"),'ML-DSA API route missing');
assert(router.includes("'/api/code-access'"),'OCG mesh access API route missing');
assert(gate.includes("function codeAccessRequired()"),'code access requirement switch missing');
assert(gate.includes("L8_CODE_ACCESS_REQUIRED','1'"),'code access must default to required');
assert(gate.includes("function codeAccessAuthorized()"),'code access reload gate missing');
assert(gate.includes("return !codeAccessRequired();"),'OCG mesh gate must reappear after reload');
assert(codeAccessLib.includes("function meshAccessSchema()"),'OCG mesh schema helper missing');
assert(codeAccessLib.includes("OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI"),'OCG mesh schema changed');
assert(codeAccessLib.includes("meshAccessFieldNames"),'mesh credential field list missing');
assert(codeAccessLib.includes("['TYPE','PAYLOAD','SALT','NONCE','ISSUED','USE','CHECK']"),'mesh credential field names changed');
assert(codeAccessLib.includes("meshAccessDigest"),'mesh credential digest missing');
assert(codeAccessLib.includes("meshAccessReadBinding"),'persistent mesh binding read missing');
assert(codeAccessLib.includes("meshAccessWriteBinding"),'persistent mesh binding write missing');
assert(codeAccessLib.includes("l8_ocg_mesh_binding_v1"),'mesh binding cookie name changed');
assert(codeAccessApi.includes("X_HASHCOD_MESH"),'mesh request marker validation missing');
assert(codeAccessApi.includes("binding_mismatch"),'different post-enrollment credentials must be rejected');
assert(codeAccessApi.includes("meshAccessWriteBinding($digest)"),'first-use mesh enrollment missing');
assert(codeAccessApi.includes("hash_equals($stored,$digest)"),'stored mesh binding comparison missing');
assert(!codeAccessApi.includes("mldsaOriginAllowed()"),'mesh flow must not depend on the proxy-fragile Origin matcher');
assert.equal(codeAccessPkg.dependencies['monaco-editor'],'0.52.2','Monaco Editor dependency changed');
assert(codeAccessEntry.includes("monaco.editor.create"),'Monaco Editor must render the access view');
assert(codeAccessEntry.includes("function MeshNodeIcon"),'vector mesh icon component missing');
assert(codeAccessEntry.includes('viewBox="0 0 256 256"'),'new vector icon viewBox missing');
assert(codeAccessEntry.includes('M17.22656,46.58203'),'new vector icon path missing');
assert(codeAccessEntry.includes('fill="#ffffff"'),'vector icon must be white');
assert(codeAccessCss.includes('background: transparent'),'vector icon must have no background');
assert(codeAccessCss.includes('border: 0'),'vector icon must have no border');
assert(codeAccessCss.includes('box-shadow: none'),'vector icon must have no shadow container');
assert(codeAccessEntry.includes('data-vector-icon="ocg-mesh-node"'),'vector mesh icon marker missing');
assert(codeAccessEntry.includes('data-animate-ui-dialog="mesh-credential"'),'Animate UI mesh dialog marker missing');
assert(codeAccessEntry.includes("Mesh node credential"),'Animate UI mesh credential title missing');
assert(codeAccessEntry.includes("Bind & unlock"),'first enrollment action missing');
assert(codeAccessEntry.includes("Verify & unlock"),'bound credential verification action missing');
assert(codeAccessEntry.includes("Access.php")&&codeAccessEntry.includes("Protocol"),'CodeTabs-style access tabs missing');
assert(codeAccessCss.includes('.code-tabs-shell'),'CodeTabs-style editor shell missing');
assert(codeAccessCss.includes('.code-access-overlay'),'blocking access overlay missing');
assert(codeAccessCss.includes('.mesh-editor-icon'),'vector mesh icon styling missing');
assert(codeAccessCss.includes('.mesh-animate-dialog'),'Animate UI mesh dialog styling missing');
assert(codeAccessCss.includes('@keyframes meshAnimateDialogIn'),'Animate UI dialog entrance animation missing');
assert(codeAccessCss.includes('.mesh-animate-field'),'Animate UI field styling missing');
assert(codeAccessCss.includes('.mesh-animate-button-primary'),'Animate UI primary action styling missing');

// Root stays on the first presentation.
assert(l8.includes('Single-screen mode: the root route permanently renders only the'),'single-screen root contract missing');
assert(l8.includes("echo mldsaGateHtml(l8_public_base_path(), true);"),'first-screen renderer missing');
assert(!l8.includes('$entryPass = l8_entry_intro_consume();'),'one-shot platform entry pass must no longer be used');

// The former white access window must be gone from first-screen markup.
assert(gate.includes('id="d5FirstBranchedMenuStage"'),'BranchedMenu stage missing');
assert(gate.includes('id="d5FirstBranchedMenuMount"'),'React BranchedMenu mount missing');
assert(gate.includes('data-react-bits-component="BranchedMenu"'),'React Bits component marker missing');
assert(!gate.includes('class="access-card entry-access-card"'),'former white access card must be removed');
assert(!gate.includes('id="d5VerifyText">Entrar</span>'),'former Entrar button must be removed');
assert(!gate.includes('id="d5EntryStatCard"'),'former Monthly revenue card must be removed');
assert(!gate.includes('Acceso a Hashcod Codespace</h1>'),'former window title must be removed from visible markup');
assert(!gate.includes('Esta ventana aparece primero antes de entrar a la plataforma.'),'former window description must be removed');
assert(!gate.includes('id="d5TiltCardDemo"'),'slot purchase TiltCard must be removed');
assert(!gate.includes('Current price to purchase a slot'),'slot purchase card title must be removed');
assert(!gate.includes('id="d5SavedChatDemo"'),'Saved Messages card must be removed');
assert(!gate.includes('Saved Messages</h3>'),'Saved Messages title must be removed');


assert(gate.includes('components/first-screen-branched-menu.bundle.css?v=20261004-preview-policy5'),'BranchedMenu CSS bundle must load');
assert(gate.includes('components/first-screen-branched-menu.bundle.js?v=20261004-preview-policy5'),'BranchedMenu JS bundle must load');
assert(gate.includes('components/code-access.bundle.css?v=20261004-mesh-dialog1'),'code access CSS bundle must load');
assert(gate.includes('components/code-access.bundle.js?v=20261004-mesh-dialog1'),'code access JS bundle must load');
assert(gate.includes('id="d5CodeAccessMount"'),'code access React mount missing');
assert(gate.includes('data-hashcod-component="CodeAccessGate"'),'code access component marker missing');
assert(gate.includes('class="code-access-boot-window"'),'styled CodeTabs boot window missing');
assert(gate.includes('Mesh access binding'),'OCG mesh fallback title missing');
assert(gate.includes('OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI'),'OCG mesh fallback schema missing');
assert(gate.includes('code-access-boot-vector'),'OCG vector icon fallback missing');
assert(gate.includes('Access.php'),'CodeTabs boot Access.php tab missing');
assert(gate.includes('Protocol'),'CodeTabs boot Protocol tab missing');
assert(css.includes('/* Code access fallback shell'),'code access fallback styling missing from always-loaded gate CSS');
assert(css.includes('backdrop-filter:blur(20px) saturate(.72)'),'code access fallback must blur the platform behind it');
assert(css.includes('.code-access-root .code-access-boot-window'),'code access fallback window styling missing');
assert(codeAccessCss.includes('background: rgba(247,247,245,.56)'),'Monaco overlay must keep the platform visible behind a translucent blur');
assert(codeAccessCss.includes('backdrop-filter: blur(20px) saturate(.72)'),'Monaco overlay blur missing');
assert(css.includes('.entry-branched-menu-stage{'),'BranchedMenu host styling missing');
assert(css.includes('background:transparent'),'BranchedMenu host must not have the old black background');
assert(css.includes('color:#0a0a0a'),'BranchedMenu host text color must be black');
assert(css.includes('--bm-muted:#0a0a0a'),'idle BranchedMenu text must remain black');
assert(css.includes('border-radius:0'),'former rounded window chrome must not survive');
assert(css.includes('box-shadow:none'),'former window shadow must not survive');
assert(css.includes('left:18px'),'desktop BranchedMenu must keep a comfortable left inset');
assert(css.includes('top:8px'),'desktop BranchedMenu must be lifted toward the top edge');

assert(gate.includes('id="d5CenterEmptyStateStage"'),'center EmptyState stage missing');
assert(gate.includes('id="d5CenterEmptyStateMount"'),'center EmptyState mount missing');
assert(gate.includes('data-hashcod-component="EmptyState"'),'center EmptyState component marker missing');
assert(gate.includes('components/center-empty-state.bundle.css?v=20261004-file-vault2'),'center EmptyState CSS bundle must load');
assert(gate.includes('components/center-empty-state.bundle.js?v=20261004-file-vault2'),'center EmptyState JS bundle must load');
assert(centerEmptyState.includes('AnimatePresence'),'EmptyState AnimatePresence behavior missing');
assert(centerEmptyState.includes('ResizeObserver'),'EmptyState dynamic height observer missing');
assert(centerEmptyState.includes('useReducedMotion'),'EmptyState reduced-motion support missing');
assert(centerEmptyState.includes('function iconKey(icon)'),'EmptyState icon crossfade key missing');
assert(centerEmptyStateEntry.includes('function CcCardTitleIcon()'),'retained center icon component missing');
assert(centerEmptyStateEntry.includes('viewBox="0 0 48 48"'),'retained center icon viewBox changed');
assert(centerEmptyStateEntry.includes('icon={<CcCardTitleIcon />}'),'single Hatch launcher icon missing');
assert(centerEmptyStateEntry.includes('function JavaIcon()'),'Java icon component missing');
assert(centerEmptyStateEntry.includes('function JavaScriptIcon()'),'JavaScript icon component missing');
assert(centerEmptyStateEntry.includes('function CssIcon()'),'CSS icon component missing');
assert(centerEmptyStateEntry.includes('viewBox="0 0 256 256"'),'CSS icon must preserve supplied 256x256 viewBox');
assert(centerEmptyStateEntry.includes('id="color-1_4d9YPiN04osD_gr1"'),'CSS icon first gradient missing');
assert(centerEmptyStateEntry.includes('id="color-4_4d9YPiN04osD_gr4"'),'CSS icon fourth gradient missing');
assert(centerEmptyStateEntry.includes('fill="#2062af"'),'CSS icon dark blue shield missing');
assert(centerEmptyStateEntry.includes('fill="#3c9cd7"'),'CSS icon light blue shield missing');
assert(centerEmptyStateEntry.includes('function HtmlIcon()'),'HTML icon component missing');
assert(centerEmptyStateEntry.includes('function HtmlPreviewIcon()'),'HTML preview button icon component missing');
assert(centerEmptyStateEntry.includes('viewBox="0 0 24 24"'),'HTML preview button icon viewBox missing');
assert(centerEmptyStateEntry.includes('M 6 2 C 4.897 2 4 2.897 4 4'),'supplied HTML preview button path missing');
assert(centerEmptyStateEntry.includes('fill="#e7a42b"'),'HTML icon outer shield color missing');
assert(centerEmptyStateEntry.includes('fill="#f2bf22"'),'HTML icon inner shield color missing');
assert(centerEmptyStateEntry.includes('points="8,5 42,5 38,39 25,43 11,39"'),'supplied HTML shield polygon missing');
assert(centerEmptyStateEntry.includes('fill="#f7df1e"'),'JavaScript icon yellow field missing');
assert(centerEmptyStateEntry.includes('M29.538,32.947c0.692,1.124'),'supplied JavaScript JS path missing');
assert(centerEmptyStateEntry.includes('viewBox="0 0 50 50"'),'Java icon must preserve supplied 50x50 viewBox');
assert(centerEmptyStateEntry.includes('M 28.1875 0 C 30.9375 6.363281'),'supplied Java icon path missing');
assert(!centerEmptyStateEntry.includes('id="d5JavaHatchAction"'),'Java must not have a second Hatch launcher');
assert(!centerEmptyStateEntry.includes('center-hatch-launchers'),'dual launcher wrapper must be removed');
assert(!centerEmptyStateEntry.includes('function WorkspaceFrameIcon()'),'former top icon must be removed');
assert(!centerEmptyStateEntry.includes('function WorkspaceCheckedIcon()'),'former checked top icon must be removed');
assert(!centerEmptyStateEntry.includes('title="VC"'),'visible VC title must be removed');
assert(!centerEmptyStateEntry.includes('description={'),'subtitle must be removed');
assert(!centerEmptyStateEntry.includes('titleIcon='),'title-side icon slot must no longer be used');
assert(centerEmptyStateEntry.includes('id="d5CenterEmptyStateAction"'),'single Open Hatch action button missing');
assert(centerEmptyStateEntry.includes('onClick={() => setHatchOpen(true)}'),'Open Hatch must open the shared Hatch dialog');
assert(centerEmptyStateEntry.includes('function ExpandingButtonGroup'),'ExpandingButtonGroup implementation missing');
assert(centerEmptyStateEntry.includes('data-hashcod-expanding-group="true"'),'ExpandingButtonGroup runtime marker missing');
assert(centerEmptyStateEntry.includes('className="hashcod-empty-state-actions-row"'),'Open Hatch and ExpandingButtonGroup row missing');
assert(centerEmptyStateEntry.includes('domId: "d5ExpandingAction1"'),'ExpandingButtonGroup first placeholder slot missing');
assert(centerEmptyStateEntry.includes('domId: "d5ExpandingAction2"'),'ExpandingButtonGroup second placeholder slot missing');
assert(centerEmptyStateEntry.includes('domId: "d5ExpandingAction3"'),'ExpandingButtonGroup third placeholder slot missing');
assert(centerEmptyStateEntryCss.includes('.hashcod-expanding-button-group'),'ExpandingButtonGroup CSS missing');
assert(centerEmptyStateEntry.includes('const FILE_VAULT_DB_NAME = "hashcod_file_vault_v1"'),'File vault IndexedDB namespace missing');
assert(centerEmptyStateEntry.includes('id="d5FileVaultTrigger"'),'File vault trigger missing');
assert(centerEmptyStateEntry.includes('id="d5FileVaultDropzone"'),'File vault dropzone missing');
assert(centerEmptyStateEntry.includes('type="file"'),'File vault must use a real browser file input');
assert(centerEmptyStateEntry.includes('multiple'),'File vault must allow multiple files');
assert(centerEmptyStateEntry.includes('XMLHttpRequest'),'File vault must report real upload progress');
assert(centerEmptyStateEntry.includes('FILE_VAULT_ENDPOINT = "/api/hashcod-file-vault"'),'File vault backend endpoint missing');
assert(centerEmptyStateEntryCss.includes('.hashcod-file-vault-trigger'),'File vault trigger CSS missing');
assert(centerEmptyStateEntryCss.includes('.hfv-dropzone'),'File vault dropzone CSS missing');
assert(centerEmptyStateEntry.includes('createPortal'),'Hatch dialog must portal to body for viewport blur');
assert(centerEmptyStateEntry.includes('id="d5HatchBackdrop"'),'shared Hatch blur backdrop missing');
assert(centerEmptyStateEntry.includes('id="d5HatchCodeEditor"'),'shared Hatch editor dialog missing');
assert(centerEmptyStateEntry.includes('filename="my-component.tsx"'),'React pane filename missing');
assert(centerEmptyStateEntry.includes('filename="Main.java"'),'Java pane filename missing');
assert(centerEmptyStateEntry.includes('filename="script.js"'),'JavaScript pane filename missing');
assert(centerEmptyStateEntry.includes('filename="styles.css"'),'CSS pane filename missing');
assert(centerEmptyStateEntry.includes('filename="index.html"'),'HTML pane filename missing');
assert(centerEmptyStateEntry.includes('filename="main.py"'),'Python pane filename missing');
assert(centerEmptyStateEntry.includes('inputId="d5HatchCodeInput"'),'React textarea id must remain stable');
assert(centerEmptyStateEntry.includes('inputId="d5JavaHatchCodeInput"'),'Java textarea id missing');
assert(centerEmptyStateEntry.includes('inputId="d5JavaScriptHatchCodeInput"'),'JavaScript textarea id missing');
assert(centerEmptyStateEntry.includes('inputId="d5CssHatchCodeInput"'),'CSS textarea id missing');
assert(centerEmptyStateEntry.includes('inputId="d5HtmlHatchCodeInput"'),'HTML textarea id missing');
assert(centerEmptyStateEntry.includes('inputId="d5PythonHatchCodeInput"'),'Python textarea id missing');
assert(centerEmptyStateEntry.includes('previewButtonId="d5HtmlHatchPreview"'),'HTML preview button id missing');
assert(centerEmptyStateEntry.includes('previewFrameId="d5HtmlHatchPreviewFrame"'),'HTML preview frame id missing');
assert(centerEmptyStateEntry.includes('srcDoc={previewSource ?? code}'),'HTML preview must render the composed preview source');
assert(centerEmptyStateEntry.includes('function CssHtmlLinkIcon()'),'CSS to HTML link icon component missing');
assert(centerEmptyStateEntry.includes('function PythonIcon()'),'Python icon component missing');
assert(centerEmptyStateEntry.includes('function PythonRunIcon()'),'Python run icon component missing');
assert(centerEmptyStateEntry.includes('viewBox="0 0 30 30"'),'Python run icon must preserve supplied 30x30 viewBox');
assert(centerEmptyStateEntry.includes('M 5 4 C 3.895 4 3 4.895 3 6'),'supplied Python terminal icon path missing');
assert(centerEmptyStateEntry.includes('fill="#0277BD"'),'Python icon blue path missing');
assert(centerEmptyStateEntry.includes('fill="#FFC107"'),'Python icon yellow path missing');
assert(centerEmptyStateEntry.includes('M24.047,5c-1.555,0.005'),'supplied Python blue path missing');
assert(centerEmptyStateEntry.includes('M23.078,43c1.555-0.005'),'supplied Python yellow path missing');
assert(centerEmptyStateEntry.includes('viewBox="0 0 24 24"'),'CSS to HTML link icon viewBox missing');
assert(centerEmptyStateEntry.includes('M 19 3 C 17.35499 3 16 4.3549904 16 6'),'supplied CSS to HTML link icon path missing');
assert(centerEmptyStateEntry.includes('id="d5CssHtmlLink"'),'CSS to HTML link button id missing');
assert(centerEmptyStateEntry.includes('CSS_HTML_LINK_STORAGE_KEY'),'CSS to HTML link persistence key missing');
assert(centerEmptyStateEntry.includes('function attachCssToHtml(html, css)'),'CSS to HTML preview composition helper missing');
assert(centerEmptyStateEntry.includes('data-hashcod-hatch-css'),'linked CSS style marker missing');
assert(centerEmptyStateEntry.includes('sandbox="allow-scripts"'),'HTML preview must be isolated in a sandboxed iframe');
assert(centerEmptyStateEntry.includes('public class Main'),'Java default source missing');
assert(centerEmptyStateEntry.includes('JAVA_HATCH_STORAGE_KEY'),'Java storage key missing');
assert(centerEmptyStateEntry.includes('JAVASCRIPT_HATCH_STORAGE_KEY'),'JavaScript storage key missing');
assert(centerEmptyStateEntry.includes('CSS_HATCH_STORAGE_KEY'),'CSS storage key missing');
assert(centerEmptyStateEntry.includes('function tokenizeCss(code)'),'CSS tokenizer missing');
assert(centerEmptyStateEntry.includes('HTML_HATCH_STORAGE_KEY'),'HTML storage key missing');
assert(centerEmptyStateEntry.includes('PYTHON_HATCH_STORAGE_KEY'),'Python storage key missing');
assert(centerEmptyStateEntry.includes('id="d5PythonRun"'),'Python run button id missing');
assert(centerEmptyStateEntry.includes('id="d5PythonTerminal"'),'Python terminal view missing');
assert(centerEmptyStateEntry.includes('id="d5PythonTerminalOutput"'),'Python terminal output missing');
assert(centerEmptyStateEntry.includes('id="d5PythonTerminalBack"'),'Python terminal back button missing');
assert(centerEmptyStateEntry.includes('PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/"'),'pinned Pyodide runtime missing');
assert(centerEmptyStateEntry.includes('new Worker(blobUrl)'),'Python runner must execute in a Web Worker');
assert(centerEmptyStateEntry.includes('importScripts(indexURL + "pyodide.js")'),'Python worker must load Pyodide');
assert(centerEmptyStateEntry.includes('pyodide.runPythonAsync(code)'),'Python worker execution missing');
assert(centerEmptyStateEntry.includes('PYTHON_RUN_TIMEOUT_MS = 10000'),'Python execution timeout missing');
assert(centerEmptyStateEntry.includes('function tokenizePython(code)'),'Python tokenizer missing');
assert(centerEmptyStateEntry.includes('navigator.clipboard.writeText(code)'),'Hatch copy behavior missing');
assert(centerEmptyStateEntry.includes('window.localStorage.setItem(storageKey, next)'),'independent Hatch persistence missing');
assert(centerEmptyStateEntry.includes('event.key !== "Tab"'),'Hatch Tab indentation behavior missing');
assert(centerEmptyStateEntryCss.includes('width: 864px'),'shared Hatch must widen to contain both editors');
assert(centerEmptyStateEntry.includes('id="d5HatchCodeGrid"'),'scrollable Hatch grid wrapper missing');
assert(centerEmptyStateEntryCss.includes('.hatch-code-grid-scroll'),'scrollable Hatch grid styling missing');
assert(centerEmptyStateEntryCss.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)'),'Hatch must retain two columns');
assert(centerEmptyStateEntryCss.includes('grid-auto-rows: 372px'),'all Hatch blocks must keep the same 372px height');
assert(centerEmptyStateEntryCss.includes('overflow-y: auto'),'Hatch must provide a vertical side scrollbar');
assert(centerEmptyStateEntryCss.includes('scrollbar-gutter: stable'),'Hatch scrollbar space must remain stable');
assert(centerEmptyStateEntryCss.includes('.hatch-code-grid-scroll::-webkit-scrollbar'),'visible Hatch scrollbar styling missing');
assert(centerEmptyStateEntryCss.includes('.hatch-code-pane[data-code-pane="javascript"]'),'JavaScript pane layout missing');
assert(centerEmptyStateEntryCss.includes('.hatch-code-pane[data-code-pane="css"]'),'CSS pane layout missing');
assert(centerEmptyStateEntryCss.includes('grid-row: 3'),'CSS must sit below JavaScript without shrinking');
assert(centerEmptyStateEntryCss.includes('.hatch-code-pane[data-code-pane="java"]'),'Java pane layout missing');
assert(centerEmptyStateEntryCss.includes('.hatch-code-pane[data-code-pane="html"]'),'HTML pane layout missing');
assert(centerEmptyStateEntryCss.includes('.hatch-code-pane[data-code-pane="python"]'),'Python pane layout missing');
assert(centerEmptyStateEntryCss.includes('.hatch-code-python-icon'),'Python icon sizing missing');
assert(centerEmptyStateEntryCss.includes('.hatch-code-python-run'),'Python run button styling missing');
assert(centerEmptyStateEntryCss.includes('.hatch-python-terminal'),'Python terminal styling missing');
assert(centerEmptyStateEntryCss.includes('height: min(744px, calc(100dvh - 112px))'),'shared Hatch viewport height must stay responsive');
assert(centerEmptyStateEntryCss.includes('backdrop-filter: blur(24px)'),'Hatch backdrop blur missing');
assert(centerEmptyStateEntryCss.includes('.hatch-code-link-toggle'),'CSS to HTML link button styling missing');
assert(centerEmptyStateEntryCss.includes('.hatch-code-preview-toggle'),'HTML preview button styling missing');
assert(centerEmptyStateEntryCss.includes('.hatch-html-preview-frame'),'HTML preview frame styling missing');
assert(!centerEmptyStateEntry.includes('hashcod:first-screen-branched-menu-select'),'Hatch must not reuse the Workspace destination');
assert(centerEmptyState.includes('(title || description)'),'EmptyState must omit copy markup when no title or description is provided');
assert(centerEmptyStateEntryCss.includes('left: 50%')&&centerEmptyStateEntryCss.includes('transform: translate(-50%, -50%)'),'center EmptyState must be horizontally centered');
assert(centerEmptyStateCss.includes('.center-empty-state-glyph svg'),'center icon sizing missing');
assert(centerEmptyStateCss.includes('width: 30px')&&centerEmptyStateCss.includes('height: 30px'),'retained icon must keep its adapted 30px visual size');
assert.equal(centerEmptyStatePkg.dependencies.motion,'^12.40.0','center EmptyState motion dependency changed');
assert.equal(centerEmptyStatePkg.dependencies.react,'19.2.4','center EmptyState React dependency changed');

// Exact supplied component/runtime contract.
assert(component.includes("import { HugeiconsIcon } from '@hugeicons/react'"),'Hugeicons renderer missing');
assert(component.includes("import './BranchedMenu.css'"),'component CSS import missing');
assert(component.includes('ResizeObserver'),'BranchedMenu marker resize behavior missing');
assert(component.includes('strokeDashoffset'),'BranchedMenu branch animation missing');
for(const selector of [
  '.branched-menu::before',
  '.branched-menu__marker[data-on]',
  '.branched-menu__section[data-open] .branched-menu__body',
  '.branched-menu__reach',
  '.branched-menu__item[data-active]'
]){
  assert(componentCss.includes(selector),`component CSS missing ${selector}`);
}
assert(componentCss.includes('fill: none'),'SVG branches must remain unfilled');
assert(componentCss.includes('stroke-width: var(--bm-line-w)'),'SVG stroke width binding missing');

for(const token of [
  "label: 'Getting started'",
  "{ value: 'faq', label: 'FAQ', icon: FaqIcon }",
  "{ value: 'quick', label: 'Quick start', icon: Rocket01Icon }",
  "{ value: 'config', label: 'Configuration', icon: Settings02Icon }",
  "label: 'Components'",
  "{ value: 'buttons', label: 'Buttons' }",
  "{ value: 'overlays', label: 'Overlays' }",
  'defaultOpen={[0]}',
  'defaultActive="quick"',
  'color="#0a0a0a"',
  'accentColor="#0a0a0a"',
  'lineColor="#0a0a0a"',
  'width={240}',
  'rowHeight={36}',
  'indent={40}',
  'trunk={14}',
  'radius={10}',
  'lineWidth={1.5}',
  'fontSize={14}',
  'drawDuration={400}',
  'foldDuration={300}'
]){
  assert(entry.includes(token),`requested BranchedMenu usage missing: ${token}`);
}
assert(entry.includes("document.getElementById('d5FirstBranchedMenuMount')"),'entry must mount into first-screen host');
assert(entry.includes('function CalendarExample()'),'functional calendar component missing below menu');
assert(entry.includes('id="d5FirstScreenCalendar"'),'calendar root missing');
assert(entry.includes('data-calendar-accent="black"'),'calendar black accent marker missing');
assert(entry.includes('className="v-calendar__day-face"'),'calendar selected-day visual face missing');
assert(css.includes('.v-calendar__day[data-selected="true"] .v-calendar__day-face'),'calendar selected date must enforce the black face in the CSP-safe host stylesheet');
assert(css.includes('background:#0a0a0a!important'),'calendar black selected-day face override missing');
assert(entry.includes('CALENDAR_UNAVAILABLE = new Date(2026, 8, 20)'),'20 September unavailable rule missing');
assert(entry.includes("new Date(2026, 8, 12)"),'calendar default selection must remain 12 September');
assert(entry.includes('Clear selection'),'calendar clear action missing');
assert(entry.includes('<CalendarExample />'),'calendar must render below BranchedMenu');
assert(gate.includes('id="d5PreviewPolicyFooter"'),'final Preview Link Card footer missing');
assert(gate.includes('id="d5PreviewPolicyMount"'),'Preview Link Card React mount missing');
assert(gate.includes('data-hashcod-component="PreviewLinkCard"'),'Preview Link Card component marker missing');
assert(entry.includes('function PreviewPolicyFooter()'),'Preview Link Card footer component missing');
assert(entry.includes('Before continuing, please read the'),'Preview Link Card lead text missing');
assert(entry.includes('Use and Privacy Policy'),'Preview Link Card linked text missing');
assert(entry.includes('href="/privacy"'),'Preview Link Card must point to the existing privacy route');
assert(entry.includes('Documento de Aceptación Contractual, Privacidad y Evidencia de Registro'),'Preview card must mirror the repository privacy document title');
assert(entry.includes('2026.09.18-2'),'Preview card must mirror the repository contract version');
assert(entry.includes('18 de septiembre de 2026'),'Preview card must mirror the repository contract effective date');
assert(componentCss.includes('position: fixed'),'Preview Link Card footer must stay centered at the final viewport edge');
assert(componentCss.includes('left: 50%'),'Preview Link Card footer center anchor missing');
assert(componentCss.includes('transform: translateX(-50%)'),'Preview Link Card footer centering transform missing');
assert(entry.includes('target="_blank"'),'Preview Link Card must open the legal document in a new tab');
assert(entry.includes("window.HashcodPreviewPolicyLinkCard = Object.freeze"),'Preview Link Card runtime marker missing');
assert(componentCss.includes('.preview-link-card__content[data-open="true"]'),'Preview Link Card hover/focus open styling missing');
assert(componentCss.includes('.v-calendar-example'),'calendar styling missing from BranchedMenu bundle');
assert(componentCss.includes('.v-calendar__day[data-selected="true"]'),'calendar selected-day styling missing');
assert(entry.includes("url.hash = value"),'onSelect navigate behavior missing');
assert(entry.includes('const WorkspaceIcon = ('),'Workspace SVG icon component missing');
assert(entry.includes('viewBox="0 0 24 24"'),'Workspace SVG viewBox changed');
assert(entry.includes("{ value: 'workspace', label: 'Workspace', icon: WorkspaceIcon }"),'Workspace menu item missing');
assert(entry.includes('const TextCardIcon = ('),'Text Card SVG icon component missing');
assert(entry.includes('viewBox="0 0 64 64"'),'Text Card SVG viewBox changed');
assert(entry.includes("{ value: 'text-card', label: 'Text Card', icon: TextCardIcon }"),'Text Card menu item missing');
assert(gate.includes('id="d5WorkspaceModalBackdrop"'),'Workspace modal backdrop missing');
assert(gate.includes('id="d5TextEditorCard" class="liquid-text-editor" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Workspace" hidden'),'Workspace editor must be natively hidden by default');
assert(gate.includes('id="d5WorkspaceClose"'),'Workspace close control missing');
assert(css.includes('.workspace-modal-backdrop{'),'Workspace modal backdrop CSS missing');
assert(css.includes('backdrop-filter:blur(28px)'),'Workspace backdrop must strongly blur the page');
assert(css.includes('body[data-hashcod-entry-intro="1"].workspace-modal-open #d5TextEditorCard'),'Workspace centered modal CSS missing');
assert(css.includes('body.workspace-modal-open > *:not(#d5WorkspaceModalBackdrop):not(#d5TextEditorCard)'),'Workspace must disable interaction with page content behind the veil');
assert(css.includes('background:rgba(255,255,255,.94)'),'Workspace veil must strongly hide background content');
assert(js.includes("if(detail.value==='workspace')"),'Workspace BranchedMenu action missing');
assert(js.includes('openWorkspaceModal();'),'Workspace action must open editor modal');
assert(js.includes('textEditorCard.hidden=false'),'Workspace open must remove native hidden');
assert(js.includes('textEditorCard.hidden=true'),'Workspace close must restore native hidden');
assert(js.includes("workspaceBackdrop.addEventListener('click',closeWorkspaceModal)"),'Workspace backdrop close behavior missing');
assert(gate.includes('id="d5TextCardBackdrop" class="text-card-modal-backdrop" hidden aria-hidden="true"'),'Text Card backdrop missing');
assert(gate.includes('id="d5BeamCardDemo" class="beam-card-demo" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Text Card" hidden'),'Text Card six-card source must be natively hidden');
assert(gate.includes('id="d5TextCardClose"'),'Text Card close control missing');
assert(css.includes('body[data-hashcod-entry-intro="1"] #d5BeamCardDemo[hidden]'),'Text Card hidden guard missing');
assert(css.includes('.text-card-modal-backdrop{'),'Text Card backdrop CSS missing');
assert(css.includes('backdrop-filter:blur(28px)'),'Text Card must strongly blur the page');
assert(css.includes('body[data-hashcod-entry-intro="1"].text-card-modal-open #d5BeamCardDemo'),'Text Card centered modal CSS missing');
assert(js.includes("if(detail.value==='text-card')"),'Text Card menu action missing');
assert(js.includes('openTextCardModal();'),'Text Card menu action must open the six-card modal');
assert(js.includes('textCardDemo.hidden=false'),'Text Card open must remove native hidden');
assert(js.includes('textCardDemo.hidden=true'),'Text Card close must restore native hidden');
assert(js.includes("textCardBackdrop.addEventListener('click',closeTextCardModal)"),'Text Card backdrop close behavior missing');
assert(entry.includes('const FaqIcon = ('),'custom FAQ SVG component missing');
assert(entry.includes('const CardIcon = ('),'custom Card SVG component missing');
assert(entry.includes('viewBox="0 0 16 16"'),'custom Card SVG viewBox changed');
assert(entry.includes("{ value: 'card', label: 'Card', icon: CardIcon }"),'Card menu item missing');
assert(entry.includes("const WorkspaceIcon = ("),'Workspace custom SVG component missing');
assert(entry.includes('viewBox="0 0 24 24"'),'Workspace SVG viewBox changed');
assert(entry.includes('M 3 3 C 2.447 3 2 3.448 2 4 L 2 15'),'Workspace SVG path must match the supplied icon');
assert(entry.includes("{ value: 'workspace', label: 'Workspace', icon: WorkspaceIcon }"),'Workspace menu item missing');
assert(entry.indexOf("{ value: 'card', label: 'Card', icon: CardIcon }") < entry.indexOf("{ value: 'workspace', label: 'Workspace', icon: WorkspaceIcon }"),'Workspace must come immediately after Card');

assert(entry.includes('viewBox="0 0 48 48"'),'custom FAQ SVG viewBox changed');
assert(entry.includes('width="16"')&&entry.includes('height="16"'),'custom FAQ SVG must be adapted to 16x16');
assert(entry.includes('fill="currentColor"'),'custom FAQ SVG must inherit menu ink');
assert(!entry.includes("label: 'Installation'"),'Installation label must be removed');
assert.equal(pkg.dependencies['@hugeicons/react'],'1.1.9','@hugeicons/react dependency changed');
assert.equal(pkg.dependencies['@hugeicons/core-free-icons'],'4.3.5','Hugeicons icon package changed');
assert.equal(pkg.dependencies.react,'19.2.4','React dependency changed');

// Existing RotatingText stays; the smoke cursor is fully replaced by the global Animate UI cursor.
assert(gate.includes('id="d5RotatingTextHero"'),'RotatingText host missing');
assert(rotatingCss.includes('background:#0a0a0a')&&rotatingCss.includes('color:#fff'),'RotatingText black treatment missing');
assert(rotatingJs.includes('window.HashcodRotatingText'),'RotatingText controller missing');
assert(!gate.includes('d5SplashCursorBackground'),'retired smoke cursor host must be removed');
assert(!gate.includes('d5SplashCursorCanvas'),'retired smoke cursor canvas must be removed');
assert(!gate.includes('react-bits-splash-cursor'),'retired SplashCursor assets must not load');
assert(gate.includes('components/animate-ui-global-cursor.css?v=20261004-animate-cursor-book1'),'Animate UI cursor CSS must load');
assert(gate.includes('components/animate-ui-global-cursor.js?v=20261004-animate-cursor-book1'),'Animate UI cursor JS must load');
assert(animateCursorCss.includes('html.hashcod-animate-cursor-active body *'),'global native cursor suppression missing');
assert(animateCursorCss.includes('cursor: none !important'),'native desktop cursor must be hidden');
assert(animateCursorCss.includes('.hashcod-animate-cursor-follow'),'CursorFollow styling missing');
assert(!animateCursorJs.includes("follow.textContent='Designer'"),'Designer text must stay removed from CursorFollow');
assert(animateCursorJs.includes("book-cursor-follow.svg"),'Book CursorFollow asset reference missing');
assert(animateCursorJs.includes("followIcon:'book'"),'Book CursorFollow runtime marker missing');
assert(bookCursorFollow.includes('viewBox="0 0 48 48"'),'Book CursorFollow icon must preserve the supplied 48x48 viewBox');
assert(bookCursorFollow.includes('C2S2eDxyfbI_1zbYOU0Kxa_Fqihn9MGe0kQ_gr1'),'Book CursorFollow main gradient missing');
assert(bookCursorFollow.includes('stop-color="#d32f2f"')&&bookCursorFollow.includes('stop-color="#b71c1c"'),'Book CursorFollow red cover gradient missing');
assert(animateCursorCss.includes('.hashcod-animate-cursor-follow img'),'Book CursorFollow image sizing missing');
assert(animateCursorCss.includes('width: 30px')&&animateCursorCss.includes('height: 30px'),'Book CursorFollow icon must render at 30px');
assert(animateCursorJs.includes('M1.8 4.4 7 36.2'),'official Animate UI cursor arrow path missing');
assert(animateCursorCss.includes('width: 24px')&&animateCursorCss.includes('height: 24px'),'official Animate UI cursor size missing');
assert(animateCursorJs.includes('var SIDE_OFFSET=15'),'CursorFollow sideOffset must remain 15');
assert(animateCursorJs.includes('var ALIGN_OFFSET=5'),'CursorFollow alignOffset must remain 5');
assert(animateCursorJs.includes("side:'bottom'"),'CursorFollow side must remain bottom');
assert(animateCursorJs.includes("align:'end'"),'CursorFollow align must remain end');
assert(animateCursorJs.includes('var SPRING_STIFFNESS=500'),'Animate UI cursor spring stiffness changed');
assert(animateCursorJs.includes('var SPRING_DAMPING=50'),'Animate UI cursor spring damping changed');
assert(animateCursorJs.includes("window.addEventListener('pointermove',onPointerMove"),'global cursor pointer tracking missing');
assert(animateCursorJs.includes('window.HashcodAnimateCursor=Object.freeze'),'global cursor controller marker missing');


// FAQ must escape the page layout and cover the entire viewport.
assert(gate.includes('components/mldsa-access-gate.css?v=20261004-mesh-fallback1'),'FAQ modal CSS cache-bust missing');
assert(gate.includes('components/mldsa-access-gate.js?v=20261004-preview-policy5'),'FAQ modal JS cache-bust missing');
assert(gate.includes('id="d5FaqModalBackdrop"'),'FAQ modal backdrop markup missing');
assert(gate.includes('id="d5FaqCard"'),'FAQ modal card markup missing');
assert(js.includes('function ensureFaqModalPortal()'),'FAQ body portal helper missing');
assert(js.includes('document.body.appendChild(faqBackdrop)'),'FAQ backdrop must move directly under body');
assert(js.includes('document.body.appendChild(faqCard)'),'FAQ card must move directly under body');
assert(css.includes('z-index:2147483646'),'FAQ backdrop must sit above all normal page UI');
assert(css.includes('z-index:2147483647'),'FAQ card must sit above the backdrop');
assert(css.includes('background:rgba(255,255,255,.88)'),'FAQ backdrop must heavily veil the page behind it');
assert(css.includes('backdrop-filter:blur(24px)'),'FAQ backdrop blur must be strong enough to hide background detail');
assert(css.includes('width:100vw')&&css.includes('height:100dvh'),'FAQ backdrop must cover the entire viewport');
assert(gate.includes('id="d5ToolDeck" class="tool-deck" data-card-source="true" hidden aria-hidden="true"'),'original card deck must be natively hidden and source-only');
assert(css.includes('body[data-hashcod-entry-intro="1"] #d5ToolDeck'),'first-screen source deck hide rule missing');
assert(css.includes('display:none!important'),'source card deck must stay visually hidden before Card is selected');
assert(gate.includes('id="d5CardModalShell" class="card-modal-shell" hidden'),'Card modal shell must be natively hidden before menu selection');
assert(js.includes("if(detail.value==='card')"),'Card menu action missing');
assert(js.includes('openCardModal();'),'Card menu action must open the modal');
assert(js.includes('cardModalShell.hidden=false'),'Card modal must remove hidden only when opening');
assert(js.includes('cardModalShell.hidden=true'),'Card modal must restore hidden when closing');


// Later screens remain retired.
assert(!gate.includes('data-entry-panel="2"'),'second entry panel must remain removed');
assert(!gate.includes('data-entry-panel="3"'),'third entry panel must remain removed');
assert(!gate.includes('data-entry-panel="4"'),'fourth entry panel must remain removed');
assert(!js.includes('entrySetLevel(2);'),'runtime must not advance to a retired screen');
assert(!js.includes("url.searchParams.set('hashcod_enter','1')"),'retired platform transition must stay removed');


assert(gate.includes('id="d5DocumentsHubBackdrop"'),'Documents hub backdrop missing');
assert(gate.includes('id="d5DocumentsHubShell"'),'Documents hub shell missing');
assert(gate.includes('id="d5DocumentsHubContent"'),'Documents hub content missing');
assert(css.includes('.documents-hub-backdrop{'),'Documents hub CSS missing');
assert(css.includes('backdrop-filter:blur(24px)'),'Documents hub blur missing');
assert(css.includes('body[data-hashcod-entry-intro="1"] #d5NumberTickerDemo'),'NumberTicker must be hidden until Documents opens');
assert(js.includes("if(detail.value==='documents')"),'Documents BranchedMenu selection handler missing');
assert(js.includes('function openDocumentsHub()'),'Documents open runtime missing');
assert(js.includes('function closeDocumentsHub()'),'Documents close runtime missing');
assert(js.includes("document.getElementById('d5ScratchCardDemo')"),'Documents must reuse the real ScratchCard');

console.log('✓ First screen uses FAQ, Card, Workspace, Text Card and Documents modal actions');
