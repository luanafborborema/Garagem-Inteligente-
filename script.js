document.addEventListener('DOMContentLoaded', function() {

    // Classe Veiculo (Classe base)
    class Veiculo {
        constructor(modelo, cor) {
            this.modelo = modelo;
            this.cor = cor;
            this.ligado = false;
            this.velocidade = 0;
        }

        ligar() {
            this.ligado = true;
            this.atualizarStatus();
        }

        desligar() {
            this.ligado = false;
            this.velocidade = 0; // reset velocidade
            this.atualizarStatus();
        }

        atualizarStatus() {
           const tipo = this.constructor.name.toLowerCase(); //"carro", "carroesportivo", "caminhao", "moto", "bicicleta"
           document.getElementById(`${tipo}-status`).textContent = this.ligado ? "Ligado" : "Desligado";
        }

        atualizarVelocidade() {
           const tipo = this.constructor.name.toLowerCase();
           document.getElementById(`${tipo}-velocidade`).textContent = this.velocidade;
        }


        exibirInformacoes() {
            return `Modelo: ${this.modelo}, Cor: ${this.cor}, Estado: ${this.ligado ? 'Ligado' : 'Desligado'}, Velocidade: ${this.velocidade}`;
        }
        //Métodos "vazios" para que os veículos tenham, caso não seja necessário utilizar
        acelerar(){}
        frear(){}
    }

    // Classe Carro (Herda de Veiculo)
    class Carro extends Veiculo {
        acelerar() {
            if (this.ligado) {
                this.velocidade += 10;
                this.atualizarVelocidade();
            }
        }

        frear() {
            if (this.ligado && this.velocidade > 0) {
                this.velocidade = Math.max(0, this.velocidade - 10);
                this.atualizarVelocidade();
            }
        }

        buzinar() {
            alert("Beep! Beep! Buzina do carro.");
        }
    }

    // Classe CarroEsportivo (Herda de Carro)
    class CarroEsportivo extends Carro {
        constructor(modelo, cor) {
            super(modelo, cor);
            this.turboAtivado = false;
        }

        ativarTurbo() {
            if (this.ligado) {
                this.turboAtivado = true;
                this.velocidade += 50;
                this.atualizarTurbo();
                this.atualizarVelocidade();
            }
        }

        desativarTurbo() {
            this.turboAtivado = false;
            this.velocidade = Math.max(0, this.velocidade - 50);
            this.atualizarTurbo();
            this.atualizarVelocidade();
        }

         atualizarTurbo() {
           const tipo = this.constructor.name.toLowerCase();
           document.getElementById(`${tipo}-turbo`).textContent = this.turboAtivado ? "Ativado" : "Desativado";
        }

        buzinar() {
            alert("Vrum! Vrum! Buzina esportiva!");
        }
    }

    // Classe Caminhao (Herda de Carro)
    class Caminhao extends Carro {
        constructor(modelo, cor, capacidadeCarga) {
            super(modelo, cor);
            this.capacidadeCarga = capacidadeCarga;
            this.cargaAtual = 0;
        }

        carregar(carga) {
            if (this.cargaAtual + carga <= this.capacidadeCarga) {
                this.cargaAtual += carga;
                this.atualizarCarga();
            } else {
                alert("Capacidade máxima de carga excedida!");
            }
        }

        atualizarCarga() {
           const tipo = this.constructor.name.toLowerCase();
           document.getElementById(`${tipo}-carga`).textContent = this.cargaAtual;
        }

        buzinar() {
            alert("FOM! FOM! Buzina do caminhão.");
        }
    }

    // Classe Moto (Herda de Veiculo)
    class Moto extends Veiculo {
        acelerar() {
            if (this.ligado) {
                this.velocidade += 15; //Moto acelera mais rápido
                this.atualizarVelocidade();
            }
        }

        frear() {
            if (this.ligado && this.velocidade > 0) {
                this.velocidade = Math.max(0, this.velocidade - 12); //Freio mais potente
                this.atualizarVelocidade();
            }
        }

        buzinar() {
            alert("Bip Bip!");
        }
    }

    // Classe Bicicleta (Herda de Veiculo)
    class Bicicleta extends Veiculo {
        constructor(modelo, cor) {
            super(modelo, cor);
            this.ligado = true; //Bicicleta sempre "ligada" (pronta para uso)
            this.atualizarStatus();
        }

        pedalar() {
            this.velocidade += 1; //Aumenta a velocidade em 1 km/h
            this.atualizarVelocidade();
        }

        frear() {
            if (this.velocidade > 0) {
                this.velocidade = Math.max(0, this.velocidade - 1); //Diminui a velocidade em 1 km/h
                this.atualizarVelocidade();
            }
        }

        atualizarStatus() {
            const tipo = this.constructor.name.toLowerCase();
            document.getElementById(`${tipo}-status`).textContent = this.velocidade > 0 ? "Em movimento" : "Parada";
        }


        buzinar() {
            alert("Trim Trim!");
        }

         //Para evitar erros, já que bicicleta não tem ligar/desligar
        ligar() {
            console.log("Bicicleta está sempre pronta para uso!");
        }

        desligar() {
            console.log("Bicicleta não precisa ser desligada!");
        }
    }

    // Objetos dos veículos
    const carro = new Carro("Sedan", "Prata");
    const esportivo = new CarroEsportivo("Ferrari", "Vermelha");
    const caminhao = new Caminhao("Volvo", "Branco", 5000);
    const moto = new Moto("Harley Davidson", "Preto");
    const bicicleta = new Bicicleta("Caloi", "Azul");


    // Esconde todos os containers de veículos inicialmente
    const esconderTodosVeiculos = () => {
      document.querySelectorAll('.veiculo-container').forEach(container => {
            container.style.display = 'none';
        });
    }

    esconderTodosVeiculos();

    // Event listeners para seleção de veículo
    document.querySelectorAll('#veiculo-selection button').forEach(button => {
        button.addEventListener('click', function() {
            const veiculoTipo = this.dataset.veiculo;
            esconderTodosVeiculos();
            document.getElementById(`${veiculoTipo}-container`).style.display = 'block'; // Mostra o container do veículo selecionado
        });
    });

   // Event listeners para ações dos veículos (agora dentro dos containers)
    document.querySelectorAll('.veiculo-container button').forEach(button => {
        button.addEventListener('click', function() {
            const acao = this.dataset.acao;
            const tipo = this.dataset.tipo;  // Obtenha o tipo do veículo a partir do botão

            let veiculo;
            if (tipo === 'carro') {
                veiculo = carro;
            } else if (tipo === 'esportivo') {
                veiculo = esportivo;
            } else if (tipo === 'caminhao') {
                veiculo = caminhao;
            } else if (tipo === 'moto') {
                veiculo = moto;
            } else if (tipo === 'bicicleta') {
                veiculo = bicicleta;
            }

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
                    if (veiculo === esportivo) {
                        esportivo.ativarTurbo();
                    }
                    break;
                case 'desativarTurbo':
                    if (veiculo === esportivo) {
                        esportivo.desativarTurbo();
                    }
                    break;
                case 'carregar':
                    if (veiculo === caminhao) {
                        const cargaInput = document.getElementById('carga');
                        const carga = parseInt(cargaInput.value);
                        caminhao.carregar(carga);
                    }
                    break;
                 case 'pedalar':
                    bicicleta.pedalar();
                    break;
            }
        });
    });
});