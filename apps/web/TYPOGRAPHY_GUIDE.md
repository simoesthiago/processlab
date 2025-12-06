# 🎨 Guia de Tipografia - Clean Technical SaaS

## ✅ Implementação Completa

A tipografia "Clean Technical SaaS" foi implementada com sucesso usando:

### 📚 Fontes

1. **Inter** - Fonte primária (headings e body)
2. **JetBrains Mono** - Fonte monoespaçada (código, logs, dados técnicos)

---

## 🎯 Diretrizes de Uso

### **Body Text (Texto Padrão)**

```tsx
<p className="text-base">
  Texto padrão com Inter Regular (400), cor slate-600
</p>
```

- **Peso:** 400 (Regular)
- **Cor:** `#475569` (slate-600) no light mode
- **Cor:** `#cbd5e1` (slate-300) no dark mode
- **Line-height:** 1.6 (generoso para leitura técnica)

---

### **Headings (Títulos)**

#### H1 - Título Principal
```tsx
<h1 className="text-6xl font-semibold">
  Turn documents into processes
</h1>
```
- **Peso:** 600 (Semi-Bold)
- **Letter-spacing:** -0.025em (tracking tight)
- **Line-height:** 1.2

#### H2 - Subtítulo
```tsx
<h2 className="text-4xl font-semibold">
  Features
</h2>
```
- **Peso:** 600 (Semi-Bold)
- **Letter-spacing:** -0.02em

#### H3, H4, H5, H6 - Sub-títulos
```tsx
<h3 className="text-2xl font-medium">
  Section Title
</h3>
```
- **Peso:** 500 (Medium)
- **Letter-spacing:** -0.01em

---

### **Code & Technical Data (Código e Dados Técnicos)**

#### Inline Code
```tsx
<code className="font-mono text-sm">
  const result = processData();
</code>
```

#### Code Blocks
```tsx
<pre className="font-mono">
  <code>
    function example() {
      return "Hello World";
    }
  </code>
</pre>
```

#### Logs e Dados Técnicos
```tsx
<div className="font-mono text-sm">
  [INFO] Processing completed successfully
</div>
```

- **Família:** JetBrains Mono
- **Peso:** 400 (Regular)
- **Line-height:** 1.5 para code blocks

---

## 🎨 Classes Utilitárias Tailwind

### Pesos de Fonte Disponíveis
```tsx
<span className="font-normal">    {/* 400 - Body text */}</span>
<span className="font-medium">    {/* 500 - Sub-headings */}</span>
<span className="font-semibold">  {/* 600 - Main headings */}</span>
<span className="font-bold">      {/* 700 - Apenas para destaque crítico */}</span>
```

### Letter-spacing (Tracking)
```tsx
<h1 className="tracking-tighter">  {/* -0.025em - H1 */}</h1>
<h2 className="tracking-tight">    {/* -0.02em - H2 */}</h2>
<h3 className="tracking-tight">    {/* -0.01em - H3+ */}</h3>
```

### Line-height (Leading)
```tsx
<p className="leading-relaxed">    {/* 1.6 - Body text (padrão) */}</p>
<h1 className="leading-tight">     {/* 1.2 - Headings (padrão) */}</h1>
<pre className="leading-normal">   {/* 1.5 - Code blocks (padrão) */}</pre>
```

---

## 🎯 Boas Práticas

### ✅ FAÇA:
- Use `font-normal` (400) para body text
- Use `font-medium` (500) ou `font-semibold` (600) para headings
- Aplique `tracking-tight` em H1 e H2 para visual moderno
- Use `font-mono` para qualquer conteúdo técnico (código, logs, JSON, etc.)
- Mantenha `leading-relaxed` no body text para facilitar leitura

### ❌ EVITE:
- Usar `font-bold` (700+) excessivamente - reserve para CTAs e destaque crítico
- Aplicar letter-spacing positivo em headings
- Usar fontes sans-serif em blocos de código
- Line-height muito apertado (<1.5) em textos longos

---

## 🔧 Configuração Técnica

### Arquivos Modificados:

1. **`apps/web/src/app/layout.tsx`**
   - Importação de `Inter` e `JetBrains_Mono` do Google Fonts
   - Configuração das variáveis CSS `--font-inter` e `--font-mono`

2. **`apps/web/src/app/globals.css`**
   - Variáveis de fonte atualizadas
   - Estilos base para body, headings, code
   - Configurações de peso, letter-spacing e line-height

### Variáveis CSS Disponíveis:
```css
--font-sans: var(--font-inter), ...fallbacks;
--font-mono: var(--font-mono), 'JetBrains Mono', 'Fira Code', ...fallbacks;
```

---

## 📝 Exemplos Práticos

### Landing Page Hero
```tsx
<div className="space-y-6">
  <h1 className="text-6xl font-semibold tracking-tighter">
    Turn documents into processes
  </h1>
  <p className="text-xl text-slate-600 leading-relaxed">
    ProcessLab combines the best of generative AI and standard BPMN
  </p>
</div>
```

### Card de Feature
```tsx
<div className="space-y-3">
  <h3 className="text-xl font-medium tracking-tight">
    AI-Powered Generation
  </h3>
  <p className="text-base text-slate-600 leading-relaxed">
    Generate BPMN diagrams from natural language
  </p>
</div>
```

### Bloco de Código
```tsx
<div className="bg-slate-900 p-4 rounded-lg">
  <pre className="font-mono text-sm text-slate-100">
    <code>{`{
  "status": "success",
  "data": { "id": "abc123" }
}`}</code>
  </pre>
</div>
```

---

## 🎨 Resultado Visual

Esta configuração replica a estética "Clean Technical SaaS" vista em:
- **HumbleOps.ai**
- **Linear**
- **Vercel**
- **Stripe Docs**

### Características:
✅ Visual limpo e profissional  
✅ Ótima legibilidade técnica  
✅ Hierarquia clara de informação  
✅ Contraste suave (não agressivo)  
✅ Perfeito para aplicações SaaS B2B  

---

## 🚀 Próximos Passos

Para aplicar as mudanças:

1. **Se estiver usando Docker:**
   ```bash
   docker-compose restart web
   ```

2. **Limpe o cache do navegador:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)
   - Ou abra em aba anônima

3. **Verifique as fontes no DevTools:**
   - F12 → Elements → Computed → Rendered Fonts
   - Deve aparecer "Inter" e "JetBrains Mono"

---

**Última atualização:** 2025-01-06  
**Status:** ✅ Implementação completa

