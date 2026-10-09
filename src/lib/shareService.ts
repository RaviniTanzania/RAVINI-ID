import { SharePayload, User } from '../types';
import { recordContentShare } from './storage';

export function getShareUrl(content: SharePayload): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ravini.co.tz';
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  switch (content.type) {
    case 'post':
    case 'photo':
    case 'video':
    case 'clip':
      return `${origin}${path}?tab=feed&postId=${content.id}`;
    case 'market':
      return `${origin}${path}?tab=market&itemId=${content.id}`;
    case 'profile':
      return `${origin}${path}?tab=profile&userId=${content.id}`;
    case 'official':
      return `${origin}${path}?tab=ads&adId=${content.id}`;
    case 'link':
    default:
      return content.url || `${origin}${path}`;
  }
}

export function formatShareText(content: SharePayload): string {
  const shareUrl = getShareUrl(content);
  const brandName = 'RAVINI';
  const title = content.title || 'Maudhui kutoka RAVINI';
  const textSnippet = content.text ? `\n\n"${content.text.slice(0, 140)}${content.text.length > 140 ? '...' : ''}"` : '';
  const authorInfo = content.authorName ? ` kwa hisani ya ${content.authorName}` : '';

  return `${title}${authorInfo}${textSnippet}\n\nTazama zaidi kupitia ${brandName}: ${shareUrl}`;
}

export async function executeShare(
  destination: 'whatsapp' | 'sms' | 'gmail' | 'native' | 'telegram' | 'twitter' | 'facebook' | 'copy',
  content: SharePayload,
  actor?: User
): Promise<{ success: boolean; message: string; newSharesCount?: number }> {
  // Check privacy
  if (content.privacy === 'only_me') {
    return {
      success: false,
      message: '🔒 Maudhui haya yamewekwa ya faragha (Only Me) na hayawezi kusambazwa hadharani.'
    };
  }

  const shareUrl = getShareUrl(content);
  const shareText = formatShareText(content);
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(content.title || 'RAVINI - Tanzanian Digital Ecosystem');

  let success = false;
  let message = '';

  switch (destination) {
    case 'whatsapp': {
      const waUrl = `https://wa.me/?text=${encodedText}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      success = true;
      message = 'Inafungua WhatsApp kushiriki...';
      break;
    }
    case 'sms': {
      const smsUrl = `sms:?body=${encodedText}`;
      window.location.href = smsUrl;
      success = true;
      message = 'Inafungua programu ya ujumbe (SMS)...';
      break;
    }
    case 'gmail': {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodedTitle}&body=${encodedText}`;
      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      success = true;
      message = 'Inafungua Google Gmail kushiriki...';
      break;
    }
    case 'telegram': {
      const teleUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(content.title || 'RAVINI')}`;
      window.open(teleUrl, '_blank', 'noopener,noreferrer');
      success = true;
      message = 'Inafungua Telegram kushiriki...';
      break;
    }
    case 'twitter': {
      const twitUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
      window.open(twitUrl, '_blank', 'noopener,noreferrer');
      success = true;
      message = 'Inafungua X (Twitter) kushiriki...';
      break;
    }
    case 'facebook': {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      window.open(fbUrl, '_blank', 'noopener,noreferrer');
      success = true;
      message = 'Inafungua Facebook kushiriki...';
      break;
    }
    case 'native': {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: content.title || 'RAVINI',
            text: content.text || 'Tazama maudhui haya kwenye RAVINI',
            url: shareUrl,
          });
          success = true;
          message = 'Umeshiriki kikamilifu!';
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            // Fallback to clipboard
            await copyToClipboard(shareUrl);
            success = true;
            message = 'Kiunganishi kimenakiliwa kwenye clipboard!';
          } else {
            return { success: false, message: 'Ushiriki umesitishwa.' };
          }
        }
      } else {
        await copyToClipboard(shareUrl);
        success = true;
        message = 'Karatasi ya mfumo haipatikani: Kiunganishi kimenakiliwa kwenye clipboard!';
      }
      break;
    }
    case 'copy': {
      await copyToClipboard(shareUrl);
      success = true;
      message = 'Kiunganishi kimenakiliwa kikamilifu kwenye clipboard!';
      break;
    }
  }

  let newSharesCount: number | undefined;
  if (success) {
    const res = recordContentShare(content.type, content.id, destination, actor);
    newSharesCount = res.newSharesCount;
  }

  return { success, message, newSharesCount };
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fallback
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (e) {
    console.error('Copy fallback failed', e);
  }
  document.body.removeChild(textArea);
}
