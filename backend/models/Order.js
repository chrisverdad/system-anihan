import { pool, formatRow, formatRows } from '../config/database.js';
import User from './User.js';
import Product from './Product.js';

const Order = {
  // Find all orders with populated relations
  find: async (conditions = {}) => {
    let query = `
      SELECT o.*,
             u.full_name as user_full_name, u.email as user_email,
             u.phone as user_phone, u.address as user_address
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (conditions.user_id) {
      query += ' AND o.user_id = ?';
      params.push(conditions.user_id);
    }
    if (conditions.status) {
      query += ' AND o.status = ?';
      params.push(conditions.status);
    }

    query += ' ORDER BY o.created_at DESC';
    const [rows] = await pool.execute(query, params);

    // Format and populate
    const orders = [];
    for (const row of rows) {
      const order = formatRow({
        id: row.id,
        user_id: row.user_id,
        product_id: row.product_id,
        quantity: row.quantity,
        total_price: row.total_price,
        status: row.status,
        payment_status: row.payment_status,
        payment_method: row.payment_method,
        payment_reference: row.payment_reference,
        delivery_status: row.delivery_status,
        delivery_address: row.delivery_address,
        delivery_notes: row.delivery_notes,
        order_date: row.order_date,
        delivery_date: row.delivery_date,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at
      });

      // Populate user
      order.user_id = {
        id: row.user_id,
        full_name: row.user_full_name,
        email: row.user_email,
        phone: row.user_phone,
        address: row.user_address
      };

      // Populate product
      order.product_id = await Product.findById(row.product_id);
      orders.push(order);
    }

    return orders;
  },

  // Find order by ID with populated relations
  findById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT o.*,
             u.full_name as user_full_name, u.email as user_email,
             u.phone as user_phone, u.address as user_address
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (rows.length === 0) return null;
    const row = rows[0];

    const order = formatRow({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      quantity: row.quantity,
      total_price: row.total_price,
      status: row.status,
      payment_status: row.payment_status,
      payment_method: row.payment_method,
      payment_reference: row.payment_reference,
      delivery_status: row.delivery_status,
      delivery_address: row.delivery_address,
      delivery_notes: row.delivery_notes,
      order_date: row.order_date,
      delivery_date: row.delivery_date,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at
    });

    // Populate user
    order.user_id = {
      id: row.user_id,
      full_name: row.user_full_name,
      email: row.user_email,
      phone: row.user_phone,
      address: row.user_address
    };

    // Populate product
    order.product_id = await Product.findById(row.product_id);

    return order;
  },

  // Create order
  create: async (orderData) => {
    const [result] = await pool.execute(`
      INSERT INTO orders (
        user_id, product_id, quantity, total_price, payment_method,
        payment_reference, delivery_address, delivery_notes, order_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderData.user_id,
      orderData.product_id,
      orderData.quantity,
      orderData.total_price,
      orderData.payment_method,
      orderData.payment_reference || '',
      orderData.delivery_address,
      orderData.delivery_notes || '',
      orderData.order_date || new Date().toISOString()
    ]);

    return Order.findById(result.insertId);
  },

  // Update order
  findByIdAndUpdate: async (id, updates) => {
    const allowedFields = [
      'status', 'payment_status', 'payment_method', 'payment_reference',
      'delivery_status', 'delivery_address', 'delivery_notes',
      'delivery_date', 'notes'
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
      return Order.findById(id);
    }

    values.push(id);
    const query = `UPDATE orders SET ${setParts.join(', ')} WHERE id = ?`;
    await pool.execute(query, values);

    return Order.findById(id);
  },

  // Delete order
  findByIdAndDelete: async (id) => {
    await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    return { success: true };
  },

  // Delete many (for seeding)
  deleteMany: async (conditions = {}) => {
    if (Object.keys(conditions).length === 0) {
      await pool.execute('DELETE FROM orders');
      return { changes: 0 };
    }
    return { changes: 0 };
  }
};

export default Order;
