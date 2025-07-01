const pool = require('../utils/database');

// Obtener todas las notificaciones de un usuario
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, user_id, message, type, read, created_at 
      FROM notifications 
      WHERE user_id = $1
    `;
    
    const queryParams = [userId];
    
    if (unreadOnly === 'true') {
      query += ' AND read = false';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    queryParams.push(limit, offset);
    
    const result = await pool.query(query, queryParams);
    
    // Obtener el total de notificaciones para paginación
    let countQuery = 'SELECT COUNT(*) FROM notifications WHERE user_id = $1';
    const countParams = [userId];
    
    if (unreadOnly === 'true') {
      countQuery += ' AND read = false';
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      notifications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

// Crear una nueva notificación
const createNotification = async (req, res) => {
  try {
    const { user_id, message, type = 'general' } = req.body;
    
    if (!user_id || !message) {
      return res.status(400).json({ 
        error: 'user_id y message son requeridos' 
      });
    }
    
    const query = `
      INSERT INTO notifications (user_id, message, type) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    
    const result = await pool.query(query, [user_id, message, type]);
    
    res.status(201).json({
      message: 'Notificación creada exitosamente',
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error al crear notificación' });
  }
};

// Marcar notificación como leída
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE notifications 
      SET read = true 
      WHERE id = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    res.json({
      message: 'Notificación marcada como leída',
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída' });
  }
};

// Marcar todas las notificaciones de un usuario como leídas
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      UPDATE notifications 
      SET read = true 
      WHERE user_id = $1 AND read = false
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      message: 'Todas las notificaciones marcadas como leídas',
      updatedCount: result.rowCount
    });
  } catch (error) {
    console.error('Error al marcar notificaciones como leídas:', error);
    res.status(500).json({ error: 'Error al marcar notificaciones como leídas' });
  }
};

// Eliminar una notificación
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM notifications WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    res.json({
      message: 'Notificación eliminada exitosamente',
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
};

// Obtener estadísticas de notificaciones
const getNotificationStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read = false THEN 1 END) as unread,
        COUNT(CASE WHEN read = true THEN 1 END) as read
      FROM notifications 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

module.exports = {
  getUserNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats
}; 