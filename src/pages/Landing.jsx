import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Shield,
  Search,
  UserPlus,
  Upload,
  Globe,
  FolderArchive,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  Share2,
  Eye,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  const features = [
    {
      icon: Award,
      title: 'Certificates',
      description: 'Store all your professional certificates, diplomas, and credentials securely with verified issue dates.',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      icon: BookOpen,
      title: 'Published Papers',
      description: 'Keep your research papers, journal articles, and academic publications organized in one searchable repository.',
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      icon: FileText,
      title: 'Reports',
      description: 'Manage institutional reports, transcripts, and evaluation documents with easy categorization and tags.',
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: ImageIcon,
      title: 'Achievement Photos',
      description: 'Preserve high-resolution photos of award ceremonies, trophies, conferences, and career milestones forever.',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      icon: Shield,
      title: 'Secure Storage',
      description: 'Bank-level AES-256 encryption and Supabase Row Level Security ensure only you can access your personal vault.',
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      icon: Search,
      title: 'Easy Search',
      description: 'Find any document instantly with powerful full-text search, category filters, and quick sorting options.',
      color: 'from-rose-500 to-red-500',
      bgColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
  ];

  const steps = [
    {
      step: '01',
      icon: UserPlus,
      title: 'Sign Up',
      description: 'Create your free account in seconds with your email or phone number. No credit card required.',
    },
    {
      step: '02',
      icon: Upload,
      title: 'Upload',
      description: 'Drag and drop your certificates, research papers, reports, and photos into smart auto-sorted categories.',
    },
    {
      step: '03',
      icon: Globe,
      title: 'View & Download Anywhere',
      description: 'Access, preview, and download your credentials from your laptop, tablet, or phone anytime with private signed URLs.',
    },
  ];

  const categories = [
    {
      name: 'Certificates',
      icon: Award,
      badge: 'Credentials',
      description: 'Degrees, diplomas, online courses, and professional accreditations.',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderHover: 'hover:border-amber-400/50',
    },
    {
      name: 'Published Papers',
      icon: BookOpen,
      badge: 'Research',
      description: 'Conference papers, peer-reviewed journals, and patent documentation.',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderHover: 'hover:border-blue-400/50',
    },
    {
      name: 'Reports',
      icon: FileText,
      badge: 'Documents',
      description: 'Project assessments, internship appraisals, and academic transcripts.',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderHover: 'hover:border-emerald-400/50',
    },
    {
      name: 'Achievement Photos',
      icon: ImageIcon,
      badge: 'Memories',
      description: 'Milestone moments, convocations, hackathons, and award galas.',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderHover: 'hover:border-purple-400/50',
    },
    {
      name: 'Other',
      icon: FolderArchive,
      badge: 'Custom',
      description: 'Recommendation letters, identity records, resumes, and personal files.',
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderHover: 'hover:border-slate-400/50',
    },
  ];

  const faqs = [
    {
      question: 'Is my data secure?',
      answer:
        'Yes, absolutely. We use bank-level encryption (AES-256) at rest and TLS 1.3 in transit. All documents are stored in private Supabase Storage with short-lived signed URLs, and metadata is strictly protected by Supabase PostgreSQL Row Level Security (RLS) policies. Only you have the authentication keys to view or download your files.',
    },
    {
      question: 'What file types are supported?',
      answer:
        'MyVault supports PDF, JPG, PNG, WEBP, and DOCX files. PDFs and images can be previewed seamlessly inside your browser with zoom controls without needing external viewers.',
    },
    {
      question: 'Is there a file size limit?',
      answer:
        'Each individual file upload can be up to 10 MB (configurable). High-resolution images are automatically compressed on your device before upload to save bandwidth and storage.',
    },
    {
      question: 'Can I share my documents?',
      answer:
        'Yes! You can generate private, temporary share links with customizable expiration durations (such as 24 hours, 7 days, or 30 days). Anyone with the link can view or download the specific document before the token automatically expires.',
    },
    {
      question: 'How do I organize my files?',
      answer:
        'MyVault automatically sets up 5 essential categories upon account creation: Certificates, Published Papers, Reports, Achievement Photos, and Other. You can also search by keyword, filter by category or date, and view files in grid or list view.',
    },
    {
      question: 'Can I access my vault on mobile?',
      answer:
        'Yes, MyVault is fully responsive and optimized for mobile phones, tablets, and desktop browsers. You can effortlessly browse your credentials on your smartphone during an interview or conference.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32">
        {/* Background Decorative Blobs */}
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-primary-400/20 via-vault-400/20 to-purple-400/10 rounded-full blur-3xl pointer-events-none -z-10"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 -right-48 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none -z-10"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs sm:text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>Next-Gen Personal Storage Locker</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--color-text)] leading-[1.1] mb-6 animate-slide-up">
              Your Personal{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-vault-500">
                Digital Vault
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto mb-10 animate-slide-up">
              Securely store, organize, and access your certificates, published papers, reports, and achievement photos — anytime, anywhere.
            </p>

            {/* Two CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base px-8 py-3.5 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
                >
                  Go to Your Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base px-8 py-3.5 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}

              <a
                href="#features"
                className="btn-outline w-full sm:w-auto inline-flex items-center justify-center text-base px-8 py-3.5"
              >
                Learn More
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>AES-256 Cloud Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Instant In-Browser Previews</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Expiring Share Links</span>
              </div>
            </div>
          </div>

          {/* Vault UI Mockup Preview */}
          <div className="mt-16 sm:mt-20 max-w-5xl mx-auto animate-fade-in">
            <div className="relative rounded-2xl p-2 sm:p-4 bg-gradient-to-b from-primary-500/20 via-border/50 to-transparent border border-[var(--color-border)] shadow-2xl backdrop-blur-sm">
              <div className="rounded-xl overflow-hidden bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                {/* Mock Window Top Bar */}
                <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-medium text-[var(--color-text-secondary)] hidden sm:inline">
                      myvault.app/dashboard
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Encrypted</span>
                  </div>
                </div>

                {/* Mock Window Content */}
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Mock Search & Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full sm:w-72 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                      <Search className="w-4 h-4" />
                      <span>Search certificates, papers, tags...</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
                        All Items (14)
                      </span>
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 text-white flex items-center gap-1.5 shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </span>
                    </div>
                  </div>

                  {/* Mock Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Item 1 */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-primary-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Certificates
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[var(--color-text)] truncate">
                        AWS Solutions Architect.pdf
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Issued: Nov 2024 • 1.8 MB
                      </p>
                    </div>

                    {/* Item 2 */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-primary-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Published Papers
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[var(--color-text)] truncate">
                        IEEE_Edge_AI_Research.pdf
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Published: Aug 2024 • 4.2 MB
                      </p>
                    </div>

                    {/* Item 3 */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-primary-500 transition-colors hidden sm:block">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          Photos
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[var(--color-text)] truncate">
                        National_Hackathon_1st_Place.jpg
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Date: Oct 2024 • 3.5 MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 lg:py-28 bg-[var(--color-surface)] border-y border-[var(--color-border)] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="section-title mb-4">
              Everything you need in one secure place
            </h2>
            <p className="section-subtitle">
              Engineered from the ground up to give you total control and effortless organization over your career's most prized milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="card p-8 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-200">
                    <div className={`p-3 rounded-xl ${feature.bgColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text)] mb-2.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 lg:py-28 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="section-title mb-4">
              Get started in 3 simple steps
            </h2>
            <p className="section-subtitle">
              Go from scattered paperwork and random drive links to a clean, permanent digital portfolio in minutes.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line for Desktop */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-1/2 left-24 right-24 h-0.5 bg-gradient-to-r from-primary-500/20 via-primary-500/40 to-primary-500/20 -translate-y-8 -z-10"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center p-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-primary-500/40 transition-colors shadow-sm"
                  >
                    {/* Badge & Icon */}
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-vault-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Icon className="w-8 h-8" />
                      </div>
                      <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[var(--color-surface-elevated)] border-2 border-primary-500 text-primary-600 dark:text-primary-400 font-bold text-xs flex items-center justify-center shadow">
                        {step.step}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-[var(--color-text)] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xs">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES PREVIEW SECTION */}
      <section id="categories" className="py-20 lg:py-28 bg-[var(--color-surface)] border-y border-[var(--color-border)] scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="section-title mb-4">
              Organize by categories
            </h2>
            <p className="section-subtitle">
              Intelligent defaults tailored for career tracking, academia, and professional portfolio management.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((category, idx) => {
              const Icon = category.icon;
              return (
                <div
                  key={idx}
                  className={`card-flat p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 ${category.borderHover} cursor-pointer group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${category.bgColor} ${category.color} transition-transform group-hover:scale-110 duration-200`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                        {category.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--color-text)] mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {category.name}
                    </h3>

                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {category.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs font-medium text-primary-600 dark:text-primary-400">
                    <span>Explore Files</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 lg:py-28 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="section-title mb-4">
              Frequently Asked Questions
            </h2>
            <p className="section-subtitle">
              Got questions? We've got answers. If you need more details, reach out to our team anytime.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold text-[var(--color-text)] pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[var(--color-text-secondary)] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-primary-600 dark:text-primary-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)]/50 animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-vault-800 text-white">
        {/* Glow decoration */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none"
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
            Ready to secure your documents?
          </h2>
          <p className="text-base sm:text-xl text-primary-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join thousands of professionals, researchers, and students who trust MyVault to protect their lifetime accomplishments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/upload"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-primary-900 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700 transition-all duration-200 shadow-xl"
              >
                Upload Documents Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-primary-900 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700 transition-all duration-200 shadow-xl"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}

            {!user && (
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-semibold text-white border-2 border-white/30 hover:bg-white/10 focus:outline-none transition-colors"
              >
                Sign In to Vault
              </Link>
            )}
          </div>

          <p className="mt-8 text-xs text-primary-200">
            Free tier included • No credit card required • Instant access
          </p>
        </div>
      </section>
    </div>
  );
}
