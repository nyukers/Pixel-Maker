import React, { useState, useCallback, useEffect } from 'react';
import { ResultItem, ComparisonMode, PromptMode } from './types';
import { restorePhoto, reanimateImage } from './services/geminiService';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import { PRESET_PROMPTS, REIMAGINE_PRESET_PROMPTS, IMAGE_FILTERS, REANIMATING_MESSAGES, REANIMATE_PRESET_PROMPTS } from './constants';
import SettingsModal from './components/SettingsModal';
import UpscalingModal from './components/UpscalingModal';
import ReanimatingModal from './components/ReanimatingModal';

interface ImageState {
  dataUrl: string;
  mimeType: string;
}

const COOLDOWN_SECONDS = 60;

const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = (err) => {
          console.error("Failed to load image for dimension check", err);
          reject(new Error("Failed to get image dimensions."));
      }
      img.src = dataUrl;
    });
};

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null);
  const [processingImage, setProcessingImage] = useState<ImageState | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>(PRESET_PROMPTS[0].prompt);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider');
  const [error, setError] = useState<string | null>(null);
  const [promptMode, setPromptMode] = useState<PromptMode>('retouch');
  const [customPrompts, setCustomPrompts] = useState<{ retouch: string[], reimagine: string[], reanimate: string[] }>({ retouch: [], reimagine: [], reanimate: [] });
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [beforeImageDimensions, setBeforeImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [afterImageDimensions, setAfterImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [quotaCooldownEnd, setQuotaCooldownEnd] = useState<number | null>(null);
  const [timeNow, setTimeNow] = useState(() => Date.now());
  const [imageQueue, setImageQueue] = useState<ImageState[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [currentBatchProgress, setCurrentBatchProgress] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const [reanimationState, setReanimationState] = useState<{ isReanimating: boolean; message: string }>({ isReanimating: false, message: '' });
  const [animationPrompt, setAnimationPrompt] = useState<string>(REANIMATE_PRESET_PROMPTS[0].prompt);

  useEffect(() => {
    try {
      const savedPrompts = localStorage.getItem('customPrompts');
      if (savedPrompts) {
        const parsed = JSON.parse(savedPrompts);
        const defaults = { retouch: [], reimagine: [], reanimate: [] };
        if (Array.isArray(parsed)) {
          // Handles legacy format where it was just an array of strings for retouch
          setCustomPrompts({ ...defaults, retouch: parsed });
        } else if (parsed && typeof parsed === 'object') {
          // Handles current format and merges, ensuring all keys are present
          setCustomPrompts({ ...defaults, ...parsed });
        }
      }
    } catch (e) {
      console.error("Failed to load custom prompts from localStorage", e);
    }
  }, []);
  
  useEffect(() => {
    let timer: number | undefined;
    if (quotaCooldownEnd && timeNow < quotaCooldownEnd) {
      timer = setInterval(() => setTimeNow(Date.now()), 1000) as unknown as number;
    } else if (quotaCooldownEnd && timeNow >= quotaCooldownEnd) {
      setQuotaCooldownEnd(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quotaCooldownEnd, timeNow]);

  const updateAndSelectResult = useCallback(async (result: ResultItem | null) => {
      setSelectedResult(result);
      
      if (!result) {
          setBeforeImageDimensions(null);
          setAfterImageDimensions(null);
          setImageDimensions(null);
          return;
      }
      
      const beforeUrl = result.sourceImageUrl ?? originalImage?.dataUrl ?? null;
      const afterUrl = result.imageUrl;

      try {
          const beforeDims = beforeUrl ? await getImageDimensions(beforeUrl) : null;
          const afterDims = afterUrl ? await getImageDimensions(afterUrl) : null;
          setBeforeImageDimensions(beforeDims);
          setAfterImageDimensions(afterDims);
          setImageDimensions(afterDims ?? beforeDims);
      } catch (e) {
          setError("Could not load image properties.");
          setBeforeImageDimensions(null);
          setAfterImageDimensions(null);
          setImageDimensions(null);
      }
  }, [originalImage?.dataUrl]);

  const saveCustomPrompts = (prompts: { retouch: string[], reimagine: string[], reanimate: string[] }) => {
    try {
      localStorage.setItem('customPrompts', JSON.stringify(prompts));
    } catch (e) {
      console.error("Failed to save custom prompts to localStorage", e);
    }
  };

  const addCustomPrompt = (newPrompt: string) => {
    // The check against presets is now handled by disabling the button in LeftPanel.
    const currentModePrompts = customPrompts[promptMode];
    if (newPrompt && !currentModePrompts.includes(newPrompt)) {
      const updatedPrompts = {
        ...customPrompts,
        [promptMode]: [...currentModePrompts, newPrompt]
      };
      setCustomPrompts(updatedPrompts);
      saveCustomPrompts(updatedPrompts);
    }
  };

  const deleteCustomPrompt = (promptToDelete: string) => {
    const updatedPrompts = {
      ...customPrompts,
      [promptMode]: customPrompts[promptMode].filter(p => p !== promptToDelete)
    };
    setCustomPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts);
  };
  
  const handleClearAll = useCallback(() => {
    setOriginalImage(null);
    setProcessingImage(null);
    setResults([]);
    setSelectedResult(null);
    setError(null);
    setPrompt(PRESET_PROMPTS[0].prompt);
    setImageDimensions(null);
    setBeforeImageDimensions(null);
    setAfterImageDimensions(null);
    setPromptMode('retouch');
    setComparisonMode('slider');
    setQuotaCooldownEnd(null);
    setImageQueue([]);
    setIsBatchProcessing(false);
    setCurrentBatchProgress(0);
    setActiveFilter('none');
  }, []);

  const handleImagesUpload = async (images: ImageState[]) => {
    handleClearAll();
    
    if (images.length === 0) return;

    setImageQueue(images);
    const firstImage = images[0];
    setOriginalImage(firstImage);
    setProcessingImage(firstImage);
    
    const originalResult: ResultItem = {
        id: `original-${Date.now()}`,
        imageUrl: firstImage.dataUrl,
        mimeType: firstImage.mimeType,
        prompt: "Original Image",
        sourceImageUrl: firstImage.dataUrl,
        resultType: 'image',
    };
    setResults([originalResult]);
    await updateAndSelectResult(originalResult);
  };
  
  const startBatchProcess = () => {
    const source = imageQueue.length > 0 ? imageQueue : (processingImage ? [processingImage] : []);
    if (source.length === 0 || isBatchProcessing) return;
    
    // If not already a queue, create one from the single processing image
    if (imageQueue.length === 0 && processingImage) {
        setImageQueue([processingImage]);
    }

    setCurrentBatchProgress(1);
    setIsBatchProcessing(true);
  };
  
  const cancelBatchProcess = () => {
      setIsBatchProcessing(false);
      setCurrentBatchProgress(0);
  };
  
  const handleRemoveFromQueue = (indexToRemove: number) => {
      const newQueue = imageQueue.filter((_, index) => index !== indexToRemove);
      setImageQueue(newQueue);
      if (newQueue.length === 0) {
          handleClearAll();
      } else if (originalImage?.dataUrl === imageQueue[indexToRemove].dataUrl) {
          // If the removed image was the main preview, update the preview
          const firstImage = newQueue[0];
          setOriginalImage(firstImage);
          setProcessingImage(firstImage);
          const originalResult: ResultItem = {
              id: `original-${Date.now()}`,
              imageUrl: firstImage.dataUrl,
              mimeType: firstImage.mimeType,
              prompt: "Original Image",
              sourceImageUrl: firstImage.dataUrl,
              resultType: 'image',
          };
          setResults([originalResult]);
          updateAndSelectResult(originalResult);
      }
  };
  
  useEffect(() => {
    if (!isBatchProcessing || imageQueue.length === 0 || currentBatchProgress > imageQueue.length) {
      if(isBatchProcessing) { 
        setIsBatchProcessing(false);
      }
      return;
    }
  
    const processItem = async () => {
      const itemIndex = currentBatchProgress - 1;
      const imageToProcess = imageQueue[itemIndex];
      const base64Data = imageToProcess.dataUrl.split(',')[1];
  
      setIsLoading(true); // Indicates an item is processing
      setError(null);
      try {
        const result = await restorePhoto(base64Data, imageToProcess.mimeType, prompt);
        if (result) {
          const newResult: ResultItem = {
            id: `res-${Date.now()}-${itemIndex}`,
            imageUrl: result.imageUrl,
            mimeType: result.mimeType,
            prompt: prompt,
            sourceImageUrl: imageToProcess.dataUrl,
            resultType: 'image',
          };
          setResults(prev => [newResult, ...prev]);
          if (comparisonMode === 'single') setComparisonMode('slider');
          await updateAndSelectResult(newResult);
        } else {
          throw new Error(`The model did not return an image for item ${itemIndex + 1}.`);
        }
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred.';
        setError(errorMessage.replace('QUOTA_EXCEEDED: ', ''));
        console.error(err);
        
        const failedResult: ResultItem = {
          id: `failed-${Date.now()}-${itemIndex}`,
          imageUrl: imageToProcess.dataUrl,
          mimeType: imageToProcess.mimeType,
          prompt: `Failed: ${prompt}`,
          sourceImageUrl: imageToProcess.dataUrl,
          resultType: 'image',
        };
        setResults(prev => [failedResult, ...prev]);
        
        if (errorMessage.startsWith('QUOTA_EXCEEDED:')) {
           setQuotaCooldownEnd(Date.now() + COOLDOWN_SECONDS * 1000);
           setIsBatchProcessing(false);
           return;
        }
      } finally {
        if (currentBatchProgress >= imageQueue.length) {
            setIsBatchProcessing(false);
            setIsLoading(false);
        }
        setCurrentBatchProgress(p => p + 1); 
      }
    };
  
    processItem();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBatchProcessing, currentBatchProgress]);


  const handleUseResultAsSource = async (result: ResultItem) => {
    setImageQueue([]);
    setProcessingImage({ dataUrl: result.imageUrl, mimeType: result.mimeType });
    setPromptMode('reimagine'); 
    await updateAndSelectResult(result);
  };
  
  const handleResetToOriginal = async () => {
    if (originalImage) {
      setProcessingImage(originalImage);
      setImageQueue([]);
      const originalResultItem = results.find(r => r.prompt === "Original Image" && r.imageUrl === originalImage.dataUrl);
      if (originalResultItem) {
          await updateAndSelectResult(originalResultItem);
      } else {
         const newOriginalResult: ResultItem = {
            id: `original-${Date.now()}`,
            imageUrl: originalImage.dataUrl,
            mimeType: originalImage.mimeType,
            prompt: "Original Image",
            sourceImageUrl: originalImage.dataUrl,
            resultType: 'image',
         };
         setResults(prev => [newOriginalResult, ...prev.filter(r => r.prompt !== 'Original Image')]);
         await updateAndSelectResult(newOriginalResult);
      }
    }
  };
  
  const handleSelectResultForView = async (result: ResultItem) => {
    if (result.prompt === 'Image Edited' || result.resultType === 'video') {
        setComparisonMode('single');
    } else if (comparisonMode === 'single') {
        setComparisonMode('slider');
    }
    await updateAndSelectResult(result);
  }

  const handleImageEdited = async (editedDataUrl: string, mimeType: string) => {
    const newResult: ResultItem = {
      id: `edit-${Date.now()}`,
      imageUrl: editedDataUrl,
      mimeType: mimeType,
      prompt: "Image Edited",
      sourceImageUrl: processingImage?.dataUrl,
      resultType: 'image',
    };
    
    setResults(prev => [newResult, ...prev]);
    setImageQueue([]);
    setProcessingImage({ dataUrl: newResult.imageUrl, mimeType: newResult.mimeType });
    setComparisonMode('single');
    await updateAndSelectResult(newResult);
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const getFilteredDataUrl = (imageUrl: string, mimeType: string, filterStyle: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (filterStyle === 'none') {
            resolve(imageUrl);
            return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context."));
                return;
            }
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.filter = filterStyle;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL(mimeType, 1.0));
        };
        img.onerror = () => reject(new Error("Failed to load image for filtering."));
        img.src = imageUrl;
    });
  };

  const handleDownloadResult = async (result: ResultItem) => {
    if (result.resultType === 'video' && result.videoUrl) {
      // Filters are preview-only for videos.
      triggerDownload(result.videoUrl, `reanimated-${result.id}.mp4`);
      return;
    }

    const filter = IMAGE_FILTERS.find(f => f.id === activeFilter);
    const filterStyle = filter ? filter.style : 'none';
    const suffix = filter && filter.id !== 'none' ? `-${filter.id}` : '';
    
    try {
        const dataUrl = await getFilteredDataUrl(result.imageUrl, result.mimeType, filterStyle);
        triggerDownload(dataUrl, `restored-${result.id}${suffix}.png`);
    } catch (e) {
        console.error(e);
        setError("Failed to apply filter for download.");
    }
  };
  
  const handleDownloadAllResults = () => {
    const downloadableResults = results.filter(
        r => r.resultType === 'image' && r.prompt !== "Original Image" && r.prompt !== "Image Edited" && !r.prompt.startsWith("Failed:")
    ).reverse(); 
    
    downloadableResults.forEach((result, index) => {
        setTimeout(() => {
            triggerDownload(result.imageUrl, `restored-${result.id}-batch-${index + 1}.png`);
        }, index * 300);
    });
  };

  const handleReanimateImage = async (sourceResult: ResultItem, prompt: string) => {
    setReanimationState({ isReanimating: true, message: REANIMATING_MESSAGES[0] });
    setError(null);

    let messageInterval: number | undefined;
    
    const onProgress = (apiMessage: string) => {
        console.log("Reanimation progress:", apiMessage);
    };

    try {
        let messageIndex = 0;
        messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % REANIMATING_MESSAGES.length;
            setReanimationState(prev => ({ ...prev, message: REANIMATING_MESSAGES[messageIndex] }));
        }, 7000) as unknown as number;

        const base64Data = sourceResult.imageUrl.split(',')[1];
        const videoBlobUrl = await reanimateImage(base64Data, sourceResult.mimeType, prompt, onProgress);
        
        const presetUsed = REANIMATE_PRESET_PROMPTS.find(p => p.prompt === prompt);
        
        const newVideoResult: ResultItem = {
            id: `vid-${Date.now()}`,
            imageUrl: sourceResult.imageUrl, // Use original image as thumbnail
            videoUrl: videoBlobUrl,
            mimeType: 'video/mp4',
            prompt: presetUsed ? presetUsed.nameKey : prompt,
            sourceImageUrl: sourceResult.imageUrl,
            resultType: 'video',
        };

        setResults(prev => [newVideoResult, ...prev]);
        await handleSelectResultForView(newVideoResult);

    } catch (err: any) {
        setError(err.message || "Failed to reanimate the image.");
        console.error(err);
    } finally {
        if(messageInterval) clearInterval(messageInterval);
        setReanimationState({ isReanimating: false, message: '' });
    }
  };

  const handleProcess = () => {
    if (promptMode === 'reanimate') {
        let sourceResult: ResultItem | undefined;

        // Prioritize the currently selected result, if it's an image
        if (selectedResult && selectedResult.resultType === 'image') {
            sourceResult = selectedResult;
        } 
        // Fallback to the main processing image
        else if (processingImage) {
            sourceResult = {
                id: `source-${Date.now()}`,
                imageUrl: processingImage.dataUrl,
                mimeType: processingImage.mimeType,
                prompt: "Source for Reanimation",
                resultType: 'image'
            };
        }

        if (sourceResult) {
            setImageQueue([]); // Reanimation is a single-image process, clear any batch queue
            handleReanimateImage(sourceResult, animationPrompt);
        } else {
            setError("Please upload an image to reanimate.");
        }
    } else {
        startBatchProcess();
    }
  };

  const upscaleAndDownload = (result: ResultItem) => {
    setIsUpscaling(true);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsUpscaling(false);
            setError("Could not create canvas context for upscaling.");
            return;
        }

        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.filter = 'contrast(105%) saturate(105%) brightness(102%)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';

        const upscaledDataUrl = canvas.toDataURL(result.mimeType, 1.0);
        
        const filter = IMAGE_FILTERS.find(f => f.id === activeFilter);
        const filterStyle = filter ? filter.style : 'none';
        const suffix = filter && filter.id !== 'none' ? `-${filter.id}` : '';

        getFilteredDataUrl(upscaledDataUrl, result.mimeType, filterStyle)
            .then(finalDataUrl => {
                triggerDownload(finalDataUrl, `restored-${result.id}-2x${suffix}.png`);
            })
            .catch(e => {
                console.error(e);
                setError("Failed to apply filter after upscaling.");
            })
            .finally(() => {
                setIsUpscaling(false);
            });
    };
    img.onerror = () => {
        setIsUpscaling(false);
        setError("Failed to load image for upscaling.");
    }
    img.src = result.imageUrl;
  };

  const cooldownRemaining = quotaCooldownEnd ? Math.max(0, Math.ceil((quotaCooldownEnd - timeNow) / 1000)) : 0;
  const isQuotaLimited = cooldownRemaining > 0;
  const isAnythingLoading = isLoading || reanimationState.isReanimating;

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <UpscalingModal isOpen={isUpscaling} />
      <ReanimatingModal isOpen={reanimationState.isReanimating} message={reanimationState.message} />
      <LeftPanel
        onImagesUpload={handleImagesUpload}
        processingImageUrl={processingImage?.dataUrl}
        prompt={prompt}
        setPrompt={setPrompt}
        onProcess={handleProcess}
        isLoading={isAnythingLoading}
        hasImage={!!originalImage}
        onReset={handleResetToOriginal}
        isProcessingOriginal={originalImage?.dataUrl === processingImage?.dataUrl}
        customPrompts={customPrompts[promptMode]}
        onAddCustomPrompt={addCustomPrompt}
        onDeleteCustomPrompt={deleteCustomPrompt}
        promptMode={promptMode}
        setPromptMode={setPromptMode}
        isEditing={isEditing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isQuotaLimited={isQuotaLimited}
        quotaCooldownRemaining={cooldownRemaining}
        imageQueue={imageQueue}
        onRemoveFromQueue={handleRemoveFromQueue}
        isBatchProcessing={isBatchProcessing}
        currentBatchProgress={currentBatchProgress}
        onCancelBatch={cancelBatchProcess}
        animationPrompt={animationPrompt}
        setAnimationPrompt={setAnimationPrompt}
      />
      <CenterPanel
        beforeImage={selectedResult?.prompt === 'Original Image' ? null : (selectedResult?.sourceImageUrl ?? originalImage?.dataUrl ?? null)}
        afterImage={selectedResult?.imageUrl ?? null}
        mimeType={selectedResult?.mimeType ?? originalImage?.mimeType ?? 'image/png'}
        comparisonMode={comparisonMode}
        setComparisonMode={setComparisonMode}
        isLoading={isAnythingLoading}
        error={error}
        hasImage={!!originalImage}
        imageDimensions={imageDimensions}
        beforeImageDimensions={beforeImageDimensions}
        afterImageDimensions={afterImageDimensions}
        onImageEdited={handleImageEdited}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        selectedResult={selectedResult}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />
      <RightPanel
        results={results}
        selectedResultId={selectedResult?.id ?? null}
        onSelectResult={handleSelectResultForView}
        onUseAsSource={handleUseResultAsSource}
        onDownloadResult={handleDownloadResult}
        onUpscaleAndDownload={upscaleAndDownload}
        onClearAll={handleClearAll}
        onDownloadAllResults={handleDownloadAllResults}
        isLoading={isAnythingLoading}
      />
    </div>
  );
};

export default App;