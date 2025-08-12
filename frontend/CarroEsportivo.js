<<<<<<< HEAD
// ginteligente/CarroEsportivo.js (ou a pasta onde estão suas classes JS)
// CONTEÚDO COMPLETO DO ARQUIVO: SUBSTITUA TUDO QUE JÁ EXISTE POR ISTO.

// Importa a classe `Carro` (CarroEsportivo herda de Carro, que já herda de Veiculo).
// O caminho './Carro.js' deve estar correto.
import { Carro } from './Carro.js'; 
// Importa funções auxiliares necessárias de `funcoesAuxiliares.js`.
import { tocarSom, animarVeiculo, mostrarFeedback, atualizarInfoVeiculo } from './funcoesAuxiliares.js'; 

/**
 * @class CarroEsportivo
 * @extends Carro
 * @classdesc Representa um carro esportivo na Garagem Inteligente.
 * Possui funcionalidades avançadas como a ativação/desativação do turbo, que afeta sua aceleração.
 */
export class CarroEsportivo extends Carro {
    /**
     * Construtor da classe CarroEsportivo.
     * @constructor
     * @param {string} modelo - O modelo do carro esportivo (ex: "Ferrari F8").
     * @param {string} cor - A cor do carro esportivo (ex: "Vermelho").
     * @param {string} [id=null] - ID opcional, usado para recarregar o veículo do `localStorage`.
     * @param {Array} [historico=[]] - Histórico de manutenções opcional, usado ao recarregar de JSON.
     * @param {boolean} [turboAtivado=false] - Estado inicial do turbo, usado para restaurar do `localStorage`.
     */
    constructor(modelo, cor, id = null, historico = [], turboAtivado = false) {
        // Chama o construtor da classe pai `Carro` (que por sua vez chama `Veiculo`).
        super(modelo, cor, id, historico); 
        /** @member {boolean} */
        this.turboAtivado = turboAtivado; // Inicializa ou restaura o estado do turbo.
        // Define o tipo e prefixo para o objeto e para uso em IDs de elementos HTML, específicos para "esportivo".
        this._setTipoEIdPrefix(); 
        // Atualiza a exibição inicial do status do turbo na UI (ex: "Ativado" ou "Desativado").
        this.atualizarTurboDisplay();
    }

    /**
     * Sobrescreve o método `_setTipoEIdPrefix` da classe base (`Carro`/`Veiculo`) para definir o tipo e prefixo de ID como 'esportivo'.
     * Isso é fundamental para a correta identificação dos elementos HTML relacionados a este tipo de veículo na interface.
     * @override
     * @protected
     */
    _setTipoEIdPrefix() {
        this.tipo = 'esportivo'; // Tipo lógico usado internamente na aplicação.
        this.idPrefix = 'esportivo'; // Prefixo usado para IDs de elementos HTML (ex: `esportivo-velocidade`).
    }

    /**
     * Ativa o turbo do carro esportivo. O turbo só pode ser ativado se o carro estiver ligado
     * e o turbo ainda não estiver ativado. Exibe feedback ao usuário e atualiza a UI.
     */
    ativarTurbo() {
        if (!this.ligado) {
            mostrarFeedback("Erro: O carro esportivo precisa estar ligado para ativar o turbo!", 'warning');
            return;
        }
        if (!this.turboAtivado) {
            this.turboAtivado = true; // Altera o estado do turbo para ativado.
            this.atualizarTurboDisplay(); // Atualiza o display textual do turbo na UI.
            mostrarFeedback("Turbo ATIVADO! 🔥 Prepare-se para a potência máxima!", 'info');
            this.atualizarEstadoBotoesWrapper(); // Reabilita/desabilita os botões de ação na UI (ex: desabilita Turbo ON, habilita Turbo OFF).
            // Tenta tocar um som específico de turbo ativando se configurado em `window.sons`.
            if (window.sons && window.sons.turboOn) tocarSom(window.sons.turboOn, 0.7); 
        } else {
            mostrarFeedback("Aviso: O turbo já está ativado no seu carro esportivo.", 'warning');
        }
    }

