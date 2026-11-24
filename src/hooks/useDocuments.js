import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  BUCKET_NAME,
  uploadStorageFile,
  getViewSignedUrl,
  getDownloadSignedUrl,
  deleteStorageFile,
  buildDownloadName,
} from '@/lib/storage';
import { compressImageIfNeeded } from '@/lib/compression';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches documents for the logged-in user with optional filters and full-text search.
   */
  const fetchDocuments = useCallback(
    async (filters = {}) => {
      if (!user?.id) {
        setDocuments([]);
        return [];
      }

      setLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('documents')
          .select('*, category:categories(id, name)')
          .eq('user_id', user.id);

        // Filter by category
        if (filters.categoryId && filters.categoryId !== 'all') {
          query = query.eq('category_id', filters.categoryId);
        }

        // Filter by file type
        if (filters.fileType && filters.fileType !== 'all') {
          if (filters.fileType === 'pdf') {
            query = query.ilike('file_type', '%pdf%');
          } else if (filters.fileType === 'image') {
            query = query.ilike('file_type', '%image%');
          } else if (filters.fileType === 'document') {
            query = query.or('file_type.ilike.%word%,file_type.ilike.%officedocument%,file_type.ilike.%doc%');
          }
        }

        // Full-text and substring search
        if (filters.search && filters.search.trim()) {
          const s = filters.search.trim();
          query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%,file_name.ilike.%${s}%`);
        }

        // Sorting
        const sortBy = filters.sortBy || 'newest';
        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'oldest') {
          query = query.order('created_at', { ascending: true });
        } else if (sortBy === 'title_asc') {
          query = query.order('title', { ascending: true });
        } else if (sortBy === 'title_desc') {
          query = query.order('title', { ascending: false });
        }

        const { data, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;

        setDocuments(data || []);
        return data || [];
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Fetches a single document by its UUID.
   */
  const getDocument = useCallback(
    async (id) => {
      if (!id || !user?.id) return null;
      try {
        const { data, error: docErr } = await supabase
          .from('documents')
          .select('*, category:categories(id, name)')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (docErr) throw docErr;
        return data;
      } catch (err) {
        console.error('Error fetching document by ID:', err);
        return null;
      }
    },
    [user?.id]
  );

  /**
   * Creates a new document:
   * 1. Compresses image on client if needed
   * 2. Uploads file to Supabase Storage bucket 'myvault-files' at {user_id}/{uuid}-{safe_filename}
   * 3. Inserts row in documents table with file_path
   * 4. If DB insert fails, removes the uploaded file from storage
   */
  const createDocument = useCallback(
    async ({ title, description, category_id, file, issue_date, onProgress }) => {
      if (!user?.id) throw new Error('You must be signed in to upload.');
      if (!file) throw new Error('Please select a file to upload.');
      if (!title || !title.trim()) throw new Error('Document title is required.');

      setLoading(true);
      setError(null);
      let uploadedFilePath = null;

      try {
        if (onProgress) onProgress(15);

        // Step 1: Compress images before upload
        const processedFile = await compressImageIfNeeded(file);

        if (onProgress) onProgress(40);

        // Step 2: Upload to Supabase Storage 'myvault-files'
        const { path } = await uploadStorageFile(user.id, processedFile);
        uploadedFilePath = path;

        if (onProgress) onProgress(75);

        // Step 3: Insert row in Supabase documents table with file_path
        const payload = {
          user_id: user.id,
          category_id: category_id || null,
          title: title.trim(),
          description: description?.trim() || null,
          file_path: path,
          file_name: processedFile.name,
          file_type: processedFile.type || 'application/octet-stream',
          file_size: processedFile.size,
          issue_date: issue_date || null,
        };

        const { data, error: insertErr } = await supabase
          .from('documents')
          .insert([payload])
          .select('*, category:categories(id, name)')
          .single();

        if (insertErr) {
          // If insert fails, clean up the uploaded storage file
          if (uploadedFilePath) {
            await deleteStorageFile(uploadedFilePath).catch(() => {});
          }
          throw insertErr;
        }

        if (onProgress) onProgress(100);

        setDocuments((prev) => [data, ...prev]);
        toast.success(`Uploaded "${title}"`);
        return data;
      } catch (err) {
        console.error('Error creating document:', err);
        const msg = err.message || 'Failed to upload document';
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Updates document metadata (title, description, category, issue_date).
   */
  const updateDocument = useCallback(
    async (id, updates) => {
      if (!id || !user?.id) throw new Error('Document ID and user session required');

      setLoading(true);
      setError(null);
      try {
        const payload = {
          ...updates,
          updated_at: new Date().toISOString(),
        };
        delete payload.id;
        delete payload.user_id;
        delete payload.file_path;
        delete payload.created_at;

        const { data, error: updateErr } = await supabase
          .from('documents')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id)
          .select('*, category:categories(id, name)')
          .single();

        if (updateErr) throw updateErr;

        setDocuments((prev) => prev.map((d) => (d.id === id ? data : d)));
        toast.success('Document updated');
        return data;
      } catch (err) {
        console.error('Error updating document:', err);
        const msg = err.message || 'Failed to update document';
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Replaces a document's file:
   * Uploads new file first to Supabase Storage, updates the row with new file_path,
   * then deletes the old file from storage.
   */
  const replaceDocumentFile = useCallback(
    async (id, newFile, oldFilePath, onProgress) => {
      if (!id || !user?.id || !newFile) throw new Error('Missing file or document ID');

      setLoading(true);
      let newUploadedPath = null;
      try {
        if (onProgress) onProgress(20);

        const processedFile = await compressImageIfNeeded(newFile);

        if (onProgress) onProgress(50);

        // Upload new file first
        const { path } = await uploadStorageFile(user.id, processedFile);
        newUploadedPath = path;

        if (onProgress) onProgress(80);

        // Update database row with new file_path
        const { data, error: updateErr } = await supabase
          .from('documents')
          .update({
            file_path: path,
            file_name: processedFile.name,
            file_type: processedFile.type,
            file_size: processedFile.size,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select('*, category:categories(id, name)')
          .single();

        if (updateErr) {
          // Clean up new file if update failed
          await deleteStorageFile(newUploadedPath).catch(() => {});
          throw updateErr;
        }

        // Delete the old file from storage
        if (oldFilePath) {
          await deleteStorageFile(oldFilePath).catch(() => {});
        }

        if (onProgress) onProgress(100);

        setDocuments((prev) => prev.map((d) => (d.id === id ? data : d)));
        toast.success('File replaced successfully');
        return data;
      } catch (err) {
        console.error('Error replacing file:', err);
        toast.error(err.message || 'Failed to replace file');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Deletes a document:
   * 1. Removes storage file from Supabase Storage bucket 'myvault-files'
   * 2. Deletes row from documents table
   */
  const deleteDocument = useCallback(
    async (id, filePath) => {
      if (!id || !user?.id) throw new Error('Document ID required');

      setLoading(true);
      try {
        // Step 1: Remove from Supabase Storage
        if (filePath) {
          await deleteStorageFile(filePath);
        }

        // Step 2: Delete from documents table
        const { error: delErr } = await supabase
          .from('documents')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (delErr) throw delErr;

        setDocuments((prev) => prev.filter((d) => d.id !== id));
        toast.success('Document deleted');
        return true;
      } catch (err) {
        console.error('Error deleting document:', err);
        const msg = err.message || 'Failed to delete document';
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  /**
   * Generates a signed view URL (valid 600s).
   */
  const getViewUrl = useCallback(async (filePath) => {
    if (!filePath) return '';
    return await getViewSignedUrl(filePath, 600);
  }, []);

  /**
   * Generates a signed download URL (valid 600s) with cleaned title + original extension.
   */
  const getDownloadUrl = useCallback(async (filePath, title, originalFileName) => {
    if (!filePath) return '';
    return await getDownloadSignedUrl(filePath, title, originalFileName, 600);
  }, []);

  /**
   * Calculates storage stats.
   */
  const getStats = useCallback(() => {
    const totalFiles = documents.length;
    const totalBytes = documents.reduce((sum, doc) => sum + (Number(doc.file_size) || 0), 0);

    const categoryCounts = {};
    documents.forEach((doc) => {
      const catName = doc.category?.name || 'Other';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    });

    const recentUploads = [...documents]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    return {
      totalFiles,
      totalBytes,
      categoryCounts,
      recentUploads,
    };
  }, [documents]);

  /**
   * Downloads all documents in a category as a ZIP archive.
   */
  const downloadCategoryAsZip = useCallback(
    async (categoryId, categoryName = 'Documents', onProgress) => {
      const categoryDocs = documents.filter((d) =>
        categoryId === 'all' || categoryId === 'ALL' ? true : d.category_id === categoryId
      );

      if (categoryDocs.length === 0) {
        toast.error('No files found in this category to download.');
        return;
      }

      const toastId = toast.loading(`Preparing ZIP for "${categoryName}"...`);
      try {
        const zip = new JSZip();
        let completed = 0;

        for (const doc of categoryDocs) {
          try {
            const downloadUrl = await getDownloadSignedUrl(doc.file_path, doc.title, doc.file_name, 600);
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const safeDownloadName = buildDownloadName(doc.title, doc.file_name);
            zip.file(safeDownloadName, blob);
          } catch (fetchErr) {
            console.warn(`Failed to fetch file for zip: ${doc.title}`, fetchErr);
          }
          completed += 1;
          if (onProgress) {
            onProgress(Math.round((completed / categoryDocs.length) * 100));
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `MyVault_${categoryName.replace(/[/\\:*?"<>|\s]/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        toast.success(`Downloaded ${categoryDocs.length} files as ZIP`, { id: toastId });
      } catch (err) {
        console.error('ZIP generation error:', err);
        toast.error('Failed to create ZIP file', { id: toastId });
      }
    },
    [documents]
  );

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user?.id, fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    getDocument,
    createDocument,
    updateDocument,
    replaceDocumentFile,
    deleteDocument,
    getViewUrl,
    getDownloadUrl,
    getStats,
    downloadCategoryAsZip,
  };
}

export default useDocuments;
