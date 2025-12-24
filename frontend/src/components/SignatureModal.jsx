import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';


const SignatureModal = ({ onClose, onSave }) => {
  
  const canvasRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  
 
  const [hasDrawn, setHasDrawn] = useState(false);

 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    
    ctx.strokeStyle = '#000000';  
    ctx.lineWidth = 2;  
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  
  const startDrawing = (e) => {
    setIsDrawing(true);
    setHasDrawn(true); 
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
  
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
 
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

 
  const draw = (e) => {
    if (!isDrawing) return;  
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
   
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
  
    ctx.lineTo(x, y);
    ctx.stroke();
  };

 
  const stopDrawing = () => {
    setIsDrawing(false);
    
    // Close the current path
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
  };

  
  const startDrawingTouch = (e) => {
    e.preventDefault(); 
    const touch = e.touches[0]; 
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
    // Reuse mouse handler
    startDrawing(mouseEvent);
  };

  
  const drawTouch = (e) => {
    e.preventDefault();  
    
    if (!isDrawing) return;
    
    const touch = e.touches[0];  // Get first touch point
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
   
    draw(mouseEvent);
  };

  
  const stopDrawingTouch = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
   
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
   
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
   
    setHasDrawn(false);
  };

 
  const saveSignature = () => {
    if (!hasDrawn) {
      alert('Please draw your signature first');
      return;
    }
    
    const canvas = canvasRef.current;
  
    const dataURL = canvas.toDataURL('image/png');
  
    onSave(dataURL);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">
            ✍️ Draw Your Signature
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Canvas Container */}
        <div className="p-6">
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={700}
              height={250}
              className="w-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawingTouch}
              onTouchMove={drawTouch}
              onTouchEnd={stopDrawingTouch}
            />
          </div>
          
          {/* Helper Text */}
          <p className="text-sm text-gray-500 mt-2 text-center">
            Use your mouse or finger to draw your signature above
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200">
          {/* Clear Button */}
          <button
            onClick={clearCanvas}
            disabled={!hasDrawn}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Trash2 size={18} />
            Clear
          </button>
          
          {/* Save Button */}
          <button
            onClick={saveSignature}
            disabled={!hasDrawn}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-colors"
          >
            <Save size={18} />
            Save Signature
          </button>
          
          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors"
          >
            <X size={18} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;