    /**
     * Desativa o turbo do carro esportivo. Exibe feedback ao usuário e atualiza a UI.
     */
    desativarTurbo() {
        if (this.turboAtivado) {
            this.turboAtivado = false; // Altera o estado do turbo para desativado.
            this.atualizarTurboDisplay(); // Atualiza o display textual do turbo na UI.
            mostrarFeedback("Turbo desativado. Dirigindo em modo padrão.", 'info');
            this.atualizarEstadoBotoesWrapper(); // Atualiza os botões (habilita Turbo ON, desabilita Turbo OFF).
            // Tenta tocar um som específico de turbo desativando se configurado.
            if (window.sons && window.sons.turboOff) tocarSom(window.sons.turboOff, 0.7); 
        } else {
            mostrarFeedback("Aviso: O turbo já está desativado no seu carro esportivo.", 'warning');
        }
    }

    /**
     * Aumenta a velocidade do carro esportivo. A aceleração é significativamente maior
     * se o turbo estiver ativado, representando o ganho de potência.
     * Este método sobrescreve o método `acelerar` da classe `Carro`.
     * @override
     * @param {object} sons - O objeto `window.sons` que contém os elementos de áudio para tocar.
     */
    acelerar(sons) {
        // Chama `acelerarBase()` da classe `Veiculo` para verificar se o carro está ligado e pode acelerar.
        if (!this.acelerarBase()) return; 

        const incrementoBase = 15; // Aumento de velocidade base para um carro esportivo (já maior que um carro comum).
        const bonusTurbo = this.turboAtivado ? 35 : 0; // Bônus significativo se o turbo estiver ativo.
        this.velocidade += (incrementoBase + bonusTurbo); // Calcula a nova velocidade.

        // Toca o som de aceleração. O volume é maior se o turbo estiver ativo para dar mais impacto.
        if (sons && sons.acelerar) tocarSom(sons.acelerar, this.turboAtivado ? 0.8 : 0.6);
        animarVeiculo(this.getIdPrefix(), 'acelerando'); // Aplica a animação visual de aceleração na imagem do carro.
        this.atualizarVelocidade(); // Atualiza o display numérico da velocidade na UI.
        this.atualizarEstadoBotoesWrapper(); // Atualiza o estado de habilitação/desabilitação dos botões.
        mostrarFeedback(`${this.modelo} acelerou com ${this.turboAtivado ? 'TURBO ON!' : 'velocidade normal'}. Velocidade: ${this.velocidade} km/h.`, 'info');
    }

    /**
     * Diminui a velocidade do carro esportivo (simula uma frenagem mais potente em comparação com carros comuns).
     * Este método sobrescreve o método `frear` da classe `Carro`.
     * @override
     * @param {object} sons - O objeto `window.sons` que contém os elementos de áudio.
     */
    frear(sons) {
        // Chama `frearBase()` da classe `Veiculo` para verificar se o carro está em movimento.
        if (!this.frearBase()) return; 

        this.velocidade = Math.max(0, this.velocidade - 20); // Decremento de velocidade mais rápido para frenagem forte.

        if (sons && sons.frear) tocarSom(sons.frear, 0.6); // Toca o som de frear.
        animarVeiculo(this.getIdPrefix(), 'freando'); // Aplica a animação visual de frenagem.
        this.atualizarVelocidade(); // Atualiza o display numérico da velocidade na UI.

        if (this.velocidade === 0) {
            this.atualizarStatus(); // Se o carro parou, atualiza o status na UI.
            mostrarFeedback(`${this.modelo} parou completamente.`, 'info');
        } else {
            mostrarFeedback(`${this.modelo} freou. Velocidade: ${this.velocidade} km/h.`, 'info');
        }
        this.atualizarEstadoBotoesWrapper(); // Atualiza o estado dos botões.
    }

    /**
     * Toca a buzina do carro esportivo. Pode usar um som diferente ou ter volume maior
     * para um carro esportivo. Sobrescreve o método `buzinar` da classe `Carro`.
     * @override
     * @param {object} sons - O objeto `window.sons` que contém os elementos de áudio.
     */
    buzinar(sons) {
        // Se `window.sons.buzinaEsportivo` (um som de buzina específico para esportivo) existir, toca-o com volume mais alto.
        if (sons && sons.buzinaEsportivo) tocarSom(sons.buzinaEsportivo, 0.7); 
        // Caso contrário, chama o método `buzinar` da classe pai `Carro` (que por sua vez chama `Veiculo`).
        else super.buzinar(sons);
        mostrarFeedback(`${this.modelo} buzinou com força!`, 'info');
    }

