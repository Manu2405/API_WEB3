const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Sucursal = sequelize.define('Sucursal', {
        id_sucursal: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        direccion: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        telefono: {
            type: DataTypes.STRING(20)
        },
        foto_url: {
            type: DataTypes.STRING(500)
        },
        latitud: {
            type: DataTypes.FLOAT
        },
        longitud: {
            type: DataTypes.FLOAT
        }
    }, {
        tableName: 'Sucursales',
        timestamps: false
    });

    return Sucursal;
};