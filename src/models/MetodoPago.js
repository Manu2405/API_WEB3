const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MetodoPago = sequelize.define('MetodoPago', {
        id_metodo_pago: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tipo: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [['Tarjeta', 'Efectivo', 'Transferencia', 'PayPal']]
            }
        },
        descripcion: {
            type: DataTypes.STRING(200)
        }
    }, {
        tableName: 'MetodosPago',
        timestamps: false
    });

    return MetodoPago;
};