/**
 * @file Moto.js
 * @brief Classe que representa uma moto.
 */

import { Veiculo } from './Veiculo.js'; // ADICIONADO!
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, atualizarStatusVeiculo, mostrarFeedback, atualizarEstadoBotoes } from './funcoesAuxiliares.js';

/**
 * @class Moto
 * @extends Veiculo
 * @classdesc Representa uma moto que herda da classe Veiculo.
 */
export class Moto extends Veiculo {
    /**
     * @constructor
     * @param {string} modelo - O modelo da moto.
     * @param {string} cor - A cor da moto.
     */
    constructor(modelo, cor) {
        super(modelo, cor);
    }

    /**
     * @function acelerar
     * @returns {void}
     * @description Aumenta a velocidade da moto.
     */
    acelerar() {
        if (!this.acelerarBase()) return;
        this.velocidade += 15;
        tocarSom(sons.acelerar, 0.6);
        animarVeiculo(this.getIdPrefix(), 'acelerando');
        this.atualizarVelocidade();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @function frear
     * @returns {void}
     * @description Diminui a velocidade da moto.
     */
    frear() {
        if (!this.frearBase()) return;
        this.velocidade = Math.max(0, this.velocidade - 12);
        tocarSom(sons.frear, 0.7);
        animarVeiculo(this.getIdPrefix(), 'freando');
        this.atualizarVelocidade();
        if (this.velocidade === 0) this.atualizarStatus();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @function buzinar
     * @returns {void}
     * @description Toca o som da buzina da moto.
     */
    buzinar() {
        tocarSom(sons.buzina, 0.6);
    }

    /**
     * @function atualizarVelocidade
     * @returns {void}
     * @description Atualiza a exibição da velocidade da moto na interface.
     */
    atualizarVelocidade() {
        atualizarInfoVeiculo(this.getIdPrefix(), { velocidade: this.velocidade });
    }

    /**
     * @function atualizarStatus
     * @returns {void}
     * @description Atualiza o status da moto na interface.
     */
    atualizarStatus() {
        atualizarStatusVeiculo(this.getIdPrefix(), this.ligado, this.velocidade);
    }

    /**
     * @function atualizarEstadoBotoesWrapper
     * @returns {void}
     * @description Wrapper para atualizar o estado dos botões na interface.
     */
    atualizarEstadoBotoesWrapper() {
        atualizarEstadoBotoes(this);
    }
}