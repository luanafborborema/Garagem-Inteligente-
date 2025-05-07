# Garagem Inteligente Unificada

## Visão Geral do Projeto

A **Garagem Inteligente Unificada** é uma aplicação web interativa construída com HTML, CSS e JavaScript, utilizando os princípios da Programação Orientada a Objetos (POO). O projeto simula o gerenciamento de uma garagem virtual, permitindo ao usuário adicionar, controlar e monitorar diferentes tipos de veículos (Carro Casual, Carro Esportivo, Caminhão, Moto e Bicicleta), além de gerenciar o histórico de manutenções.

A funcionalidade de **Previsão do Tempo Detalhada** permite que o usuário consulte a previsão para os próximos 5 dias de uma cidade informada, diretamente na interface de cada veículo. Essa funcionalidade utiliza a API OpenWeatherMap.

A aplicação utiliza o LocalStorage do navegador para persistir os dados dos veículos e manutenções, garantindo que as informações sejam mantidas mesmo após o fechamento e reabertura da página.

## Funcionalidades Principais

* Adição e gerenciamento de múltiplos veículos de diferentes tipos.
* Controle individual de cada veículo (ligar, desligar, acelerar, frear, buzinar).
* Funcionalidades específicas por tipo de veículo (ex: turbo para Carro Esportivo, carregar/descarregar para Caminhão).
* Registro e visualização do histórico e agendamentos de manutenção para cada veículo.
* Persistência de dados no LocalStorage.
* Busca e exibição da previsão do tempo detalhada para 5 dias de uma cidade especificada, utilizando a API OpenWeatherMap (endpoint "5 day / 3 hour forecast").

## Tecnologias Utilizadas

* HTML5
* CSS3 (com Flexbox/Grid para layout)
* JavaScript (ES6+ com Módulos e Programação Orientada a Objetos)
* API OpenWeatherMap (para dados de previsão do tempo)
* LocalStorage (para persistência de dados no navegador)

## Como Usar e Testar

1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO_GITHUB/NOME_DO_SEU_REPOSITORIO.git
   ```
   > Substitua `SEU_USUARIO_GITHUB/NOME_DO_SEU_REPOSITORIO` pelo link real do seu projeto no GitHub.

2. Abra o arquivo `index.html` em um navegador web moderno (Google Chrome, Firefox, Edge são recomendados).

3. **Para testar a funcionalidade de previsão do tempo:**
   * Selecione um veículo existente na barra lateral ou adicione um novo através do botão "➕ Adicionar Veículo".
   * No painel do veículo selecionado, localize a seção "Previsão do Tempo".
   * Digite o nome de uma cidade válida no campo "Cidade:" (ex: "São Paulo", "Curitiba", "London").
   * Clique no botão "Ver Previsão 5 Dias".
   * A previsão para os próximos dias será exibida abaixo do botão.

4. **Outras funcionalidades:**
   * Explore os botões de ação de cada veículo (Ligar, Acelerar, Frear, etc.).
   * Adicione registros de manutenção e veja o histórico e agendamentos sendo atualizados.
   * Feche e reabra o navegador; os dados da garagem devem persistir.

## API Key da OpenWeatherMap e Segurança

### ⚠️ ALERTA DE SEGURANÇA CRÍTICO! ⚠️

Para a funcionalidade de previsão do tempo, este projeto utiliza uma chave de API (API Key) da OpenWeatherMap.

**No código JavaScript do frontend (`script.js`), a API Key está armazenada diretamente, como demonstrado abaixo:**

```javascript
// ATENÇÃO: ARMAZENAR A API KEY DIRETAMENTE NO CÓDIGO FRONTEND É INSEGURO!
// Em uma aplicação real, a chave NUNCA deve ficar exposta aqui.
// A forma correta envolve um backend (Node.js, Serverless) atuando como proxy.
// Para FINS DIDÁTICOS nesta atividade, vamos usá-la aqui temporariamente.
const apiKeyOpenWeather = "bd5e378503939ddaee76f12ad7a97608"; // Chave usada para fins didáticos
```

### ⚠️ Aviso de Segurança

⚠️ **Esta abordagem é INSEGURA e NÃO é recomendada para aplicações em produção.**  
Qualquer pessoa com acesso ao código fonte do navegador pode visualizar a chave e utilizá-la indevidamente. Isso pode resultar no esgotamento da sua cota de requisições na API, bloqueio da chave ou até mesmo usos mal-intencionados associados à sua conta.

💡 Esta foi uma simplificação adotada **EXCLUSIVAMENTE PARA FINS DIDÁTICOS**, no contexto desta atividade acadêmica, com o objetivo de focar na lógica de consumo da API no frontend.

## ✅ Abordagem Correta para Segurança da API Key em Projetos Reais

A forma correta e segura de lidar com chaves de API no frontend é **NÃO expô-las diretamente**. Em vez disso, deve-se utilizar um **backend (servidor)** que atue como um **proxy (intermediário)** entre o frontend e a API externa:

1. O frontend (sua página web) faz uma requisição para uma rota específica no seu backend (ex: `https://seuservidor.com/api/previsao?cidade=SaoPaulo`);
2. O backend, onde a API Key da OpenWeatherMap está armazenada de forma segura (por exemplo, como uma variável de ambiente), recebe essa requisição;
3. O backend então faz a chamada à API OpenWeatherMap, incluindo a chave de forma segura;
4. A OpenWeatherMap responde ao seu backend;
5. Seu backend processa a resposta (se necessário) e a envia de volta para o frontend.

