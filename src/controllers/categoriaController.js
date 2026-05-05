const { Categoria, Producto } = require('../models');
const { validationResult } = require('express-validator');

// Obtener todas las categorías
const getCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.findAll({
            include: [{
                model: Producto,
                attributes: ['id_producto', 'nombre']
            }],
            order: [['nombre', 'ASC']]
        });
        
        res.json({
            success: true,
            count: categorias.length,
            categorias
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener categorías' });
    }
};

// Obtener categoría por ID
const getCategoriaById = async (req, res) => {
    try {
        const categoria = await Categoria.findByPk(req.params.id, {
            include: [{
                model: Producto,
                attributes: ['id_producto', 'nombre', 'precio', 'stock']
            }]
        });
        
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        res.json({
            success: true,
            categoria
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener categoría' });
    }
};

// Crear categoría (Admin)
const createCategoria = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nombre, descripcion } = req.body;
        
        // Verificar si ya existe
        const existe = await Categoria.findOne({ where: { nombre } });
        if (existe) {
            return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
        }
        
        const categoria = await Categoria.create({
            nombre,
            descripcion
        });
        
        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            categoria
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear categoría' });
    }
};

// Actualizar categoría (Admin)
const updateCategoria = async (req, res) => {
    try {
        const categoria = await Categoria.findByPk(req.params.id);
        
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        const { nombre, descripcion } = req.body;
        
        // Verificar si el nuevo nombre ya existe (si se cambia)
        if (nombre && nombre !== categoria.nombre) {
            const existe = await Categoria.findOne({ where: { nombre } });
            if (existe) {
                return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
            }
        }
        
        await categoria.update({
            nombre: nombre || categoria.nombre,
            descripcion: descripcion !== undefined ? descripcion : categoria.descripcion
        });
        
        res.json({
            success: true,
            message: 'Categoría actualizada exitosamente',
            categoria
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar categoría' });
    }
};

// Eliminar categoría (Admin)
const deleteCategoria = async (req, res) => {
    try {
        const categoria = await Categoria.findByPk(req.params.id);
        
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // Verificar si tiene productos asociados
        const productosCount = await Producto.count({ where: { id_categoria: req.params.id } });
        if (productosCount > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar la categoría porque tiene productos asociados',
                productosCount
            });
        }
        
        await categoria.destroy();
        
        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar categoría' });
    }
};

module.exports = {
    getCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria
};