# 🧶 Calculadora de Precificação para Crochê

![Badge de Licença](https://img.shields.io/badge/license-MIT-blue.svg)
![Badge de Tecnologia](https://img.shields.io/badge/tech-HTML%2C%20CSS%2C%20JS-orange.svg)
![Badge de Status](https://img.shields.io/badge/status-Em%20Desenvolvimento-yellow.svg)

Uma aplicação web completa e intuitiva para artesãos de crochê e amigurumi calcularem o preço de venda de suas peças de forma justa e profissional. Chega de "chutes"! Precifique seu trabalho valorizando cada ponto.

---

## 📜 Sumário

*   [Sobre o Projeto](#-sobre-o-projeto)
*   [✨ Funcionalidades Principais](#-funcionalidades-principais)
*   [🚀 Tecnologias Utilizadas](#-tecnologias-utilizadas)
*   [📸 Screenshots](#-screenshots)
*   [⚙️ Começando: Como Usar](#️-começando-como-usar)
*   [📂 Estrutura de Arquivos](#-estrutura-de-arquivos)
*   [🤝 Como Contribuir](#-como-contribuir)
*   [📄 Licença](#-licença)

---

## 📖 Sobre o Projeto

A **Calculadora de Precificação para Crochê** nasceu da necessidade de muitos artesãos em definir um preço final para seus produtos que cobrisse todos os custos e ainda gerasse lucro. Esta ferramenta 100% local e focada em privacidade descomplica o processo, permitindo que o usuário controle todos os fatores que influenciam o preço final de uma peça artesanal, salvando todos os dados diretamente no seu navegador.

O sistema calcula o preço com base em:

*   **Custo de Materiais:** Fios, enchimentos, olhos de segurança e outros.
*   **Custo de Mão de Obra:** Baseado em um valor por hora definido pelo próprio artesão.
*   **Custos Indiretos:** Energia, internet, embalagens, etc.
*   **Margem de Lucro:** A porcentagem que você deseja lucrar sobre o custo.

---

## ✨ Funcionalidades Principais

*   **🔐 Autenticação Segura:** Login com E-mail/Senha ou Google, garantindo que apenas você tenha acesso aos seus dados.
*   **⏱️ Cronômetro Integrado:** Monitore o tempo exato gasto em cada peça com funções de iniciar, pausar e resetar.
*   **🧶 Gestão de Materiais:** Cadastre fios e aviamentos, calcule o preço por grama e adicione o custo exato utilizado na peça.
*   **💰 Cálculo Detalhado de Custos:** A aplicação soma automaticamente os custos de fios, mão de obra e outros materiais.
*   **📈 Estratégia de Preço Flexível:** Defina sua margem de lucro e percentual de custos indiretos para chegar ao preço de venda ideal.
*   **💾 Persistência de Dados:** O formulário salva seu progresso automaticamente no navegador. Se você fechar a aba sem querer, não perde os dados. O histórico de peças e receitas também fica salvo localmente.
*   **📱 Design Responsivo:** Acesse e utilize a calculadora em qualquer dispositivo, seja no computador, tablet ou celular.

---

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando tecnologias web modernas, com foco em performance e escalabilidade.

*   **Frontend:**
    *   HTML5
    *   CSS3 (com Variáveis CSS para fácil customização)
    *   JavaScript (ES6+ com sistema de Módulos)

*   **Bibliotecas:**
    *   [Feather Icons](https://feathericons.com/): Para ícones leves e elegantes.
    *   [Chart.js](https://www.chartjs.org/): Para a criação de gráficos de custos.
    *   [html2pdf.js](https://github.com/eKoopmans/html2pdf.js): Para a funcionalidade de exportação para PDF.

---

## 📸 Screenshots

![Tela Inicial da Calculadora](./images/hero-page.png)

---

## ⚙️ Começando: Como Usar

Este projeto não requer instalação ou configuração complexa. Por ser uma aplicação totalmente frontend, basta seguir os passos:

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/calculadora-precificacao-croche.git
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd calculadora-precificacao-croche
    ```
3.  **Abra o arquivo `index.html`:**
    *   A maneira mais fácil é usar a extensão **Live Server** no VS Code. Clique com o botão direito no arquivo `index.html` e selecione "Open with Live Server".
    *   Alternativamente, você pode abrir o arquivo `index.html` diretamente no seu navegador.

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
