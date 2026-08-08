# 📋 Cadastro de Clientes - Clube do Blindado

**Status:** ✅ **PRONTO PARA PRODUÇÃO**

URL Produção: https://cadastro-clientes-clube-blindado-production.up.railway.app

---

## 📖 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologia](#tecnologia)
- [Setup Local](#setup-local)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Lições Aprendidas](#lições-aprendidas)

---

## 🎯 Visão Geral

Sistema profissional de cadastro de clientes para o Clube do Blindado. Permite que clientes preencham um formulário com seus dados, gera um PDF com 1 página e salva automaticamente no Google Drive.

**Fluxo:**
1. Cliente preenche formulário (5 campos)
2. Sistema valida dados em tempo real
3. Clica "Salvar Cadastro"
4. PDF é gerado (1 página única)
5. Arquivo é salvo no Google Drive em `[2-Processamento]`
6. Modal de sucesso aparece

---

## ✨ Funcionalidades

### Formulário (5 campos)
- ✅ **Nome:** 3+ letras, apenas caracteres alfabéticos
- ✅ **Celular:** 11 dígitos (DDD 1-9), auto-formata: `(XX) XXXXX-XXXX`
- ✅ **Placa:** 7 alfanuméricos, auto-uppercase: `ABC1234`
- ✅ **Ano/Modelo:** `AAAA/AAAA`, auto-formata (digita só números!)
- ✅ **E-mail:** Validação de formato

### Validações
- ✅ Validações em **tempo real** (enquanto digita)
- ✅ Botão **inteligente:** desabilitado até todos campos estarem válidos
- ✅ **Dupla validação:** cliente + servidor
- ✅ Mensagens de erro claras por campo

### PDF Gerado
- ✅ **1 página única** (bem compactado)
- ✅ **Profissional:** identidade visual Clube do Blindado
- ✅ **Cores:** Vermelho (#C41E3A), Preto (#1a1a1a), Dourado (#D4AF37)
- ✅ **Logo:** 75x75px no header
- ✅ **Seções:** Dados do Cliente + Dados do Veículo
- ✅ **Data/Hora:** Registrada automaticamente

### Google Drive Integration
- ✅ **OAuth 2.0:** Autenticação segura
- ✅ **Pasta:** `[2-Processamento]` no Google Drive
- ✅ **Nomeação:** `{PLACA}_1.pdf` (ex: `TLQ7I21_1.pdf`)
- ✅ **Sobrescrita:** Reutiliza arquivo se já existe (sem duplicatas)
- ✅ **Persistência:** Token salvo em memória durante sessão

### UX/UI
- ✅ **Responsivo:** Mobile, Tablet, Desktop
- ✅ **Feedback Visual:** 
  - Cursor muda pra ampulheta ⏳ durante processamento
  - Botão mostra "⏳ Processando..."
  - Modal de sucesso com botão X
- ✅ **Design Premium:** Fundo azul gradiente, card branco
- ✅ **Sem placeholders:** Campos vazios, label acima

---

## 🛠️ Tecnologia

```
Frontend:        HTML5 + CSS3 + Vanilla JavaScript
Backend:         Node.js (v18+) + Express.js
PDF Generation:  PDFKit
Google Drive:    Google Drive API v3 (OAuth 2.0)
Hosting:         Railway.app (containerized Node.js)
Versioning:      Git + GitHub
Auto-Deploy:     GitHub → Railway (CI/CD)
```

**Dependências Principal:**
```json
{
  "express": "^4.x",
  "pdfkit": "^0.13.0",
  "googleapis": "^118.0.0",
  "dotenv": "^16.0.0"
}
```

---

## 🚀 Setup Local

### Pré-requisitos
- Node.js v18+ instalado
- npm ou yarn
- Arquivo `oauth-credentials.json` com credenciais Google

### Instalação

```bash
# 1. Entrar na pasta
cd modulos/cadastro-clientes

# 2. Instalar dependências
npm install

# 3. Copiar e configurar variáveis
cp .env.example .env
# Editar .env com suas variáveis

# 4. Rodar servidor local
npm start
# Servidor em: http://localhost:3000

# 5. Abrir no navegador
open http://localhost:3000
```

### Fluxo de Teste Local

1. **Primeiro login:**
   ```
   http://localhost:3000/auth
   → Redireciona para Google
   → Autoriza acesso ao Google Drive
   → Token é salvo em `globalTokens` (memória)
   ```

2. **Salvar cadastro:**
   ```
   http://localhost:3000/
   → Preenche formulário
   → Clica "Salvar Cadastro"
   → PDF é gerado e salvo no Drive
   ```

3. **Verificar arquivo:**
   ```
   Google Drive → [2-Processamento] → {PLACA}_1.pdf
   ```

---

## 🔐 Variáveis de Ambiente

### Local Development (.env)

```bash
# Google Drive
GOOGLE_DRIVE_FOLDER_ID=1KcR1VDwRTd9wVJF2H6Pio7heuk1aBQwU

# OAuth Credentials (JSON completo)
OAUTH_CREDENTIALS_JSON={
  "installed": {
    "client_id": "xxx.apps.googleusercontent.com",
    "client_secret": "***",
    "redirect_uris": [
      "http://localhost:3000/auth/callback"
    ],
    ...
  }
}

# Port (opcional, default 3000)
PORT=3000
```

### Production (Railway)

No dashboard do Railway, adicionar:

```
GOOGLE_DRIVE_FOLDER_ID = 1KcR1VDwRTd9wVJF2H6Pio7heuk1aBQwU

OAUTH_CREDENTIALS_JSON = {JSON_COMPLETO_COM_REDIRECT_VERCEL}
```

⚠️ **CRÍTICO:** O `redirect_uris` deve apontar para a URL de produção:
```
https://cadastro-clientes-clube-blindado-production.up.railway.app/auth/callback
```

---

## 📦 Deployment

### Railway.app (Recomendado)

**Vantagens:**
- ✅ Nativo para Express (melhor que Vercel)
- ✅ Containerização automática
- ✅ Auto-deploy via GitHub webhook
- ✅ Variáveis de ambiente fáceis
- ✅ Free tier generoso

**Passos:**

1. **Conectar GitHub**
   - Railway.app → "New Project"
   - "Deploy from GitHub"
   - Selecionar repositório

2. **Configurar Variáveis**
   - Railway Dashboard → "Variables"
   - Adicionar `GOOGLE_DRIVE_FOLDER_ID` e `OAUTH_CREDENTIALS_JSON`

3. **Configurar Redirect URI no Google**
   - Google Cloud Console → OAuth credentials
   - Adicionar redirect URI:
     ```
     https://cadastro-clientes-clube-blindado-production.up.railway.app/auth/callback
     ```

4. **Deploy Automático**
   - Cada push em `main` → Railway faz rebuild automaticamente

### Monitoramento

```bash
# Logs em tempo real
railway.app → "Deployments" → "Logs"

# Endpoint de debug
https://seu-dominio/api/debug
# Mostra:
# {
#   "googleAuthReady": true/false,
#   "driveInitialized": true/false,
#   "message": "✅ Autenticado" ou "❌ Não autenticado"
# }
```

---

## 🐛 Troubleshooting

### Problema: Erro 500 ao salvar cadastro

**Sintoma:**
```
Failed to load resource: the server responded with a status of 500
Error: Erro do servidor
```

**Causas Possíveis:**

#### 1. Token OAuth não está salvo
```
Logs mostram: "No access, refresh token, API key... is set"
```

**Solução:**
```
1. Acesse /auth e faça login novamente
2. Aguarde 2-3 segundos após "Token salvo"
3. Volte pra home
4. Tente salvar cadastro
```

#### 2. Variáveis de Ambiente não configuradas
```
Logs mostram: "OAUTH_CREDENTIALS_JSON não definida"
```

**Solução:**
```
Railway Dashboard:
1. Vá para "Variables"
2. Adicione OAUTH_CREDENTIALS_JSON com JSON válido
3. Redeploy project
```

#### 3. Redirect URI não registrado no Google

```
Logs mostram: "Redirect URI mismatch"
```

**Solução:**
```
Google Cloud Console:
1. OAuth 2.0 Client IDs
2. Authorized redirect URIs
3. Adicione:
   https://seu-dominio/auth/callback
4. Salve
```

### Problema: Botão não ativa (sempre desabilitado)

**Sintoma:** Botão "Salvar Cadastro" fica cinza mesmo preenchendo tudo

**Causa:** Validação está falhando

**Debug:**
```javascript
// Abrir Console do navegador (F12)
// Ver mensagens de erro dos campos
// Exemplo: "Celular deve ter 11 dígitos"
```

**Solução:**
```
1. Verificar formato de cada campo:
   - Nome: 3+ letras, sem números
   - Celular: 11 dígitos, começa com 1 (DDD)
   - Placa: 7 alfanuméricos
   - Ano/Modelo: 4 dígitos, /, 4 dígitos
   - E-mail: formato válido (com @)

2. Se ainda não ativa, fazer logout/login
```

### Problema: PDF não aparece no Google Drive

**Sintoma:** Salvamento funciona, mas arquivo não está em `[2-Processamento]`

**Causa:** Folder ID errado ou Google Drive não tem acesso

**Solução:**
```
1. Verificar GOOGLE_DRIVE_FOLDER_ID
2. No Google Drive, abrir [2-Processamento]
3. Copiar ID da URL:
   https://drive.google.com/drive/folders/{FOLDER_ID}
4. Atualizar variável no Railway
5. Fazer deploy novamente
```

### Problema: Encoding quebrado no PDF

**Sintoma:** PDF mostra "VEÃCULO" em vez de "VEÍCULO"

**Solução:**
```
Esse problema foi RESOLVIDO!
Se aparecer novamente:
1. Verificar encoding do arquivo server.js (UTF-8)
2. Fazer git reset para commit anterior
3. Fazer deploy novamente
```

---

## 📚 Lições Aprendidas

### 1. Persistência de Token em Serverless
**Problema:** Em plataformas como Vercel (serverless), tokens salvos em arquivo desaparecem.

**Solução:** 
- ✅ Usar variáveis **globais em memória** (`globalTokens`)
- ✅ Restaurar token no middleware **ANTES** das rotas
- ✅ Aceitar que token se perde ao redeploy (user faz login novamente)

**Código:**
```javascript
let globalTokens = null;

app.use((req, res, next) => {
    if (globalTokens && oauth2Client) {
        oauth2Client.setCredentials(globalTokens);
        drive = google.drive({ version: 'v3', auth: oauth2Client });
        googleAuthReady = true;
    }
    next();
});

app.get('/auth/callback', async (req, res) => {
    const { tokens } = await oauth2Client.getToken(code);
    globalTokens = tokens; // SALVA GLOBALMENTE
    // ...
});
```

### 2. Redirect URI é Crítico
**Problema:** "Redirect URI mismatch" - OAuth falha se URI não bate exatamente

**Solução:**
- ✅ Registrar TODOS os possíveis URIs no Google Cloud Console:
  ```
  http://localhost:3000/auth/callback
  https://seu-dominio/auth/callback
  https://seu-dominio-prod/auth/callback
  ```
- ✅ Usar variável de ambiente se houver múltiplos ambientes

### 3. Vercel vs Railway para Express
**Aprendizado:**
- ❌ Vercel é feito para Next.js (routing complexo, serverless)
- ✅ Railway é feito para Express (container simples, app.listen())

**Diferenças:**
| Aspecto | Vercel | Railway |
|--------|--------|---------|
| Setup | Complexo (vercel.json) | Simples (detecta Node.js) |
| Routing | Automático em /api | Automático via Express |
| Filesystem | Read-only | /tmp disponível |
| Logs | Função/Lambda logs | Logs simples |

### 4. Encoding UTF-8 em Strings
**Problema:** Caracteres acentuados quebrados no PDF (VEÃCULO)

**Causas:**
- ❌ Git commit com encoding errado
- ❌ Copy-paste de arquivo com encoding diferente
- ❌ PowerShell com locale não-UTF8

**Solução:**
- ✅ Sempre salvar com `UTF-8 sem BOM`
- ✅ Usar `api/index.js` como source of truth
- ✅ Copiar arquivo inteiro (não regex replace)

### 5. Middleware Order Matter
**Problema:** Token não era restaurado nas requisições

**Causa:** Middleware foi definido DEPOIS das rotas

**Solução:**
```javascript
// ❌ ERRADO
app.get('/api/cadastro', ...)  // Rotas primeiro
app.use(middleware)            // Middleware depois (NÃO FUNCIONA!)

// ✅ CERTO
app.use(middleware)            // Middleware primeiro
app.get('/api/cadastro', ...)  // Rotas depois
```

### 6. Máscaras de Input Automáticas
**Implementação de ANO/MODELO:**
```javascript
// Usuário digita: 2024 2025
// Campo mostra:  2024/2025 (automático!)

anoModeloInput.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, ''); // Remove não-números
    if (valor.length > 8) valor = valor.slice(0, 8); // Max 8 dígitos
    
    if (valor.length <= 4) {
        e.target.value = valor;                      // "2024"
    } else {
        e.target.value = `${valor.slice(0, 4)}/${valor.slice(4, 8)}`; // "2024/2025"
    }
});
```

### 7. Feedback Visual Durante Processamento
**Implementação:**
```javascript
// Antes do processamento
submitBtn.disabled = true;
submitBtn.style.cursor = 'wait';      // Ampulheta ⏳
submitBtn.textContent = '⏳ Processando...';

// Após sucesso/erro
submitBtn.disabled = false;
submitBtn.style.cursor = 'pointer';   // Normal
submitBtn.textContent = 'Salvar Cadastro';
```

---

## 📋 Checklist Pré-Produção

- [x] Código testado localmente
- [x] Variáveis de ambiente configuradas
- [x] Redirect URI registrado no Google Cloud
- [x] Encoding UTF-8 verificado
- [x] PDF gerado com 1 página única
- [x] Google Drive integration testado
- [x] Responsiveness testado (mobile/desktop)
- [x] Validações funcionando
- [x] Feedback visual implementado
- [x] Logs de debug adicionados
- [x] Documentação completa
- [x] GitHub commit final
- [x] Railway deploy funcional

---

## 🎯 Próximos Passos (Futuros)

### Possíveis Melhorias
- [ ] Salvar dados também em banco de dados (Supabase)
- [ ] Enviar email de confirmação ao cliente
- [ ] Dashboard de estatísticas (quantos cadastros)
- [ ] Editar cadastros existentes
- [ ] Autenticação de admin (proteger dashboard)
- [ ] Integração com WhatsApp (notificar cliente)
- [ ] Multi-idioma (português/inglês)

### Monitoramento
- [ ] Setup de logs centralizados (Sentry)
- [ ] Alertas de erros
- [ ] Métricas de performance

---

## 📞 Suporte

Para problemas:

1. **Verificar logs:** Railway Dashboard → "Logs"
2. **Testar endpoint de debug:** `/api/debug`
3. **Verificar variáveis:** Railway → "Variables"
4. **Fazer login novamente:** `/auth`

---

**Versão:** 1.0.0  
**Última atualização:** 08/08/2026, 19:56 GMT-3  
**Status:** ✅ Pronto para Produção  
**URL:** https://cadastro-clientes-clube-blindado-production.up.railway.app
