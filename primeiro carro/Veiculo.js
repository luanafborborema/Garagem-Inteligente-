/**
 * @file Veiculo.js
 * @brief Classe abstrata que representa um veículo genérico.
 */

// Importa funções auxiliares e a classe Manutencao
import { tocarSom, atualizarEstadoBotoes, atualizarStatusVeiculo, atualizarInfoVeiculo, mostrarFeedback } from './funcoesAuxiliares.js';
import { Manutencao } from './Manutencao.js'; // Importa a classe Manutencao

// NÃO importa 'sons' aqui, será gerenciado pelo script.js principal

/**
 * @class Veiculo
 * @abstract
 * @classdesc Classe abstrata que representa um veículo genérico. Não deve ser instanciada diretamente.
 */
export class Veiculo {
    /**
     * @constructor
     * @param {string} m - O modelo do veículo.
     * @param {string} c - A cor do veículo.
     * @param {string} [id] - ID opcional para recriar veículo a partir do localStorage.
     * @param {Array} [historico] - Histórico opcional para recriar veículo.
     */
    constructor(m, c, id = null, historico = []) {
        if (this.constructor === Veiculo) {
            throw new Error("Classe abstrata 'Veiculo' não pode ser instanciada diretamente.");
        }
        /** @member {string} */
        this.modelo = m || 'Desconhecido'; // Valor padrão
        /** @member {string} */
        this.cor = c || 'Indefinida'; // Valor padrão
        /** @member {boolean} */
        this.ligado = false;
        /** @member {number} */
        this.velocidade = 0;

        // Define tipo e prefixo com base no nome da CLASSE FILHA
        this._setTipoEIdPrefix();

        /** @member {string} */
        // Usa ID fornecido ou gera um novo
        this.id = id || `${this.tipo}_${(m || '').replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;

        /** @member {Manutencao[]} */
        // Recria objetos Manutencao a partir do histórico fornecido (que vem do JSON)
        this.historicoManutencao = Array.isArray(historico)
            ? historico.map(item => Manutencao.fromJSON(item)).filter(m => m instanceof Manutencao)
            : [];
        this.historicoManutencao.sort((a, b) => b.data.getTime() - a.data.getTime()); // Ordena

    }

    /**
     * @function _setTipoEIdPrefix
     * @protected
     * @description Define o tipo e o prefixo do ID do veículo com base no nome da classe filha.
     */
    _setTipoEIdPrefix() {
        const className = this.constructor.name.toLowerCase();
        switch (className) {
            case 'carro':
                this.tipo = 'carro';
                this.idPrefix = 'carro';
                break;
            case 'carroesportivo':
                this.tipo = 'esportivo'; // Usado no select e para ID
                this.idPrefix = 'esportivo'; // Usado para IDs de elementos HTML
                break;
            case 'caminhao':
                this.tipo = 'caminhao';
                this.idPrefix = 'caminhao';
                break;
            case 'moto':
                this.tipo = 'moto';
                this.idPrefix = 'moto';
                break;
            case 'bicicleta':
                this.tipo = 'bicicleta';
                this.idPrefix = 'bicicleta';
                break;
            default:
                // Caso genérico, embora não deva acontecer com as classes atuais
                this.tipo = className;
                this.idPrefix = className;
        }
    }

    /** @returns {string} O tipo do veículo (ex: 'carro', 'moto'). */
    getTipo() { return this.tipo; }

    /** @returns {string} O prefixo do ID usado nos elementos HTML (ex: 'carro', 'moto'). */
    getIdPrefix() { return this.idPrefix; }

    /** @description Wrapper para atualizar o estado dos botões na interface. */
    atualizarEstadoBotoesWrapper() {
        atualizarEstadoBotoes(this);
    }

    /**
     * @description Liga o veículo (se não for bicicleta).
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    ligar(sons) {
        if (this.tipo === 'bicicleta') {
             mostrarFeedback("Bicicleta sempre pronta!", 'info'); // Feedback da classe Bicicleta
             return; // Bicicleta não liga/desliga
        }
        if (!this.ligado) {
            this.ligado = true;
            if (sons && sons.ligar) tocarSom(sons.ligar, 0.4); // Toca som se existir
            this.atualizarStatus();
            this.atualizarEstadoBotoesWrapper();
            mostrarFeedback(`${this.modelo} ligado.`, 'success');
        } else {
            mostrarFeedback(`${this.modelo} já está ligado!`, 'warning');
        }
    }

    /**
     * @description Desliga o veículo (se não for bicicleta).
     * @param {object} sons - O objeto contendo os elementos de áudio.
     */
    desligar(sons) {
         if (this.tipo === 'bicicleta') {
             mostrarFeedback(this.velocidade > 0 ? "Use o freio!" : "Bicicleta parada.", 'info'); // Feedback da classe Bicicleta
             return; // Bicicleta não liga/desliga
         }
        if (this.ligado) {
            if (this.velocidade > 0) {
                mostrarFeedback(`${this.modelo} precisa parar completamente para desligar!`, 'warning');
                return;
            }
            this.ligado = false;
            // Velocidade já deve ser 0, mas garantimos.
            this.velocidade = 0;
            if (sons && sons.desligar) tocarSom(sons.desligar, 0.3); // Toca som se existir
            this.atualizarStatus();
            this.atualizarVelocidade(); // Atualiza display da velocidade para 0
            this.atualizarEstadoBotoesWrapper();
             mostrarFeedback(`${this.modelo} desligado.`, 'info');
        } else {
            mostrarFeedback(`${this.modelo} já está desligado!`, 'warning');
        }
    }

    /**
     * @protected
     * @returns {boolean} Retorna true se o veículo pode acelerar (está ligado ou é bicicleta).
     * @description Verifica as condições base para poder acelerar.
     */
    acelerarBase() {
        if (this.tipo !== 'bicicleta' && !this.ligado) {
            mostrarFeedback(`Ligue ${this.modelo} antes de acelerar!`, 'warning');
            return false;
        }
        return true;
    }

    /**
     * @protected
     * @returns {boolean} Retorna true se o veículo pode frear (está em movimento).
     * @description Verifica as condições base para poder frear.
     */
    frearBase() {
        if (this.velocidade <= 0) {
            // Não mostra feedback aqui, pois frear parado não faz nada
            return false;
        }
        return true;
    }

    // Métodos abstratos (ou com implementação padrão vazia) que DEVERÃO ser sobrescritos
    /** @abstract @param {object} sons - O objeto contendo os elementos de áudio. */
    acelerar(sons) { console.warn(`Método acelerar() não implementado para ${this.constructor.name}`); }
    /** @abstract @param {object} sons - O objeto contendo os elementos de áudio. */
    frear(sons) { console.warn(`Método frear() não implementado para ${this.constructor.name}`); }

    /** @description Atualiza a exibição da velocidade na interface. */
    atualizarVelocidade() {
        atualizarInfoVeiculo(this.getIdPrefix(), { velocidade: this.velocidade });
    }

    /** @description Atualiza o status (Ligado/Desligado/etc.) na interface. */
    atualizarStatus() {
        atualizarStatusVeiculo(this.getIdPrefix(), this.ligado, this.velocidade);
    }

     /**
      * @description Toca o som da buzina do veículo.
      * @param {object} sons - O objeto contendo os elementos de áudio.
      */
    buzinar(sons) {
        // Usa som de buzina padrão se disponível
        if (sons && sons.buzina) {
             tocarSom(sons.buzina, 0.5); // Volume padrão
             console.log(`${this.modelo} buzinou!`);
        } else {
            console.warn("Som de buzina não encontrado!");
        }
    }

    /**
     * @param {Manutencao} manutencaoObj - O objeto de manutenção a ser adicionado.
     * @returns {boolean} - True se adicionado com sucesso, false caso contrário.
     * @description Adiciona um registro de manutenção, valida, ordena e salva.
     */
    adicionarManutencao(manutencaoObj) {
        if (!(manutencaoObj instanceof Manutencao)) {
            mostrarFeedback("Erro interno: Objeto de manutenção inválido.", 'error');
            console.error("Tentativa de adicionar manutenção inválida:", manutencaoObj);
            return false;
        }

        const validacao = manutencaoObj.validar();
        if (!validacao.valido) {
            mostrarFeedback(`Erro nos dados da manutenção:\n- ${validacao.erros.join('\n- ')}`, 'error');
            return false;
        }

        // Adiciona ao array
        this.historicoManutencao.push(manutencaoObj);
        // Reordena (mais recentes primeiro no histórico, mais próximos primeiro nos agendamentos)
        this.historicoManutencao.sort((a, b) => b.data.getTime() - a.data.getTime());

        // Tenta salvar na garagem (disponível globalmente a partir do script.js)
        if (typeof window.salvarGaragem === 'function') {
            window.salvarGaragem();
        } else {
            console.error("Função salvarGaragem não encontrada globalmente!");
        }

        // Atualiza a exibição na interface
        this.atualizarDisplayManutencao();
        mostrarFeedback("Registro de manutenção adicionado!", 'success');
        return true;
    }

    /**
     * @returns {{historicoPassado: Manutencao[], agendamentosFuturos: Manutencao[]}}
     * @description Separa as manutenções em passadas (histórico) e futuras (agendamentos).
     */
    getManutencoesSeparadas() {
        const agora = new Date();
        const historicoPassado = [];
        const agendamentosFuturos = [];

        if (!Array.isArray(this.historicoManutencao)) {
            this.historicoManutencao = []; // Garante que é um array
        }

        this.historicoManutencao.forEach(m => {
            // Verifica se 'm' é uma instância válida e tem data válida
            if (m instanceof Manutencao && m.data && !isNaN(m.data.getTime())) {
                if (m.data <= agora) {
                    historicoPassado.push(m);
                } else {
                    agendamentosFuturos.push(m);
                }
            } else {
                 // console.warn("Item inválido encontrado no histórico de manutenção:", m);
            }
        });

        // Ordena histórico por data decrescente (já feito ao adicionar, mas garante)
        historicoPassado.sort((a, b) => b.data.getTime() - a.data.getTime());
        // Ordena agendamentos por data crescente (mais próximos primeiro)
        agendamentosFuturos.sort((a, b) => a.data.getTime() - b.data.getTime());

        return { historicoPassado, agendamentosFuturos };
    }

    /**
     * @description Atualiza as listas de histórico e agendamentos na interface do veículo.
     */
    atualizarDisplayManutencao() {
        const prefix = this.getIdPrefix();
        const historicoListaUl = document.getElementById(`${prefix}-historico-lista`);
        const agendamentosListaUl = document.getElementById(`${prefix}-agendamentos-lista`);

        if (!historicoListaUl || !agendamentosListaUl) {
            // console.warn(`Listas de manutenção não encontradas para ${prefix}`);
            return;
        }

        const { historicoPassado, agendamentosFuturos } = this.getManutencoesSeparadas();

        // Função auxiliar para popular uma lista UL
        const popularLista = (ulElement, listaItens, mensagemVazio, formatarFn) => {
            ulElement.innerHTML = ''; // Limpa a lista
            if (listaItens.length === 0) {
                ulElement.innerHTML = `<li>${mensagemVazio}</li>`;
            } else {
                listaItens.forEach(item => {
                    const li = document.createElement('li');
                    // Usa innerHTML para renderizar o botão de remover que está na string formatada
                    li.innerHTML = formatarFn(item);
                    ulElement.appendChild(li);
                });
            }
        };

        popularLista(historicoListaUl, historicoPassado, "Nenhum registro de manutenção.", m => m.formatarParaHistorico());
        popularLista(agendamentosListaUl, agendamentosFuturos, "Nenhum agendamento futuro.", m => m.formatarParaAgendamento());
    }

     /**
      * @param {string} idManutencao - O ID da manutenção a ser removida.
      * @returns {boolean} - True se removido com sucesso, false caso contrário.
      * @description Remove uma manutenção pelo ID, salva e atualiza a interface.
      */
     removerManutencao(idManutencao) {
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);

        if (index > -1) {
            const removido = this.historicoManutencao.splice(index, 1)[0]; // Remove do array
            console.log("Manutenção removida:", removido);

            // Tenta salvar na garagem
            if (typeof window.salvarGaragem === 'function') {
                window.salvarGaragem();
            } else {
                console.error("Função salvarGaragem não encontrada globalmente!");
            }

            // Atualiza a exibição na interface
            this.atualizarDisplayManutencao();
            mostrarFeedback("Registro de manutenção removido.", 'info');
            return true;
        } else {
            mostrarFeedback("Não foi possível encontrar o registro para remover.", 'error');
            return false;
        }
    }

     /**
      * @returns {object} Um objeto simples contendo os dados do veículo para serialização.
      * @description Prepara os dados do veículo para serem salvos em JSON.
      */
     toJSON() {
         return {
             id: this.id,
             tipo: this.tipo, // Salva o tipo para saber qual classe instanciar ao carregar
             modelo: this.modelo,
             cor: this.cor,
             // Não salva estado volátil como ligado ou velocidade
             // Salva dados específicos da subclasse, se houver
             ...(this.capacidadeCarga && { capacidadeCarga: this.capacidadeCarga }), // Ex: Caminhão
             ...(this.cargaAtual && { cargaAtual: this.cargaAtual }),             // Ex: Caminhão
             ...(typeof this.turboAtivado !== 'undefined' && { turboAtivado: this.turboAtivado }), // Ex: Esportivo
             // Converte cada objeto Manutencao para JSON
             historicoManutencao: this.historicoManutencao.map(m => m.toJSON())
         };
     }
}