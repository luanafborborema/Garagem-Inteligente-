/**
 * @file Moto.js
 * @brief Classe que representa uma moto.
 */

import { Veiculo } from './Veiculo.js'; // Importa a classe base Veiculo
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, atualizarStatusVeiculo, mostrarFeedback, atualizarEstadoBotoes } from './funcoesAuxiliares.js'; // Importa helpers

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
     * @param {string} [id] - ID opcional (para recarregar).
     * @param {Array} [historico] - Histórico opcional (para recarregar).
     */
    constructor(modelo, cor, id = null, historico = []) {
        super(modelo, cor, id, historico); // Chama o construtor da classe pai (Veiculo)
        // Garante que o tipo e prefixo sejam 'moto'
        this._setTipoEIdPrefix();
    }

     // Sobrescreve para garantir tipo/prefixo
    _setTipoEIdPrefix() {
        this.tipo = 'moto';
        this.idPrefix = 'moto';
    }

    /**
     * @description Aumenta a velocidade da moto (aceleração rápida).
     * @override // Indica que está sobrescrevendo um método da classe pai
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    acelerar(sons) {
        // Verifica se pode acelerar (método da classe pai - Veiculo)
        if (!this.acelerarBase()) return;

        this.velocidade += 18; // Aceleração maior que carro comum
        if (sons && sons.acelerar) tocarSom(sons.acelerar, 0.6); // Som de moto acelerando
        animarVeiculo(this.getIdPrefix(), 'acelerando'); // Anima a imagem
        this.atualizarVelocidade(); // Atualiza o display da velocidade
        this.atualizarEstadoBotoesWrapper(); // Atualiza o estado dos botões
    }

    /**
     * @description Diminui a velocidade da moto.
     * @override // Indica que está sobrescrevendo um método da classe pai
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    frear(sons) {
        // Verifica se pode frear (método da classe pai - Veiculo)
        if (!this.frearBase()) return;

        this.velocidade = Math.max(0, this.velocidade - 15); // Frenagem forte
        if (sons && sons.frear) tocarSom(sons.frear, 0.7); // Som de freio de moto
        animarVeiculo(this.getIdPrefix(), 'freando'); // Anima a imagem
        this.atualizarVelocidade(); // Atualiza o display da velocidade

        // Se parou completamente, atualiza o status e os botões
        if (this.velocidade === 0) {
            this.atualizarStatus();
        }
        this.atualizarEstadoBotoesWrapper(); // Atualiza estado dos botões
    }

    /**
     * @description Toca a buzina da moto (som mais agudo?).
     * @override
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    buzinar(sons) {
        if (sons && sons.buzina) tocarSom(sons.buzina, 0.6); // Volume médio/agudo
        else super.buzinar(sons); // Usa buzina padrão se não especificada
    }

    // Os métodos atualizarVelocidade, atualizarStatus, ligar, desligar, etc.,
    // são herdados de Veiculo e podem ser usados diretamente se o comportamento
    // padrão for suficiente. O toJSON padrão de Veiculo também serve aqui,
    // pois Moto não tem atributos extras para salvar por enquanto.
}