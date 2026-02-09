import { pool, formatRow, formatRows } from '../config/database.js';

const WasteCategory = {
  // Find all waste categories
  find: async (conditions = {}) => {
    let query = 'SELECT * FROM waste_categories WHERE 1=1';
    const params = [];

    if (conditions.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(conditions.is_active ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, params);
    return formatRows(rows);
  },

  // Find waste category by ID
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM waste_categories WHERE id = ?', [id]);
    return formatRow(rows[0]);
  },

  // Create waste category
  create: async (categoryData) => {
    const [result] = await pool.execute(`
      INSERT INTO waste_categories (
        name, description, color, icon, is_active
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      categoryData.name,
      categoryData.description,
      categoryData.color,
      categoryData.icon,
      categoryData.is_active !== undefined ? (categoryData.is_active ? 1 : 0) : 1
    ]);

    return WasteCategory.findById(result.insertId);
  },

  // Update waste category
  findByIdAndUpdate: async (id, updates) => {
    const allowedFields = ['name', 'description', 'color', 'icon', 'is_active'];
    const setParts = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'is_active') {
          setParts.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          setParts.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (setParts.length === 0) {
      return WasteCategory.findById(id);
    }

    values.push(id);
    const query = `UPDATE waste_categories SET ${setParts.join(', ')} WHERE id = ?`;
    await pool.execute(query, values);

    return WasteCategory.findById(id);
  },

  // Delete waste category
  findByIdAndDelete: async (id) => {
    await pool.execute('DELETE FROM waste_categories WHERE id = ?', [id]);
    return { success: true };
  },

  // Delete many (for seeding)
  deleteMany: async (conditions = {}) => {
    if (Object.keys(conditions).length === 0) {
      await pool.execute('DELETE FROM waste_categories');
      return { changes: 0 };
    }
    return { changes: 0 };
  }
};

export default WasteCategory;
