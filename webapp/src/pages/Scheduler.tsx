import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import {
  AlertCircle,
  CalendarDays,
  Camera as Instagram,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  ImagePlus,
  LayoutGrid,
  List,
  Loader2,
  MessagesSquare as Facebook,
  Pencil,
  PlaySquare as Youtube,
  Plus,
  RefreshCw,
  Repeat2,
  Rows3,
  Search,
  Send,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createScheduledPost,
  deleteScheduledPost,
  fetchPlatformAccounts,
  fetchScheduledPosts,
  publishScheduledPost,
  updateScheduledPost,
  uploadAsset,
  type ApiPlatform,
  type ApiPostStatus,
  type PlatformAccount,
  type ScheduledPostDTO,
} from '@/lib/api';

type Platform = 'instagram' | 'facebook' | 'youtube';
type Status = 'draft' | 'scheduled' | 'published' | 'failed';
type ViewMode = 'month' | 'week' | 'day' | 'list';
type RepeatInterval = 'none' | 'day' | 'week' | 'month';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: Platform[];
  status: Status;
  date: Date;
  time: string;
  mediaUrls: string[];
}

interface PostFormData {
  id?: string;
  title: string;
  content: string;
  contentByPlatform: Record<Platform, string>;
  platforms: Platform[];
  dateStr: string;
  timeStr: string;
  mediaUrls: string[];
  repeatInterval: RepeatInterval;
  repeatCount: number;
}

const PLATFORM_CONFIG: Record<
  Platform,
  {
    label: string;
    short: string;
    color: string;
    surface: string;
    border: string;
    icon: typeof Instagram;
    limit: number;
  }
> = {
  instagram: {
    label: 'Instagram',
    short: 'IG',
    color: 'text-[#D94675]',
    surface: 'bg-[#FFF1F5]',
    border: 'border-[#D94675]',
    icon: Instagram,
    limit: 2200,
  },
  facebook: {
    label: 'Facebook',
    short: 'FB',
    color: 'text-[#1877F2]',
    surface: 'bg-[#EFF6FF]',
    border: 'border-[#1877F2]',
    icon: Facebook,
    limit: 63206,
  },
  youtube: {
    label: 'YouTube',
    short: 'YT',
    color: 'text-[#E11D48]',
    surface: 'bg-[#FFF1F2]',
    border: 'border-[#E11D48]',
    icon: Youtube,
    limit: 5000,
  },
};

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; surface: string; dot: string; icon: typeof FileText }
> = {
  draft: {
    label: 'Draft',
    color: 'text-[#2563EB]',
    surface: 'bg-[#EFF6FF]',
    dot: 'bg-[#2563EB]',
    icon: FileText,
  },
  scheduled: {
    label: 'Scheduled',
    color: 'text-[#7C3AED]',
    surface: 'bg-[#F5F3FF]',
    dot: 'bg-[#7C3AED]',
    icon: Clock3,
  },
  published: {
    label: 'Published',
    color: 'text-[#15803D]',
    surface: 'bg-[#F0FDF4]',
    dot: 'bg-[#16A34A]',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    color: 'text-[#B91C1C]',
    surface: 'bg-[#FEF2F2]',
    dot: 'bg-[#DC2626]',
    icon: XCircle,
  },
};

const PLATFORM_TO_API: Record<Platform, ApiPlatform> = {
  instagram: 'INSTAGRAM',
  facebook: 'FACEBOOK',
  youtube: 'YOUTUBE',
};

const API_TO_PLATFORM: Record<ApiPlatform, Platform> = {
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  YOUTUBE: 'youtube',
};

const STATUS_TO_API: Record<Exclude<Status, 'failed'>, ApiPostStatus> = {
  draft: 'DRAFT',
  scheduled: 'SCHEDULED',
  published: 'PUBLISHED',
};

const API_TO_STATUS: Record<ApiPostStatus, Status> = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  FAILED: 'failed',
};

function toIsoDateTime(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

function dtoToPost(dto: ScheduledPostDTO): ScheduledPost {
  const date = new Date(dto.scheduledAt);
  const [firstLine = '', ...rest] = (dto.content || '').split('\n');
  return {
    id: dto.id,
    title: firstLine.trim() || '(untitled)',
    content: rest.join('\n').trim() || firstLine.trim(),
    platforms: [API_TO_PLATFORM[dto.platform]],
    status: API_TO_STATUS[dto.status],
    date,
    time: format(date, 'HH:mm'),
    mediaUrls: dto.mediaUrls ?? [],
  };
}

function buildContent(title: string, content: string) {
  return [title.trim(), content.trim()].filter(Boolean).join('\n');
}

function addRepeatInterval(date: Date, interval: RepeatInterval, amount: number) {
  if (interval === 'day') return addDays(date, amount);
  if (interval === 'week') return addWeeks(date, amount);
  if (interval === 'month') return addMonths(date, amount);
  return date;
}

function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold',
        config.surface,
        config.color,
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {config.label}
    </span>
  );
}

function PlatformMarks({ platforms, size = 16 }: { platforms: Platform[]; size?: number }) {
  return (
    <span className="flex items-center -space-x-1">
      {platforms.map((platform) => {
        const config = PLATFORM_CONFIG[platform];
        const Icon = config.icon;
        return (
          <span
            key={platform}
            title={config.label}
            className={cn(
              'flex items-center justify-center rounded-full border-2 border-white bg-white',
              config.color,
            )}
            style={{ width: size + 8, height: size + 8 }}
          >
            <Icon size={size} aria-hidden="true" />
          </span>
        );
      })}
    </span>
  );
}