    /**
     * Desliga o carro esportivo. Além de desligar, se o turbo estiver ativo no momento de desligar, ele é automaticamente desativado.
     * Este método sobrescreve o método `desligar` da classe `Carro`.
     * @override
     * @param {object} sons - O objeto `window.sons` que contém os elementos de áudio.
     */
    desligar(sons) {
        // Chama o método `desligar` da classe pai `Carro`. Isso garante que o comportamento básico de desligar (parar o carro, atualizar status) seja executado.
        super.desligar(sons);
        // Após a tentativa de desligar (verificando `!this.ligado` para saber se foi bem-sucedido),
        // se o carro não está mais ligado E o turbo estava ativo, desativa o turbo.
        if (!this.ligado && this.turboAtivado) { 
            this.desativarTurbo(); 
        }
        // Garante que o display do turbo na UI esteja sempre correto (desativado se o carro estiver desligado).
        this.atualizarTurboDisplay();
        this.atualizarEstadoBotoesWrapper(); // Garante que os botões (incluindo os do turbo) sejam atualizados após a ação de desligar.
    }

    /**
     * Atualiza a exibição do status do turbo na interface (elemento HTML com ID `${idPrefix}-turbo`).
     * Exibirá "Ativado" ou "Desativado".
     */
    atualizarTurboDisplay() {
        // Utiliza a função auxiliar `atualizarInfoVeiculo` para manipular o elemento HTML.
        // A função auxiliar pegará o `idPrefix` (ex: 'esportivo') e procurará o elemento com ID `esportivo-turbo`.
        atualizarInfoVeiculo(this.getIdPrefix(), { turbo: this.turboAtivado });
    }

    /**
     * Sobrescreve o método `toJSON` da classe pai (`Carro`).
     * Adiciona o estado `turboAtivado` ao objeto JSON. Isso é fundamental para garantir
     * que o estado do turbo seja salvo na `localStorage` e possa ser restaurado corretamente
     * ao carregar a garagem.
     * @override
     * @returns {object} Um objeto simples contendo os dados do carro esportivo para serialização JSON.
     */
    toJSON() {
        const data = super.toJSON(); // Obtém todos os dados da classe pai (`Carro`, que já inclui os de `Veiculo`).
        data.turboAtivado = this.turboAtivado; // Adiciona o estado específico do turbo ao objeto de dados.
        return data; // Retorna o objeto completo para ser convertido em JSON.
    }
=======
// ginteligente/CarroEsportivo.js (ou a pasta onde estão suas classes JS)
// CONTEÚDO COMPLETO DO ARQUIVO: SUBSTITUA TUDO QUE JÁ EXISTE POR ISTO.

// Importa a classe `Carro` (CarroEsportivo herda de Carro, que já herda de Veiculo).
// O caminho './Carro.js' deve estar correto.
import { Carro } from './Carro.js'; 
// Importa funções auxiliares necessárias de `funcoesAuxiliares.js`.
import { tocarSom, animarVeiculo, mostrarFeedback, atualizarInfoVeiculo } from './funcoesAuxiliares.js'; 

/**
 * @class CarroEsportivo
 * @extends Carro
 * @classdesc Representa um carro esportivo na Garagem Inteligente.
 * Possui funcionalidades avançadas como a ativação/desativação do turbo, que afeta sua aceleração.
 */
export class CarroEsportivo extends Carro {
    /**
     * Construtor da classe CarroEsportivo.
     * @constructor
     * @param {string} modelo - O modelo do carro esportivo (ex: "Ferrari F8").
     * @param {string} cor - A cor do carro esportivo (ex: "Vermelho").
     * @param {string} [id=null] - ID opcional, usado para recarregar o veículo do `localStorage`.
     * @param {Array} [historico=[]] - Histórico de manutenções opcional, usado ao recarregar de JSON.
     * @param {boolean} [turboAtivado=false] - Estado inicial do turbo, usado para restaurar do `localStorage`.
     */
    constructor(modelo, cor, id = null, historico = [], turboAtivado = false) {
        // Chama o construtor da classe pai `Carro` (que por sua vez chama `Veiculo`).
        super(modelo, cor, id, historico); 
        /** @member {boolean} */
        this.turboAtivado = turboAtivado; // Inicializa ou restaura o estado do turbo.
        // Define o tipo e prefixo para o objeto e para uso em IDs de elementos HTML, específicos para "esportivo".
        this._setTipoEIdPrefix(); 
        // Atualiza a exibição inicial do status do turbo na UI (ex: "Ativado" ou "Desativado").
        this.atualizarTurboDisplay();
    }

