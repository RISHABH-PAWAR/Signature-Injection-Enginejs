import express from 'express';
import multer from 'multer';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import { calculateHash } from '../utils/hashUtils.js';
import { 
  convertCoordinates, 
  calculateAspectRatioDimensions, 
  base64FromDataURL,
  validateFieldCoordinates 
} from '../utils/pdfUtils.js';

const router = express.Router();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});


router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No PDF file uploaded' 
      });
    }

    const pdfPath = req.file.path;
    const pdfBuffer = await fs.readFile(pdfPath);
    
    const pdfHash = calculateHash(pdfBuffer);
    
    // Load PDF to get dimensions
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    const pageCount = pdfDoc.getPageCount();
    
    const document = new Document({
      originalPdfHash: pdfHash,
      originalPdfUrl: `/uploads/${req.file.filename}`,
      metadata: {
        pdfDimensions: { width, height },
        pageCount
      }
    });
    
    await document.save();
    
    console.log(`✅ PDF uploaded: ${req.file.filename}`);
    console.log(`   Hash: ${pdfHash}`);
    console.log(`   Dimensions: ${width} x ${height}`);
    
    res.json({
      success: true,
      documentId: document._id,
      pdfUrl: `/uploads/${req.file.filename}`,
      hash: pdfHash,
      dimensions: { width, height },
      pageCount
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});


