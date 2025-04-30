/**
 * @file CarroEsportivo.js
 * @brief Classe que representa um carro esportivo.
 */

import { Carro } from './Carro.js'; // Importa a classe Carro (que já importa Veiculo)
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, mostrarFeedback, atualizarEstadoBotoes, atualizarStatusVeiculo } from './funcoesAuxiliares.js'; // Importa helpers

/**
 * @class CarroEsportivo
 * @extends Carro
 * @classdesc Representa um carro esportivo que herda da classe Carro.
 */
export class CarroEsportivo extends Carro {
    /**
     * @constructor
     * @param {string} modelo - O modelo do carro esportivo.
     * @param {string} cor - A cor do carro esportivo.
     * @param {string} [id] - ID opcional (para recarregar).
     * @param {Array} [historico] - Histórico opcional (para recarregar).
     * @param {boolean} [turboAtivado=false] - Estado inicial do turbo (para recarregar).
     */
    constructor(modelo, cor, id = null, historico = [], turboAtivado = false) {
        super(modelo, cor, id, historico); // Chama o construtor do Carro
        /** @member {boolean} */
        this.turboAtivado = turboAtivado; // Restaura ou inicia como false
        // Garante que o tipo e prefixo sejam 'esportivo'
        this._setTipoEIdPrefix(); // Sobrescreve o _setTipoEIdPrefix do Veiculo/Carro se necessário
    }

    // Sobrescreve _setTipoEIdPrefix para garantir 'esportivo'
    _setTipoEIdPrefix() {
        this.tipo = 'esportivo';
        this.idPrefix = 'esportivo';
    }


    /** @description Ativa o turbo do carro esportivo. */
    ativarTurbo() {
        if (!this.ligado) {
            mostrarFeedback("Ligue o carro esportivo antes de ativar o turbo!", 'warning');
            return;
        }
        if (!this.turboAtivado) {
            this.turboAtivado = true;
            this.atualizarTurboDisplay(); // Atualiza o display do turbo
            mostrarFeedback("Turbo ATIVADO! 🔥", 'info');
            this.atualizarEstadoBotoesWrapper(); // Atualiza botões (desabilita ON, habilita OFF)
            // Poderia tocar um som de turbo ativando aqui
        } else {
            mostrarFeedback("O turbo já está ativado!", 'warning');
        }
    }

    /** @description Desativa o turbo do carro esportivo. */
    desativarTurbo() {
        if (this.turboAtivado) {
            this.turboAtivado = false;
            this.atualizarTurboDisplay(); // Atualiza o display do turbo
            mostrarFeedback("Turbo desativado.", 'info');
            this.atualizarEstadoBotoesWrapper(); // Atualiza botões (habilita ON, desabilita OFF)
            // Poderia tocar um som de turbo desativando aqui
        } else {
            mostrarFeedback("O turbo já está desativado.", 'warning');
        }
    }

    /**
     * @description Aumenta a velocidade, com bônus se o turbo estiver ativado.
     * @override
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    acelerar(sons) {
        if (!this.acelerarBase()) return; // Verifica se está ligado

        // Aceleração base + bônus do turbo
        const incremento = 15 + (this.turboAtivado ? 35 : 0);
        this.velocidade += incremento;

        // Som mais intenso com turbo
        if (sons && sons.acelerar) tocarSom(sons.acelerar, this.turboAtivado ? 0.8 : 0.6);
        animarVeiculo(this.getIdPrefix(), 'acelerando');
        this.atualizarVelocidade();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @description Diminui a velocidade do carro esportivo (freio mais potente).
     * @override
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    frear(sons) {
        if (!this.frearBase()) return; // Verifica se está em movimento

        this.velocidade = Math.max(0, this.velocidade - 20); // Freio mais forte que o carro normal

        if (sons && sons.frear) tocarSom(sons.frear, 0.6);
        animarVeiculo(this.getIdPrefix(), 'freando');
        this.atualizarVelocidade();

        if (this.velocidade === 0) {
            this.atualizarStatus();
             // Se parar, desativar o turbo automaticamente? (Opcional)
             // if (this.turboAtivado) this.desativarTurbo();
        }
        this.atualizarEstadoBotoesWrapper();
    }

    /** @description Atualiza a exibição do status do turbo na interface. */
    atualizarTurboDisplay() {
        atualizarInfoVeiculo(this.getIdPrefix(), { turbo: this.turboAtivado });
    }

    /**
     * @description Desliga o carro e desativa o turbo se estiver ativo.
     * @override
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    desligar(sons) {
        // Chama o desligar da classe pai (Carro -> Veiculo)
        super.desligar(sons);
        // Se o carro foi desligado com sucesso (estava ligado e parado)
        if (!this.ligado && this.turboAtivado) {
            this.desativarTurbo(); // Desativa o turbo ao desligar
        }
         // Garante que display do turbo está correto ao desligar
        this.atualizarTurboDisplay();
        this.atualizarEstadoBotoesWrapper(); // Garante botões atualizados
    }

    /**
     * @description Toca o som da buzina (pode ser diferente).
     * @override
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    buzinar(sons) {
        // Som de buzina mais alto/diferente para esportivo
        if (sons && sons.buzina) tocarSom(sons.buzina, 0.7);
        else super.buzinar(sons); // Usa padrão se não houver som específico
    }

    // Os métodos atualizarVelocidade e atualizarStatus são herdados e geralmente
    // suficientes. O atualizarEstadoBotoesWrapper também é herdado.
    // Precisamos garantir que eles sejam chamados nos momentos certos.

    // Sobrescreve toJSON para incluir o estado do turbo
    toJSON() {
        const data = super.toJSON(); // Pega os dados da classe pai (Carro -> Veiculo)
        data.turboAtivado = this.turboAtivado; // Adiciona o estado do turbo
        return data;
    }
}