import React, { useState, useRef } from 'react';
import { FileText, Download, Upload } from 'lucide-react';
import axios from 'axios';
import PDFViewer from './components/PDFViewer';
import FieldToolbox from './components/FieldToolbox';
import SignatureModal from './components/SignatureModal';
import PDFUpload from './components/PDFUpload';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🔗 API URL:', API_URL);

const App = () => {
  const [fields, setFields] = useState([]);
  const [pdfData, setPdfData] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const containerRef = useRef(null);

  // Handle PDF upload success
  const handleUploadSuccess = (data) => {
    setPdfData(data);
    setDocumentId(data.documentId);
    setFields([]); // Clear existing fields when new PDF is uploaded
    console.log('✅ PDF uploaded:', data);
  };

  // Add new field to PDF
  const addField = (field) => {
    setFields([...fields, field]);
    console.log('✅ Field added:', field);
  };

  // Update field properties
  const updateField = (fieldId, updates) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    console.log('✅ Field updated:', fieldId, updates);
  };

  // Delete field
  const deleteField = (fieldId) => {
    setFields(fields.filter(f => f.id !== fieldId));
    console.log('✅ Field deleted:', fieldId);
  };

  // Handle field click (for signature modal)
  const handleFieldClick = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (field && field.type === 'signature' && !field.value) {
      setActiveFieldId(fieldId);
      setShowSignatureModal(true);
    }
  };

  // Save signature from modal
  const handleSaveSignature = (signatureData) => {
    if (activeFieldId) {
      updateField(activeFieldId, { value: signatureData });
    }
    setShowSignatureModal(false);
    setActiveFieldId(null);
  };

  // Generate and download signed PDF
  const handleGeneratePDF = async () => {
    // Validation
    if (!documentId) {
      alert('⚠️ Please upload a PDF first!');
      return;
    }

    if (fields.length === 0) {
      alert('⚠️ Please add at least one field to the document!');
      return;
    }

    // Check for empty required fields
    const emptyFields = fields.filter(f => !f.value && f.type !== 'radio');
    if (emptyFields.length > 0) {
      const proceed = window.confirm(
        `⚠️ You have ${emptyFields.length} empty field(s):\n\n` +
        emptyFields.map(f => `- ${f.type} field`).join('\n') +
        '\n\nDo you want to continue anyway?'
      );
      if (!proceed) return;
    }

    setIsProcessing(true);

    try {
      // Prepare payload
      const payload = {
        documentId: documentId,
        fields: fields.map(f => ({
          type: f.type,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          value: f.value,
          options: f.options
        }))
      };

      console.log('📤 Sending to backend:', payload);
      console.log('🔗 API Endpoint:', `${API_URL}/api/sign-pdf`);

      // Call backend API
      const response = await axios.post(`${API_URL}/api/sign-pdf`, payload, {
        responseType: 'blob' // Important for file download
      });

      console.log('✅ Response received');

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `signed-${pdfData.fileName || 'document.pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      alert(
        `✅ PDF Generated & Downloaded Successfully!\n\n` +
        `File: signed-${pdfData.fileName}\n` +
        `Fields processed: ${fields.length}\n\n` +
        `Check your Downloads folder!`
      );

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      
      // Better error handling
      let errorMessage = 'Failed to generate PDF';
      if (error.response) {
        // Try to parse error as text if it's not JSON
        if (error.response.data instanceof Blob) {
          const text = await error.response.data.text();
          try {
            const jsonError = JSON.parse(text);
            errorMessage = jsonError.error || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } else {
          errorMessage = error.response.data?.error || errorMessage;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Is the backend running on ' + API_URL + '?';
      } else {
        errorMessage = error.message;
      }
      
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle upload new PDF
  const handleUploadNew = () => {
    if (fields.length > 0) {
      const proceed = window.confirm(
        'Upload a new PDF? Current fields will be cleared.\n\nDo you want to continue?'
      );
      if (!proceed) return;
    }
    
    setPdfData(null);
    setDocumentId(null);
    setFields([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="text-blue-600" size={32} />
                <h1 className="text-3xl font-bold text-gray-800">
                  Signature Injection Engine
                </h1>
              </div>
              <p className="text-gray-600">
                Upload PDF → Drag fields → Edit → Sign → Download signed PDF
              </p>
            </div>

            {/* Upload New PDF Button (when PDF is already uploaded) */}
            {pdfData && (
              <button
                onClick={handleUploadNew}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload size={20} />
                Upload New PDF
              </button>
            )}
          </div>

          {/* Current PDF Info */}
          {pdfData && (
            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-800">
                    📄 <strong>Current PDF:</strong> {pdfData.fileName}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Document ID: {documentId}
                  </p>
                </div>
                <div className="text-xs text-blue-600">
                  Hash: {pdfData.hash?.substring(0, 16)}...
                </div>
              </div>
            </div>
          )}

          {/* API Connection Status */}
          <div className="mt-2 text-xs text-gray-500">
            🔗 Connected to: <code className="bg-gray-100 px-2 py-1 rounded">{API_URL}</code>
          </div>
        </div>

        {/* PDF Upload Area */}
        {!pdfData && (
          <PDFUpload onUploadSuccess={handleUploadSuccess} />
        )}

        {/* Main Content - Only show if PDF is uploaded */}
        {pdfData && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Toolbox */}
            <div className="lg:col-span-1">
              <FieldToolbox
                fields={fields}
                onGeneratePDF={handleGeneratePDF}
                isProcessing={isProcessing}
              />
            </div>

            {/* PDF Viewer */}
            <div className="lg:col-span-3">
              <PDFViewer
                pdfFile={pdfData}
                fields={fields}
                onAddField={addField}
                onUpdateField={updateField}
                onDeleteField={deleteField}
                onFieldClick={handleFieldClick}
                containerRef={containerRef}
              />
            </div>
          </div>
        )}

        {/* Technical Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-4">
          <h2 className="text-xl font-bold mb-3">✨ Features Implemented</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h3 className="font-semibold mb-2 text-blue-800">📄 PDF Management</h3>
              <ul className="text-blue-700 space-y-1">
                <li>✅ Upload any PDF document</li>
                <li>✅ Real PDF preview</li>
                <li>✅ Upload new PDF anytime</li>
                <li>✅ Auto-download signed PDF</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded border border-green-200">
              <h3 className="font-semibold mb-2 text-green-800">🎯 Field Types</h3>
              <ul className="text-green-700 space-y-1">
                <li>✅ Signature (drawable)</li>
                <li>✅ Text (editable inline)</li>
                <li>✅ Image (upload any image)</li>
                <li>✅ Date (calendar picker)</li>
                <li>✅ Radio (dropdown select)</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 rounded border border-purple-200">
              <h3 className="font-semibold mb-2 text-purple-800">🔧 Field Actions</h3>
              <ul className="text-purple-700 space-y-1">
                <li>✅ Drag & drop positioning</li>
                <li>✅ Resize any field</li>
                <li>✅ Edit field values</li>
                <li>✅ Delete fields</li>
                <li>✅ Responsive layout</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <h3 className="font-semibold mb-2 text-gray-800">🎨 How to Use:</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li><strong>Upload PDF:</strong> Drag & drop or click to browse</li>
              <li><strong>Add Fields:</strong> Drag field types from left panel onto PDF</li>
              <li><strong>Position:</strong> Drag fields to desired location</li>
              <li><strong>Resize:</strong> Drag bottom-right corner to resize</li>
              <li><strong>Edit:</strong> Click edit button or field to modify content</li>
              <li><strong>Delete:</strong> Click X button to remove field</li>
              <li><strong>Sign:</strong> Click signature field to draw signature</li>
              <li><strong>Download:</strong> Click "Generate Signed PDF" to download</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          onClose={() => {
            setShowSignatureModal(false);
            setActiveFieldId(null);
          }}
          onSave={handleSaveSignature}
        />
      )}
    </div>
  );
};

export default App;