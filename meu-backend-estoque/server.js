// Importa os pacotes necessários
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONFIGURAÇÃO ---
const app = express();
const PORT = 3000;
const API_KEY = process.env.API_KEY; // Lê a chave do arquivo .env

// --- BANCO DE DADOS FALSO (para simulação) ---
// Em um projeto real, isso seria uma consulta a um banco de dados SQL ou NoSQL
const mockDatabase = [
    { id: 'SKU001', name: 'Parafuso Sextavado M8', quantity: 152, location: 'Corredor 1, Prateleira A' },
    { id: 'SKU002', name: 'Óleo Lubrificante XPTO', quantity: 85, location: 'Corredor 2, Prateleira C' },
    { id: 'SKU003', name: 'Filtro de Ar Modelo B', quantity: 40, location: 'Corredor 1, Prateleira B' },
];

// Função para simular a busca no banco de dados
function findItemInDb(itemName) {
    // Lógica simplificada: busca por correspondência de nome parcial
    const lowerItemName = itemName.toLowerCase();
    return mockDatabase.find(item => item.name.toLowerCase().includes(lowerItemName));
}

// --- CONFIGURAÇÃO DO SERVIDOR E DA IA ---
app.use(cors()); // Habilita o CORS
app.use(express.json()); // Permite que o servidor entenda JSON

// Inicializa a IA Generativa do Google
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// --- ROTA PRINCIPAL DA API ---
app.post('/ask-ia', async (req, res) => {
    const userPrompt = req.body.prompt;
    if (!userPrompt) {
        return res.status(400).json({ error: 'Nenhum prompt foi fornecido.' });
    }

    // O "Prompt Engineering" é crucial aqui. Damos contexto à IA.
    const fullPrompt = `
        Você é um assistente de controle de estoque. Sua função é interpretar a pergunta do usuário e responder de forma concisa.
        Se o usuário perguntar sobre a quantidade de um item, você deve identificar o nome do item.
        Com base na pergunta do usuário: "${userPrompt}", qual é o nome do item que ele está procurando?
        Responda APENAS com o nome do item. Por exemplo, se a pergunta for "quantos parafusos M8 temos?", responda "Parafuso Sextavado M8".
    `;

    try {
        // 1. Pergunta à IA para extrair o nome do item
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const itemName = response.text().trim();

        // 2. Busca o item no nosso "banco de dados"
        const itemData = findItemInDb(itemName);

        // 3. Formula a resposta final para o usuário
        let finalResponse = '';
        if (itemData) {
            finalResponse = `Temos ${itemData.quantity} unidades do item '${itemData.name}' em estoque, localizado em: ${itemData.location}.`;
        } else {
            finalResponse = `Desculpe, não consegui encontrar o item "${itemName}" em nosso estoque.`;
        }

        res.json({ response: finalResponse });

    } catch (error) {
        console.error("Erro ao chamar a API de IA:", error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});