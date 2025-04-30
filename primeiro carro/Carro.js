/**
 * @file Carro.js
 * @brief Classe que representa um carro comum.
 */

import { Veiculo } from './Veiculo.js'; // Importa a classe base
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, atualizarStatusVeiculo, mostrarFeedback, atualizarEstadoBotoes } from './funcoesAuxiliares.js'; // Importa helpers

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
     * @param {string} [id] - ID opcional (para recarregar).
     * @param {Array} [historico] - Histórico opcional (para recarregar).
     */
    constructor(modelo, cor, id = null, historico = []) {
        // Chama o construtor da classe pai (Veiculo)
        super(modelo, cor, id, historico);
        // Atributos específicos do Carro (se houver) podem ser inicializados aqui
    }

    /**
     * @description Aumenta a velocidade do carro em 10 km/h.
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    acelerar(sons) {
        // Verifica se pode acelerar (método da classe pai)
        if (!this.acelerarBase()) return;

        this.velocidade += 10;
        if (sons && sons.acelerar) tocarSom(sons.acelerar, 0.5); // Toca som de acelerar
        animarVeiculo(this.getIdPrefix(), 'acelerando'); // Anima a imagem
        this.atualizarVelocidade(); // Atualiza o display da velocidade
        this.atualizarEstadoBotoesWrapper(); // Atualiza o estado dos botões
    }

    /**
     * @description Diminui a velocidade do carro em 10 km/h.
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    frear(sons) {
        // Verifica se pode frear (método da classe pai)
        if (!this.frearBase()) return;

        this.velocidade = Math.max(0, this.velocidade - 10); // Diminui, mínimo 0
        if (sons && sons.frear) tocarSom(sons.frear, 0.5); // Toca som de frear
        animarVeiculo(this.getIdPrefix(), 'freando'); // Anima a imagem
        this.atualizarVelocidade(); // Atualiza o display da velocidade

        // Se parou completamente, atualiza o status e os botões
        if (this.velocidade === 0) {
            this.atualizarStatus();
        }
        this.atualizarEstadoBotoesWrapper(); // Atualiza estado dos botões (frear pode ser desabilitado)
    }

    // Os métodos atualizarVelocidade, atualizarStatus, buzinar (padrão), etc.,
    // são herdados de Veiculo e podem ser usados diretamente se o comportamento
    // padrão for suficiente. Se precisar de comportamento específico, sobrescreva-os.

    // Exemplo: Sobrescrever buzinar se o som do carro for diferente
    // buzinar(sons) {
    //     if (sons && sons.buzinaCarro) { // Supondo um som específico 'buzinaCarro'
    //         tocarSom(sons.buzinaCarro, 0.6);
    //     } else {
    //         super.buzinar(sons); // Usa o buzinar padrão da Veiculo se não houver som específico
    //     }
    // }

     // Os wrappers atualizarVelocidade, atualizarStatus, atualizarEstadoBotoesWrapper
     // já estão em Veiculo e não precisam ser redefinidos aqui a menos que
     // haja lógica *adicional* específica para Carro nesses updates.
     // Por exemplo, se Carro tivesse um display de "marcha", o atualizarVelocidade
     // poderia ser sobrescrito para atualizar a marcha também.
}