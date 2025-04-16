/**
 * @file Carro.js
 * @brief Classe que representa um carro comum.
 */

import { Veiculo } from './Veiculo.js';
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, atualizarStatusVeiculo, mostrarFeedback, atualizarEstadoBotoes } from './funcoesAuxiliares.js';

/**
 * @class Carro
 * @extends Veiculo
 * @classdesc Representa um carro comum que herda da classe Veiculo.
 */
export class Carro extends Veiculo {
    /**
     * @constructor
     * @param {string} modelo - O modelo do carro.
     * @param {string} cor - A cor do carro.
     */
    constructor(modelo, cor) {
        super(modelo, cor);
    }

    /**
     * @function acelerar
     * @returns {void}
     * @description Aumenta a velocidade do carro em 10 km/h.
     */
    acelerar() {
        if (!this.acelerarBase()) return;
        this.velocidade += 10;
        tocarSom(sons.acelerar, 0.5);
        animarVeiculo(this.getIdPrefix(), 'acelerando');
        this.atualizarVelocidade();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @function frear
     * @returns {void}
     * @description Diminui a velocidade do carro em 10 km/h.
     */
    frear() {
        if (!this.frearBase()) return;
        this.velocidade = Math.max(0, this.velocidade - 10);
        tocarSom(sons.frear, 0.5);
        animarVeiculo(this.getIdPrefix(), 'freando');
        this.atualizarVelocidade();
        if (this.velocidade === 0) this.atualizarStatus();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @function atualizarVelocidade
     * @returns {void}
     * @description Atualiza a exibição da velocidade do carro na interface.
     */
    atualizarVelocidade() {
        atualizarInfoVeiculo(this.getIdPrefix(), { velocidade: this.velocidade });
    }

    /**
     * @function atualizarStatus
     * @returns {void}
     * @description Atualiza o status do carro na interface.
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