/**
 * @file Manutencao.js
 * @brief Classe que representa um registro de manutenção.
 */

/**
 * @class Manutencao
 * @classdesc Representa um registro de manutenção para um veículo.
 */
export class Manutencao {
    /**
     * @constructor
     * @param {string} d - A data e hora da manutenção (em formato ISO string).
     * @param {string} t - O tipo de manutenção.
     * @param {number} c - O custo da manutenção.
     * @param {string} [ds=''] - Uma descrição opcional da manutenção.
     */
    constructor(d, t, c, ds = '') {
        /** @member {Date} */
        this.data = d ? new Date(d.replace('T', ' ')) : new Date('invalid');
        /** @member {string} */
        this.tipo = t ? t.trim() : '';
        /** @member {number} */
        this.custo = parseFloat(c);
        if (isNaN(this.custo) || this.custo < 0) this.custo = 0;
        /** @member {string} */
        this.descricao = ds ? ds.trim() : '';
        /** @member {string} */
        this.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    }

    /**
     * @function validar
     * @returns {{valido: boolean, erros: string[]}} - Um objeto contendo um booleano indicando se os dados são válidos e uma lista de erros, se houver.
     * @description Valida os dados da manutenção.
     */
    validar() {
        const e = [];
        if (isNaN(this.data.getTime())) e.push("Data/Hora inválida.");
        if (!this.tipo) e.push("Tipo obrigatório.");
        if (isNaN(this.custo) || this.custo < 0) e.push("Custo inválido.");
        return { valido: e.length === 0, erros: e };
    }

    /**
     * @function formatarParaHistorico
     * @returns {string} - Uma string formatada com os detalhes da manutenção.
     * @description Formata a manutenção para exibição no histórico.
     */
    formatarParaHistorico() {
        const dF = !isNaN(this.data.getTime()) ? this.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data Inv.';
        const cF = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        let t = `${this.tipo} em ${dF} - ${cF}`;
        if (this.descricao) t += ` (${this.descricao})`;
        return t;
    }

    /**
     * @function formatarParaAgendamento
     * @returns {string} - Uma string formatada com os detalhes do agendamento.
     * @description Formata a manutenção para exibição em agendamentos futuros.
     */
    formatarParaAgendamento() {
        const dhF = !isNaN(this.data.getTime()) ? this.data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data/Hora Inv.';
        const cF = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        let t = `${this.tipo} p/ ${dhF} - ${cF}`;
        if (this.descricao) t += ` (${this.descricao})`;
        return t;
    }

    /**
     * @function toJSON
     * @returns {{data: string, tipo: string, custo: number, descricao: string, id: string}} - Um objeto JSON representando a manutenção.
     * @description Converte o objeto de manutenção para JSON.
     */
    toJSON() {
        return {
            data: !isNaN(this.data.getTime()) ? this.data.toISOString() : null,
            tipo: this.tipo,
            custo: this.custo,
            descricao: this.descricao,
            id: this.id
        };
    }

    /**
     * @function fromJSON
     * @param {object} j - O objeto JSON a ser convertido.
     * @returns {Manutencao|null} - Uma instância de Manutencao ou null se o objeto JSON for inválido.
     * @description Cria um objeto de Manutencao a partir de um objeto JSON.
     */
    static fromJSON(j) {
        if (!j || !j.tipo) return null;
        const m = new Manutencao(j.data, j.tipo, j.custo, j.descricao);
        m.id = j.id || m.id;
        return m;
    }
}