"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Types
type Habit = {
  id: string;
  name: string;
  icon: string;
  unit: string;
  goal: number;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: string[];
  color: string;
  streak: number;
  level: 'Novice' | 'Regular' | 'Pro' | 'Master';
  progress: number;
  logs: HabitLog[];
  badges: Badge[];
  created: Date;
  lastUpdated: Date;
  reminder?: Reminder;
};

type HabitLog = {
  id: string;
  date: Date;
  value: number;
  notes?: string;
  completed: boolean;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  acquired: Date;
};

type Reminder = {
  id: string;
  time: string;
  days: string[];
  enabled: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinDate: Date;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    weekStart: 'monday' | 'sunday';
  };
};

// Dummy data for the app
const defaultHabits: Habit[] = [
  {
    id: '1',
    name: 'Water Intake',
    icon: '💧',
    unit: 'glasses',
    goal: 8,
    frequency: 'daily',
    color: '#3B82F6',
    streak: 5,
    level: 'Pro',
    progress: 0,
    logs: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        id: `water-${i}`,
        date,
        value: Math.floor(Math.random() * 9) + 1,
        completed: Math.random() > 0.2,
      };
    }),
    badges: [
      {
        id: 'hydration-1',
        name: 'Hydration Hero',
        description: 'Drink 8 glasses of water for 7 days in a row',
        icon: '🏆',
        acquired: new Date('2025-04-27'),
      },
    ],
    created: new Date('2025-01-15'),
    lastUpdated: new Date(),
    reminder: {
      id: 'water-reminder',
      time: '10:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      enabled: true,
    },
  },
  {
    id: '2',
    name: 'Sleep',
    icon: '😴',
    unit: 'hours',
    goal: 8,
    frequency: 'daily',
    color: '#8B5CF6',
    streak: 3,
    level: 'Regular',
    progress: 0,
    logs: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        id: `sleep-${i}`,
        date,
        value: Math.floor(Math.random() * 4) + 5,
        completed: Math.random() > 0.3,
      };
    }),
    badges: [],
    created: new Date('2025-02-10'),
    lastUpdated: new Date(),
  },
  {
    id: '3',
    name: 'Screen Time',
    icon: '📱',
    unit: 'hours',
    goal: 3,
    frequency: 'daily',
    color: '#EC4899',
    streak: 0,
    level: 'Novice',
    progress: 0,
    logs: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        id: `screen-${i}`,
        date,
        value: Math.floor(Math.random() * 6) + 2,
        completed: Math.random() > 0.5,
      };
    }),
    badges: [],
    created: new Date('2025-03-01'),
    lastUpdated: new Date(),
  },
  {
    id: '4',
    name: 'Meditation',
    icon: '🧘',
    unit: 'minutes',
    goal: 15,
    frequency: 'daily',
    color: '#10B981',
    streak: 10,
    level: 'Master',
    progress: 0,
    logs: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        id: `meditation-${i}`,
        date,
        value: Math.floor(Math.random() * 20) + 5,
        completed: Math.random() > 0.1,
      };
    }),
    badges: [
      {
        id: 'zen-1',
        name: 'Zen Master',
        description: 'Meditate for 10 days in a row',
        icon: '🏆',
        acquired: new Date('2025-04-30'),
      },
    ],
    created: new Date('2025-02-20'),
    lastUpdated: new Date(),
    reminder: {
      id: 'meditation-reminder',
      time: '07:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      enabled: true,
    },
  },
];

const defaultUser: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  joinDate: new Date('2025-01-01'),
  preferences: {
    theme: 'light',
    notifications: true,
    weekStart: 'monday',
  },
};

