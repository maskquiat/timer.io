
import { Preset } from './types';

export const COLORS = [
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f97316', // Orange
];

export const PRESET_TEMPLATES: Preset[] = [
  {
    name: "Morning Routine",
    icon: "🌅",
    description: "Structure for a smooth start to the day.",
    activities: [
      { name: "Wake & Stretch", duration: 5, color: '#10b981' },
      { name: "Getting Ready", duration: 15, color: '#6366f1' },
      { name: "Healthy Breakfast", duration: 20, color: '#f59e0b' },
      { name: "Pack Bag", duration: 10, color: '#f97316' }
    ]
  },
  {
    name: "Study Session (Pomodoro)",
    icon: "📚",
    description: "Optimized deep work cycles with restorative breaks.",
    activities: [
      { name: "Deep Work Sprint", duration: 25, color: '#ef4444' },
      { name: "Short Break", duration: 5, color: '#10b981' },
      { name: "Review & Polish", duration: 25, color: '#ef4444' },
      { name: "Wrap Up", duration: 10, color: '#8b5cf6' }
    ]
  },
  {
    name: "Classroom Transition",
    icon: "🏫",
    description: "Clear expectations for moving between lessons.",
    activities: [
      { name: "Clean Up Station", duration: 3, color: '#f59e0b' },
      { name: "Gather on Carpet", duration: 2, color: '#6366f1' },
      { name: "Ready for Lesson", duration: 5, color: '#10b981' }
    ]
  }
];

export const AUDIO_URLS = {
  chime: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
  bell: 'https://actions.google.com/sounds/v1/alarms/medium_bell_ringing_near.ogg',
  alert: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
};
