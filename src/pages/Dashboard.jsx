import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Award,
  BookOpen,
  Image as ImageIcon,
  Search,
  LayoutGrid,
  List,
  Plus,
  Upload,
  Download,
  Eye,
  Trash2,
  Edit2,
  Calendar,
  Filter,
  HardDrive,
  AlertTriangle,
  RotateCcw,
  Archive,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDocuments } from '@/hooks/useDocuments';
import { useCategories } from '@/hooks/useCategories';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import Loading from '@/components/ui/Loading';
import NLoader from '@/components/ui/NLoader';

// Helper for formatted bytes
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Date formatter
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy');
  } catch (e) {
    return dateStr;
  }
};

// Helper for category badge color
const getCategoryBadgeColor = (categoryName = '') => {
  const name = categoryName.toLowerCase();
  if (name.includes('certificate')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  }
  if (name.includes('paper')) {
    return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
  }
  if (name.includes('report')) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  }
  if (name.includes('photo')) {
    return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const {
    documents,
    loading,
    fetchDocuments,
    updateDocument,
    deleteDocument,
    getDownloadUrl,
    getViewUrl,
    getStats,
    downloadCategoryAsZip,
  } = useDocuments();
  const { categories } = useCategories();

  // Search and filter state
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedFileType, setSelectedFileType] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals state
  const [editModalDoc, setEditModalDoc] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category_id: '',
    issue_date: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const [deleteModalDoc, setDeleteModalDoc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Cached presigned preview URLs for thumbnail cards
  const [thumbnailUrls, setThumbnailUrls] = useState({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Apply filters on debounced search, category, file type, sort
  useEffect(() => {
    fetchDocuments({
      search: debouncedSearch,
      categoryId: selectedCategory === 'ALL' ? null : selectedCategory,
      fileType: selectedFileType === 'ALL' ? null : selectedFileType,
      sortBy,
    });
  }, [debouncedSearch, selectedCategory, selectedFileType, sortBy, fetchDocuments]);

  // Load thumbnail URLs for image files in current view
  useEffect(() => {
    let isMounted = true;
    const loadThumbnails = async () => {
      const imageDocs = documents.filter((d) => d.file_type?.startsWith('image/'));
      for (const d of imageDocs) {
        if (!thumbnailUrls[d.id] && d.file_path) {
          try {
            const url = await getViewUrl(d.file_path);
            if (isMounted) {
              setThumbnailUrls((prev) => ({ ...prev, [d.id]: url }));
            }
          } catch (e) {
            // ignore
          }
        }
      }
    };

    if (documents.length > 0) {
      loadThumbnails();
    }

    return () => {
      isMounted = false;
    };
  }, [documents, getViewUrl]);

  // Statistics calculation
  const stats = useMemo(() => getStats(), [getStats]);

  // Direct download handler
  const handleDownload = async (doc, e) => {
    if (e) e.stopPropagation();
    try {
      toast.loading(`Preparing download: ${doc.file_name}...`, { id: 'download-toast' });
      const downloadUrl = await getDownloadUrl(doc.file_path, doc.title, doc.file_name);
      toast.dismiss('download-toast');

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.file_name || doc.title;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (err) {
      toast.dismiss('download-toast');
      toast.error('Unable to download file. Please try again.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (doc, e) => {
    if (e) e.stopPropagation();
    setEditModalDoc(doc);
    setEditForm({
      title: doc.title || '',
      description: doc.description || '',
      category_id: doc.category_id || '',
      issue_date: doc.issue_date || '',
    });
  };

  // Save Edit Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalDoc) return;
    if (!editForm.title.trim()) {
      toast.error('Document title is required');
      return;
    }

    setIsUpdating(true);
    try {
      await updateDocument(editModalDoc.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        category_id: editForm.category_id || null,
        issue_date: editForm.issue_date || null,
      });
      setEditModalDoc(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (doc, e) => {
    if (e) e.stopPropagation();
    setDeleteModalDoc(doc);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalDoc) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deleteModalDoc.id, deleteModalDoc.file_path);
      setDeleteModalDoc(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Category ZIP Download
  const handleDownloadCategoryZip = async () => {
    const activeCat = categories.find((c) => c.id === selectedCategory);
    const catName = activeCat ? activeCat.name : selectedCategory === 'ALL' ? 'All_Documents' : 'Category';
    setIsZipping(true);
    try {
      await downloadCategoryAsZip(selectedCategory, catName);
    } finally {
      setIsZipping(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCategory('ALL');
    setSelectedFileType('ALL');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages = Math.ceil(documents.length / itemsPerPage) || 1;
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return documents.slice(start, start + itemsPerPage);
  }, [documents, currentPage, itemsPerPage]);

  const userName = profile?.full_name || user?.user_metadata?.full_name || 'Vault Owner';

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
              Welcome back, <span className="text-primary-600 dark:text-primary-400">{userName}</span>
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Securely access, organize, and download your personal vault files anytime.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/upload')}
              className="btn-primary inline-flex items-center gap-2 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Documents</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Total Files */}
          <div className="card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Total Files</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--color-text)] mt-3">{stats.totalFiles}</p>
          </div>

          {/* Card 2: Certificates */}
          <div
            onClick={() => {
              const cat = categories.find((c) => c.name.toLowerCase().includes('cert'));
              if (cat) setSelectedCategory(cat.id);
            }}
            className="card p-4 flex flex-col justify-between cursor-pointer hover:border-emerald-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Certificates</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--color-text)] mt-3">
              {stats.categoryCounts['Certificates'] || 0}
            </p>
          </div>

          {/* Card 3: Papers */}
          <div
            onClick={() => {
              const cat = categories.find((c) => c.name.toLowerCase().includes('paper'));
              if (cat) setSelectedCategory(cat.id);
            }}
            className="card p-4 flex flex-col justify-between cursor-pointer hover:border-purple-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Papers</span>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-lg text-purple-600 dark:text-purple-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--color-text)] mt-3">
              {stats.categoryCounts['Published Papers'] || 0}
            </p>
          </div>

          {/* Card 4: Reports */}
          <div
            onClick={() => {
              const cat = categories.find((c) => c.name.toLowerCase().includes('report'));
              if (cat) setSelectedCategory(cat.id);
            }}
            className="card p-4 flex flex-col justify-between cursor-pointer hover:border-amber-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Reports</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600 dark:text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--color-text)] mt-3">
              {stats.categoryCounts['Reports'] || 0}
            </p>
          </div>

          {/* Card 5: Photos */}
          <div
            onClick={() => {
              const cat = categories.find((c) => c.name.toLowerCase().includes('photo'));
              if (cat) setSelectedCategory(cat.id);
            }}
            className="card p-4 flex flex-col justify-between cursor-pointer hover:border-pink-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Photos</span>
              <div className="p-2 bg-pink-50 dark:bg-pink-950/50 rounded-lg text-pink-600 dark:text-pink-400">
                <ImageIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[var(--color-text)] mt-3">
              {stats.categoryCounts['Achievement Photos'] || 0}
            </p>
          </div>

          {/* Card 6: Storage Used */}
          <div className="card p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase">Storage Used</span>
              <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-lg text-sky-600 dark:text-sky-400">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg font-bold text-[var(--color-text)]">
                {formatBytes(stats.totalBytes)}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {stats.totalFiles} uploaded {stats.totalFiles === 1 ? 'file' : 'files'}
              </p>
            </div>
          </div>
        </div>

        {/* Search, Filter, and Action Controls */}
        <div className="card p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, description, category, or file name..."
                className="input-field pl-10 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field py-2 text-xs w-auto"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* File Type Filter */}
              <select
                value={selectedFileType}
                onChange={(e) => {
                  setSelectedFileType(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field py-2 text-xs w-auto"
              >
                <option value="ALL">All Types</option>
                <option value="pdf">PDF Documents</option>
                <option value="image">Images (JPG, PNG, WEBP)</option>
                <option value="document">Word Docs (DOCX)</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field py-2 text-xs w-auto"
              >
                <option value="newest">Newest Uploads</option>
                <option value="oldest">Oldest Uploads</option>
                <option value="title_asc">Name (A-Z)</option>
                <option value="title_desc">Name (Z-A)</option>
              </select>

              {/* Download Category as ZIP Button */}
              <button
                type="button"
                onClick={handleDownloadCategoryZip}
                disabled={isZipping || documents.length === 0}
                className="btn-secondary py-2 px-3 text-xs inline-flex items-center gap-1.5 shrink-0"
                title="Download all files in this view as a single ZIP archive"
              >
                {isZipping ? (
                  <NLoader size="xs" color="currentColor" />
                ) : (
                  <Archive className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                )}
                <span>ZIP Download</span>
              </button>

              {/* View Toggle (Grid / List) */}
              <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-600 text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  )}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'p-1.5 rounded-md transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  )}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Reset Filters */}
              {(searchInput || selectedCategory !== 'ALL' || selectedFileType !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn-ghost text-xs p-2 text-primary-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative min-h-[360px]">
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--color-bg)]/85 backdrop-blur-sm rounded-xl">
              <Loading size="lg" text="Retrieving your encrypted vault files..." />
            </div>
          )}

          {!loading && documents.length === 0 ? (
            <EmptyState
              title={searchInput ? 'No matching documents' : 'Your vault is empty'}
              description={
                searchInput
                  ? 'Try adjusting your search terms or filters.'
                  : 'Upload your certificates, published papers, reports, and achievement photos to keep them safe in your secure personal vault.'
              }
              action={{
                label: searchInput ? 'Reset Filters' : 'Upload First Document',
                onClick: searchInput ? handleResetFilters : () => navigate('/upload'),
              }}
            />
          ) : viewMode === 'grid' ? (
          /* ================================================================ */
          /* GRID VIEW                                                        */
          /* ================================================================ */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedDocs.map((doc) => {
              const isImg = doc.file_type?.startsWith('image/');
              const isPdf = doc.file_type?.includes('pdf') || doc.file_name?.endsWith('.pdf');
              const previewThumb = thumbnailUrls[doc.id];

              return (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/files/${doc.id}`)}
                  className="card overflow-hidden cursor-pointer group hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Thumbnail / Header Preview */}
                  <div className="h-44 bg-[var(--color-surface)] relative overflow-hidden flex items-center justify-center border-b border-[var(--color-border)]">
                    {isImg && previewThumb ? (
                      <img
                        src={previewThumb}
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : isPdf ? (
                      <div className="flex flex-col items-center justify-center text-red-500 gap-1.5 p-4 text-center">
                        <FileText className="w-12 h-12" />
                        <span className="text-xs font-mono font-semibold uppercase">PDF Document</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-blue-500 gap-1.5 p-4 text-center">
                        <FolderOpen className="w-12 h-12" />
                        <span className="text-xs font-mono font-semibold uppercase">
                          {doc.file_name?.split('.').pop() || 'File'}
                        </span>
                      </div>
                    )}

                    {/* Category badge overlay */}
                    {doc.category?.name && (
                      <span
                        className={clsx(
                          'absolute top-2.5 left-2.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-sm backdrop-blur-md',
                          getCategoryBadgeColor(doc.category.name)
                        )}
                      >
                        {doc.category.name}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[var(--color-text)] truncate group-hover:text-primary-600 transition-colors">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mt-1">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(doc.issue_date || doc.created_at)}</span>
                      </div>
                      <span>{formatBytes(doc.file_size)}</span>
                    </div>
                  </div>

                  {/* Quick Card Action Buttons */}
                  <div className="px-4 py-2.5 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/files/${doc.id}`);
                      }}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDownload(doc, e)}
                        className="p-1 text-[var(--color-text-secondary)] hover:text-primary-600 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(doc, e)}
                        className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                        title="Edit metadata"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenDelete(doc, e)}
                        className="p-1 text-[var(--color-text-secondary)] hover:text-red-600 transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================================================================ */
          /* LIST VIEW                                                        */
          /* ================================================================ */
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {paginatedDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => navigate(`/files/${doc.id}`)}
                      className="hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-[var(--color-text)]">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                          <div>
                            <p className="truncate max-w-xs">{doc.title}</p>
                            <p className="text-xs text-[var(--color-text-muted)] font-normal truncate max-w-xs">
                              {doc.file_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {doc.category?.name && (
                          <span
                            className={clsx(
                              'text-xs font-semibold px-2 py-0.5 rounded-full border',
                              getCategoryBadgeColor(doc.category.name)
                            )}
                          >
                            {doc.category.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--color-text-secondary)]">
                        {formatDate(doc.issue_date || doc.created_at)}
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--color-text-secondary)]">
                        {formatBytes(doc.file_size)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleDownload(doc, e)}
                            className="p-1.5 text-[var(--color-text-secondary)] hover:text-primary-600 rounded-md hover:bg-[var(--color-surface-elevated)]"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(doc, e)}
                            className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-md hover:bg-[var(--color-surface-elevated)]"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenDelete(doc, e)}
                            className="p-1.5 text-[var(--color-text-secondary)] hover:text-red-600 rounded-md hover:bg-[var(--color-surface-elevated)]"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, documents.length)} of {documents.length} files
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="btn-ghost p-2 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="btn-ghost p-2 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile screens */}
      <button
        type="button"
        onClick={() => navigate('/upload')}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-full bg-primary-600 text-white shadow-xl flex items-center justify-center hover:bg-primary-700 transition-colors z-40"
        aria-label="Upload document"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={Boolean(editModalDoc)}
        onClose={() => setEditModalDoc(null)}
        title="Edit Document Details"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              value={editForm.category_id}
              onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
              className="input-field"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date of Issue / Achievement</label>
            <input
              type="date"
              value={editForm.issue_date || ''}
              onChange={(e) => setEditForm({ ...editForm, issue_date: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setEditModalDoc(null)}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="btn-primary"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteModalDoc)}
        onClose={() => setDeleteModalDoc(null)}
        title="Delete Document"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to delete{' '}
            <strong className="text-[var(--color-text)]">"{deleteModalDoc?.title}"</strong>?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            This will permanently remove the record and delete the associated file from your storage.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setDeleteModalDoc(null)}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="btn-danger"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
