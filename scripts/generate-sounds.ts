import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SOUNDS_DIR = path.join(process.cwd(), 'public', 'sounds');

if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

interface SoundConfig {
  filename: string;
  command: string;
}

const sounds: SoundConfig[] = [
  {
    filename: 'bongo_flava_groove.mp3',
    command: `ffmpeg -f lavfi -i "anoisesrc=d=35:c=pink:r=44100:a=0.06" -f lavfi -i "sine=f=130.81:d=35" -f lavfi -i "sine=f=261.63:d=35" -f lavfi -i "sine=f=329.63:d=35" -f lavfi -i "sine=f=392.00:d=35" -filter_complex "[1:a]volume=0.3[bass];[2:a]volume=0.2[c4];[3:a]volume=0.18[e4];[4:a]volume=0.15[g4];[0:a]lowpass=f=900,volume=0.2[rhythm];[bass][c4][e4][g4][rhythm]amix=inputs=5:duration=first[out]" -map "[out]" -c:a libmp3lame -b:a 192k "${path.join(SOUNDS_DIR, 'bongo_flava_groove.mp3')}" -y`
  },
  {
    filename: 'afrobeats_sunrise.mp3',
    command: `ffmpeg -f lavfi -i "anoisesrc=d=35:c=brown:r=44100:a=0.07" -f lavfi -i "sine=f=146.83:d=35" -f lavfi -i "sine=f=293.66:d=35" -f lavfi -i "sine=f=369.99:d=35" -f lavfi -i "sine=f=440.00:d=35" -filter_complex "[1:a]volume=0.35[bass];[2:a]volume=0.2[d4];[3:a]volume=0.2[fs4];[4:a]volume=0.15[a4];[0:a]bandpass=f=1200:w=500,volume=0.25[perc];[bass][d4][fs4][a4][perc]amix=inputs=5:duration=first[out]" -map "[out]" -c:a libmp3lame -b:a 192k "${path.join(SOUNDS_DIR, 'afrobeats_sunrise.mp3')}" -y`
  },
  {
    filename: 'amapiano_pulse.mp3',
    command: `ffmpeg -f lavfi -i "sine=f=65.41:d=35" -f lavfi -i "sine=f=130.81:d=35" -f lavfi -i "sine=f=523.25:d=35" -f lavfi -i "anoisesrc=d=35:c=white:r=44100:a=0.04" -filter_complex "[0:a]volume=0.5,lowpass=f=200[sub];[1:a]volume=0.3[midbass];[2:a]volume=0.15,highpass=f=400[lead];[3:a]highpass=f=5000,volume=0.2[hats];[sub][midbass][lead][hats]amix=inputs=4:duration=first[out]" -map "[out]" -c:a libmp3lame -b:a 192k "${path.join(SOUNDS_DIR, 'amapiano_pulse.mp3')}" -y`
  },
  {
    filename: 'acoustic_peace.mp3',
    command: `ffmpeg -f lavfi -i "sine=f=196.00:d=35" -f lavfi -i "sine=f=246.94:d=35" -f lavfi -i "sine=f=293.66:d=35" -f lavfi -i "sine=f=392.00:d=35" -filter_complex "[0:a]volume=0.25[g3];[1:a]volume=0.22[b3];[2:a]volume=0.2[d4];[3:a]volume=0.18[g4];[g3][b3][d4][g4]amix=inputs=4:duration=first,flanger=delay=4:depth=1.5[out]" -map "[out]" -c:a libmp3lame -b:a 192k "${path.join(SOUNDS_DIR, 'acoustic_peace.mp3')}" -y`
  },
  {
    filename: 'cinematic_success.mp3',
    command: `ffmpeg -f lavfi -i "sine=f=110.00:d=35" -f lavfi -i "sine=f=164.81:d=35" -f lavfi -i "sine=f=220.00:d=35" -f lavfi -i "sine=f=277.18:d=35" -f lavfi -i "sine=f=329.63:d=35" -filter_complex "[0:a]volume=0.3[a2];[1:a]volume=0.25[e3];[2:a]volume=0.22[a3];[3:a]volume=0.18[cs4];[4:a]volume=0.16[e4];[a2][e3][a3][cs4][e4]amix=inputs=5:duration=first,aecho=0.8:0.88:60:0.4[out]" -map "[out]" -c:a libmp3lame -b:a 192k "${path.join(SOUNDS_DIR, 'cinematic_success.mp3')}" -y`
  },
  {
    filename: 'chill_lofi.mp3',
    command: `ffmpeg -f lavfi -i "anoisesrc=d=35:c=pink:r=44100:a=0.03" -f lavfi -i "sine=f=174.61:d=35" -f lavfi -i "sine=f=220.00:d=35" -f lavfi -i "sine=f=261.63:d=35" -f lavfi -i "sine=f=349.23:d=35" -filter_complex "[1:a]volume=0.25[f3];[2:a]volume=0.22[a3];[3:a]volume=0.2[c4];[4:a]volume=0.16[f4];[0:a]lowpass=f=600,volume=0.15[vinyl];[f3][a3][c4][f4][vinyl]amix=inputs=5:duration=first,lowpass=f=2800[out]" -map "[out]" -c:a libmp3lame -b:a 192k "${path.join(SOUNDS_DIR, 'chill_lofi.mp3')}" -y`
  }
];

console.log('Generating RAVINI audio library...');
for (const s of sounds) {
  try {
    console.log(`Generating ${s.filename}...`);
    execSync(s.command, { stdio: 'ignore' });
    console.log(`✓ ${s.filename} ready`);
  } catch (err) {
    console.error(`Failed to generate ${s.filename}:`, err);
  }
}
console.log('All RAVINI sound tracks generated successfully!');
