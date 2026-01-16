import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Plus, Search, Trash2, Key, Shield } from 'lucide-react-native';
import { AdminUser } from '@/types/admin';
import { getDb, getAuth } from '@/config/firebase';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { useAdmin } from '@/contexts/AdminContext';

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin', color: '#EF4444' },
  { value: 'support', label: 'Support', color: '#3B82F6' },
  { value: 'sales', label: 'Sales', color: '#10B981' },
  { value: 'developer', label: 'Developer', color: '#8B5CF6' },
] as const;

export default function AdminAccountsManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const { adminUser } = useAdmin();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'support' as AdminUser['role'],
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let mounted = true;

    const setupAdminsListener = async () => {
      try {
        const dbInstance = getDb();
        if (!dbInstance) {
          console.log('AdminAccounts: Firestore not initialized');
          if (mounted) {
            setAdmins([
              {
                id: 'admin_1',
                email: 'admin@eatly.com',
                phone: '+976 88008084',
                name: 'Super Admin',
                role: 'super_admin',
                createdAt: new Date().toISOString(),
              },
            ]);
            setIsLoading(false);
          }
          return;
        }

        const q = query(collection(dbInstance, 'admins'));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!mounted) return;

            console.log('AdminAccounts: Admins snapshot received, count:', snapshot.docs.length);
            const data = snapshot.docs.map((doc) => {
              const adminData = doc.data();
              return {
                id: doc.id,
                name: adminData.name || 'Unknown',
                email: adminData.email || '',
                phone: adminData.phone,
                role: adminData.role || 'support',
                createdAt: adminData.createdAt,
              };
            }) as AdminUser[];

            if (data.length === 0) {
              console.log('AdminAccounts: No admins in Firestore, showing default');
              setAdmins([
                {
                  id: 'admin_1',
                  email: 'admin@eatly.com',
                  phone: '+976 88008084',
                  name: 'Super Admin',
                  role: 'super_admin',
                  createdAt: new Date().toISOString(),
                },
              ]);
            } else {
              setAdmins(data);
            }
            setIsLoading(false);
          },
          (err) => {
            if (!mounted) return;
            console.error('AdminAccounts: Error listening to admins:', err);
            setIsLoading(false);
          }
        );
      } catch (err: any) {
        if (!mounted) return;
        console.error('AdminAccounts: Failed to setup admins listener:', err);
        setIsLoading(false);
      }
    };

    setupAdminsListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, []);

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAdmin = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      console.log('AdminAccounts: Creating new admin account');
      
      const authInstance = getAuth();
      if (!authInstance) {
        Alert.alert('Error', 'Firebase Auth not initialized');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        authInstance,
        formData.email,
        formData.password
      );
      console.log('AdminAccounts: Firebase Auth user created:', userCredential.user.uid);

      const dbInstance = getDb();
      if (dbInstance) {
        await addDoc(collection(dbInstance, 'admins'), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role,
          createdAt: new Date().toISOString(),
          firebaseUid: userCredential.user.uid,
        });
        console.log('AdminAccounts: Admin account created successfully');
      }

      Alert.alert('Success', 'Admin account created successfully');
      setIsModalVisible(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'support',
      });
    } catch (error: any) {
      console.error('AdminAccounts: Error creating admin:', error);
      Alert.alert('Error', error.message || 'Failed to create admin account');
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.role === 'super_admin') {
      Alert.alert('Error', 'Cannot delete super admin account');
      return;
    }

    if (adminUser?.id === admin.id) {
      Alert.alert('Error', 'Cannot delete your own account');
      return;
    }

    Alert.alert('Delete Admin', `Are you sure you want to delete ${admin.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const dbInstance = getDb();
            if (dbInstance) {
              console.log('AdminAccounts: Deleting admin from Firestore:', admin.id);
              const docRef = doc(dbInstance, 'admins', admin.id);
              await deleteDoc(docRef);
              console.log('AdminAccounts: Admin deleted successfully from Firestore');
            } else {
              console.log('AdminAccounts: Firestore not available');
            }
            Alert.alert('Success', 'Admin account deleted successfully');
          } catch (error) {
            console.error('AdminAccounts: Error deleting admin:', error);
            Alert.alert('Error', 'Failed to delete admin account. Please try again.');
          }
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (!selectedAdmin) return;

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      console.log('AdminAccounts: Changing password for admin:', selectedAdmin.id);
      
      const authInstance = getAuth();
      if (authInstance?.currentUser) {
        await updatePassword(authInstance.currentUser, passwordData.newPassword);
        console.log('AdminAccounts: Password changed successfully');
      }

      Alert.alert('Success', 'Password changed successfully');
      setIsPasswordModalVisible(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setSelectedAdmin(null);
    } catch (error: any) {
      console.error('AdminAccounts: Error changing password:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    }
  };

  const openPasswordModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setIsPasswordModalVisible(true);
  };

  const renderAdmin = ({ item: admin }: { item: AdminUser }) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.value === admin.role);

    return (
      <View style={styles.adminCard}>
        <View style={styles.adminHeader}>
          <View style={styles.adminInfo}>
            <Text style={styles.adminName}>{admin.name}</Text>
            <Text style={styles.adminEmail}>{admin.email}</Text>
            {admin.phone && <Text style={styles.adminPhone}>{admin.phone}</Text>}
          </View>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: roleOption ? `${roleOption.color}20` : '#33333320' },
            ]}
          >
            <Shield size={14} color={roleOption?.color || '#999'} />
            <Text
              style={[
                styles.roleText,
                { color: roleOption?.color || '#999' },
              ]}
            >
              {roleOption?.label || admin.role}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passwordButton]}
            onPress={() => openPasswordModal(admin)}
          >
            <Key size={16} color="#3B82F6" />
            <Text style={[styles.actionText, { color: '#3B82F6' }]}>
              Change Password
            </Text>
          </TouchableOpacity>

          {admin.role !== 'super_admin' && adminUser?.id !== admin.id && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteAdmin(admin)}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search admins..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Admin</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading admin accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAdmins}
          renderItem={renderAdmin}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No admin accounts found</Text>
          }
        />
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Create Admin Account</Text>

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#666"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@example.com"
                placeholderTextColor="#666"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="+976 88008084"
                placeholderTextColor="#666"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor="#666"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
              />

              <Text style={styles.label}>Role *</Text>
              <View style={styles.roleSelector}>
                {ROLE_OPTIONS.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleOption,
                      formData.role === role.value && {
                        backgroundColor: `${role.color}20`,
                        borderColor: role.color,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, role: role.value })}
                  >
                    <Shield
                      size={16}
                      color={formData.role === role.value ? role.color : '#999'}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === role.value && { color: role.color },
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsModalVisible(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      password: '',
                      role: 'support',
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCreateAdmin}
                >
                  <Text style={styles.submitButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPasswordModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Change Password for {selectedAdmin?.name}
            </Text>

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters"
              placeholderTextColor="#666"
              value={passwordData.newPassword}
              onChangeText={(text) =>
                setPasswordData({ ...passwordData, newPassword: text })
              }
              secureTextEntry
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor="#666"
              value={passwordData.confirmPassword}
              onChangeText={(text) =>
                setPasswordData({ ...passwordData, confirmPassword: text })
              }
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsPasswordModalVisible(false);
                  setPasswordData({ newPassword: '', confirmPassword: '' });
                  setSelectedAdmin(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.submitButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a1a',
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
  createButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 14,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  adminCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  adminHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  adminPhone: {
    fontSize: 13,
    color: '#666',
  },
  roleBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600' as const,
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
  passwordButton: {
    backgroundColor: '#3B82F610',
    borderColor: '#3B82F640',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#999',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  roleSelector: {
    gap: 8,
  },
  roleOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500' as const,
  },
  modalActions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
