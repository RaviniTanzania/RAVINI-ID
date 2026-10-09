import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RaviniSoundRecord {
  id: string;
  title: string;
  artist: string;
  category: 'all' | 'bongo_flava' | 'afrobeat' | 'amapiano' | 'acoustic' | 'cinematic' | 'chill' | 'device';
  audioUrl: string;
  coverUrl: string;
  duration: number; // in seconds
  language?: string;
  country?: string;
  isActive: boolean;
  usageCount: number;
  license: string;
  createdAt: string;
  uploaderId?: string;
}

const SOUNDS_DB_FILE = path.join(process.cwd(), 'data', 'ravini_sounds.json');

const INITIAL_SOUNDS: RaviniSoundRecord[] = [
  {
    id: 'snd_bongo_flava',
    title: 'RAVINI Bongo Vibe',
    artist: 'Kizazi Kipya Records',
    category: 'bongo_flava',
    audioUrl: '/sounds/bongo_flava_groove.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    duration: 35,
    language: 'Swahili',
    country: 'Tanzania',
    isActive: true,
    usageCount: 1420,
    license: 'Royalty-Free (RAVINI Verified)',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'snd_afrobeats_sunrise',
    title: 'Dar es Salaam Sunrise',
    artist: 'Swahili Beats Studio',
    category: 'afrobeat',
    audioUrl: '/sounds/afrobeats_sunrise.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
    duration: 35,
    language: 'Instrumental',
    country: 'Tanzania',
    isActive: true,
    usageCount: 2310,
    license: 'Royalty-Free (RAVINI Verified)',
    createdAt: '2026-01-20T10:00:00.000Z'
  },
  {
    id: 'snd_amapiano_pulse',
    title: 'Kariakoo Amapiano',
    artist: 'Tanzania House Crew',
    category: 'amapiano',
    audioUrl: '/sounds/amapiano_pulse.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80',
    duration: 35,
    language: 'Instrumental',
    country: 'Tanzania',
    isActive: true,
    usageCount: 3890,
    license: 'Royalty-Free (RAVINI Verified)',
    createdAt: '2026-02-01T12:00:00.000Z'
  },
  {
    id: 'snd_acoustic_peace',
    title: 'Kilimanjaro Acoustic',
    artist: 'Zanzibar Strings',
    category: 'acoustic',
    audioUrl: '/sounds/acoustic_peace.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=400&q=80',
    duration: 35,
    language: 'Instrumental',
    country: 'Tanzania',
    isActive: true,
    usageCount: 980,
    license: 'Royalty-Free (RAVINI Verified)',
    createdAt: '2026-02-10T14:30:00.000Z'
  },
  {
    id: 'snd_cinematic_success',
    title: 'Ushindi & Ndoto',
    artist: 'RAVINI Studios Media',
    category: 'cinematic',
    audioUrl: '/sounds/cinematic_success.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=400&q=80',
    duration: 35,
    language: 'Instrumental',
    country: 'Tanzania',
    isActive: true,
    usageCount: 1650,
    license: 'RAVINI Originals',
    createdAt: '2026-02-15T09:15:00.000Z'
  },
  {
    id: 'snd_chill_lofi',
    title: 'Mbezi Beach Sunset',
    artist: 'Lofi Swahili',
    category: 'chill',
    audioUrl: '/sounds/chill_lofi.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    duration: 35,
    language: 'Instrumental',
    country: 'Tanzania',
    isActive: true,
    usageCount: 840,
    license: 'Royalty-Free (RAVINI Verified)',
    createdAt: '2026-02-22T16:00:00.000Z'
  }
];

class SoundService {
  private sounds: RaviniSoundRecord[] = [];
  private initialized = false;

  private async ensureInitialized() {
    if (this.initialized) return;
    try {
      if (fs.existsSync(SOUNDS_DB_FILE)) {
        const raw = fs.readFileSync(SOUNDS_DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.sounds = parsed;
          this.initialized = true;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to read sounds db file, initializing defaults:', e);
    }
    this.sounds = [...INITIAL_SOUNDS];
    this.save();
    this.initialized = true;
  }

  private save() {
    try {
      const dir = path.dirname(SOUNDS_DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SOUNDS_DB_FILE, JSON.stringify(this.sounds, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save sounds db:', e);
    }
  }

  public async getAllSounds(category?: string, query?: string): Promise<RaviniSoundRecord[]> {
    await this.ensureInitialized();
    let result = this.sounds.filter(s => s.isActive);
    if (category && category !== 'all') {
      result = result.filter(s => s.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.artist.toLowerCase().includes(q) ||
        (s.country && s.country.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => b.usageCount - a.usageCount);
  }

  public async getSoundById(id: string): Promise<RaviniSoundRecord | undefined> {
    await this.ensureInitialized();
    return this.sounds.find(s => s.id === id);
  }

  public async recordSoundUsage(id: string): Promise<void> {
    await this.ensureInitialized();
    const sound = this.sounds.find(s => s.id === id);
    if (sound) {
      sound.usageCount = (sound.usageCount || 0) + 1;
      this.save();
    }
  }

  public async registerUserUploadedSound(params: {
    userId: string;
    userName: string;
    title: string;
    artist?: string;
    audioBuffer: Buffer;
    mimeType: string;
    originalFilename?: string;
  }): Promise<RaviniSoundRecord> {
    await this.ensureInitialized();
    const uploadDir = path.join(process.cwd(), 'data', 'uploads', 'sounds');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const soundId = `snd_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ext = params.mimeType.includes('wav') ? 'wav' : params.mimeType.includes('ogg') ? 'ogg' : 'mp3';
    const filename = `${soundId}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, params.audioBuffer);

    // Get real audio duration using ffprobe
    let duration = 30;
    try {
      const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
      const parsed = parseFloat(stdout.trim());
      if (!isNaN(parsed) && parsed > 0) {
        duration = Math.round(parsed);
      }
    } catch (e) {
      console.warn('ffprobe audio duration failed, default to 30s:', e);
    }

    const newSound: RaviniSoundRecord = {
      id: soundId,
      title: params.title.trim() || 'Sauti Yangu (Device Audio)',
      artist: params.artist?.trim() || params.userName || 'Mtumiaji wa RAVINI',
      category: 'device',
      audioUrl: `/data/uploads/sounds/${filename}`,
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80',
      duration,
      language: 'Various',
      country: 'Tanzania',
      isActive: true,
      usageCount: 1,
      license: 'User-Uploaded / Device Local Audio',
      createdAt: new Date().toISOString(),
      uploaderId: params.userId
    };

    this.sounds.unshift(newSound);
    this.save();
    return newSound;
  }
}

export const soundService = new SoundService();
