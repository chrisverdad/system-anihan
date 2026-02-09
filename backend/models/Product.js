import { pool, formatRow, formatRows } from '../config/database.js';

const Product = {
  // Find all products
  find: async (conditions = {}) => {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (conditions.is_available !== undefined) {
      query += ' AND is_available = ?';
      params.push(conditions.is_available ? 1 : 0);
    }
    if (conditions.category) {
      query += ' AND category = ?';
      params.push(conditions.category);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, params);
    return formatRows(rows);
  },

  // Find product by ID
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    return formatRow(rows[0]);
  },

  // Create product
  create: async (productData) => {
    const isAvailable = productData.stock_quantity > 0 
      ? (productData.is_available !== false) 
      : false;

    const [result] = await pool.execute(`
      INSERT INTO products (
        name, description, price, category, image_url,
        stock_quantity, unit, is_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      productData.name,
      productData.description,
      productData.price,
      productData.category,
      productData.image_url || '',
      productData.stock_quantity || 0,
      productData.unit,
      isAvailable ? 1 : 0
    ]);

    return Product.findById(result.insertId);
  },

  // Update product
  findByIdAndUpdate: async (id, updates) => {
    const allowedFields = [
      'name', 'description', 'price', 'category', 'image_url',
      'stock_quantity', 'unit', 'is_available'
    ];

    const setParts = [];
    const values = [];

    // Auto out-of-stock logic
    if (updates.stock_quantity !== undefined && updates.stock_quantity === 0) {
      updates.is_available = false;
    }

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'is_available') {
          setParts.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          setParts.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (setParts.length === 0) {
      return Product.findById(id);
    }

    values.push(id);
    const query = `UPDATE products SET ${setParts.join(', ')} WHERE id = ?`;
    await pool.execute(query, values);

    return Product.findById(id);
  },

  // Delete product
  findByIdAndDelete: async (id) => {
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    return { success: true };
  },

  // Delete many (for seeding)
  deleteMany: async (conditions = {}) => {
    if (Object.keys(conditions).length === 0) {
      await pool.execute('DELETE FROM products');
      return { changes: 0 };
    }
    return { changes: 0 };
  }
};

export default Product;
