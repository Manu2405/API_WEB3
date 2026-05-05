const { Venta, DetalleVenta, Carrito, DetalleCarrito, Producto, Envio, MetodoPago, Sucursal, Usuario } = require('../models');
const { sequelize } = require('../models');
const { validationResult } = require('express-validator');

// Crear venta (desde el carrito)
const createVenta = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await transaction.rollback();
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { id_metodo_pago, id_sucursal, direccion_envio, ciudad_envio, referencia_envio } = req.body;
        
        // Obtener carrito del usuario
        const carrito = await Carrito.findOne({
            where: { id_usuario: req.user.id },
            include: [{
                model: DetalleCarrito,
                include: [{
                    model: Producto
                }]
            }],
            transaction
        });
        
        if (!carrito || !carrito.DetalleCarritos || carrito.DetalleCarritos.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'El carrito está vacío' });
        }
        
        // Calcular total y verificar stock
        let total = 0;
        const detallesVenta = [];
        
        for (const item of carrito.DetalleCarritos) {
            const producto = item.Producto;
            
            if (producto.stock < item.cantidad) {
                await transaction.rollback();
                return res.status(400).json({ 
                    message: `Stock insuficiente para ${producto.nombre}`,
                    producto: producto.nombre,
                    stock: producto.stock,
                    solicitado: item.cantidad
                });
            }
            
            const subtotal = item.cantidad * parseFloat(producto.precio);
            total += subtotal;
            
            detallesVenta.push({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: producto.precio,
                subtotal
            });
            
            // Actualizar stock
            await producto.update({ stock: producto.stock - item.cantidad }, { transaction });
        }
        
        // Crear venta
        const venta = await Venta.create({
            id_usuario: req.user.id,
            id_metodo_pago,
            id_sucursal: id_sucursal || null,
            fecha: new Date(),
            total,
            estado: 'Pendiente'
        }, { transaction });
        
        // Crear detalles de venta
        for (const detalle of detallesVenta) {
            await DetalleVenta.create({
                id_venta: venta.id_venta,
                ...detalle
            }, { transaction });
        }
        
        // Crear envío si se proporcionó dirección
        if (direccion_envio) {
            await Envio.create({
                id_venta: venta.id_venta,
                direccion: direccion_envio,
                ciudad: ciudad_envio || 'Ciudad',
                referencia: referencia_envio || '',
                estado: 'Preparando',
                fecha_envio: null,
                fecha_entrega: null
            }, { transaction });
        }
        
        // Vaciar carrito
        await DetalleCarrito.destroy({
            where: { id_carrito: carrito.id_carrito },
            transaction
        });
        
        await transaction.commit();
        
        // Obtener venta completa con detalles
        const ventaCompleta = await Venta.findByPk(venta.id_venta, {
            include: [
                { model: DetalleVenta, include: [{ model: Producto, attributes: ['nombre', 'imagen_url'] }] },
                { model: MetodoPago, attributes: ['tipo'] },
                { model: Envio },
                { model: Sucursal, attributes: ['nombre', 'direccion'] }
            ]
        });
        
        res.status(201).json({
            success: true,
            message: 'Venta realizada exitosamente',
            venta: ventaCompleta
        });
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        res.status(500).json({ message: 'Error al crear venta' });
    }
};

// Obtener mis ventas (usuario autenticado)
const getMisVentas = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado } = req.query;
        const offset = (page - 1) * limit;
        
        let where = { id_usuario: req.user.id };
        if (estado) {
            where.estado = estado;
        }
        
        const ventas = await Venta.findAndCountAll({
            where,
            include: [
                { 
                    model: DetalleVenta, 
                    include: [{ model: Producto, attributes: ['nombre', 'imagen_url', 'precio'] }],
                    limit: 5
                },
                { model: MetodoPago, attributes: ['tipo'] },
                { model: Envio },
                { model: Sucursal, attributes: ['nombre', 'direccion'] }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['fecha', 'DESC']]
        });
        
        res.json({
            success: true,
            total: ventas.count,
            page: parseInt(page),
            totalPages: Math.ceil(ventas.count / limit),
            ventas: ventas.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener ventas' });
    }
};

