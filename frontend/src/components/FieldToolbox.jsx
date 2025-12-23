import React from 'react';
import { Type, Image, Calendar, Circle, Download } from 'lucide-react';

const FieldToolbox = ({ fields, onGeneratePDF, isProcessing }) => {
  const fieldTypes = [
    { type: 'signature', icon: <Type size={20} />, label: 'Signature', color: 'bg-blue-500' },
    { type: 'text', icon: <Type size={20} />, label: 'Text Box', color: 'bg-green-500' },
    { type: 'image', icon: <Image size={20} />, label: 'Image', color: 'bg-purple-500' },
    { type: 'date', icon: <Calendar size={20} />, label: 'Date', color: 'bg-yellow-500' },
    { type: 'radio', icon: <Circle size={20} />, label: 'Radio', color: 'bg-pink-500' }
  ];

  const handleDragStart = (e, fieldType) => {
    e.dataTransfer.setData('fieldType', fieldType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const coordinateInfo = fields.length > 0 ? fields[0] : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">Field Toolbox</h2>
        <p className="text-sm text-gray-600 mb-4">
          Drag these fields onto the document
        </p>
        
        <div className="space-y-2">
          {fieldTypes.map(({ type, icon, label, color }) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              className={`${color} text-white p-3 rounded cursor-move hover:opacity-80 transition-opacity flex items-center gap-2 active:scale-95 transform transition-transform`}
            >
              {icon}
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold mb-2 text-gray-700">
            Active Fields: {fields.length}
          </h3>
          
          {coordinateInfo && (
            <div className="text-xs bg-gray-50 p-3 rounded border border-gray-200">
              <div className="font-semibold mb-1 text-gray-600">Last Field Position:</div>
              <div className="font-mono text-gray-700 space-y-1">
                <div>X: {coordinateInfo.x.toFixed(2)}%</div>
                <div>Y: {coordinateInfo.y.toFixed(2)}%</div>
                <div>W: {coordinateInfo.width.toFixed(2)}%</div>
                <div>H: {coordinateInfo.height.toFixed(2)}%</div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onGeneratePDF}
          disabled={fields.length === 0 || isProcessing}
          className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <Download size={20} />
              Generate Signed PDF
            </>
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          💡 How to use:
        </h3>
        <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
          <li>Drag a field from above onto the PDF</li>
          <li>Click and drag to reposition</li>
          <li>Drag bottom-right corner to resize</li>
          <li>Click signature field to sign</li>
          <li>Click "Generate PDF" when done</li>
        </ol>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Statistics</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total Fields:</span>
            <span className="font-semibold">{fields.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Signatures:</span>
            <span className="font-semibold">
              {fields.filter(f => f.type === 'signature').length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Filled:</span>
            <span className="font-semibold">
              {fields.filter(f => f.value).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldToolbox;