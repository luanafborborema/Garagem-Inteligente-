/**
 * @file CarroEsportivo.js
 * @brief Classe que representa um carro esportivo.
 */

import { Carro } from './Carro.js';
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, mostrarFeedback, atualizarEstadoBotoes } from './funcoesAuxiliares.js';

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
     */
    constructor(modelo, cor) {
        super(modelo, cor);
        /** @member {boolean} */
        this.turboAtivado = false;
    }

    /**
     * @function ativarTurbo
     * @returns {void}
     * @description Ativa o turbo do carro esportivo.
     */
    ativarTurbo() {
        if (!this.ligado) {
            mostrarFeedback("Ligue o carro!", 'warning');
            return;
        }
        if (!this.turboAtivado) {
            this.turboAtivado = true;
            this.atualizarTurbo();
            mostrarFeedback("Turbo ATIVADO!", 'info');
            this.atualizarEstadoBotoesWrapper();
        } else {
            mostrarFeedback("Turbo já ativado!", 'warning');
        }
    }

    /**
     * @function desativarTurbo
     * @returns {void}
     * @description Desativa o turbo do carro esportivo.
     */
    desativarTurbo() {
        if (this.turboAtivado) {
            this.turboAtivado = false;
            this.atualizarTurbo();
            mostrarFeedback("Turbo desativado.", 'info');
            this.atualizarEstadoBotoesWrapper();
        } else {
            mostrarFeedback("Turbo já desativado!", 'warning');
        }
    }

    /**
     * @function acelerar
     * @returns {void}
     * @description Aumenta a velocidade do carro esportivo, com um bônus se o turbo estiver ativado.
     */
    acelerar() {
        if (!this.acelerarBase()) return;
        const i = 15 + (this.turboAtivado ? 35 : 0);
        this.velocidade += i;
        tocarSom(sons.acelerar, this.turboAtivado ? 0.8 : 0.6);
        animarVeiculo(this.getIdPrefix(), 'acelerando');
        this.atualizarVelocidade();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @function frear
     * @returns {void}
     * @description Diminui a velocidade do carro esportivo.
     */
    frear() {
        if (!this.frearBase()) return;
        this.velocidade = Math.max(0, this.velocidade - 15);
        tocarSom(sons.frear, 0.6);
        animarVeiculo(this.getIdPrefix(), 'freando');
        this.atualizarVelocidade();
        if (this.velocidade === 0) this.atualizarStatus();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @function atualizarTurbo
     * @returns {void}
     * @description Atualiza a exibição do turbo na interface.
     */
    atualizarTurbo() {
        atualizarInfoVeiculo(this.getIdPrefix(), { turbo: this.turboAtivado ? "Ativado" : "Desativado" });
    }

    /**
     * @function desligar
     * @override
     * @returns {void}
     * @description Desliga o carro esportivo e desativa o turbo, se estiver ativado.
     */
    desligar() {
        super.desligar();
        if (this.turboAtivado) this.desativarTurbo();
    }

    /**
     * @function buzinar
     * @override
     * @returns {void}
     * @description Toca o som da buzina do carro esportivo.
     */
    buzinar() {
        tocarSom(sons.buzina, 0.7);
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