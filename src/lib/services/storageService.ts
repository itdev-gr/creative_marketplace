import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config.js';
import type { Role } from '../types/role.js';
import { isRole } from '../types/role.js';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function isAllowedType(file: File): boolean {
  return ALLOWED_TYPES.includes(file.type);
}

/**
 * Upload up to 4 portfolio images for a service profile. Returns an array of download URLs in order.
 * Files must be image/jpeg, image/png, or image/webp and at most 2MB each.
 */
export async function uploadPortfolioImages(
  sellerId: string,
  role: Role,
  files: File[]
): Promise<string[]> {
  if (!isRole(role) || files.length === 0) return [];
  const toUpload = files.slice(0, 4);
  for (const file of toUpload) {
    if (!isAllowedType(file)) {
      throw new Error(`Invalid file type: ${file.name}. Use JPEG, PNG or WebP.`);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File too large: ${file.name}. Max 2MB per image.`);
    }
  }

  const basePath = `serviceProfiles/${sellerId}_${role}`;
  const urls: string[] = [];

  for (let i = 0; i < toUpload.length; i++) {
    const file = toUpload[i];
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${basePath}/portfolio_${i}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    urls.push(url);
  }

  return urls;
}
