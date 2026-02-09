import { pool, formatRow, formatRows } from '../config/database.js';
import User from './User.js';
import SourceWasteSubmission from './SourceWasteSubmission.js';

const InventoryItem = {
  // Find all inventory items with populated relations
  find: async (conditions = {}) => {
    let query = `
      SELECT ii.*,
             u.full_name as vendor_full_name, u.email as vendor_email,
             u.phone as vendor_phone, u.address as vendor_address
      FROM inventory_items ii
      LEFT JOIN users u ON ii.vendor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (conditions.vendor_id) {
      query += ' AND ii.vendor_id = ?';
      params.push(conditions.vendor_id);
    }
    if (conditions.is_available !== undefined) {
      query += ' AND ii.is_available = ?';
      params.push(conditions.is_available ? 1 : 0);
    }

    query += ' ORDER BY ii.created_at DESC';
    const [rows] = await pool.execute(query, params);

    const items = [];
    for (const row of rows) {
      const item = formatRow({
        id: row.id,
        vendor_id: row.vendor_id,
        product_name: row.product_name,
        description: row.description,
        category: row.category,
        quantity: row.quantity,
        unit: row.unit,
        price_per_unit: row.price_per_unit,
        total_value: row.total_value,
        source_waste_submission_id: row.source_waste_submission_id,
        image_url: row.image_url,
        is_available: row.is_available,
        quantity_history: row.quantity_history,
        created_at: row.created_at,
        updated_at: row.updated_at
      });

      // Populate vendor
      item.vendor_id = {
        id: row.vendor_id,
        full_name: row.vendor_full_name,
        email: row.vendor_email,
        phone: row.vendor_phone,
        address: row.vendor_address
      };

      // Populate source waste submission if exists
      if (row.source_waste_submission_id) {
        item.source_waste_submission_id = await SourceWasteSubmission.findById(row.source_waste_submission_id);
      }

      items.push(item);
    }

    return items;
  },

  // Find inventory item by ID
  findById: async (id) => {
    const [rows] = await pool.execute(`
      SELECT ii.*,
             u.full_name as vendor_full_name, u.email as vendor_email,
             u.phone as vendor_phone, u.address as vendor_address
      FROM inventory_items ii
      LEFT JOIN users u ON ii.vendor_id = u.id
      WHERE ii.id = ?
    `, [id]);

    if (rows.length === 0) return null;
    const row = rows[0];

    const item = formatRow({
      id: row.id,
      vendor_id: row.vendor_id,
      product_name: row.product_name,
      description: row.description,
      category: row.category,
      quantity: row.quantity,
      unit: row.unit,
      price_per_unit: row.price_per_unit,
      total_value: row.total_value,
      source_waste_submission_id: row.source_waste_submission_id,
      image_url: row.image_url,
      is_available: row.is_available,
      quantity_history: row.quantity_history,
      created_at: row.created_at,
      updated_at: row.updated_at
    });

    // Populate vendor
    item.vendor_id = {
      id: row.vendor_id,
      full_name: row.vendor_full_name,
      email: row.vendor_email,
      phone: row.vendor_phone,
      address: row.vendor_address
    };

    // Populate source waste submission if exists
    if (row.source_waste_submission_id) {
      item.source_waste_submission_id = await SourceWasteSubmission.findById(row.source_waste_submission_id);
    }

    return item;
  },

  // Create inventory item
  create: async (itemData) => {
    const quantityHistory = itemData.quantity_history 
      ? JSON.stringify(itemData.quantity_history) 
      : null;

    const bind = (v, def) => (v === undefined ? def : v);
    const [result] = await pool.execute(`
      INSERT INTO inventory_items (
        vendor_id, product_name, description, category, quantity, unit,
        price_per_unit, total_value, source_waste_submission_id,
        image_url, is_available, quantity_history
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bind(itemData.vendor_id, null),
      bind(itemData.product_name, ''),
      bind(itemData.description, ''),
      bind(itemData.category, 'other'),
      Number(itemData.quantity) || 0,
      bind(itemData.unit, 'kg'),
      Number(itemData.price_per_unit) || 0,
      Number(itemData.total_value) || 0,
      itemData.source_waste_submission_id ?? null,
      itemData.image_url ?? '',
      itemData.is_available !== undefined && itemData.is_available !== false ? 1 : 0,
      quantityHistory
    ]);

    return InventoryItem.findById(result.insertId);
  },

  // Update inventory item
  findByIdAndUpdate: async (id, updates) => {
    const allowedFields = [
      'product_name', 'description', 'category', 'quantity', 'unit',
      'price_per_unit', 'total_value', 'source_waste_submission_id',
      'image_url', 'is_available', 'quantity_history'
    ];
    const setParts = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'is_available') {
          setParts.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else if (key === 'quantity_history') {
          setParts.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          setParts.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (setParts.length === 0) {
      return InventoryItem.findById(id);
    }

    values.push(id);
    const query = `UPDATE inventory_items SET ${setParts.join(', ')} WHERE id = ?`;
    await pool.execute(query, values);

    return InventoryItem.findById(id);
  },

  // Delete inventory item
  findByIdAndDelete: async (id) => {
    await pool.execute('DELETE FROM inventory_items WHERE id = ?', [id]);
    return { success: true };
  },

  // Delete many (for seeding)
  deleteMany: async (conditions = {}) => {
    if (Object.keys(conditions).length === 0) {
      await pool.execute('DELETE FROM inventory_items');
      return { changes: 0 };
    }
    return { changes: 0 };
  }
};

export default InventoryItem;
