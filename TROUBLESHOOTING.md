# 🔧 Guia de Troubleshooting

## Problemas Comuns

### 1. ❌ Erro 500 ao Salvar Cadastro

**Mensagem de erro:**
```
Failed to load resource: the server responded with a status of 500 ()
Error: Erro do servidor
```

**Solução Passo a Passo:**

#### A. Token OAuth não foi salvo

**Sintomas:**
- Logs mostram: `No access, refresh token, API key or refresh handler callback is set`
- Acabou de fazer login
- Tentou logo em seguida salvar cadastro

**Causa:** Token em memória ainda não foi restaurado

**Solução:**
```
1. Acesse: https://seu-dominio/auth
2. Clique em "Autorizar" (Google)
3. Espere mensagem: "✅ Autenticação bem-sucedida! Token salvo."
4. AGUARDE 2-3 SEGUNDOS (crítico!)
5. Volte pra home
6. Tente salvar cadastro novamente
```

#### B. Variável de Ambiente não configurada

**Sintomas:**
- Logs mostram: `OAUTH_CREDENTIALS_JSON não definida`
- Servidor rodando mas login não funciona

**Solução (Railway):**
```
1. Acesse railway.app
2. Abra seu projeto: cadastro-clientes-clube-blindado
3. Clique em "Variables" (ou "Settings" → "Environment Variables")
4. Adicione:
   GOOGLE_DRIVE_FOLDER_ID = 1KcR1VDwRTd9wVJF2H6Pio7heuk1aBQwU
   OAUTH_CREDENTIALS_JSON = {JSON_COMPLETO}
5. Clique em "Redeploy"
6. Aguarde ~1 minuto
7. Teste novamente
```

**Solução (Local):**
```bash
1. Crie arquivo .env na raiz do projeto
2. Copie conteúdo de .env.example
3. Preencha as variáveis
4. Rode: npm start
```

#### C. Redirect URI não registrado no Google

**Sintomas:**
- Logs mostram: `Redirect URI mismatch`
- Tenta fazer login, redireciona pro Google, depois traz erro

**Solução:**
```
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no OAuth 2.0 Client ID (tipo "Web application")
3. Vá até "Authorized redirect URIs"
4. Adicione a URL completa com /auth/callback:
   
   Para Railway Produção:
   https://cadastro-clientes-clube-blindado-production.up.railway.app/auth/callback
   
   Para Local:
   http://localhost:3000/auth/callback

5. Salve
6. Teste novamente
```

---

### 2. ❌ Botão "Salvar Cadastro" fica desabilitado

**Sintoma:** Botão fica cinza mesmo depois de preencher todos os campos

**Causa:** Um ou mais campos falhando na validação

**Debug:**
```
1. Abra Console do navegador (F12)
2. Veja mensagens de erro abaixo de cada campo
3. Exemplo:
   - "Nome deve ter pelo menos 3 caracteres"
   - "Celular deve ter 11 dígitos (com DDD)"
   - "Placa deve conter 7 caracteres alfanuméricos"
   - "Formato deve ser AAAA/AAAA (ex: 2024/2025)"
   - "E-mail inválido"
```

**Validações Corretas:**

| Campo | Regra | Exemplo | ❌ Errado |
|-------|-------|---------|----------|
| **Nome** | 3+ letras, sem números | João Silva | João 123 |
| **Celular** | 11 dígitos, começa com 1 | (11) 98263-4594 | (21) 2222-2222 |
| **Placa** | 7 alfanuméricos | ABC1234 | AB12 |
| **Ano/Modelo** | AAAA/AAAA | 2024/2025 | 24/25 |
| **E-mail** | Com @ e domínio | joao@exemplo.com | joao@exemplo |

**Solução:**
```
1. Verificar cada campo com as regras acima
2. Se ainda não funcionar:
   - Recarregar página (F5)
   - Fazer logout/login (/auth)
   - Limpar cache do navegador
```

---

### 3. ❌ PDF não aparece no Google Drive

**Sintoma:** Salvamento mostra sucesso (modal aparece) mas arquivo não está em `[2-Processamento]`

**Causa:** Folder ID errado ou Google Drive sem acesso à pasta

**Debug:**
```
1. Abre a URL do Google Drive
2. Navega até [2-Processamento]
3. Copia o ID da URL:
   https://drive.google.com/drive/folders/{ESTE_ID}
4. Verifica se é: 1KcR1VDwRTd9wVJF2H6Pio7heuk1aBQwU
```

**Solução se IDs não baterem:**
```
1. Railway Dashboard → Variables
2. Atualiza GOOGLE_DRIVE_FOLDER_ID com o ID correto
3. Redeploy
4. Teste novamente
```

---

### 4. ❌ Encoding quebrado no PDF ("VEÃCULO" em vez de "VEÍCULO")

**Sintoma:** PDF gerado mostra "DADOS DO VEÃ-CULO" em vez de "VEÍCULO"

**Causa:** Arquivo server.js com encoding corrompido

**Solução:**
```bash
# Rápido: fazer reset pra última versão correta
cd modulos/cadastro-clientes
git log --oneline  # Ver commits
git show {COMMIT_HASH}:server.js | grep "VEÍCULO"

# Se encontrar "VEÍCULO" (correto), fazer reset:
git reset --hard {COMMIT_HASH}
git push origin master --force
```

