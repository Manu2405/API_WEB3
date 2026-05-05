const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Envio = sequelize.define('Envio', {
        id_envio: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_venta: {
            type: DataTypes.INTEGER,
            allowNull: false
            // ⚠️ QUITAR references de aquí
        },
        direccion: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        ciudad: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        referencia: {
            type: DataTypes.STRING(200)
        },
        estado: {
            type: DataTypes.STRING(20)  // ← Cambiar ENUM a STRING
            // ⚠️ QUITAR defaultValue
        },
        fecha_envio: {
            type: DataTypes.DATE
        },
        fecha_entrega: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'Envios',
        timestamps: false,
        hooks: {
            beforeCreate: (envio) => {
                if (!envio.estado) envio.estado = 'Preparando';
            }
        }
    });

    return Envio;
};