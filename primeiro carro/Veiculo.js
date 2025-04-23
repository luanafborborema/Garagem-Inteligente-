/**
 * @file Veiculo.js
 * @brief Classe abstrata que representa um veículo genérico.
 */

/**
 * @class Veiculo
 * @abstract
 * @classdesc Classe abstrata que representa um veículo genérico. Não deve ser instanciada diretamente.
 */
import { tocarSom, atualizarEstadoBotoes, atualizarStatusVeiculo, atualizarInfoVeiculo, mostrarFeedback } from './funcoesAuxiliares.js';
import { sons } from './script.js'; // ADICIONADO! (verifique se é a melhor solução)
export class Veiculo {
    /**
     * @constructor
     * @param {string} m - O modelo do veículo.
     * @param {string} c - A cor do veículo.
     */
    constructor(m, c) {
        if (this.constructor === Veiculo) {
            throw new Error("Classe abstrata.");
        }
        /** @member {string} */
        this.modelo = m;
        /** @member {string} */
        this.cor = c;
        /** @member {boolean} */
        this.ligado = false;
        /** @member {number} */
        this.velocidade = 0;
        /** @member {Manutencao[]} */
        this.historicoManutencao = [];
        this._setTipoEIdPrefix(m);
    }

    /**
     * @function _setTipoEIdPrefix
     * @protected
     * @param {string} m - O modelo do veículo.
     * @description Define o tipo e o prefixo do ID do veículo.
     */
    _setTipoEIdPrefix(m) {
        const c = this.constructor.name.toLowerCase();
        switch (c) {
            case 'carro': this.tipo = 'carro'; this.idPrefix = 'carro'; break;
            case 'carroesportivo': this.tipo = 'esportivo'; this.idPrefix = 'esportivo'; break;
            case 'caminhao': this.tipo = 'caminhao'; this.idPrefix = 'caminhao'; break;
            case 'moto': this.tipo = 'moto'; this.idPrefix = 'moto'; break;
            case 'bicicleta': this.tipo = 'bicicleta'; this.idPrefix = 'bicicleta'; break;
            default: this.tipo = c; this.idPrefix = c;
        }
        this.id = `${this.tipo}_${(m || '').replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    /**
     * @function getTipo
     * @returns {string}
     * @description Retorna o tipo do veículo.
     */
    getTipo() {
        return this.tipo;
    }

    /**
     * @function getIdPrefix
     * @returns {string}
     * @description Retorna o prefixo do ID do veículo.
     */
    getIdPrefix() {
        return this.idPrefix;
    }

    /**
     * @function atualizarEstadoBotoesWrapper
     * @returns {void}
     * @description Wrapper para atualizar o estado dos botões na interface.
     */
    atualizarEstadoBotoesWrapper() {
        atualizarEstadoBotoes(this);
    }

    /**
     * @function ligar
     * @returns {void}
     * @description Liga o veículo.
     */
    ligar() {
        if (!this.ligado) {
            this.ligado = true;
            tocarSom(sons.ligar);
            this.atualizarStatus();
            this.atualizarEstadoBotoesWrapper();
        } else {
            mostrarFeedback(`${this.modelo} já ligado!`, 'warning');
        }
    }

    /**
     * @function desligar
     * @returns {void}
     * @description Desliga o veículo.
     */
    desligar() {
        if (this.ligado) {
            if (this.velocidade > 0) {
                mostrarFeedback(`${this.modelo} precisa parar!`, 'warning');
                return;
            }
            this.ligado = false;
            this.velocidade = 0;
            tocarSom(sons.desligar);
            this.atualizarStatus();
            this.atualizarVelocidade();
            this.atualizarEstadoBotoesWrapper();
        } else {
            mostrarFeedback(`${this.modelo} já desligado!`, 'warning');
        }
    }

    /**
     * @function acelerarBase
     * @returns {boolean}
     * @description Função base para verificar se o veículo pode acelerar.
     */
    acelerarBase() {
        if (!this.ligado) {
            mostrarFeedback(`Ligue ${this.modelo} antes!`, 'warning');
            return false;
        }
        return true;
    }

    /**
     * @function frearBase
     * @returns {boolean}
     * @description Função base para verificar se o veículo pode frear.
     */
    frearBase() {
        if (this.velocidade <= 0) return false;
        return true;
    }

    /**
     * @function acelerar
     * @abstract
     * @returns {void}
     * @description Método abstrato para acelerar o veículo. Deve ser implementado nas subclasses.
     */
    acelerar() { }

    /**
     * @function frear
     * @abstract
     * @returns {void}
     * @description Método abstrato para frear o veículo. Deve ser implementado nas subclasses.
     */
    frear() { }

    /**
     * @function atualizarVelocidade
     * @returns {void}
     * @description Atualiza a exibição da velocidade do veículo na interface.
     */
    atualizarVelocidade() {
        atualizarInfoVeiculo(this.getIdPrefix(), { velocidade: this.velocidade });
    }

    /**
     * @function atualizarStatus
     * @returns {void}
     * @description Atualiza o status do veículo na interface.
     */
    atualizarStatus() {
        atualizarStatusVeiculo(this.getIdPrefix(), this.ligado, this.velocidade);
    }

    /**
     * @function buzinar
     * @returns {void}
     * @description Toca o som da buzina do veículo.
     */
    buzinar() {
        tocarSom(sons.buzina);
    }

    /**
     * @function adicionarManutencao
     * @param {Manutencao} mO - O objeto de manutenção a ser adicionado.
     * @returns {boolean} - Retorna true se a manutenção foi adicionada com sucesso, false caso contrário.
     * @description Adiciona uma manutenção ao histórico do veículo.
     */
    adicionarManutencao(mO) {
        if (!(mO instanceof Manutencao)) {
            mostrarFeedback("Erro interno: Obj manut. inválido.", 'error');
            return false;
        }
        const v = mO.validar();
        if (!v.valido) {
            mostrarFeedback(`Erro dados manutenção:\n- ${v.erros.join('\n- ')}`, 'error');
            return false;
        }
        this.historicoManutencao.push(mO);
        this.historicoManutencao.sort((a, b) => b.data.getTime() - a.data.getTime());
        salvarGaragem();
        this.atualizarDisplayManutencao();
        return true;
    }

    /**
     * @function getManutencoesSeparadas
     * @returns {{historicoPassado: Manutencao[], agendamentosFuturos: Manutencao[]}} - Um objeto contendo as listas de manutenções.
     * @description Separa as manutenções em histórico passado e agendamentos futuros.
     */
    getManutencoesSeparadas() {
        const a = new Date();
        const h = [], g = [];
        if (!Array.isArray(this.historicoManutencao)) this.historicoManutencao = [];
        this.historicoManutencao.forEach(m => {
            if (m instanceof Manutencao && m.data && !isNaN(m.data.getTime())) {
                if (m.data <= a) h.push(m);
                else g.push(m);
            }
        });
        g.sort((x, y) => x.data.getTime() - y.data.getTime());
        return { historicoPassado: h, agendamentosFuturos: g };
    }

    /**
     * @function atualizarDisplayManutencao
     * @returns {void}
     * @description Atualiza a exibição das manutenções na interface.
     */
    atualizarDisplayManutencao() {
        const p = this.getIdPrefix();
        const hL = document.getElementById(`${p}-historico-lista`);
        const aL = document.getElementById(`${p}-agendamentos-lista`);
        if (!hL || !aL) return;
        const { historicoPassado, agendamentosFuturos } = this.getManutencoesSeparadas();
        const pop = (ul, li, msg, fn) => {
            ul.innerHTML = '';
            if (li.length === 0) ul.innerHTML = `<li>${msg}</li>`;
            else li.forEach(i => {
                const l = document.createElement('li');
                l.textContent = fn(i);
                ul.appendChild(l);
            });
        };
        pop(hL, historicoPassado, "Nenhum registro.", m => m.formatarParaHistorico());
        pop(aL, agendamentosFuturos, "Nenhum agendamento.", m => m.formatarParaAgendamento());
    }

    /**
     * @function removerManutencao
     * @param {string} id - O ID da manutenção a ser removida.
     * @returns {boolean} - Retorna true se a manutenção foi removida com sucesso, false caso contrário.
     * @description Remove uma manutenção do histórico do veículo.
     */
    removerManutencao(id) {
        const i = this.historicoManutencao.findIndex(m => m.id === id);
        if (i > -1) {
            this.historicoManutencao.splice(i, 1);
            salvarGaragem();
            this.atualizarDisplayManutencao();
            return true;
        }
        return false;
    }
}