# Studio & Canvas Improvement Roadmap

This document outlines the phases and sprints for completing the ProcessLab Studio functionalities, specifically focusing on the Navbar, Toolbar, and AI Wizard.

## Phase 1: Studio Navbar Refinement
**Goal:** Ensure navigation, context, and core file operations are 100% functional.

- [ ] **Breadcrumbs**:
    -   *Current*: Shows only "Private Space".
    -   *Fix*: Update logic to show full folder path (e.g., `Private Space > Folder A > Process B`).
- [ ] **Export Check**:
    -   *Task*: Verify `handleExport` implementation.
    -   *Fix*: Ensure SVG/PNG/PDF generation is working robustly with latest `bpmn-js` and `jspdf`.
- [ ] **Save Check**:
    -   *Task*: Verify `handleSave` and `performSave`.
    -   *Fix*: Confirm versioning API is correctly receiving the XML and `changeType`.

## Phase 2: Format Toolbar Deep Fixes
**Goal:** Make visual formatting fully functional for selected elements.

- [ ] **Text Formatting Bug**:
    -   *Issue*: Bold, Italic, and Text Color are not applying to the text within elements, only fill color works.
    -   *Fix*: Investigate `bpmn-js` modeling API capability for text styles. Implement a robust way to update `di:BPMNLabelStyle` or use `bpmn-js` extensions if standard DI is insufficient. Ensure the `applyFormatting` function correctly targets labels.

## Phase 3: Process Wizard (AI Chat)
**Goal:** Transform the raw Wizard into a conversational AI assistant.

- [ ] **Chat Interface**:
    -   *Ref*: [bpmn-assistant](https://github.com/jtlicardo/bpmn-assistant)
    -   *Features*:
        -   Chat bubble UI (User vs AI).
        -   Streaming responses.
        -   Context awareness (current process XML).
        -   Actions: "Create process", "Modify this task", "Explain this flow".
- [ ] **Integration**:
    -   Connect to LLM backend (FastAPI proxy to OpenAI/Claude).

## Future / Backlog
-   Simulation (Token replay).
-   Collaboration (Real-time).
