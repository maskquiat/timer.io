
export interface Activity {
  id: string;
  name: string;
  duration: number; // in minutes
  color: string;
  completed: boolean;
  remainingSeconds: number;
}

export interface SessionStats {
  totalPlannedMinutes: number;
  completedActivities: number;
  efficiencyScore: number;
}

export enum AppMode {
  PLANNING = 'PLANNING',
  RUNNING = 'RUNNING',
  SUMMARY = 'SUMMARY'
}

export interface Preset {
  id?: string;
  name: string;
  icon: string;
  description: string;
  activities: Omit<Activity, 'id' | 'completed' | 'remainingSeconds'>[];
}
