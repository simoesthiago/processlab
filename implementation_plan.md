# Implementation Plan

This file tracks what remains to be built in ProcessLab. Update the status of each task as work progresses.

**Status legend:** `[ ]` to do · `[~]` in progress · `[x]` done

---

## Dependency Graph

```
Task 1.1 (API Key UI)
    └──> Task 1.2 (Chat UI)
              └──> Task 1.3 (File Upload in Wizard)
    └──> Task 2.2 (LLM Backend)

Task 1.4 — independent
Task 2.1 — independent
Task 2.3 — independent
Tasks 3.x — all independent, can run in parallel
```

---

## Phase 1 — MVP (product works end-to-end)

### [x] Task 1.1 — BYOK: OpenAI API Key UI
**Complexity: M** | Prerequisite for all AI-related work

The user enters their OpenAI API Key in Settings. It lives only in React state — never persisted to `localStorage`. It is sent on every Wizard request as the `X-OpenAI-API-Key` HTTP header.

**Files to change:**
- `apps/web/src/shared/components/SettingsModal.tsx` — add "AI" tab with `<Input type="password">` for the key; add `onApiKeyChange?: (key: string) => void` prop
- `apps/web/src/features/bpmn/StudioContent.tsx` — add `const [openAiKey, setOpenAiKey] = useState('')`; thread to `<ProcessWizard openAiKey>` and `<SettingsModal onApiKeyChange>`
- `apps/web/src/features/processwizard/ProcessWizard.tsx` — accept `openAiKey?: string` prop; add `'X-OpenAI-API-Key': openAiKey` header in `handleSubmit` when key is non-empty
- `apps/web/src/shared/components/layout/StudioNavbar.tsx` — add `onSettingsClick?` prop; wire to a gear icon in the right section of the navbar

**Security rules:**
- Key stays in React state only — never in `localStorage` or sent in the request body
- Backend reads it via `Header(None, alias="X-OpenAI-API-Key")` (already redacted from logs by `middleware.py`)

---

### [x] Task 1.2 — Process Wizard: Chat UI
**Complexity: M** | Depends on: 1.1

Replace the static suggestions screen with a real chat interface: message history, user/AI bubbles, typing indicator, auto-scroll.

**Files to change:**
- `apps/web/src/features/processwizard/ProcessWizard.tsx` — full redesign

**Implementation details:**
```
New state:
  messages: Array<{ role: 'user' | 'assistant'; content: string; error?: boolean }>

handleSubmit flow:
  1. Push { role: 'user', content: command } to messages
  2. POST to /api/v1/edit with X-OpenAI-API-Key header
  3. Push { role: 'assistant', content: result/error } to messages

Layout logic:
  - messages.length === 0  →  show empty state (icon + suggestion chips)
  - messages.length  > 0   →  show scrollable bubble list
  - User bubbles:  align-right, bg-primary text-primary-foreground
  - AI bubbles:    align-left,  bg-secondary, prefixed with Wand2 icon
  - Loading state: 3 dots with staggered animate-bounce
  - useRef + scrollIntoView({ behavior: 'smooth' }) on new messages
```

---

### [x] Task 1.3 — Process Wizard: File Upload
**Complexity: M** | Depends on: 1.2

The "+" button in the Wizard opens a file picker and uploads to `/api/v1/ingest/upload`. Result appears as a system message in the chat.

**Files to change:**
- `apps/web/src/features/processwizard/ProcessWizard.tsx` — add upload logic

**Implementation details:**
```typescript
// Hidden file input (browser sets multipart boundary automatically — no Content-Type header)
<input type="file" ref={fileInputRef} multiple
  accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
  onChange={handleFileUpload} className="hidden" />

// "+" button calls fileInputRef.current?.click()

async handleFileUpload(files):
  1. Build FormData with the files
  2. POST /api/v1/ingest/upload  (no Content-Type header)
  3. Show spinner on "+" button while uploading
  4. On success: push system message "Uploaded: filename.pdf ✓"
  5. Store artifact_ids in a ref for future use in /api/v1/generate
```

---

### [x] Task 1.4 — Fix and Verify Export (PNG, PDF, XML, JSON)
**Complexity: S** | Independent

Export logic already exists in `StudioContent.tsx` (lines 461–678) and is fully client-side (Canvas API + jsPDF). The main risk is that `getSvg()` may be missing from `BpmnEditorRef`.

**Files to check/change:**
- `apps/web/src/features/bpmn/editor/BpmnEditor.tsx` — confirm `getSvg()` is implemented in `useImperativeHandle`; if missing, add using `modeler.saveSVG()`
- `apps/web/src/features/bpmn/StudioContent.tsx` — smoke-test the full export flow for each format

**Notes:**
- The backend `apps/api/app/api/v1/endpoints/export.py` is **not used** — export is 100% client-side
- If SVG has cross-origin issues, add a `foreignObject` workaround in the canvas conversion step

---

## Phase 2 — High Priority Features

### [x] Task 2.1 — SaveVersionModal: Real Form
**Complexity: S** | Independent

The current modal (`apps/web/src/features/versioning/SaveVersionModal.tsx`) is 46 lines and hardcodes `'Manual save'` / `'minor'`. Replace with a proper form.

**Files to change:**
- `apps/web/src/features/versioning/SaveVersionModal.tsx` — rewrite (~120 lines)
- `apps/web/src/features/bpmn/StudioContent.tsx` — pass `currentVersionNumber={versions[0]?.version_number}`

**New fields:**
```
- <Textarea>  commit message  (placeholder "Describe your changes...")
- Segmented control: Major | Minor | Patch  (with semver tooltip)
- Badge preview: "This will create version X.Y.Z"
```
Use shadcn `<Dialog>` for consistency. Compute the next version number from `currentVersionNumber`.

