import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { useUser } from '@/contexts/UserContext';
import { getAuth, getDb } from '@/config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';


type AuthMode = 'signup' | 'login' | 'verify-email';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setVerificationEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useUser();
  const router = useRouter();
  const verificationTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (verificationTimerRef.current) {
        clearInterval(verificationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      verificationTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000) as ReturnType<typeof setInterval>;
      return () => {
        if (verificationTimerRef.current) {
          clearInterval(verificationTimerRef.current);
        }
      };
    }
  }, [resendCooldown]);


  const handleSignUp = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim() || !name.trim()) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    console.log('📧 Sign up: Starting process...');
    try {
      const auth = getAuth();
      if (!auth) {
        setIsLoading(false);
        throw new Error('Firebase Auth not initialized');
      }

      console.log('📧 Creating user with email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log('✅ User created, updating profile...');
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      console.log('✅ User created successfully:', userCredential.user.uid);
      
      const dbInstance = getDb();
      if (dbInstance) {
        try {
          console.log('💾 Calling login with Firebase UID:', userCredential.user.uid);
          await login({
            id: userCredential.user.uid,
            name: name,
            email: email,
            phone: '',
          });
          console.log('✅ User profile saved with Firebase UID');
        } catch (firestoreError: any) {
          console.error('⚠️ Error adding user to Firestore:', firestoreError);
        }
      }
      
      console.log('📧 Sending verification email...');
      await sendEmailVerification(userCredential.user);
      console.log('✅ Verification email sent');
      
      setVerificationEmailSent(true);
      setResendCooldown(60);
      setIsLoading(false);
      setMode('verify-email');
      
      Alert.alert(
        'Verify Your Email',
        `We've sent a verification link to ${email}. Please check your inbox and click the link to verify your email before signing in.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Error creating account:', error);
      setIsLoading(false);
      
      let errorMsg = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered. Please use the login form below to sign in.';
        setMode('login');
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = 'Email/Password authentication is not enabled. Please enable it in Firebase Console:\n\n1. Go to Firebase Console\n2. Navigate to Authentication > Sign-in method\n3. Enable "Email/Password" provider';
      }
      
      setErrorMessage(errorMsg);
      Alert.alert(
        error.code === 'auth/email-already-in-use' ? 'Account Already Exists' : 'Error',
        errorMsg,
        [{ text: 'OK' }]
      );
    }
  };



  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your email and password');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    console.log('🔐 Login: Starting login process...');
    
    try {
      console.log('🔐 Login: Getting auth instance...');
      const auth = getAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      console.log('🔐 Login: Signing in with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('🔐 Login: User signed in successfully:', userCredential.user.uid);
      console.log('🔐 Login: Email verified?', userCredential.user.emailVerified);
      
      if (!userCredential.user.emailVerified) {
        console.log('🔐 Login: Email not verified, showing alert');
        await auth.signOut();
        setIsLoading(false);
        Alert.alert(
          'Email Not Verified',
          'Please verify your email before signing in. Check your inbox for the verification link.',
          [
            { text: 'OK' },
            {
              text: 'Resend Email',
              onPress: async () => {
                try {
                  await sendEmailVerification(userCredential.user);
                  Alert.alert('Success', 'Verification email sent! Please check your inbox.');
                  setResendCooldown(60);
                } catch (err: any) {
                  console.error('Error sending verification email:', err);
                  Alert.alert('Error', 'Failed to send verification email. Please try again later.');
                }
              }
            }
          ]
        );
        return;
      }
      
      const userData = {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || 'User',
        email: email,
        phone: '',
      };
      
      console.log('🔐 Login: Calling login function...');
      await login(userData);
      console.log('🔐 Login: Login function completed, navigating to home...');
      router.replace('/(tabs)/(home)/home' as any);
      console.log('🔐 Login: Navigation complete');
    } catch (error: any) {
      console.error('🔐 Login: Error signing in:', error);
      console.error('🔐 Login: Error code:', error.code);
      let errorMsg = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMsg = 'This account has been disabled.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = 'Email/Password authentication is not enabled. Please enable it in Firebase Console:\n\n1. Go to Firebase Console\n2. Navigate to Authentication > Sign-in method\n3. Enable "Email/Password" provider';
      }
      
      console.log('🔐 Login: Setting error message:', errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      console.log('🔐 Login: Setting loading to false');
      setIsLoading(false);
    }
  };



  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    try {
      const auth = getAuth();
      if (!auth || !auth.currentUser) {
        Alert.alert('Error', 'Please sign up again to receive verification email.');
        setMode('signup');
        return;
      }
      
      await sendEmailVerification(auth.currentUser);
      Alert.alert('Success', `Verification email sent to ${email}. Please check your inbox and spam folder.`);
      setResendCooldown(60);
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      Alert.alert('Error', 'Failed to send verification email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const auth = getAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset Email Sent',
        `We've sent a password reset link to ${email}. Please check your inbox and follow the instructions to reset your password.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      let errorMsg = 'Failed to send password reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please try again later.';
      }
      
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderVerifyEmailScreen = () => (
    <View style={styles.verifyEmailContainer}>
      <View style={styles.verifyEmailIcon}>
        <ExpoImage
          source={{
            uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/dgzbnp6wljuejjn0ebool',
          }}
          style={styles.logoImage}
          contentFit="contain"
        />
      </View>
      
      <Text style={styles.verifyEmailTitle}>Verify Your Email</Text>
      <Text style={styles.verifyEmailText}>
        {`We've sent a verification link to:`}
      </Text>
      <Text style={styles.verifyEmailAddress}>{email}</Text>
      
      <Text style={styles.verifyEmailInstructions}>
        Please check your inbox and click the link to verify your email. Once verified, you can sign in to your account.
      </Text>

      <TouchableOpacity
        style={[styles.submitButton, (isLoading || resendCooldown > 0) && styles.buttonDisabled]}
        onPress={handleResendVerification}
        disabled={isLoading || resendCooldown > 0}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchModeButton}
        onPress={() => {
          setMode('login');
          setVerificationEmailSent(false);
        }}
      >
        <Text style={styles.switchModeText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );

  if (mode === 'verify-email') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.content}>
            {renderVerifyEmailScreen()}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <ExpoImage
                source={{
                  uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/dgzbnp6wljuejjn0ebool',
                }}
                style={styles.logoImage}
                contentFit="contain"
              />
            </View>
            <Text style={styles.title}>Таны хүссэн ресторан Eatly-д</Text>
            <Text style={styles.subtitle}>
              {mode === 'signup' ? 'Create your account' : 'Sign in to continue'}
            </Text>
          </View>

          <View style={styles.form}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            {mode === 'signup' && (
              <TextInput
                style={styles.input}
                placeholder="Нэр"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password (min 6 characters)"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#666" />
                ) : (
                  <Eye size={20} color="#666" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.buttonDisabled]}
              onPress={mode === 'signup' ? handleSignUp : handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'signup' ? 'Бүртгүүлэх' : 'Нэвтрэх'}
                </Text>
              )}
            </TouchableOpacity>

            {mode === 'login' && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Нууц үг мартсан?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setErrorMessage('');
              }}
              disabled={isLoading}
            >
              <Text style={styles.switchModeText}>
                {mode === 'signup'
                  ? (<Text>Хэрэв та бүртгэлтэй бол <Text style={{fontWeight: '700'}}>НЭВТРЭХ</Text></Text>)
                  : (<Text>Хэрэв та бүртгэлгүй бол <Text style={{fontWeight: '700'}}>БҮРТГҮҮЛЭХ</Text></Text>)}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1419',
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
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center' as const,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  form: {
    gap: 12,
  },

  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  passwordContainer: {
    position: 'relative' as const,
    marginBottom: 12,
  },
  passwordInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  eyeIcon: {
    position: 'absolute' as const,
    right: 16,
    top: 16,
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  forgotPasswordButton: {
    alignItems: 'center' as const,
    padding: 12,
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500' as const,
  },
  switchModeButton: {
    alignItems: 'center' as const,
    padding: 16,
    marginTop: 8,
  },
  switchModeText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600' as const,
  },
  hint: {
    marginTop: 32,
    textAlign: 'center' as const,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  verifyEmailContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 20,
  },
  verifyEmailIcon: {
    width: 100,
    height: 100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 24,
  },
  verifyEmailTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  verifyEmailText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  verifyEmailAddress: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FF6B35',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  verifyEmailInstructions: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },

  errorContainer: {
    backgroundColor: '#FF6B3520',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FF6B35',
    marginBottom: 12,
  },
  errorText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
