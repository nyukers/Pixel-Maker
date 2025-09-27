import React from 'react';
import ImageUploader from './ImageUploader';
import { PRESET_PROMPTS, REIMAGINE_PRESET_PROMPTS, REANIMATE_PRESET_PROMPTS } from '../constants';
import { RestoreIcon } from './icons/RestoreIcon';
import { ResetIcon } from './icons/ResetIcon';
import { PlusIcon } from './icons/PlusIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useTranslations } from '../hooks/useTranslations';
import { PromptMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { SettingsIcon } from './icons/SettingsIcon';
import QueuePanel from './QueuePanel';
import { XIcon } from './icons/XIcon';
import { FilmIcon } from './icons/FilmIcon';

interface ImageState {
  dataUrl: string;
  mimeType: string;
}

interface LeftPanelProps {
  onImagesUpload: (images: ImageState[]) => void;
  processingImageUrl: string | null;
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  onProcess: () => void;
  isLoading: boolean;
  hasImage: boolean;
  onReset: () => void;
  isProcessingOriginal: boolean;
  customPrompts: string[];
  onAddCustomPrompt: (prompt: string) => void;
  onDeleteCustomPrompt: (prompt: string) => void;
  promptMode: PromptMode;
  setPromptMode: (mode: PromptMode) => void;
  isEditing: boolean;
  onOpenSettings: () => void;
  isQuotaLimited: boolean;
  quotaCooldownRemaining: number;
  imageQueue: ImageState[];
  onRemoveFromQueue: (index: number) => void;
  isBatchProcessing: boolean;
  currentBatchProgress: number;
  onCancelBatch: () => void;
  animationPrompt: string;
  // FIX: Corrected the type to allow functional updates, which is needed for appending prompts.
  setAnimationPrompt: React.Dispatch<React.SetStateAction<string>>;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  onImagesUpload,
  processingImageUrl,
  prompt,
  setPrompt,
  onProcess,
  isLoading,
  hasImage,
  onReset,
  isProcessingOriginal,
  customPrompts,
  onAddCustomPrompt,
  onDeleteCustomPrompt,
  promptMode,
  setPromptMode,
  isEditing,
  onOpenSettings,
  isQuotaLimited,
  quotaCooldownRemaining,
  imageQueue,
  onRemoveFromQueue,
  isBatchProcessing,
  currentBatchProgress,
  onCancelBatch,
  animationPrompt,
  setAnimationPrompt,
}) => {
  const t = useTranslations();
  const { language } = useLanguage();
  
  const currentPresets = promptMode === 'retouch' ? PRESET_PROMPTS : REIMAGINE_PRESET_PROMPTS;
  const allPresetPromptsFullText = [...PRESET_PROMPTS, ...REIMAGINE_PRESET_PROMPTS].map(p => p.prompt);
  const allAnimationPresetPrompts = REANIMATE_PRESET_PROMPTS.map(p => p.prompt);

  const getButtonText = () => {
    if (isQuotaLimited) {
      return `${t.quotaLimitReached} (${quotaCooldownRemaining}s)`;
    }
    if (isBatchProcessing) {
        return `${t.processingBtn} (${currentBatchProgress}/${imageQueue.length})`;
    }
    if (isLoading) {
      return t.processingBtn;
    }
    if (promptMode === 'reanimate') {
        return t.reanimateBtn;
    }
    if (imageQueue.length > 1) {
        return `${t.processXImagesBtn} (${imageQueue.length})`;
    }
    return t.processImageBtn;
  }

   return (
    <div className="w-1/4 max-w-sm flex flex-col bg-gray-800 p-6 border-r border-gray-700 space-y-6 flex-shrink-0">
      <header className="flex items-start justify-between">
        <div>
            <h1 className={`font-bold text-yellow-400 whitespace-nowrap ${language === 'en' ? 'text-xl' : 'text-lg'}`}>
                <img 
                    src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiLxh4jH7b1ueJoR_jhUbnMQjj8MO1kpTCPfhvOAMooJ9DNMbW870u-sHvSIaEySZSUCGapATT-H-UldZMM63ENloRDutGjDwOb78TkHUJO46JrT-S0_pvJ72WvV_itwuJ3OpxKxVU1hXfGVvKQz1ZjLOGXIx8yYLCQUlscqSHuwP64Acw/s220/Nyukers.png" 
                    alt={t.appIconAlt} 
                    className="w-8 h-8 inline-block align-middle mr-2"
                />
                {t.appTitle}
            </h1>
            <p className="text-sm text-gray-400">{t.appSubtitle}</p>
        </div>
        <button onClick={onOpenSettings} className="p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label={t.settingsTitle}>
            <SettingsIcon className="w-6 h-6 text-gray-300"/>
        </button>
      </header>
      
      <div className="flex-grow flex flex-col space-y-6 overflow-y-auto pr-2 -mr-2">
        <ImageUploader onImagesUpload={onImagesUpload} currentImage={processingImageUrl} />
        
        {promptMode !== 'reanimate' && (
            <QueuePanel
                queue={imageQueue}
                onRemove={onRemoveFromQueue}
                isProcessing={isBatchProcessing}
                progressIndex={currentBatchProgress}
            />
        )}

        <div>
            <div className="flex border-b border-gray-700 mb-4">
                <button 
                    onClick={() => setPromptMode('retouch')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${promptMode === 'retouch' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400 hover:text-gray-100'}`}
                >
                    {t.retouchTab}
                </button>
                <button 
                    onClick={() => setPromptMode('reimagine')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${promptMode === 'reimagine' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400 hover:text-gray-100'}`}
                >
                    {t.reimagineTab}
                </button>
                <button 
                    onClick={() => setPromptMode('reanimate')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${promptMode === 'reanimate' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400 hover:text-gray-100'}`}
                >
                    {t.reanimateTab}
                </button>
            </div>
            {promptMode !== 'reanimate' ? (
                <>
                  <div>
                    <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-300 mb-2">
                      {t.promptLabel}
                    </label>
                    <div className="relative">
                      <textarea
                        id="prompt-input"
                        rows={4}
                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 pr-10 text-gray-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t.promptPlaceholder}
                      />
                      <button 
                        onClick={() => onAddCustomPrompt(prompt)} 
                        disabled={!prompt.trim() || allPresetPromptsFullText.includes(prompt.trim())}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-yellow-400 bg-gray-800 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t.saveCustomPromptTitle}
                      >
                          <SaveIcon className="h-5 w-5"/>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">{t.presetPromptsTitle}:</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {currentPresets.map((p) => (
                        <div key={p.id} className="flex items-center space-x-1">
                          <button
                            onClick={() => setPrompt(p.prompt)}
                            className={`flex-grow text-xs text-left p-2 rounded-l-md transition truncate ${
                              prompt === p.prompt
                                ? 'bg-yellow-400 text-gray-900 font-semibold'
                                : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                            }`}
                            title={p.prompt}
                          >
                            {t[p.id as keyof typeof t] || p.prompt}
                          </button>
                          <button
                              onClick={() => setPrompt(current => current ? `${current}, ${p.prompt}` : p.prompt)}
                              className="bg-gray-600 p-2 rounded-r-md hover:bg-yellow-400 hover:text-gray-900 transition"
                              aria-label={`${t.appendPromptLabel}: ${t[p.id as keyof typeof t]}`}
                              title={`${t.appendPromptTitle}: ${t[p.id as keyof typeof t]}`}
                          >
                              <PlusIcon className="h-4 w-4"/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">{t.customPromptsTitle}:</h3>
                      <div className="space-y-2">
                          {customPrompts.length === 0 && (
                              <p className="text-xs text-gray-400 text-center italic">{t.noCustomPrompts}</p>
                          )}
                          {customPrompts.map(p => (
                               <div key={p} className="flex items-center space-x-1">
                                  <button
                                    onClick={() => setPrompt(p)}
                                    className={`flex-grow text-xs text-left p-2 rounded-l-md transition truncate ${
                                        prompt === p
                                        ? 'bg-yellow-400 text-gray-900 font-semibold'
                                        : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                                    }`}
                                    title={p}
                                  >
                                    {p}
                                  </button>
                                  <button
                                      onClick={() => setPrompt(current => current ? `${current}, ${p}` : p)}
                                      className="bg-gray-600 p-2 hover:bg-yellow-400 hover:text-gray-900 transition"
                                      aria-label={`${t.appendPromptLabel}: ${p}`}
                                      title={`${t.appendPromptTitle}: ${p}`}
                                  >
                                      <PlusIcon className="h-4 w-4"/>
                                  </button>
                                  <button
                                      onClick={() => onDeleteCustomPrompt(p)}
                                      className="bg-gray-600 p-2 rounded-r-md hover:bg-red-500 transition"
                                      aria-label={`${t.deletePromptLabel}: ${p}`}
                                      title={`${t.deletePromptTitle}: ${p}`}
                                  >
                                      <TrashIcon className="h-4 w-4"/>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
                </>
            ) : (
                <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">{t.reanimatePresetsTitle}:</h3>
                    {/* FIX: Corrected translation key from reanimateDescription to animateDescription to match the translation files. */}
                    <p className="text-xs text-gray-400 mb-3">{t.animateDescription}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {REANIMATE_PRESET_PROMPTS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setAnimationPrompt(p.prompt)}
                          className={`w-full text-xs text-left p-2 rounded-md transition truncate ${
                            animationPrompt === p.prompt
                              ? 'bg-yellow-400 text-gray-900 font-semibold'
                              : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                          }`}
                          title={p.prompt}
                        >
                          {t[p.nameKey as keyof typeof t] || p.id}
                        </button>
                      ))}
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <div className="space-y-3 pt-4 border-t border-gray-700">
         <button
            onClick={onReset}
            disabled={isProcessingOriginal || !hasImage || isLoading || isBatchProcessing}
            className="w-full flex items-center justify-center bg-gray-700 text-gray-300 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
            <ResetIcon className="h-5 w-5 mr-2"/>
            {t.resetToOriginalBtn}
        </button>
        {isBatchProcessing ? (
             <button
                onClick={onCancelBatch}
                className="w-full flex items-center justify-center bg-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-red-500 transition-all"
            >
                <XIcon className="h-5 w-5 mr-2" />
                <span>{t.cancelBatchBtn} ({currentBatchProgress > imageQueue.length ? imageQueue.length : currentBatchProgress}/{imageQueue.length})</span>
            </button>
        ) : (
            <button
              onClick={onProcess}
              disabled={!hasImage || isLoading || isEditing || isQuotaLimited}
              className="w-full flex items-center justify-center bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              {promptMode === 'reanimate' ? <FilmIcon className="h-5 w-5 mr-2" /> : <RestoreIcon className="h-5 w-5 mr-2" />}
              {getButtonText()}
            </button>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;
