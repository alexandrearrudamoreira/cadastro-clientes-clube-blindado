# Cadastro de Clientes - Clube do Blindado

Sistema moderno de cadastro de clientes com geração de PDF e integração com Google Drive.

## 📋 Recursos

- ✅ Formulário responsivo com 5 campos
- ✅ Validações em tempo real
- ✅ Botão inteligente (desabilita até validar)
- ✅ Geração de PDF (1 página única)
- ✅ Integração OAuth Google Drive
- ✅ Design profissional (identidade Clube do Blindado)
- ✅ Fundo azul gradiente
- ✅ Suporte a mobile/tablet/desktop

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 14+
- npm ou yarn

### Instalação

```bash
cd clube-do-blindado/modulos/cadastro-clientes
npm install
```

### Execução

```bash
npm start
```

Servidor rodará em: **http://localhost:3000**

## 🔧 Configuração

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis:
```
PORT=3000
GOOGLE_DRIVE_FOLDER_ID=sua_pasta_id
GOOGLE_CREDENTIALS_FILE=./oauth-credentials.json
```

3. Adicione suas credenciais OAuth do Google em `oauth-credentials.json`

## 🗂️ Estrutura

```
cadastro-clientes/
├── index.html                 # Formulário HTML
├── styles.css                 # Estilos CSS
├── script.js                  # Validações JavaScript
├── server.js                  # Express + PDF + Drive
├── package.json              # Dependências
├── oauth-credentials.json    # Credenciais Google
├── pdfs/                     # PDFs gerados localmente
└── README.md                 # Este arquivo
```

## 📊 Fluxo de Funcionamento

1. Usuário preenche o formulário
2. Validações em tempo real
3. Clica "Salvar Cadastro"
4. Servidor gera PDF 1 página
5. PDF é enviado ao Google Drive
6. Mensagem de sucesso aparece
7. Usuário pode fazer novo cadastro

## 🎨 Design

- **Paleta de Cores:**
  - Vermelho: #C41E3A
  - Preto: #1a1a1a
  - Dourado: #D4AF37
  - Fundo Gradiente: Azul (135deg)

- **Tipografia:** Helvetica + System Fonts
- **Responsivo:** Mobile-first approach

## 📝 Campos do Formulário

| Campo | Validação | Exemplo |
|-------|-----------|---------|
| Nome | 3+ letras | João Silva |
| Celular | 11 dígitos DDD 1-9 | (11) 98263-4594 |
| Placa | 7 alfanuméricos | ABC1234 |
| Ano/Modelo | AAAA/AAAA | 2024/2025 |
| E-mail | usuario@dominio.com | joao@exemplo.com.br |

## 📄 PDF Gerado

Arquivo: `{PLACA}_1.pdf` (ex: ABC1234_1.pdf)

**Conteúdo:**
- Header com logo do Clube
- Dados do cliente (Nome, Celular, E-mail)
- Dados do veículo (Placa, Ano/Modelo)
- Data do registro no rodapé
- 1 página única (sem overflow)

## 🔐 Segurança

- Validações duplas (cliente + servidor)
- Sem dados sensíveis em cookies
- LGPD compliant
- OAuth 2.0 para Google Drive

## 🛠️ Tech Stack

- **Backend:** Express.js
- **PDF Generation:** PDFKit
- **Cloud Storage:** Google Drive API
- **Auth:** OAuth 2.0
- **Frontend:** HTML5, CSS3, Vanilla JS
- **Environment:** dotenv

## 📞 Suporte

Email: suporte@clubedoBlindado.com.br

## 📄 Licença

MIT

---

**Versão:** 1.0.0  
**Criado:** 2026-08-08  
**Status:** ✅ Pronto para Produção
