const { Sucursal, Venta } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Obtener todas las sucursales
const getSucursales = async (req, res) => {
    try {
        const sucursales = await Sucursal.findAll({
            include: [{
                model: Venta,
                attributes: ['id_venta', 'total', 'estado']
            }],
            order: [['nombre', 'ASC']]
        });
        
        res.json({
            success: true,
            count: sucursales.length,
            sucursales
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener sucursales' });
    }
};

// Obtener sucursal por ID
const getSucursalById = async (req, res) => {
    try {
        const sucursal = await Sucursal.findByPk(req.params.id, {
            include: [{
                model: Venta,
                attributes: ['id_venta', 'fecha', 'total', 'estado'],
                limit: 10,
                order: [['fecha', 'DESC']]
            }]
        });
        
        if (!sucursal) {
            return res.status(404).json({ message: 'Sucursal no encontrada' });
        }
        
        res.json({
            success: true,
            sucursal
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener sucursal' });
    }
};

// Crear sucursal (Admin)
const createSucursal = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nombre, direccion, telefono, latitud, longitud } = req.body;
        
        const sucursal = await Sucursal.create({
            nombre,
            direccion,
            telefono,
            latitud: latitud ? parseFloat(latitud) : null,
            longitud: longitud ? parseFloat(longitud) : null,
            foto_url: req.file ? req.file.path : null
        });
        
        res.status(201).json({
            success: true,
            message: 'Sucursal creada exitosamente',
            sucursal
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear sucursal' });
    }
};

// Actualizar sucursal (Admin)
const updateSucursal = async (req, res) => {
    try {
        const sucursal = await Sucursal.findByPk(req.params.id);
        
        if (!sucursal) {
            return res.status(404).json({ message: 'Sucursal no encontrada' });
        }
        
        const { nombre, direccion, telefono, latitud, longitud } = req.body;
        
        await sucursal.update({
            nombre: nombre || sucursal.nombre,
            direccion: direccion || sucursal.direccion,
            telefono: telefono !== undefined ? telefono : sucursal.telefono,
            latitud: latitud !== undefined ? parseFloat(latitud) : sucursal.latitud,
            longitud: longitud !== undefined ? parseFloat(longitud) : sucursal.longitud,
            foto_url: req.file ? req.file.path : sucursal.foto_url
        });
        
        res.json({
            success: true,
            message: 'Sucursal actualizada exitosamente',
            sucursal
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar sucursal' });
    }
};

// Eliminar sucursal (Admin)
const deleteSucursal = async (req, res) => {
    try {
        const sucursal = await Sucursal.findByPk(req.params.id);
        
        if (!sucursal) {
            return res.status(404).json({ message: 'Sucursal no encontrada' });
        }
        
        // Verificar si tiene ventas asociadas
        const ventasCount = await Venta.count({ where: { id_sucursal: req.params.id } });
        if (ventasCount > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar la sucursal porque tiene ventas asociadas',
                ventasCount
            });
        }
        
        await sucursal.destroy();
        
        res.json({
            success: true,
            message: 'Sucursal eliminada exitosamente'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar sucursal' });
    }
};

// Sucursales cercanas (geolocalización)
const getSucursalesCercanas = async (req, res) => {
    try {
        const { lat, lng, radio = 10 } = req.query; // radio en km
        
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Se requieren latitud y longitud' });
        }
        
        const sucursales = await Sucursal.findAll();
        
        // Filtrar por distancia (cálculo aproximado en km)
        const sucursalesCercanas = sucursales.filter(suc => {
            if (!suc.latitud || !suc.longitud) return false;
            
            const R = 6371; // Radio de la Tierra en km
            const dLat = (suc.latitud - parseFloat(lat)) * Math.PI / 180;
            const dLon = (suc.longitud - parseFloat(lng)) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(parseFloat(lat) * Math.PI / 180) * Math.cos(suc.latitud * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distancia = R * c;
            
            suc.distancia = Math.round(distancia * 100) / 100;
            return distancia <= parseFloat(radio);
        });
        
        res.json({
            success: true,
            sucursales: sucursalesCercanas.sort((a, b) => a.distancia - b.distancia)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener sucursales cercanas' });
    }
};

module.exports = {
    getSucursales,
    getSucursalById,
    createSucursal,
    updateSucursal,
    deleteSucursal,
    getSucursalesCercanas
};