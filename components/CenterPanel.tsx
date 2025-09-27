


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ComparisonMode, Pan, ResultItem } from '../types';
import ComparisonSlider from './ComparisonSlider';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ImageIcon } from './icons/ImageIcon';
import { useTranslations } from '../hooks/useTranslations';
import { EditIcon } from './icons/EditIcon';
import { RotateLeft90Icon } from './icons/RotateLeft90Icon';
import { RotateRight90Icon } from './icons/RotateRight90Icon';
import { FlipIcon } from './icons/FlipIcon';
import { CropIcon } from './icons/CropIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { PlusIconCircle } from './icons/PlusIconCircle';
import { MinusIconCircle } from './icons/MinusIconCircle';
import { ResetIcon } from './icons/ResetIcon';
import { IMAGE_FILTERS } from '../constants';
import { ChevronArrowIcon } from './icons/ChevronArrowIcon';

interface CenterPanelProps {
  beforeImage: string | null;
  afterImage: string | null;
  mimeType: string;
  comparisonMode: ComparisonMode;
  setComparisonMode: (mode: ComparisonMode) => void;
  isLoading: boolean;
  error: string | null;
  hasImage: boolean;
  imageDimensions: { width: number; height: number } | null;
  beforeImageDimensions: { width: number; height: number } | null;
  afterImageDimensions: { width: number; height: number } | null;
  onImageEdited: (editedDataUrl: string, mimeType: string) => void;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  selectedResult: ResultItem | null;
  activeFilter: string;
  setActiveFilter: (filterId: string) => void;
}

interface CropBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

