# ProcessLab Design System

**Última atualização**: Dezembro 2025

Este documento define o design system do ProcessLab, incluindo identidade visual, paleta de cores, tipografia, espaçamentos e componentes.

---

## 🎨 Identidade Visual

### Logo

O logo ProcessLab é composto por um ícone de fluxo de processo (círculos conectados com efeitos de brilho) e a marca textual "ProcessLab".

**Variantes disponíveis:**
- **Horizontal**: Logo completo com ícone e texto lado a lado (`/logo-horizontal.svg`)
- **Vertical**: Logo empilhado com ícone acima do texto (`/logo-vertical.svg`)
- **Icon**: Apenas o ícone do fluxo de processo (`/logo-icon.svg`)

**Uso:**
```tsx
import { Logo } from '@/components/branding/Logo';

// Horizontal (padrão)
<Logo variant="horizontal" width={200} height={40} />

// Vertical
<Logo variant="vertical" width={120} height={120} />

// Icon only
<Logo variant="icon" width={40} height={40} />
```

**Cores do logo:**
- Primária: `#2563eb` (blue-600)
- Secundária: `#60a5fa` (blue-400)
- Destaque: `#3b82f6` (blue-500)

---

## 🎨 Paleta de Cores

### Cores Primárias

A paleta principal do ProcessLab é baseada em azul, representando confiança, profissionalismo e tecnologia.

| Nome | Hex | Uso |
|------|-----|-----|
| Primary 50 | `#eff6ff` | Backgrounds muito suaves |
| Primary 100 | `#dbeafe` | Backgrounds suaves |
| Primary 200 | `#bfdbfe` | Borders suaves |
| Primary 300 | `#93c5fd` | Elementos secundários |
| Primary 400 | `#60a5fa` | Hover states |
| Primary 500 | `#3b82f6` | Ações secundárias |
| **Primary 600** | `#2563eb` | **Cor principal** |
| Primary 700 | `#1d4ed8` | Hover estados escuros |
| Primary 800 | `#1e40af` | Estados pressionados |
| Primary 900 | `#1e3a8a` | Texto em backgrounds claros |

### Cores Semânticas

#### Success (Verde)
- Success: `#10b981` (emerald-500)
- Success 50: `#ecfdf5`
- Success 600: `#059669`
- Uso: Confirmações, estados positivos, sucesso

#### Warning (Amber)
- Warning: `#f59e0b` (amber-500)
- Warning 50: `#fffbeb`
- Warning 600: `#d97706`
- Uso: Avisos, estados de atenção

#### Destructive (Vermelho)
- Destructive: `#ef4444` (red-500)
- Destructive 50: `#fef2f2`
- Destructive 600: `#dc2626`
- Uso: Erros, ações destrutivas

#### Info (Cyan)
- Info: `#06b6d4` (cyan-500)
- Info 50: `#ecfeff`
- Info 600: `#0891b2`
- Uso: Informações, dicas

### Cores Neutras (Zinc)

| Nome | Light Mode | Dark Mode | Uso |
|------|-----------|-----------|-----|
| Background | `#ffffff` | `#09090b` | Fundo principal |
| Foreground | `#09090b` | `#fafafa` | Texto principal |
| Muted | `#f4f4f5` | `#27272a` | Backgrounds secundários |
| Muted Foreground | `#71717a` | `#a1a1aa` | Texto secundário |
| Border | `#e4e4e7` | `#27272a` | Bordas |

---

## 📝 Tipografia

### Fontes

- **Sans-serif**: Geist Sans (variável `--font-geist-sans`)
  - Fallback: system-ui, -apple-system, sans-serif
- **Monospace**: Geist Mono (variável `--font-geist-mono`)
  - Fallback: 'Courier New', monospace

### Escala Tipográfica

| Tamanho | Classe | Font Size | Line Height | Uso |
|---------|--------|-----------|-------------|-----|
| xs | `.text-xs` | 0.75rem (12px) | 1rem (16px) | Labels, captions |
| sm | `.text-sm` | 0.875rem (14px) | 1.25rem (20px) | Texto secundário |
| base | `.text-base` | 1rem (16px) | 1.5rem (24px) | Corpo do texto |
| lg | `.text-lg` | 1.125rem (18px) | 1.75rem (28px) | Texto destacado |
| xl | `.text-xl` | 1.25rem (20px) | 1.75rem (28px) | Subtítulos |
| 2xl | `.text-2xl` | 1.5rem (24px) | 2rem (32px) | Títulos menores |
| 3xl | `.text-3xl` | 1.875rem (30px) | 2.25rem (36px) | Títulos médios |
| 4xl | `.text-4xl` | 2.25rem (36px) | 2.5rem (40px) | Títulos grandes |
| 5xl | `.text-5xl` | 3rem (48px) | 1 | Hero headings |
| 6xl | `.text-6xl` | 3.75rem (60px) | 1 | Hero headings grandes |

