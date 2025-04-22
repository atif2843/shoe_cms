import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const SuccessPopup = ({ message, isVisible, onClose, duration = 3000, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
  const buttonColor = isSuccess ? 'text-green-500 hover:bg-green-100' : 'text-red-500 hover:bg-red-100';
  const buttonRingColor = isSuccess ? 'focus:ring-green-600' : 'focus:ring-red-600';
  const iconBgColor = isSuccess ? 'bg-green-100' : 'bg-red-100';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose}></div>
      <div 
        className={`${bgColor} ${borderColor} ${textColor} px-6 py-5 rounded-xl shadow-xl flex items-center max-w-md relative animate-in fade-in zoom-in-95 duration-300 border`}
        style={{ 
          boxShadow: isSuccess 
            ? '0 10px 25px -5px rgba(16, 185, 129, 0.2), 0 8px 10px -6px rgba(16, 185, 129, 0.1)' 
            : '0 10px 25px -5px rgba(239, 68, 68, 0.2), 0 8px 10px -6px rgba(239, 68, 68, 0.1)'
        }}
      >
        <div className={`flex-shrink-0 rounded-full p-2 ${iconBgColor}`}>
          {isSuccess ? (
            <CheckCircle className={`h-6 w-6 ${iconColor}`} />
          ) : (
            <AlertCircle className={`h-6 w-6 ${iconColor}`} />
          )}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-base font-medium">{message}</p>
        </div>
        <div className="ml-4">
          <button
            onClick={onClose}
            className={`inline-flex rounded-full p-1.5 ${buttonColor} focus:outline-none focus:ring-2 ${buttonRingColor} focus:ring-offset-2 transition-colors`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup; 