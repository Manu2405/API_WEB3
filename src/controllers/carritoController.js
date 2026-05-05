const { Carrito, DetalleCarrito, Producto, Usuario } = require('../models');
const { Op } = require('sequelize');

// Obtener carrito del usuario
const getCarrito = async (req, res) => {
    try {
        let carrito = await Carrito.findOne({
            where: { id_usuario: req.user.id },
            include: [{
                model: DetalleCarrito,
                include: [{
                    model: Producto,
                    attributes: ['id_producto', 'nombre', 'precio', 'stock', 'imagen_url', 'marca']
                }]
            }]
        });
        
        // Si no existe carrito, crearlo
        if (!carrito) {
            carrito = await Carrito.create({
                id_usuario: req.user.id,
                fecha_creacion: new Date()
            });
            
            carrito = await Carrito.findOne({
                where: { id_usuario: req.user.id },
                include: [{
                    model: DetalleCarrito,
                    include: [{
                        model: Producto,
                        attributes: ['id_producto', 'nombre', 'precio', 'stock', 'imagen_url', 'marca']
                    }]
                }]
            });
        }
        
        // Calcular totales
        let subtotal = 0;
        const items = carrito.DetalleCarritos?.map(item => {
            const itemTotal = item.cantidad * parseFloat(item.Producto.precio);
            subtotal += itemTotal;
            return {
                ...item.toJSON(),
                subtotal: itemTotal
            };
        }) || [];
        
        const envio = subtotal > 500 ? 0 : 50;
        const total = subtotal + envio;
        
        res.json({
            success: true,
            carrito: {
                id: carrito.id_carrito,
                items,
                subtotal,
                envio,
                total
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener carrito' });
    }
};

// Agregar producto al carrito
const addToCart = async (req, res) => {
    try {
        const { id_producto, cantidad = 1 } = req.body;
        
        // Verificar producto
        const producto = await Producto.findByPk(id_producto);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        if (producto.stock < cantidad) {
            return res.status(400).json({ 
                message: 'Stock insuficiente',
                stock: producto.stock
            });
        }
        
        // Obtener o crear carrito
        let carrito = await Carrito.findOne({
            where: { id_usuario: req.user.id }
        });
        
        if (!carrito) {
            carrito = await Carrito.create({
                id_usuario: req.user.id,
                fecha_creacion: new Date()
            });
        }
        
        // Verificar si el producto ya está en el carrito
        let detalle = await DetalleCarrito.findOne({
            where: {
                id_carrito: carrito.id_carrito,
                id_producto
            }
        });
        
        if (detalle) {
            // Actualizar cantidad
            const nuevaCantidad = detalle.cantidad + cantidad;
            if (producto.stock < nuevaCantidad) {
                return res.status(400).json({ 
                    message: 'Stock insuficiente',
                    stock: producto.stock,
                    currentCart: detalle.cantidad
                });
            }
            await detalle.update({ cantidad: nuevaCantidad });
        } else {
            // Crear nuevo detalle
            detalle = await DetalleCarrito.create({
                id_carrito: carrito.id_carrito,
                id_producto,
                cantidad
            });
        }
        
        res.json({
            success: true,
            message: 'Producto agregado al carrito',
            detalle
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al agregar al carrito' });
    }
};

// Actualizar cantidad en el carrito
const updateCartItem = async (req, res) => {
    try {
        const { id_detalle } = req.params;
        const { cantidad } = req.body;
        
        if (cantidad < 1) {
            return res.status(400).json({ message: 'La cantidad debe ser mayor a 0' });
        }
        
        const detalle = await DetalleCarrito.findByPk(id_detalle, {
            include: [{
                model: Carrito,
                where: { id_usuario: req.user.id }
            }, {
                model: Producto,
                attributes: ['stock']
            }]
        });
        
        if (!detalle) {
            return res.status(404).json({ message: 'Item no encontrado en el carrito' });
        }
        
        if (detalle.Producto.stock < cantidad) {
            return res.status(400).json({ 
                message: 'Stock insuficiente',
                stock: detalle.Producto.stock
            });
        }
        
        await detalle.update({ cantidad });
        
        res.json({
            success: true,
            message: 'Carrito actualizado',
            detalle
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar carrito' });
    }
};

// Eliminar producto del carrito
const removeFromCart = async (req, res) => {
    try {
        const { id_detalle } = req.params;
        
        const detalle = await DetalleCarrito.findByPk(id_detalle, {
            include: [{
                model: Carrito,
                where: { id_usuario: req.user.id }
            }]
        });
        
        if (!detalle) {
            return res.status(404).json({ message: 'Item no encontrado en el carrito' });
        }
        
        await detalle.destroy();
        
        res.json({
            success: true,
            message: 'Producto eliminado del carrito'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar del carrito' });
    }
};

// Vaciar carrito
const clearCart = async (req, res) => {
    try {
        const carrito = await Carrito.findOne({
            where: { id_usuario: req.user.id }
        });
        
        if (carrito) {
            await DetalleCarrito.destroy({
                where: { id_carrito: carrito.id_carrito }
            });
        }
        
        res.json({
            success: true,
            message: 'Carrito vaciado exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al vaciar carrito' });
    }
};

module.exports = {
    getCarrito,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};