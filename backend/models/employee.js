// models/employee.model.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Employee extends Model {
        static associate(models) {
            // Associações futuras (ex: com ToolMovement)
            if (models.ToolMovement) {
                this.hasMany(models.ToolMovement, { foreignKey: 'employeeId', as: 'movements' });
            }
        }
    }
    Employee.init({
        // Propriedade em JS: 'id'
        id: { 
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'id_employee' // Coluna no Banco: 'id_employee'
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false // 'name' é 'Não Nulo' na sua tabela
        },
        photo: {
            type: DataTypes.BLOB,
            allowNull: false // 'photo' é 'Não Nulo' na sua tabela
        },
        position: {
            type: DataTypes.STRING(100),
            allowNull: true // 'position' é 'Sim' para Nulo na sua tabela
        },
        role: {
            type: DataTypes.ENUM('Administrador', 'Operador'), // Corrigido erro de digitação
            allowNull: false,
            defaultValue: 'Operador', // Como na sua tabela
            field: 'role'
        },
        forcePasswordChange: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'force_password_change'
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        // Propriedade em JS: 'passwordHash'
        passwordHash: { 
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'password_hash' // Coluna no Banco: 'password_hash'
        },
        // Propriedade em JS: 'twoFactorSecret'
        twoFactorSecret: {
            type: DataTypes.STRING, // Tipo correto para o segredo
            allowNull: true, // A tabela diz 'Não Nulo', mas um segredo deve ser nulo até ser ativado.
            field: 'two_factor_secret'
        },
        // Propriedade em JS: 'twoFactorEnabled'
        twoFactorEnabled: {
            type: DataTypes.BOOLEAN, // tinyint(1) é mapeado para BOOLEAN
            allowNull: false,
            defaultValue: false,
            field: 'two_factor_enabled'
        }
    }, { 
        sequelize, 
        modelName: 'Employee', 
        tableName: 'Employee', // Nome exato da sua tabela
        timestamps: false 
    });

    Employee.associate = (models) => {
        if (models.ToolMovement) {
            models.Employee.hasMany(models.ToolMovement, { foreignKey: 'employeeId', as: 'movements' });
        }
    };

    return Employee;
};
// models/employee.model.js
// const { DataTypes, Model } = require('sequelize');

// module.exports = (sequelize) => {
//     class Employee extends Model {
//         static associate(models) {
//             // Associações futuras (ex: com ToolMovement)
//             this.hasMany(models.ToolMovement, { foreignKey: 'employeeId', as: 'movements' });
//         }
//     }
//     Employee.init({
//         id: { // Propriedade em JS: 'id'
//             type: DataTypes.INTEGER,
//             autoIncrement: true,
//             primaryKey: true,
//             field: 'id_employee' // Coluna no Banco: 'id_employee'
//         },
//         name: {
//             type: DataTypes.STRING(255),
//             allowNull: false
//         },
//         photo: {
//             type: DataTypes.BLOB,
//             allowNull: true // Como na sua tabela
//         },
//         position: {
//             type: DataTypes.STRING(100),
//             allowNull: true
//         },
//         role: {
//             // CORREÇÃO: Corrigido o erro de digitação
//             type: DataTypes.ENUM('Administrador', 'Operador'), 
//             allowNull: false,
//             defaultValue: 'Operador',
//             field: 'role'
//         },
//         email: {
//             type: DataTypes.STRING(255),
//             allowNull: false,
//             unique: true
//         },
//         // Propriedade em JS: 'passwordHash'
//         password_Hash: { 
//             type: DataTypes.STRING(255),
//             allowNull: false,
//             field: 'password_hash' // Coluna no Banco: 'password_hash'
//         },
//         twoFactorSecret: {
//             type: DataTypes.STRING, // Tipo correto para o segredo
//             allowNull: true,
//             field: 'two_factor_secret'
//         },
//         twoFactorEnabled: {
//             type: DataTypes.BOOLEAN,
//             allowNull: true,
//             defaultValue: false,
//             field: 'two_factor_enabled'
//         }
//     }, { 
//         sequelize, 
//         modelName: 'Employee', 
//         tableName: 'Employee', 
//         timestamps: false 
//     });
//     return Employee;
// };
