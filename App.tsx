
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Plus, Trash2, CheckCircle, 
  ChevronRight, Brain, Clock, BarChart3, Settings2, 
  Sparkles, LayoutGrid, Loader2, Upload,
  SkipForward, GripVertical, Volume2, Coffee, Music, PlayCircle,
  X, Hourglass, AlertTriangle, FileSearch, Cpu, Sparkle, Save,
  Bookmark, ToggleLeft, ToggleRight, Moon, Sun, Palette,
  Square, CheckSquare
} from 'lucide-react';
import { Activity, AppMode, Preset } from './types';
import { COLORS, PRESET_TEMPLATES, AUDIO_URLS } from './constants';
import VisualTimer from './components/VisualTimer';
import StatsCard from './components/StatsCard';
import { getSmartInsights, extractActivitiesFromMedia } from './services/geminiService';

const App: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mode, setMode] = useState<AppMode>(AppMode.PLANNING);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | string[] | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Preset[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Settings state
  const [selectedSound, setSelectedSound] = useState<keyof typeof AUDIO_URLS>('chime');
  const [volume, setVolume] = useState(0.5);
  const [defaultBreakDuration, setDefaultBreakDuration] = useState(5);
  const [confirmBeforeDelete, setConfirmBeforeDelete] = useState(true);
  
  const [now, setNow] = useState(new Date());
  
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioStopTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Sync current time for clock hands
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Persistence and initial theme detection
  useEffect(() => {
    const saved = localStorage.getItem('focusflow_activities');
    const savedVol = localStorage.getItem('focusflow_volume');
    const savedSound = localStorage.getItem('focusflow_sound');
    const savedBreakDur = localStorage.getItem('focusflow_break_dur');
    const savedCustomTemplates = localStorage.getItem('focusflow_custom_templates');
    const savedConfirmDelete = localStorage.getItem('focusflow_confirm_delete');
    const savedDarkMode = localStorage.getItem('focusflow_dark_mode');
    
    if (savedVol) setVolume(parseFloat(savedVol));
    if (savedBreakDur) setDefaultBreakDuration(parseInt(savedBreakDur));
    if (savedSound && Object.keys(AUDIO_URLS).includes(savedSound)) {
      setSelectedSound(savedSound as keyof typeof AUDIO_URLS);
    }
    if (savedCustomTemplates) {
      try { setCustomTemplates(JSON.parse(savedCustomTemplates)); } catch (e) { console.error(e); }
    }
    if (savedConfirmDelete !== null) {
      setConfirmBeforeDelete(savedConfirmDelete === 'true');
    }
    
    let darkModeValue = false;
    if (savedDarkMode !== null) {
      darkModeValue = savedDarkMode === 'true';
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      darkModeValue = true;
    }
    setIsDarkMode(darkModeValue);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActivities(parsed.map((a: any) => ({ 
          ...a, 
          completed: false, 
          remainingSeconds: a.duration * 60 
        })));
      } catch (e) { 
        console.error("Load error", e); 
      }
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('focusflow_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('focusflow_activities', JSON.stringify(activities));
    localStorage.setItem('focusflow_volume', volume.toString());
    localStorage.setItem('focusflow_sound', selectedSound);
    localStorage.setItem('focusflow_break_dur', defaultBreakDuration.toString());
    localStorage.setItem('focusflow_custom_templates', JSON.stringify(customTemplates));
    localStorage.setItem('focusflow_confirm_delete', confirmBeforeDelete.toString());
    
    if (mode === AppMode.PLANNING) fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities.length, mode, volume, selectedSound, defaultBreakDuration, customTemplates, confirmBeforeDelete]);

  const fetchInsights = async () => {
    if (activities.length > 0) {
      const result = await getSmartInsights(activities);
      setInsights(result);
    }
  };

  const playAudioWithLimit = useCallback((durationMs: number = 5000) => {
    if (audioRef.current) {
      if (audioStopTimeoutRef.current) {
        window.clearTimeout(audioStopTimeoutRef.current);
      }
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(e => console.error("Playback failed", e));
      
      audioStopTimeoutRef.current = window.setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }, durationMs);
    }
  }, [volume]);

  const handleSoundChange = (sound: keyof typeof AUDIO_URLS) => {
    setSelectedSound(sound);
    setTimeout(() => playAudioWithLimit(1500), 50);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const addActivity = () => {
    const newId = crypto.randomUUID();
    const duration = 15;
    setActivities(prev => [...prev, {
      id: newId,
      name: "New Activity",
      duration,
      color: COLORS[prev.length % COLORS.length],
      completed: false,
      remainingSeconds: duration * 60
    }]);
  };

  const addBreak = () => {
    const newId = crypto.randomUUID();
    setActivities(prev => [...prev, {
      id: newId,
      name: "Short Break",
      duration: defaultBreakDuration,
      color: '#10b981', 
      completed: false,
      remainingSeconds: defaultBreakDuration * 60
    }]);
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updates };
        if (updates.duration !== undefined) {
          updated.remainingSeconds = updated.duration * 60;
        }
        return updated;
      }
      return a;
    }));
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === activities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activities.map(a => a.id)));
    }
  };

  const requestDelete = (id: string | string[]) => {
    if (confirmBeforeDelete) {
      setDeleteConfirmation(id);
    } else {
      deleteActivities(id);
    }
  };

  const deleteActivities = (ids: string | string[]) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    setActivities(prev => prev.filter(a => !idList.includes(a.id)));
    setSelectedIds(prev => {
      const next = new Set(prev);
      idList.forEach(id => next.delete(id));
      return next;
    });
    setDeleteConfirmation(null);
  };

  const startSession = () => {
    if (activities.length === 0) return;
    setMode(AppMode.RUNNING);
    setIsRunning(true);
    setCurrentIndex(0);
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const handleSkip = () => {
    playAudioWithLimit(5000);
    setActivities(prev => prev.map((a, i) => i === currentIndex ? { ...a, completed: true, remainingSeconds: 0 } : a));
    if (currentIndex < activities.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
      setMode(AppMode.SUMMARY);
    }
  };

  const resetSession = () => {
    setIsRunning(false);
    setMode(AppMode.PLANNING);
    setCurrentIndex(0);
    setActivities(prev => prev.map(a => ({ 
      ...a, 
      completed: false, 
      remainingSeconds: a.duration * 60 
    })));
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTimerEnd = useCallback(() => {
    playAudioWithLimit(5000);
    setActivities(prev => prev.map((a, i) => i === currentIndex ? { ...a, completed: true, remainingSeconds: 0 } : a));
    
    if (currentIndex < activities.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
      setMode(AppMode.SUMMARY);
    }
  }, [currentIndex, activities.length, playAudioWithLimit]);

  useEffect(() => {
    if (isRunning && mode === AppMode.RUNNING) {
      timerRef.current = window.setInterval(() => {
        setActivities(prev => {
          const current = prev[currentIndex];
          if (!current || current.remainingSeconds <= 0) {
            handleTimerEnd();
            return prev;
          }
          return prev.map((a, i) => i === currentIndex ? { ...a, remainingSeconds: a.remainingSeconds - 1 } : a);
        });
      }, 1000);
    } else {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => { 
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      } 
    };
  }, [isRunning, mode, currentIndex, handleTimerEnd]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportStatus("Preparing document...");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setImportStatus("Reading file content...");
        const base64Data = e.target?.result?.toString().split(',')[1];
        if (base64Data) {
          setImportStatus("Uploading...");
          const extracted = await extractActivitiesFromMedia(base64Data, file.type);
          setImportStatus("Building your schedule...");
          const newActivities = extracted.map((task, index) => ({
            id: crypto.randomUUID(),
            name: task.name,
            duration: task.duration,
            color: COLORS[(activities.length + index) % COLORS.length],
            completed: false,
            remainingSeconds: task.duration * 60
          }));
          setActivities(prev => [...prev, ...newActivities]);
          setImportStatus("Complete!");
          setTimeout(() => {
            setIsImporting(false);
            setImportStatus("");
          }, 1000);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Import failed", error);
      setIsImporting(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveCurrentAsTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTemplate: Preset = {
      id: crypto.randomUUID(),
      name: newTemplateName,
      icon: "📌",
      description: `${activities.length} custom tasks`,
      activities: activities.map(a => ({
        name: a.name,
        duration: a.duration,
        color: a.color
      }))
    };
    setCustomTemplates(prev => [newTemplate, ...prev]);
    setIsSavingTemplate(false);
    setNewTemplateName("");
  };

  const deleteCustomTemplate = (id: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const _activities = [...activities];
    const draggedItemContent = _activities.splice(dragItem.current, 1)[0];
    _activities.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setActivities(_activities);
  };

  useEffect(() => {
    if ('mediaSession' in navigator && mode === AppMode.RUNNING) {
      const current = activities[currentIndex];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current?.name || 'Focus Session',
        artist: `${Math.floor((current?.remainingSeconds || 0) / 60)}m remaining`,
        album: 'myTimer.io',
        artwork: [{ src: 'https://picsum.photos/512', sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.playbackState = isRunning ? 'playing' : 'paused';
    }
  }, [currentIndex, activities, isRunning, mode]);

  const currentActivity = activities[currentIndex];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const loadPreset = (preset: Preset) => {
    setActivities(preset.activities.map(a => ({
      id: crypto.randomUUID(),
      ...a,
      completed: false,
      remainingSeconds: a.duration * 60
    })));
    setMode(AppMode.PLANNING);
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 print:bg-white print:text-black">
        
        <nav role="navigation" className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 dark:shadow-none shadow-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">myTimer.io</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:ring-2 focus:ring-indigo-500 outline-none"
              aria-label="Open Settings"
            >
              <Settings2 className="w-5 h-5 text-slate-500" />
            </button>
            <button 
              onClick={() => setMode(AppMode.PLANNING)}
              className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${mode === AppMode.PLANNING ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Planner
            </button>
            <button 
              onClick={() => activities.length > 0 && setMode(AppMode.RUNNING)}
              className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${mode === AppMode.RUNNING ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-800'} ${activities.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={activities.length === 0}
            >
              Timer
            </button>
          </div>
        </nav>

        {deleteConfirmation && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setDeleteConfirmation(null)} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[2rem] shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete {Array.isArray(deleteConfirmation) ? 'activities' : 'activity'}?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                  Are you sure you want to delete {Array.isArray(deleteConfirmation) ? `${deleteConfirmation.length} tasks` : 'this activity'}? This cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => setDeleteConfirmation(null)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => deleteActivities(deleteConfirmation)}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-100 dark:shadow-none"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isSavingTemplate && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSavingTemplate(false)} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-sm:w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-600" />
                Save as Template
              </h3>
              <p className="text-sm text-slate-500 mb-6">Give your current sequence a name to reuse it later.</p>
              <input 
                autoFocus
                type="text"
                placeholder="Morning Routine, Study Set..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCurrentAsTemplate()}
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsSavingTemplate(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveCurrentAsTemplate}
                  disabled={!newTemplateName.trim()}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Save Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 print:hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-2xl font-extrabold flex items-center gap-3">
                  <Settings2 className="w-6 h-6 text-indigo-600" />
                  Configurations
                </h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto">
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    Audio & Alerts
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="sound-select" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Alert Sound</label>
                      <div className="flex items-center gap-3">
                        <select 
                          id="sound-select"
                          value={selectedSound}
                          onChange={(e) => handleSoundChange(e.target.value as keyof typeof AUDIO_URLS)}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {Object.keys(AUDIO_URLS).map(key => (
                            <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)} Tone</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => playAudioWithLimit(2000)}
                          className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          <PlayCircle className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label htmlFor="volume-control" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                        Volume
                        <span className="text-xs font-mono text-indigo-500">{Math.round(volume * 100)}%</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5 text-slate-400" />
                        <input 
                          id="volume-control"
                          type="range" min="0" max="1" step="0.05" 
                          value={volume} 
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          onMouseUp={() => playAudioWithLimit(1500)}
                          className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Hourglass className="w-4 h-4" />
                    Session Logic
                  </h3>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="break-dur" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Default Break Duration</label>
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center px-4 py-2.5 flex-1">
                          <input 
                            id="break-dur"
                            type="number" 
                            value={defaultBreakDuration}
                            onChange={(e) => setDefaultBreakDuration(Math.max(1, parseInt(e.target.value) || 1))}
                            className="bg-transparent w-full text-sm font-bold outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400">MIN</span>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                          <Coffee className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm task deletion</span>
                        <span className="text-[10px] text-slate-500">Ask for confirmation before removing activities.</span>
                      </div>
                      <button 
                        onClick={() => setConfirmBeforeDelete(!confirmBeforeDelete)}
                        className={`p-1 transition-colors ${confirmBeforeDelete ? 'text-indigo-600' : 'text-slate-300'}`}
                      >
                        {confirmBeforeDelete ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Appearance
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        {isDarkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                        Dark Mode
                      </span>
                      <span className="text-[10px] text-slate-500">Toggle high-contrast dark theme.</span>
                    </div>
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className={`p-1 transition-all transform active:scale-95 ${isDarkMode ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      {isDarkMode ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                    </button>
                  </div>
                </section>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.99]"
                >
                  SAVE CONFIGURATIONS
                </button>
              </div>
            </div>
          </div>
        )}

        <main role="main" className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:p-0">
          
          <div className="lg:col-span-7 flex flex-col gap-6 print:mb-8">
            <section aria-labelledby="visualizer-heading" className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col items-center print:shadow-none print:border-none">
              <div className="w-full text-center mb-6">
                {mode === AppMode.RUNNING ? (
                  <>
                    <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full mb-2 uppercase tracking-widest print:hidden">
                      Live Session
                    </span>
                    <h2 id="visualizer-heading" className="text-3xl font-extrabold text-slate-800 dark:text-white truncate max-w-full print:text-indigo-600">
                      {currentActivity?.name || 'Session Complete'}
                    </h2>
                  </>
                ) : (
                  <>
                    <h2 id="visualizer-heading" className="text-3xl font-extrabold text-slate-800 dark:text-white print:text-indigo-600">
                      Focus Session Map
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 print:text-black">
                      Visualized schedule for current activities.
                    </p>
                  </>
                )}
              </div>

              <VisualTimer 
                activities={activities} 
                currentIndex={currentIndex} 
                isRunning={isRunning}
                now={now}
              />

              {mode === AppMode.RUNNING && (
                <div className="mt-8 flex flex-col items-center print:hidden">
                  <div 
                    aria-live="polite" 
                    className="mono text-6xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums"
                  >
                    {formatTime(currentActivity?.remainingSeconds || 0)}
                  </div>
                  
                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={toggleTimer}
                      className={`p-5 rounded-3xl transition-all shadow-xl active:scale-95 focus:ring-4 focus:ring-indigo-500/50 outline-none ${isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      aria-label={isRunning ? "Pause Session" : "Resume Session"}
                    >
                      {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                    </button>
                    <button 
                      onClick={handleSkip}
                      className="p-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-3xl transition-all active:scale-95 focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                    >
                      <SkipForward className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                    </button>
                    <button 
                      onClick={resetSession}
                      className="p-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-3xl transition-all active:scale-95 focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-700 outline-none"
                    >
                      <RotateCcw className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>
                </div>
              )}

              {mode === AppMode.PLANNING && (
                <button 
                  onClick={startSession}
                  disabled={activities.length === 0}
                  className="mt-8 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center gap-2 group focus:ring-4 focus:ring-indigo-500 outline-none print:hidden"
                >
                  <Play className="w-5 h-5 fill-current" />
                  START FOCUS SESSION
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </section>

            <section aria-label="Session Totals" className="grid grid-cols-1 md:grid-cols-3 gap-4 print:flex print:justify-between print:gap-2">
              <StatsCard label="Tasks" value={activities.length} icon={<LayoutGrid className="w-5 h-5 text-indigo-600" />} colorClass="bg-indigo-50 dark:bg-indigo-950/50" />
              <StatsCard label="Duration" value={`${activities.reduce((a, b) => a + b.duration, 0)}m`} icon={<Clock className="w-5 h-5 text-emerald-600" />} colorClass="bg-emerald-50 dark:bg-emerald-950/50" />
              <StatsCard label="Progress" value={`${activities.filter(a => a.completed).length}/${activities.length}`} icon={<CheckCircle className="w-5 h-5 text-amber-600" />} colorClass="bg-amber-50 dark:bg-amber-950/50" />
            </section>

            <section aria-labelledby="insights-heading" className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-900 rounded-3xl p-6 border border-indigo-100 dark:border-slate-800 shadow-sm relative overflow-hidden group print:hidden">
              <div className="absolute top-0 right-0 p-4 text-indigo-200 dark:text-indigo-900 transition-transform group-hover:scale-110" aria-hidden="true">
                <Brain className="w-16 h-16 opacity-20" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <h3 id="insights-heading" className="font-bold text-indigo-900 dark:text-indigo-300 uppercase text-xs tracking-wider">Coach Insights</h3>
              </div>
              <div aria-live="polite" className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-line min-h-[4rem]">
                {insights || "Checking your tasks..."}
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6 print:block">
            <section aria-labelledby="presets-heading" className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm print:hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 id="presets-heading" className="font-bold text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  Quick Presets
                </h3>
              </div>
              
              <div className="space-y-4">
                {customTemplates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">My Reusable Plans</p>
                    <div className="grid grid-cols-1 gap-2">
                      {customTemplates.map((template) => (
                        <div key={template.id} className="group relative">
                          <button
                            onClick={() => loadPreset(template)}
                            className="w-full flex items-center gap-3 p-3 text-left bg-indigo-50/30 dark:bg-indigo-950/10 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl transition-all outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <span className="text-xl">{template.icon}</span>
                            <div className="flex-1">
                              <div className="font-bold text-slate-800 dark:text-white text-sm">{template.name}</div>
                              <div className="text-[10px] text-slate-500">{template.description}</div>
                            </div>
                          </button>
                          <button 
                            onClick={() => template.id && deleteCustomTemplate(template.id)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Standard Setups</p>
                  <div className="grid grid-cols-1 gap-2">
                    {PRESET_TEMPLATES.map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => loadPreset(preset)}
                        className="flex items-center gap-3 p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl transition-all focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <span className="text-xl">{preset.icon}</span>
                        <div className="flex-1">
                          <div className="font-bold text-slate-800 dark:text-white text-sm">{preset.name}</div>
                          <div className="text-[10px] text-slate-500">{preset.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="planner-heading" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex-1 flex flex-col relative overflow-hidden print:shadow-none print:border-t print:mt-8">
              {isImporting && (
                <div role="alert" className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 space-y-6">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-extrabold text-xl text-slate-800 dark:text-white tracking-tight">Processing Planner</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">{importStatus}</p>
                  </div>
                </div>
              )}

              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 print:static print:border-none">
                <div className="flex items-center gap-3">
                  {activities.length > 0 && (
                    <button 
                      onClick={toggleSelectAll}
                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Select/Deselect All"
                    >
                      {selectedIds.size === activities.length ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  )}
                  <h3 id="planner-heading" className="font-bold text-lg print:text-xl">Planner</h3>
                </div>
                
                <div className="flex gap-2 print:hidden">
                  {selectedIds.size > 0 && (
                    <button 
                      onClick={() => requestDelete(Array.from(selectedIds))}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                      title="Delete Selected"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={addBreak} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-100 transition-all active:scale-95">
                    <Coffee className="w-4 h-4" /> + BREAK
                  </button>
                  <button onClick={addActivity} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 max-h-[400px] print:max-h-none print:overflow-visible">
                {activities.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-center px-6">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
                      <LayoutGrid className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="font-medium text-slate-500 dark:text-slate-400">Empty Planner</p>
                    <p className="text-xs mt-1">Add activities or use the Import button.</p>
                  </div>
                ) : (
                  <div className="space-y-3" role="list">
                    {activities.map((activity, index) => (
                      <div 
                        key={activity.id}
                        role="listitem"
                        draggable={mode === AppMode.PLANNING}
                        onDragStart={() => (dragItem.current = index)}
                        onDragEnter={() => (dragOverItem.current = index)}
                        onDragEnd={handleSort}
                        onDragOver={(e) => e.preventDefault()}
                        className={`group relative flex items-start gap-3 p-4 rounded-2xl border transition-all ${selectedIds.has(activity.id) ? 'border-indigo-500 bg-indigo-50/30' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'} ${activity.completed ? 'grayscale opacity-50' : ''}`}
                      >
                        <button 
                          onClick={() => toggleSelect(activity.id)}
                          className="mt-1 text-slate-300 hover:text-indigo-600 transition-colors"
                        >
                          {selectedIds.has(activity.id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                        </button>

                        <div className="flex-1 flex flex-col gap-2 relative">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activity.color }} />
                            <input 
                              className="w-full bg-transparent font-bold focus:outline-none focus:text-indigo-600 text-sm transition-colors"
                              value={activity.name}
                              onChange={(e) => updateActivity(activity.id, { name: e.target.value })}
                              placeholder="Activity name..."
                            />
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              <Clock className="w-3 h-3" />
                              <input 
                                type="number"
                                className="w-8 bg-transparent focus:outline-none text-center"
                                value={activity.duration}
                                onChange={(e) => updateActivity(activity.id, { duration: parseInt(e.target.value) || 0 })}
                              />
                              min
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => requestDelete(activity.id)}
                          className="text-slate-200 group-hover:text-red-400 p-1 transition-colors active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 print:hidden">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" id="import-file-input" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-xs font-extrabold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                  disabled={isImporting}
                >
                  <Upload className="w-4 h-4" /> IMPORT DOCUMENT
                </button>
                <button onClick={() => setIsSavingTemplate(true)} disabled={activities.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/20 transition-all outline-none active:scale-[0.98]">
                  <Save className="w-3.5 h-3.5" /> SAVE AS REUSABLE TEMPLATE
                </button>
              </div>
            </section>
          </div>
        </main>
        
        <audio ref={audioRef} src={AUDIO_URLS[selectedSound]} preload="auto" aria-hidden="true" />
      </div>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @media print {
          body { background-color: white !important; color: black !important; }
          nav, .print\\:hidden { display: none !important; }
          main { display: block !important; margin: 0 !important; padding: 0 !important; }
          .lg\\:col-span-7, .lg\\:col-span-5 { width: 100% !important; display: block !important; }
          section { box-shadow: none !important; border: none !important; margin-bottom: 20px !important; }
        }
      `}</style>
    </div>
  );
};

export default App;