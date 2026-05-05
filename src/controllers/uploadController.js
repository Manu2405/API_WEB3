const cloudinary = require('../config/cloudinary');
const { Usuario } = require('../models');

// Subir foto de perfil
const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ninguna imagen' });
        }
        
        const usuario = await Usuario.findByPk(req.user.id);
        
        // Actualizar foto_url en la base de datos
        await usuario.update({ foto_url: req.file.path });
        
        res.json({
            success: true,
            message: 'Foto de perfil actualizada',
            foto_url: req.file.path
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al subir imagen' });
    }
};

// Subir foto de producto (Admin)
const uploadProductPhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ninguna imagen' });
        }
        
        res.json({
            success: true,
            message: 'Imagen subida exitosamente',
            image_url: req.file.path
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al subir imagen' });
    }
};

module.exports = { uploadProfilePhoto, uploadProductPhoto };