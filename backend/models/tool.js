const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Tool = sequelize.define('Tool', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    });

    return Tool;
};