const { MetodoPago, Venta } = require('../models');
const { validationResult } = require('express-validator');

// Obtener todos los métodos de pago
const getMetodosPago = async (req, res) => {
    try {
        const metodos = await MetodoPago.findAll({
            order: [['tipo', 'ASC']]
        });
        
        res.json({
            success: true,
            count: metodos.length,
            metodos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener métodos de pago' });
    }
};

// Obtener método de pago por ID
const getMetodoPagoById = async (req, res) => {
    try {
        const metodo = await MetodoPago.findByPk(req.params.id);
        
        if (!metodo) {
            return res.status(404).json({ message: 'Método de pago no encontrado' });
        }
        
        res.json({
            success: true,
            metodo
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener método de pago' });
    }
};

// Crear método de pago (Admin)
const createMetodoPago = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { tipo, descripcion } = req.body;
        
        const tiposValidos = ['Tarjeta', 'Efectivo', 'Transferencia', 'PayPal'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({ message: 'Tipo de pago inválido' });
        }
        
        // Verificar si ya existe
        const existe = await MetodoPago.findOne({ where: { tipo } });
        if (existe) {
            return res.status(400).json({ message: 'Ya existe un método de pago con ese tipo' });
        }
        
        const metodo = await MetodoPago.create({
            tipo,
            descripcion
        });
        
        res.status(201).json({
            success: true,
            message: 'Método de pago creado exitosamente',
            metodo
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear método de pago' });
    }
};

// Actualizar método de pago (Admin)
const updateMetodoPago = async (req, res) => {
    try {
        const metodo = await MetodoPago.findByPk(req.params.id);
        
        if (!metodo) {
            return res.status(404).json({ message: 'Método de pago no encontrado' });
        }
        
        const { tipo, descripcion } = req.body;
        
        if (tipo && tipo !== metodo.tipo) {
            const tiposValidos = ['Tarjeta', 'Efectivo', 'Transferencia', 'PayPal'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({ message: 'Tipo de pago inválido' });
            }
            
            const existe = await MetodoPago.findOne({ where: { tipo } });
            if (existe) {
                return res.status(400).json({ message: 'Ya existe un método de pago con ese tipo' });
            }
        }
        
        await metodo.update({
            tipo: tipo || metodo.tipo,
            descripcion: descripcion !== undefined ? descripcion : metodo.descripcion
        });
        
        res.json({
            success: true,
            message: 'Método de pago actualizado exitosamente',
            metodo
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar método de pago' });
    }
};

// Eliminar método de pago (Admin)
const deleteMetodoPago = async (req, res) => {
    try {
        const metodo = await MetodoPago.findByPk(req.params.id);
        
        if (!metodo) {
            return res.status(404).json({ message: 'Método de pago no encontrado' });
        }
        
        // Verificar si tiene ventas asociadas
        const ventasCount = await Venta.count({ where: { id_metodo_pago: req.params.id } });
        if (ventasCount > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar el método de pago porque tiene ventas asociadas',
                ventasCount
            });
        }
        
        await metodo.destroy();
        
        res.json({
            success: true,
            message: 'Método de pago eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar método de pago' });
    }
};

// Inicializar métodos de pago por defecto
const initMetodosPago = async (req, res) => {
    try {
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
        
        const metodos = await MetodoPago.findAll();
        
        res.json({
            success: true,
            message: 'Métodos de pago inicializados',
            metodos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al inicializar métodos de pago' });
    }
};

module.exports = {
    getMetodosPago,
    getMetodoPagoById,
    createMetodoPago,
    updateMetodoPago,
    deleteMetodoPago,
    initMetodosPago
};