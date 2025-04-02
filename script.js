document.addEventListener('DOMContentLoaded', function() {
    // --- CONSTANTES E FUNÇÕES AUXILIARES ---
    const somBuzina = new Audio('sons/buzina.mp3');
    const somAcelerar = new Audio('sons/acelerar.mp3');
    const somFrear = new Audio('sons/frear.mp3');
    const somLigar = new Audio('sons/ligar.mp3');
    const somDesligar = new Audio('sons/desligar.mp3');

    function tocarSom(audio, volume = 0.5) {
        audio.currentTime = 0;
        audio.volume = volume;
        audio.play().catch(error => console.error("Erro ao tocar som:", error));
    }

    function mostrarAlerta(mensagem) {
        alert(mensagem);
    }

    // Atualiza elementos no HTML usando o prefixo do ID (ex: 'carro', 'carroesportivo')
    function atualizarInfoVeiculo(idPrefix, dados) {
        for (const key in dados) {
            const elementId = `${idPrefix}-${key}`;
            const element = document.getElementById(elementId);
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.value = dados[key];
                } else {
                    element.textContent = dados[key];
                }
            } else {
                // Ignora warnings para elementos de manutenção (tratados em outra função)
                if (!elementId.includes('-manutencao-') && !elementId.includes('-historico-') && !elementId.includes('-agendamentos-')) {
                    console.warn(`Elemento não encontrado [atualizarInfoVeiculo]: ${elementId}`);
                }
            }
        }
    }

    // Atualiza o status (Ligado/Desligado/Pedalando/Parada)
    function atualizarStatusVeiculo(tipo, ligado) {
        let statusElementId;

        if (tipo === 'bicicleta') {
            statusElementId = 'bicicleta-status';
        } else {
            statusElementId = `${tipo}-status`;
        }

        const statusElement = document.getElementById(statusElementId);
        if (statusElement) {
            if (tipo === 'bicicleta' && garagem[tipo]) {
                statusElement.textContent = garagem[tipo].velocidade > 0 ? "Pedalando" : "Parada";
                statusElement.classList.remove('status-ligado', 'status-desligado');
            } else {
                statusElement.textContent = ligado ? "Ligado" : "Desligado";
                statusElement.classList.toggle('status-ligado', ligado);
                statusElement.classList.toggle('status-desligado', !ligado);
            }
        } else {
            console.warn(`Elemento de status não encontrado: ${statusElementId}`);
        }
    }

    // Anima a imagem do veículo
    function animarVeiculo(idPrefix, acao) {
        const imgElementId = `${idPrefix}-img`;
        const imgElement = document.getElementById(imgElementId);
        if (imgElement) {
            imgElement.classList.add(acao);
            setTimeout(() => imgElement.classList.remove(acao), 300);
        } else {
            console.warn(`Elemento de imagem não encontrado para animação: ${imgElementId}`);
        }
    }

    // --- CLASSE MANUTENCAO ---
    class Manutencao {
        constructor(data, tipo, custo, descricao = '') {
            this.data = data instanceof Date ? data : new Date(data);
            this.tipo = tipo ? tipo.trim() : '';
            this.custo = parseFloat(custo);
            if (isNaN(this.custo) || this.custo < 0) {
                console.warn(`Custo inválido (${custo}) para ${this.tipo}. Definido como 0.`);
                this.custo = 0;
            }
            this.descricao = descricao ? descricao.trim() : '';
            this.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        }

        validar() {
            const erros = [];
            if (isNaN(this.data.getTime())) {
                erros.push("Data inválida.");
            }
            if (!this.tipo) {
                erros.push("Tipo de serviço é obrigatório.");
            }
            return {
                valido: erros.length === 0,
                erros: erros
            };
        }

        formatar() {
            const dataFmt = !isNaN(this.data.getTime()) ? this.data.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) : 'Data Inválida';
            const custoFmt = this.custo.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
            let texto = `${this.tipo} em ${dataFmt} - ${custoFmt}`;
            if (this.descricao) {
                texto += ` (${this.descricao})`;
            }
            return texto;
        }

        toJSON() {
            return {
                data: !isNaN(this.data.getTime()) ? this.data.toISOString() : null,
                tipo: this.tipo,
                custo: this.custo,
                descricao: this.descricao,
                id: this.id
            };
        }

        static fromJSON(json) {
            if (!json || !json.tipo) return null;
            const dataObj = json.data ? new Date(json.data) : new Date('invalid');
            const manutencao = new Manutencao(dataObj, json.tipo, json.custo, json.descricao);
            manutencao.id = json.id || manutencao.id;
            return manutencao;
        }
    }

    // --- CLASSE VEICULO ---
    class Veiculo {
        constructor(modelo, cor) {
            this.modelo = modelo;
            this.cor = cor;
            this.ligado = false;
            this.velocidade = 0;
            this.historicoManutencao = [];
            this._setTipoEId(modelo);
        }

        // Define tipo (usado em data-tipo) e idPrefix (usado para IDs HTML)
        _setTipoEId(modelo) {
            const className = this.constructor.name.toLowerCase();
            this.idPrefix = className === 'carroesportivo' ? 'carroesportivo' : className;
            this.tipo = (className === 'carroesportivo') ? 'esportivo' : className;
            this.id = this.tipo + '_' + (modelo || '').replace(/\s+/g, '_').toLowerCase();
        }

        getTipo() {
            return this.tipo;
        }
        getIdPrefix() {
            return this.idPrefix;
        }

        ligar() {
            if (!this.ligado) {
                this.ligado = true;
                tocarSom(somLigar);
                this.atualizarStatus();
            } else {
                mostrarAlerta("O veículo já está ligado!");
            }
        }

        desligar() {
            if (this.ligado) {
                this.ligado = false;
                this.velocidade = 0;
                tocarSom(somDesligar);
                this.atualizarStatus();
                this.atualizarVelocidade();
            } else {
                mostrarAlerta("O veículo já está desligado!");
            }
        }

        acelerarBase() {
            if (!this.ligado) {
                mostrarAlerta("Ligue o veículo antes!");
                return false;
            }
            return true;
        }

        frearBase() {
            if (!this.ligado) {
                mostrarAlerta("Ligue o veículo antes!");
                return false;
            }
            if (this.velocidade <= 0) {
                return false;
            } // Já parado
            return true;
        }

        atualizarVelocidade() {
            atualizarInfoVeiculo(this.getIdPrefix(), {
                velocidade: this.velocidade
            });
        }

        atualizarStatus() {
            atualizarStatusVeiculo(this.getTipo(), this.ligado);
        }

        buzinar() {
            tocarSom(somBuzina);
        }

        // --- MÉTODOS DE MANUTENÇÃO ---
        adicionarManutencao(manutencaoObj) {
            if (!(manutencaoObj instanceof Manutencao)) {
                mostrarAlerta("Erro: Objeto de manutenção inválido.");
                console.error("Obj inválido:", manutencaoObj);
                return false;
            }
            const validacao = manutencaoObj.validar();
            if (!validacao.valido) {
                mostrarAlerta(`Erro dados manutenção: ${validacao.erros.join(', ')}`);
                return false;
            }
            this.historicoManutencao.push(manutencaoObj);
            this.historicoManutencao.sort((a, b) => b.data.getTime() - a.data.getTime());
            salvarGaragem();
            this.atualizarDisplayManutencao();
            return true;
        }

        getManutencoesSeparadas() {
            const agora = new Date();
            const hist = [],
                agen = [];
            if (!Array.isArray(this.historicoManutencao)) {
                this.historicoManutencao = [];
            }

            this.historicoManutencao.forEach(m => {
                if (m instanceof Manutencao && !isNaN(m.data.getTime())) {
                    if (m.data <= agora) {
                        hist.push(m);
                    } else {
                        agen.push(m);
                    }
                } else {
                    console.warn("Manut inválida:", m, "em", this.id);
                }
            });
            agen.sort((a, b) => a.data.getTime() - b.data.getTime());
            return {
                historicoPassado: hist,
                agendamentosFuturos: agen
            };
        }

        atualizarDisplayManutencao() {
            const idPrefix = this.getIdPrefix();
            const histContainer = document.getElementById(`${idPrefix}-historico-lista`);
            const agenContainer = document.getElementById(`${idPrefix}-agendamentos-lista`);

            if (!histContainer || !agenContainer) {
                console.warn(`Elementos de lista manutenção não encontrados para ${idPrefix}`);
                return;
            }

            const {
                historicoPassado,
                agendamentosFuturos
            } = this.getManutencoesSeparadas();

            const popularLista = (container, lista, msgVazia, formatarFn) => {
                container.innerHTML = '';
                if (lista.length === 0) {
                    container.innerHTML = `<li>${msgVazia}</li>`;
                } else {
                    lista.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = formatarFn(item);
                        container.appendChild(li);
                    });
                }
            };

            popularLista(histContainer, historicoPassado, "Nenhum registro passado.", m => m.formatar());

            popularLista(agenContainer, agendamentosFuturos, "Nenhum agendamento futuro.", m => {
                const dataHora = m.data.toLocaleString('pt-BR', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                });
                let texto = `${m.tipo} em ${dataHora} - ${m.custo.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                })}`;
                if (m.descricao) texto += ` (${m.descricao})`;
                return texto;
            });
        }
    }

    // --- CLASSES FILHAS ---
    class Carro extends Veiculo {
        acelerar() {
            if (!this.acelerarBase()) return;
            this.velocidade += 10;
            tocarSom(somAcelerar);
            animarVeiculo(this.getIdPrefix(), 'acelerando');
            this.atualizarVelocidade();
        }
        frear() {
            if (!this.frearBase()) return;
            this.velocidade = Math.max(0, this.velocidade - 10);
            tocarSom(somFrear);
            animarVeiculo(this.getIdPrefix(), 'freando');
            this.atualizarVelocidade();
        }
    }

    class CarroEsportivo extends Carro {
        constructor(modelo, cor) {
            super(modelo, cor);
            this.turboAtivado = false;
        }

        ativarTurbo() {
            if (!this.ligado) {
                mostrarAlerta("Ligue o carro!");
                return;
            }
            if (!this.turboAtivado) {
                this.turboAtivado = true;
                this.atualizarTurbo();
                mostrarAlerta("Turbo ativado!");
            } else {
                mostrarAlerta("Turbo já ativado!");
            }
        }
        desativarTurbo() {
            if (this.turboAtivado) {
                this.turboAtivado = false;
                this.atualizarTurbo();
                mostrarAlerta("Turbo desativado.");
            } else {
                mostrarAlerta("Turbo já desativado!");
            }
        }
        acelerar() {
            if (!this.acelerarBase()) return;
            let inc = 15 + (this.turboAtivado ? 35 : 0);
            this.velocidade += inc;
            tocarSom(somAcelerar, this.turboAtivado ? 0.8 : 0.6);
            animarVeiculo(this.getIdPrefix(), 'acelerando');
            this.atualizarVelocidade();
        }
        frear() {
            if (!this.frearBase()) return;
            this.velocidade = Math.max(0, this.velocidade - 15);
            tocarSom(somFrear);
            animarVeiculo(this.getIdPrefix(), 'freando');
            this.atualizarVelocidade();
        }
        atualizarTurbo() {
            atualizarInfoVeiculo(this.getIdPrefix(), {
                turbo: this.turboAtivado ? "Ativado" : "Desativado"
            });
        }
        buzinar() {
            tocarSom(somBuzina, 0.7);
        }
    }

    class Caminhao extends Carro {
        constructor(modelo, cor, capacidadeCarga) {
            super(modelo, cor);
            this.capacidadeCarga = capacidadeCarga;
            this.cargaAtual = 0;
        }
        carregar(carga) {
            if (isNaN(carga) || carga < 0) {
                mostrarAlerta("Carga inválida (>= 0)!");
                return false;
            }
            const novaCarga = this.cargaAtual + carga;
            if (novaCarga <= this.capacidadeCarga) {
                this.cargaAtual = novaCarga;
                this.atualizarInfoCaminhao();
                mostrarAlerta(`Carga: ${this.cargaAtual}kg.`);
                salvarGaragem();
                return true;
            } else {
                mostrarAlerta(`Capacidade ${this.capacidadeCarga}kg excedida!`);
                return false;
            }
        }
        atualizarInfoCaminhao() {
            atualizarInfoVeiculo(this.getIdPrefix(), {
                carga: this.cargaAtual,
                capacidade: this.capacidadeCarga
            });
        }
        acelerar() {
            if (!this.acelerarBase()) return;
            this.velocidade += 5;
            tocarSom(somAcelerar, 0.4);
            animarVeiculo(this.getIdPrefix(), 'acelerando');
            this.atualizarVelocidade();
        }
        frear() {
            if (!this.frearBase()) return;
            this.velocidade = Math.max(0, this.velocidade - 5);
            tocarSom(somFrear, 0.6);
            animarVeiculo(this.getIdPrefix(), 'freando');
            this.atualizarVelocidade();
        }
        buzinar() {
            tocarSom(somBuzina, 0.9);
        }
    }

    class Moto extends Veiculo {
        acelerar() {
            if (!this.acelerarBase()) return;
            this.velocidade += 15;
            tocarSom(somAcelerar, 0.6);
            animarVeiculo(this.getIdPrefix(), 'acelerando');
            this.atualizarVelocidade();
        }
        frear() {
            if (!this.frearBase()) return;
            this.velocidade = Math.max(0, this.velocidade - 12);
            tocarSom(somFrear, 0.7);
            animarVeiculo(this.getIdPrefix(), 'freando');
            this.atualizarVelocidade();
        }
        buzinar() {
            tocarSom(somBuzina, 0.6);
        }
    }

    class Bicicleta extends Veiculo {
        constructor(modelo, cor) {
            super(modelo, cor);
            this.ligado = true; // Define como 'pronta'
        }
        pedalar() {
            this.velocidade += 2;
            animarVeiculo(this.getIdPrefix(), 'acelerando');
            this.atualizarVelocidade();
            this.atualizarStatus();
        }
        frear() {
            if (this.velocidade > 0) {
                this.velocidade = Math.max(0, this.velocidade - 1);
                animarVeiculo(this.getIdPrefix(), 'freando');
                this.atualizarVelocidade();
                this.atualizarStatus();
            }
        }
        buzinar() {
            tocarSom(somBuzina, 0.3);
        }
        ligar() {
            mostrarAlerta("Bicicleta sempre pronta!");
        }
        desligar() {
            if (this.velocidade > 0) {
                this.velocidade = 0;
                this.atualizarVelocidade();
                this.atualizarStatus();
            }
            mostrarAlerta("Bicicleta parada.");
        }
    }

    // --- PERSISTÊNCIA (LocalStorage) ---
    const LOCAL_STORAGE_KEY = 'garagemVirtualData_v3';
    let garagem = {};

    function salvarGaragem() {
        const garagemParaSalvar = {};
        for (const tipo in garagem) {
            const v = garagem[tipo];
            garagemParaSalvar[tipo] = {
                modelo: v.modelo,
                cor: v.cor,
                capacidadeCarga: (v instanceof Caminhao) ? v.capacidadeCarga : undefined,
                cargaAtual: (v instanceof Caminhao) ? v.cargaAtual : undefined,
                historicoManutencao: Array.isArray(v.historicoManutencao) ? v.historicoManutencao.map(m => m.toJSON()) : []
            };
        }
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(garagemParaSalvar));
        } catch (e) {
            console.error("Erro salvar LS:", e);
            mostrarAlerta("Erro salvar dados.");
        }
    }

    function carregarGaragem() {
        const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY);
        garagem = {};
        if (!dadosSalvos) {
            console.log("LS vazio. Criando padrões.");
            garagem = {
                carro: new Carro("Sedan Casual", "Prata"),
                esportivo: new CarroEsportivo("Esportivo GT", "Vermelho"),
                caminhao: new Caminhao("TruckMaster", "Branco", 5000),
                moto: new Moto("Roadster", "Preto"),
                bicicleta: new Bicicleta("Mountain Bike", "Azul")
            };
            salvarGaragem();
        } else {
            console.log("Carregando do LS.");
            try {
                const garagemRecuperada = JSON.parse(dadosSalvos);
                for (const tipo in garagemRecuperada) {
                    const d = garagemRecuperada[tipo];
                    let vInst;
                    switch (tipo) {
                        case 'carro':
                            vInst = new Carro(d.modelo, d.cor);
                            break;
                        case 'esportivo':
                            vInst = new CarroEsportivo(d.modelo, d.cor);
                            break;
                        case 'caminhao':
                            vInst = new Caminhao(d.modelo, d.cor, d.capacidadeCarga || 5000);
                            break;
                        case 'moto':
                            vInst = new Moto(d.modelo, d.cor);
                            break;
                        case 'bicicleta':
                            vInst = new Bicicleta(d.modelo, d.cor);
                            break;
                        default:
                            continue;
                    }
                    if (tipo === 'caminhao') vInst.cargaAtual = d.cargaAtual || 0;
                    if (Array.isArray(d.historicoManutencao)) {
                        vInst.historicoManutencao = d.historicoManutencao.map(Manutencao.fromJSON).filter(m => m).sort((a, b) => b.data.getTime() - a.data.getTime());
                    }
                    garagem[tipo] = vInst;
                }
            } catch (e) {
                console.error("Erro carregar/parsear LS:", e);
                mostrarAlerta("Erro carregar dados. Resetando.");
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                return carregarGaragem();
            }
        }
        atualizarInterfaceCompleta();
        verificarAgendamentosProximos();
    }

    function atualizarInterfaceCompleta() {
        for (const tipo in garagem) {
            const v = garagem[tipo];
            const idPrefix = v.getIdPrefix();
            atualizarInfoVeiculo(idPrefix, {
                modelo: v.modelo,
                cor: v.cor
            });
            v.ligado = false;
            v.velocidade = 0;
            if (v instanceof CarroEsportivo) v.turboAtivado = false;
            v.atualizarStatus();
            v.atualizarVelocidade();
            if (v instanceof CarroEsportivo) v.atualizarTurbo();
            if (v instanceof Caminhao) v.atualizarInfoCaminhao();
            v.atualizarDisplayManutencao();
        }
    }

    function verificarAgendamentosProximos() {
        const agora = new Date();
        const amanha = new Date(agora);
        amanha.setDate(agora.getDate() + 1);
        let lembretes = [];
        for (const tipo in garagem) {
            const v = garagem[tipo];
            const {
                agendamentosFuturos
            } = v.getManutencoesSeparadas();
            agendamentosFuturos.forEach(m => {
                if (m.data > agora && m.data <= amanha) {
                    const dtHr = m.data.toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                    });
                    lembretes.push(`- ${m.tipo} ${v.modelo} (${tipo}) p/ ${dtHr}.`);
                }
            });
        }
        if (lembretes.length > 0) {
            mostrarAlerta("--- LEMBRETES (Prox 24h) ---\n" + lembretes.join("\n"));
        }
    }

    // --- INICIALIZAÇÃO E EVENT LISTENERS ---
    carregarGaragem();

    const esconderTodosVeiculos = () => document.querySelectorAll('.veiculo-container').forEach(c => c.style.display = 'none');
    esconderTodosVeiculos();

    // Seleção de Veículo
    document.querySelectorAll('#veiculo-selection button').forEach(btn => {
        btn.addEventListener('click', function() {
            const tipoVeiculo = this.dataset.veiculo;
            esconderTodosVeiculos();
            const container = document.getElementById(`${tipoVeiculo}-container`);
            if (container) {
                container.style.display = 'block';
            } else {
                console.error(`Container não achado: ${tipoVeiculo}-container`);
            }
        });
    });

    // Listener Delegado Principal
    document.getElementById('container').addEventListener('click', function(event) {
        const btnAcao = event.target.closest('button[data-acao][data-tipo]');
        if (!btnAcao) return;

        const acao = btnAcao.dataset.acao;
        const tipo = btnAcao.dataset.tipo;
        const veiculo = garagem[tipo];

        if (!veiculo) {
            console.error(`Veiculo ${tipo} não encontrado!`);
            return;
        }

        const idPrefix = veiculo.getIdPrefix();

        if (acao === 'agendarManutencao') {
            const dataIn = document.getElementById(`${idPrefix}-manutencao-data`);
            const tipoIn = document.getElementById(`${idPrefix}-manutencao-tipo`);
            const custoIn = document.getElementById(`${idPrefix}-manutencao-custo`);
            const descIn = document.getElementById(`${idPrefix}-manutencao-descricao`);

            if (!dataIn || !tipoIn || !custoIn || !descIn) {
                mostrarAlerta("Erro: Campos manut. não encontrados.");
                return;
            }

            const dataStr = dataIn.value,
                tipoSrv = tipoIn.value,
                custoSrv = custoIn.value,
                descSrv = descIn.value;
            if (!dataStr) {
                mostrarAlerta("Selecione data/hora.");
                return;
            }
            if (!tipoSrv.trim()) {
                mostrarAlerta("Informe o tipo.");
                return;
            }
            if (custoSrv === '' || parseFloat(custoSrv) < 0) {
                mostrarAlerta("Custo inválido (>= 0).");
                return;
            }

            const novaM = new Manutencao(dataStr, tipoSrv, custoSrv, descSrv);
            if (veiculo.adicionarManutencao(novaM)) {
                mostrarAlerta(`Registro/Agend. "${tipoSrv}" adicionado p/ ${veiculo.modelo}!`);
                dataIn.value = tipoIn.value = custoIn.value = descIn.value = '';
                verificarAgendamentosProximos();
            }
        } else {
            switch (acao) {
                case 'ligar':
                    veiculo.ligar();
                    break;
                case 'desligar':
                    veiculo.desligar();
                    break;
                case 'acelerar':
                    veiculo.acelerar();
                    break;
                case 'frear':
                    veiculo.frear();
                    break;
                case 'buzinar':
                    veiculo.buzinar();
                    break;
                case 'ativarTurbo':
                    if (veiculo instanceof CarroEsportivo) veiculo.ativarTurbo();
                    break;
                case 'desativarTurbo':
                    if (veiculo instanceof CarroEsportivo) veiculo.desativarTurbo();
                    break;
                case 'carregar':
                    if (veiculo instanceof Caminhao) {
                        const cargaIn = document.getElementById('caminhao-carga-input');
                        if (cargaIn) {
                            if (veiculo.carregar(parseInt(cargaIn.value, 10) || 0)) {
                                cargaIn.value = '';
                            }
                        }
                    }
                    break;
                case 'pedalar':
                    if (veiculo instanceof Bicicleta) veiculo.pedalar();
                    break;
            }
        }
    });

    // Listener Enter Carga Caminhão
    const cargaInputCaminhao = document.getElementById('caminhao-carga-input');
    const carregarBtn = document.querySelector('#caminhao-container button[data-acao="carregar"]');
    if (cargaInputCaminhao && carregarBtn) {
        cargaInputCaminhao.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                carregarBtn.click();
            }
        });
    }
}); // Fim DOMContentLoaded