const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ToolMovement = sequelize.define('ToolMovement', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        movementDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.ENUM('Withdrawal', 'Return'),
            allowNull: false
        }
        // Foreign keys: toolId, responsibleUserId will be added by associations.
    });

    return ToolMovement;
};