// Obtener venta por ID
const getVentaById = async (req, res) => {
    try {
        const venta = await Venta.findByPk(req.params.id, {
            include: [
                { 
                    model: DetalleVenta, 
                    include: [{ model: Producto, attributes: ['nombre', 'imagen_url', 'precio', 'marca'] }]
                },
                { model: Usuario, attributes: ['nombre', 'email', 'telefono', 'direccion'] },
                { model: MetodoPago, attributes: ['tipo', 'descripcion'] },
                { model: Envio },
                { model: Sucursal, attributes: ['nombre', 'direccion', 'telefono'] }
            ]
        });
        
        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        
        // Verificar permisos (solo dueño o admin)
        if (venta.id_usuario !== req.user.id && req.user.rol !== 'Admin') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
        
        res.json({
            success: true,
            venta
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener venta' });
    }
};

// Obtener todas las ventas (Admin)
const getVentasAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, estado, fechaInicio, fechaFin, usuarioId } = req.query;
        const offset = (page - 1) * limit;
        
        let where = {};
        if (estado) where.estado = estado;
        if (usuarioId) where.id_usuario = usuarioId;
        if (fechaInicio && fechaFin) {
            where.fecha = {
                [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
            };
        }
        
        const ventas = await Venta.findAndCountAll({
            where,
            include: [
                { model: Usuario, attributes: ['nombre', 'email'] },
                { model: DetalleVenta, include: [{ model: Producto }] },
                { model: MetodoPago },
                { model: Envio },
                { model: Sucursal }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['fecha', 'DESC']]
        });
        
        // Calcular estadísticas
        const estadisticas = await Venta.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id_venta')), 'totalVentas'],
                [sequelize.fn('SUM', sequelize.col('total')), 'totalIngresos'],
                [sequelize.fn('AVG', sequelize.col('total')), 'promedioVenta']
            ],
            where: {
                fecha: {
                    [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 1))
                }
            }
        });
        
        res.json({
            success: true,
            total: ventas.count,
            page: parseInt(page),
            totalPages: Math.ceil(ventas.count / limit),
            ventas: ventas.rows,
            estadisticas: estadisticas[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener ventas' });
    }
};

// Actualizar estado de venta (Admin)
const updateVentaEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        const estadosValidos = ['Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }
        
        const venta = await Venta.findByPk(id);
        
        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        
        await venta.update({ estado });
        
        // Si la venta se cancela, restaurar stock
        if (estado === 'Cancelado' && venta.estado !== 'Cancelado') {
            const detalles = await DetalleVenta.findAll({ where: { id_venta: id } });
            for (const detalle of detalles) {
                await Producto.increment('stock', { 
                    by: detalle.cantidad, 
                    where: { id_producto: detalle.id_producto } 
                });
            }
        }
        
        // Si la venta se marca como enviada, actualizar envío
        if (estado === 'Enviado') {
            const envio = await Envio.findOne({ where: { id_venta: id } });
            if (envio) {
                await envio.update({ 
                    estado: 'En camino',
                    fecha_envio: new Date()
                });
            }
        }
        
        // Si se entrega, actualizar envío
        if (estado === 'Entregado') {
            const envio = await Envio.findOne({ where: { id_venta: id } });
            if (envio) {
                await envio.update({ 
                    estado: 'Entregado',
                    fecha_entrega: new Date()
                });
            }
        }
        
        res.json({
            success: true,
            message: `Estado de venta actualizado a ${estado}`,
            venta
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar estado' });
    }
};

module.exports = {
    createVenta,
    getMisVentas,
    getVentaById,
    getVentasAdmin,
    updateVentaEstado
};