// Helper functions
const getLastDays = (days: number): string[] => {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    result.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  return result;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const calculateLevel = (streak: number): 'Novice' | 'Regular' | 'Pro' | 'Master' => {
  if (streak < 3) return 'Novice';
  if (streak < 7) return 'Regular';
  if (streak < 14) return 'Pro';
  return 'Master';
};

// Main component
export default function HabitTracker() {
  // State
  const [user, setUser] = useState<User>(defaultUser);
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'habits' | 'analytics' | 'settings'>('dashboard');
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInHabit, setCheckInHabit] = useState<Habit | null>(null);
  const [checkInValue, setCheckInValue] = useState<number>(0);
  const [period, setPeriod] = useState<'7days' | '30days'>('7days');
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'info' | 'warning'}[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Refs
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effects
  useEffect(() => {
    // Load data from localStorage if available
    const savedHabits = localStorage.getItem('habits');
    const savedUser = localStorage.getItem('user');
    
    if (savedHabits) {
      try {
        const parsedHabits = JSON.parse(savedHabits);
        // Convert date strings back to Date objects
        parsedHabits.forEach((habit: Habit) => {
          habit.created = new Date(habit.created);
          habit.lastUpdated = new Date(habit.lastUpdated);
          habit.logs.forEach(log => {
            log.date = new Date(log.date);
          });
          habit.badges.forEach(badge => {
            badge.acquired = new Date(badge.acquired);
          });
        });
        setHabits(parsedHabits);
      } catch (error) {
        console.error('Error parsing saved habits:', error);
      }
    }
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        parsedUser.joinDate = new Date(parsedUser.joinDate);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    }

    // Add example notification
    addNotification({
      id: 'welcome',
      message: 'Welcome back! You have 2 habits to check-in today.',
      type: 'info'
    });
  }, []);

  useEffect(() => {
    // Apply theme preference
    document.documentElement.classList.toggle('dark', user.preferences.theme === 'dark');
  }, [user.preferences.theme]);

  // Save data to localStorage whenever habits or user changes
  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  // Notification handler
  const addNotification = (notification: {id: string, message: string, type: 'success' | 'info' | 'warning'}) => {
    setNotifications(prev => [...prev, notification]);
    
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    notificationTimeoutRef.current = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Habit management functions
  const handleCreateHabit = (newHabit: Omit<Habit, 'id' | 'created' | 'lastUpdated' | 'logs' | 'badges' | 'streak' | 'level' | 'progress'>) => {
    const habit: Habit = {
      ...newHabit,
      id: `habit-${Date.now()}`,
      created: new Date(),
      lastUpdated: new Date(),
      logs: [],
      badges: [],
      streak: 0,
      level: 'Novice',
      progress: 0,
    };
    
    setHabits(prev => [...prev, habit]);
    setIsAddHabitModalOpen(false);
    addNotification({
      id: `habit-created-${habit.id}`,
      message: `Habit "${habit.name}" created successfully!`,
      type: 'success'
    });
  };

  const handleCheckIn = (habitId: string, value: number, notes?: string) => {
    setHabits(prev => 
      prev.map(habit => {
        if (habit.id === habitId) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Check if there's already a log for today
          const todayLogIndex = habit.logs.findIndex(log => {
            const logDate = new Date(log.date);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === today.getTime();
          });
          
          const newLogs = [...habit.logs];
          const completed = habit.frequency === 'daily' && value >= habit.goal;
          
          if (todayLogIndex >= 0) {
            // Update existing log
            newLogs[todayLogIndex] = {
              ...newLogs[todayLogIndex],
              value,
              notes,
              completed
            };
          } else {
            // Add new log
            newLogs.push({
              id: `${habitId}-log-${Date.now()}`,
              date: today,
              value,
              notes,
              completed
            });
          }
          
          // Calculate new streak
          let newStreak = habit.streak;
          
          if (completed) {
            newStreak += 1;
            
            // Check if we've earned a new badge
            const newBadges = [...habit.badges];
            
            if (newStreak === 7 && !habit.badges.some(b => b.name === 'Week Warrior')) {
              newBadges.push({
                id: `${habitId}-badge-${Date.now()}`,
                name: 'Week Warrior',
                description: '7-day streak achieved!',
                icon: '🔥',
                acquired: new Date()
              });
              
              addNotification({
                id: `badge-earned-${habitId}`,
                message: `Congratulations! You earned the "Week Warrior" badge for ${habit.name}!`,
                type: 'success'
              });
            }
            
            return {
              ...habit,
              logs: newLogs,
              streak: newStreak,
              badges: newBadges,
              level: calculateLevel(newStreak),
              lastUpdated: new Date()
            };
          } else {
            // Streak is broken
            return {
              ...habit,
              logs: newLogs,
              streak: 0,
              level: 'Novice',
              lastUpdated: new Date()
            };
          }
        }
        return habit;
      })
    );
    
    setIsCheckInModalOpen(false);
    setCheckInHabit(null);
    addNotification({
      id: `checkin-${habitId}`,
      message: `Check-in recorded successfully!`,
      type: 'success'
    });
  };

  const deleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setSelectedHabit(null);
    addNotification({
      id: `habit-deleted-${habitId}`,
      message: `Habit deleted successfully.`,
      type: 'info'
    });
  };

  // Theme toggler
  const toggleTheme = () => {
    setUser(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        theme: prev.preferences.theme === 'light' ? 'dark' : 'light'
      }
    }));
  };

  // Data for analytics
  const getChartData = (habitId: string, days: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return [];
    
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const log = habit.logs.find(l => {
        const logDate = new Date(l.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === date.getTime();
      });
      
      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: log ? log.value : 0,
        goal: habit.goal
      });
    }
    
    return data;
  };

  const getTotalCheckIns = () => {
    return habits.reduce((total, habit) => total + habit.logs.length, 0);
  };

  const getCompletionRate = () => {
    const totalLogs = habits.reduce((total, habit) => total + habit.logs.length, 0);
    const completedLogs = habits.reduce((total, habit) => total + habit.logs.filter(log => log.completed).length, 0);
    return totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;
  };

  const getLongestStreak = () => {
    return Math.max(...habits.map(habit => habit.streak), 0);
  };

  const generateInsights = () => {
    const insights = [];
    
    // Check overall completion rate
    const completionRate = getCompletionRate();
    if (completionRate >= 80) {
      insights.push("You're doing great! You've completed over 80% of your habit check-ins.");
    } else if (completionRate < 50) {
      insights.push("You're struggling a bit with consistency. Try focusing on fewer habits.");
    }
    
    // Check individual habits
    habits.forEach(habit => {
      const recentLogs = habit.logs
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7);
      
      if (recentLogs.length > 0) {
        const completedRecentLogs = recentLogs.filter(log => log.completed);
        const recentCompletionRate = (completedRecentLogs.length / recentLogs.length) * 100;
        
        if (recentLogs.length >= 5 && recentCompletionRate === 100) {
          insights.push(`Great job maintaining your "${habit.name}" streak!`);
        } else if (recentLogs.length >= 3 && recentCompletionRate < 30) {
          insights.push(`You're struggling with "${habit.name}". Consider adjusting your goal to make it more achievable.`);
        }
      }
    });
    
    // Suggest improvements
    if (habits.length < 3) {
      insights.push("Try adding more habits to track for a more comprehensive view of your wellbeing.");
    }
    
    return insights.length > 0 ? insights : ["Keep tracking your habits consistently to see insights here."];
  };

  // Component rendering
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100">
      {/* Navigation */}
      <nav className="fixed left-0 top-0 z-10 w-full border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
              className="mr-2 text-2xl"
            >
              ⚡
            </motion.div>
            <h1 className="text-xl font-bold">HabitTrack</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`mx-2 rounded-md px-3 py-2 font-medium transition ${activeTab === 'dashboard' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('habits')}
              className={`mx-2 rounded-md px-3 py-2 font-medium transition ${activeTab === 'habits' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              My Habits
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`mx-2 rounded-md px-3 py-2 font-medium transition ${activeTab === 'analytics' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              Analytics
            </button>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={toggleTheme}
              className="mr-4 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {user.preferences.theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="mr-4 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Settings"
            >
              ⚙️
            </button>
            
            <div className="relative">
              <img 
                src={user.avatar} 
                alt="User avatar" 
                className="h-8 w-8 cursor-pointer rounded-full object-cover"
              />
            </div>
            
            {/* Mobile menu button */}
            <button 
              className="ml-4 rounded-md p-2 md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? '✕' : '☰'}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:hidden"
            >
              <div className="flex flex-col px-4 py-2">
                <button 
                  onClick={() => {
                    setActiveTab('dashboard');
                    setShowMobileMenu(false);
                  }}
                  className={`my-1 rounded-md px-3 py-2 text-left font-medium transition ${activeTab === 'dashboard' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('habits');
                    setShowMobileMenu(false);
                  }}
                  className={`my-1 rounded-md px-3 py-2 text-left font-medium transition ${activeTab === 'habits' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  My Habits
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('analytics');
                    setShowMobileMenu(false);
                  }}
                  className={`my-1 rounded-md px-3 py-2 text-left font-medium transition ${activeTab === 'analytics' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Analytics
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pt-20 pb-16">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddHabitModalOpen(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:bg-indigo-700"
              >
                + Add New Habit
              </motion.button>
            </div>
            
            {/* Stats overview */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div 
                whileHover={{ y: -5 }}
                className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
              >
                <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Total Habits</div>
                <div className="flex items-baseline">
                  <div className="text-3xl font-semibold">{habits.length}</div>
                  <div className="ml-2 text-sm text-green-600 dark:text-green-400">Active</div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
              >
                <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</div>
                <div className="flex items-baseline">
                  <div className="text-3xl font-semibold">{getCompletionRate()}%</div>
                  <div className="ml-2 text-sm text-gray-600 dark:text-gray-400">All time</div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
              >
                <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Longest Streak</div>
                <div className="flex items-baseline">
                  <div className="text-3xl font-semibold">{getLongestStreak()}</div>
                  <div className="ml-2 text-sm text-gray-600 dark:text-gray-400">Days</div>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
              >
                <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Total Check-ins</div>
                <div className="flex items-baseline">
                  <div className="text-3xl font-semibold">{getTotalCheckIns()}</div>
                  <div className="ml-2 text-sm text-gray-600 dark:text-gray-400">Logs</div>
                </div>
              </motion.div>
            </div>
            
            {/* Today's habits */}
            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold">Today&apos;s Habits</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {habits.map(habit => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const todayLog = habit.logs.find(log => {
                    const logDate = new Date(log.date);
                    logDate.setHours(0, 0, 0, 0);
                    return logDate.getTime() === today.getTime();
                  });
                  
                  const progress = todayLog ? (todayLog.value / habit.goal) * 100 : 0;
                  
                  return (
                    <motion.div
                      key={habit.id}
                      whileHover={{ y: -5 }}
                      className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-2 text-2xl">{habit.icon}</span>
                          <h4 className="font-medium">{habit.name}</h4>
                        </div>
                        <div className="flex items-center">
                          <span className={`mr-2 text-sm ${todayLog && todayLog.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            {todayLog ? `${todayLog.value}/${habit.goal} ${habit.unit}` : `0/${habit.goal} ${habit.unit}`}
                          </span>
                          {todayLog && todayLog.completed ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✓ Done
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4 mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <div>
                          <span className="mr-2 text-xs font-medium text-gray-500 dark:text-gray-400">Streak:</span>
                          <span className="text-sm font-medium">{habit.streak} days 🔥</span>
                        </div>
                        
                        {!todayLog || !todayLog.completed ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCheckInHabit(habit);
                              setCheckInValue(todayLog?.value || 0);
                              setIsCheckInModalOpen(true);
                            }}
                            className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            Check In
                          </motion.button>
                        ) : (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            ✓ Completed today
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            {/* Smart Insights */}
            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold">Smart Insights</h3>
              <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                <ul className="space-y-3">
                  {generateInsights().map((insight, index) => (
                    <motion.li 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start"
                    >
                      <span className="mr-2 mt-1 text-indigo-600 dark:text-indigo-400">💡</span>
                      <span>{insight}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Weekly Overview */}
            <div>
              <h3 className="mb-4 text-xl font-semibold">Weekly Overview</h3>
              <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={getLastDays(7).map(day => {
                      const dayCompletionCount = habits.reduce((count, habit) => {
                        const dayDate = new Date();
                        const dayIndex = getLastDays(7).indexOf(day);
                        dayDate.setDate(dayDate.getDate() - (6 - dayIndex));
                        dayDate.setHours(0, 0, 0, 0);
                        
                        const log = habit.logs.find(l => {
                          const logDate = new Date(l.date);
                          logDate.setHours(0, 0, 0, 0);
                          return logDate.getTime() === dayDate.getTime() && l.completed;
                        });
                        
                        return log ? count + 1 : count;
                      }, 0);
                      
                      return {
                        day,
                        completed: dayCompletionCount,
                        total: habits.length
                      };
                    })}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="#6366F1" name="Completed" />
                    <Bar dataKey="total" stackId="a" fill="#E5E7EB" name="Total Habits" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        {/* Habits Tab */}
        {activeTab === 'habits' && (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Habits</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddHabitModalOpen(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:bg-indigo-700"
              >
                + Add New Habit
              </motion.button>
            </div>
            
            {habits.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-800">
                <div className="mb-4 text-5xl">🏆</div>
                <h3 className="mb-2 text-xl font-semibold">No habits added yet</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">Start tracking your first habit today!</p>
                <button
                  onClick={() => setIsAddHabitModalOpen(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-md transition hover:bg-indigo-700"
                >
                  + Add New Habit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {habits.map(habit => (
                  <motion.div
                    key={habit.id}
                    whileHover={{ y: -5 }}
                    className="flex flex-col rounded-lg bg-white shadow-md dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                      <div className="flex items-center">
                        <span className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-2xl dark:bg-indigo-900">
                          {habit.icon}
                        </span>
                        <div>
                          <h3 className="font-semibold">{habit.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Goal: {habit.goal} {habit.unit} {habit.frequency === 'daily' ? 'daily' : habit.frequency === 'weekly' ? 'weekly' : 'custom'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedHabit(habit.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        •••
                      </button>
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-sm font-medium">Current streak</span>
                          <span className="flex items-center text-sm">
                            <span className="mr-1">{habit.streak} days</span>
                            <span className="text-lg">🔥</span>
                          </span>
                        </div>
                        
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-sm font-medium">Level</span>
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                            {habit.level}
                          </span>
                        </div>
                        
                        {habit.badges.length > 0 && (
                          <div className="mb-4">
                            <span className="mb-2 block text-sm font-medium">Badges</span>
                            <div className="flex flex-wrap gap-2">
                              {habit.badges.map(badge => (
                                <span 
                                  key={badge.id} 
                                  className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  title={badge.description}
                                >
                                  {badge.icon} {badge.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">Last 7 days</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {habit.logs.filter(log => {
                              const logDate = new Date(log.date);
                              const now = new Date();
                              const daysDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
                              return daysDiff <= 7 && log.completed;
                            }).length} / 7 days completed
                          </span>
                        </div>
                        
                        <div className="mb-4 flex">
                          {Array.from({ length: 7 }).map((_, index) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (6 - index));
                            date.setHours(0, 0, 0, 0);
                            
                            const log = habit.logs.find(l => {
                              const logDate = new Date(l.date);
                              logDate.setHours(0, 0, 0, 0);
                              return logDate.getTime() === date.getTime();
                            });
                            
                            return (
                              <div 
                                key={index} 
                                className="mr-1 flex flex-1 flex-col items-center"
                              >
                                <div 
                                  className={`h-8 w-8 rounded-full ${log?.completed ? 'bg-green-500 dark:bg-green-600' : (log ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-gray-200 dark:bg-gray-700')}`} 
                                  title={date.toLocaleDateString()}
                                >
                                  {log?.completed && <span className="flex h-full items-center justify-center text-xs text-white">✓</span>}
                                </div>
                                <span className="mt-1 text-xs">
                                  {date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setCheckInHabit(habit);
                          setCheckInValue(0);
                          setIsCheckInModalOpen(true);
                        }}
                        className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white shadow transition hover:bg-indigo-700"
                      >
                        Check In Today
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {/* Habit options dropdown */}
            {selectedHabit && (
              <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
                <div className="absolute right-4 top-20 w-48 rounded-md bg-white py-1 shadow-lg dark:bg-gray-800">
                  <button 
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => {
                      const habit = habits.find(h => h.id === selectedHabit);
                      if (habit) {
                        setCheckInHabit(habit);
                        setCheckInValue(0);
                        setIsCheckInModalOpen(true);
                        setSelectedHabit(null);
                      }
                    }}
                  >
                    Check In
                  </button>
                  <button 
                    className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                    onClick={() => {
                      if (selectedHabit) {
                        deleteHabit(selectedHabit);
                      }
                    }}
                  >
                    Delete Habit
                  </button>
                  <button 
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setSelectedHabit(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="mb-6 text-2xl font-bold">Analytics & Insights</h2>
            
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Performance Overview</h3>
                <div className="flex">
                  <button
                    onClick={() => setPeriod('7days')}
                    className={`rounded-l-md px-3 py-1.5 text-sm font-medium ${period === '7days' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                  >
                    Last Week
                  </button>
                  <button
                    onClick={() => setPeriod('30days')}
                    className={`rounded-r-md px-3 py-1.5 text-sm font-medium ${period === '30days' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                  >
                    Last Month
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                  <h4 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{getCompletionRate()}%</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Overall Success</p>
                    </div>
                    <div className="relative h-24 w-24">
                      <svg viewBox="0 0 36 36" className="h-24 w-24">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                          className="dark:stroke-gray-700"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#6366F1"
                          strokeWidth="3"
                          strokeDasharray={100}
                          strokeDashoffset={100 - getCompletionRate()}
                          transform="rotate(-90 18 18)"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {getCompletionRate()}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                  <h4 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Total Check-ins</h4>
                  <p className="text-3xl font-bold">{getTotalCheckIns()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">All time logs</p>
                </div>
                
                <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                  <h4 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Longest Streak</h4>
                  <div className="flex items-baseline">
                    <p className="text-3xl font-bold">{getLongestStreak()}</p>
                    <p className="ml-2 text-lg">🔥</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Consecutive days</p>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="mb-4 text-xl font-semibold">Habit Performance</h3>
              
              <div className="space-y-6">
                {habits.length === 0 ? (
                  <div className="rounded-lg bg-white p-6 text-center shadow-md dark:bg-gray-800">
                    <p>No habits to analyze yet. Start tracking habits to see analytics.</p>
                  </div>
                ) : (
                  habits.map(habit => (
                    <div key={habit.id} className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-3 text-2xl">{habit.icon}</span>
                          <h4 className="font-semibold">{habit.name}</h4>
                        </div>
                        <div>
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                            {habit.level}
                          </span>
                        </div>
                      </div>
                      
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                          data={getChartData(habit.id, period === '7days' ? 7 : 30)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#6366F1"
                            activeDot={{ r: 8 }}
                            name={`${habit.name} (${habit.unit})`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="goal" 
                            stroke="#9CA3AF" 
                            strokeDasharray="5 5" 
                            name="Goal" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Streak</p>
                          <p className="text-lg font-semibold">{habit.streak} days 🔥</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
                          <p className="text-lg font-semibold">
                            {habit.logs.length > 0
                              ? Math.round(
                                  (habit.logs.filter(log => log.completed).length / habit.logs.length) *
                                    100
                                )
                              : 0}
                            %
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Check-ins</p>
                          <p className="text-lg font-semibold">{habit.logs.length}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h3 className="mb-4 text-xl font-semibold">Smart Insights</h3>
              <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                <div className="space-y-4">
                  {generateInsights().map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/30"
                    >
                      <div className="flex">
                        <span className="mr-3 text-2xl">💡</span>
                        <p>{insight}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 HabitTrack - Personal Analytics
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={toggleTheme}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              {user.preferences.theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ⚙️
            </button>
          </div>
        </div>
      </footer>
      
      {/* Add Habit Modal */}
      <AnimatePresence>
        {isAddHabitModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add New Habit</h3>
                <button
                  onClick={() => setIsAddHabitModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  
                  const newHabit = {
                    name: formData.get('name') as string,
                    icon: formData.get('icon') as string,
                    unit: formData.get('unit') as string,
                    goal: Number(formData.get('goal')),
                    frequency: formData.get('frequency') as 'daily' | 'weekly' | 'custom',
                    color: formData.get('color') as string,
                  };
                  
                  handleCreateHabit(newHabit);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">Habit Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g., Drink Water, Read, Exercise"
                    className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Icon</label>
                    <select
                      name="icon"
                      required
                      className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700"
                    >
                      <option value="💧">💧 Water</option>
                      <option value="😴">😴 Sleep</option>
                      <option value="📱">📱 Screen Time</option>
                      <option value="🏃">🏃 Exercise</option>
                      <option value="📚">📚 Reading</option>
                      <option value="🧘">🧘 Meditation</option>
                      <option value="💊">💊 Medication</option>
                      <option value="🍎">🍎 Nutrition</option>
                      <option value="💪">💪 Strength</option>
                      <option value="🧠">🧠 Learning</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium">Color</label>
                    <select
                      name="color"
                      required
                      className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700"
                    >
                      <option value="#3B82F6">Blue</option>
                      <option value="#10B981">Green</option>
                      <option value="#F59E0B">Yellow</option>
                      <option value="#EF4444">Red</option>
                      <option value="#8B5CF6">Purple</option>
                      <option value="#EC4899">Pink</option>
                      <option value="#6366F1">Indigo</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Goal</label>
                    <input
                      name="goal"
                      type="number"
                      min="1"
                      required
                      placeholder="8"
                      className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-sm font-medium">Unit</label>
                    <input
                      name="unit"
                      type="text"
                      required
                      placeholder="glasses, hours, mins"
                      className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                  </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium">Frequency</label>
                  <select
                    name="frequency"
                    required
                    className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Days</option>
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddHabitModalOpen(false)}
                    className="mr-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                  >
                    Create Habit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Check-in Modal */}
      <AnimatePresence>
        {isCheckInModalOpen && checkInHabit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Check-in: {checkInHabit.name}</h3>
                <button
                  onClick={() => {
                    setIsCheckInModalOpen(false);
                    setCheckInHabit(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6 flex items-center justify-center rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/30">
                <span className="mr-3 text-4xl">{checkInHabit.icon}</span>
                <div>
                  <h4 className="font-medium">{checkInHabit.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Goal: {checkInHabit.goal} {checkInHabit.unit} per day
                  </p>
                </div>
              </div>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const value = Number(formData.get('value'));
                  const notes = formData.get('notes') as string;
                  
                  handleCheckIn(checkInHabit.id, value, notes);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    How many {checkInHabit.unit} today?
                  </label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      name="value"
                      min="0"
                      max={checkInHabit.goal * 2}
                      value={checkInValue}
                      onChange={(e) => setCheckInValue(Number(e.target.value))}
                      className="mr-4 w-full"
                    />
                    <span className="w-12 text-center text-lg font-semibold">{checkInValue}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>0</span>
                    <span className="text-indigo-600 dark:text-indigo-400">Goal: {checkInHabit.goal}</span>
                    <span>{checkInHabit.goal * 2}</span>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCheckInValue(Math.max(0, checkInValue - 1))}
                      className="rounded-full border border-gray-300 p-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      -
                    </button>
                    <div className="text-center">
                      <span className={`text-2xl font-bold ${
                        checkInValue >= checkInHabit.goal
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {checkInValue}
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">/ {checkInHabit.goal}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckInValue(checkInValue + 1)}
                      className="rounded-full border border-gray-300 p-2 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700"
                    placeholder="How did it go today?"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckInModalOpen(false);
                      setCheckInHabit(null);
                    }}
                    className="mr-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                  >
                    Save Check-in
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Settings</h3>
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium">Profile</h4>
                  <div className="flex items-center">
                    <img 
                      src={user.avatar} 
                      alt="User avatar" 
                      className="mr-4 h-16 w-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Member since {formatDate(user.joinDate)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-2 font-medium">Appearance</h4>
                  <div className="flex items-center justify-between">
                    <span>Dark Mode</span>
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        user.preferences.theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          user.preferences.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-2 font-medium">Notifications</h4>
                  <div className="flex items-center justify-between">
                    <span>Enable Reminders</span>
                    <button
                      onClick={() => {
                        setUser(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: !prev.preferences.notifications
                          }
                        }));
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        user.preferences.notifications ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          user.preferences.notifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-2 font-medium">Calendar Settings</h4>
                  <div className="flex items-center justify-between">
                    <span>Week Starts On</span>
                    <select
                      value={user.preferences.weekStart}
                      onChange={(e) => {
                        setUser(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            weekStart: e.target.value as 'monday' | 'sunday'
                          }
                        }));
                      }}
                      className="rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
                    >
                      <option value="monday">Monday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <h4 className="mb-2 font-medium">Data Management</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        // Export data as JSON
                        const data = {
                          user,
                          habits
                        };
                        
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `habittrack_export_${new Date().toISOString().slice(0, 10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        addNotification({
                          id: 'export-data',
                          message: 'Data exported successfully!',
                          type: 'success'
                        });
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    >
                      Export Data
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to reset all habits? This action cannot be undone.')) {
                          setHabits([]);
                          setIsSettingsModalOpen(false);
                          addNotification({
                            id: 'reset-data',
                            message: 'All habits have been reset.',
                            type: 'info'
                          });
                        }
                      }}
                      className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      Reset All Habits
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Notifications */}
      <div className="fixed right-4 top-20 z-30 w-96 max-w-full space-y-2">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`rounded-lg p-4 shadow-lg ${
                notification.type === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : notification.type === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}
            >
              <div className="flex">
                <div className="mr-3 flex-shrink-0">
                  {notification.type === 'success' ? '✅' : notification.type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div>
                  <p>{notification.message}</p>
                </div>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="ml-auto flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}