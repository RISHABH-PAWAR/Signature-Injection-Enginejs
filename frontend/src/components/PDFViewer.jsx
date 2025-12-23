import React, { useState, useRef, useEffect } from 'react';
import DraggableField from './DraggableField';

const PDFViewer = ({ pdfFile, fields, onAddField, onUpdateField, onDeleteField, onFieldClick }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const viewerRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (viewerRef.current) {
        const rect = viewerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleDrop = (e, fieldType) => {
    e.preventDefault();
    const rect = viewerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const fieldSizes = {
      signature: { width: 25, height: 15 },
      text: { width: 20, height: 8 },
      image: { width: 15, height: 15 },
      date: { width: 18, height: 8 },
      radio: { width: 12, height: 12 }
    };

    const size = fieldSizes[fieldType] || { width: 20, height: 10 };

    onAddField({
      id: `field-${Date.now()}`,
      type: fieldType,
      x: Math.min(x, 100 - size.width),
      y: Math.min(y, 100 - size.height),
      width: size.width,
      height: size.height,
      value: fieldType === 'radio' ? 'option1' : null,
      options: fieldType === 'radio' ? ['Option 1', 'Option 2', 'Option 3'] : null
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Document Preview</h2>
        <div className="text-sm text-gray-600">
          📱 Responsive: Try resizing your browser
        </div>
      </div>
      
      <div
        ref={viewerRef}
        className="relative bg-gray-100 border-2 border-gray-300 overflow-hidden"
        style={{ width: '100%', height: '600px' }}
        onDrop={(e) => {
          const fieldType = e.dataTransfer.getData('fieldType');
          if (fieldType) handleDrop(e, fieldType);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {pdfFile && pdfFile.pdfUrl ? (
          <div className="absolute inset-0">
            <iframe
              src={pdfFile.pdfUrl}
              className="w-full h-full border-0 pointer-events-none"
              title="PDF Preview"
            />
            
            {/* Fields Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {fields.map((field) => (
                <div key={field.id} className="pointer-events-auto">
                  <DraggableField
                    field={field}
                    containerDimensions={dimensions}
                    onUpdate={onUpdateField}
                    onDelete={onDeleteField}
                    onClick={onFieldClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <p className="text-gray-500 text-xl mb-2">📄 No PDF Uploaded</p>
              <p className="text-gray-400">Upload a PDF to get started</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-between items-center text-sm text-gray-600">
        <span>📌 Drag fields from the left panel onto the PDF</span>
        <div className="flex gap-4">
          {pdfFile && <span>📄 {pdfFile.fileName}</span>}
          <span>✨ Fields: {fields.length}</span>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;