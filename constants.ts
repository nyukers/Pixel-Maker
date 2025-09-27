import { PresetPrompt } from "./types";

export const PRESET_PROMPTS: PresetPrompt[] = [
  { id: "retouch_brighten", prompt: "Brighten and contrast enhance old photo" },
  { id: "retouch_colorize", prompt: "Colorize photo and enhance details" },
  { id: "retouch_enhance_clarity", prompt: "Enhance image detail and clarity without altering composition" },
  { id: "retouch_fix_damage", prompt: "Fix damage and improve overall quality" },
  { id: "retouch_improve_skin", prompt: "Improve skin texture and reduce facial blemishes" },
  { id: "retouch_remove_background", prompt: "Remove the background, leaving the main subject on a transparent background." },
  { id: "retouch_remove_dust", prompt: "Remove dust and scratches" },
  { id: "retouch_remove_frame", prompt: "Remove photo frame and repair torn edges" },
  { id: "retouch_remove_noise", prompt: "Remove digital noise and grain from the photo" },
  { id: "retouch_sharpen", prompt: "Restore and sharpen faded image" },
  { id: "retouch_restore_colors", prompt: "Restore faded colors to be vibrant and natural" },
  { id: "retouch_base", prompt: "Retouch this photo" },
  { id: "retouch_soft_focus", prompt: "Apply a dreamy soft-focus effect" },
];

export const REIMAGINE_PRESET_PROMPTS: PresetPrompt[] = [
    { id: "reimagine_art_deco", prompt: "Dress the person(s) in elegant 1920s Art Deco fashion." },
    { id: "reimagine_rustic_cabin", prompt: "Depict the person(s) in a cozy, rustic cabin with a fireplace." },
    { id: "reimagine_cyberpunk", prompt: "Change the outfits to rugged, futuristic cyberpunk gear." },
    { id: "reimagine_fantasy_forest", prompt: "Transform the scene into a vibrant, fantastical forest with glowing plants." },
    { id: "reimagine_film_noir", prompt: "Place the character(s) in a classic, black-and-white film noir scene." },
    { id: "reimagine_futuristic_city", prompt: "Place the subject(s) in a futuristic city with flying cars." },
    { id: "reimagine_ancient_jungle", prompt: "Reimagine the person(s) as explorers in a lush, ancient jungle." },
    { id: "reimagine_medieval", prompt: "Place the subject(s) in royal, medieval-era attire." },
    { id: "reimagine_studio_portrait", prompt: "Studio portrait of the subject(s) in modern, plain clothing against a light background." },
    { id: "reimagine_steampunk", prompt: "Place the subject(s) in a bustling steampunk city with brass machinery." },
    { id: "reimagine_sunny_beach", prompt: "Show the subject(s) on a beautiful, sunny beach at sunset." },
    { id: "reimagine_zen_garden", prompt: "Reimagine the scene as a serene zen garden with cherry blossoms." },
];

export const REANIMATE_PRESET_PROMPTS: { id: string, nameKey: string, prompt: string }[] = [
  { id: "reanimate_dolly", nameKey: "reanimate_dolly", prompt: "Create a dolly forward effect, as if the camera is moving into the scene." },
  { id: "reanimate_dramatic_shadows", nameKey: "reanimate_dramatic_shadows", prompt: "Animate this image by making shadows slowly shift and lengthen, creating a dramatic, time-lapse effect." },
  { id: "reanimate_golden_hour", nameKey: "reanimate_golden_hour", prompt: "Animate this image by simulating a warm, golden hour light that slowly moves across the scene." },
  { id: "reanimate_neon_pulse", nameKey: "reanimate_neon_pulse", prompt: "Animate this image with a futuristic, pulsing neon blue and pink light effect." },
  { id: "reanimate_pan_left_right", nameKey: "reanimate_pan_left_right", prompt: "Animate this image with a gentle camera pan from left to right." },
  { id: "reanimate_pan_right_left", nameKey: "reanimate_pan_right_left", prompt: "Animate this image with a gentle camera pan from right to left." },
  { id: "reanimate_spotlight", nameKey: "reanimate_spotlight", prompt: "Animate a moving spotlight that sweeps across the main subject, keeping the background dark." },
  { id: "reanimate_subtle", nameKey: "reanimate_subtle", prompt: "Animate this image, making the scene come to life with subtle, natural motion. Maintain the original style." },
  { id: "reanimate_zoom_in", nameKey: "reanimate_zoom_in", prompt: "Animate this image with a slow, smooth zoom-in effect on the main subject." },
  { id: "reanimate_zoom_out", nameKey: "reanimate_zoom_out", prompt: "Animate this image with a slow, smooth zoom-out effect, revealing more of the scene." },
];

export interface ImageFilter {
  id: string;
  nameKey: string;
  style: string;
}

export const IMAGE_FILTERS: ImageFilter[] = [
  { id: 'none', nameKey: 'filter_none', style: 'none' },
  { id: 'sepia', nameKey: 'filter_sepia', style: 'sepia(1)' },
  { id: 'grayscale', nameKey: 'filter_grayscale', style: 'grayscale(1)' },
  { id: 'vintage', nameKey: 'filter_vintage', style: 'sepia(0.6) contrast(0.9) brightness(1.1) saturate(1.2)' },
  { id: 'invert', nameKey: 'filter_invert', style: 'invert(1)' },
  { id: 'saturate', nameKey: 'filter_saturate', style: 'saturate(2)' },
  { id: 'contrast', nameKey: 'filter_contrast', style: 'contrast(1.5)' },
];

export const REANIMATING_MESSAGES = [
    "Warming up the animator...",
    "Gathering motion pixels...",
    "Teaching the photo to dance...",
    "This can take a few minutes, please wait.",
    "Rendering the final frames...",
    "Almost there, adding the final touches."
];