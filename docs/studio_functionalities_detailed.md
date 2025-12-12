# MVP do Studio/Canvas (Escopo Reduzido)

**Data**: Dezembro 2025  
**Status**: Documento focado no MVP

Este arquivo substitui a lista extensa anterior. O foco agora é entregar só o que importa para o MVP:
1) UI bonita  
2) UX decente  
3) Plataforma de edição de processos funcionando  
4) ProcessWizard capaz de montar processos a partir de documentos, textos e imagens

---

## Objetivo
Garantir que o Studio entregue uma experiência completa e polida nessas quatro frentes, sem funcionalidades extras. Tudo fora disso é pós-MVP.

---

## Fluxo principal do usuário
1. Abrir o Studio e entender rapidamente como criar ou importar um processo.  
2. Montar/editar um processo no canvas com os blocos básicos.  
3. Opcional: usar o ProcessWizard para gerar um rascunho a partir de documentos/textos/imagens.  
4. Salvar/exportar o processo em BPMN e compartilhar.

---

## Escopo do MVP

### 1) UI bonita
- Layout consistente (navbar, sidebar de elementos, canvas e painel de propriedades).  
- Tema claro/escuro utilizável; tipografia legível; espaçamento e hierarquia visual definidos.  
- Cores e ícones coerentes; estados de hover/active/disabled visíveis.  
- Feedback de carregamento (ex.: skeleton/spinner) em ações longas.

### 2) UX decente
- Fluxos claros para: criar processo, importar BPMN, editar, salvar, exportar PNG/XML.  
- Atalhos básicos: Undo/Redo (Cmd/Ctrl+Z / Shift+Cmd/Ctrl+Z) e Delete.  
- Navegação simples: seleção, arrastar, redimensionar, conectar, zoom/pan.  
- Mensagens de erro úteis e não bloqueantes (ex.: conexão inválida, arquivo não suportado).  
- Onboarding leve: dica inicial mostrando onde ficam elementos e como conectar.

### 3) Editor de processos funcionando
- Paleta mínima: Start Event, End Event, Task, Gateway (XOR e Paralelo), Pool/Lane, Annotation, Sequence Flow.  
- Drag and drop, seleção múltipla, mover e redimensionar shapes.  
- Conexões com validação básica (ex.: um End Event não inicia fluxo).  
- Edição de propriedades essenciais: nome, descrição/notas, responsável/raia, prioridade ou SLA simples.  
- Zoom/pan suave; grid opcional com snap simples.  
- Undo/Redo operando via command stack.  
- Importar BPMN 2.0 (XML) e exportar BPMN 2.0 (XML) e PNG do canvas.  
- Validação mínima: processo deve ter início/fim e fluxos conectados.  
- Performance aceitável para diagramas médios (ex.: até ~150 nós sem travar).

### 4) ProcessWizard (IA)
- Entradas aceitas:  
  - Upload de documentos (PDF, DOCX, TXT) até 10 MB.  
  - Texto colado.  
  - Imagens com OCR (PNG/JPG) até 5 MB cada, máximo 3 imagens por geração.
- Saída:  
  - Gerar rascunho de processo em BPMN com tarefas, gateways e swimlanes sugeridos.  
  - Indicar de onde veio cada passo (citando trecho/fonte quando possível).  
  - Preencher descrições das tarefas e possíveis responsáveis/lanes quando identificáveis.
- Interação:  
  - Chat curto para refinar (ex.: "adicione etapa de aprovação" ou "remova task X").  
  - Aplicar alterações diretamente no canvas mantendo Undo/Redo.  
  - Permitir aceitar ou descartar sugestões antes de aplicar.
- Limites e segurança:  
  - Tamanho máximo de entrada respeitado; recusar formatos fora da lista.  
  - Descartar dados sensíveis em logs; mostrar aviso de privacidade.

---

## Fora do escopo (pós-MVP)
- Formatações avançadas (tipografia detalhada, cores sofisticadas, alinhamentos finos).  
- Simulação/execução de processos, análises de performance e otimização automática.  
- Histórico de versões completo, comentários colaborativos e presença em tempo real.  
- Busca avançada no canvas, macros/automatizações, snippets de processos.  
- Exportações complexas (PDF avançado, JSON custom, opções de DPI, templates).  
- Design system completo de componentes que não sejam usados no Studio.  
- Qualquer integração externa além do mínimo para upload/download de arquivos.

---

## Critérios de aceite rápidos
- UI: tema claro/escuro funcionando, estados visuais consistentes, sem layout quebrado.  
- UX: usuário consegue criar, editar, salvar e exportar sem ficar "perdido"; atalhos básicos OK.  
- Editor: paleta mínima opera end-to-end (criar, mover, conectar, validar, salvar/importar/exportar).  
- ProcessWizard: dado um PDF/TXT de exemplo, gera um diagrama inicial editável e aplica no canvas com Undo/Redo.

---

## Métricas de sucesso (MVP)
- Tempo médio para criar um processo simples (alvo: < 5 minutos).  
- Percentual de processos com início/fim válidos após export (alvo: > 90%).  
- Taxa de sucesso na geração do ProcessWizard sem erro de parsing (alvo: > 85%).  
- Reclamações críticas de UX/UI por sessão (alvo: tendência de queda a cada sprint).

---

## Próximos passos sugeridos
1. Validar design final (tema claro/escuro + layout de painéis).  
2. Garantir fluxo completo do Editor (paleta mínima + Undo/Redo + import/export).  
3. Entregar primeira iteração do ProcessWizard (PDF/TXT) e depois liberar imagens.  
4. Testar o fluxo E2E com 2-3 processos reais e ajustar onde doer.
