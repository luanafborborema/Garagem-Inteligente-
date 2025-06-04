/**
 * @file funcoesAuxiliares.js
 * @brief Arquivo contendo funções auxiliares utilizadas no projeto.
 */

// Não precisa importar CarroEsportivo aqui, a lógica funciona com a instância base

/**
 * @function tocarSom
 * @param {HTMLAudioElement} audioElement - Elemento de áudio a ser tocado.
 * @param {number} [volume=0.5] - Volume do áudio (entre 0 e 1).
 * @description Toca um som, definindo o volume e reiniciando a reprodução.
 */
export function tocarSom(audioElement, volume = 0.5) {
    if (audioElement && typeof audioElement.play === 'function') {
        audioElement.volume = Math.max(0, Math.min(1, volume)); // Garante volume entre 0 e 1
        audioElement.currentTime = 0;
        audioElement.play().catch(error => console.error("Erro ao tocar som:", error));
    } else {
        console.warn("Tentativa de tocar som inválido:", audioElement);
    }
}

// Variável global para o timeout do feedback
let feedbackTimeout;

/**
 * @function mostrarFeedback
 * @param {string} mensagem - Mensagem a ser exibida.
 * @param {string} [tipo='info'] - Tipo de feedback ('info', 'success', 'warning', 'error').
 * @description Exibe uma mensagem de feedback na interface.
 */
export function mostrarFeedback(mensagem, tipo = 'info') {
    const feedbackMessageDiv = document.getElementById('feedback-message');
    if (!feedbackMessageDiv) {
        console.error("Elemento #feedback-message não encontrado!");
        return;
    }

    clearTimeout(feedbackTimeout); // Limpa timeout anterior, se houver

    feedbackMessageDiv.textContent = mensagem;
    feedbackMessageDiv.className = `feedback ${tipo}`; // Define a classe correta
    feedbackMessageDiv.style.display = 'block'; // Mostra a mensagem

    // Define um novo timeout para esconder a mensagem
    feedbackTimeout = setTimeout(() => {
        feedbackMessageDiv.style.display = 'none';
    }, 5000); // Esconde após 5 segundos
}


/**
 * @function atualizarInfoVeiculo
 * @param {string} idPrefix - Prefixo do ID do veículo (ex: 'carro', 'moto').
 * @param {object} dados - Objeto contendo os dados a serem atualizados na interface (chave: sufixo do ID, valor: novo conteúdo).
 * @description Atualiza as informações do veículo na interface. Ex: atualizarInfoVeiculo('carro', { modelo: 'Fusca', velocidade: 50 })
 */
