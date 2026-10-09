import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ProcessAudioParams {
  userId: string;
  videoData: string; // base64 dataUrl or local file path (/data/uploads/...) or URL
  audioData?: string; // /sounds/... or /data/uploads/sounds/... or base64
  originalAudioVolume?: number; // 0 to 100
  musicVolume?: number; // 0 to 100
  musicStartTime?: number; // seconds
  musicTrimStart?: number; // seconds
  musicTrimEnd?: number; // seconds
  isMuted?: boolean;
  isSlideshow?: boolean; // true if photo converted to video
  filterName?: string;
}

export interface ProcessAudioResult {
  success: boolean;
  message?: string;
  processedMediaUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  error?: string;
}

class MediaProcessingService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'data', 'uploads', 'media');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Resolves a media data string (base64, relative path, or external URL) to a local file on disk
   */
  private async resolveToLocalFile(
    input: string, 
    defaultExt: string, 
    tempFiles: string[]
  ): Promise<string> {
    // 1. Base64 Data URL
    if (input.startsWith('data:')) {
      const commaIndex = input.indexOf(',');
      if (commaIndex !== -1) {
        const header = input.substring(0, commaIndex);
        const data = input.substring(commaIndex + 1);
        const buffer = Buffer.from(data, 'base64');
        let ext = defaultExt;
        if (header.includes('video/webm')) ext = 'webm';
        else if (header.includes('video/mp4')) ext = 'mp4';
        else if (header.includes('image/jpeg')) ext = 'jpg';
        else if (header.includes('image/png')) ext = 'png';
        else if (header.includes('audio/mp3') || header.includes('audio/mpeg')) ext = 'mp3';
        else if (header.includes('audio/wav')) ext = 'wav';

        const tempPath = path.join(os.tmpdir(), `ravini_in_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`);
        fs.writeFileSync(tempPath, buffer);
        tempFiles.push(tempPath);
        return tempPath;
      }
    }

    // 2. Relative public path (/sounds/...)
    if (input.startsWith('/sounds/')) {
      const publicPath = path.join(process.cwd(), 'public', input);
      if (fs.existsSync(publicPath)) return publicPath;
    }

    // 3. Uploads path (/data/uploads/...)
    if (input.startsWith('/data/uploads/')) {
      const localUploadPath = path.join(process.cwd(), input);
      if (fs.existsSync(localUploadPath)) return localUploadPath;
    }

    // 4. Already absolute file path
    if (path.isAbsolute(input) && fs.existsSync(input)) {
      return input;
    }

    // 5. Blob URL or unsupported external URL
    if (input.startsWith('blob:')) {
      throw new Error('Blob URL cannot be processed server-side. Please provide base64 or uploaded file.');
    }

    throw new Error(`Media file not found or inaccessible: ${input.substring(0, 60)}`);
  }

  /**
   * Process and mix audio with video using FFmpeg
   */
  public async processAudio(params: ProcessAudioParams): Promise<ProcessAudioResult> {
    const tempFiles: string[] = [];
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 7);
    const outputFilename = `proc_${timestamp}_${uniqueId}.mp4`;
    const outputPath = path.join(this.outputDir, outputFilename);
    const thumbFilename = `thumb_${timestamp}_${uniqueId}.jpg`;
    const thumbPath = path.join(this.outputDir, thumbFilename);

    try {
      const isSlideshow = !!params.isSlideshow;
      const originalVol = params.isMuted ? 0 : Math.max(0, Math.min(100, params.originalAudioVolume ?? 100)) / 100;
      const musicVol = Math.max(0, Math.min(100, params.musicVolume ?? 100)) / 100;
      const musicStartTime = Math.max(0, params.musicStartTime ?? 0);
      const musicTrimStart = Math.max(0, params.musicTrimStart ?? 0);
      const musicTrimEnd = params.musicTrimEnd && params.musicTrimEnd > musicTrimStart ? params.musicTrimEnd : undefined;
      const delayMs = Math.round(musicStartTime * 1000);

      // Resolve video/image file
      const localVideoPath = await this.resolveToLocalFile(params.videoData, isSlideshow ? 'jpg' : 'mp4', tempFiles);

      // Resolve audio file if provided
      let localAudioPath: string | null = null;
      if (params.audioData && params.audioData.trim() !== '') {
        try {
          localAudioPath = await this.resolveToLocalFile(params.audioData, 'mp3', tempFiles);
        } catch (err) {
          console.warn('Could not resolve audio, continuing with original sound:', err);
        }
      }

      // CASE 1: Photo / Slideshow with Audio
      if (isSlideshow) {
        if (localAudioPath) {
          // Photo loop for 15s with selected audio track, pad to even dimensions
          const cmd = `ffmpeg -loop 1 -i "${localVideoPath}" -ss ${musicTrimStart} -i "${localAudioPath}" -t 15 -filter_complex "[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2,pad=max(iw\\,2):max(ih\\,2):0:0[v];[1:a]volume=${musicVol}[a]" -map "[v]" -map "[a]" -c:v libx264 -tune stillimage -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outputPath}" -y`;
          await execAsync(cmd);
        } else {
          // Just convert photo to static 5s MP4 video
          const cmd = `ffmpeg -loop 1 -i "${localVideoPath}" -t 5 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,pad=max(iw\\,2):max(ih\\,2):0:0" -c:v libx264 -tune stillimage -preset ultrafast -pix_fmt yuv420p -an "${outputPath}" -y`;
          await execAsync(cmd);
        }
      } 
      // CASE 2: Video without new music track (only original volume / mute adjustment)
      else if (!localAudioPath) {
        if (originalVol === 0 || params.isMuted) {
          // Strip audio completely
          const cmd = `ffmpeg -i "${localVideoPath}" -an -c:v copy "${outputPath}" -y`;
          try {
            await execAsync(cmd);
          } catch {
            await execAsync(`ffmpeg -i "${localVideoPath}" -an -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${outputPath}" -y`);
          }
        } else if (originalVol < 0.99 || originalVol > 1.01) {
          // Adjust volume of original audio
          const cmd = `ffmpeg -i "${localVideoPath}" -filter:a "volume=${originalVol}" -c:v copy -c:a aac -b:a 192k "${outputPath}" -y`;
          try {
            await execAsync(cmd);
          } catch {
            await execAsync(`ffmpeg -i "${localVideoPath}" -filter:a "volume=${originalVol}" -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k "${outputPath}" -y`);
          }
        } else {
          // Keep original as is
          const cmd = `ffmpeg -i "${localVideoPath}" -c:v copy -c:a copy "${outputPath}" -y`;
          try {
            await execAsync(cmd);
          } catch {
            await execAsync(`ffmpeg -i "${localVideoPath}" -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac "${outputPath}" -y`);
          }
        }
      }
      // CASE 3: Video with Music Track
      else {
        // Detect if video contains an audio stream
        let hasOriginalAudio = false;
        try {
          const { stdout } = await execAsync(`ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 "${localVideoPath}"`);
          if (stdout.trim().includes('audio')) {
            hasOriginalAudio = true;
          }
        } catch {
          hasOriginalAudio = false;
        }

        // Subcase 3A: No original audio OR user muted original audio (originalVol === 0)
        if (!hasOriginalAudio || originalVol === 0 || params.isMuted) {
          const trimPart = musicTrimEnd ? `:end=${musicTrimEnd}` : '';
          const filter = `[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2,pad=max(iw\\,2):max(ih\\,2):0:0[v];[1:a]atrim=start=${musicTrimStart}${trimPart},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${musicVol}[aout]`;
          const cmd = `ffmpeg -i "${localVideoPath}" -i "${localAudioPath}" -filter_complex "${filter}" -map "[v]" -map "[aout]" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outputPath}" -y`;
          await execAsync(cmd);
        }
        // Subcase 3B: Mix Original Audio + Music Audio Track
        else {
          const trimPart = musicTrimEnd ? `:end=${musicTrimEnd}` : '';
          const filter = `[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2,pad=max(iw\\,2):max(ih\\,2):0:0[v];[0:a]volume=${originalVol}[a0];[1:a]atrim=start=${musicTrimStart}${trimPart},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${musicVol}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
          const cmd = `ffmpeg -i "${localVideoPath}" -i "${localAudioPath}" -filter_complex "${filter}" -map "[v]" -map "[aout]" -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 192k "${outputPath}" -y`;
          await execAsync(cmd);
        }
      }

      // Generate thumbnail
      try {
        await execAsync(`ffmpeg -ss 00:00:00.500 -i "${outputPath}" -vframes 1 -q:v 2 "${thumbPath}" -y`);
      } catch (e) {
        console.warn('Thumbnail generation warning:', e);
      }

      // Read output file stats
      const stats = fs.statSync(outputPath);
      let duration = 15;
      try {
        const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`);
        const parsed = parseFloat(stdout.trim());
        if (!isNaN(parsed)) duration = Math.round(parsed * 10) / 10;
      } catch {}

      return {
        success: true,
        processedMediaUrl: `/data/uploads/media/${outputFilename}`,
        thumbnailUrl: fs.existsSync(thumbPath) ? `/data/uploads/media/${thumbFilename}` : undefined,
        duration,
        fileSize: stats.size
      };
    } catch (err: any) {
      console.error('Media processing error:', err);
      return {
        success: false,
        message: 'Imeshindikana kuongeza sound. Tafadhali jaribu tena.',
        error: err.message
      };
    } finally {
      // Clean up temporary files
      for (const f of tempFiles) {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch {}
      }
    }
  }

  /**
   * Transcodes raw video upload (webm/mp4/mov) to universal faststart MP4 with thumbnail
   * Ensures instant playback and scrubbing across all mobile and web browsers
   */
  public async transcodeVideo(inputData: string): Promise<{ success: boolean; url: string; thumbnailUrl?: string; fileSize: number; duration?: number }> {
    const tempFiles: string[] = [];
    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 7);
    const outputFilename = `vid_${timestamp}_${uniqueId}.mp4`;
    const outputPath = path.join(this.outputDir, outputFilename);
    const thumbFilename = `thumb_${timestamp}_${uniqueId}.jpg`;
    const thumbPath = path.join(this.outputDir, thumbFilename);

    try {
      const localInput = await this.resolveToLocalFile(inputData, 'webm', tempFiles);

      // Transcode / remux to standard H.264 / AAC with +faststart (moov atom at beginning)
      const cmd = `ffmpeg -y -i "${localInput}" -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -movflags +faststart -pix_fmt yuv420p "${outputPath}"`;
      await execAsync(cmd);

      // Extract thumbnail frame at 0.5s or start
      try {
        const thumbCmd = `ffmpeg -y -ss 00:00:00.500 -i "${outputPath}" -vframes 1 -q:v 2 "${thumbPath}"`;
        await execAsync(thumbCmd);
      } catch (thumbErr) {
        console.warn('Could not generate thumbnail for video:', thumbErr);
      }

      // Read duration
      let duration: number | undefined;
      try {
        const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`;
        const { stdout } = await execAsync(probeCmd);
        const parsed = parseFloat(stdout.trim());
        if (!isNaN(parsed)) duration = Math.round(parsed);
      } catch {}

      const stats = fs.statSync(outputPath);
      return {
        success: true,
        url: `/data/uploads/media/${outputFilename}`,
        thumbnailUrl: fs.existsSync(thumbPath) ? `/data/uploads/media/${thumbFilename}` : undefined,
        fileSize: stats.size,
        duration
      };
    } catch (err: any) {
      console.error('Video transcoding error:', err);
      // Fallback: if transcoding failed, save raw input
      const localInput = tempFiles[0];
      if (localInput && fs.existsSync(localInput)) {
        const rawFilename = `raw_${timestamp}_${uniqueId}.mp4`;
        const rawPath = path.join(this.outputDir, rawFilename);
        fs.copyFileSync(localInput, rawPath);
        const stats = fs.statSync(rawPath);
        return {
          success: true,
          url: `/data/uploads/media/${rawFilename}`,
          fileSize: stats.size
        };
      }
      throw err;
    } finally {
      for (const f of tempFiles) {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch {}
      }
    }
  }
}

export const mediaProcessingService = new MediaProcessingService();
