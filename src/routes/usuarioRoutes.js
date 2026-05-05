const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { getUsuarios, getUsuarioById, updateUsuario, deleteUsuario } = require('../controllers/usuarioController');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', protect, admin, getUsuarios);
router.get('/:id', protect, getUsuarioById);
router.put('/:id', protect, upload.single('foto'), updateUsuario);
router.delete('/:id', protect, admin, deleteUsuario);

module.exports = router;