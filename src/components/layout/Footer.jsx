import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Github, Twitter, Linkedin, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-vault-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200">
                <Lock className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl tracking-tight text-[var(--color-text)]">
                My<span className="text-primary-600 dark:text-primary-400">Vault</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed max-w-sm">
              Your personal digital locker for certificates, research papers, reports, and proud achievements. Encrypted, private, and always available when opportunities knock.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>AES-256 Cloud Encryption Enabled</span>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#features"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#categories"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  Categories
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  Security & FAQ
                </a>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] cursor-not-allowed">
                  Pricing (Free Forever)
                </span>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--color-text)] transition-colors inline-flex items-center gap-2"
                >
                  Careers
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded">
                    Hiring
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  Press Kit
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  Compliance
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--color-text)] transition-colors"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="flex items-center gap-1 text-[var(--color-text-secondary)]">
            © 2027 MyVault, NVT Groups Pvt Ltd. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
