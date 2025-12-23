import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfRoutes from './routes/pdfRoutes.js';

// Load environment variables
dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (uploaded PDFs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// DATABASE CONNECTION
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/signature_engine';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB Connected');
  console.log(`   Database: ${mongoose.connection.name}`);
  console.log(`   Host: ${mongoose.connection.host}`);
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// ============================================
// ROUTES
// ============================================

// API routes
app.use('/api', pdfRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Signature Injection Engine API',
    version: '1.0.0',
    endpoints: {
      'POST /api/upload-pdf': 'Upload a PDF file',
      'POST /api/sign-pdf': 'Generate signed PDF',
      'GET /api/document/:id': 'Get document info',
      'GET /api/verify/:id': 'Verify document integrity',
      'GET /api/documents': 'List all documents',
      'GET /health': 'Health check'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Signature Injection Engine - Backend    ║
║                                            ║
║   🚀 Server running on port ${PORT}          ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}              ║
║   📁 Uploads: ${path.join(__dirname, 'uploads')}
╚════════════════════════════════════════════╝

API Endpoints:
  POST   /api/upload-pdf          Upload PDF
  POST   /api/sign-pdf            Generate signed PDF
  GET    /api/document/:id        Get document info
  GET    /api/verify/:id          Verify document integrity
  GET    /api/documents           List all documents
  GET    /health                  Health check

Ready to process signatures! ✍️
  `);
});

export default app;