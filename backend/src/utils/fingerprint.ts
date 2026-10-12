import { Request } from 'express';
import crypto from 'crypto';

export interface DeviceInfo {
  deviceIdentifier: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
}

export function extractDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';

  // Parse OS
  let os = 'Unknown OS';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';

  // Parse Browser
  let browser = 'Unknown Browser';
  if (/edg/i.test(userAgent)) browser = 'Edge';
  else if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) browser = 'Safari';
  else if (/opera|opr/i.test(userAgent)) browser = 'Opera';

  // Determine user friendly device name
  let deviceType = 'Desktop';
  if (/mobile/i.test(userAgent) || /android/i.test(userAgent) || /iphone/i.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'Tablet';
  }

  const deviceName = `${deviceType} (${os} - ${browser})`;

  // Optional client-supplied device ID from localStorage (or fallback hash)
  const clientProvidedId = req.headers['x-device-id'] as string;
  
  // Safe hash of user-agent + clientProvidedId to create a stable identifier
  const rawId = clientProvidedId ? `${clientProvidedId}-${os}-${browser}` : `${ipAddress}-${userAgent}`;
  const deviceIdentifier = crypto.createHash('sha256').update(rawId).digest('hex').substring(0, 32);

  return {
    deviceIdentifier,
    deviceName,
    browser,
    os,
    ipAddress,
  };
}

