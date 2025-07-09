# Garagem Inteligente Unificada

## Visão Geral do Projeto

A "Garagem Inteligente Unificada" é uma aplicação web interativa construída com HTML, CSS e JavaScript, utilizando os princípios da Programação Orientada a Objetos (POO). O projeto simula o gerenciamento de uma garagem virtual, permitindo ao usuário adicionar, controlar e monitorar diferentes tipos de veículos (Carro Casual, Carro Esportivo, Caminhão, Moto e Bicicleta), além de gerenciar o histórico de manutenções.

A funcionalidade de **Previsão do Tempo Detalhada** permite que o usuário consulte a previsão para os próximos 5 dias para uma cidade informada, diretamente na interface de cada veículo. Esta funcionalidade utiliza a API OpenWeatherMap.

A aplicação utiliza o LocalStorage do navegador para persistir os dados dos veículos e manutenções, garantindo que as informações sejam mantidas mesmo após o fechamento e reabertura da página.

## Funcionalidades Principais

*   Adição e gerenciamento de múltiplos veículos de diferentes tipos.
*   Controle individual de cada veículo (ligar, desligar, acelerar, frear, buzinar).
*   Funcionalidades específicas por tipo de veículo (ex: turbo para Carro Esportivo, carregar/descarregar para Caminhão).
*   Registro e visualização de histórico e agendamentos de manutenção para cada veículo.
*   Persistência de dados no LocalStorage.
*   Busca e exibição da previsão do tempo detalhada para 5 dias para uma cidade especificada, utilizando a API OpenWeatherMap (endpoint "5 day / 3 hour forecast").

## Tecnologias Utilizadas

*   HTML5
*   CSS3 (com Flexbox/Grid para layout)
*   JavaScript (ES6+ com Módulos e Programação Orientada a Objetos)
*   API OpenWeatherMap (para dados de previsão do tempo)
*   LocalStorage (para persistência de dados no navegador)

## Como Usar e Testar

1.  Clone o repositório: `git clone https://github.com/SEU_USUARIO_GITHUB/NOME_DO_SEU_REPOSITORIO.git`
    *   **(Substitua `SEU_USUARIO_GITHUB/NOME_DO_SEU_REPOSITORIO` pelo link real do seu projeto no GitHub)**
2.  Abra o arquivo `index.html` em um navegador web moderno (Google Chrome, Firefox, Edge são recomendados).
3.  **Para testar a funcionalidade de previsão do tempo:**
    *   Selecione um veículo existente na barra lateral ou adicione um novo através do botão "➕ Adicionar Veículo".
    *   No painel do veículo selecionado, localize a seção "Previsão do Tempo".
    *   Digite o nome de uma cidade válida no campo "Cidade:" (ex: "São Paulo", "Curitiba", "London").
    *   Clique no botão "Ver Previsão 5 Dias".
    *   A previsão para os próximos dias deverá ser exibida abaixo do botão.
4.  **Outras funcionalidades:**
    *   Explore os botões de ação de cada veículo (Ligar, Acelerar, Frear, etc.).
    *   Adicione registros de manutenção e veja o histórico e agendamentos serem atualizados.
    *   Feche e reabra o navegador; os dados da garagem devem persistir.

## API Key da OpenWeatherMap e Segurança

**⚠️ ALERTA DE SEGURANÇA CRÍTICO! ⚠️**

Para a funcionalidade de previsão do tempo, este projeto utiliza uma chave de API (API Key) da OpenWeatherMap.

**No código JavaScript do frontend (`script.js`), a API Key está armazenada diretamente, como demonstrado abaixo:**

```javascript
// ATENÇÃO: ARMAZENAR A API KEY DIRETAMENTE NO CÓDIGO FRONTEND É INSEGURO!
// Em uma aplicação real, a chave NUNCA deve ficar exposta aqui.
// A forma correta envolve um backend (Node.js, Serverless) atuando como proxy.
// Para FINS DIDÁTICOS nesta atividade, vamos usá-la aqui temporariamente.
const apiKeyOpenWeather = "bd5e378503939ddaee76f12ad7a97608"; // Chave usada para fins didáticos