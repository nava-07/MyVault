import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none -z-10"
      />

      <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Icon & 404 Visual */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 shadow-sm">
            <FileQuestion className="w-10 h-10 animate-bounce" />
          </div>

          <span className="text-7xl sm:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-vault-500">
            404
          </span>
        </div>

        {/* Heading & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
            Page not found
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            Sorry, we couldn’t find the page you’re looking for. It might have been moved, deleted, or never existed in your vault.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto btn-outline inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/"
              className="w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