router.post('/sign-pdf', async (req, res) => {
  try {
    const { documentId, fields } = req.body;
    
    // Validation
    if (!documentId || !fields || fields.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing documentId or fields' 
      });
    }
    
    // Validate all field coordinates
    for (const field of fields) {
      if (!validateFieldCoordinates(field)) {
        return res.status(400).json({
          success: false,
          error: `Invalid coordinates for field: ${field.type}`
        });
      }
    }
    
    // Retrieve document from database
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ 
        success: false,
        error: 'Document not found' 
      });
    }
    
    // Load original PDF
    const originalPdfPath = path.join(__dirname, '..', document.originalPdfUrl);
    const pdfBuffer = await fs.readFile(originalPdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const firstPage = pdfDoc.getPages()[0];
    const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();
    
    console.log(`\n📄 Processing PDF: ${documentId}`);
    console.log(`   Dimensions: ${pdfWidth} x ${pdfHeight} points`);
    console.log(`   Fields to process: ${fields.length}`);
    
    // Process each field
    for (const field of fields) {
      // Skip empty optional fields
      if (!field.value && field.type !== 'radio') {
        console.log(`   ⊘ Skipping empty ${field.type} field`);
        continue;
      }
      
      
      const coords = convertCoordinates(field, pdfWidth, pdfHeight);
      
      console.log(`   ✓ Processing ${field.type} field:`);
      console.log(`     Input: x=${field.x.toFixed(1)}%, y=${field.y.toFixed(1)}%`);
      console.log(`     Output: x=${coords.x.toFixed(1)}pt, y=${coords.y.toFixed(1)}pt`);
      
      // Handle different field types
      if (field.type === 'signature' || field.type === 'image') {
        // Handle signature/image fields
        try {
          const base64Data = base64FromDataURL(field.value);
          const imageBytes = Buffer.from(base64Data, 'base64');
          
          let embeddedImage;
          try {
            // Try PNG first
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          } catch {
            try {
              // Fallback to JPG
              embeddedImage = await pdfDoc.embedJpg(imageBytes);
            } catch (error) {
              console.error(`     ✗ Failed to embed image: ${error.message}`);
              continue;
            }
          }
          
          // Get original image dimensions
          const { width: imgWidth, height: imgHeight } = embeddedImage.scale(1);
          
          // Calculate dimensions maintaining aspect ratio
          const dimensions = calculateAspectRatioDimensions(
            imgWidth,
            imgHeight,
            coords.width,
            coords.height
          );
          
          console.log(`     Aspect ratio: ${imgWidth}x${imgHeight} → ${dimensions.width.toFixed(1)}x${dimensions.height.toFixed(1)}`);
          
          // Draw image on PDF
          firstPage.drawImage(embeddedImage, {
            x: coords.x + dimensions.offsetX,
            y: coords.y + dimensions.offsetY,
            width: dimensions.width,
            height: dimensions.height
          });
        } catch (error) {
          console.error(`     ✗ Error processing image: ${error.message}`);
        }
        
      } else if (field.type === 'text') {
        const textValue = field.value || 'Text Field';
        const fontSize = Math.min(coords.height * 0.6, 12);
        
        firstPage.drawText(textValue, {
          x: coords.x + 4,
          y: coords.y + (coords.height / 2) - (fontSize / 3),
          size: fontSize,
          color: rgb(0, 0, 0),
          maxWidth: coords.width - 8
        });
        
        console.log(`     Text: "${textValue}"`);
        
      } else if (field.type === 'date') {
        const dateValue = field.value || new Date().toISOString().split('T')[0];
        const fontSize = Math.min(coords.height * 0.6, 10);
        
        firstPage.drawText(dateValue, {
          x: coords.x + 4,
          y: coords.y + (coords.height / 2) - (fontSize / 3),
          size: fontSize,
          color: rgb(0, 0, 0)
        });
        
        console.log(`     Date: ${dateValue}`);
        
      } else if (field.type === 'radio') {
        
        const radioOptions = field.options || ['Option 1', 'Option 2', 'Option 3'];
        const selectedValue = field.value || 'option1';
        
        const valueIndex = parseInt(selectedValue.replace('option', '')) - 1;
        const displayText = radioOptions[valueIndex] || radioOptions[0];
        
        const fontSize = Math.min(coords.height * 0.5, 10);
        const circleRadius = Math.min(coords.height, coords.width) * 0.15;
        const circleX = coords.x + circleRadius + 4;
        const circleY = coords.y + (coords.height / 2);
        
       
        firstPage.drawCircle({
          x: circleX,
          y: circleY,
          size: circleRadius,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1.5
        });
        
        if (field.value) {
          firstPage.drawCircle({
            x: circleX,
            y: circleY,
            size: circleRadius * 0.35, 
            color: rgb(0, 0, 0)
          });
        }
        
        // Draw label text
        firstPage.drawText(displayText, {
          x: coords.x + circleRadius * 2 + 10,
          y: coords.y + (coords.height / 2) - (fontSize / 3),
          size: fontSize,
          color: rgb(0, 0, 0),
          maxWidth: coords.width - circleRadius * 2 - 15
        });
        
        console.log(`     Radio: ${displayText} (${selectedValue})`);
      }
    }
    
    // Save the modified PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedPdfHash = calculateHash(Buffer.from(signedPdfBytes));
    
    // Save signed PDF to disk
    const signedPdfFilename = `signed-${Date.now()}.pdf`;
    const signedPdfPath = path.join(__dirname, '../uploads', signedPdfFilename);
    await fs.writeFile(signedPdfPath, signedPdfBytes);
    
    // Update document in database
    document.signedPdfHash = signedPdfHash;
    document.signedPdfUrl = `/uploads/${signedPdfFilename}`;
    document.signedAt = new Date();
    document.fields = fields;
    await document.save();
    
    console.log(`\n✅ PDF signed successfully!`);
    console.log(`   Original hash: ${document.originalPdfHash}`);
    console.log(`   Signed hash: ${signedPdfHash}`);
    console.log(`   File: ${signedPdfFilename}\n`);
    
    // Send file directly for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${signedPdfFilename}"`);
    res.send(Buffer.from(signedPdfBytes));
    
  } catch (error) {
    console.error('❌ Sign PDF error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});


router.get('/document/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ 
        success: false,
        error: 'Document not found' 
      });
    }
    
    res.json({
      success: true,
      document: {
        id: document._id,
        originalPdfHash: document.originalPdfHash,
        signedPdfHash: document.signedPdfHash,
        originalPdfUrl: document.originalPdfUrl,
        signedPdfUrl: document.signedPdfUrl,
        createdAt: document.createdAt,
        signedAt: document.signedAt,
        fields: document.fields,
        metadata: document.metadata
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});


router.get('/verify/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ 
        success: false,
        error: 'Document not found' 
      });
    }
    
    // Verify original PDF hash
    const originalPdfPath = path.join(__dirname, '..', document.originalPdfUrl);
    const originalBuffer = await fs.readFile(originalPdfPath);
    const calculatedOriginalHash = calculateHash(originalBuffer);
    
    let calculatedSignedHash = null;
    let signedVerified = null;
    
    if (document.signedPdfUrl) {
      const signedPdfPath = path.join(__dirname, '..', document.signedPdfUrl);
      const signedBuffer = await fs.readFile(signedPdfPath);
      calculatedSignedHash = calculateHash(signedBuffer);
      signedVerified = calculatedSignedHash === document.signedPdfHash;
    }
    
    const originalVerified = calculatedOriginalHash === document.originalPdfHash;
    
    res.json({
      success: true,
      verification: {
        originalPdf: {
          storedHash: document.originalPdfHash,
          calculatedHash: calculatedOriginalHash,
          verified: originalVerified,
          status: originalVerified ? '✅ VERIFIED' : '❌ TAMPERED'
        },
        signedPdf: document.signedPdfHash ? {
          storedHash: document.signedPdfHash,
          calculatedHash: calculatedSignedHash,
          verified: signedVerified,
          status: signedVerified ? '✅ VERIFIED' : '❌ TAMPERED'
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});


router.get('/documents', async (req, res) => {
  try {
    const documents = await Document.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('-__v');
    
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;