export function atualizarInfoVeiculo(idPrefix, dados) {
    for (const key in dados) {
        const elId = `${idPrefix}-${key}`; // Monta o ID completo (ex: 'carro-velocidade')
        const el = document.getElementById(elId);
        if (el) {
             // Formatação especial para velocidade e carga
             let valor = dados[key];
             if (key === 'velocidade') {
                 valor = `${Math.round(valor)} km/h`; // Arredonda e adiciona unidade
             } else if (key === 'carga') {
                 valor = `${dados[key]}`; // Apenas o valor da carga atual
             } else if (key === 'capacidade') {
                 // Atualiza a capacidade junto com a carga
                 const cargaEl = document.getElementById(`${idPrefix}-carga`);
                 if (cargaEl) {
                    const cargaAtual = cargaEl.textContent; // Pega a carga atual já exibida
                    cargaEl.parentElement.innerHTML = `<strong>Carga:</strong> <span id="${idPrefix}-carga">${cargaAtual}</span> / <span id="${idPrefix}-capacidade">${dados[key]}</span> kg`;
                 }
                 continue; // Já atualizou, pula para próximo item
             } else if (key === 'turbo') {
                valor = dados[key] ? "Ativado" : "Desativado";
             }

            // Atualiza o conteúdo do elemento
            if (el.tagName === 'INPUT') {
                el.value = valor;
            } else {
                // Se o elemento for o span de velocidade/carga/turbo, atualiza o texto
                if (el.id.endsWith('-velocidade') || el.id.endsWith('-carga') || el.id.endsWith('-turbo') || el.id.endsWith('-capacidade')) {
                   el.textContent = valor.toString().replace(' km/h','').replace(' kg', ''); // Remove unidades se já existirem ao setar
                    // Re-adiciona unidades se necessário (para velocidade)
                   if (el.id.endsWith('-velocidade')) el.textContent += ' km/h';
                } else {
                    el.textContent = valor; // Para outros spans como modelo, cor
                }

                 // Caso especial para atualizar Carga/Capacidade juntos no Caminhão
                 if (idPrefix === 'caminhao' && (key === 'carga' || key === 'capacidade')) {
                    const cargaSpan = document.getElementById('caminhao-carga');
                    const capacidadeSpan = document.getElementById('caminhao-capacidade');
                    if (cargaSpan && capacidadeSpan) {
                         cargaSpan.textContent = dados['carga'] !== undefined ? dados['carga'] : cargaSpan.textContent;
                         capacidadeSpan.textContent = dados['capacidade'] !== undefined ? dados['capacidade'] : capacidadeSpan.textContent;
                    }
                }
            }
        } else {
            // console.warn(`Elemento não encontrado para atualizar: #${elId}`);
        }
    }
}


/**
 * @function atualizarStatusVeiculo
 * @param {string} idPrefix - Prefixo do ID do veículo.
 * @param {boolean} ligado - Indica se o veículo está ligado.
 * @param {number} [velocidade=0] - Velocidade do veículo.
 * @description Atualiza o texto e a classe CSS do status do veículo na interface.
 */
export function atualizarStatusVeiculo(idPrefix, ligado, velocidade = 0) {
    const elId = `${idPrefix}-status`;
    const el = document.getElementById(elId);
    if (el) {
        let statusTexto = 'Desligado';
        let statusClasse = 'status-desligado';

        if (idPrefix === 'bicicleta') {
            statusTexto = velocidade > 0 ? "Pedalando" : "Parada";
            // Bicicleta não tem classe de status ligado/desligado, usa 'status-parada' ou outra se necessário
            statusClasse = velocidade > 0 ? 'status-pedalando' : 'status-parada'; // Adicione status-pedalando no CSS se quiser diferenciar
        } else {
            if (ligado) {
                statusTexto = "Ligado";
                statusClasse = 'status-ligado';
            }
        }

        el.textContent = statusTexto;
        // Remove classes antigas de status antes de adicionar a nova
        el.classList.remove('status-ligado', 'status-desligado', 'status-parada', 'status-pedalando');
        el.classList.add(statusClasse);
    } else {
         // console.warn(`Elemento de status não encontrado: #${elId}`);
    }
}

/**
 * @function animarVeiculo
 * @param {string} idPrefix - Prefixo do ID do veículo.
 * @param {string} acaoCss - Classe CSS para a animação ('acelerando' ou 'freando').
 * @description Aplica uma animação CSS temporária à imagem do veículo.
 */
export function animarVeiculo(idPrefix, acaoCss) {
    const imgId = `${idPrefix}-img`;
    const img = document.getElementById(imgId);
    if (img) {
        // Remove classes de animação anteriores
        img.classList.remove('acelerando', 'freando');

        // Adiciona a nova classe de animação, se fornecida
        if (acaoCss) {
            img.classList.add(acaoCss);
            // Remove a classe após um curto período para resetar a animação
            setTimeout(() => {
                if (img) img.classList.remove(acaoCss);
            }, 300); // Duração da animação
        }
    } else {
        console.warn(`Elemento de imagem não encontrado: #${imgId}`);
    }
}

/**
 * @function atualizarEstadoBotoes
 * @param {Veiculo} veiculo - Objeto do veículo.
 * @description Habilita/desabilita os botões de ação com base no estado atual do veículo.
 */
