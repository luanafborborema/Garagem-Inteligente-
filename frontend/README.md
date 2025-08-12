<<<<<<< HEAD
# Garagem Inteligente Unificada

## Visão Geral do Projeto

A "Garagem Inteligente Unificada" é uma aplicação web interativa construída com HTML, CSS e JavaScript, utilizando os princípios da Programação Orientada a Objetos (POO). O projeto simula o gerenciamento de uma garagem virtual, permitindo ao usuário adicionar, controlar e monitorar diferentes tipos de veículos (Carro Casual, Carro Esportivo, Caminhão, Moto e Bicicleta), além de gerenciar o histórico de manutenções.

O backend em Node.js/Express serve como o cérebro da aplicação, conectando-se a um banco de dados MongoDB Atlas para **persistência de dados** e fornecendo diversas APIs (Application Programming Interfaces) para o frontend consumir.

## Funcionalidades Principais

*   **Gestão de Veículos com Persistência (CRUD Básico)**:
    *   **Adicionar Novos Veículos (Create - POST)**: Crie novos veículos através de um formulário no frontend, com os dados sendo salvos de forma **persistente** no MongoDB Atlas. Validação de dados (ex: placa única) é aplicada no backend.
    *   **Visualizar Veículos Existentes (Read - GET)**: Todos os veículos salvos no MongoDB são carregados e exibidos dinamicamente na sidebar do frontend, permitindo sua seleção e visualização detalhada.
*   **Controle e Simulação de Veículos**:
    *   Controle individual de cada veículo (ligar, desligar, acelerar, frear, buzinar).
    *   Funcionalidades específicas por tipo de veículo (ex: turbo para Carro Esportivo, carregar/descarregar para Caminhão).
*   **Registro e Histórico de Manutenção**:
    *   Registro e visualização de histórico e agendamentos de manutenção para cada veículo (dados persistidos no LocalStorage para manutenções).
*   **Integração com APIs Externas e Internas**:
    *   **Previsão do Tempo Detalhada**: Consulta a previsão do tempo de cidades utilizando a API OpenWeatherMap (acessada de forma segura via backend Node.js, atuando como proxy).
    *   **Múltiplos Endpoints de Informação (Backend)**:
        *   **Veículos em Destaque**: `GET /api/garagem/veiculos-destaque` - Retorna uma lista de veículos com características especiais.
        *   **Serviços de Oficina**: `GET /api/garagem/servicos-oferecidos` - Lista os tipos de serviços que a garagem oferece.
        *   **Ferramentas Essenciais**: `GET /api/garagem/ferramentas-essenciais/:idFerramenta` - Retorna detalhes de uma ferramenta específica por ID.

## Tecnologias Utilizadas

*   **Frontend**:
    *   HTML5
    *   CSS3 (com Flexbox/Grid para layout)
    *   JavaScript (ES6+ com Módulos e Programação Orientada a Objetos)
    *   `LocalStorage` (para persistência do histórico de manutenções específico de cada veículo, para além da gestão centralizada do MongoDB)
*   **Backend**:
    *   Node.js (ambiente de execução JavaScript)
    *   Express.js (framework web para Node.js)
    *   Mongoose (ODM para MongoDB, facilitando modelagem e interação com o DB)
    *   `dotenv` (para gerenciar variáveis de ambiente)
    *   `cors` (para permitir comunicação entre frontend e backend em origens diferentes)
*   **Banco de Dados**:
    *   MongoDB Atlas (Serviço de banco de dados NoSQL na nuvem para persistência principal de veículos)
*   **APIs Externas**:
    *   API OpenWeatherMap (para dados de previsão do tempo)
*   **Deploy (Publicação)**:
    *   Render.com (para deploy do backend Node.js)
    *   (Se aplicável, para o Frontend): Vercel/Netlify/GitHub Pages

## Como Usar e Testar Localmente

Para rodar a Garagem Inteligente no seu computador:

1.  **Clone o repositório**:
    `git clone https://github.com/SEU_USUARIO_GITHUB/NOME_DO_SEU_REPOSITORIO.git`
    *   **(Substitua `SEU_USUARIO_GITHUB/NOME_DO_SEU_REPOSITORIO` pelo link real do seu projeto no GitHub)**
