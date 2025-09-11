document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA ABRIR E FECHAR O WIDGET DE CHAT ---
    const chatFab = document.getElementById('chat-fab');
    const chatWidgetContainer = document.getElementById('chat-widget-container');

    chatFab.addEventListener('click', () => {
        // Alterna a classe 'hidden' para mostrar ou esconder o chat
        chatWidgetContainer.classList.toggle('hidden');
    });


    // --- LÓGICA PRINCIPAL DO CHAT (COMUNICAÇÃO COM O BACK-END) ---
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');


    const BACKEND_URL = 'http://localhost:3000/ask-ia';

    // Event listeners para o envio de mensagens
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Função para adicionar uma mensagem na tela
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerText = text;
        chatBox.appendChild(messageDiv);
        // Rola para a mensagem mais recente
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Função para enviar a pergunta ao back-end e receber a resposta
    async function sendMessage() {
        const userText = userInput.value.trim();
        if (!userText) return;

        addMessage(userText, 'user');
        userInput.value = '';

        // Mostra uma mensagem de "pensando..."
        const thinkingMessage = document.createElement('div');
        thinkingMessage.className = 'message ai-message';
        thinkingMessage.innerText = '...';
        chatBox.appendChild(thinkingMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        
        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: userText }),
            });

            if (!response.ok) {
                throw new Error('Erro na comunicação com o servidor.');
            }

            const data = await response.json();
            // Remove o "..." e adiciona a resposta final
            chatBox.removeChild(thinkingMessage);
            addMessage(data.response, 'ai');

        } catch (error) {
            // Em caso de erro, avisa o usuário
            chatBox.removeChild(thinkingMessage);
            addMessage('Desculpe, não consegui processar sua solicitação. Verifique se o servidor está ativo.', 'ai');
            console.error('Erro:', error);
        }
    }
});