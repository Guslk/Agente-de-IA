// models/Item.js

const Movimentacao = require('./Movimentacao');

const items = [
    { id_item: 1, nome: 'SSD NVMe 256GB', categoria: 'Hardware', preco_unitario: 250.00, quantidade_atual: 52, quantidade_minima: 20, descricao: 'SSD de alta velocidade', codigo_barras: '7890123456789', unidade_medida: 'unidade', departamento: 'Produção', loc_corredor: 'A', loc_prateleira: '03', loc_posicao: '12' },
    { id_item: 2, nome: 'Memória RAM DDR4 8GB', categoria: 'Hardware', preco_unitario: 180.50, quantidade_atual: 14, quantidade_minima: 15, descricao: 'Corsair Vengeance', codigo_barras: '7890123456790', unidade_medida: 'unidade', departamento: 'Produção', loc_corredor: 'A', loc_prateleira: '03', loc_posicao: '13' },
    { id_item: 3, nome: 'Mouse Gamer Logitech G203', categoria: 'Periféricos', preco_unitario: 120.00, quantidade_atual: 35, quantidade_minima: 10, descricao: 'Mouse RGB', codigo_barras: '7890123456791', unidade_medida: 'unidade', departamento: 'Administrativo', loc_corredor: 'C', loc_prateleira: '01', loc_posicao: '01' },
    { id_item: 4, nome: 'Teclado Dell KB216', categoria: 'Periféricos', preco_unitario: 80.00, quantidade_atual: 0, quantidade_minima: 5, descricao: 'Teclado ABNT2', codigo_barras: '7890123456792', unidade_medida: 'unidade', departamento: 'Administrativo', loc_corredor: 'C', loc_prateleira: '01', loc_posicao: '02' },
    { id_item: 5, nome: 'Monitor Dell 24"', categoria: 'Monitores', preco_unitario: 950.00, quantidade_atual: 22, quantidade_minima: 10, descricao: 'Monitor Full HD', codigo_barras: '7890123456793', unidade_medida: 'unidade', departamento: 'Produção', loc_corredor: 'D', loc_prateleira: '02', loc_posicao: '05' }
];

const Item = {
    findAll: (options = {}) => {
        let itemsFiltrados = [...items];
        if (options.busca) {
            itemsFiltrados = itemsFiltrados.filter(item => 
                item.nome.toLowerCase().includes(options.busca.toLowerCase())
            );
        }
        if (options.filtroStatus && options.filtroStatus !== 'todos') {
            switch (options.filtroStatus) {
                case 'normal':
                    itemsFiltrados = itemsFiltrados.filter(item => item.quantidade_atual >= item.quantidade_minima && item.quantidade_atual > 0);
                    break;
                case 'baixo':
                    itemsFiltrados = itemsFiltrados.filter(item => item.quantidade_atual < item.quantidade_minima && item.quantidade_atual > 0);
                    break;
                case 'esgotado':
                    itemsFiltrados = itemsFiltrados.filter(item => item.quantidade_atual === 0);
                    break;
            }
        }
        return itemsFiltrados;
    },
    
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
            categoria: itemData.categoria || 'Geral', 
            preco_unitario: parseFloat(itemData.preco_unitario) || 0,
            departamento: itemData.departamento || 'Não especificado',
            loc_corredor: itemData.loc_corredor || '-',
            loc_prateleira: itemData.loc_prateleira || '-',
            loc_posicao: itemData.loc_posicao || '-'
        };
        items.push(novoItem);
        if (novoItem.quantidade_atual > 0) {
            Movimentacao.registrarEntrada(novoItem, itemData);
        }
        return novoItem;
    },

    updateById: (id, itemData) => {
        const itemIndex = items.findIndex(item => item.id_item === parseInt(id));
        if (itemIndex === -1) return null;
        const dadosAtualizados = {
            ...itemData,
            quantidade_atual: parseInt(itemData.quantidade_atual),
            quantidade_minima: parseInt(itemData.quantidade_minima),
            preco_unitario: parseFloat(itemData.preco_unitario) || 0
        };
        const itemAtualizado = { ...items[itemIndex], ...dadosAtualizados };
        items[itemIndex] = itemAtualizado;
        return itemAtualizado;
    },

    deleteById: (id) => {
        const itemIndex = items.findIndex(item => item.id_item === parseInt(id));
        if (itemIndex === -1) return null;
        const [itemRemovido] = items.splice(itemIndex, 1);
        return itemRemovido;
    },

    darSaida: (id, dadosSaida) => {
        const item = Item.findById(id);
        if (!item) return null;
        const quantidadeSaida = parseInt(dadosSaida.quantidade);
        if (item.quantidade_atual >= quantidadeSaida) {
            item.quantidade_atual -= quantidadeSaida;
            Movimentacao.registrarSaida(item, quantidadeSaida, dadosSaida.responsavel);
            return item;
        }
        console.error("Tentativa de retirada maior que o estoque atual.");
        return null; 
    },

    darEntrada: (id, dadosEntrada) => {
        const item = Item.findById(id);
        if (!item) return null;
        const quantidadeEntrada = parseInt(dadosEntrada.quantidade);
        item.quantidade_atual += quantidadeEntrada;
        Movimentacao.registrarEntrada(item, dadosEntrada);
        return item;
    },
    
    // VÍRGULA ADICIONADA AQUI PARA SEPARAR AS FUNÇÕES
    getLowStockCount: () => {
        const lowStockItems = items.filter(item => item.quantidade_atual < item.quantidade_minima);
        return lowStockItems.length;
    }
};

module.exports = Item;