// Arquivo: models/employee.model.js (Versão Corrigida)
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Employee = sequelize.define('Employee', {
    id_employee: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'id_employee'
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    photo: {
        // O tipo BLOB corresponde à sua tabela
        type: DataTypes.BLOB,
        allowNull: false // Na imagem, está marcado como "Não" para nulo
    },
    // Campo 'position' que estava faltando
    position: {
        type: DataTypes.STRING(100),
        allowNull: true // Na imagem, está marcado como "Sim" para nulo
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash' // Garante que o Sequelize leia a coluna 'password_hash'
    },
    two_factor_secret: {
        // tinyint(1) pode ser um booleano ou um inteiro pequeno.
        // Se for só para guardar o segredo, STRING é mais seguro.
        // Mas se for um status (0 ou 1), BOOLEAN é melhor. Vou manter STRING.
        type: DataTypes.STRING, 
        allowNull: true, // Assumindo que pode ser nulo se não estiver ativo
        field: 'two_factor_secret'
    },
    // Campo 'two_factor_enabled' que estava faltando
    two_factor_enabled: {
        // tinyint(1) é mapeado perfeitamente para BOOLEAN (true/false)
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'two_factor_enabled'
    }
  }, {
    tableName: 'Employee',
    timestamps: false
  });

  return Employee;
};