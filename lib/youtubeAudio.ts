// ──────────────────────────────────────────────
// The Reflector – YouTube-to-MP3 Downloader
// Uses decentralized Proxy networks (Cobalt & Invidious) to bypass signatures
// ──────────────────────────────────────────────

import { Paths, File, Directory } from 'expo-file-system';

const SOUNDS_DIR_NAME = 'alarm-sounds';

// Spoof Chrome to avoid Cloudflare blocks & strict HTTP restrictions
const STANDARD_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// Hardcoded stable fallback instances (including .com/.net to avoid Android emulator TLD bugs)
const FALLBACK_COBALT_APIS = [
  'https://cobalt.kwiatekm.dev',
  'https://cobalt.q0.oahu.ws',
  'https://api.cobalt.tools',
];

const INVIDIOUS_INSTANCES = [
  'https://invidious.privacyredirect.com', // .com domain helps bypass emulator TLD blocking
  'https://invidious.asir.dev',
  'https://inv.tux.pizza', 
  'https://invidious.jing.rocks',
];

export interface DownloadResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  error?: string;
}

/**
 * Get or create the alarm-sounds directory.
 */
function getSoundsDir(): Directory {
  const dir = new Directory(Paths.document, SOUNDS_DIR_NAME);
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

/**
 * Fetch active, high-score Cobalt API instances
 */
async function getCobaltInstances(): Promise<string[]> {
  try {
    const res = await fetch('https://instances.cobalt.tools/instances.json', { headers: STANDARD_HEADERS });
    if (!res.ok) return FALLBACK_COBALT_APIS;
    
    const data = await res.json();
    const activeApis = data
      .filter((node: any) => node.api && node.cors === 1 && node.score >= 80)
      .map((node: any) => node.api);
    
    return activeApis.length > 0 ? activeApis : FALLBACK_COBALT_APIS;
  } catch (err) {
    console.warn('[YT] Failed to fetch Cobalt instances, using fallbacks.', err);
    return FALLBACK_COBALT_APIS;
  }
}

/**
 * Extract YouTube video ID
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Fetch video title from YouTube oEmbed API
 */
async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (res.ok) {
      const data = await res.json();
      return data.title || 'YouTube Audio';
    }
  } catch {}
  return 'YouTube Audio';
}

/**
 * Fallback mechanism: Attempt Invidious proxy extraction if Cobalt completely fails
 */
async function tryInvidiousExtraction(videoId: string): Promise<string | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`[YT] Fallback checking Invidious: ${instance}`);
      const res = await fetch(`${instance}/api/v1/videos/${videoId}?fields=adaptiveFormats`, {
        headers: STANDARD_HEADERS
      });

      if (!res.ok) {
        console.warn(`[YT] Invidious fallback failed with HTTP ${res.status} on ${instance}`);
        continue;
      }

      const data = await res.json();
      const formats: any[] = data.adaptiveFormats ?? [];
      const audioFormats = formats.filter((f: any) => f.type?.startsWith('audio/'));

      if (audioFormats.length === 0) continue;

      // Sort by bitrate descending and grab the raw proxy URL
      audioFormats.sort((a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
      if (audioFormats[0]?.url) {
        console.log(`[YT] Fallback via Invidious success: ${instance}`);
        return audioFormats[0].url;
      }
    } catch (e: any) {
      console.warn(`[YT] Invidious fallback network error for ${instance}:`, e.message);
    }
  }
  return null;
}

/**
 * Download audio from a YouTube URL to the local filesystem.
 */
export async function downloadYouTubeAudio(
  youtubeUrl: string,
  onProgress?: (progress: number) => void
): Promise<DownloadResult> {
  try {
    if (onProgress) onProgress(5);

    // 1. Validating URL
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return { success: false, error: 'Invalid YouTube URL' };
    }

    if (onProgress) onProgress(10);
    const title = await fetchVideoTitle(videoId);
    console.log(`[YT] Video: "${title}"`);

    // 2. Resolve a working Cobalt API Endpoint
    if (onProgress) onProgress(15);
    const apis = await getCobaltInstances();
    
    let audioDownloadUrl: string | null = null;
    let fallbackError = '';

    // 3. Try nodes until one gives us the stream URL
    for (const apiUrl of apis) {
      try {
        console.log(`[YT] Requesting processing from: ${apiUrl}`);
        const cleanApiUrl = apiUrl.replace(/\/$/, '');
        
        const res = await fetch(`${cleanApiUrl}/`, {
          method: 'POST',
          headers: STANDARD_HEADERS,
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            isAudioOnly: true,
            aFormat: 'mp3',
          })
        });

        if (!res.ok) {
           console.warn(`[YT] HTTP ${res.status} from ${apiUrl}`);
           continue; 
        }

        const data = await res.json();

        if (data.status === 'stream' || data.status === 'redirect') {
          audioDownloadUrl = data.url;
          console.log(`[YT] Extracted stream URL via ${apiUrl}`);
          break; // Successful extraction
        } else if (data.status === 'error') {
          console.warn(`[YT] Node reported error:`, data.error?.code || data.text);
          fallbackError = data.error?.code || data.text || 'Processing error';
        }
      } catch (err: any) {
        console.warn(`[YT] Node Error (${apiUrl}):`, err.message);
      }
    }

    // 4. Try Invidious as absolute fallback
    if (!audioDownloadUrl) {
      console.log(`[YT] Cobalt completely failed. Booting up Invidious proxy endpoints...`);
      audioDownloadUrl = await tryInvidiousExtraction(videoId);
      
      if (!audioDownloadUrl) {
        return { success: false, error: `Proxy servers blocked the request. Try again later or pick a different audio format.` };
      }
    }

    if (onProgress) onProgress(40);

    // 5. Download the extracted stream to Local FS
    const safeTitle = title.replace(/[^a-zA-Z0-9 _-]/g, '').substring(0, 50);
    const fileName = `${safeTitle || videoId}.mp3`;
    const dir = getSoundsDir();
    const destFile = new File(dir, fileName);

    console.log('[YT] Downloading audio stream bytes natively...');
    
    // Provide standard headers for download to bypass proxy blocks
    const dlRes = await fetch(audioDownloadUrl, { headers: STANDARD_HEADERS });
    if (!dlRes.ok) {
      return { success: false, error: `Stream download failed (HTTP ${dlRes.status})` };
    }

    if (onProgress) onProgress(60);

    const blob = await dlRes.blob();
    const arrayBuffer = await blob.arrayBuffer();

    destFile.write(new Uint8Array(arrayBuffer));

    console.log(`[YT] Saved completely: ${destFile.uri} (${arrayBuffer.byteLength} bytes)`);
    if (onProgress) onProgress(100);

    return {
      success: true,
      fileUri: destFile.uri,
      fileName: title,
    };
  } catch (e: any) {
    console.error('[YT] Download error trace:', e);
    return { success: false, error: e.message || 'Download failed due to network' };
  }
}

/**
 * List all downloaded alarm sounds.
 */
export function listDownloadedSounds(): { name: string; uri: string }[] {
  try {
    const dir = getSoundsDir();
    const items = dir.list();
    return items
      .filter((item): item is File => item instanceof File && item.name.endsWith('.mp3'))
      .map((f) => ({
        name: f.name.replace('.mp3', ''),
        uri: f.uri,
      }));
  } catch {
    return [];
  }
}

/**
 * Delete a downloaded sound file.
 */
export function deleteDownloadedSound(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {}
}
