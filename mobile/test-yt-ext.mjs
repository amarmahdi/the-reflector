import { videoInfo } from 'youtube-ext';

async function test() {
  try {
    const info = await videoInfo('dQw4w9WgXcQ');
    const audioFormats = info.streamingData.adaptiveFormats.filter(f => f.mimeType.includes('audio/'));
    const bestAudio = audioFormats.sort((a,b) => b.bitrate - a.bitrate)[0];
    console.log("Found audio URL:", bestAudio ? (bestAudio.url ? "Direct" : (bestAudio.signatureCipher ? "Ciphered" : "Neither")) : "None");
    console.log("Decrypted URL?", !!bestAudio.url);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
