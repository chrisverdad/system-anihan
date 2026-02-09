import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import './config/database.js'; // Initialize MySQL database
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import wasteRoutes from './routes/waste.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory (for images)
const publicPath = path.join(__dirname, '..', 'public');
app.use('/photos', express.static(path.join(publicPath, 'photos')));
app.use('/images', express.static(path.join(publicPath, 'photos'))); // Alias for /images
app.use(express.static(publicPath));

// Serve uploaded files (ensure uploads + subdirs exist)
const uploadsPath = path.join(__dirname, 'uploads');
const wastePath = path.join(uploadsPath, 'waste');
const inventoryPath = path.join(uploadsPath, 'inventory');
const usersPath = path.join(uploadsPath, 'users');
[uploadsPath, wastePath, inventoryPath, usersPath].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/waste', wasteRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Ensure default admin exists so login works even without running seed
  try {
    const { pool } = await import('./config/database.js');
    const [rows] = await pool.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!rows || rows.length === 0) {
      const bcrypt = (await import('bcryptjs')).default;
      const hash = bcrypt.hashSync('admin123', 10);
      await pool.execute(
        `INSERT INTO users (email, password, full_name, role, phone, address, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['admin@anihan.com', hash, 'Admin User', 'admin', '+63 912 345 6789', 'Butuan City, Agusan del Norte', 1]
      );
      console.log('✅ Default admin created (admin@anihan.com / admin123)');
    }
  } catch (e) {
    console.warn('Could not ensure default admin:', e.message);
  }
});

