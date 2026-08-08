// Formatação de Celular
function formatarCelular(valor) {
    valor = valor.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.slice(0, 11);
    
    if (valor.length <= 2) {
        return valor;
    } else if (valor.length <= 7) {
        return `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    } else {
        return `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
    }
}

// Validações
const validacoes = {
    nomeCliente: (valor) => {
        if (!valor.trim()) return 'Nome é obrigatório';
        if (valor.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
        if (!/^[a-záéíóúâêôãõç\s]+$/i.test(valor)) return 'Nome deve conter apenas letras';
        return '';
    },

    celular: (valor) => {
        const apenasNumeros = valor.replace(/\D/g, '');
        if (!valor.trim()) return 'Celular é obrigatório';
        if (apenasNumeros.length !== 11) return 'Celular deve ter 11 dígitos (com DDD)';
        if (!apenasNumeros.startsWith('1')) return 'DDD deve começar com 1 (ex: 11, 21, 31)';
        return '';
    },

    placa: (valor) => {
        if (!valor.trim()) return 'Placa é obrigatória';
        if (!/^[a-z0-9]{7}$/i.test(valor.trim())) {
            return 'Placa deve conter 7 caracteres alfanuméricos (ex: ABC1234)';
        }
        return '';
    },

    anoModelo: (valor) => {
        if (!valor.trim()) return 'Ano/Modelo é obrigatório';
        if (!/^\d{4}\/\d{4}$/.test(valor.trim())) {
            return 'Formato deve ser AAAA/AAAA (ex: 2024/2025)';
        }
        const ano1 = parseInt(valor.split('/')[0]);
        const ano2 = parseInt(valor.split('/')[1]);
        if (ano1 < 1990) return 'Ano de lançamento deve ser maior que 1990';
        if (ano2 < ano1) return 'Ano do modelo deve ser maior ou igual ao ano de lançamento';
        return '';
    },

    email: (valor) => {
        if (!valor.trim()) return 'E-mail é obrigatório';
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(valor.trim())) {
            return 'E-mail inválido. Use o formato: exemplo@dominio.com';
        }
        return '';
    }
};

// DOM Elements
const form = document.getElementById('cadastroForm');
const celularInput = document.getElementById('celular');
const placaInput = document.getElementById('placa');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const successMessage = document.getElementById('successMessage');
const allInputs = form.querySelectorAll('input');

// Verificar campos válidos
function todosCamposValidos() {
    let todosValidos = true;
    allInputs.forEach(input => {
        const validacao = validacoes[input.id];
        if (!validacao) return;
        const erro = validacao(input.value);
        if (erro) todosValidos = false;
    });
    return todosValidos;
}

// Atualizar estado do botão
function atualizarBotao() {
    const todosValidos = todosCamposValidos();
    submitBtn.disabled = !todosValidos;
}

// Validação em tempo real
allInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        const validacao = validacoes[input.id];
        if (!validacao) return;

        const erro = validacao(input.value);
        const errorSpan = document.getElementById(`error-${input.id}`);

        if (erro) {
            input.classList.add('error');
            errorSpan.textContent = erro;
        } else {
            input.classList.remove('error');
            errorSpan.textContent = '';
        }

        atualizarBotao();
    });
});

// Formatação de celular
celularInput.addEventListener('input', (e) => {
    e.target.value = formatarCelular(e.target.value);
});

// Formatação de placa (maiúscula)
placaInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});

// Validação completa do formulário
function validarFormulario() {
    let isValid = true;

    allInputs.forEach(input => {
        const validacao = validacoes[input.id];
        if (!validacao) return;

        const erro = validacao(input.value);
        const errorSpan = document.getElementById(`error-${input.id}`);

        if (erro) {
            input.classList.add('error');
            errorSpan.textContent = erro;
            isValid = false;
        } else {
            input.classList.remove('error');
            errorSpan.textContent = '';
        }
    });

    return isValid;
}

// Envio do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
        console.log('Formulário tem erros');
        return;
    }

    const dadosFormulario = {
        nomeCliente: document.getElementById('nomeCliente').value.trim(),
        celular: document.getElementById('celular').value.trim(),
        placa: document.getElementById('placa').value.trim().toUpperCase(),
        anoModelo: document.getElementById('anoModelo').value.trim(),
        email: document.getElementById('email').value.trim(),
        dataRegistro: new Date().toLocaleString('pt-BR'),
        timestamp: Date.now()
    };

    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
        const response = await fetch('/api/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosFormulario)
        });

        if (!response.ok) {
            throw new Error(`Erro do servidor: ${response.statusText}`);
        }

        const resultado = await response.json();

        if (resultado.sucesso) {
            form.reset();
            successMessage.style.display = 'flex';
            window.scrollTo({ top: 0, behavior: 'smooth' });

            setTimeout(() => {
                submitBtn.disabled = false;
                atualizarBotao();
            }, 3000);
        } else {
            alert(`Erro ao salvar: ${resultado.mensagem}`);
            submitBtn.disabled = false;
            atualizarBotao();
        }
    } catch (erro) {
        console.error('Erro:', erro);
        alert(`Erro ao processar cadastro: ${erro.message}`);
        submitBtn.disabled = false;
        atualizarBotao();
    } finally {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});

// Fechar modal ao clicar no fundo
successMessage.addEventListener('click', (e) => {
    if (e.target === successMessage) {
        successMessage.style.display = 'none';
    }
});

// Fechar modal ao clicar no botão X
const closeSuccessBtn = document.getElementById('closeSuccessBtn');
if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
        successMessage.style.display = 'none';
    });
}

// Atualizar botão na inicialização
atualizarBotao();
