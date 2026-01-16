import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'theme_mode';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemColorScheme = useColorScheme() as ColorScheme;
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const loadThemeMode = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setThemeMode(stored as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  }, []);

  useEffect(() => {
    loadThemeMode();
  }, [loadThemeMode]);

  const changeThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const activeColorScheme: ColorScheme = useMemo(() => {
    if (themeMode === 'auto') {
      return systemColorScheme || 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const isDark = activeColorScheme === 'dark';

  const colors = useMemo(() => ({
    primary: isDark ? '#FF9F3E' : '#2D6A4F',
    primaryLight: isDark ? '#1F2937' : '#E8F5F1',
    background: isDark ? '#0F1419' : '#FAFAFA',
    card: isDark ? '#1F2937' : '#fff',
    text: isDark ? '#F5F5F5' : '#000000',
    textSecondary: isDark ? '#B0B0B0' : '#666',
    textTertiary: isDark ? '#808080' : '#999',
    border: isDark ? '#374151' : '#f0f0f0',
    borderSecondary: isDark ? '#4B5563' : '#E0E0E0',
    input: isDark ? '#1F2937' : '#F5F5F5',
    tag: isDark ? '#374151' : '#F5F5F5',
    tagText: isDark ? '#D1D5DB' : '#555',
    error: '#FF4444',
    star: '#FFB800',
    starBg: isDark ? '#2A2400' : '#FFF9E6',
    overlay: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.5)',
    shadow: isDark ? '#000' : '#000',
    accent: isDark ? '#FF9F3E' : '#2D6A4F',
    accentLight: isDark ? '#FF9F3E33' : '#E8F5F1',
    icon: isDark ? '#F5F5F5' : '#000000',
  }), [isDark]);

  return useMemo(() => ({
    themeMode,
    changeThemeMode,
    colorScheme: activeColorScheme,
    isDark,
    colors,
  }), [themeMode, changeThemeMode, activeColorScheme, isDark, colors]);
});
