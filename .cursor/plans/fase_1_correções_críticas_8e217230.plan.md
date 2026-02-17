---
name: Fase 1 Correções Críticas
overview: "Implementar correções críticas da Fase 1: remover botão filter não funcional, melhorar breadcrumb no StudioNavbar, verificar e corrigir export/save, e corrigir bug crítico de formatação de texto no FormatToolbar."
todos:
  - id: remove-filter-button
    content: Remover botão Filter não funcional do SpaceToolbar
    status: pending
  - id: fix-text-formatting
    content: Corrigir bug crítico de formatação de texto no FormatToolbar - verificar applyFormatting, CustomRenderer e persistência de estilos
    status: pending
  - id: verify-export
    content: Verificar e corrigir export de PDF/PNG - testar com diferentes tamanhos e verificar dependências
    status: pending
  - id: verify-save
    content: Verificar e corrigir funcionalidade de Save - testar salvamento de versões e verificar API
    status: completed
  - id: improve-breadcrumb
    content: Melhorar breadcrumb no StudioNavbar - garantir atualização correta e suporte a folders aninhados profundos
    status: pending
---

# Fase 1: Correções Críticas

Este plano implementa as correções críticas identificadas no roadmap para estabilizar funcionalidades básicas do ProcessLab.

## Tarefas

### 1. Remover Botão Filter das Páginas de Spaces e Folders

**Arquivo:** [apps/web/src/features/spaces/components/SpaceToolbar.tsx](apps/web/src/features/spaces/components/SpaceToolbar.tsx)

**Problema:** O botão Filter (linhas 65-70) não tem funcionalidade implementada e deve ser removido conforme roadmap.

**Ação:**

- Remover o botão Filter e seu import do componente SpaceToolbar
- O botão está entre ViewToggle e o botão New

### 2. Melhorias no Breadcrumb do StudioNavbar

**Arquivo:** [apps/web/src/shared/components/layout/StudioNavbar.tsx](apps/web/src/shared/components/layout/StudioNavbar.tsx)

**Problema:** Breadcrumb pode não estar sempre atualizado quando navega entre processos e pode não funcionar corretamente para processos em folders aninhados profundos.

**Ações:**

- Verificar se o useEffect que carrega folderPath (linhas 99-164) está reagindo corretamente a mudanças
- Garantir que breadcrumb atualiza quando process.folder_id muda
- Testar com folders aninhados profundos (3+ níveis)
- Verificar se truncation logic (linhas 258-271) funciona corretamente
- Adicionar logs de debug se necessário para identificar problemas

### 3. Verificação e Correção de Export/Save

**Arquivos:**

- [apps/web/src/features/bpmn/StudioContent.tsx](apps/web/src/features/bpmn/StudioContent.tsx)
- [apps/web/src/shared/components/ExportModal.tsx](apps/web/src/shared/components/ExportModal.tsx)

**Problema:** Export de PDF/PNG e Save podem não estar funcionando corretamente.

**Ações para Export:**

- Verificar se `performExport` (linhas 393-610) está gerando PDF/PNG corretamente
- Testar export de SVG, PNG e PDF com diferentes tamanhos de diagrama
- Verificar se há erros no console durante export
- Garantir que `getSvg()` do editor retorna SVG válido
- Verificar dependências (jsPDF) estão instaladas e funcionando

**Ações para Save:**

- Verificar se `performSave` (linhas 331-379) está enviando XML e changeType corretamente
- Testar salvamento de versões (major, minor, patch)
- Verificar se API de versioning está recebendo dados corretos
- Adicionar tratamento de erros mais robusto
- Verificar se toast notifications estão aparecendo corretamente

### 4. BUG CRÍTICO: Formatação de Texto no FormatToolbar

**Arquivos:**

- [apps/web/src/shared/components/layout/FormatToolbar.tsx](apps/web/src/shared/components/layout/FormatToolbar.tsx)
- [apps/web/src/features/bpmn/editor/BpmnEditor.tsx](apps/web/src/features/bpmn/editor/BpmnEditor.tsx)
- [apps/web/src/features/bpmn/editor/custom/CustomRenderer.ts](apps/web/src/features/bpmn/editor/custom/CustomRenderer.ts)

**Problema:** Funcionalidades de formatação de texto (fonte, negrito, itálico, cor) não estão sendo aplicadas aos elementos BPMN.

**Análise:**

- `FormatToolbar.applyToSelection` (linha 96) chama `editorRef.current.applyFormatting`
- `BpmnEditor.applyFormatting` (linha 154) processa formatação e aplica aos elementos
- `CustomRenderer._applyCustomStyles` (linha 19) aplica estilos customizados no render

**Ações:**

- Verificar se `applyFormatting` está sendo chamado corretamente
- Verificar se formatação está sendo salva nos atributos `data-*` do DI
- Verificar se `CustomRenderer` está aplicando estilos corretamente
- Testar cada tipo de formatação (font, fontSize, bold, italic, underline, textColor)
- Verificar se elementos selecionados estão sendo passados corretamente
- Adicionar logs de debug para rastrear fluxo de formatação
- Garantir que formatação persiste após re-render do canvas

## Ordem de Implementação

1. **Remover botão Filter** (mais simples, baixo risco)
2. **Corrigir bug de formatação de texto** (crítico, alta prioridade)
3. **Verificar Export/Save** (funcionalidades importantes)
4. **Melhorar Breadcrumb** (melhoria de UX)

## Notas Técnicas

- O FormatToolbar usa polling (interval de 200ms) para manter seleção atualizada
- O breadcrumb usa `getFolderPath` do SpacesContext para buscar path da API
- Export usa jsPDF para PDF e canvas para PNG
- Save usa API de versioning com XML do processo