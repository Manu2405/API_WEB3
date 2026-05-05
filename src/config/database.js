require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'mssql',
    host: 'localhost',
    port: 1433,
    database: process.env.DB_NAME || 'GlowBeautyDB',
    username: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'GlowBeauty2024',
    dialectOptions: {
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    },
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Verificar conexión
(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ CONECTADO A SQL SERVER (Usuario SA)');
        console.log('📦 Base de datos:', process.env.DB_NAME);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
})();

module.exports = sequelize;