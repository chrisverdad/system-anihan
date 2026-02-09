import express from 'express';
import WasteType from '../models/WasteType.js';
import WasteCategory from '../models/WasteCategory.js';
import WasteSubmission from '../models/WasteSubmission.js';
import SourceWasteSubmission from '../models/SourceWasteSubmission.js';
import InventoryItem from '../models/InventoryItem.js';
import { uploadWaste, uploadInventory, getFileUrl, deleteFile } from '../utils/fileUpload.js';

const router = express.Router();

// Waste Types
router.get('/types', async (req, res) => {
  try {
    const wasteTypes = await WasteType.find({});
    res.json({ success: true, data: wasteTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/types', async (req, res) => {
  try {
    const wasteType = await WasteType.create(req.body);
    res.status(201).json({ success: true, data: wasteType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Waste Categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await WasteCategory.find({});
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const category = await WasteCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const category = await WasteCategory.findByIdAndUpdate(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await WasteCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Waste Submissions
router.get('/submissions', async (req, res) => {
  try {
    const submissions = await WasteSubmission.find({});
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/submissions', async (req, res) => {
  try {
    const submission = await WasteSubmission.create(req.body);
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/submissions/:id', async (req, res) => {
  try {
    const submission = await WasteSubmission.findByIdAndUpdate(req.params.id, req.body);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/submissions/:id', async (req, res) => {
  try {
    await WasteSubmission.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Source Waste Submissions
router.get('/source-submissions', async (req, res) => {
  try {
    const submissions = await SourceWasteSubmission.find({});
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/source-submissions', uploadWaste.single('image'), async (req, res) => {
  try {
    const body = req.body || {};
    const vendorId = body.vendor_id != null && body.vendor_id !== '' ? parseInt(body.vendor_id, 10) : NaN;
    const categoryId = body.category_id != null && body.category_id !== '' ? parseInt(body.category_id, 10) : NaN;
    if (!Number.isInteger(vendorId) || vendorId < 1) {
      return res.status(400).json({ success: false, message: 'Valid vendor is required.' });
    }
    if (!Number.isInteger(categoryId) || categoryId < 1) {
      return res.status(400).json({ success: false, message: 'Please select a category.' });
    }
    let imageUrl = body.image_url || '';
    if (req.file) {
      imageUrl = getFileUrl(req.file.filename, 'waste');
    }
    const rawPickup = body.pickup_date || new Date().toISOString().slice(0, 10);
    const pickupDate = /^\d{4}-\d{2}-\d{2}$/.test(rawPickup) ? `${rawPickup} 00:00:00` : rawPickup;
    const submissionData = {
      vendor_id: vendorId,
      category_id: categoryId,
      title: String(body.title || '').trim(),
      description: String(body.description || '').trim(),
      quantity: parseFloat(body.quantity) || 0,
      unit: body.unit || 'kg',
      condition: body.condition || 'other',
      location: String(body.location || '').trim(),
      pickup_date: pickupDate,
      estimated_value: parseFloat(body.estimated_value) || 0,
      image_url: imageUrl,
      status: body.status || 'pending'
    };
    const submission = await SourceWasteSubmission.create(submissionData);
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    if (req.file) {
      deleteFile(`waste/${req.file.filename}`);
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/source-submissions/:id', uploadWaste.single('image'), async (req, res) => {
  try {
    const existing = await SourceWasteSubmission.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    const body = req.body || {};
    const updates = {
      title: body.title,
      description: body.description,
      quantity: body.quantity != null ? parseFloat(body.quantity) : undefined,
      unit: body.unit,
      condition: body.condition,
      location: body.location,
      pickup_date: body.pickup_date,
      estimated_value: body.estimated_value != null ? parseFloat(body.estimated_value) : undefined,
      status: body.status,
      admin_notes: body.admin_notes,
      rejection_reason: body.rejection_reason,
      actual_value: body.actual_value != null ? parseFloat(body.actual_value) : undefined,
      processed_at: body.processed_at
    };
    if (req.file) {
      if (existing.image_url) deleteFile(existing.image_url);
      updates.image_url = getFileUrl(req.file.filename, 'waste');
    } else if (body.image_url !== undefined) {
      updates.image_url = body.image_url;
    }
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    const submission = await SourceWasteSubmission.findByIdAndUpdate(req.params.id, updates);
    res.json({ success: true, data: submission });
  } catch (error) {
    if (req.file) {
      deleteFile(`waste/${req.file.filename}`);
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/source-submissions/:id', async (req, res) => {
  try {
    await SourceWasteSubmission.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Inventory Items
router.get('/inventory', async (req, res) => {
  try {
    const items = await InventoryItem.find({});
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/inventory', uploadInventory.single('image'), async (req, res) => {
  try {
    const body = req.body || {};
    let imageUrl = body.image_url != null ? String(body.image_url) : '';
    if (req.file) {
      imageUrl = getFileUrl(req.file.filename, 'inventory');
    }
    const quantity = parseFloat(body.quantity) || 0;
    const pricePerUnit = parseFloat(body.price_per_unit) || 0;
    const vendorId = body.vendor_id != null && body.vendor_id !== '' ? parseInt(body.vendor_id, 10) : null;
    if (vendorId == null || !Number.isInteger(vendorId) || vendorId < 1) {
      return res.status(400).json({ success: false, message: 'Valid vendor is required.' });
    }
    const sourceId = body.source_waste_submission_id != null && body.source_waste_submission_id !== '' ? body.source_waste_submission_id : null;
    const itemData = {
      vendor_id: vendorId,
      product_name: body.product_name != null ? String(body.product_name) : '',
      description: body.description != null ? String(body.description) : '',
      category: body.category != null ? String(body.category) : 'other',
      quantity,
      unit: body.unit != null ? String(body.unit) : 'kg',
      price_per_unit: pricePerUnit,
      total_value: quantity * pricePerUnit,
      source_waste_submission_id: sourceId,
      image_url: imageUrl,
      is_available: body.is_available !== 'false' && body.is_available !== false
    };
    const item = await InventoryItem.create(itemData);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (req.file) deleteFile(`inventory/${req.file.filename}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/inventory/:id', uploadInventory.single('image'), async (req, res) => {
  try {
    const existing = await InventoryItem.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    const body = req.body || {};
    let imageUrl = body.image_url;
    if (req.file) {
      if (existing.image_url) deleteFile(existing.image_url);
      imageUrl = getFileUrl(req.file.filename, 'inventory');
    }
    const quantity = body.quantity != null ? parseFloat(body.quantity) : undefined;
    const pricePerUnit = body.price_per_unit != null ? parseFloat(body.price_per_unit) : undefined;
    let totalValue = body.total_value != null ? parseFloat(body.total_value) : undefined;
    if (quantity != null && pricePerUnit != null) totalValue = quantity * pricePerUnit;
    const updates = {
      product_name: body.product_name,
      description: body.description,
      category: body.category,
      quantity,
      unit: body.unit,
      price_per_unit: pricePerUnit,
      total_value: totalValue,
      source_waste_submission_id: body.source_waste_submission_id !== undefined && body.source_waste_submission_id !== '' ? body.source_waste_submission_id : null,
      is_available: body.is_available !== undefined ? (body.is_available !== 'false' && body.is_available !== false) : undefined
    };
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, updates);
    res.json({ success: true, data: item });
  } catch (error) {
    if (req.file) deleteFile(`inventory/${req.file.filename}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/inventory/:id', async (req, res) => {
  try {
    await InventoryItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

