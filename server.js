// Servidor - Cadastro de Clientes (Railway Deployment + Token Persistence)
const express = require('express');
const path = require('path');
const PDFDocument = require('pdfkit');
const { google } = require('googleapis');
const fs = require('fs');
const stream = require('stream');
const dotenv = require('dotenv');

try {
    dotenv.config();
} catch (e) {
    console.log('Aviso: arquivo .env não encontrado');
}

const app = express();

console.log('🚀 Inicializando API Cadastro de Clientes...');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Google Drive Setup
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1KcR1VDwRTd9wVJF2H6Pio7heuk1aBQwU';

// Arquivo para persistir token entre reinicializações
const TOKEN_FILE_PATH = path.join('/tmp', 'oauth-token.json');

let drive = null;
let googleAuthReady = false;
let oauth2Client = null;
let globalTokens = null; // Persistência de token em memória + arquivo

// Inicializar Google Drive com OAuth
const initGoogleDrive = async () => {
    try {
        let credentials;
        
        // Tentar ler da variável de ambiente (Railway) primeiro
        if (process.env.OAUTH_CREDENTIALS_JSON) {
            credentials = JSON.parse(process.env.OAUTH_CREDENTIALS_JSON).installed;
            console.log('✅ Credenciais OAuth carregadas da variável de ambiente');
        } else {
            // Fallback para arquivo local (desenvolvimento)
            const oauthFile = path.join(__dirname, 'oauth-credentials.json');
            if (!fs.existsSync(oauthFile)) {
                throw new Error('oauth-credentials.json não encontrado e OAUTH_CREDENTIALS_JSON não definida');
            }
            credentials = JSON.parse(fs.readFileSync(oauthFile, 'utf8')).installed;
            console.log('✅ Credenciais OAuth carregadas do arquivo local');
        }
        
        oauth2Client = new google.auth.OAuth2(
            credentials.client_id,
            credentials.client_secret,
            credentials.redirect_uris[0]
        );
        
        drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });
        
        googleAuthReady = true;
        console.log('✅ Google Drive OAuth pronto');
    } catch (erro) {
        console.warn('⚠️  Google Drive não inicializado:', erro.message);
        googleAuthReady = false;
    }
};

initGoogleDrive();

// Função: Restaurar token do arquivo (se existir)
function restaurarTokenDoArquivo() {
    try {
        if (fs.existsSync(TOKEN_FILE_PATH)) {
            const tokenSalvo = JSON.parse(fs.readFileSync(TOKEN_FILE_PATH, 'utf8'));
            globalTokens = tokenSalvo;
            console.log('🔐 Token restaurado do arquivo /tmp/oauth-token.json');
            return true;
        }
    } catch (erro) {
        console.warn('⚠️  Erro ao restaurar token do arquivo:', erro.message);
    }
    return false;
}

// Função: Renovar access_token usando refresh_token
async function renovarAccessToken() {
    try {
        if (!globalTokens || !globalTokens.refresh_token) {
            console.warn('⚠️  Nenhum refresh_token disponível para renovar');
            return false;
        }
        
        console.log('🔄 Renovando access_token usando refresh_token...');
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Atualizar tokens globais
        globalTokens = credentials;
        
        // Salvar novo token em arquivo
        try {
            fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(credentials), 'utf8');
            console.log('💾 Access_token renovado e salvo em arquivo');
        } catch (erro) {
            console.warn('⚠️  Erro ao salvar token renovado:', erro.message);
        }
        
        return true;
    } catch (erro) {
        console.error('❌ Erro ao renovar access_token:', erro.message);
        return false;
    }
}

// Função: Verificar se token expirou
function tokenExpirou() {
    if (!globalTokens || !globalTokens.expiry_date) {
        return true; // Se não tem token, considerado expirado
    }
    
    const agora = Date.now();
    const expiryMs = globalTokens.expiry_date; // Já em milissegundos
    const margemSeguranca = 5 * 60 * 1000; // 5 minutos antes de expirar
    
    return (agora + margemSeguranca) >= expiryMs;
}

// Tentar restaurar token ao iniciar
restaurarTokenDoArquivo();

