import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { logger, LogEntry, LogLevel } from '@/utils/logger';
import { Trash2, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

export default function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setLogs(logger.getLogs());
    
    const unsubscribe = logger.subscribe(() => {
      setLogs(logger.getLogs());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.level === filter
  );

  const handleClearLogs = () => {
    logger.clearLogs();
  };

  const handleCopyLogs = async () => {
    const logsText = filteredLogs.map(log => 
      `[${log.timestamp.toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    await Clipboard.setStringAsync(logsText);
    console.log('Logs copied to clipboard!');
  };

  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return '#EF4444';
      case 'warn': return '#F59E0B';
      case 'info': return '#3B82F6';
      default: return '#999';
    }
  };

  const getLogBackground = (level: LogLevel) => {
    switch (level) {
      case 'error': return '#EF444420';
      case 'warn': return '#F59E0B20';
      case 'info': return '#3B82F620';
      default: return '#1a1a1a';
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.filterContainer}>
            {(['all', 'log', 'info', 'warn', 'error'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterButton,
                  filter === f && styles.filterButtonActive,
                  f === 'error' && filter === f && { backgroundColor: '#EF444440' },
                  f === 'warn' && filter === f && { backgroundColor: '#F59E0B40' },
                  f === 'info' && filter === f && { backgroundColor: '#3B82F640' },
                ]}
                onPress={() => setFilter(f)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filter === f && styles.filterButtonTextActive,
                ]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCopyLogs}
            >
              <Copy size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.clearButton]}
              onPress={handleClearLogs}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stats}>
          <Text style={styles.statsText}>
            Total: {filteredLogs.length} logs
          </Text>
          <TouchableOpacity onPress={() => setAutoScroll(!autoScroll)}>
            <Text style={[styles.statsText, autoScroll && styles.autoScrollActive]}>
              Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.logsContainer}
          onScrollBeginDrag={() => setAutoScroll(false)}
        >
          {filteredLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No logs yet</Text>
              <Text style={styles.emptySubtext}>
                Console logs will appear here
              </Text>
            </View>
          ) : (
            filteredLogs.map((log) => (
              <View 
                key={log.id} 
                style={[
                  styles.logEntry,
                  { backgroundColor: getLogBackground(log.level) }
                ]}
              >
                <View style={styles.logHeader}>
                  <Text style={[
                    styles.logLevel,
                    { color: getLogColor(log.level) }
                  ]}>
                    {log.level.toUpperCase()}
                  </Text>
                  <Text style={styles.logTime}>
                    {log.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
              </View>
            ))
          )}
          <View style={styles.scrollPadding} />
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterContainer: {
    flexDirection: 'row' as const,
    gap: 8,
    flex: 1,
    flexWrap: 'wrap' as const,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600' as const,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  clearButton: {
    borderColor: '#EF4444',
  },
  stats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0a0a0a',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  autoScrollActive: {
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
  logsContainer: {
    flex: 1,
  },
  logEntry: {
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  logHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  logLevel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  logTime: {
    fontSize: 11,
    color: '#666',
  },
  logMessage: {
    fontSize: 13,
    color: '#fff',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
  },
  scrollPadding: {
    height: 20,
  },
});
