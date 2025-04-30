/**
 * @file Caminhao.js
 * @brief Classe que representa um caminhão.
 */

import { Carro } from './Carro.js'; // Caminhão herda de Carro (que herda de Veiculo)
import { tocarSom, animarVeiculo, atualizarInfoVeiculo, mostrarFeedback, atualizarEstadoBotoes, atualizarStatusVeiculo } from './funcoesAuxiliares.js'; // Importa helpers

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
     * @param {string} [id] - ID opcional (para recarregar).
     * @param {Array} [historico] - Histórico opcional (para recarregar).
     * @param {number} [cargaAtual=0] - Carga atual (para recarregar).
     */
    constructor(modelo, cor, cap = 5000, id = null, historico = [], cargaAtual = 0) {
        super(modelo, cor, id, historico); // Chama construtor do Carro
        /** @member {number} */
        // Garante que a capacidade seja um número não negativo
        this.capacidadeCarga = Math.max(0, parseInt(cap, 10)) || 5000;
        /** @member {number} */
        // Garante que a carga atual seja válida e não exceda a capacidade
        this.cargaAtual = Math.max(0, Math.min(parseFloat(cargaAtual) || 0, this.capacidadeCarga));

        // Garante que o tipo e prefixo sejam 'caminhao'
        this._setTipoEIdPrefix();
    }

    // Sobrescreve para garantir tipo/prefixo
    _setTipoEIdPrefix() {
        this.tipo = 'caminhao';
        this.idPrefix = 'caminhao';
    }

    /**
     * @param {number|string} quantidade - A quantidade de carga a ser carregada em kg.
     * @returns {boolean} - True se carregou com sucesso, false caso contrário.
     * @description Carrega o caminhão, validando a quantidade e capacidade.
     */
    carregar(quantidade) {
        if (!this.ligado) {
             mostrarFeedback("Ligue o caminhão para operar a carga.", 'warning');
             return false;
        }
        const q = parseFloat(quantidade);
        if (isNaN(q) || q <= 0) {
            mostrarFeedback("Quantidade de carga inválida. Informe um número positivo.", 'error');
            return false;
        }
        if (this.cargaAtual + q <= this.capacidadeCarga) {
            this.cargaAtual += q;
            this.atualizarInfoCaminhao(); // Atualiza display de carga/capacidade
            mostrarFeedback(`Carregado ${q}kg. Carga atual: ${this.cargaAtual}kg.`, 'success');
            if (typeof window.salvarGaragem === 'function') window.salvarGaragem(); // Salva estado
             this.atualizarEstadoBotoesWrapper(); // Atualiza botões (ex: descarregar)
            return true;
        } else {
            const espacoLivre = this.capacidadeCarga - this.cargaAtual;
            mostrarFeedback(`Não é possível carregar ${q}kg. Capacidade máxima de ${this.capacidadeCarga}kg excedida. Espaço livre: ${espacoLivre}kg.`, 'error');
            return false;
        }
    }

    /**
     * @param {number|string} quantidade - A quantidade de carga a ser descarregada em kg.
     * @returns {boolean} - True se descarregou com sucesso, false caso contrário.
     * @description Descarrega o caminhão, validando a quantidade e carga atual.
     */
    descarregar(quantidade) {
         if (!this.ligado) {
             mostrarFeedback("Ligue o caminhão para operar a carga.", 'warning');
             return false;
        }
        const q = parseFloat(quantidade);
        if (isNaN(q) || q <= 0) {
            mostrarFeedback("Quantidade a descarregar inválida. Informe um número positivo.", 'error');
            return false;
        }
        if (this.cargaAtual >= q) {
            this.cargaAtual -= q;
            this.atualizarInfoCaminhao(); // Atualiza display
            mostrarFeedback(`Descarregado ${q}kg. Carga restante: ${this.cargaAtual}kg.`, 'success');
            if (typeof window.salvarGaragem === 'function') window.salvarGaragem(); // Salva estado
             this.atualizarEstadoBotoesWrapper(); // Atualiza botões (ex: descarregar pode desabilitar)
            return true;
        } else {
            mostrarFeedback(`Não é possível descarregar ${q}kg. Carga atual é de apenas ${this.cargaAtual}kg.`, 'error');
            return false;
        }
    }

    /** @description Atualiza os spans de carga e capacidade na interface. */
    atualizarInfoCaminhao() {
        // Usa a função auxiliar, passando os dados específicos do caminhão
        atualizarInfoVeiculo(this.getIdPrefix(), {
            carga: this.cargaAtual,
            capacidade: this.capacidadeCarga
        });
    }

    /**
     * @description Acelera o caminhão, com desempenho afetado pela carga.
     * @override
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    acelerar(sons) {
        if (!this.acelerarBase()) return; // Verifica se está ligado

        // Fator de desempenho: 1 (vazio) a ~0.5 (carga máxima)
        const fatorCarga = 1 - (this.cargaAtual / (this.capacidadeCarga * 2));
        // Aceleração base (menor que carro) * fator de carga
        const incremento = Math.max(1, 5 * fatorCarga); // Garante pelo menos 1km/h de incremento

        this.velocidade += incremento;
        if (sons && sons.acelerar) tocarSom(sons.acelerar, 0.4); // Som de motor pesado
        animarVeiculo(this.getIdPrefix(), 'acelerando');
        this.atualizarVelocidade(); // Atualiza display velocidade
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @description Freia o caminhão, com eficiência afetada pela carga.
     * @override
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    frear(sons) {
        if (!this.frearBase()) return; // Verifica se está em movimento

        // Fator de frenagem: 1 (vazio) a ~1.5 (carga máxima) - mais difícil frear carregado
        const fatorCarga = 1 + (this.cargaAtual / (this.capacidadeCarga * 2));
        // Frenagem base (menor que carro) / fator de carga
        const decremento = Math.max(2, 7 / fatorCarga); // Freia pelo menos 2km/h

        this.velocidade = Math.max(0, this.velocidade - decremento);
        if (sons && sons.frear) tocarSom(sons.frear, 0.6); // Som de freio a ar?
        animarVeiculo(this.getIdPrefix(), 'freando');
        this.atualizarVelocidade();

        if (this.velocidade === 0) {
            this.atualizarStatus();
        }
        this.atualizarEstadoBotoesWrapper();
    }

    /**
     * @description Toca a buzina do caminhão (som mais grave).
     * @override
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    buzinar(sons) {
        if (sons && sons.buzina) tocarSom(sons.buzina, 0.9); // Volume alto
        else super.buzinar(sons);
    }

    // Os métodos atualizarVelocidade e atualizarStatus são herdados.
    // O método atualizarInfoCaminhao cuida da parte de carga/capacidade.

    // Sobrescreve toJSON para incluir carga e capacidade
    toJSON() {
        const data = super.toJSON(); // Pega dados do Carro -> Veiculo
        data.capacidadeCarga = this.capacidadeCarga;
        data.cargaAtual = this.cargaAtual;
        return data;
    }
}