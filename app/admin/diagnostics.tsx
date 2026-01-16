import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { useAds } from '@/contexts/AdContext';
import { getDb, getAuth, waitForFirebase } from '@/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { RefreshCw, Database, Wifi, AlertCircle, Copy, ExternalLink } from 'lucide-react-native';

export default function Diagnostics() {
  const { 
    restaurants, 
    isLoading: restaurantsLoading, 
    error: restaurantsError,
    isConnected: restaurantsConnected 
  } = useRestaurants();
  const { 
    ads, 
    isLoading: adsLoading, 
    error: adsError,
    isConnected: adsConnected 
  } = useAds();
  const [firestoreRestaurants, setFirestoreRestaurants] = useState<any[]>([]);
  const [firestoreAds, setFirestoreAds] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [authUser, setAuthUser] = useState<any>(null);

  const testFirestoreConnection = async () => {
    try {
      console.log('Testing Firestore connection...');
      await waitForFirebase();
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }
      const restaurantsSnapshot = await getDocs(collection(dbInstance, 'restaurants'));
      console.log('Firestore connection test successful, found', restaurantsSnapshot.size, 'restaurants');
      setConnectionStatus('✅ Active');
      return true;
    } catch (error: any) {
      console.error('Firestore connection test failed:', error);
      setConnectionStatus('❌ Connection Failed: ' + error.message);
      return false;
    }
  };

  const loadFirestoreData = async () => {
    try {
      await waitForFirebase();
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Database not initialized');
      }
      const restaurantsSnapshot = await getDocs(collection(dbInstance, 'restaurants'));
      const restaurantsData = restaurantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFirestoreRestaurants(restaurantsData);

      const adsSnapshot = await getDocs(collection(dbInstance, 'ads'));
      const adsData = adsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFirestoreAds(adsData);
    } catch (error: any) {
      console.error('Error loading Firestore data:', error);
      Alert.alert('Error', 'Failed to load Firestore data: ' + error.message);
    }
  };

  const refresh = async () => {
    setIsRefreshing(true);
    await testFirestoreConnection();
    await loadFirestoreData();
    
    // Check Firebase Auth user
    await waitForFirebase();
    const authInstance = getAuth();
    if (authInstance?.currentUser) {
      setAuthUser({
        uid: authInstance.currentUser.uid,
        email: authInstance.currentUser.email,
      });
    } else {
      setAuthUser(null);
    }
    
    setIsRefreshing(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const checkDataConsistency = () => {
    console.log('\n===== DATA CONSISTENCY CHECK =====');
    console.log('Context Restaurants:', restaurants.length);
    console.log('Firestore Restaurants:', firestoreRestaurants.length);
    console.log('Context Ads:', ads.length);
    console.log('Firestore Ads:', firestoreAds.length);
    
    if (restaurants.length !== firestoreRestaurants.length) {
      console.log('⚠️ Restaurant count mismatch!');
      console.log('Context IDs:', restaurants.map(r => r.id));
      console.log('Firestore IDs:', firestoreRestaurants.map(r => r.id));
    }
    
    if (ads.length !== firestoreAds.length) {
      console.log('⚠️ Ad count mismatch!');
      console.log('Context IDs:', ads.map(a => a.id));
      console.log('Firestore IDs:', firestoreAds.map(a => a.id));
    }
    console.log('===== END CHECK =====\n');
    
    Alert.alert(
      'Data Check',
      `Context: ${restaurants.length} restaurants, ${ads.length} ads\n` +
      `Firestore: ${firestoreRestaurants.length} restaurants, ${firestoreAds.length} ads\n\n` +
      `Check console for detailed logs`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Firebase Diagnostics</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.checkButton} 
            onPress={checkDataConsistency}
          >
            <AlertCircle size={18} color="#fff" />
            <Text style={styles.buttonText}>Check</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Wifi size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Connection Status</Text>
        </View>
        <Text style={styles.statusText}>Firestore Test: {connectionStatus}</Text>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Firebase Auth User:</Text>
          <Text style={[styles.value, { color: authUser ? '#10B981' : '#EF4444' }]}>
            {authUser ? `✅ ${authUser.email}` : '❌ Not authenticated'}
          </Text>
        </View>
        {authUser && (
          <>
            <View style={styles.dataRow}>
              <Text style={styles.label}>User UID:</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={async () => {
                  await Clipboard.setStringAsync(authUser.uid);
                  Alert.alert('Copied!', 'UID copied to clipboard. Use this in Firestore Rules.');
                }}
              >
                <Text style={[styles.value, { fontSize: 10, flex: 1 }]}>{authUser.uid}</Text>
                <Copy size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            <View style={styles.warningBox}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                Copy this UID and update your Firestore Security Rules. See FIRESTORE_RULES_FIX.md for instructions.
              </Text>
            </View>
          </>
        )}
        <View style={styles.dataRow}>
          <Text style={styles.label}>Restaurants Listener:</Text>
          <Text style={[styles.value, { color: restaurantsConnected ? '#10B981' : '#EF4444' }]}>
            {restaurantsConnected ? '✅ Connected' : '❌ Disconnected'}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>Ads Listener:</Text>
          <Text style={[styles.value, { color: adsConnected ? '#10B981' : '#EF4444' }]}>
            {adsConnected ? '✅ Connected' : '❌ Disconnected'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Database size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Restaurants</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.label}>Context (Local):</Text>
          <Text style={styles.value}>{restaurants.length} items</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.label}>Firestore (Direct):</Text>
          <Text style={styles.value}>{firestoreRestaurants.length} items</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.label}>Loading Status:</Text>
          <Text style={styles.value}>{restaurantsLoading ? 'Loading...' : 'Loaded'}</Text>
        </View>

        {restaurantsError && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={styles.errorText}>{restaurantsError}</Text>
          </View>
        )}

        {firestoreRestaurants.length > 0 && (
          <View style={styles.itemsList}>
            <Text style={styles.itemsTitle}>Firestore IDs:</Text>
            {firestoreRestaurants.map(item => (
              <Text key={item.id} style={styles.itemId}>• {item.name} ({item.id})</Text>
            ))}
          </View>
        )}

        {restaurants.length > 0 && (
          <View style={styles.itemsList}>
            <Text style={styles.itemsTitle}>Context IDs:</Text>
            {restaurants.map(item => (
              <Text key={item.id} style={styles.itemId}>• {item.name} ({item.id})</Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Database size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Ads</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.label}>Context (Local):</Text>
          <Text style={styles.value}>{ads.length} items</Text>
        </View>
        
        <View style={styles.dataRow}>
          <Text style={styles.label}>Firestore (Direct):</Text>
          <Text style={styles.value}>{firestoreAds.length} items</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.label}>Loading Status:</Text>
          <Text style={styles.value}>{adsLoading ? 'Loading...' : 'Loaded'}</Text>
        </View>

        {adsError && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={styles.errorText}>{adsError}</Text>
          </View>
        )}

        {firestoreAds.length > 0 && (
          <View style={styles.itemsList}>
            <Text style={styles.itemsTitle}>Firestore IDs:</Text>
            {firestoreAds.map(item => (
              <Text key={item.id} style={styles.itemId}>• {item.restaurantName} ({item.id})</Text>
            ))}
          </View>
        )}

        {ads.length > 0 && (
          <View style={styles.itemsList}>
            <Text style={styles.itemsTitle}>Context IDs:</Text>
            {ads.map(item => (
              <Text key={item.id} style={styles.itemId}>• {item.restaurantName} ({item.id})</Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.infoTitle}>What to check:</Text>
        <Text style={styles.infoText}>1. Both devices should show same Firestore counts</Text>
        <Text style={styles.infoText}>2. Connection status should be ✅ Connected</Text>
        <Text style={styles.infoText}>3. IDs should match across devices</Text>
        <Text style={styles.infoText}>4. If counts differ, check Firestore rules in Firebase Console</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.infoTitle}>Data Not Persisting?</Text>
        <Text style={styles.infoText}>If data disappears when you restart the app:</Text>
        <Text style={styles.infoText}>1. Copy your User UID (tap on it above)</Text>
        <Text style={styles.infoText}>2. Open Firebase Console → Firestore Database → Rules</Text>
        <Text style={styles.infoText}>3. Update the admin UID in the rules with your UID</Text>
        <Text style={styles.infoText}>4. See FIRESTORE_RULES_FIX.md for detailed instructions</Text>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => {
            Alert.alert(
              'Open Firebase Console',
              'Go to:\nhttps://console.firebase.google.com/project/review-e8836/firestore/rules',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Copy Link', 
                  onPress: async () => {
                    await Clipboard.setStringAsync('https://console.firebase.google.com/project/review-e8836/firestore/rules');
                    Alert.alert('Copied!', 'Firebase Console link copied to clipboard');
                  }
                }
              ]
            );
          }}
        >
          <ExternalLink size={16} color="#3B82F6" />
          <Text style={styles.linkText}>Open Firebase Console</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'column' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  section: {
    backgroundColor: '#1a1a1a',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  statusText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 8,
  },
  dataRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  label: {
    fontSize: 14,
    color: '#999',
  },
  value: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600' as const,
  },
  errorBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#EF444410',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF444440',
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  itemsList: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
    marginBottom: 8,
  },
  itemId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace' as const,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  warningBox: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    backgroundColor: '#F59E0B10',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B40',
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#F59E0B',
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#3B82F610',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F640',
    marginTop: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F59E0B',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
    lineHeight: 20,
  },
});
