import mongoose from 'mongoose';

/**
 * Document Schema
 * Stores information about PDF documents and their signatures
 */
const DocumentSchema = new mongoose.Schema({
  // SHA-256 hash of original PDF (before signing)
  originalPdfHash: {
    type: String,
    required: true,
    index: true
  },
  
  // SHA-256 hash of signed PDF (after signing)
  signedPdfHash: {
    type: String,
    default: null
  },
  
  // File URLs
  originalPdfUrl: {
    type: String,
    required: true
  },
  
  signedPdfUrl: {
    type: String,
    default: null
  },
  
  // Field data (positions and values)
  fields: [{
    type: {
      type: String,
      enum: ['signature', 'text', 'image', 'date', 'radio'],
      required: true
    },
    x: { type: Number, required: true },      // Percentage
    y: { type: Number, required: true },      // Percentage
    width: { type: Number, required: true },  // Percentage
    height: { type: Number, required: true }, // Percentage
    value: { type: String }                   // Field content (base64 for images)
  }],
  
  // PDF metadata
  metadata: {
    pdfDimensions: {
      width: Number,   // PDF width in points
      height: Number   // PDF height in points
    },
    pageCount: {
      type: Number,
      default: 1
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  signedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});

// Create indexes for faster queries
DocumentSchema.index({ originalPdfHash: 1 });
DocumentSchema.index({ createdAt: -1 });

const Document = mongoose.model('Document', DocumentSchema);

export default Document;