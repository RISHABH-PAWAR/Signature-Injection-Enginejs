import React, { useState, useRef, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';

const DraggableField = ({ field, containerDimensions, onUpdate, onDelete, onClick }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.value || '');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
  const fieldRef = useRef(null);

  
  const handleMouseDown = (e) => {
  
    if (e.target.classList.contains('resize-handle') || 
        e.target.classList.contains('delete-btn') ||
        e.target.classList.contains('edit-btn') ||
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'BUTTON') {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    // Get current position
    const parentRect = fieldRef.current.parentElement.getBoundingClientRect();
    const fieldRect = fieldRef.current.getBoundingClientRect();
    
    // Calculate offset from mouse to field's top-left corner
    const offsetX = e.clientX - fieldRect.left;
    const offsetY = e.clientY - fieldRect.top;
    
    setDragStart({ x: offsetX, y: offsetY });
    setInitialPos({ x: field.x, y: field.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !fieldRef.current) return;
    
    e.preventDefault();
    
    const parentRect = fieldRef.current.parentElement.getBoundingClientRect();
    
    // Calculate new position relative to parent
    const newX = e.clientX - parentRect.left - dragStart.x;
    const newY = e.clientY - parentRect.top - dragStart.y;
    
    // Convert to percentage
    const percentX = (newX / parentRect.width) * 100;
    const percentY = (newY / parentRect.height) * 100;

    // Ensure field stays within bounds
    const boundedX = Math.max(0, Math.min(percentX, 100 - field.width));
    const boundedY = Math.max(0, Math.min(percentY, 100 - field.height));

    onUpdate(field.id, {
      x: boundedX,
      y: boundedY
    });
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    }
  };

  // Resizing logic
  const handleResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleResizeMove = (e) => {
    if (!isResizing || !fieldRef.current) return;
    
    e.preventDefault();
    
    const parentRect = fieldRef.current.parentElement.getBoundingClientRect();
    const fieldRect = fieldRef.current.getBoundingClientRect();
    
    const newWidth = ((e.clientX - fieldRect.left) / parentRect.width) * 100;
    const newHeight = ((e.clientY - fieldRect.top) / parentRect.height) * 100;

    onUpdate(field.id, {
      width: Math.max(5, Math.min(newWidth, 50)),
      height: Math.max(3, Math.min(newHeight, 30))
    });
  };

  const handleResizeEnd = (e) => {
    if (isResizing) {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(false);
    }
  };

  // Event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, field.x, field.y, field.width, field.height]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  // Field type styling
  const getFieldColor = () => {
    const colors = {
      signature: 'bg-blue-200 border-blue-500',
      text: 'bg-green-200 border-green-500',
      image: 'bg-purple-200 border-purple-500',
      date: 'bg-yellow-200 border-yellow-500',
      radio: 'bg-pink-200 border-pink-500'
    };
    return colors[field.type] || 'bg-gray-200 border-gray-500';
  };

  const getFieldIcon = () => {
    const icons = {
      signature: '✍️',
      text: 'T',
      image: '🖼️',
      date: '📅',
      radio: '⭕'
    };
    return icons[field.type] || '?';
  };

  // Handle field click
  const handleClick = (e) => {
    if (isDragging || isResizing) return;
    
    if (e.target.classList.contains('delete-btn') || 
        e.target.classList.contains('edit-btn') ||
        e.target.classList.contains('resize-handle')) {
      return;
    }
    
    if (field.type === 'signature' && !field.value) {
      onClick(field.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(field.value || '');
  };

  const handleSaveEdit = () => {
    onUpdate(field.id, { value: editValue });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(field.value || '');
    setIsEditing(false);
  };

  const handleDateChange = (e) => {
    e.stopPropagation();
    onUpdate(field.id, { value: e.target.value });
  };

 
  const handleRadioChange = (e) => {
    e.stopPropagation();
    onUpdate(field.id, { value: e.target.value });
  };

  const handleImageUpload = (e) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdate(field.id, { value: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const renderFieldContent = () => {
    if (isEditing && field.type === 'text') {
      return (
        <div className="flex flex-col gap-1 p-1 w-full" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
          <div className="flex gap-1">
            <button
              onClick={handleSaveEdit}
              className="flex-1 bg-green-500 text-white text-xs py-0.5 rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 bg-gray-500 text-white text-xs py-0.5 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    switch (field.type) {
      case 'signature':
        return field.value ? (
          <img 
            src={field.value} 
            alt="Signature" 
            className="max-w-full max-h-full object-contain p-1"
          />
        ) : (
          <span className="text-xs font-semibold text-center">
            {getFieldIcon()} Click to Sign
          </span>
        );

      case 'text':
        return field.value ? (
          <div className="flex items-center justify-between w-full px-2">
            <span className="text-xs truncate flex-1">{field.value}</span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-center">
            {getFieldIcon()} Text Field
          </span>
        );

      case 'image':
        return field.value ? (
          <img 
            src={field.value} 
            alt="Uploaded" 
            className="max-w-full max-h-full object-contain p-1"
          />
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center h-full" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-semibold text-center">
              {getFieldIcon()} Click to Upload
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            value={field.value || ''}
            onChange={handleDateChange}
            className="w-full h-full px-1 text-xs border-0 bg-transparent cursor-pointer"
          />
        );

      case 'radio':
        return (
          <div className="flex items-center gap-1 px-2 w-full" onClick={(e) => e.stopPropagation()}>
            <select
              value={field.value || 'option1'}
              onChange={handleRadioChange}
              className="flex-1 text-xs border-0 bg-transparent cursor-pointer outline-none"
            >
              {(field.options || ['Option 1', 'Option 2', 'Option 3']).map((opt, idx) => (
                <option key={idx} value={`option${idx + 1}`}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return <span className="text-xs">{field.type}</span>;
    }
  };

  return (
    <div
      ref={fieldRef}
      className={`absolute border-2 ${getFieldColor()} ${
        isDragging ? 'opacity-70 z-50 cursor-grabbing' : 'opacity-80 z-10 cursor-grab'
      } hover:opacity-90 transition-opacity group select-none`}
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}%`,
        height: `${field.height}%`,
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Delete Button */}
      <button
        className="delete-btn absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(field.id);
        }}
      >
        <X size={12} />
      </button>

      {/* Edit Button (for text and radio fields) */}
      {(field.type === 'text' || field.type === 'radio') && !isEditing && (
        <button
          className="edit-btn absolute -top-2 -right-8 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 z-10"
          onClick={handleEdit}
        >
          <Edit2 size={12} />
        </button>
      )}

      {/* Field Content */}
      <div className="flex items-center justify-center h-full w-full overflow-hidden pointer-events-none">
        <div className="pointer-events-auto w-full h-full flex items-center justify-center">
          {renderFieldContent()}
        </div>
      </div>
      
      {/* Resize Handle */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-3 h-3 bg-gray-700 cursor-se-resize hover:bg-gray-900 transition-colors z-20"
        onMouseDown={handleResize}
      />
    </div>
  );
};

export default DraggableField;