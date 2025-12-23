import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import axios from 'axios';

const PDFUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (file.type !== 'application/pdf') {
      alert('⚠️ Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('⚠️ File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await axios.post('http://localhost:5000/api/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Upload successful:', response.data);

      onUploadSuccess({
        documentId: response.data.documentId,
        pdfUrl: `http://localhost:5000${response.data.pdfUrl}`,
        fileName: file.name,
        hash: response.data.hash,
        dimensions: response.data.dimensions
      });

      alert(`✅ PDF uploaded successfully!\n\nDocument ID: ${response.data.documentId}\nHash: ${response.data.hash.substring(0, 16)}...`);

    } catch (error) {
      console.error('❌ Upload error:', error);
      alert(`❌ Upload failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="text-blue-600" size={24} />
        Upload PDF Document
      </h2>
      
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
            <p className="text-lg text-gray-700 font-medium">Uploading PDF...</p>
            <p className="text-sm text-gray-500">Please wait...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Upload size={64} className="text-gray-400" />
            <div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Drop your PDF here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse from your computer
              </p>
            </div>
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg transition-colors font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-transform">
              Choose PDF File
              <input
                type="file"
                accept="application/pdf"
                onChange={handleChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-2">
              Maximum file size: 10MB
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2 text-sm">📋 Supported Features:</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>✅ Drag & drop PDF files</li>
          <li>✅ Click to browse and select</li>
          <li>✅ Automatic validation</li>
          <li>✅ Secure SHA-256 hashing</li>
          <li>✅ MongoDB storage with audit trail</li>
        </ul>
      </div>
    </div>
  );
};

export default PDFUpload;