---

### [ ] Task 2.2 — LLM-Based Edit Commands (Backend)
**Complexity: L** | Depends on: 1.1

Replace the regex `CommandInterpreter` in `edit.py` with a real GPT call. Keep regex as fallback when no API key is provided.

**Files to change:**
- `apps/api/app/api/v1/endpoints/edit.py` — add `x_openai_api_key: Optional[str] = Header(None, alias="X-OpenAI-API-Key")`; branch: if key present → `LlmCommandInterpreter`, else → existing `CommandInterpreter`
- `apps/api/app/infrastructure/services/ai/llm_interpreter.py` — **new file**

**`LlmCommandInterpreter` skeleton:**
```python
class LlmCommandInterpreter:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)

    def interpret(self, command: str, elements: list[dict]) -> dict:
        # System prompt instructs model to return only JSON
        # Pass current element names + IDs as context
        # Strip markdown code fences before JSON parse
        # Extract JSON with: re.search(r'\{.*\}', response, re.DOTALL)
```

**Error mapping:**
- `openai.AuthenticationError` → HTTP 401
- `openai.RateLimitError` → HTTP 429
- timeout → HTTP 503

**System prompt structure:**
```
You are a BPMN editor. Respond ONLY with JSON.
Ops: add_node(type,name,x,y), connect(sourceId,targetId), remove(id), rename(id,name)
Current elements: [{id, name, type}, ...]
```

---

### [ ] Task 2.3 — Auto-Layout with ELK.js
**Complexity: M** | Independent

Add an "Auto Layout" button that reorganises the diagram automatically using ELK.

**Files to change:**
- `apps/web/src/features/bpmn/editor/BpmnEditor.tsx` — add `autoLayout(): Promise<void>` to `BpmnEditorRef` interface and `useImperativeHandle`
- `apps/web/src/shared/components/layout/FormatToolbar.tsx` — add "Auto Layout" button with `LayoutGrid` icon

**Pre-implementation check:**
```bash
grep -i elk apps/web/package.json
# If elkjs is present → use it directly
# If absent → pnpm add bpmn-js-auto-layout --filter web
```
The backend `apps/api/app/infrastructure/services/bpmn/layout.py` stub stays as-is — layout is 100% client-side.

---

## Phase 3 — Design & UX Polish

### [ ] Task 3.1 — Format Toolbar: Show Only When Element Is Selected
**Complexity: S** | Independent

**File:** `apps/web/src/shared/components/layout/FormatToolbar.tsx`

Line 95 has `const hasSelection = true` (hardcoded). Change to `const hasSelection = effectiveSelection.length > 0`. When nothing is selected, show `"Select an element to format"` in the toolbar center and add `opacity-50 cursor-not-allowed` to all formatting buttons.

---

### [ ] Task 3.2 — Canvas Empty State
**Complexity: S** | Independent

**File:** `apps/web/src/features/bpmn/StudioContent.tsx`

When the canvas has no BPMN elements, render an absolutely-positioned `pointer-events-none` overlay (centred) with a `Wand2` icon and the text:
> "Drag elements from the palette or use the Process Wizard to get started"

---

### [ ] Task 3.3 — Folder & Process Cards: Add Metadata
**Complexity: S** | Independent

**Files to change:**
- `apps/web/src/shared/components/FileCard.tsx` — add `createdAt?: string` and `itemCount?: number` props; render `Calendar` icon + formatted date and a count badge
- `apps/web/src/features/spaces/components/ViewModes.tsx` — pass `createdAt={item.created_at}` and `itemCount`
- `apps/web/src/contexts/SpacesContext.tsx` — verify/add `created_at` field to `SpaceProcess` and `SpaceFolder` types

---

### [x] Task 3.4 — Fix Truncated Save Button in Navbar
**Complexity: S** | Independent

**File:** `apps/web/src/shared/components/layout/StudioNavbar.tsx`

Add `shrink-0 whitespace-nowrap` to the Save and Export buttons to prevent them from shrinking in narrow viewports.

---

### [ ] Task 3.5 — Landing Page: Remove Pink Border + Add Features Section
**Complexity: S** | Independent

**Files to change:**
- `apps/web/src/shared/components/HeroVisualization.tsx` — find and remove the `border`, `ring`, or `outline` CSS causing the pink artifact
- `apps/web/src/app/page.tsx` — remove `flex-1 flex items-center justify-center` from `<main>` so the page scrolls naturally; add a features `<section>` below the hero with 3 cards:
  - **BPMN Editor** — "Professional drag-and-drop editing with bpmn-js"
  - **AI-Powered** — "Use natural language to build and modify processes"
  - **Version Control** — "Full version history with semver-style change tracking"

  Layout: `grid grid-cols-1 md:grid-cols-3 gap-8`, each card `rounded-xl border border-border p-6`

---

## Completed Tasks

- [x] **Task 1.1** — BYOK: OpenAI API Key UI (`SettingsModal` AI tab + `StudioContent` state threading + `ProcessWizard` header)
- [x] **Task 1.2** — Process Wizard: Chat UI (full rewrite with message history, user/AI bubbles, typing indicator, auto-scroll)
- [x] **Task 1.3** — Process Wizard: File Upload (hidden input + `/api/v1/ingest/upload` POST + system message on success)
- [x] **Task 1.4** — Fix and Verify Export (`getSvg()` confirmed in `BpmnEditorRef`; `StudioNavbar` settings gear wired)
- [x] **Task 2.1** — SaveVersionModal: Real Form (shadcn Dialog + commit textarea + Major/Minor/Patch control + version preview badge)
- [x] **Task 3.4** — Fix Truncated Save Button (`shrink-0 whitespace-nowrap` on Save and Export buttons in `StudioNavbar`)
