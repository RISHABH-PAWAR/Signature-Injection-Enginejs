import React, { useRef, useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';

/**
 * SignatureModal Component
 * 
 * This component provides a modal dialog for capturing user signatures using HTML5 Canvas.
 * It supports both mouse and touch input for drawing signatures.
 * 
 * Props:
 * - onClose: Function to call when user closes the modal
 * - onSave: Function to call with signature data (base64 image) when user saves
 */
const SignatureModal = ({ onClose, onSave }) => {
  // ============================================
  // STATE & REFS
  // ============================================
  
  // Reference to the canvas DOM element
  const canvasRef = useRef(null);
  
  // Track whether user is currently drawing
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Track whether user has drawn anything (to enable/disable save button)
  const [hasDrawn, setHasDrawn] = useState(false);

  // ============================================
  // CANVAS INITIALIZATION
  // ============================================
  
  /**
   * Initialize canvas context and styling when component mounts
   * This runs once when the modal opens
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Configure drawing style
    ctx.strokeStyle = '#000000';  // Black color for signature
    ctx.lineWidth = 2;            // Medium thickness
    ctx.lineCap = 'round';        // Rounded line ends (looks more natural)
    ctx.lineJoin = 'round';       // Rounded corners (smoother curves)
    
    // Fill canvas with white background
    // This ensures the signature has a white background when exported
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ============================================
  // MOUSE EVENT HANDLERS
  // ============================================
  
  /**
   * Start drawing when mouse button is pressed
   * Records the starting position for the drawing line
   */
  const startDrawing = (e) => {
    setIsDrawing(true);
    setHasDrawn(true);  // Mark that user has started drawing
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Start a new path at the mouse position
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  /**
   * Continue drawing as mouse moves
   * Only draws if mouse button is pressed (isDrawing === true)
   */
  const draw = (e) => {
    if (!isDrawing) return;  // Only draw if mouse button is down
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Calculate current mouse position
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Draw line from previous position to current position
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  /**
   * Stop drawing when mouse button is released
   */
  const stopDrawing = () => {
    setIsDrawing(false);
    
    // Close the current path
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
  };

  // ============================================
  // TOUCH EVENT HANDLERS (Mobile Support)
  // ============================================
  
  /**
   * Start drawing when user touches screen (mobile)
   */
  const startDrawingTouch = (e) => {
    e.preventDefault();  // Prevent scrolling while drawing
    
    const touch = e.touches[0];  // Get first touch point
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
    // Reuse mouse handler
    startDrawing(mouseEvent);
  };

  /**
   * Continue drawing as user moves finger (mobile)
   */
  const drawTouch = (e) => {
    e.preventDefault();  // Prevent scrolling while drawing
    
    if (!isDrawing) return;
    
    const touch = e.touches[0];  // Get first touch point
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
    // Reuse mouse handler
    draw(mouseEvent);
  };

  /**
   * Stop drawing when user lifts finger (mobile)
   */
  const stopDrawingTouch = (e) => {
    e.preventDefault();
    stopDrawing();
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================
  
  /**
   * Clear the entire canvas
   * Resets to blank white background
   */
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Reset state
    setHasDrawn(false);
  };

  /**
   * Save signature and close modal
   * Converts canvas to base64 PNG image
   */
  const saveSignature = () => {
    if (!hasDrawn) {
      alert('Please draw your signature first');
      return;
    }
    
    const canvas = canvasRef.current;
    
    // Convert canvas to base64 data URL
    // Format: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    const dataURL = canvas.toDataURL('image/png');
    
    // Send signature data back to parent component
    onSave(dataURL);
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    // Modal Overlay - Covers entire screen with semi-transparent background
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

/**
 * ============================================
 * DETAILED EXPLANATION OF KEY CONCEPTS
 * ============================================
 * 
 * 1. CANVAS API:
 *    - HTML5 Canvas is a bitmap drawing surface
 *    - getContext('2d') gives us drawing methods
 *    - beginPath() starts a new drawing path
 *    - moveTo(x, y) moves the "pen" without drawing
 *    - lineTo(x, y) draws a line to the new position
 *    - stroke() actually renders the line
 * 
 * 2. EVENT COORDINATE CALCULATION:
 *    - e.clientX/Y = Mouse position relative to viewport
 *    - canvas.getBoundingClientRect() = Canvas position on page
 *    - Subtract canvas position from mouse position to get position ON canvas
 *    - Example: Mouse at (500, 300), Canvas at (100, 50) = Canvas coords (400, 250)
 * 
 * 3. DRAWING FLOW:
 *    - MouseDown: Start new path, move to position
 *    - MouseMove: If drawing, draw line to new position
 *    - MouseUp: Stop drawing, close path
 *    - MouseLeave: Stop drawing if mouse leaves canvas
 * 
 * 4. TOUCH SUPPORT:
 *    - Convert touch events to mouse events
 *    - e.preventDefault() prevents page scrolling while drawing
 *    - e.touches[0] gets the first finger touch point
 * 
 * 5. DATA URL (Base64):
 *    - canvas.toDataURL('image/png') converts canvas to PNG image
 *    - Returns: "data:image/png;base64,iVBORw0KG..."
 *    - This can be used as img src or sent to backend
 *    - Backend can extract base64 part and convert to image file
 * 
 * 6. STATE MANAGEMENT:
 *    - isDrawing: Controls whether lines are drawn on mouse move
 *    - hasDrawn: Enables/disables save button
 *    - canvasRef: Direct access to canvas DOM element
 * 
 * 7. WHY WHITE BACKGROUND:
 *    - Without background, canvas is transparent
 *    - When exported to PDF, transparent becomes black
 *    - So we fill with white first using fillRect()
 */