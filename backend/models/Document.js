import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  
  originalPdfHash: {
    type: String,
    required: true,
    index: true
  },
  
  
  signedPdfHash: {
    type: String,
    default: null
  },
  
  originalPdfUrl: {
    type: String,
    required: true
  },
  
  signedPdfUrl: {
    type: String,
    default: null
  },
  
  fields: [{
    type: {
      type: String,
      enum: ['signature', 'text', 'image', 'date', 'radio'],
      required: true
    },
    x: { type: Number, required: true },     
    y: { type: Number, required: true }, 
    width: { type: Number, required: true }, 
    height: { type: Number, required: true }, 
    value: { type: String }  
  }],
  
  
  metadata: {
    pdfDimensions: {
      width: Number,   
      height: Number   
    },
    pageCount: {
      type: Number,
      default: 1
    }
  },
  
  
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
  timestamps: true 
});

DocumentSchema.index({ originalPdfHash: 1 });
DocumentSchema.index({ createdAt: -1 });

const Document = mongoose.model('Document', DocumentSchema);

export default Document;