/**
 * @file Bicicleta.js
 * @brief Classe que representa uma bicicleta.
 */

import { Veiculo } from './Veiculo.js'; // ADICIONADO!
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, atualizarStatusVeiculo, mostrarFeedback, atualizarEstadoBotoes } from './funcoesAuxiliares.js';

/**
 * @class Bicicleta
 * @extends Veiculo
 * @classdesc Representa uma bicicleta que herda da classe Veiculo.
 */
export class Bicicleta extends Veiculo {
    /**
     * @constructor
     * @param {string} modelo - O modelo da bicicleta.
     * @param {string} cor - A cor da bicicleta.
     */
    constructor(modelo, cor) {
        super(modelo, cor);
        /** @member {boolean} */
        this.ligado = true; // Bicicleta sempre "ligada"
        /** @member {number} */
        this.velocidade = 0;
    }

    /**
     * @function ligar
     * @returns {void}
     * @description Simula a ação de ligar a bicicleta (exibe feedback).
     */
    ligar() {
        mostrarFeedback("Bicicleta pronta!", 'info');
    }

    /**
     * @function desligar
     * @returns {void}
     * @description Simula a ação de desligar a bicicleta (exibe feedback).
     */
    desligar() {
        mostrarFeedback(this.velocidade > 0 ? "Use o freio!" : "Bicicleta parada.", 'info');
    }

    /**
     * @function pedalar
     * @description Aumenta a velocidade da bicicleta ao pedalar.
     */
    pedalar() {
        this.velocidade += 2;
        animarVeiculo(this.getIdPrefix(), 'acelerando');
        this.atualizarVelocidade();
        this.atualizarStatus();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @function frear
     * @description Diminui a velocidade da bicicleta ao frear.
     */
    frear() {
        if (this.velocidade > 0) {
            this.velocidade = Math.max(0, this.velocidade - 1.5);
            animarVeiculo(this.getIdPrefix(), 'freando');
            this.atualizarVelocidade();
            if (this.velocidade === 0) this.atualizarStatus();
            this.atualizarEstadoBotoesWrapper();
        }
    }

    /**
     * @function acelerar
     * @description Simula a ação de acelerar pedalando.
     */
    acelerar() {
        this.pedalar();
    }

    /**
     * @function buzinar
     * @description Toca a campainha da bicicleta.
     */
    buzinar() {
        tocarSom(sons.buzina, 0.3);
        console.log(`${this.modelo} campainha!`);
    }

    /**
     * @function atualizarVelocidade
     * @returns {void}
     * @description Atualiza a exibição da velocidade da bicicleta na interface.
     */
    atualizarVelocidade() {
        atualizarInfoVeiculo(this.getIdPrefix(), { velocidade: this.velocidade });
    }

    /**
     * @function atualizarStatus
     * @override
     * @returns {void}
     * @description Atualiza o status da bicicleta na interface.
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