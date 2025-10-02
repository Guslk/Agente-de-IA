// models/Item.js

const Movimentacao = require('./Movimentacao');

const items = [
    { id_item: 1, nome: 'SSD NVMe 256GB', categoria: 'Hardware', preco_unitario: 250.00, quantidade_atual: 52, quantidade_minima: 20,},
    { id_item: 2, nome: 'Memória RAM DDR4 8GB', categoria: 'Hardware', preco_unitario: 180.50, quantidade_atual: 14, quantidade_minima: 15,},
    { id_item: 3, nome: 'Mouse Gamer Logitech G203', categoria: 'Periféricos', preco_unitario: 120.00, quantidade_atual: 35, quantidade_minima: 10,},
    { id_item: 4, nome: 'Teclado Dell KB216', categoria: 'Periféricos', preco_unitario: 80.00, quantidade_atual: 0, quantidade_minima: 5,},
    { id_item: 5, nome: 'Monitor Dell 24"', categoria: 'Monitores', preco_unitario: 950.00, quantidade_atual: 22, quantidade_minima: 10,}
];

const Item = {
    findAll: (options = {}) => {
        let itemsFiltrados = [...items]; // Começa com uma cópia de todos os itens

        // 1. Aplica o filtro de BUSCA POR NOME, se existir
        if (options.busca) {
            itemsFiltrados = itemsFiltrados.filter(item => 
                item.nome.toLowerCase().includes(options.busca.toLowerCase())
            );
        }

        // 2. Aplica o filtro de STATUS DE ESTOQUE, se existir e não for 'todos'
        if (options.filtroStatus && options.filtroStatus !== 'todos') {
            switch (options.filtroStatus) {
                case 'normal':
                    itemsFiltrados = itemsFiltrados.filter(item => 
                        item.quantidade_atual >= item.quantidade_minima && item.quantidade_atual > 0
                    );
                    break;
                case 'baixo':
                    itemsFiltrados = itemsFiltrados.filter(item => 
                        item.quantidade_atual < item.quantidade_minima && item.quantidade_atual > 0
                    );
                    break;
                case 'esgotado':
                    itemsFiltrados = itemsFiltrados.filter(item => 
                        item.quantidade_atual === 0
                    );
                    break;
            }
        }

        return itemsFiltrados; // Retorna a lista já filtrada
    },
    
    // FUNÇÃO CORRIGIDA: Encontra um item pelo seu ID
    findById: (id) => {
        return items.find(item => item.id_item === parseInt(id));
    },

    create: (itemData) => {
    const novoId = items.length > 0 ? Math.max(...items.map(i => i.id_item)) + 1 : 1;
    
    const novoItem = {
        id_item: novoId,
        nome: itemData.nome,
        descricao: itemData.descricao || '',
        codigo_barras: itemData.codigo_barras,
        unidade_medida: itemData.unidade_medida,
        quantidade_minima: parseInt(itemData.quantidade_minima) || 0,
        quantidade_atual: parseInt(itemData.quantidade_atual) || 0,

        // ============================================
        // == LÓGICA DE FALLBACK ADICIONADA AQUI     ==
        // ============================================
        // Se a categoria não for enviada, define como 'Geral'
        categoria: itemData.categoria || 'Geral', 
        // Se o preço não for um número válido, define como 0
        preco_unitario: parseFloat(itemData.preco_unitario) || 0
    };

    items.push(novoItem);
    console.log("Novo item adicionado (na memória):", novoItem);

    if (novoItem.quantidade_atual > 0) {
        Movimentacao.registrarEntrada(novoItem, itemData);
    }

    return novoItem;
    },

    // FUNÇÃO CORRIGIDA: Atualiza um item pelo seu ID
    updateById: (id, itemData) => {
        const itemIndex = items.findIndex(item => item.id_item === parseInt(id));
        if (itemIndex === -1) return null;

        // Garante que os números sejam tratados corretamente
        const dadosAtualizados = {
            ...itemData,
            quantidade_atual: parseInt(itemData.quantidade_atual),
            quantidade_minima: parseInt(itemData.quantidade_minima)
        };

        const itemAtualizado = { ...items[itemIndex], ...dadosAtualizados };
        items[itemIndex] = itemAtualizado;
        console.log("Item atualizado:", itemAtualizado);
        return itemAtualizado;
    },

    // FUNÇÃO CORRIGIDA: Deleta um item pelo seu ID
    deleteById: (id) => {
        const itemIndex = items.findIndex(item => item.id_item === parseInt(id));
        if (itemIndex === -1) return null;
        
        const [itemRemovido] = items.splice(itemIndex, 1);
        console.log("Item removido:", itemRemovido);
        return itemRemovido;
    },

    darSaida: (id, dadosSaida) => {
        const item = Item.findById(id); // Agora esta linha funcionará
        if (!item) return null;

        const quantidadeSaida = parseInt(dadosSaida.quantidade);

        if (item.quantidade_atual >= quantidadeSaida) {
            item.quantidade_atual -= quantidadeSaida;
            Movimentacao.registrarSaida(item, quantidadeSaida, dadosSaida.responsavel);
            console.log(`Saída de ${quantidadeSaida} unidades do item:`, item);
            return item;
        }
        
        console.error("Tentativa de retirada maior que o estoque atual.");
        return null; 
    },
    
     getLowStockCount: () => {
        const lowStockItems = items.filter(item => item.quantidade_atual < item.quantidade_minima);
        return lowStockItems.length;
    }
};

module.exports = Item;