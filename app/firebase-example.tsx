import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FirebaseExampleScreen() {
  const { user, signIn, signUp, signOut, isAuthenticated } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const insets = useSafeAreaInsets();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (isSignUp) {
      const result = await signUp(email, password, displayName);
      if (result.success) {
        Alert.alert('Success', 'Account created successfully!');
        setEmail('');
        setPassword('');
        setDisplayName('');
      } else {
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    } else {
      const result = await signIn(email, password);
      if (result.success) {
        Alert.alert('Success', 'Signed in successfully!');
        setEmail('');
        setPassword('');
      } else {
        Alert.alert('Error', result.error || 'Failed to sign in');
      }
    }
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      Alert.alert('Success', 'Signed out successfully!');
    } else {
      Alert.alert('Error', result.error || 'Failed to sign out');
    }
  };

  if (isAuthenticated && user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Firebase Example' }} />
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom }}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>You are signed in</Text>
          <View style={styles.userInfo}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user.email}</Text>
            {user.displayName && (
              <>
                <Text style={styles.label}>Display Name:</Text>
                <Text style={styles.value}>{user.displayName}</Text>
              </>
            )}
            <Text style={styles.label}>User ID:</Text>
            <Text style={styles.valueSmall}>{user.uid}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSignOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Firebase Example' }} />
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
        
        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.linkText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 14,
  },
  userInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  valueSmall: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'monospace',
  },
});
