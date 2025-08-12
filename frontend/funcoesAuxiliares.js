<<<<<<< HEAD
// ginteligente/funcoesAuxiliares.js
// Conteúdo COMPLETO das funções auxiliares utilizadas em várias classes do projeto.

/**
 * Toca um elemento de áudio HTML, resetando a reprodução e definindo o volume.
 * @param {HTMLAudioElement} audioElement - O elemento <audio> HTML a ser tocado.
 * @param {number} [volume=0.5] - O volume do áudio, um número entre 0 e 1.
 */
export function tocarSom(audioElement, volume = 0.5) {
    // Verifica se o elemento de áudio é válido e possui o método 'play'
    if (audioElement && typeof audioElement.play === 'function') {
        audioElement.volume = Math.max(0, Math.min(1, volume)); // Garante que o volume esteja entre 0 e 1
        audioElement.currentTime = 0; // Reinicia a reprodução do som desde o início
        // `play().catch(error)` lida com promessas rejeitadas (ex: usuário não interagiu com a página antes do som)
        audioElement.play().catch(error => console.warn("Erro ao tentar tocar som:", error));
    } else {
        console.warn("Tentativa de tocar um elemento de som inválido:", audioElement);
    }
}

// Variável global para armazenar o ID do timeout do feedback, para que possa ser cancelado.
let feedbackTimeout;

/**
 * Exibe uma mensagem de feedback para o usuário na interface da aplicação.
 * A mensagem aparecerá em uma div HTML com ID 'feedback-message'.
 * @param {string} mensagem - O texto da mensagem a ser exibida.
 * @param {string} [tipo='info'] - O tipo de feedback, que se traduz em classes CSS para estilização (ex: 'info', 'success', 'warning', 'error').
 */
export function mostrarFeedback(mensagem, tipo = 'info') {
    const feedbackMessageDiv = document.getElementById('feedback-message');
    if (!feedbackMessageDiv) {
        console.error("[Auxiliar] Elemento #feedback-message não encontrado na página! Não é possível exibir feedback.");
        return; // Sai se a div de feedback não existir
    }

    clearTimeout(feedbackTimeout); // Limpa qualquer timeout anterior, garantindo que novas mensagens apareçam imediatamente.

    feedbackMessageDiv.textContent = mensagem; // Define o texto da mensagem
    // Define a classe CSS com base no 'tipo' para estilizar a mensagem
    // (classes como 'feedback success', 'feedback error', etc., definidas em style.css)
    feedbackMessageDiv.className = `feedback ${tipo}`; 
    feedbackMessageDiv.style.display = 'block'; // Torna a div visível

    // Define um novo timeout para esconder a mensagem de feedback após 5 segundos.
    feedbackTimeout = setTimeout(() => {
        if (feedbackMessageDiv) feedbackMessageDiv.style.display = 'none'; // Esconde a div
    }, 5000); // 5000 milissegundos = 5 segundos
}

/**
 * Atualiza informações textuais de um veículo na interface do usuário.
 * Exemplo: modelo, cor, velocidade, turbo (para carro esportivo), carga (para caminhão).
 * @param {string} idPrefix - O prefixo do ID do veículo (ex: 'carro', 'moto', 'esportivo').
 *                            Usado para encontrar elementos como `carro-modelo`, `moto-velocidade`, etc.
 * @param {object} dados - Um objeto contendo os pares chave-valor a serem atualizados.
 *                         A chave deve corresponder ao sufixo do ID do elemento HTML.
 *                         Ex: `{ modelo: 'Fusca', velocidade: 50, turbo: true }`
 */
