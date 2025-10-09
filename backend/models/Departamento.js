// models/Departamento.js

let departamentos = [
    { id: 1, nome: 'Produção' },
    { id: 2, nome: 'Serviços Gerais' },
    { id: 3, nome: 'Administrativo' },
];

let proximoId = 4;

const Departamento = {
    findAll: () => {
        return [...departamentos];
    },

    create: (dadosDepartamento) => {
        const novoDepartamento = {
            id: proximoId++,
            nome: dadosDepartamento.nome
        };
        departamentos.push(novoDepartamento);
        console.log("Novo departamento adicionado:", novoDepartamento);
        return novoDepartamento;
    }
    // Futuramente: funções para editar e excluir departamentos
};

module.exports = Departamento;