    /**
     * Sobrescreve o método `_setTipoEIdPrefix` da classe base (`Carro`/`Veiculo`) para definir o tipo e prefixo de ID como 'esportivo'.
     * Isso é fundamental para a correta identificação dos elementos HTML relacionados a este tipo de veículo na interface.
     * @override
     * @protected
     */
    _setTipoEIdPrefix() {
        this.tipo = 'esportivo'; // Tipo lógico usado internamente na aplicação.
        this.idPrefix = 'esportivo'; // Prefixo usado para IDs de elementos HTML (ex: `esportivo-velocidade`).
    }

    /**
     * Ativa o turbo do carro esportivo. O turbo só pode ser ativado se o carro estiver ligado
     * e o turbo ainda não estiver ativado. Exibe feedback ao usuário e atualiza a UI.
     */
    ativarTurbo() {
        if (!this.ligado) {
            mostrarFeedback("Erro: O carro esportivo precisa estar ligado para ativar o turbo!", 'warning');
            return;
        }
        if (!this.turboAtivado) {
            this.turboAtivado = true; // Altera o estado do turbo para ativado.
            this.atualizarTurboDisplay(); // Atualiza o display textual do turbo na UI.
            mostrarFeedback("Turbo ATIVADO! 🔥 Prepare-se para a potência máxima!", 'info');
            this.atualizarEstadoBotoesWrapper(); // Reabilita/desabilita os botões de ação na UI (ex: desabilita Turbo ON, habilita Turbo OFF).
            // Tenta tocar um som específico de turbo ativando se configurado em `window.sons`.
            if (window.sons && window.sons.turboOn) tocarSom(window.sons.turboOn, 0.7); 
        } else {
            mostrarFeedback("Aviso: O turbo já está ativado no seu carro esportivo.", 'warning');
        }
    }

    /**
     * Desativa o turbo do carro esportivo. Exibe feedback ao usuário e atualiza a UI.
     */
    desativarTurbo() {
        if (this.turboAtivado) {
            this.turboAtivado = false; // Altera o estado do turbo para desativado.
            this.atualizarTurboDisplay(); // Atualiza o display textual do turbo na UI.
            mostrarFeedback("Turbo desativado. Dirigindo em modo padrão.", 'info');
            this.atualizarEstadoBotoesWrapper(); // Atualiza os botões (habilita Turbo ON, desabilita Turbo OFF).
            // Tenta tocar um som específico de turbo desativando se configurado.
            if (window.sons && window.sons.turboOff) tocarSom(window.sons.turboOff, 0.7); 
        } else {
            mostrarFeedback("Aviso: O turbo já está desativado no seu carro esportivo.", 'warning');
        }
    }

    /**
     * Aumenta a velocidade do carro esportivo. A aceleração é significativamente maior
     * se o turbo estiver ativado, representando o ganho de potência.
     * Este método sobrescreve o método `acelerar` da classe `Carro`.
     * @override
     * @param {object} sons - O objeto `window.sons` que contém os elementos de áudio para tocar.
     */
    acelerar(sons) {
        // Chama `acelerarBase()` da classe `Veiculo` para verificar se o carro está ligado e pode acelerar.
        if (!this.acelerarBase()) return; 

        const incrementoBase = 15; // Aumento de velocidade base para um carro esportivo (já maior que um carro comum).
        const bonusTurbo = this.turboAtivado ? 35 : 0; // Bônus significativo se o turbo estiver ativo.
        this.velocidade += (incrementoBase + bonusTurbo); // Calcula a nova velocidade.

        // Toca o som de aceleração. O volume é maior se o turbo estiver ativo para dar mais impacto.
        if (sons && sons.acelerar) tocarSom(sons.acelerar, this.turboAtivado ? 0.8 : 0.6);
        animarVeiculo(this.getIdPrefix(), 'acelerando'); // Aplica a animação visual de aceleração na imagem do carro.
        this.atualizarVelocidade(); // Atualiza o display numérico da velocidade na UI.
        this.atualizarEstadoBotoesWrapper(); // Atualiza o estado de habilitação/desabilitação dos botões.
        mostrarFeedback(`${this.modelo} acelerou com ${this.turboAtivado ? 'TURBO ON!' : 'velocidade normal'}. Velocidade: ${this.velocidade} km/h.`, 'info');
    }

