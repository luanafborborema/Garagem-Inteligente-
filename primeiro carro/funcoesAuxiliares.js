/**
 * @file funcoesAuxiliares.js
 * @brief Arquivo contendo funções auxiliares utilizadas no projeto.
 */

/**
 * @function tocarSom
 * @param {HTMLAudioElement} audioElement - Elemento de áudio a ser tocado.
 * @param {number} [volume=0.5] - Volume do áudio (entre 0 e 1).
 * @description Toca um som, definindo o volume e reiniciando a reprodução.
 */
export function tocarSom(audioElement, volume = 0.5) {
    if (audioElement && typeof audioElement.play === 'function') {
        audioElement.currentTime = 0;
        audioElement.volume = volume;
        audioElement.play().catch(error => console.error("Erro som:", error));
    }
}

/**
 * @function mostrarFeedback
 * @param {string} mensagem - Mensagem a ser exibida.
 * @param {string} [tipo='info'] - Tipo de feedback ('info', 'success', 'warning', 'error').
 * @description Exibe uma mensagem de feedback na interface.
 */
export function mostrarFeedback(mensagem, tipo = 'info') {
    const feedbackMessageDiv = document.getElementById('feedback-message');
    if (!feedbackMessageDiv) return;

    clearTimeout(window.feedbackTimeout); // Use window.feedbackTimeout
    window.feedbackTimeout = setTimeout(() => {  // Use window.feedbackTimeout
        feedbackMessageDiv.style.display = 'none';
    }, 5000);

    feedbackMessageDiv.textContent = mensagem;
    feedbackMessageDiv.className = `feedback ${tipo}`;
    feedbackMessageDiv.style.display = 'block';
}


/**
 * @function atualizarInfoVeiculo
 * @param {string} idPrefix - Prefixo do ID do veículo.
 * @param {object} dados - Objeto contendo os dados a serem atualizados na interface.
 * @description Atualiza as informações do veículo na interface.
 */
export function atualizarInfoVeiculo(idPrefix, dados) {
    for (const key in dados) {
        const elId = `${idPrefix}-${key}`;
        const el = document.getElementById(elId);
        if (el) {
            if (el.tagName === 'INPUT') el.value = dados[key];
            else el.textContent = dados[key];
        }
    }
}

/**
 * @function atualizarStatusVeiculo
 * @param {string} idPrefix - Prefixo do ID do veículo.
 * @param {boolean} ligado - Indica se o veículo está ligado.
 * @param {number} [velocidade=0] - Velocidade do veículo.
 * @description Atualiza o status do veículo na interface.
 */
export function atualizarStatusVeiculo(idPrefix, ligado, velocidade = 0) {
    const elId = `${idPrefix}-status`;
    const el = document.getElementById(elId);
    if (el) {
        let txt = 'Desligado';
        let cls = 'status-desligado';
        if (idPrefix === 'bicicleta') {
            txt = velocidade > 0 ? "Pedalando" : "Parada";
            cls = 'status-parada';
        } else {
            if (ligado) {
                txt = "Ligado";
                cls = 'status-ligado';
            }
        }
        el.className = '';
        el.classList.add(cls);
        el.textContent = txt;
    }
}

/**
 * @function animarVeiculo
 * @param {string} idPrefix - Prefixo do ID do veículo.
 * @param {string} acaoCss - Classe CSS para a animação.
 * @description Aplica uma animação ao veículo na interface.
 */
export function animarVeiculo(idPrefix, acaoCss) {
    const imgId = `${idPrefix}-img`;
    const img = document.getElementById(imgId);
    if (img) {
        img.classList.remove('acelerando', 'freando');
        if (acaoCss) {
            img.classList.add(acaoCss);
            setTimeout(() => {
                if (img) img.classList.remove(acaoCss);
            }, 300);
        }
    }
}

/**
 * @function atualizarEstadoBotoes
 * @param {Veiculo} veiculo - Objeto do veículo.
 * @description Atualiza o estado dos botões na interface com base no estado do veículo.
 */
export function atualizarEstadoBotoes(veiculo) {
    if (!veiculo) return;
    const p = veiculo.getIdPrefix();
    const c = document.getElementById(`${p}-container`);
    if (!c) return;
    const bL = c.querySelector(`button[data-acao="ligar"]`),
        bD = c.querySelector(`button[data-acao="desligar"]`),
        bA = c.querySelector(`button[data-acao="acelerar"]`),
        bP = c.querySelector(`button[data-acao="pedalar"]`),
        bF = c.querySelector(`button[data-acao="frear"]`),
        bAT = c.querySelector(`button[data-acao="ativarTurbo"]`),
        bDT = c.querySelector(`button[data-acao="desativarTurbo"]`);
    const li = veiculo.ligado,
        pa = veiculo.velocidade === 0;
    if (bL) bL.disabled = (p === 'bicicleta') ? true : li;
    if (bD) bD.disabled = (p === 'bicicleta') ? true : (!li || !pa);
    if (bA) bA.disabled = !li;
    if (bP) bP.disabled = false;
    if (bF) bF.disabled = pa;
    if (veiculo instanceof CarroEsportivo) {
        const tA = veiculo.turboAtivado;
        if (bAT) bAT.disabled = !li || tA;
        if (bDT) bDT.disabled = !tA;
    }
}