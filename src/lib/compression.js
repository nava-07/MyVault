// ==============================================================================
// Client-side Image Compression Utility
// Automatically compresses high-resolution images on the client before R2 upload
// ==============================================================================

/**
 * Compresses an image file on the client using HTML5 Canvas.
 * Non-image files (PDF, DOCX) and small images (< 1MB) are returned unchanged.
 * 
 * @param {File} file - Original file from dropzone/input
 * @param {Object} [options]
 * @param {number} [options.maxSizeMB=1] - Threshold above which compression triggers
 * @param {number} [options.maxWidth=2048] - Max width constraint
 * @param {number} [options.maxHeight=2048] - Max height constraint
 * @param {number} [options.quality=0.85] - Compression quality (0 - 1)
 * @returns {Promise<File>} Compressed File or original File
 */
export async function compressImageIfNeeded(file, options = {}) {
  const {
    maxSizeMB = 1,
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
  } = options;

  // Only compress images
  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // Do not compress GIFs or SVGs to preserve animation and vector crispness
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  // If already under threshold, skip compression
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // fallback to original
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output MIME type (prefer original or image/jpeg)
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compression didn't save space, return original
              return resolve(file);
            }

            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });

            console.log(
              `[MyVault] Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB ➔ ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
            );
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => {
        resolve(file); // fallback on image load error
      };
    };

    reader.onerror = () => {
      resolve(file);
    };
  });
}

export default compressImageIfNeeded;