    /**
     * Diminui a velocidade do carro esportivo (simula uma frenagem mais potente em comparação com carros comuns).
     * Este método sobrescreve o método `frear` da classe `Carro`.
     * @override
     * @param {object} sons - O objeto `window.sons` que contém os elementos de áudio.
     */
    frear(sons) {
        // Chama `frearBase()` da classe `Veiculo` para verificar se o carro está em movimento.
        if (!this.frearBase()) return; 

        this.velocidade = Math.max(0, this.velocidade - 20); // Decremento de velocidade mais rápido para frenagem forte.

        if (sons && sons.frear) tocarSom(sons.frear, 0.6); // Toca o som de frear.
        animarVeiculo(this.getIdPrefix(), 'freando'); // Aplica a animação visual de frenagem.
        this.atualizarVelocidade(); // Atualiza o display numérico da velocidade na UI.

        if (this.velocidade === 0) {
            this.atualizarStatus(); // Se o carro parou, atualiza o status na UI.
            mostrarFeedback(`${this.modelo} parou completamente.`, 'info');
        } else {
            mostrarFeedback(`${this.modelo} freou. Velocidade: ${this.velocidade} km/h.`, 'info');
        }
        this.atualizarEstadoBotoesWrapper(); // Atualiza o estado dos botões.
    }

    /**
     * Toca a buzina do carro esportivo. Pode usar um som diferente ou ter volume maior
     * para um carro esportivo. Sobrescreve o método `buzinar` da classe `Carro`.
     * @override
     * @param {object} sons - O objeto `window.sons` que contém os elementos de áudio.
     */
    buzinar(sons) {
        // Se `window.sons.buzinaEsportivo` (um som de buzina específico para esportivo) existir, toca-o com volume mais alto.
        if (sons && sons.buzinaEsportivo) tocarSom(sons.buzinaEsportivo, 0.7); 
        // Caso contrário, chama o método `buzinar` da classe pai `Carro` (que por sua vez chama `Veiculo`).
        else super.buzinar(sons);
        mostrarFeedback(`${this.modelo} buzinou com força!`, 'info');
    }

    /**
     * Desliga o carro esportivo. Além de desligar, se o turbo estiver ativo no momento de desligar, ele é automaticamente desativado.
     * Este método sobrescreve o método `desligar` da classe `Carro`.
     * @override
     * @param {object} sons - O objeto `window.sons` que contém os elementos de áudio.
     */
    desligar(sons) {
        // Chama o método `desligar` da classe pai `Carro`. Isso garante que o comportamento básico de desligar (parar o carro, atualizar status) seja executado.
        super.desligar(sons);
        // Após a tentativa de desligar (verificando `!this.ligado` para saber se foi bem-sucedido),
        // se o carro não está mais ligado E o turbo estava ativo, desativa o turbo.
        if (!this.ligado && this.turboAtivado) { 
            this.desativarTurbo(); 
        }
        // Garante que o display do turbo na UI esteja sempre correto (desativado se o carro estiver desligado).
        this.atualizarTurboDisplay();
        this.atualizarEstadoBotoesWrapper(); // Garante que os botões (incluindo os do turbo) sejam atualizados após a ação de desligar.
    }

    /**
     * Atualiza a exibição do status do turbo na interface (elemento HTML com ID `${idPrefix}-turbo`).
     * Exibirá "Ativado" ou "Desativado".
     */
    atualizarTurboDisplay() {
        // Utiliza a função auxiliar `atualizarInfoVeiculo` para manipular o elemento HTML.
        // A função auxiliar pegará o `idPrefix` (ex: 'esportivo') e procurará o elemento com ID `esportivo-turbo`.
        atualizarInfoVeiculo(this.getIdPrefix(), { turbo: this.turboAtivado });
    }

    /**
     * Sobrescreve o método `toJSON` da classe pai (`Carro`).
     * Adiciona o estado `turboAtivado` ao objeto JSON. Isso é fundamental para garantir
     * que o estado do turbo seja salvo na `localStorage` e possa ser restaurado corretamente
     * ao carregar a garagem.
     * @override
     * @returns {object} Um objeto simples contendo os dados do carro esportivo para serialização JSON.
     */
    toJSON() {
        const data = super.toJSON(); // Obtém todos os dados da classe pai (`Carro`, que já inclui os de `Veiculo`).
        data.turboAtivado = this.turboAtivado; // Adiciona o estado específico do turbo ao objeto de dados.
        return data; // Retorna o objeto completo para ser convertido em JSON.
    }
>>>>>>> e6b4cfe7b3daa0b8532778724f7576f605c1a068
}