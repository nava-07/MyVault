import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  Calendar,
  FolderPlus,
  Check,
  HardDrive,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDocuments } from '@/hooks/useDocuments';
import { useCategories } from '@/hooks/useCategories';
import NLoader from '@/components/ui/NLoader';

const MAX_SIZE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Acceptable file types as specified: PDF, JPG, PNG, WEBP, DOCX
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
};

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function Upload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createDocument, getStats } = useDocuments();
  const { categories, addCategory } = useCategories();

  // Form states
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');

  // Inline custom category creation
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Files state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  // Upload progress tracking
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadSuccessDocs, setUploadSuccessDocs] = useState([]);

  const stats = useMemo(() => getStats(), [getStats]);

  // Dropzone file drop handler
  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      const errors = [];

      // Handle rejections
      fileRejections.forEach(({ file, errors: rejErrors }) => {
        rejErrors.forEach((err) => {
          if (err.code === 'file-too-large') {
            errors.push(`${file.name} exceeds the ${MAX_SIZE_MB} MB file limit.`);
          } else if (err.code === 'file-invalid-type') {
            errors.push(`${file.name} is not a supported file type (PDF, JPG, PNG, WEBP, DOCX).`);
          } else {
            errors.push(`${file.name}: ${err.message}`);
          }
        });
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }

      // Add valid files
      const newItems = acceptedFiles.map((file) => {
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        return {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
          previewUrl,
          progress: 0,
        };
      });

      setSelectedFiles((prev) => {
        const combined = [...prev, ...newItems];
        if (combined.length === 1 && !title) {
          setTitle(combined[0].title);
        }
        return combined;
      });
    },
    [title]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    multiple: true,
  });

  // Remove a selected file
  const handleRemoveFile = (idToRemove) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  // Add custom category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSavingCategory(true);
    try {
      const created = await addCategory(newCategoryName.trim());
      if (created) {
        setSelectedCategoryId(created.id);
        setNewCategoryName('');
        setIsAddingCategory(false);
        toast.success(`Category "${created.name}" created`);
      }
    } catch (err) {
      toast.error('Failed to create category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Start upload
  const handleStartUpload = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      toast.error('Please add at least one file to upload');
      return;
    }
    if (!title.trim() && selectedFiles.length === 1) {
      toast.error('Please enter a document title');
      return;
    }

    setIsUploading(true);
    setOverallProgress(0);
    const uploadedResults = [];

    try {
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const item = selectedFiles[i];
        const docTitle = totalFiles === 1 ? title.trim() : item.title || item.file.name;

        const result = await createDocument({
          title: docTitle,
          description: description.trim() || null,
          category_id: selectedCategoryId || null,
          file: item.file,
          issue_date: issueDate || null,
          onProgress: (percent) => {
            const singleWeight = 100 / totalFiles;
            const currentTotal = Math.round(i * singleWeight + (percent / 100) * singleWeight);
            setOverallProgress(currentTotal);
          },
        });

        uploadedResults.push(result);
      }

      setOverallProgress(100);
      setUploadSuccessDocs(uploadedResults);
      toast.success(
        totalFiles === 1
          ? 'File successfully stored in your vault'
          : `All ${totalFiles} files successfully stored in your vault`
      );
    } catch (err) {
      console.error('Upload flow error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form
  const handleResetForm = () => {
    selectedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedFiles([]);
    setTitle('');
    setDescription('');
    setIssueDate('');
    setUploadSuccessDocs([]);
    setOverallProgress(0);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)]">
              Upload Documents
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Files are directly stored in private vault storage with bank-grade encryption.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="btn-ghost inline-flex items-center gap-1.5 self-start text-xs font-semibold"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Vault Storage Indicator */}
        <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Storage Usage
              </p>
              <p className="text-sm font-bold text-[var(--color-text)]">
                {formatBytes(stats.totalBytes)} <span className="text-xs font-normal text-[var(--color-text-muted)]">across {stats.totalFiles} documents</span>
              </p>
            </div>
          </div>
        </div>

        {/* Success View */}
        {uploadSuccessDocs.length > 0 ? (
          <div className="card p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text)]">Upload Complete!</h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {uploadSuccessDocs.length} {uploadSuccessDocs.length === 1 ? 'file' : 'files'} securely uploaded and registered in your vault.
              </p>
            </div>

            <div className="max-w-md mx-auto divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
              {uploadSuccessDocs.map((doc) => (
                <div key={doc.id} className="p-3 text-left flex items-center justify-between">
                  <div className="truncate pr-3">
                    <p className="text-xs font-bold text-[var(--color-text)] truncate">{doc.title}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{doc.file_name} • {formatBytes(doc.file_size)}</p>
                  </div>
                  <Link
                    to={`/files/${doc.id}`}
                    className="btn-outline py-1 px-2.5 text-xs inline-flex items-center gap-1 shrink-0"
                  >
                    View File
                  </Link>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleResetForm}
                className="btn-secondary inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Upload More
              </button>
              <Link to="/dashboard" className="btn-primary inline-flex items-center gap-1.5">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleStartUpload} className="space-y-6">
            {/* Category Selector + Add Category Option */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="label mb-0">Select Category</label>
                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Custom Category
                  </button>
                )}
              </div>

              {isAddingCategory ? (
                <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-primary-300 dark:border-primary-800 flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name (e.g., Medical Records, Tax Receipts)..."
                    className="input-field text-xs py-1.5"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCategory}
                    disabled={isSavingCategory || !newCategoryName.trim()}
                    className="btn-primary text-xs py-1.5 px-3 shrink-0"
                  >
                    {isSavingCategory ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                    }}
                    className="btn-ghost text-xs py-1.5 px-2 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">No Category (Uncategorized)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Document Metadata Form */}
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider">
                Document Details
              </h3>

              <div>
                <label className="label">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={selectedFiles.length <= 1}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master's Degree Certificate, Q3 Financial Report"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Date of Issue / Achievement (Optional)</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes, issuing organization, grade, or context..."
                  className="input-field"
                />
              </div>
            </div>

            {/* Dropzone Area */}
            <div className="card p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider">
                Select Files (PDF, JPG, PNG, WEBP, DOCX)
              </h3>

              <div
                {...getRootProps()}
                className={clsx(
                  'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                    : 'border-[var(--color-border)] hover:border-primary-400 bg-[var(--color-surface)]'
                )}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {isDragActive ? 'Drop files here...' : 'Drag & drop your files here, or click to browse'}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Supported formats: PDF, JPG, PNG, WEBP, DOCX (Max {MAX_SIZE_MB} MB per file)
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  High-res images are automatically compressed before upload
                </p>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl space-y-1">
                  {validationErrors.map((err, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                    Files to upload ({selectedFiles.length}):
                  </p>
                  <div className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
                    {selectedFiles.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 truncate">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt={item.title}
                              className="w-10 h-10 object-cover rounded-lg border border-[var(--color-border)] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950/50 rounded-lg flex items-center justify-center text-primary-600 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-xs font-semibold text-[var(--color-text)] truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                              {item.file.name} • {formatBytes(item.file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(item.id)}
                          disabled={isUploading}
                          className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Centered Uploading Modal Overlay */}
            {isUploading && (
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-bg)]/85 backdrop-blur-md transition-all duration-200">
                <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm w-full mx-4 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl shadow-2xl animate-fade-in">
                  <NLoader size="xl" />
                  <p className="mt-5 text-base font-bold text-[var(--color-text)]">
                    Uploading to MyVault...
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {overallProgress}% completed
                  </p>
                  <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden mt-4 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-primary-600 to-indigo-600 transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-2">
              <Link to="/dashboard" className="btn-ghost">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isUploading || selectedFiles.length === 0}
                className="btn-primary py-2.5 px-6 inline-flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <NLoader size="xs" color="currentColor" />
                    <span>Uploading ({overallProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload to MyVault</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
