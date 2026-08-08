// Servidor - Cadastro de Clientes (Serverless para Vercel)
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
    console.log('Aviso: arquivo .env nÃ£o encontrado');
}

const app = express();

console.log('ðŸš€ Inicializando API Cadastro de Clientes...');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estÃ¡ticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Google Drive Setup
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1KcR1VDwRTd9wVJF2H6Pio7heuk1aBQwU';

let drive = null;
let googleAuthReady = false;

// Inicializar Google Drive com OAuth
const initGoogleDrive = async () => {
    try {
        let credentials;
        
        // Tentar ler da variÃ¡vel de ambiente (Vercel) primeiro
        if (process.env.OAUTH_CREDENTIALS_JSON) {
            credentials = JSON.parse(process.env.OAUTH_CREDENTIALS_JSON).installed;
            console.log('âœ… Credenciais OAuth carregadas da variÃ¡vel de ambiente');
        } else {
            // Fallback para arquivo local (desenvolvimento)
            const oauthFile = path.join(__dirname, 'oauth-credentials.json');
            if (!fs.existsSync(oauthFile)) {
                throw new Error('oauth-credentials.json nÃ£o encontrado e OAUTH_CREDENTIALS_JSON nÃ£o definida');
            }
            credentials = JSON.parse(fs.readFileSync(oauthFile, 'utf8')).installed;
            console.log('âœ… Credenciais OAuth carregadas do arquivo local');
        }
        
        const oauth2Client = new google.auth.OAuth2(
            credentials.client_id,
            credentials.client_secret,
            credentials.redirect_uris[0]
        );
        
        drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });
        
        googleAuthReady = true;
        console.log('âœ… Google Drive OAuth pronto');
    } catch (erro) {
        console.warn('âš ï¸  Google Drive nÃ£o inicializado:', erro.message);
        googleAuthReady = false;
    }
};

initGoogleDrive();

// FunÃ§Ã£o: Gerar PDF (1 pÃ¡gina Ãºnica)
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

            // Ãrea do Header (fundo preto)
            doc.rect(0, 0, doc.page.width, 50)
                .fill('#1a1a1a');

            // TÃ­tulo
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .fillColor('#C41E3A')
               .text('CLUBE DO BLINDADO', 30, 14);

            doc.fillColor('#333333');
            let yPos = 65;

            // TÃ­tulo SeÃ§Ã£o 1
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

            // TÃ­tulo SeÃ§Ã£o 2
            doc.fontSize(9)
               .font('Helvetica-Bold')
               .fillColor('#C41E3A')
               .text('DADOS DO VEÃCULO', 30, yPos);
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

            // Linha divisÃ³ria
            doc.moveTo(30, yPos)
               .lineTo(565, yPos)
               .stroke('#D4AF37');
            yPos += 8;

            // RodapÃ©
            doc.fontSize(6)
               .font('Helvetica')
               .fillColor('#666666')
               .text('Data do Registro: ' + dados.dataRegistro, 30, yPos);
            
            doc.fontSize(6)
               .fillColor('#999999')
               .text('Â© 2026 Clube do Blindado', 30, yPos + 10);

            doc.end();

        } catch (erro) {
            reject(erro);
        }
    });
}

// FunÃ§Ã£o: Buscar arquivo existente no Drive
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
        console.warn('âš ï¸  Erro ao buscar arquivo:', erro.message);
        return null;
    }
}

// FunÃ§Ã£o: Salvar no Google Drive
async function salvarNoDrive(nomeArquivo, pdfBuffer) {
    if (!googleAuthReady || !drive) {
        console.warn('âŒ Google Drive nÃ£o autenticado. NÃ£o serÃ¡ possÃ­vel salvar.');
        return {
            savedToDrive: false,
            error: 'Google Drive nÃ£o autenticado'
        };
    }
    
    try {
        const arquivoExistenteId = await buscarArquivoNoDrive(nomeArquivo);
        
        let fileId = null;
        
        if (arquivoExistenteId) {
            console.log(`ðŸ“ Arquivo "${nomeArquivo}" jÃ¡ existe. Sobrepondo...`);
            
            const media = {
                mimeType: 'application/pdf',
                body: stream.Readable.from([pdfBuffer])
            };
            
            await drive.files.update({
                fileId: arquivoExistenteId,
                media: media
            });
            
            fileId = arquivoExistenteId;
            console.log(`âœ… Arquivo atualizado no Google Drive: ${fileId}`);
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
            console.log(`âœ… Arquivo criado no Google Drive: ${fileId}`);
        }
        
        return {
            savedToDrive: true,
            id: fileId,
            fileName: nomeArquivo
        };

    } catch (erro) {
        console.error('âŒ Erro ao salvar no Google Drive:', erro.message);
        return {
            savedToDrive: false,
            error: erro.message
        };
    }
}

