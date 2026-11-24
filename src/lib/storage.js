import { supabase } from './supabase';

export const BUCKET_NAME = 'myvault-files';

/**
 * Cleans illegal filename characters (/ \ : * ? " < > |) from a document title.
 * @param {string} title - The document title
 * @returns {string} Sanitized title
 */
export function cleanDownloadTitle(title) {
  if (!title) return 'document';
  return title
    .replace(/[/\\:*?"<>|]/g, '')
    .trim() || 'document';
}

/**
 * Builds a download file name from the document title and original file extension.
 * Example: "AWS Certification.pdf"
 * 
 * @param {string} title - Document title
 * @param {string} originalFileName - Original file name
 * @returns {string} Safe download filename
 */
export function buildDownloadName(title, originalFileName = '') {
  const sanitizedTitle = cleanDownloadTitle(title);
  const ext = originalFileName.includes('.')
    ? `.${originalFileName.split('.').pop()}`
    : '';

  // Avoid duplicating extension if title already ends with it
  if (ext && sanitizedTitle.toLowerCase().endsWith(ext.toLowerCase())) {
    return sanitizedTitle;
  }

  return `${sanitizedTitle}${ext}`;
}

/**
 * Sanitizes a filename for storage paths.
 * @param {string} str 
 * @returns {string} Sanitized filename
 */
export function sanitizeStorageFileName(str) {
  return (str || 'file')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Uploads a file to Supabase Storage bucket 'myvault-files'.
 * Path format: {user_id}/{uuid}-{safe_filename}
 * 
 * @param {string} userId - ID of the authenticated user
 * @param {File|Blob} file - The file to upload
 * @returns {Promise<{ path: string }>} Storage object path
 */
export async function uploadStorageFile(userId, file) {
  if (!file) throw new Error('No file provided for upload.');
  if (!userId) throw new Error('User ID is required to upload.');

  const uuid = crypto.randomUUID();
  const safeFilename = sanitizeStorageFileName(file.name);
  const path = `${userId}/${uuid}-${safeFilename}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload error: ${error.message}`);
  }

  return { path: data.path };
}

/**
 * Generates a signed URL for inline viewing in browser (valid 600s / 10 minutes).
 * 
 * @param {string} filePath - Path in myvault-files bucket
 * @param {number} [expiresIn=600] - Expiry in seconds
 * @returns {Promise<string>} Signed view URL
 */
export async function getViewSignedUrl(filePath, expiresIn = 600) {
  if (!filePath) throw new Error('File path is required.');

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Failed to generate view URL: ${error.message}`);
  }

  return data?.signedUrl || '';
}

/**
 * Generates a signed URL for attachment download with clean title + original extension.
 * Valid 600s / 10 minutes.
 * 
 * @param {string} filePath - Path in myvault-files bucket
 * @param {string} title - Document title
 * @param {string} originalFileName - Original file name
 * @param {number} [expiresIn=600] - Expiry in seconds
 * @returns {Promise<string>} Signed download URL
 */
export async function getDownloadSignedUrl(filePath, title, originalFileName, expiresIn = 600) {
  if (!filePath) throw new Error('File path is required.');

  const downloadName = buildDownloadName(title, originalFileName);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn, {
      download: downloadName,
    });

  if (error) {
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }

  return data?.signedUrl || '';
}

/**
 * Deletes a file from the myvault-files bucket.
 * 
 * @param {string} filePath - Storage path in bucket
 * @returns {Promise<void>}
 */
export async function deleteStorageFile(filePath) {
  if (!filePath) return;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.warn(`Storage delete warning for ${filePath}:`, error.message);
  }
}

export default {
  BUCKET_NAME,
  cleanDownloadTitle,
  buildDownloadName,
  uploadStorageFile,
  getViewSignedUrl,
  getDownloadSignedUrl,
  deleteStorageFile,
};
