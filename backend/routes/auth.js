import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { uploadVendorDoc } from '../utils/fileUpload.js';

const router = express.Router();

// Login (expects JSON: { email, password })
router.post('/login', async (req, res) => {
  try {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = body.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = { ...user };
    delete userObj.password;

    res.json({
      success: true,
      data: {
        user: userObj,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register (FormData: email, password, full_name, role, phone, address, optional vendor fields + business_license file)
router.post('/register', uploadVendorDoc.single('business_license'), async (req, res) => {
  try {
    const body = req.body || {};
    const email = (body.email || '').trim();
    const password = body.password;
    const full_name = (body.full_name || '').trim();
    const role = (body.role || 'user').toLowerCase();
    const phone = (body.phone || '').trim();
    const address = (body.address || '').trim();
    const business_name = (body.business_name || '').trim();
    const business_type = (body.business_type || '').trim();
    const years_in_business = (body.years_in_business || '').trim();

    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Email, password, and full name are required' });
    }
    if (!['user', 'vendor'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be user or vendor' });
    }
    if (role === 'vendor' && !business_name) {
      return res.status(400).json({ success: false, message: 'Business name is required for vendors' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const business_license_path = req.file ? `/uploads/users/${req.file.filename}` : '';

    const userData = {
      email,
      password: hashedPassword,
      full_name,
      role,
      phone: phone || '',
      address: address || '',
      is_active: role === 'user' ? true : false,
      vendor_status: role === 'vendor' ? 'pending' : undefined,
      business_name: role === 'vendor' ? business_name : '',
      business_type: role === 'vendor' ? business_type : '',
      years_in_business: role === 'vendor' ? years_in_business : '',
      business_license: business_license_path || ''
    };

    const user = await User.create(userData);
    const userObj = { ...user };
    delete userObj.password;

    // Auto-login for regular users
    let token = null;
    if (role === 'user') {
      token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    }

    res.status(201).json({
      success: true,
      data: {
        user: userObj,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userObj = { ...user };
    delete userObj.password;

    res.json({
      success: true,
      data: { user: userObj }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Create user (Admin or for admin panel; JSON body)
router.post('/users', async (req, res) => {
  try {
    const body = req.body || {};
    const email = (body.email || '').trim();
    const password = body.password;
    const full_name = (body.full_name || '').trim();
    const role = (body.role || 'user').toLowerCase();
    const phone = (body.phone || '').trim();
    const address = (body.address || '').trim();

    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Email, password, and full name are required' });
    }
    if (!['user', 'vendor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be user, vendor, or admin' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      email,
      password: hashedPassword,
      full_name,
      role,
      phone: phone || '',
      address: address || '',
      is_active: true,
      vendor_status: role === 'vendor' ? 'pending' : undefined
    };

    const user = await User.create(userData);
    const userObj = { ...user };
    delete userObj.password;

    res.status(201).json({
      success: true,
      data: userObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users (Admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});
    const usersWithoutPassword = users.map(user => {
      const userObj = { ...user };
      delete userObj.password;
      return userObj;
    });

    res.json({
      success: true,
      data: usersWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user status (Admin only)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByIdAndUpdate(id, updates);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userObj = { ...user };
    delete userObj.password;

    res.json({
      success: true,
      data: userObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user (Admin only)
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userObj = { ...user };
    delete userObj.password;

    res.json({
      success: true,
      data: userObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(decoded.userId, updates);
    const userObj = { ...user };
    delete userObj.password;

    res.json({
      success: true,
      data: { user: userObj }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

