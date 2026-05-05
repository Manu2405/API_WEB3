const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { sequelize } = require('./src/models');

// ========== IMPORTAR SWAGGER ==========
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== CONFIGURACIÓN DE SWAGGER SIN AUTHORIZE ==========
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Glow Beauty Store API',
            version: '1.0.0',
            description: 'API para tienda de productos de belleza',
            contact: {
                name: 'Glow Beauty Store',
                email: 'info@glowbeauty.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Servidor de Desarrollo'
            }
        ]
        // ⚠️ ELIMINAMOS components.securitySchemes (el candado)
    },
    apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }'
}));

// ============================================
// RUTAS
// ============================================
const authRoutes = require('./src/routes/authRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const productoRoutes = require('./src/routes/productoRoutes');
const categoriaRoutes = require('./src/routes/categoriaRoutes');
const sucursalRoutes = require('./src/routes/sucursalRoutes');
const carritoRoutes = require('./src/routes/carritoRoutes');
const ventaRoutes = require('./src/routes/ventaRoutes');
const envioRoutes = require('./src/routes/enviosRoutes');
const metodoPagoRoutes = require('./src/routes/metodoPagoRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/envios', envioRoutes);
app.use('/api/metodos-pago', metodoPagoRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API Glow Beauty funcionando correctamente',
        swagger: 'http://localhost:5000/api-docs'
    });
});

app.get('/', (req, res) => {
    res.json({
        nombre: 'Glow Beauty Store API',
        version: '1.0.0',
        documentacion: 'http://localhost:5000/api-docs'
    });
});

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Ruta no encontrada'
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: err.errors.map(e => ({ campo: e.path, mensaje: e.message }))
        });
    }
    
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            success: false,
            message: 'Ya existe un registro con esos datos'
        });
    }
    
    res.status(500).json({ 
        success: false,
        message: 'Error interno del servidor'
    });
});

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================
const crearIndicesUnicos = async () => {
    try {
        const [result] = await sequelize.query(`
            SELECT COUNT(*) as count FROM sys.indexes i 
            INNER JOIN sys.index_columns ic ON i.index_id = ic.index_id AND i.object_id = ic.object_id
            INNER JOIN sys.columns c ON ic.column_id = c.column_id AND ic.object_id = c.object_id
            WHERE i.name = 'Usuarios_email_unique' AND c.name = 'email'
        `);
        
        if (parseInt(result[0].count) === 0) {
            await sequelize.query(`CREATE UNIQUE INDEX Usuarios_email_unique ON Usuarios(email);`);
            console.log('✅ Índice único creado para email');
        }
    } catch (error) {
        if (!error.message.includes('Invalid object name')) {
            console.log('⚠️ Nota:', error.message);
        }
    }
};

const initDefaultData = async () => {
    try {
        const { MetodoPago, Categoria, Usuario } = require('./src/models');
        const bcrypt = require('bcryptjs');
        
        // Métodos de pago
        const metodosDefault = [
            { tipo: 'Tarjeta', descripcion: 'Pago con tarjeta de crédito/débito' },
            { tipo: 'Efectivo', descripcion: 'Pago en efectivo en sucursal' },
            { tipo: 'Transferencia', descripcion: 'Transferencia bancaria' },
            { tipo: 'PayPal', descripcion: 'Pago vía PayPal' }
        ];
        
        for (const metodo of metodosDefault) {
            await MetodoPago.findOrCreate({
                where: { tipo: metodo.tipo },
                defaults: metodo
            });
        }
        console.log('✅ Métodos de pago inicializados');
        
        // Categorías
        const categoriasDefault = [
            { nombre: 'Maquillaje', descripcion: 'Productos de maquillaje' },
            { nombre: 'Cuidado Facial', descripcion: 'Crema, serum y limpiadores faciales' },
            { nombre: 'Cuidado Capilar', descripcion: 'Shampoo y tratamientos' },
            { nombre: 'Perfumes', descripcion: 'Fragancias exclusivas' },
            { nombre: 'Cuidado Corporal', descripcion: 'Crema corporal y aceites' },
            { nombre: 'Accesorios', descripcion: 'Brochas y accesorios' }
        ];
        
        for (const categoria of categoriasDefault) {
            await Categoria.findOrCreate({
                where: { nombre: categoria.nombre },
                defaults: categoria
            });
        }
        console.log('✅ Categorías inicializadas');
        
        // Usuario Admin
        const adminExists = await Usuario.findOne({ where: { email: 'admin@glowbeauty.com' } });
        if (!adminExists) {
            await Usuario.create({
                nombre: 'Administrador',
                email: 'admin@glowbeauty.com',
                password: await bcrypt.hash('Admin123', 10),
                telefono: '123456789',
                direccion: 'Oficina Central',
                rol: 'Admin'
            });
            console.log('✅ Admin: admin@glowbeauty.com / Admin123');
        }
        
        // Usuario Vendedor
        const vendedorExists = await Usuario.findOne({ where: { email: 'vendedor@glowbeauty.com' } });
        if (!vendedorExists) {
            await Usuario.create({
                nombre: 'Vendedor',
                email: 'vendedor@glowbeauty.com',
                password: await bcrypt.hash('Vendedor123', 10),
                telefono: '555123456',
                direccion: 'Sucursal Centro',
                rol: 'Vendedor'
            });
            console.log('✅ Vendedor: vendedor@glowbeauty.com / Vendedor123');
        }
        
        // Usuario Cliente
        const clienteExists = await Usuario.findOne({ where: { email: 'cliente@test.com' } });
        if (!clienteExists) {
            await Usuario.create({
                nombre: 'Cliente Test',
                email: 'cliente@test.com',
                password: await bcrypt.hash('Cliente123', 10),
                telefono: '987654321',
                direccion: 'Calle Principal 123',
                rol: 'Cliente'
            });
            console.log('✅ Cliente: cliente@test.com / Cliente123');
        }
        
        console.log('✅ Datos iniciales cargados');
    } catch (error) {
        console.error('❌ Error al inicializar:', error.message);
    }
};

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
    .then(async () => {
        console.log('✅ Base de datos conectada');
        await crearIndicesUnicos();
        await initDefaultData();
        
        app.listen(PORT, () => {
            console.log(`
═══════════════════════════════════════════════════════
✨ GLOW BEAUTY STORE API - SERVIDOR ACTIVO ✨
═══════════════════════════════════════════════════════
🚀 Servidor:     http://localhost:${PORT}
📚 Swagger UI:   http://localhost:${PORT}/api-docs
💚 Health check: http://localhost:${PORT}/api/health
═══════════════════════════════════════════════════════

🔐 CREDENCIALES:
   👑 Admin:     admin@glowbeauty.com / Admin123
   🛒 Vendedor:  vendedor@glowbeauty.com / Vendedor123
   👤 Cliente:   cliente@test.com / Cliente123

🎯 ¡API lista para usar!
═══════════════════════════════════════════════════════
`);
        });
    })
    .catch(error => {
        console.error('❌ Error:', error);
        process.exit(1);
    });