// Função: Gerar PDF (1 página única)
async function gerarPDF(dados) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 30
            });

            let buffers = [];
            
            doc.on('data', (data) => {
                buffers.push(data);
            });

            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });

            doc.on('error', reject);

            // Área do Header (fundo preto)
            doc.rect(0, 0, doc.page.width, 50)
                .fill('#1a1a1a');

            // Título
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .fillColor('#C41E3A')
               .text('CLUBE DO BLINDADO', 30, 14);

            doc.fillColor('#333333');
            let yPos = 65;

            // Título Seção 1
            doc.fontSize(9)
               .font('Helvetica-Bold')
               .fillColor('#C41E3A')
               .text('DADOS DO CLIENTE', 30, yPos);
            yPos += 10;

            // Nome
            doc.fontSize(7)
               .font('Helvetica-Bold')
               .fillColor('#333333')
               .text('Nome:', 30, yPos);
            doc.fontSize(8)
               .font('Helvetica')
               .text(dados.nomeCliente, 90, yPos);
            yPos += 9;

            // Celular
            doc.fontSize(7)
               .font('Helvetica-Bold')
               .fillColor('#333333')
               .text('Celular:', 30, yPos);
            doc.fontSize(8)
               .font('Helvetica')
               .text(dados.celular, 90, yPos);
            yPos += 9;

            // E-mail
            doc.fontSize(7)
               .font('Helvetica-Bold')
               .fillColor('#333333')
               .text('E-mail:', 30, yPos);
            doc.fontSize(8)
               .font('Helvetica')
               .text(dados.email.substring(0, 45), 90, yPos);
            yPos += 15;

            // Título Seção 2
            doc.fontSize(9)
               .font('Helvetica-Bold')
               .fillColor('#C41E3A')
               .text('DADOS DO VEÍCULO', 30, yPos);
            yPos += 10;

            // Placa
            doc.fontSize(7)
               .font('Helvetica-Bold')
               .fillColor('#333333')
               .text('Placa:', 30, yPos);
            doc.fontSize(8)
               .font('Helvetica')
               .text(dados.placa.toUpperCase(), 90, yPos);
            yPos += 9;

            // Ano/Modelo
            doc.fontSize(7)
               .font('Helvetica-Bold')
               .fillColor('#333333')
               .text('Ano/Modelo:', 30, yPos);
            doc.fontSize(8)
               .font('Helvetica')
               .text(dados.anoModelo, 90, yPos);
            yPos += 20;

            // Linha divisória
            doc.moveTo(30, yPos)
               .lineTo(565, yPos)
               .stroke('#D4AF37');
            yPos += 8;

            // Rodapé
            doc.fontSize(6)
               .font('Helvetica')
               .fillColor('#666666')
               .text('Data do Registro: ' + dados.dataRegistro, 30, yPos);
            
            doc.fontSize(6)
               .fillColor('#999999')
               .text('© 2026 Clube do Blindado', 30, yPos + 10);

            doc.end();

        } catch (erro) {
            reject(erro);
        }
    });
}

