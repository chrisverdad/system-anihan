import { pool, formatRow, formatRows } from '../config/database.js';

const User = {
  // Find user by email
  findByEmail: async (email) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return formatRow(rows[0]);
  },

  // Find user by ID
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return formatRow(rows[0]);
  },

  // Find all users
  find: async (conditions = {}) => {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (conditions.role) {
      query += ' AND role = ?';
      params.push(conditions.role);
    }
    if (conditions.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(conditions.is_active ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(query, params);
    return formatRows(rows);
  },

  // Create user
  create: async (userData) => {
    const [result] = await pool.execute(`
      INSERT INTO users (
        email, password, full_name, role, phone, address, profile_photo,
        is_active, vendor_status, business_name, business_type,
        business_license, years_in_business, approval_notes, approved_by, approved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userData.email,
      userData.password,
      userData.full_name,
      userData.role,
      userData.phone || '',
      userData.address || '',
      userData.profile_photo || '',
      userData.is_active !== undefined ? (userData.is_active ? 1 : 0) : 1,
      userData.vendor_status || null,
      userData.business_name || '',
      userData.business_type || '',
      userData.business_license || '',
      userData.years_in_business || '',
      userData.approval_notes || '',
      userData.approved_by || '',
      userData.approved_at || null
    ]);

    return User.findById(result.insertId);
  },

  // Update user
  findByIdAndUpdate: async (id, updates) => {
    const allowedFields = [
      'email', 'password', 'full_name', 'role', 'phone', 'address',
      'profile_photo', 'is_active', 'vendor_status', 'business_name',
      'business_type', 'business_license', 'years_in_business',
      'approval_notes', 'approved_by', 'approved_at'
    ];

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
      return User.findById(id);
    }

    values.push(id);
    const query = `UPDATE users SET ${setParts.join(', ')} WHERE id = ?`;
    await pool.execute(query, values);

    return User.findById(id);
  },

  // Delete user
  findByIdAndDelete: async (id) => {
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return { success: true };
  },

  // Delete many (for seeding)
  deleteMany: async (conditions = {}) => {
    if (Object.keys(conditions).length === 0) {
      await pool.execute('DELETE FROM users');
      return { changes: 0 };
    }
    return { changes: 0 };
  }
};

export default User;
