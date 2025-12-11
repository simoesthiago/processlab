# Funcionalidades Detalhadas do Studio/Canvas

**Data**: Dezembro 2025  
**Status**: Documentação completa de funcionalidades identificadas

Este documento detalha **todas** as funcionalidades que devem ser desenvolvidas no Studio/Canvas, organizadas por área e com especificações detalhadas.

---

## 📋 Índice

1. [FormatToolbar (Toolbar de Formatação)](#formattoolbar-toolbar-de-formatação)
2. [StudioNavbar (Barra Superior)](#studionavbar-barra-superior)
3. [ElementsSidebar (Sidebar de Elementos)](#elementssidebar-sidebar-de-elementos)
4. [ProcessWizard (Painel de IA)](#processwizard-painel-de-ia)
5. [Citations (Citações)](#citations-citações)
6. [ResizablePanel (Painéis Redimensionáveis)](#resizablepanel-painéis-redimensionáveis)
7. [Editor BPMN (Canvas)](#editor-bpmn-canvas)
8. [Export/Download](#exportdownload)
9. [Design e UX](#design-e-ux)

---

## FormatToolbar (Toolbar de Formatação)

**Nota**: Não há um seletor de cor genérico. Use os seletores específicos de **Cor de Texto** e **Cor de Preenchimento** abaixo.

### 1. Seletor de Fonte (Font)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Aplicar fonte escolhida ao texto dos elementos BPMN selecionados
- Suportar fontes: Arial, Helvetica, Times New Roman, Courier New, Verdana
- Atualizar propriedade `di:FontFamily` no modelo BPMN
- Mostrar fonte atual do elemento selecionado

**Especificações técnicas**:
- Usar `modeling.updateProperties(element, { fontFamily: font })`
- Aplicar a fontes de labels e textos dentro de elementos

---

### 2. Seletor de Tamanho de Fonte (Font Size)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Aplicar tamanho de fonte ao texto dos elementos selecionados
- Suportar tamanhos: 8, 9, 10, 11, 12, 14, 16, 18, 20, 24
- Atualizar propriedade `di:FontSize` no modelo BPMN
- Mostrar tamanho atual do elemento selecionado

**Especificações técnicas**:
- Usar `modeling.updateProperties(element, { fontSize: size })`

---

### 3. Botões de Aumentar/Diminuir Fonte (AA)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Botão menor "A": Diminuir tamanho da fonte em 1pt
- Botão maior "A": Aumentar tamanho da fonte em 1pt
- Aplicar ao elemento selecionado
- Atualizar o seletor de tamanho de fonte para refletir mudança

**Especificações técnicas**:
- Ler tamanho atual, incrementar/decrementar, aplicar novo tamanho
- Validar limites (mínimo 8, máximo 24)

---

### 4. Botão Bold (Negrito)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Aplicar/remover negrito no texto do elemento selecionado
- Toggle visual (botão destacado quando ativo)
- Atualizar propriedade `di:FontWeight` no modelo BPMN

**Especificações técnicas**:
- Usar `modeling.updateProperties(element, { fontWeight: isBold ? 'bold' : 'normal' })`

---

### 5. Botão Italic (Itálico)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Aplicar/remover itálico no texto do elemento selecionado
- Toggle visual (botão destacado quando ativo)
- Atualizar propriedade `di:FontStyle` no modelo BPMN

**Especificações técnicas**:
- Usar `modeling.updateProperties(element, { fontStyle: isItalic ? 'italic' : 'normal' })`

---

### 6. Botão Underline (Sublinhado)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Aplicar/remover sublinhado no texto do elemento selecionado
- Toggle visual (botão destacado quando ativo)
- Atualizar propriedade `di:TextDecoration` no modelo BPMN

**Especificações técnicas**:
- Usar `modeling.updateProperties(element, { textDecoration: isUnderline ? 'underline' : 'none' })`

---

### 7. Seletor de Cor de Texto (Text Color)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Aplicar cor escolhida ao texto do elemento selecionado
- Mostrar cor atual do texto no seletor
- Atualizar propriedade `di:FontColor` no modelo BPMN

**Especificações técnicas**:
- Usar `modeling.setColor(element, { stroke: color })` ou propriedade específica de texto

**Nota**: Este é o seletor específico para cor do texto. Não há mais um seletor de cor genérico - use este ou o de preenchimento.

---

### 8. Seletor de Cor de Preenchimento (Fill Color / Paint Bucket)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Aplicar cor de preenchimento ao elemento selecionado
- Este é o seletor específico para preenchimento/fundo do elemento (não há mais um seletor de cor genérico)
- Atualizar propriedade `di:FillColor` no modelo BPMN

**Especificações técnicas**:
- Usar `modeling.setColor(element, { fill: color })`

---

### 9. Alinhamento Horizontal (Left, Center, Right)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Alinhar texto horizontalmente dentro do elemento BPMN
- Opções: Esquerda, Centro, Direita
- Aplicar ao elemento selecionado
- Atualizar propriedade `di:TextAlign` no modelo BPMN

**Especificações técnicas**:
- Usar `modeling.updateProperties(element, { textAlign: 'left' | 'center' | 'right' })`

---

### 10. Alinhamento Vertical (Superior, Ao Meio, Inferior)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Alinhar texto verticalmente dentro do elemento BPMN
- Opções: Superior, Ao Meio, Inferior
- Aplicar ao elemento selecionado
- Atualizar propriedade `di:VerticalAlign` no modelo BPMN

**Especificações técnicas**:
- Usar `modeling.updateProperties(element, { verticalAlign: 'top' | 'middle' | 'bottom' })`

---

### 11. Botão Arrange
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Abrir menu com opções de organização de elementos:
  - **Bring to Front**: Trazer elemento para frente
  - **Send to Back**: Enviar elemento para trás
  - **Group**: Agrupar elementos selecionados
  - **Ungroup**: Desagrupar elementos
  - **Align**: Alinhar múltiplos elementos (esquerda, centro, direita, topo, meio, baixo)
  - **Distribute**: Distribuir elementos uniformemente (horizontal, vertical)

**Especificações técnicas**:
- Usar `modeling.moveElements()` para z-order
- Usar `modeling.updateProperties()` para agrupamento
- Implementar lógica de alinhamento e distribuição

---

### 12. Botão Simulation
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Abrir painel/modal de simulação do processo BPMN
- Funcionalidades:
  - Executar simulação do processo
  - Mostrar fluxo de execução (animação)
  - Estatísticas de tempo de execução
  - Identificar gargalos
  - Validar caminhos do processo
- Opcional: Integrar com engine de simulação BPMN (ex: bpmn-js-token-simulation)

**Especificações técnicas**:
- Criar componente `SimulationPanel`
- Integrar com biblioteca de simulação BPMN ou criar simulação básica
- Mostrar animação visual no canvas durante simulação

---

### 13. Botão Search
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Abrir painel de busca no canvas
- Funcionalidades:
  - Buscar elementos por nome/ID
  - Buscar por tipo (Task, Gateway, Event, etc.)
  - Buscar por propriedades (labels, descrições)
  - Navegar para elemento encontrado (zoom e highlight)
  - Lista de resultados com preview
- Atalho: Ctrl+F ou Cmd+F

**Especificações técnicas**:
- Criar componente `SearchPanel`
- Implementar busca no modelo BPMN (XML/JSON)
- Usar `canvas.zoom()` e `canvas.scroll()` para navegar
- Highlight elemento encontrado

---

### 14. Botão History (VersionTimeline)
**Status**: ✅ Componente Implementado | ⚠️ Não Renderizado no Studio

**O que fazer**:
- **Renderizar o VersionTimeline no Studio** quando o botão History for clicado
- O VersionTimeline já existe e permite:
  - Ver histórico de versões salvas (com commit messages)
  - Selecionar versão para visualizar
  - Restaurar versão anterior
  - Navegar entre versões por ação/macroação realizada
- Integrar com o painel direito do Studio (tab "History")
- Quando clicar no botão History da FormatToolbar, mostrar o VersionTimeline

**Especificações técnicas**:
- Renderizar `VersionTimeline` no `ResizablePanel` quando `activeTab === 'history'`
- Conectar com `versions`, `selectedVersionId`, `onSelectVersion`, `onRestoreVersion`
- O componente já está implementado, só precisa ser renderizado

**Nota**: Este é o controle de versões principal. Não confundir com "histórico de ações do editor" (undo/redo) que é diferente.

---

## StudioNavbar (Barra Superior)

### 17. Botões Undo/Redo
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- **Undo (Ctrl+Z / Cmd+Z)**: Desfazer última ação no editor
- **Redo (Ctrl+Y / Cmd+Y)**: Refazer ação desfeita
- Integrar com sistema de undo/redo do bpmn-js
- Desabilitar botões quando não há ações para desfazer/refazer
- Mostrar tooltip com ação que será desfeita/refeita

**Especificações técnicas**:
- Usar `commandStack.undo()` e `commandStack.redo()` do bpmn-js
- Escutar eventos `commandStack.changed` para atualizar estado dos botões
- Implementar atalhos de teclado

---

### 18. Seletor de Idioma (Language Selector)
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Permitir alternar entre idiomas: English (EN) e Português (PT)
- Aplicar tradução a toda interface do Studio
- Salvar preferência do usuário (localStorage ou backend)
- Traduzir:
  - Labels de elementos BPMN
  - Mensagens do sistema
  - Tooltips
  - Modais
  - Mensagens de erro/sucesso

**Especificações técnicas**:
- Implementar sistema de i18n (ex: next-intl, react-i18next)
- Criar arquivos de tradução (en.json, pt.json)
- Contexto de idioma global
- Atualizar todos os textos da interface

---

### 19. Botão Settings
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Abrir modal de configurações do editor
- Opções de configuração:
  - **Editor**:
    - Grid snap (ativar/desativar)
    - Grid size
    - Zoom mínimo/máximo
    - Auto-save (ativar/desativar, intervalo)
  - **Visual**:
    - Tema (claro/escuro)
    - Cores padrão de elementos
    - Tamanho de fonte padrão
  - **Atalhos**: Lista de atalhos de teclado e opção de customizar
  - **Export**: Configurações padrão de export (formato, qualidade)

**Especificações técnicas**:
- Criar componente `SettingsModal`
- Salvar preferências em localStorage ou backend
- Aplicar configurações ao editor em tempo real

---

### 20. Botão Export (Melhorias)
**Status**: ✅ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar modal de export existente
- Adicionar opções:
  - **Formato**: XML, PNG, PDF, JSON
  - **PNG**: Qualidade (baixa, média, alta), resolução (DPI)
  - **PDF**: Tamanho de página, orientação, margens
  - **XML**: Incluir metadados, versão BPMN
- Preview antes de exportar
- Download direto ou salvar em workspace

**Especificações técnicas**:
- Melhorar `handleExport` existente
- Criar componente `ExportModal` completo
- Integrar com endpoints de export do backend

---

## ElementsSidebar (Sidebar de Elementos)

### 21. Ferramenta Pointer (Select)
**Status**: ✅ UI Implementada | ✅ Funcionalidade Implementada (padrão do bpmn-js)

**O que fazer**:
- Já funciona (é o modo padrão do bpmn-js)
- Manter estado visual (botão destacado quando ativo)
- Garantir que está sempre disponível

---

### 22. Ferramenta Resize/Move
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Ativar modo de redimensionamento/movimentação
- Quando ativo:
  - Mostrar handles de redimensionamento em todos os elementos
  - Permitir arrastar elementos livremente
  - Permitir redimensionar elementos arrastando handles
- Desativar quando clicar em outro elemento ou ferramenta

**Especificações técnicas**:
- Criar customização do bpmn-js para modo resize/move
- Adicionar handles de redimensionamento
- Usar `modeling.resizeShape()` e `modeling.moveShape()`

---

### 23. Ferramenta Align
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Ativar modo de alinhamento
- Quando múltiplos elementos estão selecionados:
  - Mostrar opções de alinhamento (esquerda, centro, direita, topo, meio, baixo)
  - Aplicar alinhamento aos elementos selecionados
- Quando um elemento está selecionado:
  - Alinhar elemento à grid ou a outros elementos próximos

**Especificações técnicas**:
- Calcular posições dos elementos
- Aplicar alinhamento usando `modeling.moveShape()`
- Mostrar guias visuais durante alinhamento

---

### 24. Ferramenta Connector
**Status**: ✅ UI Implementada | ❌ Funcionalidade Pendente

**O que fazer**:
- Ativar modo de conexão
- Quando ativo:
  - Clicar em um elemento para iniciar conexão
  - Arrastar para outro elemento para criar Sequence Flow
  - Mostrar preview da conexão durante arrasto
- Desativar após criar conexão ou pressionar ESC

**Especificações técnicas**:
- Usar `create.start()` do bpmn-js com tipo `bpmn:SequenceFlow`
- Implementar lógica de drag para criar conexões
- Validar conexões (ex: não conectar evento final a outro elemento)

---

### 25. Drag & Drop de Elementos BPMN
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar drag & drop existente
- Funcionalidades:
  - Feedback visual durante arrasto (ghost element)
  - Snap to grid (se ativado)
  - Validação de posicionamento (não sobrepor elementos)
  - Preview do elemento antes de soltar
- Suportar todos os elementos BPMN da sidebar

**Especificações técnicas**:
- Melhorar `handleDragStart` existente
- Adicionar feedback visual (ghost)
- Implementar snap to grid
- Validar posições antes de criar elemento

---

### 26. Tooltips Informativos
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Adicionar tooltips detalhados em todos os elementos da sidebar
- Conteúdo dos tooltips:
  - Nome do elemento
  - Descrição do que faz
  - Quando usar
  - Exemplo visual (opcional)
- Mostrar tooltip ao hover

**Especificações técnicas**:
- Usar componente Tooltip do design system
- Adicionar descrições para cada elemento BPMN

---

## ProcessWizard (Painel de IA)

**Nota**: ProcessWizard e Copilot são a mesma funcionalidade, apenas nomes diferentes. Todas as funcionalidades de IA conversacional estão consolidadas aqui.

### 27. Sugestões Contextuais
**Status**: ✅ UI Implementada | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar sugestões existentes
- Sugestões devem ser baseadas no processo atual:
  - Analisar elementos existentes no processo
  - Sugerir próximos passos lógicos
  - Sugerir melhorias baseadas em padrões BPMN
- Atualizar sugestões quando processo muda

**Especificações técnicas**:
- Analisar modelo BPMN atual
- Usar IA para gerar sugestões contextuais (opcional)
- Ou usar regras baseadas em padrões BPMN

---

### 28. Histórico de Comandos
**Status**: ❌ Não Implementado

**O que fazer**:
- Adicionar seção de histórico de comandos executados no ProcessWizard
- Mostrar:
  - Comando executado
  - Data/hora
  - Status (sucesso/erro)
  - Mudanças aplicadas
- Permitir:
  - Re-executar comando
  - Editar e re-executar
  - Desfazer comando

**Especificações técnicas**:
- Armazenar histórico em estado local ou localStorage
- Adicionar seção de histórico no componente ProcessWizard
- Integrar com sistema de undo/redo

---

### 29. Persistência de Histórico de Comandos
**Status**: ❌ Não Implementado

**O que fazer**:
- Salvar histórico de comandos (localStorage ou backend)
- Restaurar histórico ao reabrir painel
- Limpar histórico (opção no menu)
- Exportar histórico (opcional)

**Especificações técnicas**:
- Salvar comandos em localStorage por processo
- Ou criar endpoint para salvar histórico no backend
- Restaurar ao carregar processo

---

### 30. Desfazer Ações do ProcessWizard
**Status**: ❌ Não Implementado

**O que fazer**:
- Permitir desfazer última ação do ProcessWizard
- Integrar com sistema de undo/redo do editor
- Mostrar botão "Undo" após aplicar mudança

**Especificações técnicas**:
- Integrar com `commandStack.undo()` do bpmn-js
- Rastrear ações do wizard separadamente

---

### 31. Preview de Mudanças
**Status**: ❌ Não Implementado

**O que fazer**:
- Antes de aplicar mudança, mostrar preview:
  - Lista de mudanças que serão aplicadas
  - Visualização no canvas (highlight elementos afetados)
  - Opção de aceitar ou cancelar
- Aplicar mudanças apenas após confirmação

**Especificações técnicas**:
- Criar componente `ChangePreview`
- Mostrar diff visual das mudanças
- Aplicar mudanças apenas após confirmação

---

### 32. Feedback Visual Melhorado
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar feedback durante processamento:
  - Mostrar progresso (se possível)
  - Indicar qual parte está sendo processada
  - Mostrar estimativa de tempo
- Feedback após processamento:
  - Highlight elementos modificados
  - Mostrar resumo de mudanças
  - Animar mudanças no canvas
  - Zoom automático para área modificada
  - Tooltips explicativos nos elementos modificados

**Especificações técnicas**:
- Melhorar estados de loading
- Adicionar animações de highlight
- Mostrar resumo de mudanças
- Usar `canvas.zoom()` para focar em área modificada
- Mostrar tooltips temporários

---

## Citations (Citações)

### 33. Exibir Citações de Documentos
**Status**: ✅ UI Implementada (Empty State) | ❌ Funcionalidade Pendente

**O que fazer**:
- Quando elemento BPMN é selecionado, mostrar citações relacionadas
- Citações devem vir do backend (RAG system)
- Mostrar:
  - Documento de origem
  - Trecho relevante
  - Confiança/score
  - Link para documento original

**Especificações técnicas**:
- Criar endpoint no backend para buscar citações por elemento
- Integrar com sistema RAG existente
- Atualizar componente `Citations` para exibir dados reais

---

### 34. Links para Chunks de Documentos
**Status**: ❌ Não Implementado

**O que fazer**:
- Cada citação deve ter link para chunk específico do documento
- Ao clicar, abrir documento e destacar trecho relevante
- Ou mostrar preview do chunk no painel

**Especificações técnicas**:
- Criar endpoint para buscar chunk específico
- Criar visualizador de documentos
- Implementar highlight de trechos

---

### 35. Visualização de Contexto Usado pela IA
**Status**: ❌ Não Implementado

**O que fazer**:
- Mostrar quais documentos/chunks foram usados pela IA para gerar/modificar elemento
- Timeline de uso de documentos
- Filtros por documento, data, confiança

**Especificações técnicas**:
- Rastrear uso de documentos no backend
- Criar componente de visualização
- Adicionar filtros e busca

---

## ResizablePanel (Painéis Redimensionáveis)

### 36. Salvar Preferências de Tamanho
**Status**: ❌ Não Implementado

**O que fazer**:
- Salvar largura preferida de cada painel (localStorage)
- Restaurar tamanhos ao reabrir Studio
- Permitir resetar para tamanhos padrão

**Especificações técnicas**:
- Salvar em localStorage com chave por painel
- Restaurar ao montar componente
- Adicionar opção de reset

---

### 37. Animações Suaves ao Redimensionar
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar animações durante redimensionamento
- Transições suaves ao expandir/colapsar
- Feedback visual durante drag do resize handle

**Especificações técnicas**:
- Adicionar CSS transitions
- Melhorar feedback visual do resize handle

---

### 38. Atalhos de Teclado para Painéis
**Status**: ❌ Não Implementado

**O que fazer**:
- Atalhos para mostrar/ocultar painéis:
  - `Ctrl+Shift+W` ou `Cmd+Shift+W`: Toggle ProcessWizard
  - `Ctrl+Shift+W` ou `Cmd+Shift+W`: Toggle ProcessWizard
  - `Ctrl+Shift+H` ou `Cmd+Shift+H`: Toggle History
  - `Ctrl+Shift+S` ou `Cmd+Shift+S`: Toggle Search
- Mostrar atalhos em tooltips

**Especificações técnicas**:
- Implementar handlers de teclado
- Adicionar tooltips com atalhos
- Documentar atalhos em Settings

---

## Editor BPMN (Canvas)

### 39. Atalhos de Teclado
**Status**: ❌ Não Implementado

**O que fazer**:
- Implementar atalhos essenciais:
  - `Ctrl+Z` / `Cmd+Z`: Undo
  - `Ctrl+Y` / `Cmd+Y`: Redo
  - `Delete` / `Backspace`: Deletar elemento selecionado
  - `Ctrl+A` / `Cmd+A`: Selecionar todos
  - `Ctrl+D` / `Cmd+D`: Duplicar elemento
  - `Ctrl+C` / `Cmd+C`: Copiar
  - `Ctrl+V` / `Cmd+V`: Colar
  - `Ctrl+F` / `Cmd+F`: Buscar
  - `Ctrl+S` / `Cmd+S`: Salvar
  - `Ctrl+Plus` / `Cmd+Plus`: Zoom in
  - `Ctrl+Minus` / `Cmd+Minus`: Zoom out
  - `Ctrl+0` / `Cmd+0`: Reset zoom
  - `Space + Drag`: Pan canvas
- Mostrar atalhos em tooltips e Settings

**Especificações técnicas**:
- Implementar keyboard event handlers
- Integrar com bpmn-js (alguns já existem, outros precisam ser adicionados)
- Documentar todos os atalhos

---

### 40. Zoom e Pan Otimizados
**Status**: ⚠️ Parcialmente Implementado (bpmn-js padrão) | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar controles de zoom:
  - Botões de zoom in/out na UI
  - Slider de zoom
  - Indicador de nível de zoom atual
  - Zoom para seleção (fit to selection)
  - Zoom para todo o diagrama (fit to view)
- Melhorar pan:
  - Pan com Space + Drag (já funciona no bpmn-js)
  - Pan com trackpad (melhorar)
  - Botão "Reset View" para voltar ao centro

**Especificações técnicas**:
- Adicionar controles de zoom na UI
- Usar `canvas.zoom()` e `canvas.scroll()` do bpmn-js
- Implementar fit to selection/view

---

### 41. Feedback Visual Melhorado
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar feedback visual:
  - Seleção mais destacada
  - Hover states mais claros
  - Feedback durante drag (ghost elements)
  - Highlight de elementos conectados
  - Feedback ao criar conexões
- Animações sutis:
  - Fade in ao adicionar elemento
  - Slide ao mover elemento
  - Pulse ao selecionar

**Especificações técnicas**:
- Customizar CSS do bpmn-js
- Adicionar animações CSS
- Melhorar estados visuais

---

### 42. Estados de Loading Claros
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar estados de loading:
  - Loading ao carregar processo (já existe)
  - Loading ao salvar (já existe)
  - Loading ao gerar processo
  - Loading ao aplicar mudanças do ProcessWizard
  - Loading ao exportar
- Mostrar:
  - Spinner animado
  - Mensagem descritiva
  - Progresso (se possível)
  - Opção de cancelar (quando aplicável)

**Especificações técnicas**:
- Melhorar componentes de loading existentes
- Adicionar cancelamento quando possível
- Mostrar progresso quando disponível

---

### 43. Grid e Snap
**Status**: ❌ Não Implementado

**O que fazer**:
- Adicionar grid visual no canvas (opcional, configurável)
- Snap to grid (elementos se alinham ao grid)
- Configurar tamanho do grid (Settings)
- Toggle grid on/off

**Especificações técnicas**:
- Customizar bpmn-js para mostrar grid
- Implementar snap to grid
- Adicionar configurações

---

## Export/Download

### 44. Modal de Seleção de Formato
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar modal de export existente
- Opções por formato:
  - **XML**: Incluir metadados, versão BPMN, namespace
  - **PNG**: Qualidade (baixa/média/alta), DPI (72/150/300), tamanho
  - **PDF**: Tamanho de página (A4, Letter, etc.), orientação, margens, múltiplas páginas
  - **JSON**: Formato interno, incluir versão, metadados
- Preview antes de exportar (opcional)

**Especificações técnicas**:
- Criar componente `ExportModal` completo
- Integrar com endpoints de export do backend
- Adicionar opções de configuração

---

### 45. Download Direto
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar download direto existente
- Funcionalidades:
  - Download imediato após export
  - Nome de arquivo inteligente (nome do processo + formato)
  - Opção de salvar em workspace (futuro)
  - Notificação de sucesso/erro

**Especificações técnicas**:
- Melhorar `handleExport` existente
- Adicionar notificações
- Gerar nomes de arquivo inteligentes

---

### 46. Preview Antes de Exportar
**Status**: ❌ Não Implementado

**O que fazer**:
- Mostrar preview do que será exportado
- Para PNG/PDF: Mostrar como ficará o diagrama
- Para XML: Mostrar trecho do XML
- Para JSON: Mostrar estrutura JSON
- Permitir ajustar configurações e ver preview atualizado

**Especificações técnicas**:
- Criar componente `ExportPreview`
- Gerar preview no frontend ou backend
- Atualizar preview quando configurações mudam

---

## Design e UX

### 47. Design do Modal de Settings
**Status**: ❌ Não Implementado

**O que fazer**:
- Criar design completo do modal de Settings
- Seções organizadas:
  - Editor
  - Visual
  - Atalhos
  - Export
- Design consistente com ProcessLab design system

**Especificações técnicas**:
- Criar componente `SettingsModal`
- Usar componentes do design system
- Organizar em seções/tabs

---

### 48. Design do Painel de Simulation
**Status**: ❌ Não Implementado

**O que fazer**:
- Criar design do painel de simulação
- Elementos:
  - Controles de simulação (play, pause, stop, reset)
  - Timeline de execução
  - Estatísticas (tempo total, tempo por elemento)
  - Visualização do fluxo (animação)
  - Gráficos de performance

**Especificações técnicas**:
- Criar componente `SimulationPanel`
- Design responsivo
- Animações suaves

---

### 49. Design do Painel de Search
**Status**: ❌ Não Implementado

**O que fazer**:
- Criar design do painel de busca
- Elementos:
  - Campo de busca
  - Filtros (tipo, propriedade)
  - Lista de resultados
  - Preview de elemento
  - Navegação (próximo/anterior)

**Especificações técnicas**:
- Criar componente `SearchPanel`
- Design responsivo
- Feedback visual claro

---

### 50. Integração do VersionTimeline no Studio
**Status**: ⚠️ Componente Existe | ❌ Não Renderizado

**O que fazer**:
- Renderizar o VersionTimeline no painel direito do Studio
- Quando tab "History" estiver ativa, mostrar VersionTimeline
- Conectar com dados de versões do processo
- Permitir navegação entre versões

**Especificações técnicas**:
- Adicionar renderização condicional no StudioContent
- Usar componente VersionTimeline existente
- Conectar handlers: onSelectVersion, onRestoreVersion

---

### 51. Design do Modal de Arrange
**Status**: ❌ Não Implementado

**O que fazer**:
- Criar design do menu/modal de Arrange
- Opções organizadas:
  - Z-order (Bring to Front, Send to Back)
  - Grouping (Group, Ungroup)
  - Alignment (esquerda, centro, direita, topo, meio, baixo)
  - Distribution (horizontal, vertical)
- Preview visual das opções

**Especificações técnicas**:
- Criar componente `ArrangeMenu`
- Design dropdown ou modal
- Ícones claros para cada opção

---

### 52. Design do Painel de Citations (Completo)
**Status**: ✅ UI Básica Implementada | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar design do painel de Citations
- Elementos:
  - Lista de citações com cards
  - Filtros (por documento, confiança, data)
  - Busca de citações
  - Preview de trechos
  - Links para documentos

**Especificações técnicas**:
- Melhorar componente `Citations` existente
- Adicionar filtros e busca
- Melhorar visualização de citações

---

### 53. Estados Visuais para Ferramentas
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Melhorar estados visuais de todas as ferramentas:
  - **Ativa**: Botão destacado, cor primária
  - **Inativa**: Botão normal, cor muted
  - **Hover**: Feedback visual claro
  - **Disabled**: Opacidade reduzida, cursor not-allowed
- Aplicar a:
  - FormatToolbar (todos os botões)
  - ElementsSidebar (todas as ferramentas)
  - StudioNavbar (todos os botões)

**Especificações técnicas**:
- Usar classes do design system
- Garantir consistência visual
- Adicionar transições suaves

---

### 54. Tooltips e Ajuda Contextual
**Status**: ⚠️ Parcialmente Implementado | ⚠️ Melhorias Pendentes

**O que fazer**:
- Adicionar tooltips em todos os elementos interativos:
  - Botões da FormatToolbar
  - Ferramentas da ElementsSidebar
  - Botões da StudioNavbar
  - Elementos BPMN no canvas
- Conteúdo dos tooltips:
  - Nome da ferramenta
  - Descrição breve
  - Atalho de teclado (se houver)
  - Exemplo de uso (opcional)

**Especificações técnicas**:
- Usar componente Tooltip do design system
- Adicionar tooltips em todos os elementos
- Garantir acessibilidade (aria-labels)

---

## 📊 Resumo

### Total de Funcionalidades: 53

**Por Status**:
- ✅ Totalmente Implementadas: 2 (3.8%)
- ⚠️ Parcialmente Implementadas: 15 (28.3%)
- ❌ Não Implementadas: 36 (67.9%)

**Por Prioridade**:
- 🔴 **Alta Prioridade** (Essenciais para uso básico): 20 funcionalidades
- 🟡 **Média Prioridade** (Melhoram experiência): 24 funcionalidades
- 🟢 **Baixa Prioridade** (Nice to have): 12 funcionalidades

**Por Área**:
- FormatToolbar: 14 funcionalidades
- StudioNavbar: 4 funcionalidades
- ElementsSidebar: 6 funcionalidades
- ProcessWizard: 6 funcionalidades (consolidado - Copilot e ProcessWizard são a mesma coisa)
- Citations: 3 funcionalidades
- ResizablePanel: 3 funcionalidades
- Editor BPMN: 5 funcionalidades
- Export/Download: 3 funcionalidades
- Design e UX: 8 funcionalidades

---

## 🎯 Próximos Passos Recomendados

### Fase 1 - Essenciais (2-3 semanas)
1. Conectar FormatToolbar com editor (Font, Size, Bold, Italic, Underline, Text Color, Fill Color)
2. Implementar Undo/Redo
3. Implementar atalhos de teclado básicos
4. Melhorar drag & drop de elementos
5. Implementar Export completo

### Fase 2 - Importantes (2-3 semanas)
6. Implementar Arrange (bring to front, send to back, group, align)
7. Implementar Search no canvas
8. Implementar Settings
9. Melhorar zoom e pan
10. Implementar Citations completo

### Fase 3 - Melhorias (2-3 semanas)
11. Implementar Simulation
12. Implementar History do editor
13. Melhorar ProcessWizard
14. Polimento visual e animações
15. Tooltips e ajuda contextual

---

**Última atualização**: Dezembro 2025