// Função: Buscar arquivo existente no Drive
async function buscarArquivoNoDrive(nomeArquivo) {
    try {
        const response = await drive.files.list({
            q: `name='${nomeArquivo}' and parents='${GOOGLE_DRIVE_FOLDER_ID}' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)',
            pageSize: 1
        });
        
        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id;
        }
        return null;
    } catch (erro) {
        console.warn('⚠️  Erro ao buscar arquivo:', erro.message);
        return null;
    }
}

// Função: Salvar no Google Drive
async function salvarNoDrive(nomeArquivo, pdfBuffer) {
    if (!googleAuthReady || !drive) {
        console.warn('❌ Google Drive não autenticado. Não será possível salvar.');
        return {
            savedToDrive: false,
            error: 'Google Drive não autenticado'
        };
    }
    
    try {
        const arquivoExistenteId = await buscarArquivoNoDrive(nomeArquivo);
        
        let fileId = null;
        
        if (arquivoExistenteId) {
            console.log(`📝 Arquivo "${nomeArquivo}" já existe. Sobrepondo...`);
            
            const media = {
                mimeType: 'application/pdf',
                body: stream.Readable.from([pdfBuffer])
            };
            
            await drive.files.update({
                fileId: arquivoExistenteId,
                media: media
            });
            
            fileId = arquivoExistenteId;
            console.log(`✅ Arquivo atualizado no Google Drive: ${fileId}`);
        } else {
            const fileMetadata = {
                name: nomeArquivo,
                parents: [GOOGLE_DRIVE_FOLDER_ID]
            };

            const media = {
                mimeType: 'application/pdf',
                body: stream.Readable.from([pdfBuffer])
            };

            const arquivo = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, webViewLink'
            });

            fileId = arquivo.data.id;
            console.log(`✅ Arquivo criado no Google Drive: ${fileId}`);
        }
        
        return {
            savedToDrive: true,
            id: fileId,
            fileName: nomeArquivo
        };

    } catch (erro) {
        console.error('❌ Erro ao salvar no Google Drive:', erro.message);
        return {
            savedToDrive: false,
            error: erro.message
        };
    }
}

// MIDDLEWARE: Restaurar token e renovar se expirado
app.use(async (req, res, next) => {
    // Tentar restaurar do arquivo se globalTokens estiver vazio
    if (!globalTokens) {
        restaurarTokenDoArquivo();
    }
    
    // Verificar se token expirou e renovar se necessário
    if (globalTokens && tokenExpirou()) {
        console.log('⏰ Token expirado ou próximo de expirar, renovando...');
        const renovouComSucesso = await renovarAccessToken();
        
        if (!renovouComSucesso) {
            console.error('❌ Falha ao renovar token. User precisa fazer login de novo.');
            globalTokens = null;
            googleAuthReady = false;
        }
    }
    
    if (globalTokens && oauth2Client) {
        oauth2Client.setCredentials(globalTokens);
        drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });
        googleAuthReady = true;
    }
    next();
});

// Rota: Página principal (serve index.html da pasta public)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota: API - Cadastro
app.post('/api/cadastro', async (req, res) => {
    try {
        const dados = req.body;

        console.log('\n🔄 Processando cadastro...');
        console.log(`📋 Cliente: ${dados.nomeCliente}`);
        console.log(`🚗 Placa: ${dados.placa}`);

        if (!dados.nomeCliente || !dados.celular || !dados.placa || !dados.anoModelo || !dados.email) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Todos os campos são obrigatórios'
            });
        }

        console.log('📄 Gerando PDF...');
        const pdfBuffer = await gerarPDF(dados);

        const nomeArquivo = `${dados.placa.toUpperCase()}_1.pdf`;

        console.log(`💾 Salvando "${nomeArquivo}" no Google Drive...`);
        const resultadoDrive = await salvarNoDrive(nomeArquivo, pdfBuffer);

        if (!resultadoDrive.savedToDrive) {
            console.error(`❌ Falha ao salvar no Google Drive: ${resultadoDrive.error}`);
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao salvar arquivo no Google Drive: ' + resultadoDrive.error
            });
        }

        console.log(`✅ Cadastro salvo com sucesso no Google Drive!\n`);
        res.json({
            sucesso: true,
            mensagem: 'Cadastro salvo com sucesso!',
            nomeArquivo: nomeArquivo,
            driveId: resultadoDrive.id
        });

    } catch (erro) {
        console.error('❌ Erro no cadastro:', erro);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao processar cadastro: ' + erro.message
        });
    }
});

// Rota: Logout (deletar token)
app.get('/logout', (req, res) => {
    try {
        if (fs.existsSync(TOKEN_FILE_PATH)) {
            fs.unlinkSync(TOKEN_FILE_PATH);
            console.log('🔓 Token deletado: /tmp/oauth-token.json');
        }
        globalTokens = null;
        googleAuthReady = false;
        res.send('✅ Logout realizado! Token deletado. <a href="/">Voltar</a>');
    } catch (erro) {
        console.error('❌ Erro ao fazer logout:', erro.message);
        res.status(500).send('❌ Erro ao fazer logout: ' + erro.message);
    }
});

// Rota: Autenticação OAuth
app.get('/auth', (req, res) => {
    try {
        let credentials;
        
        // Tentar ler da variável de ambiente (Railway) primeiro
        if (process.env.OAUTH_CREDENTIALS_JSON) {
            credentials = JSON.parse(process.env.OAUTH_CREDENTIALS_JSON).installed;
        } else {
            // Fallback para arquivo local (desenvolvimento)
            const oauthFile = path.join(__dirname, 'oauth-credentials.json');
            credentials = JSON.parse(fs.readFileSync(oauthFile, 'utf8')).installed;
        }
        
        // Usar o redirect_uri correto (do arquivo de credenciais)
        const redirectUri = credentials.redirect_uris[0];
        
        oauth2Client = new google.auth.OAuth2(
            credentials.client_id,
            credentials.client_secret,
            redirectUri
        );
        
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive']
        });
        
        console.log('🔐 Redirecionando para autenticação Google...');
        console.log(`   Redirect URI: ${redirectUri}`);
        res.redirect(authUrl);
    } catch (erro) {
        console.error('❌ Erro ao iniciar autenticação:', erro.message);
        res.status(500).send('Erro ao iniciar autenticação: ' + erro.message);
    }
});

app.get('/auth/callback', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) throw new Error('Código de autorização não recebido');
        
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        
        // Salvar token globalmente para persistir entre requisições
        globalTokens = tokens;
        
        // Salvar token em arquivo /tmp para persistir entre reinicializações
        // IMPORTANTE: Google fornece refresh_token (válido indefinidamente)
        // Usar refresh_token para renovar access_token quando expirar
        try {
            fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokens), 'utf8');
            console.log('💾 Token OAuth salvo em arquivo: /tmp/oauth-token.json');
            
            if (tokens.refresh_token) {
                console.log('✅ Refresh_token disponível - auto-renovação de token habilitada!');
            } else {
                console.warn('⚠️  Aviso: refresh_token não fornecido pelo Google');
            }
        } catch (erro) {
            console.warn('⚠️  Aviso: Não foi possível salvar token em arquivo:', erro.message);
        }
        
        console.log('🔐 Token OAuth salvo em globalTokens:', !!globalTokens);
        
        drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });
        googleAuthReady = true;
        
        console.log('✅ Token restaurado para próximas requisições');
        res.send('✅ Autenticação bem-sucedida! Token salvo em memória e arquivo. Você pode fechar esta janela.');
    } catch (erro) {
        res.status(500).send('❌ Erro na autenticação: ' + erro.message);
        console.error('Erro no callback:', erro);
    }
});

// Rota: Debug (mostra status de autenticação e refresh token)
app.get('/api/debug', (req, res) => {
    const tokenArmazenado = fs.existsSync(TOKEN_FILE_PATH) ? '✅ Sim' : '❌ Não';
    
    let temRefreshToken = '❌ Não';
    let tokenExpiradoStatus = 'N/A';
    let minutosAteExpirar = 'N/A';
    
    if (globalTokens) {
        temRefreshToken = globalTokens.refresh_token ? '✅ Sim (auto-renovação habilitada!)' : '❌ Não';
        
        if (globalTokens.expiry_date) {
            const agora = Date.now();
            const expiryMs = globalTokens.expiry_date;
            const diferenca = expiryMs - agora;
            
            tokenExpiradoStatus = diferenca > 0 ? '✅ Válido' : '❌ Expirado';
            minutosAteExpirar = Math.floor(diferenca / 1000 / 60);
        }
    }
    
    res.json({
        status: 'ok',
        googleAuthReady: googleAuthReady,
        driveInitialized: drive !== null,
        googleDriveFolderId: GOOGLE_DRIVE_FOLDER_ID,
        authMethod: 'OAuth 2.0 (In-Memory + /tmp + Refresh Token)',
        tokenArmazenadoEmArquivo: tokenArmazenado,
        temRefreshToken: temRefreshToken,
        tokenStatus: tokenExpiradoStatus,
        minutosAteExpirar: minutosAteExpirar !== 'N/A' ? `${minutosAteExpirar} minutos` : 'N/A',
        message: googleAuthReady ? '✅ Autenticado (auto-renovação ativa)' : '❌ Não autenticado - Acesse /auth'
    });
});

// Rota: Status
app.get('/api/status', (req, res) => {
    const tokenArmazenado = fs.existsSync(TOKEN_FILE_PATH);
    
    let temRefreshToken = false;
    if (globalTokens && globalTokens.refresh_token) {
        temRefreshToken = true;
    }
    
    res.json({
        servidor: 'online',
        modulo: 'cadastro-clientes',
        googleDriveReady: googleAuthReady,
        authMethod: 'OAuth 2.0 (In-Memory + /tmp + Refresh Token)',
        tokenArmazenadoEmArquivo: tokenArmazenado,
        temRefreshToken: temRefreshToken,
        autoRenovacaoHabilitada: temRefreshToken ? 'Sim' : 'Não',
        caminhoToken: TOKEN_FILE_PATH,
        environment: 'production',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor (Railway usa porta do env)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 CLUBE DO BLINDADO - Cadastro de Clientes`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n🌐 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📁 Pasta Google Drive: ${GOOGLE_DRIVE_FOLDER_ID}`);
    console.log(`📄 Token armazenado em: ${TOKEN_FILE_PATH}`);
    console.log(`🔐 Autenticação: OAuth 2.0 (In-Memory + /tmp + Refresh Token)`);
    console.log(`🔄 Auto-renovação de token: ATIVADA ✅`);
    console.log(`\n🌍 Abra no navegador: http://localhost:${PORT}`);
    console.log(`🔐 Para fazer login: http://localhost:${PORT}/auth`);
    console.log(`🔓 Para fazer logout: http://localhost:${PORT}/logout`);
    console.log(`🐛 Para debug: http://localhost:${PORT}/api/debug`);
    console.log(`${'='.repeat(60)}\n`);
});

module.exports = app;