2.  **Configurar o Backend**:
    *   Navegue até a pasta `backend/`: `cd NOME_DO_SEU_REPOSITORIO/backend`
    *   Instale as dependências: `npm install`
    *   Crie um arquivo `.env` na pasta `backend/` e adicione as seguintes variáveis de ambiente, **substituindo pelos seus valores reais**:
        ```
        PORT=3001
        OPENWEATHER_API_KEY=SUA_CHAVE_OPENWEATHER_MAP_AQUI
        MONGO_URI_CRUD=mongodb+srv://SEU_USUARIO_DB:SUA_SENHA_DB@SEU_CLUSTER_URL/garagemDB?retryWrites=true&w=majority&appName=SEU_APP_NAME
        ```
        *   Obtenha `OPENWEATHER_API_KEY` do OpenWeatherMap.
        *   Obtenha `MONGO_URI_CRUD` do seu [MongoDB Atlas](https://cloud.mongodb.com/) (configurando usuário, senha e Network Access para o seu IP local e `0.0.0.0/0` para o Render). Certifique-se de substituir `SEU_USUARIO_DB`, `SUA_SENHA_DB`, `SEU_CLUSTER_URL` e `SEU_APP_NAME` pelos seus dados reais.
    *   Inicie o servidor backend: `node server.js`
        *   Você deverá ver mensagens de que o servidor está rodando na porta 3001 e que a conexão com o MongoDB Atlas foi bem-sucedida.

3.  **Executar o Frontend**:
    *   Navegue até a pasta `frontend/`: `cd NOME_DO_SEU_REPOSITORIO/frontend` (se você ainda não estiver lá).
    *   Garanta que as pastas `imagens/` e `sons/` estão dentro da pasta `frontend/`.
    *   Abra o arquivo `index.html` diretamente em um navegador web moderno (Chrome, Firefox, Edge).

4.  **Testes da Aplicação Local**:
    *   **Adicionar Veículo**: Clique em "➕ Adicionar Veículo", preencha os dados (especialmente a placa, que deve ser única), e salve. Verifique se ele aparece na sidebar. **Recarregue a página (F5)**: O veículo deve permanecer na sidebar e nos detalhes, confirmando a persistência no MongoDB.
    *   **Previsão do Tempo**: Selecione um veículo e na seção de Previsão, digite uma cidade e clique em "Ver Previsão".
    *   **Outras Seções (Destaques, Serviços, Ferramentas)**: Verifique se as informações são carregadas e exibidas corretamente nas respectivas seções.
    *   **Ações do Veículo**: Teste ligar, acelerar, frear, buzinar, e ações específicas (turbo do esportivo, carga do caminhão).
    *   **Manutenção**: Adicione registros e verifique o histórico.

## API Key da OpenWeatherMap e Segurança

**⚠️ ALERTA DE SEGURANÇA CRÍTICO! ⚠️**

A chave de API da OpenWeatherMap e a string de conexão do MongoDB Atlas **NUNCA** devem ser expostas diretamente no código-fonte (especialmente no frontend ou em commits no GitHub).

Neste projeto, a `OPENWEATHER_API_KEY` e a `MONGO_URI_CRUD` são gerenciadas como **Variáveis de Ambiente**:

*   **Localmente**: Armazenadas no arquivo `.env` (que é ignorado pelo Git).
*   **No Deploy (Render)**: Configuras como variáveis de ambiente no painel do serviço no Render.com, protegendo suas credenciais.

## Deploy da Aplicação (Versão Pública na Nuvem)

Para que sua aplicação seja acessível publicamente:

1.  **Backend (Node.js/Express) no Render.com**:
    *   Seu backend deve estar conectado ao seu repositório GitHub no Render.com como um "Web Service".
    *   No Render, em "Environment", configure as variáveis de ambiente `PORT`, `OPENWEATHER_API_KEY`, e `MONGO_URI_CRUD` com seus respectivos valores (igual ao `.env` local, mas agora na plataforma).
    *   O "Build Command" deve ser `npm install`.
    *   O "Start Command" deve ser `npm start` (certifique-se de que `package.json` tenha `"start": "node server.js"`).
    *   Após o deploy, você terá uma URL pública para seu backend (ex: `https://seubackend.onrender.com`).
2.  **Frontend (HTML/CSS/JS) (Ex: Vercel, Netlify, GitHub Pages)**:
    *   Faça o deploy do seu frontend em uma plataforma de hospedagem estática.
    *   **CRÍTICO**: No arquivo `frontend/script.js`, atualize a constante `backendUrl` para apontar para a **URL pública do seu backend no Render**:
        `const backendUrl = 'https://sua-url-backend-do-render.onrender.com';`
        (Remova ou comente `const backendUrl = backendLocalUrl;` e use apenas a URL do Render quando for para deploy).
    *   Faça commit e push dessa alteração no `script.js` para seu repositório.
    *   Refaça o deploy do seu frontend.

## Teste na Versão Pública

Após o deploy do backend e do frontend (se for separado):

*   Acesse a URL pública do seu frontend.
*   Teste todas as funcionalidades, especialmente a adição e visualização de veículos (se eles persistem ao recarregar), a previsão do tempo e as novas seções de informações.
*   Verifique o console do navegador e os logs do Render (para o backend) para quaisquer erros.
=======
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
>>>>>>> e6b4cfe7b3daa0b8532778724f7576f605c1a068
