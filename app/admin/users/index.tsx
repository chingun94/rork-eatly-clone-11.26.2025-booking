import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Search, Ban, CheckCircle, Trash2 } from 'lucide-react-native';
import { mockUsersWithActivity } from '@/mocks/admin-data';
import { UserWithActivity } from '@/types/admin';
import { getDb } from '@/config/firebase';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupUsersListener = async () => {
      try {
        const dbInstance = getDb();
        if (!dbInstance) {
          console.log('AdminUsers: Firestore not initialized, using mock data');
          if (mounted) {
            setUsers(mockUsersWithActivity);
            setIsLoading(false);
          }
          return;
        }

        const q = query(collection(dbInstance, 'users'));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!mounted) return;

            console.log('AdminUsers: Users snapshot received, count:', snapshot.docs.length);
            const data = snapshot.docs.map((doc) => {
              const userData = doc.data();
              return {
                id: userData.id || doc.id,
                name: userData.name || 'Unknown',
                email: userData.email || '',
                phone: userData.phone,
                joinDate: userData.joinDate,
                status: 'active' as const,
                activity: {
                  reviewCount: 0,
                  pointsEarned: 0,
                  rewardsRedeemed: 0,
                  flaggedContent: 0,
                  lastActive: userData.joinDate,
                },
              };
            }) as UserWithActivity[];

            if (data.length === 0) {
              console.log('AdminUsers: No users in Firestore, using mock data');
              setUsers(mockUsersWithActivity);
            } else {
              setUsers(data);
            }
            setIsLoading(false);
          },
          (err) => {
            if (!mounted) return;
            console.error('AdminUsers: Error listening to users:', err);
            setUsers(mockUsersWithActivity);
            setIsLoading(false);
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        console.error('AdminUsers: Failed to setup users listener:', err);
        setUsers(mockUsersWithActivity);
        setIsLoading(false);
      }
    };

    setupUsersListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuspend = (user: UserWithActivity) => {
    Alert.alert(
      'Suspend User',
      `Are you sure you want to suspend ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: () => {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === user.id
                  ? {
                      ...u,
                      status: 'suspended' as const,
                      suspendedUntil: new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                      ).toISOString(),
                      suspensionReason: 'Suspended by admin',
                    }
                  : u
              )
            );
          },
        },
      ]
    );
  };

  const handleActivate = (user: UserWithActivity) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? { ...u, status: 'active' as const, suspendedUntil: undefined }
          : u
      )
    );
    Alert.alert('Success', `${user.name} has been activated`);
  };

  const handleDelete = async (user: UserWithActivity) => {
    Alert.alert('Delete User', `Are you sure you want to delete ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const dbInstance = getDb();
            if (dbInstance) {
              console.log('AdminUsers: Deleting user from Firestore:', user.id);
              const docRef = doc(dbInstance, 'users', user.id);
              await deleteDoc(docRef);
              console.log('AdminUsers: User deleted successfully from Firestore');
            } else {
              console.log('AdminUsers: Firestore not available, removing from local state only');
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
            }
            Alert.alert('Success', 'User deleted successfully');
          } catch (error) {
            console.error('AdminUsers: Error deleting user:', error);
            Alert.alert('Error', 'Failed to delete user. Please try again.');
          }
        },
      },
    ]);
  };

  const renderUser = ({ item: user }: { item: UserWithActivity }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                user.status === 'active'
                  ? '#10B98120'
                  : user.status === 'suspended'
                  ? '#F59E0B20'
                  : '#EF444420',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  user.status === 'active'
                    ? '#10B981'
                    : user.status === 'suspended'
                    ? '#F59E0B'
                    : '#EF4444',
              },
            ]}
          >
            {user.status}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.activity.reviewCount}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.activity.pointsEarned}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.activity.rewardsRedeemed}</Text>
          <Text style={styles.statLabel}>Rewards</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statValue,
              user.activity.flaggedContent > 0 && { color: '#EF4444' },
            ]}
          >
            {user.activity.flaggedContent}
          </Text>
          <Text style={styles.statLabel}>Flagged</Text>
        </View>
      </View>

      {user.suspensionReason && (
        <View style={styles.suspensionInfo}>
          <Text style={styles.suspensionText}>
            Reason: {user.suspensionReason}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {user.status === 'suspended' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.activateButton]}
            onPress={() => handleActivate(user)}
          >
            <CheckCircle size={16} color="#10B981" />
            <Text style={[styles.actionText, { color: '#10B981' }]}>
              Activate
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.suspendButton]}
            onPress={() => handleSuspend(user)}
          >
            <Ban size={16} color="#F59E0B" />
            <Text style={[styles.actionText, { color: '#F59E0B' }]}>
              Suspend
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(user)}
        >
          <Trash2 size={16} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a1a',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  userCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  userHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  suspensionInfo: {
    backgroundColor: '#F59E0B20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  suspensionText: {
    fontSize: 13,
    color: '#F59E0B',
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  suspendButton: {
    backgroundColor: '#F59E0B10',
    borderColor: '#F59E0B40',
  },
  activateButton: {
    backgroundColor: '#10B98110',
    borderColor: '#10B98140',
  },
  deleteButton: {
    backgroundColor: '#EF444410',
    borderColor: '#EF444440',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyText: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: 16,
    marginTop: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingTop: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
});
