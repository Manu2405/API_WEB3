const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Venta = sequelize.define('Venta', {
        id_venta: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_metodo_pago: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_sucursal: {
            type: DataTypes.INTEGER
        },
        fecha: {
            type: DataTypes.DATE
            // ⚠️ QUITAR defaultValue
        },
        total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        estado: {
            type: DataTypes.STRING(20)  // ← CAMBIADO: ya no es ENUM
            // ⚠️ QUITAR defaultValue
        }
    }, {
        tableName: 'Ventas',
        timestamps: false,
        hooks: {
            beforeCreate: (venta) => {
                if (!venta.fecha) venta.fecha = new Date();
                if (!venta.estado) venta.estado = 'Pendiente';
            }
        }
    });

    return Venta;
};