export function atualizarInfoVeiculo(idPrefix, dados) {
    for (const key in dados) { // Itera sobre cada propriedade no objeto 'dados'
        const elId = `${idPrefix}-${key}`; // Constrói o ID completo do elemento HTML (ex: 'carro-velocidade')
        const el = document.getElementById(elId); // Pega a referência do elemento HTML
        if (el) { // Se o elemento HTML for encontrado
            let valor = dados[key]; // Valor a ser exibido

            // Formata valores específicos (velocidade, turbo) ou para lidar com campos de carga/capacidade.
            if (key === 'velocidade') {
                valor = `${Math.round(valor)} km/h`; // Arredonda a velocidade e adiciona a unidade
            } else if (key === 'turbo') {
                valor = dados[key] ? "Ativado" : "Desativado"; // Converte booleano para texto "Ativado" / "Desativado"
            } 
            // Para Caminhão: o `carga` e `capacidade` são atualizados no mesmo span no HTML (ex: "500 / 1000 kg")
            else if (idPrefix === 'caminhao' && (key === 'carga' || key === 'capacidade')) {
                const cargaSpan = document.getElementById('caminhao-carga');
                const capacidadeSpan = document.getElementById('caminhao-capacidade');
                if (cargaSpan && capacidadeSpan) {
                     // Atualiza os textContent diretamente dos spans
                     cargaSpan.textContent = dados['carga'] !== undefined ? dados['carga'].toFixed(0) : cargaSpan.textContent;
                     capacidadeSpan.textContent = dados['capacidade'] !== undefined ? dados['capacidade'].toFixed(0) : capacidadeSpan.textContent;
                     // Não continua com o forEach para a chave atual, já atualizamos os dois.
                     continue; 
                }
            }
            
            // Define o conteúdo (textContent) ou valor (value para input) do elemento HTML.
            if (el.tagName === 'INPUT') {
                el.value = valor;
            } else {
                el.textContent = valor.toString(); // Converte para string e atualiza o texto.
            }
        } 
        // else { console.warn(`Elemento HTML "${elId}" não encontrado para atualização de informação.`); }
    }
}

/**
 * Atualiza o texto e a classe CSS do status do veículo na interface.
 * Ex: "Ligado" (verde), "Desligado" (vermelho), "Parada" (cinza para bicicleta).
 * @param {string} idPrefix - O prefixo do ID do veículo (ex: 'carro', 'moto').
 *                            Usado para encontrar o elemento com ID `${idPrefix}-status`.
 * @param {boolean} ligado - Indica se o veículo está ligado (true) ou desligado (false).
 * @param {number} [velocidade=0] - A velocidade atual do veículo, usada para status da bicicleta.
 */
export function atualizarStatusVeiculo(idPrefix, ligado, velocidade = 0) {
    const elId = `${idPrefix}-status`; // Constrói o ID do elemento de status (ex: 'carro-status')
    const el = document.getElementById(elId); // Pega a referência do elemento HTML
    if (el) { // Se o elemento HTML for encontrado
        let statusTexto = 'Desligado'; // Padrão
        let statusClasse = 'status-desligado'; // Classe CSS padrão para 'Desligado'

        // Lógica específica para bicicletas, que não têm conceito de "ligado/desligado" com motor.
        if (idPrefix === 'bicicleta') {
            statusTexto = velocidade > 0 ? "Pedalando" : "Parada";
            statusClasse = velocidade > 0 ? 'status-pedalando' : 'status-parada';
        } else {
            // Para veículos com motor (Carro, Moto, Caminhão, Esportivo)
            if (ligado) {
                statusTexto = "Ligado";
                statusClasse = 'status-ligado';
            }
        }

        el.textContent = statusTexto; // Define o texto do status (ex: "Ligado")
        // Remove quaisquer classes de status anteriores para evitar conflitos de estilo.
        el.classList.remove('status-ligado', 'status-desligado', 'status-parada', 'status-pedalando');
        el.classList.add(statusClasse); // Adiciona a nova classe de status.
    } 
    // else { console.warn(`Elemento de status HTML "${elId}" não encontrado para atualização.`); }
}

/**
 * Aplica uma classe CSS temporária à imagem do veículo para simular uma animação
 * (ex: tremer ou deslocar levemente para simular aceleração ou frenagem).
 * @param {string} idPrefix - O prefixo do ID do veículo (ex: 'carro', 'moto').
 *                            Usado para encontrar o elemento com ID `${idPrefix}-img`.
 * @param {string} acaoCss - A classe CSS a ser aplicada ('acelerando' ou 'freando').
 */