function PostModal({
  post,
  template,
  accounts,
  isOpen,
  initialDate,
  onClose,
  onSave,
  onPublish,
  onDelete,
  onDuplicate,
}: {
  post: ScheduledPost | null;
  template: ScheduledPost | null;
  accounts: PlatformAccount[];
  isOpen: boolean;
  initialDate?: Date;
  onClose: () => void;
  onSave: (data: PostFormData, status: 'draft' | 'scheduled') => Promise<void>;
  onPublish: (data: PostFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (post: ScheduledPost) => void;
}) {
  const [title, setTitle] = useState('');
  const [sharedContent, setSharedContent] = useState('');
  const [overrides, setOverrides] = useState<Partial<Record<Platform, string>>>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram']);
  const [editorPlatform, setEditorPlatform] = useState<Platform | 'shared'>('shared');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('09:00');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>('none');
  const [repeatCount, setRepeatCount] = useState(2);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<'draft' | 'scheduled' | 'publish' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const source = post ?? template;
  const isEditing = Boolean(post);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setBusy(null);
    setUploading(false);
    setEditorPlatform('shared');
    setOverrides({});
    setRepeatInterval('none');
    setRepeatCount(2);
    if (source) {
      setTitle(source.title === '(untitled)' ? '' : source.title);
      setSharedContent(source.content);
      setSelectedPlatforms([...source.platforms]);
      setDateStr(format(source.date, 'yyyy-MM-dd'));
      setTimeStr(source.time);
      setMediaUrls([...source.mediaUrls]);
    } else {
      const seedDate = initialDate ?? new Date();
      setTitle('');
      setSharedContent('');
      setSelectedPlatforms(['instagram']);
      setDateStr(format(seedDate, 'yyyy-MM-dd'));
      setTimeStr(format(seedDate, 'HH:mm') === '00:00' ? '09:00' : format(seedDate, 'HH:mm'));
      setMediaUrls([]);
    }
  }, [isOpen, source, initialDate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, isOpen, onClose]);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.connected && account.isActive),
    [accounts],
  );

  const accountForPlatform = (platform: Platform) =>
    activeAccounts.find((account) => account.platform === platform && account.isPrimary) ??
    activeAccounts.find((account) => account.platform === platform);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((current) => {
      if (current.includes(platform)) {
        if (current.length === 1) return current;
        if (editorPlatform === platform) setEditorPlatform('shared');
        return current.filter((item) => item !== platform);
      }
      return [...current, platform];
    });
  };

  const editorContent =
    editorPlatform === 'shared' ? sharedContent : (overrides[editorPlatform] ?? sharedContent);

  const setEditorContent = (value: string) => {
    if (editorPlatform === 'shared') {
      setSharedContent(value);
    } else {
      setOverrides((current) => ({ ...current, [editorPlatform]: value }));
    }
  };

  const resetOverride = (platform: Platform) => {
    setOverrides((current) => {
      const next = { ...current };
      delete next[platform];
      return next;
    });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => uploadAsset(file)));
      setMediaUrls((current) => [
        ...current,
        ...uploaded.map((asset) => asset.url).filter(Boolean),
      ]);
    } catch {
      setError('Media upload failed. Check the file type and size, then try again.');
    } finally {
      setUploading(false);
    }
  };

  const formData = (): PostFormData => ({
    id: post?.id,
    title: title.trim(),
    content: sharedContent.trim(),
    contentByPlatform: {
      instagram: (overrides.instagram ?? sharedContent).trim(),
      facebook: (overrides.facebook ?? sharedContent).trim(),
      youtube: (overrides.youtube ?? sharedContent).trim(),
    },
    platforms: selectedPlatforms,
    dateStr,
    timeStr,
    mediaUrls,
    repeatInterval,
    repeatCount: repeatInterval === 'none' ? 1 : Math.max(2, Math.min(30, repeatCount)),
  });

  const validate = (kind: 'draft' | 'scheduled' | 'publish') => {
    const hasContent = selectedPlatforms.some(
      (platform) => title.trim() || (overrides[platform] ?? sharedContent).trim(),
    );
    if (!hasContent) return 'Add a title, caption, or description before saving.';
    if (!selectedPlatforms.length) return 'Select at least one channel.';
    const tooLong = selectedPlatforms.find(
      (platform) => (overrides[platform] ?? sharedContent).length > PLATFORM_CONFIG[platform].limit,
    );
    if (tooLong) return `${PLATFORM_CONFIG[tooLong].label} copy exceeds its character limit.`;
    if (kind === 'scheduled' && new Date(`${dateStr}T${timeStr}:00`) <= new Date()) {
      return 'Choose a future time for a scheduled post.';
    }
    return null;
  };

  const submit = async (kind: 'draft' | 'scheduled' | 'publish') => {
    const validationError = validate(kind);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'publish') await onPublish(formData());
      else await onSave(formData(), kind);
      onClose();
    } catch (caught) {
      const message = (caught as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      setError(message || 'The post could not be saved. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const removeMedia = (url: string) =>
    setMediaUrls((current) => current.filter((item) => item !== url));

  const previewDate = useMemo(() => {
    const value = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
    return Number.isNaN(value.getTime()) ? new Date() : value;
  }, [dateStr, timeStr]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-composer-title"
    >
      <button
        type="button"
        aria-label="Close post composer"
        className="absolute inset-0 cursor-default bg-[#19151F]/60 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />
      <div className="relative flex max-h-[94vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-[#E6E0ED] bg-white shadow-2xl">
        <header className="flex min-h-16 items-center justify-between border-b border-[#ECE7F1] px-5 sm:px-7">
          <div>
            <h2 id="post-composer-title" className="text-lg font-bold text-[#231B2E]">
              {isEditing ? 'Edit post' : template ? 'Duplicate post' : 'Create post'}
            </h2>
            <p className="text-xs text-[#756B80]">
              Shared content with optional channel-specific edits
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busy)}
            aria-label="Close"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-[#756B80] transition-colors hover:bg-[#F7F5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#612BD3]"
          >
            <X size={20} />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden">
          <div className="space-y-6 p-5 sm:p-7 lg:overflow-y-auto">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold text-[#31283B]">Publish to</label>
                <span className="text-xs text-[#756B80]">{selectedPlatforms.length} selected</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((platform) => {
                  const config = PLATFORM_CONFIG[platform];
                  const Icon = config.icon;
                  const account = accountForPlatform(platform);
                  const selected = selectedPlatforms.includes(platform);
                  return (
                    <button
                      type="button"
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      aria-pressed={selected}
                      className={cn(
                        'flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#612BD3]',
                        selected
                          ? 'border-[#7C3AED] bg-[#F7F3FF] shadow-sm'
                          : 'border-[#E6E0ED] bg-white hover:border-[#B9A7D9]',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          config.surface,
                          config.color,
                        )}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#31283B]">
                          {config.label}
                        </span>
                        <span className="block truncate text-[11px] text-[#756B80]">
                          {account?.accountName || 'Primary account'}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border',
                          selected
                            ? 'border-[#612BD3] bg-[#612BD3] text-white'
                            : 'border-[#CFC6D8] text-transparent',
                        )}
                      >
                        <Check size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
              {accounts.length === 0 && (
                <p className="mt-2 text-xs text-[#9A6700]">
                  No active connected accounts were found. Posts will use each platform&apos;s
                  configured primary account.
                </p>
              )}
            </section>

            <section className="space-y-3">
              <label htmlFor="post-title" className="text-sm font-semibold text-[#31283B]">
                Post title
              </label>
              <input
                id="post-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Add a title or opening line"
                className="h-11 w-full rounded-xl border border-[#DCD5E3] px-3 text-sm text-[#31283B] outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
              />

              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setEditorPlatform('shared')}
                  className={cn(
                    'min-h-10 shrink-0 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors',
                    editorPlatform === 'shared'
                      ? 'bg-[#31283B] text-white'
                      : 'bg-[#F5F2F8] text-[#62586D] hover:bg-[#ECE7F1]',
                  )}
                >
                  Shared post
                </button>
                {selectedPlatforms.map((platform) => {
                  const config = PLATFORM_CONFIG[platform];
                  const Icon = config.icon;
                  return (
                    <button
                      type="button"
                      key={platform}
                      onClick={() => setEditorPlatform(platform)}
                      className={cn(
                        'flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors',
                        editorPlatform === platform
                          ? 'bg-[#F1EAFE] text-[#612BD3]'
                          : 'bg-[#F8F6FA] text-[#62586D] hover:bg-[#ECE7F1]',
                      )}
                    >
                      <Icon size={14} />
                      {config.label}
                      {overrides[platform] !== undefined && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#612BD3]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-[#DCD5E3] bg-white focus-within:border-[#7C3AED] focus-within:ring-2 focus-within:ring-[#7C3AED]/15">
                <textarea
                  aria-label={
                    editorPlatform === 'shared'
                      ? 'Shared post content'
                      : `${PLATFORM_CONFIG[editorPlatform].label} post content`
                  }
                  value={editorContent}
                  onChange={(event) => setEditorContent(event.target.value)}
                  rows={7}
                  placeholder={
                    editorPlatform === 'shared'
                      ? 'Write once, then customize for each channel…'
                      : `Customize the ${PLATFORM_CONFIG[editorPlatform].label} version…`
                  }
                  className="w-full resize-none rounded-xl bg-transparent p-4 text-sm leading-6 text-[#31283B] outline-none placeholder:text-[#A49BAE]"
                />
                <div className="flex min-h-11 items-center justify-between border-t border-[#EEEAF2] px-3">
                  <div className="flex items-center gap-2">
                    {editorPlatform !== 'shared' && overrides[editorPlatform] !== undefined && (
                      <button
                        type="button"
                        onClick={() => resetOverride(editorPlatform)}
                        className="cursor-pointer text-xs font-semibold text-[#612BD3] hover:underline"
                      >
                        Use shared copy
                      </button>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      editorPlatform !== 'shared' &&
                        editorContent.length > PLATFORM_CONFIG[editorPlatform].limit
                        ? 'font-semibold text-red-600'
                        : 'text-[#817788]',
                    )}
                  >
                    {editorContent.length}
                    {editorPlatform !== 'shared' &&
                      ` / ${PLATFORM_CONFIG[editorPlatform].limit.toLocaleString()}`}
                  </span>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-semibold text-[#31283B]">Media</label>
                <span className="text-xs text-[#756B80]">{mediaUrls.length} attached</span>
              </div>
              <label
                className={cn(
                  'flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-[#CFC6D8] bg-[#FAF9FB] px-4 text-center transition-colors hover:border-[#8B5CF6] hover:bg-[#F8F5FF]',
                  uploading && 'cursor-wait opacity-70',
                )}
              >
                {uploading ? (
                  <Loader2 className="animate-spin text-[#612BD3]" size={22} />
                ) : (
                  <ImagePlus className="text-[#612BD3]" size={22} />
                )}
                <span className="text-sm text-[#62586D]">
                  {uploading ? 'Uploading media…' : 'Upload images or video'}
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  disabled={uploading}
                  className="hidden"
                  onChange={(event) => {
                    handleUpload(event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
              {mediaUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {mediaUrls.map((url) => {
                    const video = /\.(mp4|mov|webm)(\?|$)/i.test(url);
                    return (
                      <div
                        key={url}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-[#E6E0ED] bg-[#F5F2F8]"
                      >
                        {video ? (
                          <video src={url} muted className="h-full w-full object-cover" />
                        ) : (
                          <img src={url} alt="Post media preview" className="h-full w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(url)}
                          aria-label="Remove media"
                          className="absolute right-1.5 top-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#231B2E]/85 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="grid gap-4 rounded-xl border border-[#E6E0ED] bg-[#FAF9FB] p-4 sm:grid-cols-2">
              <div>
                <label htmlFor="schedule-date" className="mb-2 block text-xs font-semibold text-[#62586D]">
                  Publish date
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  value={dateStr}
                  onChange={(event) => setDateStr(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#DCD5E3] bg-white px-3 text-sm text-[#31283B] outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                />
              </div>
              <div>
                <label htmlFor="schedule-time" className="mb-2 block text-xs font-semibold text-[#62586D]">
                  Publish time
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  value={timeStr}
                  onChange={(event) => setTimeStr(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#DCD5E3] bg-white px-3 text-sm text-[#31283B] outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
                />
              </div>
              <div>
                <label htmlFor="repeat-interval" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#62586D]">
                  <Repeat2 size={13} />
                  Repeat
                </label>
                <select
                  id="repeat-interval"
                  value={repeatInterval}
                  disabled={isEditing}
                  onChange={(event) => setRepeatInterval(event.target.value as RepeatInterval)}
                  className="h-11 w-full cursor-pointer rounded-xl border border-[#DCD5E3] bg-white px-3 text-sm text-[#31283B] outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#7C3AED]"
                >
                  <option value="none">Does not repeat</option>
                  <option value="day">Every day</option>
                  <option value="week">Every week</option>
                  <option value="month">Every month</option>
                </select>
              </div>
              <div>
                <label htmlFor="repeat-count" className="mb-2 block text-xs font-semibold text-[#62586D]">
                  Occurrences
                </label>
                <input
                  id="repeat-count"
                  type="number"
                  min={2}
                  max={30}
                  value={repeatCount}
                  disabled={repeatInterval === 'none' || isEditing}
                  onChange={(event) => setRepeatCount(Number(event.target.value))}
                  className="h-11 w-full rounded-xl border border-[#DCD5E3] bg-white px-3 text-sm text-[#31283B] outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#7C3AED]"
                />
              </div>
              <p className="text-xs text-[#756B80] sm:col-span-2">
                Times use your local timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}.
              </p>
            </section>
          </div>

          <aside className="border-t border-[#ECE7F1] bg-[#F8F6FA] p-5 sm:p-7 lg:overflow-y-auto lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#31283B]">Channel previews</h3>
              <span className="text-xs text-[#756B80]">Live</span>
            </div>
            <div className="space-y-4">
              {selectedPlatforms.map((platform) => {
                const config = PLATFORM_CONFIG[platform];
                const Icon = config.icon;
                const content = overrides[platform] ?? sharedContent;
                const account = accountForPlatform(platform);
                return (
                  <article key={platform} className="overflow-hidden rounded-2xl border border-[#E1DAE8] bg-white shadow-sm">
                    <div className="flex items-center gap-3 p-4">
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', config.surface, config.color)}>
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#31283B]">
                          {account?.accountName || config.label}
                        </p>
                        <p className="text-[11px] text-[#817788]">Just now · {config.label}</p>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <p className="whitespace-pre-wrap text-sm leading-5 text-[#403747]">
                        {content || 'Your post preview will appear here.'}
                      </p>
                    </div>
                    {mediaUrls[0] && (
                      <div className="aspect-video bg-[#EEEAF2]">
                        {/\.(mp4|mov|webm)(\?|$)/i.test(mediaUrls[0]) ? (
                          <video src={mediaUrls[0]} muted className="h-full w-full object-cover" />
                        ) : (
                          <img src={mediaUrls[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-[#EEEAF2] px-4 py-3">
                      <span className="text-[11px] text-[#817788]">
                        {format(previewDate, 'MMM d, h:mm a')}
                      </span>
                      {overrides[platform] !== undefined && (
                        <span className="rounded-full bg-[#F1EAFE] px-2 py-1 text-[10px] font-semibold text-[#612BD3]">
                          Custom copy
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>
        </div>

        {error && (
          <div className="mx-5 mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-7">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <footer className="flex flex-col gap-3 border-t border-[#ECE7F1] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex gap-2">
            {isEditing && post && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Delete this post? This cannot be undone.')) return;
                    setBusy('delete');
                    try {
                      await onDelete(post.id);
                      onClose();
                    } catch {
                      setError('The post could not be deleted.');
                    } finally {
                      setBusy(null);
                    }
                  }}
                  disabled={Boolean(busy)}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  {busy === 'delete' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicate(post)}
                  disabled={Boolean(busy)}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#62586D] transition-colors hover:bg-[#F5F2F8] disabled:opacity-50"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
              </>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => submit('draft')}
              disabled={Boolean(busy) || uploading}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#DCD5E3] bg-white px-4 text-sm font-semibold text-[#4D4356] transition-colors hover:bg-[#F8F6FA] disabled:opacity-50"
            >
              {busy === 'draft' ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
              Save draft
            </button>
            <button
              type="button"
              onClick={() => submit('publish')}
              disabled={Boolean(busy) || uploading}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#B9A7D9] bg-white px-4 text-sm font-semibold text-[#612BD3] transition-colors hover:bg-[#F7F3FF] disabled:opacity-50"
            >
              {busy === 'publish' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Post now
            </button>
            <button
              type="button"
              onClick={() => submit('scheduled')}
              disabled={Boolean(busy) || uploading}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#612BD3] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#5424B8] disabled:opacity-50"
            >
              {busy === 'scheduled' ? <Loader2 size={15} className="animate-spin" /> : <CalendarDays size={15} />}
              {isEditing ? 'Update schedule' : 'Schedule'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CompactPost({
  post,
  onClick,
  draggable,
  onDragStart,
}: {
  post: ScheduledPost;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
}) {
  const primary = PLATFORM_CONFIG[post.platforms[0]];
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-1.5 rounded-lg border-l-2 bg-white px-2 py-1.5 text-left shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#612BD3]',
        primary.border,
      )}
    >
      {post.mediaUrls[0] ? (
        <img src={post.mediaUrls[0]} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
      ) : (
        <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_CONFIG[post.status].dot)} />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-semibold text-[#31283B]">{post.title}</span>
        <span className="block text-[10px] text-[#817788]">{post.time}</span>
      </span>
      <PlatformMarks platforms={post.platforms} size={10} />
    </button>
  );
}

function MonthView({
  currentDate,
  posts,
  onPostClick,
  onDayClick,
  onMovePost,
}: {
  currentDate: Date;
  posts: ScheduledPost[];
  onPostClick: (post: ScheduledPost) => void;
  onDayClick: (date: Date) => void;
  onMovePost: (postId: string, date: Date) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const handleDrop = (event: DragEvent<HTMLDivElement>, day: Date) => {
    event.preventDefault();
    if (dragging) onMovePost(dragging, day);
    setDragging(null);
    setDragTarget(null);
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E6E0ED] bg-white shadow-sm">
      <div className="min-w-[820px]">
        <div className="grid grid-cols-7 border-b border-[#EDE8F1] bg-[#FAF9FB]">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
            (day) => (
              <div key={day} className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-[#756B80]">
                {day}
              </div>
            ),
          )}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayPosts = posts
              .filter((post) => isSameDay(post.date, day))
              .sort((a, b) => a.time.localeCompare(b.time));
            return (
              <div
                key={key}
                onClick={() => onDayClick(day)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragTarget(key);
                }}
                onDragLeave={() => setDragTarget(null)}
                onDrop={(event) => handleDrop(event, day)}
                className={cn(
                  'min-h-[128px] cursor-pointer border-b border-r border-[#EDE8F1] p-2 transition-colors hover:bg-[#FCFAFF]',
                  !isSameMonth(day, currentDate) && 'bg-[#FAF9FB] text-[#A49BAE]',
                  dragTarget === key && 'bg-[#F1EAFE] ring-2 ring-inset ring-[#7C3AED]',
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={cn(
                      'flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-xs font-bold',
                      isToday(day) ? 'bg-[#612BD3] text-white' : 'text-[#4D4356]',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayPosts.length > 0 && (
                    <span className="text-[10px] font-semibold text-[#817788]">{dayPosts.length}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {dayPosts.slice(0, 3).map((post) => (
                    <CompactPost
                      key={post.id}
                      post={post}
                      draggable={post.status !== 'published'}
                      onDragStart={() => setDragging(post.id)}
                      onClick={() => onPostClick(post)}
                    />
                  ))}
                  {dayPosts.length > 3 && (
                    <p className="px-1 text-[11px] font-semibold text-[#612BD3]">
                      +{dayPosts.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekView({
  currentDate,
  posts,
  onPostClick,
  onDayClick,
}: {
  currentDate: Date;
  posts: ScheduledPost[];
  onPostClick: (post: ScheduledPost) => void;
  onDayClick: (date: Date) => void;
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E6E0ED] bg-white shadow-sm">
      <div className="grid min-w-[900px] grid-cols-7">
        {days.map((day) => {
          const dayPosts = posts
            .filter((post) => isSameDay(post.date, day))
            .sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={day.toISOString()} className="min-h-[580px] border-r border-[#EDE8F1] last:border-r-0">
              <button
                type="button"
                onClick={() => onDayClick(day)}
                className="flex w-full cursor-pointer flex-col items-center border-b border-[#EDE8F1] bg-[#FAF9FB] px-2 py-4 transition-colors hover:bg-[#F5F0FC]"
              >
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#817788]">{format(day, 'EEE')}</span>
                <span
                  className={cn(
                    'mt-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
                    isToday(day) ? 'bg-[#612BD3] text-white' : 'text-[#31283B]',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </button>
              <div className="space-y-2 p-2">
                {dayPosts.map((post) => (
                  <article
                    key={post.id}
                    onClick={() => onPostClick(post)}
                    className={cn(
                      'cursor-pointer rounded-xl border border-[#E6E0ED] border-l-4 bg-white p-3 transition hover:-translate-y-px hover:shadow-md',
                      PLATFORM_CONFIG[post.platforms[0]].border,
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#756B80]">{post.time}</span>
                      <PlatformMarks platforms={post.platforms} size={12} />
                    </div>
                    <p className="line-clamp-2 text-xs font-bold leading-5 text-[#31283B]">{post.title}</p>
                    <div className="mt-2">
                      <StatusBadge status={post.status} />
                    </div>
                  </article>
                ))}
                {!dayPosts.length && (
                  <button
                    type="button"
                    onClick={() => onDayClick(day)}
                    className="flex min-h-20 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#DDD5E5] text-xs text-[#A49BAE] transition hover:border-[#9B7AD5] hover:text-[#612BD3]"
                  >
                    <Plus size={14} className="mr-1" /> Add post
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  currentDate,
  posts,
  onPostClick,
  onTimeClick,
}: {
  currentDate: Date;
  posts: ScheduledPost[];
  onPostClick: (post: ScheduledPost) => void;
  onTimeClick: (date: Date) => void;
}) {
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  const dayPosts = posts
    .filter((post) => isSameDay(post.date, currentDate))
    .sort((a, b) => a.time.localeCompare(b.time));
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E6E0ED] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#EDE8F1] bg-[#FAF9FB] px-5 py-4">
        <div>
          <h3 className="font-bold text-[#31283B]">{format(currentDate, 'EEEE, MMMM d')}</h3>
          <p className="text-xs text-[#817788]">{dayPosts.length} planned posts</p>
        </div>
        <span className="rounded-full bg-[#F1EAFE] px-3 py-1.5 text-xs font-semibold text-[#612BD3]">
          {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </span>
      </div>
      <div className="max-h-[680px] overflow-y-auto">
        {hours.map((hour) => {
          const hourPosts = dayPosts.filter((post) => Number(post.time.slice(0, 2)) === hour);
          const slotDate = new Date(currentDate);
          slotDate.setHours(hour, 0, 0, 0);
          return (
            <div key={hour} className="grid min-h-[76px] grid-cols-[76px_1fr]">
              <div className="border-r border-[#EDE8F1] pr-3 pt-3 text-right text-[11px] font-semibold text-[#817788]">
                {format(slotDate, 'h a')}
              </div>
              <div
                className="group relative border-b border-[#F0ECF3] p-2 transition-colors hover:bg-[#FCFAFF]"
                onDoubleClick={() => onTimeClick(slotDate)}
              >
                <button
                  type="button"
                  onClick={() => onTimeClick(slotDate)}
                  aria-label={`Create post at ${format(slotDate, 'h a')}`}
                  className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#8A7C96] opacity-0 transition group-hover:opacity-100 hover:bg-[#F1EAFE] hover:text-[#612BD3] focus:opacity-100"
                >
                  <Plus size={15} />
                </button>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {hourPosts.map((post) => (
                    <button
                      type="button"
                      key={post.id}
                      onClick={() => onPostClick(post)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border border-[#E6E0ED] border-l-4 bg-white p-3 text-left transition hover:shadow-md',
                        PLATFORM_CONFIG[post.platforms[0]].border,
                      )}
                    >
                      {post.mediaUrls[0] && (
                        <img src={post.mediaUrls[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] text-[#817788]">{post.time}</span>
                        <span className="block truncate text-xs font-bold text-[#31283B]">{post.title}</span>
                      </span>
                      <PlatformMarks platforms={post.platforms} size={11} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({
  posts,
  onEdit,
  onDuplicate,
  onPublish,
  onStatusChange,
}: {
  posts: ScheduledPost[];
  onEdit: (post: ScheduledPost) => void;
  onDuplicate: (post: ScheduledPost) => void;
  onPublish: (post: ScheduledPost) => void;
  onStatusChange: (post: ScheduledPost, status: 'draft' | 'scheduled') => void;
}) {
  const grouped = useMemo(() => {
    const groups = new Map<string, ScheduledPost[]>();
    posts
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach((post) => {
        const key = format(post.date, 'yyyy-MM-dd');
        groups.set(key, [...(groups.get(key) ?? []), post]);
      });
    return [...groups.entries()];
  }, [posts]);

  if (!posts.length) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCD5E3] bg-white p-8 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EAFE] text-[#612BD3]">
          <CalendarDays size={26} />
        </span>
        <h3 className="font-bold text-[#31283B]">No posts in this view</h3>
        <p className="mt-1 max-w-sm text-sm text-[#817788]">
          Adjust the status, channel, or search filters to find other content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([dateKey, datePosts]) => (
        <section key={dateKey}>
          <div className="mb-2 flex items-center gap-3">
            <h3 className="text-sm font-bold text-[#31283B]">{format(new Date(`${dateKey}T12:00:00`), 'EEEE, MMMM d')}</h3>
            <span className="rounded-full bg-[#EEEAF2] px-2 py-0.5 text-[11px] font-semibold text-[#756B80]">{datePosts.length}</span>
            <div className="h-px flex-1 bg-[#E6E0ED]" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#E6E0ED] bg-white shadow-sm">
            {datePosts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col gap-4 border-b border-[#EEEAF2] p-4 last:border-b-0 hover:bg-[#FCFAFF] sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {post.mediaUrls[0] ? (
                    <img src={post.mediaUrls[0]} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F5F2F8] text-[#8A7C96]">
                      <FileText size={22} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold tabular-nums text-[#756B80]">{post.time}</span>
                      <StatusBadge status={post.status} />
                    </div>
                    <h4 className="truncate text-sm font-bold text-[#31283B]">{post.title}</h4>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#817788]">{post.content}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <PlatformMarks platforms={post.platforms} />
                  {post.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(post, 'draft')}
                      className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#2563EB] transition hover:bg-blue-50"
                    >
                      <FileText size={14} /> Move to draft
                    </button>
                  )}
                  {(post.status === 'draft' || post.status === 'failed') && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(post, 'scheduled')}
                      className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#612BD3] transition hover:bg-[#F1EAFE]"
                    >
                      <CalendarDays size={14} /> {post.status === 'failed' ? 'Retry' : 'Schedule'}
                    </button>
                  )}
                  {post.status !== 'published' && (
                    <button
                      type="button"
                      onClick={() => onPublish(post)}
                      className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#15803D] transition hover:bg-green-50"
                    >
                      <Send size={14} /> Publish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDuplicate(post)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[#756B80] transition hover:bg-[#F1EAFE] hover:text-[#612BD3]"
                    aria-label={`Duplicate ${post.title}`}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(post)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[#756B80] transition hover:bg-[#F1EAFE] hover:text-[#612BD3]"
                    aria-label={`Edit ${post.title}`}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Scheduler() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [templatePost, setTemplatePost] = useState<ScheduledPost | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date>();

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const [postsResult, accountsResult] = await Promise.allSettled([
        fetchScheduledPosts({ limit: 100 }),
        fetchPlatformAccounts(),
      ]);
      if (postsResult.status === 'rejected') throw postsResult.reason;
      setPosts(postsResult.value.data.map(dtoToPost));
      setAccounts(accountsResult.status === 'fulfilled' ? accountsResult.value.accounts : []);
    } catch (error) {
      console.error('Failed to load scheduler data', error);
      setLoadError('Could not load scheduled posts. Check the API connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statusCounts = useMemo(() => {
    const counts: Record<Status | 'all', number> = {
      all: posts.length,
      draft: 0,
      scheduled: 0,
      published: 0,
      failed: 0,
    };
    posts.forEach((post) => counts[post.status]++);
    return counts;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (statusFilter !== 'all' && post.status !== statusFilter) return false;
      if (platformFilter !== 'all' && !post.platforms.includes(platformFilter)) return false;
      if (query && !`${post.title} ${post.content}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [platformFilter, posts, search, statusFilter]);

  const openCreate = (date = currentDate) => {
    setEditingPost(null);
    setTemplatePost(null);
    setModalInitialDate(date);
    setModalOpen(true);
  };

  const openEdit = (post: ScheduledPost) => {
    setTemplatePost(null);
    setEditingPost(post);
    setModalOpen(true);
  };

  const openDuplicate = (post: ScheduledPost) => {
    setEditingPost(null);
    setTemplatePost(post);
    setModalInitialDate(post.date);
    setModalOpen(true);
  };

  const savePost = async (
    data: PostFormData,
    status: 'draft' | 'scheduled',
  ) => {
    const firstDate = new Date(`${data.dateStr}T${data.timeStr}:00`);
    const occurrences = Array.from({ length: data.repeatCount }, (_, index) =>
      addRepeatInterval(firstDate, data.repeatInterval, index),
    );

    for (let occurrenceIndex = 0; occurrenceIndex < occurrences.length; occurrenceIndex++) {
      const scheduledAt = occurrences[occurrenceIndex].toISOString();
      for (let platformIndex = 0; platformIndex < data.platforms.length; platformIndex++) {
        const platform = data.platforms[platformIndex];
        const payload = {
          platform: PLATFORM_TO_API[platform],
          content: buildContent(data.title, data.contentByPlatform[platform]),
          mediaUrls: data.mediaUrls,
          scheduledAt,
          status: STATUS_TO_API[status],
        };
        if (data.id && occurrenceIndex === 0 && platformIndex === 0) {
          await updateScheduledPost(data.id, payload);
        } else {
          await createScheduledPost(payload);
        }
      }
    }
    await loadData();
  };

  const publishPost = async (data: PostFormData) => {
    const ids: string[] = [];
    const scheduledAt = toIsoDateTime(data.dateStr, data.timeStr);
    for (let index = 0; index < data.platforms.length; index++) {
      const platform = data.platforms[index];
      const payload = {
        platform: PLATFORM_TO_API[platform],
        content: buildContent(data.title, data.contentByPlatform[platform]),
        mediaUrls: data.mediaUrls,
        scheduledAt,
        status: 'SCHEDULED' as ApiPostStatus,
      };
      if (data.id && index === 0) {
        await updateScheduledPost(data.id, payload);
        ids.push(data.id);
      } else {
        const created = await createScheduledPost(payload);
        ids.push(created.id);
      }
    }
    await Promise.all(ids.map((id) => publishScheduledPost(id)));
    await loadData();
  };

  const quickPublish = async (post: ScheduledPost) => {
    setPublishingId(post.id);
    try {
      await publishScheduledPost(post.id);
      await loadData();
    } catch (error) {
      console.error('Quick publish failed', error);
      setLoadError('Publishing failed. Open the post to review its channel and media settings.');
    } finally {
      setPublishingId(null);
    }
  };

  const changePostStatus = async (
    post: ScheduledPost,
    status: 'draft' | 'scheduled',
  ) => {
    try {
      await updateScheduledPost(post.id, { status: STATUS_TO_API[status] });
      await loadData();
    } catch (error) {
      console.error('Status update failed', error);
      setLoadError('The post status could not be changed. Please try again.');
    }
  };

  const movePost = async (postId: string, newDate: Date) => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return;
    const previous = posts;
    const nextDate = new Date(newDate);
    const [hours, minutes] = post.time.split(':').map(Number);
    nextDate.setHours(hours, minutes, 0, 0);
    setPosts((current) =>
      current.map((item) => (item.id === postId ? { ...item, date: nextDate } : item)),
    );
    try {
      await updateScheduledPost(postId, { scheduledAt: nextDate.toISOString() });
    } catch {
      setPosts(previous);
      setLoadError('The post could not be moved. Its original schedule was restored.');
    }
  };

  const goPrevious = () => {
    if (viewMode === 'month' || viewMode === 'list') setCurrentDate((date) => subMonths(date, 1));
    else if (viewMode === 'week') setCurrentDate((date) => subWeeks(date, 1));
    else setCurrentDate((date) => subDays(date, 1));
  };

  const goNext = () => {
    if (viewMode === 'month' || viewMode === 'list') setCurrentDate((date) => addMonths(date, 1));
    else if (viewMode === 'week') setCurrentDate((date) => addWeeks(date, 1));
    else setCurrentDate((date) => addDays(date, 1));
  };

  const dateLabel = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} – ${format(addDays(start, 6), 'MMM d, yyyy')}`;
    }
    if (viewMode === 'day') return format(currentDate, 'MMMM d, yyyy');
    return format(currentDate, 'MMMM yyyy');
  }, [currentDate, viewMode]);

  const viewOptions: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { value: 'month', label: 'Month', icon: LayoutGrid },
    { value: 'week', label: 'Week', icon: Rows3 },
    { value: 'day', label: 'Day', icon: CalendarDays },
    { value: 'list', label: 'List', icon: List },
  ];

  return (
    <div className="space-y-5 pb-10">
      <header className="rounded-2xl border border-[#E6E0ED] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-[#F1EAFE] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#612BD3]">
                Content planner
              </span>
              <span className="text-xs text-[#817788]">{accounts.filter((account) => account.isActive).length} active accounts</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#231B2E] sm:text-3xl">Publishing calendar</h1>
            <p className="mt-1 text-sm text-[#756B80]">
              Plan, customize, review, and publish every channel from one workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreate()}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#612BD3] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5424B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#612BD3] focus-visible:ring-offset-2"
          >
            <Plus size={18} />
            Create post
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-[#E6E0ED] bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-[#DED7E5] bg-[#FAF9FB] p-1">
              {viewOptions.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setViewMode(value)}
                  aria-pressed={viewMode === value}
                  className={cn(
                    'flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors',
                    viewMode === value
                      ? 'bg-white text-[#612BD3] shadow-sm'
                      : 'text-[#756B80] hover:text-[#31283B]',
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Previous date range"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[#DED7E5] text-[#62586D] transition hover:bg-[#F7F4FA]"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="min-h-11 cursor-pointer rounded-xl border border-[#DED7E5] px-3 text-xs font-semibold text-[#4D4356] transition hover:bg-[#F7F4FA]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next date range"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[#DED7E5] text-[#62586D] transition hover:bg-[#F7F4FA]"
            >
              <ChevronRight size={18} />
            </button>
            <h2 className="ml-1 min-w-[180px] text-base font-bold text-[#31283B]">{dateLabel}</h2>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block min-w-[220px]">
              <span className="sr-only">Search posts</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7C96]" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search content…"
                className="h-11 w-full rounded-xl border border-[#DED7E5] bg-white pl-9 pr-3 text-sm text-[#31283B] outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/15"
              />
            </label>
            <select
              aria-label="Filter by platform"
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value as Platform | 'all')}
              className="h-11 cursor-pointer rounded-xl border border-[#DED7E5] bg-white px-3 text-sm font-semibold text-[#62586D] outline-none focus:border-[#7C3AED]"
            >
              <option value="all">All channels</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto border-t border-[#EEEAF2] pt-3">
          {(['all', 'scheduled', 'draft', 'published', 'failed'] as const).map((status) => (
            <button
              type="button"
              key={status}
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
              className={cn(
                'flex min-h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors',
                statusFilter === status
                  ? 'border-[#612BD3] bg-[#F1EAFE] text-[#612BD3]'
                  : 'border-[#E1DAE8] bg-white text-[#756B80] hover:border-[#B9A7D9]',
              )}
            >
              {status !== 'all' && <span className={cn('h-2 w-2 rounded-full', STATUS_CONFIG[status].dot)} />}
              {status === 'all' ? 'All posts' : STATUS_CONFIG[status].label}
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 tabular-nums">{statusCounts[status]}</span>
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center">
          <AlertCircle size={17} className="shrink-0" />
          <span className="flex-1">{loadError}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 font-semibold hover:bg-red-100"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {publishingId && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <Loader2 size={16} className="animate-spin" />
          Publishing post…
        </div>
      )}

      {loading ? (
        <div className="flex min-h-96 items-center justify-center rounded-2xl border border-[#E6E0ED] bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto animate-spin text-[#612BD3]" size={28} />
            <p className="mt-3 text-sm text-[#756B80]">Loading publishing calendar…</p>
          </div>
        </div>
      ) : viewMode === 'month' ? (
        <MonthView
          currentDate={currentDate}
          posts={filteredPosts}
          onPostClick={openEdit}
          onDayClick={openCreate}
          onMovePost={movePost}
        />
      ) : viewMode === 'week' ? (
        <WeekView
          currentDate={currentDate}
          posts={filteredPosts}
          onPostClick={openEdit}
          onDayClick={(date) => {
            setCurrentDate(date);
            setViewMode('day');
          }}
        />
      ) : viewMode === 'day' ? (
        <DayView
          currentDate={currentDate}
          posts={filteredPosts}
          onPostClick={openEdit}
          onTimeClick={openCreate}
        />
      ) : (
        <ListView
          posts={filteredPosts}
          onEdit={openEdit}
          onDuplicate={openDuplicate}
          onPublish={quickPublish}
          onStatusChange={changePostStatus}
        />
      )}

      <PostModal
        post={editingPost}
        template={templatePost}
        accounts={accounts}
        isOpen={modalOpen}
        initialDate={modalInitialDate}
        onClose={() => setModalOpen(false)}
        onSave={savePost}
        onPublish={publishPost}
        onDelete={async (id) => {
          await deleteScheduledPost(id);
          await loadData();
        }}
        onDuplicate={openDuplicate}
      />
    </div>
  );
}
