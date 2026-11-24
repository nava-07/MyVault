import React, { useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Table,
  Eye,
} from 'lucide-react';
import NLoader from '@/components/ui/NLoader';
import { parseDocx } from './docxParser';

export default function DocumentPreview({
  fileUrl,
  fileName = '',
  fileType = '',
  title = '',
  onDownload = () => {},
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // States for DOCX & Text rendering
  const [loadingContent, setLoadingContent] = useState(false);
  const [docxHtml, setDocxHtml] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [csvRows, setCsvRows] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [viewMode, setViewMode] = useState('native'); // 'native' | 'office'

  const lowerName = (fileName || '').toLowerCase();
  const lowerType = (fileType || '').toLowerCase();

  const isImage =
    lowerType.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(lowerName);

  const isPdf =
    lowerType.includes('pdf') || /\.pdf$/i.test(lowerName);

  const isDocx =
    lowerType.includes('word') ||
    lowerType.includes('officedocument') ||
    /\.(docx|doc)$/i.test(lowerName);

  const isCsv =
    lowerType.includes('csv') || /\.(csv|tsv)$/i.test(lowerName);

  const isText =
    !isImage &&
    !isPdf &&
    !isDocx &&
    !isCsv &&
    (lowerType.startsWith('text/') ||
      /\.(txt|md|json|log|xml|sql|js|jsx|ts|tsx|html|css|py|java|c|cpp|env|yaml|yml)$/i.test(lowerName));

  // Load DOCX or text content if applicable
  useEffect(() => {
    if (!fileUrl) return;

    if (isDocx) {
      setLoadingContent(true);
      setPreviewError(null);
      fetch(fileUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.arrayBuffer();
        })
        .then((buffer) => parseDocx(buffer))
        .then((html) => {
          setDocxHtml(html);
          setLoadingContent(false);
        })
        .catch((err) => {
          console.warn('Native DOCX parse failed, falling back to viewer:', err);
          setPreviewError(err.message);
          setViewMode('office');
          setLoadingContent(false);
        });
    } else if (isCsv) {
      setLoadingContent(true);
      setPreviewError(null);
      fetch(fileUrl)
        .then((res) => res.text())
        .then((text) => {
          const rows = text
            .split(/\r?\n/)
            .filter((line) => line.trim())
            .map((line) => line.split(',').map((cell) => cell.replace(/^"(.*)"$/, '$1')));
          setCsvRows(rows);
          setTextContent(text);
          setLoadingContent(false);
        })
        .catch((err) => {
          setPreviewError(err.message);
          setLoadingContent(false);
        });
    } else if (isText) {
      setLoadingContent(true);
      setPreviewError(null);
      fetch(fileUrl)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setLoadingContent(false);
        })
        .catch((err) => {
          setPreviewError(err.message);
          setLoadingContent(false);
        });
    }
  }, [fileUrl, isDocx, isCsv, isText]);

  const handleCopyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div className={`flex flex-col bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden transition-all duration-200 ${isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-[var(--color-bg)]' : 'w-full'}`}>
      {/* Preview Header Toolbar */}
      <div className="p-3 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {isImage ? 'Image Viewer' : isPdf ? 'PDF Viewer' : isDocx ? 'Word Document' : isCsv ? 'CSV Table' : isText ? 'Text / Code' : 'Document Viewer'}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">• {fileName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Image Zoom Controls */}
          {isImage && (
            <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-[var(--color-text-secondary)]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* DOCX Mode Toggle */}
          {isDocx && docxHtml && (
            <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('native')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${viewMode === 'native' ? 'bg-primary-600 text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
              >
                Document
              </button>
              <button
                type="button"
                onClick={() => setViewMode('office')}
                className={`px-2 py-1 rounded-md font-medium transition-colors ${viewMode === 'office' ? 'bg-primary-600 text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
              >
                Office Web
              </button>
            </div>
          )}

          {/* Copy Button for Text */}
          {textContent && (
            <button
              type="button"
              onClick={() => handleCopyText(textContent)}
              className="btn-ghost py-1 px-2.5 text-xs inline-flex items-center gap-1.5"
              title="Copy Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}

          {/* Open in New Tab */}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-ghost p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className={`relative flex-1 bg-[var(--color-surface)] flex items-center justify-center overflow-auto p-4 ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'min-h-[550px] max-h-[750px]'}`}>
        {/* Loading Spinner */}
        {loadingContent && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-sm">
            <NLoader size="lg" />
            <p className="mt-3 text-xs font-semibold text-[var(--color-text-secondary)] animate-pulse">
              Parsing and rendering document...
            </p>
          </div>
        )}

        {/* 1. IMAGE PREVIEW */}
        {isImage && fileUrl && (
          <div className="overflow-auto max-h-full flex items-center justify-center w-full">
            <img
              src={fileUrl}
              alt={title || fileName}
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="max-h-[620px] w-auto object-contain transition-transform duration-200 rounded-lg shadow-md"
            />
          </div>
        )}

        {/* 2. PDF VIEWER */}
        {isPdf && fileUrl && (
          <div className="w-full h-full min-h-[550px] rounded-lg overflow-hidden border border-[var(--color-border)]">
            <iframe
              src={`${fileUrl}#toolbar=1`}
              title={title || fileName}
              className="w-full h-full min-h-[550px]"
            />
          </div>
        )}

        {/* 3. DOCX DOCUMENT VIEWER */}
        {isDocx && !loadingContent && (
          viewMode === 'native' && docxHtml ? (
            <div className="w-full h-full overflow-y-auto py-6 px-2 flex justify-center">
              <div
                className="w-full max-w-3xl bg-white text-slate-900 rounded-lg shadow-xl p-8 sm:p-14 border border-slate-200 font-sans leading-relaxed text-left min-h-[600px]"
                dangerouslySetInnerHTML={{ __html: docxHtml }}
              />
            </div>
          ) : (
            <div className="w-full h-full min-h-[550px] rounded-lg overflow-hidden border border-[var(--color-border)]">
              <iframe
                src={googleViewerUrl}
                title={title || fileName}
                className="w-full h-full min-h-[550px]"
              />
            </div>
          )
        )}

        {/* 4. CSV / TSV TABLE VIEWER */}
        {isCsv && !loadingContent && csvRows && (
          <div className="w-full h-full overflow-auto max-h-[600px] border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-elevated)]">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-primary-50 dark:bg-primary-950/50 border-b border-[var(--color-border)] sticky top-0 z-10">
                  <th className="p-2.5 font-bold text-primary-900 dark:text-primary-200 border-r border-[var(--color-border)] w-12 text-center">#</th>
                  {csvRows[0]?.map((header, idx) => (
                    <th key={idx} className="p-2.5 font-bold text-primary-900 dark:text-primary-200 border-r border-[var(--color-border)]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)]">
                    <td className="p-2 font-mono text-[var(--color-text-muted)] border-r border-[var(--color-border)] text-center bg-[var(--color-surface)]">
                      {rIdx + 1}
                    </td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2 border-r border-[var(--color-border)] text-[var(--color-text)]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. TEXT / CODE VIEWER */}
        {isText && !loadingContent && textContent !== null && (
          <div className="w-full h-full overflow-auto max-h-[600px] border border-[var(--color-border)] rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-xs leading-relaxed text-left select-text">
            <pre className="whitespace-pre-wrap">{textContent}</pre>
          </div>
        )}

        {/* 6. GENERIC / FALLBACK VIEWER (Google Docs Embed) */}
        {!isImage && !isPdf && !isDocx && !isCsv && !isText && (
          <div className="w-full h-full min-h-[550px] flex flex-col items-center justify-center">
            <iframe
              src={googleViewerUrl}
              title={title || fileName}
              className="w-full h-[550px] rounded-lg border border-[var(--color-border)]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
