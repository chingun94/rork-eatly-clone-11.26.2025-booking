import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAdmin } from '@/contexts/AdminContext';
import { Image as ExpoImage } from 'expo-image';

export default function AdminLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdmin();
  const router = useRouter();

  const handleLogin = async () => {
    console.log('AdminLogin: Attempting login with phone:', phone);
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter phone and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('AdminLogin: Calling login function');
      const result = await login(phone, password);
      console.log('AdminLogin: Login result:', result);
      if (result.success) {
        console.log('AdminLogin: Login successful, navigating to admin dashboard');
        router.replace('/admin' as any);
      } else {
        console.log('AdminLogin: Login failed:', result.error);
        Alert.alert('Error', result.error || 'Login failed');
      }
    } catch (err) {
      console.error('AdminLogin: Login error:', err);
      Alert.alert('Error', 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
      <View style={styles.content}>
        <View style={styles.header}>
          <ExpoImage
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/njr2xtzhc1tnv5ugwukj4' }}
            style={styles.logoImage}
            contentFit="contain"
          />
          <Text style={styles.title}>Admin Login</Text>
          <Text style={styles.subtitle}>Restricted access only</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#666"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>


      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    padding: 24,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 48,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },

});