// Rota: PÃ¡gina principal (serve index.html da pasta public)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota: API - Cadastro
app.post('/api/cadastro', async (req, res) => {
    try {
        const dados = req.body;

        console.log('\nðŸ”„ Processando cadastro...');
        console.log(`ðŸ“‹ Cliente: ${dados.nomeCliente}`);
        console.log(`ðŸš— Placa: ${dados.placa}`);

        if (!dados.nomeCliente || !dados.celular || !dados.placa || !dados.anoModelo || !dados.email) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Todos os campos sÃ£o obrigatÃ³rios'
            });
        }

        console.log('ðŸ“„ Gerando PDF...');
        const pdfBuffer = await gerarPDF(dados);

        const nomeArquivo = `${dados.placa.toUpperCase()}_1.pdf`;

        console.log(`ðŸ’¾ Salvando "${nomeArquivo}" no Google Drive...`);
        const resultadoDrive = await salvarNoDrive(nomeArquivo, pdfBuffer);

        if (!resultadoDrive.savedToDrive) {
            console.error(`âŒ Falha ao salvar no Google Drive: ${resultadoDrive.error}`);
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao salvar arquivo no Google Drive: ' + resultadoDrive.error
            });
        }

        console.log(`âœ… Cadastro salvo com sucesso no Google Drive!\n`);
        res.json({
            sucesso: true,
            mensagem: 'Cadastro salvo com sucesso!',
            nomeArquivo: nomeArquivo,
            driveId: resultadoDrive.id
        });

    } catch (erro) {
        console.error('âŒ Erro no cadastro:', erro);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao processar cadastro: ' + erro.message
        });
    }
});

// Rota: AutenticaÃ§Ã£o OAuth
let oauth2Client = null;

app.get('/auth', (req, res) => {
    try {
        let credentials;
        
        // Tentar ler da variÃ¡vel de ambiente (Vercel) primeiro
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
        
        console.log('ðŸ” Redirecionando para autenticaÃ§Ã£o Google...');
        console.log(`   Redirect URI: ${redirectUri}`);
        res.redirect(authUrl);
    } catch (erro) {
        console.error('âŒ Erro ao iniciar autenticaÃ§Ã£o:', erro.message);
        res.status(500).send('Erro ao iniciar autenticaÃ§Ã£o: ' + erro.message);
    }
});

app.get('/auth/callback', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) throw new Error('CÃ³digo de autorizaÃ§Ã£o nÃ£o recebido');
        
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        
        // Token em memoria (Vercel read-only filesystem)
        
        drive = google.drive({
            version: 'v3',
            auth: oauth2Client
        });
        googleAuthReady = true;
        
        res.send('âœ… AutenticaÃ§Ã£o bem-sucedida! Token salvo. VocÃª pode fechar esta janela.');
        console.log('âœ… Token OAuth salvo com sucesso!');
    } catch (erro) {
        res.status(500).send('âŒ Erro na autenticaÃ§Ã£o: ' + erro.message);
        console.error('Erro no callback:', erro);
    }
});

// Rota: Debug
app.get('/api/debug', (req, res) => {
    res.json({
        status: 'ok',
        googleAuthReady: googleAuthReady,
        driveInitialized: drive !== null,
        googleDriveFolderId: GOOGLE_DRIVE_FOLDER_ID,
        authMethod: 'OAuth 2.0 (In-Memory)',
        message: googleAuthReady ? 'âœ… Autenticado' : 'âŒ NÃ£o autenticado - Acesse /auth'
    });
});

// Rota: Status
app.get('/api/status', (req, res) => {
    res.json({
        servidor: 'online',
        modulo: 'cadastro-clientes',
        googleDriveReady: googleAuthReady,
        authMethod: 'OAuth 2.0',
        environment: 'production',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🎯 CLUBE DO BLINDADO - Cadastro de Clientes`);
    console.log(`${'='.repeat(50)}`);
    console.log(`\n🚀 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📁 Pasta Google Drive: ${GOOGLE_DRIVE_FOLDER_ID}`);
    console.log(`\n💡 Abra no navegador: http://localhost:${PORT}`);
    console.log(`${'='.repeat(50)}\n`);
});

module.exports = app;

