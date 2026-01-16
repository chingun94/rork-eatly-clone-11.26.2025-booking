import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Save, Lock, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { mockSettings } from '@/mocks/admin-data';
import { AppSettings } from '@/types/admin';
import { useAdmin } from '@/contexts/AdminContext';

export default function SettingsManagement() {
  const [settings, setSettings] = useState<AppSettings[]>(mockSettings);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { logout, changePassword } = useAdmin();
  const router = useRouter();

  const handleSave = (setting: AppSettings, newValue: string) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.id === setting.id
          ? { ...s, value: newValue, updatedAt: new Date().toISOString() }
          : s
      )
    );
    Alert.alert('Success', `${setting.key} updated`);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match');
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (result.success) {
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } else {
      Alert.alert('Error', result.error || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/admin/login' as any);
          },
        },
      ]
    );
  };

  const SettingItem = ({ item }: { item: AppSettings }) => {
    const [value, setValue] = useState(item.value);

    return (
      <View style={styles.card}>
        <Text style={styles.key}>{item.key.replace(/_/g, ' ')}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            keyboardType={item.type === 'number' ? 'numeric' : 'default'}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => handleSave(item, value)}
          >
            <Save size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.updated}>
          Last updated: {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setShowPasswordSection(!showPasswordSection)}
        >
          <Lock size={20} color="#FF6B35" />
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>

        {showPasswordSection && (
          <View style={styles.passwordSection}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Current Password"
              placeholderTextColor="#666"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              placeholderTextColor="#666"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm New Password"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.savePasswordButton}
              onPress={handleChangePassword}
            >
              <Save size={16} color="#fff" />
              <Text style={styles.savePasswordText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionCard, styles.logoutCard]}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#FF4444" />
          <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        {settings.map((item) => <SettingItem key={item.id} item={item} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, color: '#fff', marginBottom: 16 },
  actionCard: { 
    backgroundColor: '#1a1a1a', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#333',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  logoutCard: {
    borderColor: '#FF4444',
  },
  actionText: { fontSize: 16, fontWeight: '600' as const, color: '#fff' },
  logoutText: { color: '#FF4444' },
  passwordSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  passwordInput: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  savePasswordButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  savePasswordText: { fontSize: 14, fontWeight: '600' as const, color: '#fff' },
  card: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  key: { fontSize: 16, fontWeight: '600' as const, color: '#fff', marginBottom: 4, textTransform: 'capitalize' as const },
  description: { fontSize: 14, color: '#999', marginBottom: 12 },
  inputRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 8 },
  input: { flex: 1, backgroundColor: '#000', borderRadius: 8, padding: 12, fontSize: 14, color: '#fff', borderWidth: 1, borderColor: '#333' },
  saveButton: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 12, justifyContent: 'center' as const, alignItems: 'center' as const, width: 48 },
  updated: { fontSize: 12, color: '#666' },
});
