import { pool, formatRow, formatRows } from '../config/database.js';

const Delivery = {
  // Find all deliveries
  find: async (conditions = {}) => {
    let query = 'SELECT * FROM deliveries WHERE 1=1';
    const params = [];

    if (conditions.order_id) {
      query += ' AND order_id = ?';
      params.push(conditions.order_id);
    }
    if (conditions.status) {
      query += ' AND status = ?';
      params.push(conditions.status);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, params);
    return formatRows(rows);
  },

  // Find delivery by ID
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM deliveries WHERE id = ?', [id]);
    return formatRow(rows[0]);
  },

  // Create delivery
  create: async (deliveryData) => {
    const [result] = await pool.execute(`
      INSERT INTO deliveries (
        order_id, delivery_person, delivery_vehicle, pickup_time,
        delivery_time, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      deliveryData.order_id,
      deliveryData.delivery_person || '',
      deliveryData.delivery_vehicle || '',
      deliveryData.pickup_time || null,
      deliveryData.delivery_time || null,
      deliveryData.status || 'pending',
      deliveryData.notes || ''
    ]);

    return Delivery.findById(result.insertId);
  },

  // Update delivery
  findByIdAndUpdate: async (id, updates) => {
    const allowedFields = [
      'delivery_person', 'delivery_vehicle', 'pickup_time',
      'delivery_time', 'status', 'notes'
    ];
    const setParts = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setParts.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setParts.length === 0) {
      return Delivery.findById(id);
    }

    values.push(id);
    const query = `UPDATE deliveries SET ${setParts.join(', ')} WHERE id = ?`;
    await pool.execute(query, values);

    return Delivery.findById(id);
  },

  // Delete delivery
  findByIdAndDelete: async (id) => {
    await pool.execute('DELETE FROM deliveries WHERE id = ?', [id]);
    return { success: true };
  },

  // Delete many (for seeding)
  deleteMany: async (conditions = {}) => {
    if (Object.keys(conditions).length === 0) {
      await pool.execute('DELETE FROM deliveries');
      return { changes: 0 };
    }
    return { changes: 0 };
  }
};

export default Delivery;
