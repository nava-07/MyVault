import { clsx } from 'clsx';
import { format, isValid, parseISO } from 'date-fns';

/**
 * Merges multiple class names conditionally using clsx.
 * 
 * @param  {...any} classes 
 * @returns {string} Merged class string
 */
export function cn(...classes) {
  return clsx(classes);
}

/**
 * Converts a raw byte count into a human-readable string (B, KB, MB, GB, TB).
 * 
 * @param {number} bytes 
 * @returns {string} Human-readable file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0 || !bytes || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1));
  return `${formatted} ${sizes[i]}`;
}

/**
 * Formats a date string, Date object, or timestamp using date-fns.
 * 
 * @param {string|Date|number} date 
 * @param {string} [formatStr='MMM dd, yyyy'] 
 * @returns {string} Formatted date string or empty string on invalid date
 */
export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  if (!date) return '';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(parsed)) return '';
    return format(parsed, formatStr);
  } catch {
    return '';
  }
}

/**
 * Extracts the file extension (without dot, lowercased) from a filename or File object.
 * 
 * @param {string|File} filename 
 * @returns {string} File extension (e.g. 'pdf', 'png')
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  const name = typeof filename === 'string' ? filename : filename.name || '';
  const cleanName = name.split('?')[0].split('#')[0];
  const lastDot = cleanName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === cleanName.length - 1) return '';
  return cleanName.substring(lastDot + 1).toLowerCase();
}

/**
 * Returns a Lucide icon component name for a given file MIME type or filename/extension.
 * 
 * @param {string} fileType - MIME type or file extension
 * @returns {string} Lucide icon name string
 */
export function getFileIcon(fileType) {
  if (!fileType) return 'File';
  const lower = fileType.toLowerCase();

  // Images
  if (
    lower.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(lower)
  ) {
    return 'Image';
  }

  // PDFs
  if (lower === 'application/pdf' || lower === 'pdf') {
    return 'FileText';
  }

  // Spreadsheets
  if (
    lower.includes('spreadsheet') ||
    lower.includes('excel') ||
    lower.includes('csv') ||
    ['xls', 'xlsx', 'csv'].includes(lower)
  ) {
    return 'FileSpreadsheet';
  }

  // Word & Text Documents
  if (
    lower.includes('wordprocessingml') ||
    lower.includes('msword') ||
    lower.startsWith('text/') ||
    ['doc', 'docx', 'txt', 'rtf', 'md'].includes(lower)
  ) {
    return 'FileText';
  }

  // Presentations
  if (
    lower.includes('presentation') ||
    lower.includes('powerpoint') ||
    ['ppt', 'pptx'].includes(lower)
  ) {
    return 'Presentation';
  }

  // Archives
  if (
    lower.includes('zip') ||
    lower.includes('tar') ||
    lower.includes('compressed') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(lower)
  ) {
    return 'Archive';
  }

  // Audio
  if (lower.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(lower)) {
    return 'Music';
  }

  // Video
  if (lower.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(lower)) {
    return 'Video';
  }

  // Code
  if (['json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'sql'].includes(lower)) {
    return 'FileCode';
  }

  return 'File';
}

/**
 * Default allowed file extensions for uploads.
 */
const DEFAULT_ALLOWED_TYPES = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'docx',
  'doc',
  'xlsx',
  'pptx',
];

/**
 * Validates whether a file or filename has an allowed file type.
 * 
 * @param {File|string} file - File object or filename/extension
 * @returns {boolean} True if allowed
 */
export function isAllowedFileType(file) {
  if (!file) return false;
  const ext = getFileExtension(file);

  const envAllowed = import.meta.env?.VITE_ALLOWED_FILE_TYPES;
  const allowedList = envAllowed
    ? envAllowed.split(',').map((t) => t.trim().toLowerCase())
    : DEFAULT_ALLOWED_TYPES;

  return allowedList.includes(ext.toLowerCase());
}

/**
 * Validates whether a file's size is within the allowed limit.
 * 
 * @param {File} file 
 * @param {number} [maxSizeMB=25] 
 * @returns {boolean} True if within limit
 */
export function isFileSizeValid(file, maxSizeMB = 25) {
  if (!file || typeof file.size !== 'number') return false;
  const limitMB =
    maxSizeMB ||
    parseFloat(import.meta.env?.VITE_MAX_FILE_SIZE_MB) ||
    25;
  const maxSizeBytes = limitMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Generates a random share token for shareable links.
 * Uses crypto.randomUUID when available with a cryptographic fallback.
 * 
 * @returns {string} Unique token string
 */
export function generateShareToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Truncates text with an ellipsis if it exceeds maxLength.
 * 
 * @param {string} text 
 * @param {number} [maxLength=100] 
 * @returns {string} Truncated string
 */
export function truncateText(text, maxLength = 100) {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

/**
 * Creates a debounced function that delays invoking fn until after delay milliseconds.
 * 
 * @param {Function} fn 
 * @param {number} [delay=300] 
 * @returns {Function} Debounced function with .cancel() method
 */
export function debounce(fn, delay = 300) {
  let timerId = null;

  const debounced = (...args) => {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
      timerId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}

/**
 * Default categories seeded per user.
 */
export const DEFAULT_CATEGORIES = [
  { name: 'Certificates', icon: 'Award' },
  { name: 'Published Papers', icon: 'BookOpen' },
  { name: 'Reports', icon: 'FileText' },
  { name: 'Achievement Photos', icon: 'Image' },
  { name: 'Other', icon: 'FolderOpen' },
];

/**
 * Returns the Lucide icon name associated with a category name.
 * 
 * @param {string} categoryName 
 * @returns {string} Lucide icon name
 */
export function getCategoryIcon(categoryName) {
  if (!categoryName) return 'Folder';
  const found = DEFAULT_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
  );
  return found ? found.icon : 'Folder';
}

export default {
  cn,
  formatFileSize,
  formatDate,
  getFileExtension,
  getFileIcon,
  isAllowedFileType,
  isFileSizeValid,
  generateShareToken,
  truncateText,
  debounce,
  DEFAULT_CATEGORIES,
  getCategoryIcon,
};
