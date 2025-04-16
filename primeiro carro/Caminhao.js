/**
 * @file Caminhao.js
 * @brief Classe que representa um caminhão.
 */

import { Carro } from './Carro.js';
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, mostrarFeedback, atualizarEstadoBotoes, atualizarStatusVeiculo } from './funcoesAuxiliares.js';

/**
 * @class Caminhao
 * @extends Carro
 * @classdesc Representa um caminhão que herda da classe Carro.
 */
export class Caminhao extends Carro {
    /**
     * @constructor
     * @param {string} modelo - O modelo do caminhão.
     * @param {string} cor - A cor do caminhão.
     * @param {number} [cap=5000] - A capacidade de carga do caminhão em kg.
     */
    constructor(modelo, cor, cap = 5000) {
        super(modelo, cor);
        /** @member {number} */
        this.capacidadeCarga = cap;
        /** @member {number} */
        this.cargaAtual = 0;
    }

    /**
     * @function carregar
     * @param {number} q - A quantidade de carga a ser carregada em kg.
     * @returns {boolean} - Retorna true se a carga foi adicionada com sucesso, false caso contrário.
     * @description Carrega uma quantidade de carga no caminhão.
     */
    carregar(q) {
        if (isNaN(q) || q <= 0) {
            mostrarFeedback("Carga inválida (> 0).", 'error');
            return false;
        }
        if (this.cargaAtual + q <= this.capacidadeCarga) {
            this.cargaAtual += q;
            this.atualizarInfoCaminhao();
            mostrarFeedback(`Carga atual: ${this.cargaAtual}kg.`, 'success');
            salvarGaragem();
            return true;
        } else {
            mostrarFeedback(`Capacidade ${this.capacidadeCarga}kg excedida!`, 'error');
            return false;
        }
    }

    /**
     * @function descarregar
     * @param {number} q - A quantidade de carga a ser descarregada em kg.
     * @returns {boolean} - Retorna true se a carga foi removida com sucesso, false caso contrário.
     * @description Descarrega uma quantidade de carga do caminhão.
     */
    descarregar(q) { /* TODO */
        return false;
    }

    /**
     * @function atualizarInfoCaminhao
     * @returns {void}
     * @description Atualiza as informações do caminhão na interface.
     */
    atualizarInfoCaminhao() {
        atualizarInfoVeiculo(this.getIdPrefix(), { carga: this.cargaAtual, capacidade: this.capacidadeCarga });
    }

    /**
     * @function acelerar
     * @override
     * @returns {void}
     * @description Acelera o caminhão, levando em conta a carga atual.
     */
    acelerar() {
        if (!this.acelerarBase()) return;
        const f = 1 - (this.cargaAtual / (this.capacidadeCarga * 2));
        this.velocidade += Math.max(2, 5 * f);
        tocarSom(sons.acelerar, 0.4);
        animarVeiculo(this.getIdPrefix(), 'acelerando');
        this.atualizarVelocidade();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @function frear
     * @override
     * @returns {void}
     * @description Freia o caminhão, levando em conta a carga atual.
     */
    frear() {
        if (!this.frearBase()) return;
        const f = 1 + (this.cargaAtual / (this.capacidadeCarga * 2));
        this.velocidade = Math.max(0, this.velocidade - Math.max(3, 7 / f));
        tocarSom(sons.frear, 0.6);
        animarVeiculo(this.getIdPrefix(), 'freando');
        this.atualizarVelocidade();
        if (this.velocidade === 0) this.atualizarStatus();
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @function buzinar
     * @override
     * @returns {void}
     * @description Toca o som da buzina do caminhão.
     */
    buzinar() {
        tocarSom(sons.buzina, 0.9);
    }

    /**
     * @function atualizarVelocidade
     * @returns {void}
     * @description Atualiza a exibição da velocidade do caminhão na interface.
     */
    atualizarVelocidade() {
        atualizarInfoVeiculo(this.getIdPrefix(), { velocidade: this.velocidade });
    }

    /**
     * @function atualizarStatus
     * @returns {void}
     * @description Atualiza o status do caminhão na interface.
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