🔁 Alternativas ao backend tradicional incluem o uso de **Serverless Functions**, como:

- AWS Lambda  
- Google Cloud Functions  
- Vercel Functions  
- Netlify Functions  

Essas funções cumprem o mesmo papel de intermediário seguro, sem a necessidade de gerenciar um servidor completo, sendo uma excelente opção para proteger chaves de API.

---

## 🗂 Estrutura do Projeto (Principais Arquivos)

- **`index.html`**: Define a estrutura da interface do usuário da garagem.
- **`style.css`**: Contém as regras de estilo para a aparência visual da aplicação.
- **`script.js`**: Implementa a lógica principal da aplicação, incluindo o gerenciamento da garagem, interações com o DOM, persistência de dados via LocalStorage e chamadas à API OpenWeatherMap.
- **`Veiculo.js`**: Define a classe abstrata `Veiculo`, base para todos os tipos de veículos.
- **`Carro.js`**: Define a classe `Carro`, que herda de `Veiculo`, representando um carro casual.
- **`CarroEsportivo.js`**: Define a classe `CarroEsportivo`, que herda de `Carro`, com funcionalidades como turbo.
- **`Caminhao.js`**: Define a classe `Caminhao`, que herda de `Carro`, com funcionalidades de carga e descarga.
- **`Moto.js`**: Define a classe `Moto`, que herda de `Veiculo`.
- **`Bicicleta.js`**: Define a classe `Bicicleta`, que herda de `Veiculo`, com comportamentos específicos como "pedalar".
- **`Manutencao.js`**: Define a classe `Manutencao`, utilizada para registrar e gerenciar serviços de manutenção.
- **`funcoesAuxiliares.js`** *(caso exista)*: Contém funções utilitárias usadas em várias partes do projeto, como `tocarSom`, `mostrarFeedback`, etc.
- **`dados_veiculos_api.json`**: Arquivo JSON local que simula uma API com detalhes de veículos (valor FIPE, informações de recall, etc.).
- **`imagens/`**: Pasta com imagens dos diferentes tipos de veículos.
- **`sons/`**: Pasta com arquivos de áudio para ações dos veículos (buzina, ligar, etc.).

---

## 👩‍💻 Autora

**Luana Ferreira Borborema**  
Desenvolvido como parte do curso Técnico em Informática Integrado ao Ensino Médio
