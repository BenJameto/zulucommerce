const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const notificationController = require('../controllers/notification.controller');

// Middleware de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Obtener notificaciones de un usuario
router.get('/user/:userId', [
  param('userId').isInt().withMessage('userId debe ser un número entero'),
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un número mayor a 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
  query('unreadOnly').optional().isBoolean().withMessage('unreadOnly debe ser true o false')
], validateRequest, notificationController.getUserNotifications);

// Crear nueva notificación
router.post('/', [
  body('user_id').isInt().withMessage('user_id debe ser un número entero'),
  body('message').notEmpty().withMessage('message es requerido'),
  body('type').optional().isString().withMessage('type debe ser una cadena de texto')
], validateRequest, notificationController.createNotification);

// Marcar notificación como leída
router.patch('/:id/read', [
  param('id').isInt().withMessage('id debe ser un número entero')
], validateRequest, notificationController.markAsRead);

// Marcar todas las notificaciones de un usuario como leídas
router.patch('/user/:userId/read-all', [
  param('userId').isInt().withMessage('userId debe ser un número entero')
], validateRequest, notificationController.markAllAsRead);

// Eliminar notificación
router.delete('/:id', [
  param('id').isInt().withMessage('id debe ser un número entero')
], validateRequest, notificationController.deleteNotification);

// Obtener estadísticas de notificaciones
router.get('/user/:userId/stats', [
  param('userId').isInt().withMessage('userId debe ser un número entero')
], validateRequest, notificationController.getNotificationStats);

module.exports = router; 