### Pesos de Fonte

- `400` (normal): Texto padrão
- `500` (medium): Ênfase leve
- `600` (semibold): Subtítulos, labels importantes
- `700` (bold): Títulos, destaque

---

## 📏 Espaçamento

Escala de espaçamento baseada em múltiplos de 4px:

| Nome | Variável | Valor | Uso |
|------|----------|-------|-----|
| xs | `--spacing-xs` | 0.25rem (4px) | Espaçamento mínimo |
| sm | `--spacing-sm` | 0.5rem (8px) | Elementos próximos |
| md | `--spacing-md` | 1rem (16px) | Espaçamento padrão |
| lg | `--spacing-lg` | 1.5rem (24px) | Seções relacionadas |
| xl | `--spacing-xl` | 2rem (32px) | Seções separadas |
| 2xl | `--spacing-2xl` | 3rem (48px) | Seções principais |
| 3xl | `--spacing-3xl` | 4rem (64px) | Espaçamento hero |
| 4xl | `--spacing-4xl` | 6rem (96px) | Espaçamento máximo |

**Classes Tailwind**: Use `gap-{size}`, `p-{size}`, `m-{size}`, `space-{size}`

---

## 🎭 Sombras

| Nome | Variável | Valor | Uso |
|------|----------|-------|-----|
| sm | `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Elementos elevados levemente |
| md | `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Cards, modais |
| lg | `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Dropdowns, popovers |
| xl | `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | Modais grandes |

---

## 🧱 Componentes

### Botões

Variantes disponíveis:
- `default`: Botão primário (azul)
- `secondary`: Botão secundário (cinza)
- `destructive`: Botão de ação destrutiva (vermelho)
- `outline`: Botão com borda
- `ghost`: Botão sem fundo
- `link`: Botão como link

Tamanhos:
- `sm`: Altura 8 (32px)
- `default`: Altura 9 (36px)
- `lg`: Altura 10 (40px)
- `icon`: Quadrado 9x9

### Cards

Use para agrupar conteúdo relacionado:
- Padding padrão: `p-6`
- Border radius: `--radius` (0.5rem)
- Background: `--card`
- Shadow: `shadow-md` no hover

### Inputs

- Border: `--border`
- Focus ring: `--ring` (azul primário)
- Placeholder: `--muted-foreground` com 60% opacidade

---

## 🎨 Ilustrações

### ProcessFlow

Ilustração do fluxo de processo para seções visuais.

```tsx
import { ProcessFlow } from '@/components/illustrations/ProcessFlow';

<ProcessFlow size="md" /> // sm, md, lg
```

### EmptyStateIllustration

Ilustrações para estados vazios.

```tsx
import { EmptyStateIllustration } from '@/components/illustrations/EmptyStateIllustration';

<EmptyStateIllustration variant="process" /> // process, document, user, chart
```

---

## 📱 Responsividade

Breakpoints (Tailwind padrão):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Estratégia**: Mobile-first
- Base: Mobile (sem prefixo)
- Adaptações: Use prefixos `sm:`, `md:`, `lg:`, etc.

---

## 🌓 Modo Escuro

O design system suporta modo escuro através de `prefers-color-scheme: dark`.

**Princípios:**
- Backgrounds escuros (`zinc-950`)
- Texto claro (`zinc-50`)
- Cores primárias ajustadas para melhor contraste
- Bordas mais sutis

---

## ♿ Acessibilidade

### Contraste
- Texto normal: Mínimo 4.5:1
- Texto grande (18px+): Mínimo 3:1
- Componentes interativos: Mínimo 3:1

### Focus
- Todos os elementos interativos têm `focus-visible`
- Ring color: `--ring` (azul primário)
- Offset: 2px

### Navegação por Teclado
- Todas as ações devem ser acessíveis via teclado
- Ordem de tabulação lógica
- Aria labels quando necessário

---

## 📚 Referências

- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) - Base dos componentes
- [Geist Font](https://vercel.com/font) - Fonte principal
- [Lucide Icons](https://lucide.dev) - Biblioteca de ícones

---

**Última atualização**: Dezembro 2025