export function animarVeiculo(idPrefix, acaoCss) {
    const imgId = `${idPrefix}-img`; // Constrói o ID da imagem do veículo (ex: 'carro-img')
    const img = document.getElementById(imgId); // Pega a referência do elemento <img> HTML
    if (img) { // Se a imagem for encontrada
        // Remove classes de animação anteriores para que a animação possa ser reativada.
        img.classList.remove('acelerando', 'freando');

        if (acaoCss) {
            img.classList.add(acaoCss); // Adiciona a classe CSS para a animação
            // Remove a classe de animação após um curto período para resetar o estado visual.
            setTimeout(() => {
                if (img) img.classList.remove(acaoCss);
            }, 300); // A duração do setTimeout deve corresponder (ou ser um pouco maior) à duração da transição CSS.
        }
    } 
    // else { console.warn(`Elemento de imagem HTML "${imgId}" não encontrado para animação.`); }
}

/**
 * Habilita ou desabilita os botões de ação na interface do veículo (ligar, acelerar, frear, etc.)
 * com base no estado atual do objeto de veículo.
 * @param {object} veiculo - A instância do objeto de veículo (Carro, Moto, Caminhao, etc.).
 */
export function atualizarEstadoBotoes(veiculo) {
    // Verifica se a instância do veículo é válida
    if (!veiculo || !veiculo.getIdPrefix) {
        // console.warn("[Auxiliar] Tentativa de atualizar botões sem uma instância de veículo válida.");
        return;
    }

    const prefix = veiculo.getIdPrefix(); // Obtém o prefixo de ID do veículo
    // O container dos botões (normalmente a div 'veiculo-container')
    const container = document.getElementById(`${prefix}-container`); 
    if (!container) {
        // console.warn(`[Auxiliar] Container de botões HTML para "${prefix}" não encontrado.`);
        return;
    }

    const ligado = veiculo.ligado; // Estado `ligado` do veículo
    const parado = veiculo.velocidade === 0; // Se a velocidade é 0

    // Seleciona todos os botões de ação que possuem o atributo `data-acao` dentro do container específico do veículo.
    const botoes = container.querySelectorAll('.actions button[data-acao]');
    const cargaInput = container.querySelector(`#caminhao-carga-input`); // Campo de input de carga para caminhões

    botoes.forEach(botao => {
        const acao = botao.dataset.acao; // Pega a ação que o botão representa (ex: 'ligar', 'acelerar')
        let desabilitar = false; // Flag para determinar se o botão deve ser desabilitado (padrão: habilitado)

        // Lógica condicional para desabilitar botões com base no estado do veículo
        switch (acao) {
            case 'ligar':
                // Botão 'Ligar' desabilitado se já estiver ligado (exceto bicicletas, que não ligam/desligam)
                desabilitar = prefix !== 'bicicleta' && ligado;
                break;
            case 'desligar':
                // Botão 'Desligar' desabilitado se estiver desligado OU se estiver em movimento (exceto bicicletas)
                desabilitar = prefix !== 'bicicleta' && (!ligado || !parado);
                break;
            case 'acelerar':
            case 'pedalar': // 'Pedalar' para bicicleta é sinônimo de acelerar na UI
                // Botão 'Acelerar'/'Pedalar' desabilitado se estiver desligado (exceto bicicletas)
                desabilitar = prefix !== 'bicicleta' && !ligado;
                break;
            case 'frear':
                // Botão 'Frear' desabilitado se o veículo estiver parado
                desabilitar = parado;
                break;
            case 'ativarTurbo':
                // Botão 'Ativar Turbo' desabilitado se o veículo estiver desligado OU se o turbo já estiver ativo
                // Verifica se `turboAtivado` existe na instância do veículo (apenas para CarroEsportivo)
                desabilitar = !ligado || (veiculo.turboAtivado === true);
                break;
            case 'desativarTurbo':
                // Botão 'Desativar Turbo' desabilitado se o turbo não estiver ativo ou não for um CarroEsportivo
                desabilitar = (veiculo.turboAtivado === false || veiculo.turboAtivado === undefined);
                break;
            case 'carregar':
                // Botão 'Carregar' (para Caminhão) desabilitado se o caminhão estiver desligado
                desabilitar = !ligado;
                // Ou se o input de carga estiver vazio/inválido
                if (cargaInput && (!cargaInput.value || parseFloat(cargaInput.value) <= 0)) {
                    if(!desabilitar) desabilitar = true; // Só desabilita se o motivo não for 'estar desligado'
                }
                break;
            case 'descarregar':
                // Botão 'Descarregar' (para Caminhão) desabilitado se o caminhão estiver desligado OU se a carga atual for 0
                desabilitar = !ligado || veiculo.cargaAtual === 0;
                // Ou se o input de carga estiver vazio/inválido, a menos que a carga seja > 0 (permite descarregar "tudo")
                 if (cargaInput && (!cargaInput.value || parseFloat(cargaInput.value) <= 0)) {
                     if (!desabilitar && veiculo.cargaAtual > 0) { // Se não está desabilitado por outra razão
                         // Não desabilita se ainda tem carga, permitindo clicar para descarregar o total
                     } else if (!desabilitar) { // Desabilita se input inválido e não tem carga pra descarregar "tudo"
                         desabilitar = true;
                     }
                 }
                break;
            case 'buzinar':
                // O botão 'Buzinar' geralmente é sempre habilitado ou desabilitado se o veículo estiver desligado
                // Aqui, escolhemos habilitá-lo mesmo se o veículo estiver desligado (simula bateria)
                desabilitar = false; 
                // Se preferir que só buzine ligado (exceto bike), descomente:
                // if (prefix !== 'bicicleta') desabilitar = !ligado; 
                break;
            // Adicione mais casos conforme você expandir as ações dos veículos
        }
        // Aplica o estado `disabled` (true/false) ao botão HTML
        botao.disabled = desabilitar;
    });

    // Lógica específica para desabilitar o input de carga do caminhão
    if (cargaInput) {
        cargaInput.disabled = !ligado; // Desabilita o input se o caminhão estiver desligado
    }
=======
// ginteligente/funcoesAuxiliares.js
// Conteúdo COMPLETO das funções auxiliares utilizadas em várias classes do projeto.

/**
 * Toca um elemento de áudio HTML, resetando a reprodução e definindo o volume.
 * @param {HTMLAudioElement} audioElement - O elemento <audio> HTML a ser tocado.
 * @param {number} [volume=0.5] - O volume do áudio, um número entre 0 e 1.
 */
export function tocarSom(audioElement, volume = 0.5) {
    // Verifica se o elemento de áudio é válido e possui o método 'play'
    if (audioElement && typeof audioElement.play === 'function') {
        audioElement.volume = Math.max(0, Math.min(1, volume)); // Garante que o volume esteja entre 0 e 1
        audioElement.currentTime = 0; // Reinicia a reprodução do som desde o início
        // `play().catch(error)` lida com promessas rejeitadas (ex: usuário não interagiu com a página antes do som)
        audioElement.play().catch(error => console.warn("Erro ao tentar tocar som:", error));
    } else {
        console.warn("Tentativa de tocar um elemento de som inválido:", audioElement);
    }
}

// Variável global para armazenar o ID do timeout do feedback, para que possa ser cancelado.
let feedbackTimeout;

/**
 * Exibe uma mensagem de feedback para o usuário na interface da aplicação.
 * A mensagem aparecerá em uma div HTML com ID 'feedback-message'.
 * @param {string} mensagem - O texto da mensagem a ser exibida.
 * @param {string} [tipo='info'] - O tipo de feedback, que se traduz em classes CSS para estilização (ex: 'info', 'success', 'warning', 'error').
 */
export function mostrarFeedback(mensagem, tipo = 'info') {
    const feedbackMessageDiv = document.getElementById('feedback-message');
    if (!feedbackMessageDiv) {
        console.error("[Auxiliar] Elemento #feedback-message não encontrado na página! Não é possível exibir feedback.");
        return; // Sai se a div de feedback não existir
    }

    clearTimeout(feedbackTimeout); // Limpa qualquer timeout anterior, garantindo que novas mensagens apareçam imediatamente.

    feedbackMessageDiv.textContent = mensagem; // Define o texto da mensagem
    // Define a classe CSS com base no 'tipo' para estilizar a mensagem
    // (classes como 'feedback success', 'feedback error', etc., definidas em style.css)
    feedbackMessageDiv.className = `feedback ${tipo}`; 
    feedbackMessageDiv.style.display = 'block'; // Torna a div visível

    // Define um novo timeout para esconder a mensagem de feedback após 5 segundos.
    feedbackTimeout = setTimeout(() => {
        if (feedbackMessageDiv) feedbackMessageDiv.style.display = 'none'; // Esconde a div
    }, 5000); // 5000 milissegundos = 5 segundos
}

/**
 * Atualiza informações textuais de um veículo na interface do usuário.
 * Exemplo: modelo, cor, velocidade, turbo (para carro esportivo), carga (para caminhão).
 * @param {string} idPrefix - O prefixo do ID do veículo (ex: 'carro', 'moto', 'esportivo').
 *                            Usado para encontrar elementos como `carro-modelo`, `moto-velocidade`, etc.
 * @param {object} dados - Um objeto contendo os pares chave-valor a serem atualizados.
 *                         A chave deve corresponder ao sufixo do ID do elemento HTML.
 *                         Ex: `{ modelo: 'Fusca', velocidade: 50, turbo: true }`
 */
export function atualizarInfoVeiculo(idPrefix, dados) {
    for (const key in dados) { // Itera sobre cada propriedade no objeto 'dados'
        const elId = `${idPrefix}-${key}`; // Constrói o ID completo do elemento HTML (ex: 'carro-velocidade')
        const el = document.getElementById(elId); // Pega a referência do elemento HTML
        if (el) { // Se o elemento HTML for encontrado
            let valor = dados[key]; // Valor a ser exibido

            // Formata valores específicos (velocidade, turbo) ou para lidar com campos de carga/capacidade.
            if (key === 'velocidade') {
                valor = `${Math.round(valor)} km/h`; // Arredonda a velocidade e adiciona a unidade
            } else if (key === 'turbo') {
                valor = dados[key] ? "Ativado" : "Desativado"; // Converte booleano para texto "Ativado" / "Desativado"
            } 
            // Para Caminhão: o `carga` e `capacidade` são atualizados no mesmo span no HTML (ex: "500 / 1000 kg")
            else if (idPrefix === 'caminhao' && (key === 'carga' || key === 'capacidade')) {
                const cargaSpan = document.getElementById('caminhao-carga');
                const capacidadeSpan = document.getElementById('caminhao-capacidade');
                if (cargaSpan && capacidadeSpan) {
                     // Atualiza os textContent diretamente dos spans
                     cargaSpan.textContent = dados['carga'] !== undefined ? dados['carga'].toFixed(0) : cargaSpan.textContent;
                     capacidadeSpan.textContent = dados['capacidade'] !== undefined ? dados['capacidade'].toFixed(0) : capacidadeSpan.textContent;
                     // Não continua com o forEach para a chave atual, já atualizamos os dois.
                     continue; 
                }
            }
            
            // Define o conteúdo (textContent) ou valor (value para input) do elemento HTML.
            if (el.tagName === 'INPUT') {
                el.value = valor;
            } else {
                el.textContent = valor.toString(); // Converte para string e atualiza o texto.
            }
        } 
        // else { console.warn(`Elemento HTML "${elId}" não encontrado para atualização de informação.`); }
    }
}

/**
 * Atualiza o texto e a classe CSS do status do veículo na interface.
 * Ex: "Ligado" (verde), "Desligado" (vermelho), "Parada" (cinza para bicicleta).
 * @param {string} idPrefix - O prefixo do ID do veículo (ex: 'carro', 'moto').
 *                            Usado para encontrar o elemento com ID `${idPrefix}-status`.
 * @param {boolean} ligado - Indica se o veículo está ligado (true) ou desligado (false).
 * @param {number} [velocidade=0] - A velocidade atual do veículo, usada para status da bicicleta.
 */
export function atualizarStatusVeiculo(idPrefix, ligado, velocidade = 0) {
    const elId = `${idPrefix}-status`; // Constrói o ID do elemento de status (ex: 'carro-status')
    const el = document.getElementById(elId); // Pega a referência do elemento HTML
    if (el) { // Se o elemento HTML for encontrado
        let statusTexto = 'Desligado'; // Padrão
        let statusClasse = 'status-desligado'; // Classe CSS padrão para 'Desligado'

        // Lógica específica para bicicletas, que não têm conceito de "ligado/desligado" com motor.
        if (idPrefix === 'bicicleta') {
            statusTexto = velocidade > 0 ? "Pedalando" : "Parada";
            statusClasse = velocidade > 0 ? 'status-pedalando' : 'status-parada';
        } else {
            // Para veículos com motor (Carro, Moto, Caminhão, Esportivo)
            if (ligado) {
                statusTexto = "Ligado";
                statusClasse = 'status-ligado';
            }
        }

        el.textContent = statusTexto; // Define o texto do status (ex: "Ligado")
        // Remove quaisquer classes de status anteriores para evitar conflitos de estilo.
        el.classList.remove('status-ligado', 'status-desligado', 'status-parada', 'status-pedalando');
        el.classList.add(statusClasse); // Adiciona a nova classe de status.
    } 
    // else { console.warn(`Elemento de status HTML "${elId}" não encontrado para atualização.`); }
}

/**
 * Aplica uma classe CSS temporária à imagem do veículo para simular uma animação
 * (ex: tremer ou deslocar levemente para simular aceleração ou frenagem).
 * @param {string} idPrefix - O prefixo do ID do veículo (ex: 'carro', 'moto').
 *                            Usado para encontrar o elemento com ID `${idPrefix}-img`.
 * @param {string} acaoCss - A classe CSS a ser aplicada ('acelerando' ou 'freando').
 */
export function animarVeiculo(idPrefix, acaoCss) {
    const imgId = `${idPrefix}-img`; // Constrói o ID da imagem do veículo (ex: 'carro-img')
    const img = document.getElementById(imgId); // Pega a referência do elemento <img> HTML
    if (img) { // Se a imagem for encontrada
        // Remove classes de animação anteriores para que a animação possa ser reativada.
        img.classList.remove('acelerando', 'freando');

        if (acaoCss) {
            img.classList.add(acaoCss); // Adiciona a classe CSS para a animação
            // Remove a classe de animação após um curto período para resetar o estado visual.
            setTimeout(() => {
                if (img) img.classList.remove(acaoCss);
            }, 300); // A duração do setTimeout deve corresponder (ou ser um pouco maior) à duração da transição CSS.
        }
    } 
    // else { console.warn(`Elemento de imagem HTML "${imgId}" não encontrado para animação.`); }
}

/**
 * Habilita ou desabilita os botões de ação na interface do veículo (ligar, acelerar, frear, etc.)
 * com base no estado atual do objeto de veículo.
 * @param {object} veiculo - A instância do objeto de veículo (Carro, Moto, Caminhao, etc.).
 */
export function atualizarEstadoBotoes(veiculo) {
    // Verifica se a instância do veículo é válida
    if (!veiculo || !veiculo.getIdPrefix) {
        // console.warn("[Auxiliar] Tentativa de atualizar botões sem uma instância de veículo válida.");
        return;
    }

    const prefix = veiculo.getIdPrefix(); // Obtém o prefixo de ID do veículo
    // O container dos botões (normalmente a div 'veiculo-container')
    const container = document.getElementById(`${prefix}-container`); 
    if (!container) {
        // console.warn(`[Auxiliar] Container de botões HTML para "${prefix}" não encontrado.`);
        return;
    }

    const ligado = veiculo.ligado; // Estado `ligado` do veículo
    const parado = veiculo.velocidade === 0; // Se a velocidade é 0

    // Seleciona todos os botões de ação que possuem o atributo `data-acao` dentro do container específico do veículo.
    const botoes = container.querySelectorAll('.actions button[data-acao]');
    const cargaInput = container.querySelector(`#caminhao-carga-input`); // Campo de input de carga para caminhões

    botoes.forEach(botao => {
        const acao = botao.dataset.acao; // Pega a ação que o botão representa (ex: 'ligar', 'acelerar')
        let desabilitar = false; // Flag para determinar se o botão deve ser desabilitado (padrão: habilitado)

        // Lógica condicional para desabilitar botões com base no estado do veículo
        switch (acao) {
            case 'ligar':
                // Botão 'Ligar' desabilitado se já estiver ligado (exceto bicicletas, que não ligam/desligam)
                desabilitar = prefix !== 'bicicleta' && ligado;
                break;
            case 'desligar':
                // Botão 'Desligar' desabilitado se estiver desligado OU se estiver em movimento (exceto bicicletas)
                desabilitar = prefix !== 'bicicleta' && (!ligado || !parado);
                break;
            case 'acelerar':
            case 'pedalar': // 'Pedalar' para bicicleta é sinônimo de acelerar na UI
                // Botão 'Acelerar'/'Pedalar' desabilitado se estiver desligado (exceto bicicletas)
                desabilitar = prefix !== 'bicicleta' && !ligado;
                break;
            case 'frear':
                // Botão 'Frear' desabilitado se o veículo estiver parado
                desabilitar = parado;
                break;
            case 'ativarTurbo':
                // Botão 'Ativar Turbo' desabilitado se o veículo estiver desligado OU se o turbo já estiver ativo
                // Verifica se `turboAtivado` existe na instância do veículo (apenas para CarroEsportivo)
                desabilitar = !ligado || (veiculo.turboAtivado === true);
                break;
            case 'desativarTurbo':
                // Botão 'Desativar Turbo' desabilitado se o turbo não estiver ativo ou não for um CarroEsportivo
                desabilitar = (veiculo.turboAtivado === false || veiculo.turboAtivado === undefined);
                break;
            case 'carregar':
                // Botão 'Carregar' (para Caminhão) desabilitado se o caminhão estiver desligado
                desabilitar = !ligado;
                // Ou se o input de carga estiver vazio/inválido
                if (cargaInput && (!cargaInput.value || parseFloat(cargaInput.value) <= 0)) {
                    if(!desabilitar) desabilitar = true; // Só desabilita se o motivo não for 'estar desligado'
                }
                break;
            case 'descarregar':
                // Botão 'Descarregar' (para Caminhão) desabilitado se o caminhão estiver desligado OU se a carga atual for 0
                desabilitar = !ligado || veiculo.cargaAtual === 0;
                // Ou se o input de carga estiver vazio/inválido, a menos que a carga seja > 0 (permite descarregar "tudo")
                 if (cargaInput && (!cargaInput.value || parseFloat(cargaInput.value) <= 0)) {
                     if (!desabilitar && veiculo.cargaAtual > 0) { // Se não está desabilitado por outra razão
                         // Não desabilita se ainda tem carga, permitindo clicar para descarregar o total
                     } else if (!desabilitar) { // Desabilita se input inválido e não tem carga pra descarregar "tudo"
                         desabilitar = true;
                     }
                 }
                break;
            case 'buzinar':
                // O botão 'Buzinar' geralmente é sempre habilitado ou desabilitado se o veículo estiver desligado
                // Aqui, escolhemos habilitá-lo mesmo se o veículo estiver desligado (simula bateria)
                desabilitar = false; 
                // Se preferir que só buzine ligado (exceto bike), descomente:
                // if (prefix !== 'bicicleta') desabilitar = !ligado; 
                break;
            // Adicione mais casos conforme você expandir as ações dos veículos
        }
        // Aplica o estado `disabled` (true/false) ao botão HTML
        botao.disabled = desabilitar;
    });

    // Lógica específica para desabilitar o input de carga do caminhão
    if (cargaInput) {
        cargaInput.disabled = !ligado; // Desabilita o input se o caminhão estiver desligado
    }
>>>>>>> e6b4cfe7b3daa0b8532778724f7576f605c1a068
}