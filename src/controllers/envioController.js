const { Envio, Venta } = require('../models');
const { validationResult } = require('express-validator');

// Obtener envío por venta
const getEnvioByVenta = async (req, res) => {
    try {
        const { id_venta } = req.params;
        
        // Verificar propiedad de la venta
        const venta = await Venta.findByPk(id_venta);
        if (!venta) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }
        
        if (venta.id_usuario !== req.user.id && req.user.rol !== 'Admin') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
        
        const envio = await Envio.findOne({
            where: { id_venta },
            include: [{ model: Venta, attributes: ['total', 'fecha', 'estado'] }]
        });
        
        if (!envio) {
            return res.status(404).json({ message: 'Envío no encontrado para esta venta' });
        }
        
        res.json({
            success: true,
            envio
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener envío' });
    }
};

// Actualizar estado de envío (Admin)
const updateEnvioEstado = async (req, res) => {
    try {
        const { id_envio } = req.params;
        const { estado, tracking_number } = req.body;
        
        const estadosValidos = ['Preparando', 'En camino', 'Entregado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }
        
        const envio = await Envio.findByPk(id_envio);
        
        if (!envio) {
            return res.status(404).json({ message: 'Envío no encontrado' });
        }
        
        const updateData = { estado };
        if (tracking_number) updateData.tracking_number = tracking_number;
        
        if (estado === 'En camino' && !envio.fecha_envio) {
            updateData.fecha_envio = new Date();
        }
        
        if (estado === 'Entregado' && !envio.fecha_entrega) {
            updateData.fecha_entrega = new Date();
            
            // Actualizar estado de la venta
            await Venta.update({ estado: 'Entregado' }, { where: { id_venta: envio.id_venta } });
        }
        
        await envio.update(updateData);
        
        res.json({
            success: true,
            message: 'Estado de envío actualizado',
            envio
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar envío' });
    }
};

// Seguimiento de envío (público con número de seguimiento)
const trackingEnvio = async (req, res) => {
    try {
        const { tracking } = req.params;
        
        const envio = await Envio.findOne({
            where: { tracking_number: tracking },
            include: [{ model: Venta, include: [{ model: Usuario, attributes: ['nombre', 'email'] }] }]
        });
        
        if (!envio) {
            return res.status(404).json({ message: 'Número de seguimiento no encontrado' });
        }
        
        // Calcular tiempo estimado
        let tiempoEstimado = null;
        if (envio.estado === 'Preparando') {
            tiempoEstimado = 'El pedido está siendo preparado';
        } else if (envio.estado === 'En camino') {
            if (envio.fecha_envio) {
                const diasTranscurridos = Math.floor((new Date() - new Date(envio.fecha_envio)) / (1000 * 60 * 60 * 24));
                if (diasTranscurridos < 3) {
                    tiempoEstimado = 'Entrega estimada en 1-3 días';
                } else {
                    tiempoEstimado = 'Entrega estimada en breve';
                }
            }
        } else if (envio.estado === 'Entregado') {
            tiempoEstimado = 'Entregado exitosamente';
        }
        
        res.json({
            success: true,
            tracking: {
                numero: envio.tracking_number,
                estado: envio.estado,
                direccion: envio.direccion,
                ciudad: envio.ciudad,
                fecha_envio: envio.fecha_envio,
                fecha_entrega: envio.fecha_entrega,
                tiempo_estimado: tiempoEstimado
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener seguimiento' });
    }
};

module.exports = {
    getEnvioByVenta,
    updateEnvioEstado,
    trackingEnvio
};