const CenterPanel: React.FC<CenterPanelProps> = ({
  beforeImage,
  afterImage,
  mimeType,
  comparisonMode,
  setComparisonMode,
  isLoading,
  error,
  hasImage,
  imageDimensions,
  beforeImageDimensions,
  afterImageDimensions,
  onImageEdited,
  isEditing,
  setIsEditing,
  selectedResult,
  activeFilter,
  setActiveFilter,
}) => {
  const t = useTranslations();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<Pan>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const prevIsEditing = useRef(isEditing);
  const [panGuides, setPanGuides] = useState({ up: false, down: false, left: false, right: false });


  // Edit mode state
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [scaleX, setScaleX] = useState(1); // 1 or -1
  const [straightenAngle, setStraightenAngle] = useState(0); // -15 to 15
  const [editZoom, setEditZoom] = useState(1);
  const [editPan, setEditPan] = useState<Pan>({ x: 0, y: 0 });

  // Box Crop state
  const [isCropping, setIsCropping] = useState(false);
  const [isDrawingCrop, setIsDrawingCrop] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);

  const activeFilterStyle = IMAGE_FILTERS.find(f => f.id === activeFilter)?.style ?? 'none';

  const fitAll = useCallback(() => {
    const masterDimensions = afterImageDimensions || beforeImageDimensions || imageDimensions;
    if (!masterDimensions || !containerRef.current) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
    }
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    if (containerWidth <= 0 || containerHeight <= 0) return;

    let { width: imgWidth, height: imgHeight } = masterDimensions;
    
    // In side-by-side mode, we effectively display two images of the same scaled size next to each other.
    // The scaleCorrection in the render ensures they have the same height, so we calculate total width.
    if (comparisonMode === 'side' && beforeImage && afterImage && !isEditing) {
        imgWidth *= 2;
    }

    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    
    const newZoom = Math.min(scaleX, scaleY) * 0.95;

    setZoom(newZoom > 0 ? newZoom : 1);
    setPan({ x: 0, y: 0 });
  }, [
    afterImageDimensions, 
    beforeImageDimensions, 
    imageDimensions, 
    comparisonMode, 
    beforeImage, 
    afterImage,
    isEditing
  ]);

  const fitToHeight = useCallback(() => {
    const masterDimensions = afterImageDimensions || imageDimensions;
    if (!masterDimensions || !containerRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const containerHeight = containerRef.current.clientHeight;
    if (containerHeight <= 0) return;
    const { height: imgHeight } = masterDimensions;
    const scaleY = containerHeight / imgHeight;
    setZoom(scaleY > 0 ? scaleY : 1);
    setPan({ x: 0, y: 0 });
  }, [afterImageDimensions, imageDimensions]);

  const fitAllForEditing = useCallback(() => {
    const dims = afterImageDimensions || imageDimensions;
    if (!dims || !containerRef.current) {
        setEditZoom(1);
        setEditPan({ x: 0, y: 0 });
        return;
    }

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const { width: imgWidth, height: imgHeight } = dims;

    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;

    const newZoom = Math.min(scaleX, scaleY) * 0.95;

    setEditZoom(newZoom > 0 ? newZoom : 1);
    setEditPan({ x: 0, y: 0 });
  }, [afterImageDimensions, imageDimensions]);
  
  const setZoomAndCenter = (newZoom: number) => {
    setZoom(newZoom);
    setPan({ x: 0, y: 0 });
  }

  // FIX: Moved resetEditState and handleCancelEdits before the useEffect that uses them to fix a declaration error.
  const resetEditState = useCallback(() => {
      setRotation(0);
      setScaleX(1);
      setStraightenAngle(0);
      setEditZoom(1);
      setEditPan({ x: 0, y: 0 });
      setIsCropping(false);
      setIsDrawingCrop(false);
      setCropBox(null);
  }, []);
  
  const handleCancelEdits = useCallback(() => {
      setIsEditing(false);
      resetEditState();
  }, [setIsEditing, resetEditState]);

  useEffect(() => {
    if (hasImage && !isEditing) {
        const timer = setTimeout(() => fitAll(), 50);
        return () => clearTimeout(timer);
    }
  }, [hasImage, afterImage, afterImageDimensions, comparisonMode, isEditing, fitAll]);


  useEffect(() => {
    if (!hasImage) return;
    const handleResize = () => {
        if (isEditing) {
            fitAllForEditing();
        } else {
            fitAll();
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasImage, isEditing, fitAll, fitAllForEditing]);
  
  useEffect(() => {
    if (isEditing) {
      fitAllForEditing();
    } else if (prevIsEditing.current && !isEditing) {
      fitAll();
    }
    prevIsEditing.current = isEditing;
  }, [isEditing, fitAll, fitAllForEditing]);
  
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDrawingCrop) {
          setIsDrawingCrop(false);
          setCropBox(null); 
        } else if (isCropping) {
          setIsCropping(false);
        } else {
          handleCancelEdits();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, isCropping, isDrawingCrop, handleCancelEdits]);
  
  useEffect(() => {
    if (!containerRef.current || isEditing || !hasImage) {
      setPanGuides({ up: false, down: false, left: false, right: false });
      return;
    }

    const dims = afterImageDimensions || beforeImageDimensions || imageDimensions;
    if (!dims) return;
    
    let { width: imgWidth, height: imgHeight } = dims;

    if (comparisonMode === 'side' && beforeImage && afterImage) {
        imgWidth *= 2;
    }

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const displayedWidth = imgWidth * zoom;
    const displayedHeight = imgHeight * zoom;

    if (displayedWidth <= containerWidth && displayedHeight <= containerHeight) {
      setPanGuides({ up: false, down: false, left: false, right: false });
      return;
    }

    const bounds = {
      top: pan.y - displayedHeight / 2,
      bottom: pan.y + displayedHeight / 2,
      left: pan.x - displayedWidth / 2,
      right: pan.x + displayedWidth / 2,
    };

    const containerBounds = {
      top: -containerHeight / 2,
      bottom: containerHeight / 2,
      left: -containerWidth / 2,
      right: containerWidth / 2,
    };

    setPanGuides({
      up: bounds.bottom > containerBounds.bottom,
      down: bounds.top < containerBounds.top,
      left: bounds.right > containerBounds.right,
      right: bounds.left < containerBounds.left,
    });

  }, [pan, zoom, imageDimensions, afterImageDimensions, beforeImageDimensions, isEditing, hasImage, comparisonMode, beforeImage, afterImage]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!hasImage || isCropping) return;
    e.preventDefault();
    const scaleAmount = 0.1;
    const newZoomFunc = (currentZoom: number) => Math.min(Math.max(0.1, currentZoom * (1 - e.deltaY * scaleAmount * 0.1)), 10);
    
    if (isEditing) {
        setEditZoom(newZoomFunc);
    } else {
        setZoom(newZoomFunc);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!hasImage) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if (isCropping) return;
    
    e.preventDefault();
    setIsPanning(true);
    if (isEditing) {
        setStartPan({ x: e.clientX - editPan.x, y: e.clientY - editPan.y });
    } else {
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || isCropping) return;
    e.preventDefault();
    const newPan = { x: e.clientX - startPan.x, y: e.clientY - startPan.y };
    if (isEditing) {
        setEditPan(newPan);
    } else {
        setPan(newPan);
    }
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(false);
  };
  
  const handleApplyEdits = () => {
    const imageToEdit = afterImage;
    if (!imageToEdit) return;
  
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      const transformedCanvas = document.createElement('canvas');
      const transformedCtx = transformedCanvas.getContext('2d');
      if (!transformedCtx) return;
  
      const straightenRad = straightenAngle * (Math.PI / 180);
      const angle = (rotation * Math.PI / 180) + straightenRad;
  
      const { width: w, height: h } = img;
      const absCos = Math.abs(Math.cos(angle));
      const absSin = Math.abs(Math.sin(angle));
      const newWidth = w * absCos + h * absSin;
      const newHeight = w * absSin + h * absCos;
  
      transformedCanvas.width = newWidth;
      transformedCanvas.height = newHeight;
  
      transformedCtx.translate(newWidth / 2, newHeight / 2);
      transformedCtx.rotate(angle);
      transformedCtx.scale(scaleX, 1);
      transformedCtx.drawImage(img, -w / 2, -h / 2);
  
      let sx, sy, sWidth, sHeight;
  
      if (isCropping && cropBox && imageRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        
        const displayedWidth = imageRef.current.clientWidth * editZoom;
        const displayedHeight = imageRef.current.clientHeight * editZoom;
        const displayedX = (containerRect.width - displayedWidth) / 2 + editPan.x;
        const displayedY = (containerRect.height - displayedHeight) / 2 + editPan.y;

        const normCropX = Math.min(cropBox.startX, cropBox.endX) - containerRect.left;
        const normCropY = Math.min(cropBox.startY, cropBox.endY) - containerRect.top;
        const normCropWidth = Math.abs(cropBox.endX - cropBox.startX);
        const normCropHeight = Math.abs(cropBox.endY - cropBox.startY);
  
        sx = ((normCropX - displayedX) / displayedWidth) * newWidth;
        sy = ((normCropY - displayedY) / displayedHeight) * newHeight;
        sWidth = (normCropWidth / displayedWidth) * newWidth;
        sHeight = (normCropHeight / displayedHeight) * newHeight;
  
      } else {
        if (!containerRef.current) return;
        const { clientWidth: containerW, clientHeight: containerH } = containerRef.current;
  
        sWidth = containerW / editZoom;
        sHeight = containerH / editZoom;
        sx = (newWidth - sWidth) / 2 - (editPan.x / editZoom);
        sy = (newHeight - sHeight) / 2 - (editPan.y / editZoom);
      }
      
      sWidth = Math.max(1, sWidth);
      sHeight = Math.max(1, sHeight);
  
      canvas.width = Math.round(sWidth);
      canvas.height = Math.round(sHeight);
  
      ctx.drawImage(
        transformedCanvas,
        sx, sy, sWidth, sHeight,
        0, 0, canvas.width, canvas.height
      );
  
      onImageEdited(canvas.toDataURL(mimeType), mimeType);
      handleCancelEdits();
    };
    img.src = imageToEdit;
  };
  
  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!isCropping) return;
    setIsDrawingCrop(true);
    setCropBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });
  };
  
  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingCrop || !cropBox) return;
    setCropBox({ ...cropBox, endX: e.clientX, endY: e.clientY });
  };
  
  const handleCropMouseUp = () => {
    setIsDrawingCrop(false);
  };

  const getCropBoxStyle = (): React.CSSProperties => {
    if (!cropBox) return { display: 'none' };
    const left = Math.min(cropBox.startX, cropBox.endX);
    const top = Math.min(cropBox.startY, cropBox.endY);
    const width = Math.abs(cropBox.endX - cropBox.startX);
    const height = Math.abs(cropBox.endY - cropBox.startY);
    return {
        position: 'fixed',
        left,
        top,
        width,
        height,
        border: `2px dashed #facc15`,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        pointerEvents: 'none',
        zIndex: 45,
    };
  };

  const isComparisonDisabled = selectedResult?.prompt === 'Image Edited' || selectedResult?.resultType === 'video';
  const singleImage = afterImage || beforeImage;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <SpinnerIcon className="h-16 w-16 animate-spin text-yellow-400" />
          <p className="mt-4 text-lg">{t.processingMessage}</p>
          <p className="text-sm">{t.processingSubMessage}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 bg-red-900/20 p-8 rounded-lg">
          <p className="font-bold text-lg mb-2">{t.errorTitle}</p>
          <p className="text-center">{error}</p>
        </div>
      );
    }

    if (!hasImage) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <ImageIcon className="h-24 w-24 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-300">{t.uploadPromptTitle}</h2>
          <p>{t.uploadPromptSubtitle}</p>
        </div>
      );
    }
    
    if (selectedResult?.resultType === 'video' && selectedResult.videoUrl) {
      return (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
              <video
                  key={selectedResult.id}
                  src={selectedResult.videoUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      filter: activeFilterStyle,
                  }}
                  className="rounded-lg shadow-lg"
              />
          </div>
      );
    }

    if (beforeImage && afterImage && comparisonMode === 'slider' && !isEditing) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <ComparisonSlider 
            before={beforeImage} 
            after={afterImage} 
            zoom={zoom} 
            pan={pan}
            beforeImageDimensions={beforeImageDimensions}
            afterImageDimensions={afterImageDimensions}
            onPanMouseDown={handleMouseDown}
            isPanning={isPanning}
            activeFilterStyle={activeFilterStyle}
          />
        </div>
      );
    }
    
    if (beforeImage && afterImage && comparisonMode === 'side' && !isEditing) {
      const scaleCorrection = (beforeImageDimensions && afterImageDimensions && beforeImageDimensions.width > 0)
        ? afterImageDimensions.width / beforeImageDimensions.width
        : 1;

      const baseTransform = `translate(${pan.x}px, ${pan.y}px)`;
      const baseStyle: Omit<React.CSSProperties, 'transform' | 'filter'> = {
          transition: isPanning ? 'none' : 'transform 0.1s',
          maxWidth: 'none',
          maxHeight: 'none',
          width: 'auto',
          height: 'auto',
      };

      const beforeTransformStyle: React.CSSProperties = {
          ...baseStyle,
          transform: `${baseTransform} scale(${zoom * scaleCorrection})`,
          filter: activeFilterStyle,
      };
      
      const afterTransformStyle: React.CSSProperties = {
          ...baseStyle,
          transform: `${baseTransform} scale(${zoom})`,
          filter: activeFilterStyle,
      };

      return (
        <div className="grid grid-cols-2 gap-4 w-full h-full p-4">
          <div className="flex flex-col items-center justify-start overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute top-2 left-2 z-10 bg-black/50 text-gray-100 text-sm px-2 py-1 rounded-md pointer-events-none">
                <h3 className="font-semibold">{t.beforeLabel}</h3>
                {beforeImageDimensions && (
                    <p className="text-xs text-gray-300">{`${beforeImageDimensions.width} x ${beforeImageDimensions.height} px`}</p>
                )}
              </div>
              <img key={beforeImage} src={beforeImage} alt={t.beforeLabel} style={beforeTransformStyle} className="object-contain rounded-lg shadow-md" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-start overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute top-2 left-2 z-10 bg-black/50 text-sm px-2 py-1 rounded-md pointer-events-none">
                <h3 className="font-semibold text-yellow-300">{t.afterLabel}</h3>
                 {afterImageDimensions && (
                    <p className="text-xs text-gray-100">{`${afterImageDimensions.width} x ${afterImageDimensions.height} px`}</p>
                 )}
              </div>
              <img key={afterImage} src={afterImage} alt={t.afterLabel} style={afterTransformStyle} className="object-contain rounded-lg shadow-md" />
            </div>
          </div>
        </div>
      )
    }

    if (singleImage) {
        const staticTransform = `rotate(${rotation}deg) scaleX(${scaleX}) rotate(${straightenAngle}deg)`;
        const viewTransform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
        const editViewTransform = `translate(${editPan.x}px, ${editPan.y}px) scale(${editZoom})`;

        const transformStyle: React.CSSProperties = { 
            transform: isEditing ? `${editViewTransform} ${staticTransform}` : viewTransform,
            transition: isPanning ? 'none' : 'transform 0.1s',
            maxWidth: 'none',
            maxHeight: 'none',
            width: 'auto',
            height: 'auto',
            filter: isEditing ? 'none' : activeFilterStyle,
        };

        return (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
                <img ref={imageRef} src={singleImage} alt="Display" style={transformStyle} className="object-contain rounded-lg shadow-lg"/>
            </div>
        );
    }

    return null;
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-4 bg-gray-900 relative">
      {isCropping && <div style={getCropBoxStyle()}></div>}
      {isEditing && (
         <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 p-2 flex justify-center items-center space-x-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
             <button title={t.rotateLeft90Title} onClick={() => setRotation(r => (r - 90 + 360) % 360)} className="p-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-gray-100 transition"><RotateLeft90Icon className="w-5 h-5"/></button>
             <button title={t.rotateRight90Title} onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-gray-100 transition"><RotateRight90Icon className="w-5 h-5"/></button>
             <button title={t.flipTitle} onClick={() => setScaleX(s => s * -1)} className="p-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-gray-100 transition"><FlipIcon className="w-5 h-5"/></button>
             <div className="w-px h-6 bg-gray-600"></div>
              <button title={t.zoomOutTitle} onClick={() => setEditZoom(z => Math.max(0.1, z / 1.1))} className="p-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-gray-100 transition"><MinusIconCircle className="w-5 h-5"/></button>
              <button title={t.zoomInTitle} onClick={() => setEditZoom(z => Math.min(10, z * 1.1))} className="p-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-gray-100 transition"><PlusIconCircle className="w-5 h-5"/></button>
             <div className="w-px h-6 bg-gray-600"></div>
             <div className="flex items-center space-x-2">
                 <label htmlFor="straighten" className="text-sm text-gray-300">{t.straightenLabel}</label>
                 <input type="range" id="straighten" min="-15" max="15" step="0.5" value={straightenAngle} onChange={e => setStraightenAngle(parseFloat(e.target.value))} className="w-32"/>
                 <span className="text-xs w-12 text-gray-400 text-center">{straightenAngle.toFixed(1)}°</span>
             </div>
             <div className="w-px h-6 bg-gray-600"></div>
             <button title={t.cropTitle} onClick={() => setIsCropping(c => !c)} className={`p-2 rounded-md transition ${isCropping ? 'bg-yellow-400 text-gray-900' : 'text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-gray-100'}`}><CropIcon className="w-5 h-5"/></button>
             <div className="w-px h-6 bg-gray-600"></div>
             <button title={t.resetEditsTitle} onClick={resetEditState} className="p-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-gray-100 transition"><ResetIcon className="w-5 h-5"/></button>
             <button title={t.cancelEditsTitle} onClick={handleCancelEdits} className="p-2 text-gray-300 bg-gray-700 rounded-md hover:bg-red-500 hover:text-white transition"><XIcon className="w-5 h-5"/></button>
             <button title={t.applyEditsTitle} onClick={handleApplyEdits} className="p-2 text-gray-900 bg-yellow-400 rounded-md hover:bg-yellow-300 transition"><CheckIcon className="w-5 h-5"/></button>
         </div>
      )}
      <div 
        ref={containerRef}
        className={`w-full flex-grow bg-black/20 rounded-lg flex items-center justify-center overflow-hidden shadow-2xl relative ${hasImage && selectedResult?.resultType !== 'video' ? (isCropping ? 'cursor-crosshair' : (isPanning ? 'cursor-grabbing' : 'cursor-grab')) : 'cursor-default'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        {isCropping && (
            <div 
                className="absolute inset-0 z-40"
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
            />
        )}
        {renderContent()}

        {/* Pan Guides */}
        {hasImage && !isEditing && selectedResult?.resultType !== 'video' && (
            <>
                {/* Guide to Pan Left (arrow on right edge) */}
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 transition-opacity duration-300 pointer-events-none ${isPanning && panGuides.left ? 'opacity-75' : 'opacity-0'}`}>
                    <ChevronArrowIcon className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
                {/* Guide to Pan Right (arrow on left edge) */}
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 transition-opacity duration-300 pointer-events-none ${isPanning && panGuides.right ? 'opacity-75' : 'opacity-0'}`}>
                    <ChevronArrowIcon className="w-10 h-10 text-white drop-shadow-lg transform rotate-180" />
                </div>
                {/* Guide to Pan Up (arrow on bottom edge) */}
                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 p-2 transition-opacity duration-300 pointer-events-none ${isPanning && panGuides.up ? 'opacity-75' : 'opacity-0'}`}>
                    <ChevronArrowIcon className="w-10 h-10 text-white drop-shadow-lg transform rotate-90" />
                </div>
                {/* Guide to Pan Down (arrow on top edge) */}
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 p-2 transition-opacity duration-300 pointer-events-none ${isPanning && panGuides.down ? 'opacity-75' : 'opacity-0'}`}>
                    <ChevronArrowIcon className="w-10 h-10 text-white drop-shadow-lg transform -rotate-90" />
                </div>
            </>
        )}
      </div>
      {hasImage && !isEditing && (
        <div className="flex-shrink-0 mt-4 z-10 p-2 flex flex-col justify-center items-center flex-wrap gap-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-center items-center flex-wrap gap-2">
              <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setIsEditing(true)} disabled={selectedResult?.resultType === 'video'} className={`px-3 py-1 text-sm rounded-md transition whitespace-nowrap bg-gray-700 text-gray-300 hover:bg-gray-600 flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed`}>
                <EditIcon className="w-4 h-4" />
                <span>{t.editBtn}</span>
              </button>
              <div className="w-px h-5 bg-gray-600 mx-1"></div>
              <span className='text-sm font-medium text-gray-300 whitespace-nowrap'>{t.viewLabel}:</span>
              <button 
                onMouseDown={(e) => e.stopPropagation()} 
                onClick={() => setComparisonMode('slider')} 
                disabled={isComparisonDisabled}
                className={`px-3 py-1 text-sm rounded-md transition whitespace-nowrap ${comparisonMode === 'slider' && !isComparisonDisabled ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} disabled:opacity-40 disabled:cursor-not-allowed`}
              >{t.sliderBtn}</button>
              <button 
                onMouseDown={(e) => e.stopPropagation()} 
                onClick={() => setComparisonMode('side')} 
                disabled={isComparisonDisabled}
                className={`px-3 py-1 text-sm rounded-md transition whitespace-nowrap ${comparisonMode === 'side' && !isComparisonDisabled ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} disabled:opacity-40 disabled:cursor-not-allowed`}
                >{t.sideBySideBtn}</button>
              <div className="w-px h-5 bg-gray-600 mx-1"></div>
              <span className='text-sm font-medium text-gray-300 whitespace-nowrap'>{t.zoomLabel}:</span>
              <button onMouseDown={(e) => e.stopPropagation()} onClick={fitAll} className="px-3 py-1 text-sm rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 whitespace-nowrap">{t.fitBtn}</button>
              <button onMouseDown={(e) => e.stopPropagation()} onClick={fitToHeight} className="px-3 py-1 text-sm rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 whitespace-nowrap">{t.fitHBtn}</button>
              <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setZoomAndCenter(1)} className="px-3 py-1 text-sm rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 whitespace-nowrap">100%</button>
               <span className='text-sm w-16 text-left font-medium text-gray-400 ml-1 whitespace-nowrap'>({(zoom * 100).toFixed(0)}%)</span>
            </div>
            <div className="w-full h-px bg-gray-700 my-2"></div>
            <div className="flex justify-center items-center flex-wrap gap-2">
              <span className='text-sm font-medium text-gray-300 whitespace-nowrap mr-2'>{t.filtersTitle}:</span>
              {IMAGE_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`px-3 py-1 text-sm rounded-md transition whitespace-nowrap ${
                    activeFilter === filter.id
                      ? 'bg-yellow-400 text-gray-900 font-semibold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t[filter.nameKey as keyof typeof t] || filter.id}
                </button>
              ))}
            </div>
        </div>
      )}
    </main>
  );
};

export default CenterPanel;