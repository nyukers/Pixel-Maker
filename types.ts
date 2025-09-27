export interface ResultItem {
  id: string;
  imageUrl: string; // Used for image URL or video thumbnail URL
  videoUrl?: string; // Used for the video blob URL
  resultType: 'image' | 'video';
  mimeType: string;
  prompt: string;
  sourceImageUrl?: string; // The URL of the image used to generate this result
}

export type ComparisonMode = 'side' | 'slider' | 'single';

export type PromptMode = 'retouch' | 'reimagine' | 'reanimate';

export interface Pan {
  x: number;
  y: number;
}

export interface PresetPrompt {
  id: string;
  prompt: string;
}
