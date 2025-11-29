# 🧶 Calculadora de Precificação para Crochê

![Badge de Licença](https://img.shields.io/badge/license-MIT-blue.svg)
![Badge de Tecnologia](https://img.shields.io/badge/tech-Firebase%20%26%20JS-orange.svg)
![Badge de Status](https://img.shields.io/badge/status-Em%20Desenvolvimento-yellow.svg)

Uma aplicação web completa e intuitiva para artesãos de crochê e amigurumi calcularem o preço de venda de suas peças de forma justa e profissional. Chega de "chutes"! Precifique seu trabalho valorizando cada ponto.

---

## 📜 Índice

*   [Sobre o Projeto](#-sobre-o-projeto)
*   [✨ Funcionalidades Principais](#-funcionalidades-principais)
*   [🚀 Tecnologias Utilizadas](#-tecnologias-utilizadas)
*   [📸 Screenshots](#-screenshots)
*   [⚙️ Começando: Configuração Local](#️-começando-configuração-local)
    *   [Pré-requisitos](#pré-requisitos)
    *   [Instalação](#instalação)
*   [📂 Estrutura de Arquivos](#-estrutura-de-arquivos)
*   [🤝 Como Contribuir](#-como-contribuir)
*   [📄 Licença](#-licença)

---

## 📖 Sobre o Projeto

A **Calculadora de Precificação para Crochê** nasceu da necessidade de muitos artesãos em definir um preço final para seus produtos que cobrisse todos os custos e ainda gerasse lucro. Esta ferramenta descomplica o processo, permitindo que o usuário controle todos os fatores que influenciam o preço final de uma peça artesanal.

O sistema calcula o preço com base em:

*   **Custo de Materiais:** Fios, enchimentos, olhos de segurança e outros.
*   **Custo de Mão de Obra:** Baseado em um valor por hora definido pelo próprio artesão.
*   **Custos Indiretos:** Energia, internet, embalagens, etc.
*   **Margem de Lucro:** A porcentagem que você deseja lucrar sobre o custo.

Tudo isso com uma interface moderna, salvamento na nuvem e um histórico completo de todas as peças já precificadas.

---

## ✨ Funcionalidades Principais

*   **🔐 Autenticação Segura:** Login com E-mail/Senha ou Google, garantindo que apenas você tenha acesso aos seus dados.
*   **⏱️ Cronômetro Integrado:** Monitore o tempo exato gasto em cada peça com funções de iniciar, pausar e resetar.
*   **🧶 Gestão de Fios:** Cadastre diferentes fios, calcule o preço por grama e adicione o peso exato utilizado na peça.
*   **💰 Cálculo Detalhado de Custos:** A aplicação soma automaticamente os custos de fios, mão de obra e outros materiais.
*   **📈 Estratégia de Preço Flexível:** Defina sua margem de lucro e percentual de custos indiretos para chegar ao preço de venda ideal.
*   **☁️ Histórico na Nuvem:** Todas as peças precificadas são salvas no Firebase e podem ser acessadas de qualquer lugar.
*   **🔄 Carregamento de Peças:** Reutilize os dados de uma peça salva no histórico para precificar uma nova encomenda com apenas um clique.
*   **💾 Persistência de Dados:** O formulário salva seu progresso automaticamente no navegador. Se você fechar a aba sem querer, não perde os dados.
*   **📱 Design Responsivo:** Acesse e utilize a calculadora em qualquer dispositivo, seja no computador, tablet ou celular.
*   **📄 (Futuro) Geração de PDF:** Funcionalidade planejada para gerar um resumo da precificação em PDF.

---

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias web modernas, com foco em performance e escalabilidade.

*   **Frontend:**
    *   HTML5
    *   CSS3 (com Variáveis CSS para fácil customização)
    *   JavaScript (ES6+ com sistema de Módulos)

*   **Backend & Database:**
    *   **Firebase Authentication:** Para gerenciamento de usuários.
    *   **Firebase Firestore:** Como banco de dados NoSQL para salvar as peças e o histórico.

*   **Bibliotecas:**
    *   [Feather Icons](https://feathericons.com/): Para ícones leves e elegantes.
    *   [html2pdf.js](https://github.com/eKoopmans/html2pdf.js): Para a futura funcionalidade de exportação para PDF.

---

## 📸 Screenshots

*(Aqui você pode adicionar imagens da sua aplicação. Ex: a tela de login, a calculadora em uso, o histórico de peças, etc.)*

![Tela Inicial](./images/hero-page.png)

---

## ⚙️ Começando: Configuração Local

Para rodar este projeto na sua máquina local, siga os passos abaixo.

### Pré-requisitos

*   Um navegador web moderno (Chrome, Firefox, Edge).
*   Uma conta no [Firebase](https://firebase.google.com/).
*   Um editor de código (como o [VS Code](https://code.visualstudio.com/)).
*   (Recomendado) Extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) para o VS Code.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/AnnyKaah/calculadora-precifica-o-croche.git
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd calculadora-precificacao-croche
    ```

3.  **Configure o Firebase:**
    *   Vá até o [console do Firebase](https://console.firebase.google.com/) e crie um novo projeto.
    *   Dentro do seu projeto, vá em "Configurações do Projeto" (ícone de engrenagem) e, na aba "Geral", adicione um novo "App da Web".
    *   O Firebase fornecerá um objeto de configuração `firebaseConfig`. Copie este objeto.
    *   Na pasta `assets/js/`, crie um arquivo chamado `firebase-config.js`.
    *   Cole a configuração dentro deste novo arquivo, como no exemplo abaixo:

    ```javascript
    // assets/js/firebase-config.js
    export const firebaseConfig = {
      apiKey: "SUA_API_KEY",
      authDomain: "SEU_AUTH_DOMAIN",
      projectId: "SEU_PROJECT_ID",
      storageBucket: "SEU_STORAGE_BUCKET",
      messagingSenderId: "SEU_MESSAGING_SENDER_ID",
      appId: "SUA_APP_ID"
    };
    ```
    > **Importante:** O arquivo `firebase-config.js` está no `.gitignore` e nunca deve ser enviado para o repositório por conter informações sensíveis.

4.  **Habilite os serviços do Firebase:**
    *   No menu lateral do console do Firebase, vá para **Authentication** e habilite os provedores de "E-mail/senha" e "Google".
    *   Vá para **Firestore Database**, clique em "Criar banco de dados" e inicie no **modo de teste** (as regras de segurança podem ser ajustadas posteriormente).

5.  **Rode a aplicação:**
    *   Se você estiver usando o VS Code com a extensão Live Server, clique com o botão direito no arquivo `index.html` e selecione "Open with Live Server".
    *   Caso contrário, apenas abra o arquivo `index.html` diretamente no seu navegador.

---

## 📂 Estrutura de Arquivos

O projeto é organizado de forma modular para facilitar a manutenção e o desenvolvimento de novas funcionalidades.

```
calculadora-precificacao-croche/
├── assets/
│   ├── css/
│   │   └── style.css         # Estilos principais
│   ├── js/
│   │   ├── app.js            # Ponto de entrada, inicialização
│   │   ├── auth.js           # Lógica de autenticação
│   │   ├── calculations.js   # Funções de cálculo de preço
│   │   ├── firebase.js       # Inicialização do Firebase
│   │   ├── pieceManager.js   # Gestão de peças (salvar, carregar, deletar)
│   │   ├── state.js          # Estado global e seletores de elementos
│   │   ├── storage.js        # Lógica de localStorage
│   │   ├── timer.js          # Lógica do cronômetro
│   │   └── ui.js             # Manipulação da interface do usuário
│   └── images/               # Imagens e ícones
├── index.html                # Estrutura principal da página
└── README.md                 # Este arquivo
```

---

## 🤝 Como Contribuir

Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito bem-vinda**.

1.  Faça um "Fork" do projeto
2.  Crie uma "Branch" para sua nova funcionalidade (`git checkout -b feature/FuncionalidadeIncrivel`)
3.  Faça o "Commit" de suas mudanças (`git commit -m 'Adiciona FuncionalidadeIncrivel'`)
4.  Faça o "Push" para a Branch (`git push origin feature/FuncionalidadeIncrivel`)
5.  Abra um "Pull Request"

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

Feito com ❤️ por Anny Karoline
