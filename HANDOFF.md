# Guia de Handoff: Famorfotografia Website

Este documento serve como guia de transição para o projeto **Famorfotografia - The Storyteller**, detalhando a stack tecnológica, a arquitetura e o estado de desenvolvimento em março de 2026.

## 1. Objetivos do Projeto
O objetivo principal é um website de posicionamento premium e editorial para um fotógrafo de casamentos e lifestyle, focado em:
- **Conversão:** Facilitar o pedido de reserva através de um formulário interativo e intuitivo.
- **Portefólio:** Apresentação visual de alto impacto (estilo masonry e slideshow) com organização por álbuns de casamentos reais.
- **Performance:** Carregamento rápido, sem dependências pesadas, utilizando tecnologias nativas.
- **Bilingue:** Suporte completo para Português (PT) e Inglês (EN).

---

## 2. Stack Tecnológica
Optou-se por uma stack minimalista e "vanilla" para garantir longevidade e facilidade de manutenção sem necessidade de builds complexos (npm install, webpack, etc.).

- **Frontend:**
  - **HTML5 / CSS3:** Utilização de CSS Variables para o design system e Flexbox/Grid para layouts.
  - **Vanilla JavaScript (ES6+):** Lógica de galeria, slideshow, tradução e submissão de formulários.
  - **Tipografia:** Google Fonts (Cormorant Garamond para títulos editoriais, Manrope para interface e corpo).
- **Backend:**
  - **Node.js (Nativo):** Servidor construído com o módulo `http`, sem Express, para máxima leveza.
  - **Persistência:** Base de dados em ficheiro plano (`NDJSON`) em `data/inquiries.ndjson`.
- **Automação:**
  - **Scripts Bash:** Integração com APIs/Scrapers para atualização de fotos.

---

## 3. Arquitetura e Estrutura de Ficheiros
```text
famorfotografia-site/
├── server.js             # Core do backend (Ficheiros estáticos + API de Reservas)
├── index.html            # Página principal (Hero, Sobre, Galeria, Pacotes)
├── reserva.html          # Fluxo de reserva interativo
├── styles.css            # Design System e todos os estilos do site
├── main.js               # Inteligência do frontend (Galeria, Tradução, Form)
├── gallery-data.js       # Estrutura de dados dos álbuns de fotos
├── data/
│   └── inquiries.ndjson  # Onde os leads (pedidos) são guardados
├── assets/               # Imagens, logótipos e manifestos
└── packs/                # Páginas de detalhe para cada pacote de serviço
```

---

## 4. Estado Atual (Março 2026)

### ✅ Implementado e Funcional:
- **Landing Page Premium:** Slideshow no hero, secção de testemunhos reais e grelha de pacotes.
- **Sistema Multilingue:** Alternância instantânea PT/EN via `data-attributes` sem recarregar a página.
- **Galeria por Álbuns:** Renderização dinâmica baseada no `gallery-data.js`.
- **Formulário de Reserva:** 
  - Sincronização automática entre seletores visuais de pacotes e o campo `select`.
  - Validação de campos obrigatórios e proteção *honeypot* anti-spam.
  - Gravação automática no backend.
- **API de Admin:** Rota `/api/admin/inquiries` preparada para listar pedidos (protegida por pass: `famor2026`).

### 🛠 Em Desenvolvimento / Pendente:
- **Notificações por Email:** O código no `server.js` simula o envio (console.log). Necessita de integração com Resend ou SMTP.
- **Painel de Admin (UI):** O `admin.html` existe mas precisa de ser finalizado para visualização amigável dos pedidos.
- **Otimização de Imagens:** As fotos estão a ser carregadas diretamente. Recomenda-se gerar versões WebP para performance mobile.

---

## 5. Como Executar

### Ambiente Local (com API funcional)
Requer Node.js instalado.
```bash
node server.js
```
Aceder em: `http://localhost:8080`

### Admin
Para ver os pedidos de reserva atuais (via terminal ou ferramenta de API):
`GET http://localhost:8080/api/admin/inquiries` com Header `Authorization: famor2026`.

---

## 6. Próximos Passos Recomendados
1. **Configurar Email:** Ativar a função `sendNotificationEmail` no `server.js`.
2. **SEO:** Afinar as meta-tags para cada página de pacote (`packs/*.html`).
3. **Analytics:** Inserir tag de acompanhamento (GTM ou Plausible) para medir conversões no botão "Reservar".
