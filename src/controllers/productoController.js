const { Producto, Categoria } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los productos con paginación y filtros
const getProductos = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, categoria, minPrice, maxPrice } = req.query;
        const offset = (page - 1) * limit;
        
        let where = {};
        
        if (search) {
            where.nombre = { [Op.like]: `%${search}%` };
        }
        
        if (categoria) {
            where.id_categoria = categoria;
        }
        
        if (minPrice || maxPrice) {
            where.precio = {};
            if (minPrice) where.precio[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.precio[Op.lte] = parseFloat(maxPrice);
        }

        const productos = await Producto.findAndCountAll({
            where,
            include: [{ model: Categoria, attributes: ['nombre'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            total: productos.count,
            page: parseInt(page),
            totalPages: Math.ceil(productos.count / limit),
            productos: productos.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
};

// Obtener producto por ID
const getProductoById = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id, {
            include: [{ model: Categoria, attributes: ['nombre', 'descripcion'] }]
        });
        
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        res.json(producto);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener producto' });
    }
};

// Crear producto (Admin)
const createProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, marca, id_categoria } = req.body;
        
        const producto = await Producto.create({
            nombre,
            descripcion,
            precio,
            stock,
            marca,
            id_categoria,
            imagen_url: req.file ? req.file.path : null
        });
        
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            producto
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear producto' });
    }
};

// Actualizar producto (Admin)
const updateProducto = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        const { nombre, descripcion, precio, stock, marca, id_categoria } = req.body;
        
        await producto.update({
            nombre,
            descripcion,
            precio,
            stock,
            marca,
            id_categoria,
            imagen_url: req.file ? req.file.path : producto.imagen_url
        });
        
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            producto
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar producto' });
    }
};

// Eliminar producto (Admin)
const deleteProducto = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        await producto.destroy();
        
        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar producto' });
    }
};

module.exports = {
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto
};