import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { generateAiCaption } from '@/lib/api';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  isSameDay,
  isToday,
  eachDayOfInterval,
  isWeekend,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Instagram,
  Facebook,
  Youtube,
  Clock,
  CheckCircle2,
  FileText,
  X,
  Trash2,
  ImagePlus,
  CalendarIcon,
  Mic,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  MINIMAL WEB SPEECH API TYPES                                      */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionResultLike {
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type Platform = 'instagram' | 'facebook' | 'youtube';
type Status = 'draft' | 'scheduled' | 'published';
type ViewMode = 'month' | 'week' | 'day';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: Platform[];
  status: Status;
  date: Date;
  time: string; // HH:mm format
  assetUrl?: string;
}

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string; border: string; icon: typeof Instagram }> = {
  instagram: { label: 'Instagram', color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10', border: 'border-[#E4405F]', icon: Instagram },
  facebook: { label: 'Facebook', color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', border: 'border-[#1877F2]', icon: Facebook },
  youtube: { label: 'YouTube', color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', border: 'border-[#FF0000]', icon: Youtube },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string; icon: typeof FileText }> = {
  draft: { label: 'Draft', color: 'text-[#4A7FB5]', bg: 'bg-[#E8F0F8]', dot: 'bg-[#4A7FB5]', icon: FileText },
  scheduled: { label: 'Scheduled', color: 'text-[#D4942A]', bg: 'bg-[#FDF3E2]', dot: 'bg-[#D4942A]', icon: Clock },
  published: { label: 'Published', color: 'text-[#2D8F5A]', bg: 'bg-[#E6F4EC]', dot: 'bg-[#2D8F5A]', icon: CheckCircle2 },
};

/* ------------------------------------------------------------------ */
/*  MOCK DATA                                                          */
/* ------------------------------------------------------------------ */

function generateMockPosts(baseDate: Date): ScheduledPost[] {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth();
  const make = (d: number, title: string, platforms: Platform[], status: Status, time: string, content?: string): ScheduledPost => ({
    id: `post-${d}-${title.replace(/\s+/g, '-').toLowerCase()}`,
    title,
    platforms,
    status,
    date: new Date(y, m, d),
    time,
    content: content || title,
  });

  return [
    // Week 1
    make(1, 'Weekend Special Promo', ['instagram'], 'published', '10:00', 'Check out our weekend special!'),
    make(2, 'Restaurant Owner Guide', ['facebook'], 'published', '14:00', 'A complete guide for restaurant owners.'),
    // Week 2
    make(3, '5-Star Review Feature', ['instagram', 'facebook'], 'published', '09:30', 'Highlighting our 5-star reviews!'),
    make(4, 'QR Menu Setup Tutorial', ['youtube'], 'published', '11:00', 'Learn how to set up your QR menu.'),
    make(5, 'Cafe Morning Vibes', ['instagram'], 'published', '08:00', 'Morning vibes at your favorite cafe.'),
    make(6, 'Hotel Digital Menu', ['youtube'], 'draft', '15:00', 'Digital menu solutions for hotels.'),
    make(7, 'Menu Design Tips', ['facebook'], 'published', '13:00', 'Top tips for designing your menu.'),
    make(8, 'Weekend Promo #2', ['instagram'], 'scheduled', '10:00', 'Another exciting weekend promotion!'),
    make(9, "Customer Story: Raj's Cafe", ['instagram'], 'scheduled', '16:00', 'How Raj transformed his cafe with NHY-QR.'),
    // Week 3
    make(10, 'Hotel Showcase Reel', ['youtube'], 'draft', '09:00', 'Showcasing our hotel partners.'),
    make(11, 'Analytics Deep Dive', ['facebook'], 'draft', '11:30', 'Understanding your menu analytics.'),
    make(12, 'Cafe Owner Testimonial', ['facebook'], 'scheduled', '14:00', 'Real stories from real cafe owners.'),
    make(13, 'QR Demo Reel', ['instagram', 'youtube'], 'published', '10:00', 'See our QR menu in action.'),
    make(14, 'Summer Menu Launch', ['instagram', 'facebook'], 'published', '12:00', 'Launching our summer menu features!'),
    make(15, "Father's Day Special", ['instagram'], 'scheduled', '09:00', "Celebrate Father's Day with us!"),
    make(16, 'Weekly Tips Roundup', ['facebook'], 'draft', '17:00', 'This week\'s best tips for restaurateurs.'),
    // Week 4
    make(17, 'New Feature: Multi-language', ['instagram', 'youtube'], 'draft', '10:30', 'Now supporting multiple languages!'),
    make(18, 'Fast Setup Promise', ['instagram'], 'scheduled', '11:00', 'Set up your menu in under 5 minutes.'),
    make(19, 'Behind the Scenes', ['instagram'], 'draft', '15:00', 'A sneak peek behind the scenes.'),
    make(20, 'Comparison: Old vs New', ['facebook'], 'draft', '13:00', 'See the difference NHY-QR makes.'),
    make(21, 'Friday Feature Drop', ['instagram'], 'scheduled', '09:00', 'New features dropping this Friday!'),
    make(22, 'Weekend Special', ['instagram'], 'draft', '10:00', 'Weekend specials you cannot miss.'),
    make(23, 'User Review Compilation', ['youtube'], 'draft', '14:00', 'Compilation of our favorite user reviews.'),
    // Week 5
    make(24, 'Monday Motivation', ['instagram'], 'draft', '08:00', 'Start your week with motivation!'),
    make(25, 'Setup in 5 Minutes', ['youtube'], 'scheduled', '11:00', 'Watch us set up a menu in 5 minutes.'),
    make(26, 'Customer Spotlight', ['facebook'], 'draft', '16:00', 'Spotlighting our amazing customers.'),
    make(27, 'Product Update', ['instagram', 'facebook'], 'draft', '10:00', 'Latest product updates and improvements.'),
    make(28, 'Monthly Roundup', ['youtube'], 'draft', '13:00', 'This month at NHY-QR.'),
    make(29, 'Weekend Promo', ['instagram'], 'scheduled', '10:00', 'Weekend promotion incoming!'),
    make(30, 'Month-end Stats', ['facebook'], 'draft', '15:00', 'Reviewing this month\'s performance.'),
    // Additional posts for density
    make(3, 'Quick Setup Tips', ['youtube'], 'scheduled', '16:00', 'Quick tips to get started.'),
    make(5, 'Customer Testimonial', ['facebook'], 'draft', '11:00', 'What our customers are saying.'),
    make(8, 'Feature Highlight', ['facebook'], 'published', '14:30', 'Highlighting a key feature.'),
    make(12, 'Instagram Story Series', ['instagram'], 'published', '09:00', 'New story series launching!'),
    make(15, 'YouTube Tutorial', ['youtube'], 'scheduled', '13:00', 'Step-by-step tutorial.'),
    make(18, 'Success Story', ['facebook'], 'published', '10:00', 'Another amazing success story.'),
    make(20, 'Productivity Hacks', ['instagram'], 'scheduled', '08:30', 'Hacks for restaurant productivity.'),
    make(22, 'Team Spotlight', ['youtube'], 'draft', '11:00', 'Meet the team behind NHY-QR.'),
    make(25, 'FAQ Session', ['facebook'], 'draft', '15:00', 'Answering your frequently asked questions.'),
    make(27, 'Partner Highlight', ['instagram'], 'scheduled', '09:00', 'Highlighting our amazing partners.'),
  ];
}

/* ------------------------------------------------------------------ */
/*  HELPER COMPONENTS                                                  */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-tag text-caption font-medium', cfg.bg, cfg.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      <span>{cfg.label}</span>
    </span>
  );
}

function MiniStatusDot({ status }: { status: Status }) {
  return <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_CONFIG[status].dot)} />;
}

/* ------------------------------------------------------------------ */
/*  POST CREATION / EDIT MODAL                                         */
/* ------------------------------------------------------------------ */

interface PostModalProps {
  post: ScheduledPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: ScheduledPost) => void;
  onDelete?: (id: string) => void;
  initialDate?: Date;
}

function PostModal({ post, isOpen, onClose, onSave, onDelete, initialDate }: PostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [status, setStatus] = useState<Status>('draft');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('09:00');
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const isEditing = !!post;

  const speechSupported =
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Stop any in-progress recording when the modal closes
  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  }, [isOpen]);

  const runAiCaption = useCallback(async (spokenInstruction: string) => {
    const instruction = spokenInstruction.trim();
    if (!instruction) {
      toast.error("Didn't catch that — please try speaking again.");
      return;
    }
    setIsGeneratingCaption(true);
    try {
      const generated = await generateAiCaption(instruction, selectedPlatforms);
      setContent(generated);
      toast.success('AI wrote your caption');
    } catch {
      toast.error('Could not generate a caption. Please try again.');
    } finally {
      setIsGeneratingCaption(false);
    }
  }, [selectedPlatforms]);

  const handleMicClick = () => {
    if (!speechSupported) {
      toast.error('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      runAiCaption(transcript);
    };
    recognition.onerror = () => {
      toast.error('Could not hear you clearly. Please try again.');
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  // Reset form when modal opens
  const resetForm = useCallback(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setSelectedPlatforms([...post.platforms]);
      setStatus(post.status);
      setDateStr(format(post.date, 'yyyy-MM-dd'));
      setTimeStr(post.time);
    } else {
      setTitle('');
      setContent('');
      setSelectedPlatforms(['instagram']);
      setStatus('draft');
      setDateStr(format(initialDate || new Date(), 'yyyy-MM-dd'));
      setTimeStr('09:00');
    }
  }, [post, initialDate]);

  useState(() => {
    if (isOpen) resetForm();
  });

  // Use effect to reset form when modal opens
  const modalRef = useCallback((node: HTMLDivElement | null) => {
    if (node && isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleSave = () => {
    if (!title.trim() || selectedPlatforms.length === 0) return;
    const [year, month, day] = dateStr.split('-').map(Number);
    onSave({
      id: post?.id || `post-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      platforms: selectedPlatforms,
      status,
      date: new Date(year, month - 1, day),
      time: timeStr,
    });
    onClose();
  };

  const handleDelete = () => {
    if (post && onDelete) {
      onDelete(post.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#3D3832]/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-card border border-linen shadow-lg w-full max-w-[720px] max-h-[85vh] overflow-y-auto m-4"
        style={{ animation: 'fade-in-up 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-linen">
          <h2 className="text-h2 text-warm-black">
            {isEditing ? 'Edit Post' : 'New Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone hover:bg-cream transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left: Form */}
          <div className="flex-1 p-6 space-y-5">
            {/* Platform Selector */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">Platforms</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(PLATFORM_CONFIG) as Platform[]).map(p => {
                  const cfg = PLATFORM_CONFIG[p];
                  const Icon = cfg.icon;
                  const selected = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-button border transition-all duration-150',
                        selected
                          ? 'border-caramel bg-caramel/10 text-caramel'
                          : 'border-sand bg-white text-stone hover:border-caramel/50'
                      )}
                    >
                      <Icon size={16} />
                      <span className="text-sm font-medium">{cfg.label}</span>
                      <div className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                        selected ? 'bg-caramel border-caramel' : 'border-sand'
                      )}>
                        {selected && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">Post Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter post title..."
                className="w-full h-10 px-3 rounded-button border border-sand bg-white text-sm text-warm-black placeholder:text-stone/60 focus:border-caramel focus:shadow-input-focus focus:outline-none transition-all"
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-h4 text-warm-black block">Caption / Description</label>
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isGeneratingCaption}
                  title={speechSupported ? 'Speak to AI to write this post' : 'Voice input not supported in this browser'}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all disabled:opacity-60 disabled:cursor-not-allowed',
                    isListening
                      ? 'border-danger bg-danger-light text-danger animate-pulse'
                      : isGeneratingCaption
                        ? 'border-caramel bg-caramel/10 text-caramel'
                        : 'border-caramel/40 bg-caramel/5 text-caramel hover:bg-caramel/10'
                  )}
                >
                  {isGeneratingCaption ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Mic size={13} />
                  )}
                  {isGeneratingCaption ? 'Writing…' : isListening ? 'Listening…' : 'AI Write'}
                </button>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write your post content..."
                rows={4}
                className="w-full px-3 py-2 rounded-button border border-sand bg-white text-sm text-warm-black placeholder:text-stone/60 focus:border-caramel focus:shadow-input-focus focus:outline-none transition-all resize-none"
              />
              <p className="text-caption text-stone mt-1 text-right">
                {content.length} / 2,200
              </p>
            </div>

            {/* Asset Attachment */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">Media</label>
              <div className="flex items-center gap-3 p-4 border border-dashed border-sand rounded-button bg-cream/50 hover:bg-cream transition-colors cursor-pointer">
                <ImagePlus size={20} className="text-stone" />
                <span className="text-sm text-stone">Click to upload or select from Asset Hub</span>
              </div>
            </div>

            {/* Scheduling */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">When to Post</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
                    <input
                      type="date"
                      value={dateStr}
                      onChange={e => setDateStr(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-button border border-sand bg-white text-sm text-warm-black focus:border-caramel focus:shadow-input-focus focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="w-32">
                  <input
                    type="time"
                    value={timeStr}
                    onChange={e => setTimeStr(e.target.value)}
                    className="w-full h-10 px-3 rounded-button border border-sand bg-white text-sm text-warm-black focus:border-caramel focus:shadow-input-focus focus:outline-none transition-all"
                  />
                </div>
              </div>
              <p className="text-caption text-info mt-2 flex items-center gap-1">
                <Clock size={12} />
                Best time for Instagram: 11:00 AM – 2:00 PM
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">Status</label>
              <div className="flex gap-2">
                {(Object.keys(STATUS_CONFIG) as Status[]).map(s => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-button border text-sm font-medium transition-all',
                        status === s
                          ? cn(cfg.bg, cfg.color, 'border-current')
                          : 'border-sand text-stone hover:border-caramel/50'
                      )}
                    >
                      <Icon size={14} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:w-64 bg-cream/50 border-l border-linen p-6">
            <label className="text-h4 text-warm-black mb-3 block">Preview</label>
            {selectedPlatforms.length > 0 ? (
              <div className="space-y-4">
                {selectedPlatforms.map(p => {
                  const cfg = PLATFORM_CONFIG[p];
                  const Icon = cfg.icon;
                  return (
                    <div key={p} className="bg-white rounded-tag p-3 border border-linen">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Icon size={14} className={cfg.color} />
                        <span className={cn('text-caption font-medium', cfg.color)}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-warm-black leading-relaxed line-clamp-4">
                        {content || title || 'Your post content will appear here...'}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <StatusBadge status={status} />
                        <span className="text-caption text-stone">{timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-body-sm text-stone">Select platforms to see preview</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-linen bg-cream/30">
          {isEditing ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-4 py-2 rounded-button border border-danger text-danger text-sm font-medium hover:bg-danger-light transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-button border border-linen bg-white text-warm-black text-sm font-medium hover:bg-cream transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { setStatus('draft'); handleSave(); }}
              className="px-4 py-2 rounded-button border border-linen bg-white text-warm-black text-sm font-medium hover:bg-cream transition-colors"
            >
              Save as Draft
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-button bg-caramel text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {isEditing ? 'Update' : 'Schedule'} Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MONTH VIEW                                                         */
/* ------------------------------------------------------------------ */

interface MonthViewProps {
  currentDate: Date;
  posts: ScheduledPost[];
  filterStatus: Status | 'all';
  onPostClick: (post: ScheduledPost) => void;
  onDayClick: (date: Date) => void;
  onMovePost: (postId: string, newDate: Date) => void;
}

function MonthView({ currentDate, posts, filterStatus, onPostClick, onDayClick, onMovePost }: MonthViewProps) {
  const [draggingPost, setDraggingPost] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getPostsForDay = (day: Date) => {
    const dayPosts = posts.filter(p => isSameDay(p.date, day));
    if (filterStatus === 'all') return dayPosts;
    return dayPosts.filter(p => p.status === filterStatus);
  };

  const handleDragStart = (postId: string) => {
    setDraggingPost(postId);
  };

  const handleDragOver = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    setDragOverDay(format(day, 'yyyy-MM-dd'));
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    if (draggingPost) {
      onMovePost(draggingPost, day);
    }
    setDraggingPost(null);
    setDragOverDay(null);
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white rounded-card border border-linen overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              'h-10 flex items-center justify-center text-caption font-medium uppercase text-stone border-b border-linen',
              i >= 5 ? 'bg-cream/60' : 'bg-cream/30'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7" style={{ minHeight: '480px' }}>
        {days.map((day, idx) => {
          const inMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const isWeekendDate = isWeekend(day);
          const dayPosts = getPostsForDay(day);
          const isDragTarget = dragOverDay === format(day, 'yyyy-MM-dd');
          const dayKey = format(day, 'yyyy-MM-dd');

          return (
            <div
              key={dayKey}
              onClick={() => onDayClick(day)}
              onDragOver={e => handleDragOver(e, day)}
              onDrop={e => handleDrop(e, day)}
              onDragLeave={() => setDragOverDay(null)}
              className={cn(
                'min-h-[100px] border-b border-r border-linen p-1.5 cursor-pointer transition-all duration-100 relative',
                !inMonth && 'opacity-40 bg-cream/20',
                isWeekendDate && inMonth && 'bg-cream/30',
                isDragTarget && 'ring-2 ring-caramel ring-dashed bg-caramel/5'
              )}
              style={{ animationDelay: `${idx * 10}ms` }}
            >
              {/* Date number */}
              <div className="flex justify-end mb-1">
                <span
                  className={cn(
                    'w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-full',
                    isTodayDate
                      ? 'bg-caramel text-white'
                      : inMonth
                        ? 'text-warm-black'
                        : 'text-stone'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Post cards */}
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map(post => (
                  <div
                    key={post.id}
                    draggable
                    onDragStart={() => handleDragStart(post.id)}
                    onClick={e => { e.stopPropagation(); onPostClick(post); }}
                    className={cn(
                      'flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs font-semibold cursor-grab active:cursor-grabbing transition-all hover:brightness-95',
                      post.platforms.includes('instagram') && 'bg-[#E4405F]/10 text-[#E4405F]',
                      post.platforms.includes('facebook') && !post.platforms.includes('instagram') && 'bg-[#1877F2]/10 text-[#1877F2]',
                      post.platforms.includes('youtube') && !post.platforms.includes('instagram') && !post.platforms.includes('facebook') && 'bg-[#FF0000]/10 text-[#FF0000]',
                      draggingPost === post.id && 'opacity-60 shadow-lg rotate-1'
                    )}
                  >
                    <span className={cn(
                      'w-1 h-1 rounded-full shrink-0',
                      post.platforms.includes('instagram') ? 'bg-[#E4405F]' :
                      post.platforms.includes('facebook') ? 'bg-[#1877F2]' : 'bg-[#FF0000]'
                    )} />
                    <span className="truncate flex-1">{post.title}</span>
                    <MiniStatusDot status={post.status} />
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-caption text-caramel font-medium px-1">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  WEEK VIEW                                                          */
/* ------------------------------------------------------------------ */

interface WeekViewProps {
  currentDate: Date;
  posts: ScheduledPost[];
  filterStatus: Status | 'all';
  onPostClick: (post: ScheduledPost) => void;
  onDayClick: (date: Date) => void;
}

function WeekView({ currentDate, posts, filterStatus, onPostClick, onDayClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const getPostsForDay = (day: Date) => {
    const dayPosts = posts
      .filter(p => isSameDay(p.date, day))
      .sort((a, b) => a.time.localeCompare(b.time));
    if (filterStatus === 'all') return dayPosts;
    return dayPosts.filter(p => p.status === filterStatus);
  };

  return (
    <div className="bg-white rounded-card border border-linen overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-linen">
        {weekDays.map((day, i) => (
          <div
            key={format(day, 'yyyy-MM-dd')}
            onClick={() => onDayClick(day)}
            className={cn(
              'py-3 px-2 text-center cursor-pointer transition-colors hover:bg-cream/50',
              i >= 5 ? 'bg-cream/40' : 'bg-white'
            )}
          >
            <div className="text-caption text-stone uppercase">{format(day, 'EEE')}</div>
            <div className={cn(
              'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold mt-1',
              isToday(day) ? 'bg-caramel text-white' : 'text-warm-black'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Columns */}
      <div className="grid grid-cols-7" style={{ minHeight: '500px' }}>
        {weekDays.map((day, dayIdx) => {
          const dayPosts = getPostsForDay(day);
          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={cn(
                'border-r border-linen p-2 space-y-2 last:border-r-0',
                isWeekend(day) ? 'bg-cream/20' : 'bg-white'
              )}
            >
              {dayPosts.map((post, postIdx) => (
                <div
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className={cn(
                    'p-2.5 rounded-lg border-l-[3px] cursor-pointer transition-all hover:shadow-card',
                    post.platforms.includes('instagram') && 'bg-[#E4405F]/5 border-[#E4405F]',
                    post.platforms.includes('facebook') && !post.platforms.includes('instagram') && 'bg-[#1877F2]/5 border-[#1877F2]',
                    post.platforms.includes('youtube') && !post.platforms.includes('instagram') && !post.platforms.includes('facebook') && 'bg-[#FF0000]/5 border-[#FF0000]',
                  )}
                  style={{ animationDelay: `${dayIdx * 40 + postIdx * 40}ms` }}
                >
                  <div className="text-caption text-stone mb-1">{post.time}</div>
                  <div className="text-body-sm font-semibold text-warm-black line-clamp-2 mb-2">
                    {post.title}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {post.platforms.map(p => (
                      <span key={p} className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', PLATFORM_CONFIG[p].bg, PLATFORM_CONFIG[p].color)}>
                        {p === 'instagram' ? 'IG' : p === 'facebook' ? 'FB' : 'YT'}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1.5">
                    <MiniStatusDot status={post.status} />
                  </div>
                </div>
              ))}
              {dayPosts.length === 0 && (
                <div className="h-full min-h-[80px] flex items-center justify-center">
                  <span className="text-caption text-stone/40">No posts</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DAY VIEW                                                           */
/* ------------------------------------------------------------------ */

interface DayViewProps {
  currentDate: Date;
  posts: ScheduledPost[];
  filterStatus: Status | 'all';
  onPostClick: (post: ScheduledPost) => void;
}

function DayView({ currentDate, posts, filterStatus, onPostClick }: DayViewProps) {
  const timeSlots = [];
  for (let h = 6; h <= 22; h++) {
    const hour = h <= 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
    const hour24 = `${String(h).padStart(2, '0')}:00`;
    timeSlots.push({ label: hour, hour24, hourNum: h });
  }

  const dayPosts = useMemo(() => {
    const filtered = posts.filter(p => isSameDay(p.date, currentDate));
    if (filterStatus === 'all') return filtered.sort((a, b) => a.time.localeCompare(b.time));
    return filtered.filter(p => p.status === filterStatus).sort((a, b) => a.time.localeCompare(b.time));
  }, [posts, currentDate, filterStatus]);

  const getPostTop = (time: string) => {
    const [h] = time.split(':').map(Number);
    const slotIndex = Math.max(0, h - 6);
    return slotIndex * 64;
  };

  return (
    <div className="bg-white rounded-card border border-linen overflow-hidden">
      {/* Day header */}
      <div className="px-6 py-4 border-b border-linen flex items-center justify-between">
        <div>
          <h3 className="text-h2 text-warm-black">
            {format(currentDate, 'EEEE')}
          </h3>
          <p className="text-body-sm text-stone">{format(currentDate, 'MMMM d, yyyy')}</p>
        </div>
        <div className={cn(
          'inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold',
          isToday(currentDate) ? 'bg-caramel text-white' : 'bg-cream text-warm-black'
        )}>
          {format(currentDate, 'd')}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative" style={{ height: `${timeSlots.length * 64}px` }}>
        {timeSlots.map((slot, idx) => (
          <div
            key={slot.hour24}
            className="absolute left-0 right-0 flex"
            style={{ top: `${idx * 64}px`, height: '64px' }}
          >
            {/* Time label */}
            <div className="w-20 shrink-0 text-right pr-3 pt-2">
              <span className="text-caption text-stone">{slot.label}</span>
            </div>
            {/* Line */}
            <div className={cn(
              'flex-1 border-t',
              idx === 0 ? 'border-linen' : 'border-linen/60'
            )} />
          </div>
        ))}

        {/* Post cards */}
        {dayPosts.map((post, idx) => (
          <div
            key={post.id}
            onClick={() => onPostClick(post)}
            className={cn(
              'absolute left-24 right-4 rounded-lg border-l-[3px] p-3 cursor-pointer transition-all hover:shadow-card bg-white',
              post.platforms.includes('instagram') && 'border-[#E4405F]',
              post.platforms.includes('facebook') && !post.platforms.includes('instagram') && 'border-[#1877F2]',
              post.platforms.includes('youtube') && !post.platforms.includes('instagram') && !post.platforms.includes('facebook') && 'border-[#FF0000]',
            )}
            style={{
              top: `${getPostTop(post.time) + 8}px`,
              height: '52px',
              animationDelay: `${idx * 50}ms`,
            }}
          >
            <div className="flex items-center gap-2 h-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-caption text-stone">{post.time}</span>
                  <div className="flex gap-1">
                    {post.platforms.map(p => {
                      const Icon = PLATFORM_CONFIG[p].icon;
                      return <Icon key={p} size={12} className={PLATFORM_CONFIG[p].color} />;
                    })}
                  </div>
                </div>
                <p className="text-sm font-semibold text-warm-black truncate">{post.title}</p>
              </div>
              <MiniStatusDot status={post.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN SCHEDULER COMPONENT                                           */
/* ------------------------------------------------------------------ */

export default function Scheduler() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [posts, setPosts] = useState<ScheduledPost[]>(() => generateMockPosts(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>();

  const statusCounts = useMemo(() => {
    const counts = { all: posts.length, draft: 0, scheduled: 0, published: 0 };
    posts.forEach(p => { counts[p.status]++; });
    return counts;
  }, [posts]);

  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    if (viewMode === 'month') setCurrentDate(d => subMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => subWeeks(d, 1));
    else setCurrentDate(d => subDays(d, 1));
  };
  const goNext = () => {
    if (viewMode === 'month') setCurrentDate(d => addMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => addWeeks(d, 1));
    else setCurrentDate(d => addDays(d, 1));
  };

  const handleNewPost = () => {
    setEditingPost(null);
    setModalInitialDate(currentDate);
    setModalOpen(true);
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setEditingPost(null);
    setModalInitialDate(date);
    setModalOpen(true);
  };

  const handleSavePost = (post: ScheduledPost) => {
    setPosts(prev => {
      const exists = prev.find(p => p.id === post.id);
      if (exists) {
        return prev.map(p => p.id === post.id ? post : p);
      }
      return [...prev, post];
    });
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleMovePost = (postId: string, newDate: Date) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, date: newDate } : p
      )
    );
  };

  const dateDisplay = useMemo(() => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = addDays(ws, 6);
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM d, yyyy');
  }, [currentDate, viewMode]);

  return (
    <div className="space-y-6">
      {/* Section 1: Page Header + Calendar Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Title */}
          <div>
            <h1 className="text-display text-warm-black">Content Calendar</h1>
            <p className="text-body-sm text-stone mt-1">
              Plan and schedule your content across all platforms.
            </p>
          </div>

          {/* Center: Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* View Toggle */}
            <div className="flex rounded-button overflow-hidden border border-sand">
              {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium capitalize transition-colors',
                    viewMode === mode
                      ? 'bg-caramel text-white'
                      : 'bg-white text-warm-black hover:bg-cream'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={goPrev}
                className="w-9 h-9 rounded-button flex items-center justify-center border border-sand text-warm-black hover:bg-cream transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goToday}
                className="px-3 h-9 rounded-button flex items-center justify-center border border-sand text-sm font-medium text-warm-black hover:bg-cream transition-colors"
              >
                Today
              </button>
              <button
                onClick={goNext}
                className="w-9 h-9 rounded-button flex items-center justify-center border border-sand text-warm-black hover:bg-cream transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Date Display */}
            <h2 className="text-h1 text-warm-black min-w-[180px]">{dateDisplay}</h2>
          </div>

          {/* Right: New Post */}
          <button
            onClick={handleNewPost}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button bg-caramel text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-card"
          >
            <Plus size={18} />
            New Post
          </button>
        </div>
      </div>

      {/* Section 2: Legend + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-card border border-linen px-4 py-3">
        {/* Platform Legend */}
        <div className="flex items-center gap-4">
          <span className="text-caption text-stone font-medium uppercase mr-1">Platforms</span>
          {(Object.keys(PLATFORM_CONFIG) as Platform[]).map(p => {
            const cfg = PLATFORM_CONFIG[p];
            return (
              <div key={p} className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-full', cfg.color.replace('text-', 'bg-'))} />
                <span className="text-sm text-warm-black">{cfg.label}</span>
              </div>
            );
          })}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'draft', 'scheduled', 'published'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                filterStatus === s
                  ? s === 'all'
                    ? 'bg-warm-black text-white border-warm-black'
                    : s === 'draft'
                      ? 'bg-info text-white border-info'
                      : s === 'scheduled'
                        ? 'bg-warning text-white border-warning'
                        : 'bg-success text-white border-success'
                  : 'bg-white text-stone border-sand hover:border-caramel/50'
              )}
            >
              {s !== 'all' && <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                s === 'draft' ? 'bg-info' : s === 'scheduled' ? 'bg-warning' : 'bg-success'
              )} />}
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="text-caption opacity-80">{statusCounts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'month' && (
        <MonthView
          currentDate={currentDate}
          posts={posts}
          filterStatus={filterStatus}
          onPostClick={handleEditPost}
          onDayClick={handleDayClick}
          onMovePost={handleMovePost}
        />
      )}
      {viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          posts={posts}
          filterStatus={filterStatus}
          onPostClick={handleEditPost}
          onDayClick={handleDayClick}
        />
      )}
      {viewMode === 'day' && (
        <DayView
          currentDate={currentDate}
          posts={posts}
          filterStatus={filterStatus}
          onPostClick={handleEditPost}
        />
      )}

      {/* Post Modal */}
      <PostModal
        post={editingPost}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePost}
        onDelete={handleDeletePost}
        initialDate={modalInitialDate}
      />
    </div>
  );
}
