/**
 * @file Bicicleta.js
 * @brief Classe que representa uma bicicleta.
 */

import { Veiculo } from './Veiculo.js'; // Importa a classe base Veiculo
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, atualizarStatusVeiculo, mostrarFeedback, atualizarEstadoBotoes } from './funcoesAuxiliares.js'; // Importa helpers

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
      * @param {string} [id] - ID opcional (para recarregar).
     * @param {Array} [historico] - Histórico opcional (para recarregar).
     */
    constructor(modelo, cor, id = null, historico = []) {
        super(modelo, cor, id, historico); // Chama construtor do Veiculo
        /** @member {boolean} */
        this.ligado = true; // Bicicleta está sempre "pronta" (não liga/desliga)
        /** @member {number} */
        this.velocidade = 0; // Começa parada

        // Garante tipo/prefixo 'bicicleta'
        this._setTipoEIdPrefix();
        // Atualiza status inicial específico da bike
        this.atualizarStatus();
    }

     // Sobrescreve para garantir tipo/prefixo
    _setTipoEIdPrefix() {
        this.tipo = 'bicicleta';
        this.idPrefix = 'bicicleta';
    }


    /**
     * @override
     * @description Simula a ação de "ligar" a bicicleta (apenas exibe feedback).
     */
    ligar() {
        mostrarFeedback("Bicicleta pronta para pedalar!", 'info');
        // Não altera estado 'ligado' nem atualiza botões desnecessariamente
    }

    /**
     * @override
     * @description Simula a ação de "desligar" a bicicleta (apenas exibe feedback).
     */
    desligar() {
        mostrarFeedback(this.velocidade > 0 ? "Use o freio para parar!" : "Bicicleta já está parada.", 'info');
         // Não altera estado 'ligado' nem atualiza botões
    }

    /**
     * @description Aumenta a velocidade da bicicleta ao pedalar. Não precisa de 'sons' como argumento.
     * @override
     */
    pedalar() {
        // Não precisa chamar acelerarBase() pois bike não tem 'ligado'
        this.velocidade += 2.5; // Incremento de velocidade ao pedalar
        animarVeiculo(this.getIdPrefix(), 'acelerando'); // Reutiliza animação
        this.atualizarVelocidade();
        this.atualizarStatus(); // Atualiza para "Pedalando" se velocidade > 0
        this.atualizarEstadoBotoesWrapper(); // Habilita o freio
        // Poderia tocar um som de corrente de bicicleta aqui
    }

    /**
     * @description Diminui a velocidade da bicicleta ao frear.
     * @override
     * @param {object} sons - O objeto contendo os elementos de áudio (para som de freio).
     */
    frear(sons) {
        // Não precisa chamar frearBase() explicitamente aqui, a lógica interna já faz
        if (this.velocidade > 0) {
            this.velocidade = Math.max(0, this.velocidade - 2); // Desaceleração
            animarVeiculo(this.getIdPrefix(), 'freando'); // Reutiliza animação
            this.atualizarVelocidade();

            // Se parou completamente, atualiza o status
            if (this.velocidade === 0) {
                this.atualizarStatus(); // Atualiza para "Parada"
            }
            this.atualizarEstadoBotoesWrapper(); // Desabilita freio se parado

            // Toca som de freio de bike, se existir
            // if (sons && sons.freioBike) tocarSom(sons.freioBike, 0.4);
        }
         // Se já estava parada, não faz nada (e não mostra feedback)
    }

    /**
     * @override
     * @description Bicicleta não "acelera" com motor, ela "pedala".
     *              Este método redireciona para `pedalar`.
     */
    acelerar() {
        this.pedalar();
    }

    /**
     * @override
     * @description Toca a campainha da bicicleta.
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    buzinar(sons) {
        // Usa um som específico de campainha se existir
        if (sons && sons.campainha) {
             tocarSom(sons.campainha, 0.5);
             console.log(`${this.modelo} tocou a campainha! Trim trim!`);
        } else {
            // Ou um fallback genérico
            mostrarFeedback("Trim trim!", 'info');
            console.log(`${this.modelo} tocou a campainha! (som padrão)`);
        }
    }

    /**
     * @override
     * @description Atualiza o status da bicicleta ("Parada" ou "Pedalando").
     */
    atualizarStatus() {
        // Chama a função auxiliar, passando os parâmetros corretos para bicicleta
        // Note que 'ligado' é sempre true para a lógica interna, mas o display
        // será "Parada" ou "Pedalando" com base na velocidade.
        atualizarStatusVeiculo(this.getIdPrefix(), this.ligado, this.velocidade);
    }

    // Os métodos atualizarVelocidade e atualizarEstadoBotoesWrapper são herdados
    // e funcionam corretamente. O toJSON padrão de Veiculo também serve.
}