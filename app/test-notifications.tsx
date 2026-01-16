import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Bell, CheckCircle, XCircle, Smartphone } from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { router } from 'expo-router';

export default function TestNotifications() {
  const { pushToken, user } = useUser();

  const testSteps = [
    {
      title: 'Device Check',
      status: Platform.OS !== 'web' ? 'pass' : 'fail',
      message: Platform.OS !== 'web' 
        ? `✓ Running on ${Platform.OS}` 
        : '✗ Push notifications require a physical device',
    },
    {
      title: 'User Login',
      status: user ? 'pass' : 'fail',
      message: user ? `✓ Logged in as ${user.name}` : '✗ No user logged in',
    },
    {
      title: 'Push Token',
      status: pushToken ? 'pass' : 'fail',
      message: pushToken 
        ? `✓ Token: ${pushToken.substring(0, 30)}...` 
        : '✗ No push token obtained',
    },
  ];

  const allPassed = testSteps.every(step => step.status === 'pass');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Bell size={48} color="#FF6B35" />
          <Text style={styles.title}>Push Notification Test</Text>
          <Text style={styles.subtitle}>Check if your setup is ready</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Check</Text>
          {testSteps.map((step, index) => (
            <View key={index} style={styles.checkItem}>
              {step.status === 'pass' ? (
                <CheckCircle size={24} color="#10B981" />
              ) : (
                <XCircle size={24} color="#EF4444" />
              )}
              <View style={styles.checkContent}>
                <Text style={styles.checkTitle}>{step.title}</Text>
                <Text style={[
                  styles.checkMessage,
                  step.status === 'pass' ? styles.successText : styles.errorText
                ]}>
                  {step.message}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {allPassed ? (
          <View style={styles.successBox}>
            <CheckCircle size={32} color="#10B981" />
            <Text style={styles.successTitle}>Ready to Test!</Text>
            <Text style={styles.successMessage}>
              Your device is ready to receive push notifications
            </Text>
          </View>
        ) : (
          <View style={styles.errorBox}>
            <XCircle size={32} color="#EF4444" />
            <Text style={styles.errorTitle}>Setup Required</Text>
            <Text style={styles.errorMessage}>
              {!user 
                ? 'Please log in first to enable notifications'
                : Platform.OS === 'web'
                ? 'Please test on a physical device (scan QR code)'
                : 'Make sure you granted notification permissions'}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Test</Text>
          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Go to Admin Panel</Text>
              <Text style={styles.stepText}>Navigate to /admin/notifications</Text>
            </View>
          </View>
          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Send Test Notification</Text>
              <Text style={styles.stepText}>Enter a title and body, then click send</Text>
            </View>
          </View>
          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Check Your Device</Text>
              <Text style={styles.stepText}>You should receive a notification</Text>
            </View>
          </View>
        </View>

        {allPassed && (
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/admin/notifications')}
          >
            <Bell size={20} color="#fff" />
            <Text style={styles.buttonText}>Go to Admin Notifications</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Smartphone size={20} color="#666" />
          <Text style={styles.infoText}>
            For best results, test on a physical device. Web notifications are not supported.
          </Text>
        </View>

        {pushToken && (
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>Your Push Token:</Text>
            <Text style={styles.tokenText} selectable>
              {pushToken}
            </Text>
            <Text style={styles.tokenHint}>
              You can also test using expo.dev/notifications
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  checkContent: {
    flex: 1,
  },
  checkTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  checkMessage: {
    fontSize: 14,
  },
  successText: {
    color: '#10B981',
  },
  errorText: {
    color: '#EF4444',
  },
  successBox: {
    backgroundColor: '#10B98120',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#10B981',
    marginTop: 12,
  },
  successMessage: {
    fontSize: 14,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: '#EF444420',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#EF4444',
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FF6B35',
    backgroundColor: '#FF6B3520',
    width: 40,
    height: 40,
    borderRadius: 20,
    textAlign: 'center',
    lineHeight: 40,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#999',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  tokenBox: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 12,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  tokenHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
