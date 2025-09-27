
import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { XIcon } from './icons/XIcon';

interface ImageState {
  dataUrl: string;
  mimeType: string;
}

interface QueuePanelProps {
  queue: ImageState[];
  onRemove: (index: number) => void;
  isProcessing: boolean;
  progressIndex: number;
}

const QueuePanel: React.FC<QueuePanelProps> = ({ queue, onRemove, isProcessing, progressIndex }) => {
  const t = useTranslations();
  
  if (queue.length === 0) return null;
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-300 mb-2">{t.processingQueueTitle} ({queue.length}):</h3>
      <div className="space-y-2 max-h-32 overflow-y-auto pr-2 -mr-2 border-t border-b border-gray-700 py-2">
        {queue.map((image, index) => (
          <div key={index} className={`flex items-center space-x-2 p-1 rounded-md transition-all ${isProcessing && index === progressIndex - 1 ? 'bg-yellow-900/50 ring-1 ring-yellow-400' : 'bg-gray-700'}`}>
            <img src={image.dataUrl} alt={`Queue item ${index + 1}`} className="w-10 h-10 object-cover rounded-md flex-shrink-0" />
            <span className="text-xs text-gray-300 flex-grow truncate">Item {index + 1}</span>
            {isProcessing && index === progressIndex - 1 && (
                <div className="w-4 h-4 border-2 border-yellow-300 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
            )}
            {!isProcessing && (
              <button 
                onClick={() => onRemove(index)} 
                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-600 transition flex-shrink-0"
                aria-label={`Remove item ${index + 1}`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueuePanel;
