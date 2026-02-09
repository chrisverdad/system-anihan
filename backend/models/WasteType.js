import { pool, formatRow, formatRows } from '../config/database.js';

const WasteType = {
  // Find all waste types
  find: async (conditions = {}) => {
    let query = 'SELECT * FROM waste_types WHERE 1=1';
    const params = [];

    if (conditions.category) {
      query += ' AND category = ?';
      params.push(conditions.category);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, params);
    return formatRows(rows);
  },

  // Find waste type by ID
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM waste_types WHERE id = ?', [id]);
    return formatRow(rows[0]);
  },

  // Create waste type
  create: async (wasteTypeData) => {
    const [result] = await pool.execute(`
      INSERT INTO waste_types (
        name, description, image_url, category, damage_level
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      wasteTypeData.name,
      wasteTypeData.description,
      wasteTypeData.image_url,
      wasteTypeData.category,
      wasteTypeData.damage_level
    ]);

    return WasteType.findById(result.insertId);
  },

  // Update waste type
  findByIdAndUpdate: async (id, updates) => {
    const allowedFields = ['name', 'description', 'image_url', 'category', 'damage_level'];
    const setParts = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setParts.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setParts.length === 0) {
      return WasteType.findById(id);
    }

    values.push(id);
    const query = `UPDATE waste_types SET ${setParts.join(', ')} WHERE id = ?`;
    await pool.execute(query, values);

    return WasteType.findById(id);
  },

  // Delete waste type
  findByIdAndDelete: async (id) => {
    await pool.execute('DELETE FROM waste_types WHERE id = ?', [id]);
    return { success: true };
  },

  // Delete many (for seeding)
  deleteMany: async (conditions = {}) => {
    if (Object.keys(conditions).length === 0) {
      await pool.execute('DELETE FROM waste_types');
      return { changes: 0 };
    }
    return { changes: 0 };
  }
};

export default WasteType;