export function atualizarEstadoBotoes(veiculo) {
    if (!veiculo || !veiculo.getIdPrefix) {
        // console.warn("Tentativa de atualizar botões sem veículo válido.");
        return;
    }

    const prefix = veiculo.getIdPrefix();
    const container = document.getElementById(`${prefix}-container`);
    if (!container) {
        // console.warn(`Container não encontrado para atualizar botões: #${prefix}-container`);
        return;
    }

    const ligado = veiculo.ligado;
    const parado = veiculo.velocidade === 0;

    // Seleciona todos os botões de ação dentro do container específico
    const botoes = container.querySelectorAll('.actions button[data-acao]');

    botoes.forEach(botao => {
        const acao = botao.dataset.acao;
        let desabilitar = false; // Por padrão, o botão está habilitado

        // Lógica para desabilitar botões
        switch (acao) {
            case 'ligar':
                // Desabilita 'ligar' se já estiver ligado (exceto bike que não tem)
                desabilitar = prefix !== 'bicicleta' && ligado;
                break;
            case 'desligar':
                // Desabilita 'desligar' se estiver desligado ou em movimento (exceto bike)
                desabilitar = prefix !== 'bicicleta' && (!ligado || !parado);
                break;
            case 'acelerar':
            case 'pedalar': // Trata pedalar como acelerar para a lógica de habilitação
                // Desabilita 'acelerar'/'pedalar' se estiver desligado (exceto bike)
                desabilitar = prefix !== 'bicicleta' && !ligado;
                break;
            case 'frear':
                // Desabilita 'frear' se estiver parado
                desabilitar = parado;
                break;
            case 'ativarTurbo':
                // Desabilita 'ativarTurbo' se desligado, ou se turbo já ativo (verifica se a propriedade existe)
                desabilitar = !ligado || (veiculo.turboAtivado === true);
                break;
            case 'desativarTurbo':
                 // Desabilita 'desativarTurbo' se turbo não está ativo (verifica se a propriedade existe e é false/undefined)
                desabilitar = (veiculo.turboAtivado === false || veiculo.turboAtivado === undefined);
                break;
             case 'carregar':
             case 'descarregar':
                 // Desabilita se o caminhão estiver desligado
                 desabilitar = !ligado;
                 // Poderia adicionar mais lógica (ex: desabilitar descarregar se carga for 0)
                 if (acao === 'descarregar' && veiculo.cargaAtual === 0) {
                     desabilitar = true;
                 }
                 // Desabilita carregar/descarregar se o input de carga estiver vazio ou inválido
                 const cargaInput = container.querySelector('#caminhao-carga-input');
                 if (cargaInput && (!cargaInput.value || parseInt(cargaInput.value) <= 0)) {
                    // Mantém habilitado se desligado for a razão principal
                    if (!desabilitar) {
                        // Para descarregar, permite mesmo com input vazio se carga > 0
                        if (!(acao === 'descarregar' && veiculo.cargaAtual > 0)) {
                             desabilitar = true;
                        }
                    }
                 }

                 break;
            case 'buzinar':
                 // Buzina/Campainha pode ser usada mesmo desligada (na bike) ou ligada
                 desabilitar = false; // Sempre habilitado (ou desabilitar se desligado para carros/motos?)
                 if (prefix !== 'bicicleta') {
                     // desabilitar = !ligado; // Descomente se quiser buzina só ligado
                 }
                 break;
            // Adicione mais casos se novas ações forem criadas
        }

        // Aplica o estado (habilitado/desabilitado) ao botão
        botao.disabled = desabilitar;
    });

     // Lógica específica para inputs (ex: carga do caminhão)
     const cargaInput = container.querySelector('#caminhao-carga-input');
     if (cargaInput) {
         cargaInput.disabled = !ligado; // Desabilita input de carga se caminhão desligado
     }
}