**Prevenção:**
```
- Sempre copiar arquivo inteiro (não regex replace)
- Usar arquivo api/index.js como source of truth
- Verificar com: grep "VEÍCULO" server.js
```

---

### 5. ⚠️ Servidor offline / Error 502 Bad Gateway

**Sintoma:** Página não abre, mostra erro de gateway

**Causa:** Railway container crashou ou está reiniciando

**Solução:**
```
1. Railway Dashboard
2. Clique em "Deployments"
3. Veja status: "Running", "Building" ou "Failed"
4. Se "Failed":
   - Clique em "View Logs"
   - Procure por erro no final
   - Veja seção correspondente aqui
5. Se "Running" mas offline:
   - Vire "Redeploy" (botão verde)
   - Aguarde ~1 minuto
   - Teste novamente
```

---

### 6. 🔄 Mascara de ANO/MODELO não funciona

**Sintoma:** Campo não formata automaticamente, mostra números soltos

**Debug:**
```
1. Abra Console do navegador (F12)
2. Cole: document.getElementById('anoModelo')
3. Pressione Enter
4. Se retorna null, há erro no HTML
5. Se retorna elemento, há erro no script.js
```

**Solução:**
```
1. Verifique que script.js foi carregado:
   - Console: existem erros?
   - Network tab: script.js status 200?

2. Teste script manualmente no Console:
   let input = document.getElementById('anoModelo');
   input.value = '202420250'; // Cole vários números
   // Deve aparecer: 2024/2025

3. Se não funciona:
   - Recarregar página
   - Limpar cache (Ctrl+Shift+Del)
   - Redeployar aplicação
```

---

### 7. 🌐 Como acessar endpoints de debug

**Verificar status do servidor:**
```
https://seu-dominio/api/debug
```

**Retorno esperado:**
```json
{
  "status": "ok",
  "googleAuthReady": true,
  "driveInitialized": true,
  "googleDriveFolderId": "1KcR1VDwRTd9wVJF2H6Pio7heuk1aBQwU",
  "authMethod": "OAuth 2.0 (In-Memory)",
  "message": "✅ Autenticado"
}
```

**Se googleAuthReady for false:**
- Faça login novamente: `/auth`
- Aguarde 2-3 segundos
- Teste novamente

---

## 📋 Checklist de Diagnóstico

Quando algo não funciona, seguir esta ordem:

- [ ] Verificar `/api/debug` → googleAuthReady = true?
- [ ] Se não, fazer `/auth` (login) e aguardar 2-3 seg
- [ ] Verificar console do navegador (F12) → há erros?
- [ ] Verificar Railway logs → há erros no servidor?
- [ ] Validar variáveis de ambiente (`OAUTH_CREDENTIALS_JSON`, `GOOGLE_DRIVE_FOLDER_ID`)
- [ ] Verificar redirect URI no Google Cloud Console
- [ ] Testar cada campo do formulário individualmente
- [ ] Recarregar página (Ctrl+Shift+R hard refresh)
- [ ] Limpar cookies do navegador
- [ ] Fazer redeploy no Railway (se mudança de env var)

---

## 🆘 Quando Nada Funciona

**Nuclear option (reiniciar tudo):**

```bash
# 1. Local development
cd modulos/cadastro-clientes
npm install --force  # Reinstalar dependências
npm start

# 2. Production (Railway)
1. Railway Dashboard
2. Clique em "Settings"
3. "Environment Variables" → Delete all
4. Re-adicione: GOOGLE_DRIVE_FOLDER_ID, OAUTH_CREDENTIALS_JSON
5. Clique "Redeploy"
6. Aguarde ~2 minutos
7. Teste em: https://seu-dominio/api/debug

# 3. Se ainda falhar
1. Verificar logs do Railway
2. Procurar por "Error" ou "TypeError"
3. Googlar a mensagem de erro
4. Se nada funcionar, fazer git reset pra commit anterior
```

---

## 📞 Informações Úteis

### URLs Importantes

```
Production:      https://cadastro-clientes-clube-blindado-production.up.railway.app
Login:          https://cadastro-clientes-clube-blindado-production.up.railway.app/auth
Debug:          https://cadastro-clientes-clube-blindado-production.up.railway.app/api/debug
Status:         https://cadastro-clientes-clube-blindado-production.up.railway.app/api/status

GitHub:         https://github.com/alexandrearrudamoreira/cadastro-clientes-clube-blindado
Google Drive:   https://drive.google.com/drive/folders/1KcR1VDwRTd9wVJF2H6Pio7heuk1aBQwU
Railway:        https://railway.app
Google Cloud:   https://console.cloud.google.com/apis/credentials
```

### Variáveis Críticas

```
GOOGLE_DRIVE_FOLDER_ID       = 1KcR1VDwRTd9wVJF2H6Pio7heuk1aBQwU
OAUTH_CREDENTIALS_JSON       = {JSON com redirect_uris correto}
OAUTH Redirect URI (Google)  = https://seu-dominio/auth/callback
```

---

**Última atualização:** 08/08/2026, 19:56 GMT-3
