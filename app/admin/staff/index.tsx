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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, X, Users, Shield } from 'lucide-react-native';
import { RestaurantStaff, RestaurantStaffRole, ROLE_DISPLAY_NAMES, ROLE_PERMISSIONS } from '@/types/restaurant-staff';
import { staffFirebase } from '@/utils/staffFirebase';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type FormData = {
  restaurantId: string;
  restaurantName: string;
  email: string;
  name: string;
  role: RestaurantStaffRole;
  phone: string;
  password: string;
  isActive: boolean;
};

const INITIAL_FORM: FormData = {
  restaurantId: '',
  restaurantName: '',
  email: '',
  name: '',
  role: 'host',
  phone: '',
  password: '',
  isActive: true,
};

export default function RestaurantStaffAdminScreen() {
  const { restaurants } = useRestaurants();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<RestaurantStaffRole | ''>('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<RestaurantStaff | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');

  const queryClient = useQueryClient();
  
  const { data: allStaff = [], isLoading, refetch } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffFirebase.getAllStaff(),
  });
  
  const createMutation = useMutation({
    mutationFn: staffFirebase.createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: staffFirebase.updateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: staffFirebase.deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const filteredStaff = useMemo(() => {
    return allStaff.filter(staff => {
      const matchesSearch = 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.restaurantName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = !filterRole || staff.role === filterRole;
      
      return matchesSearch && matchesRole;
    });
  }, [allStaff, searchQuery, filterRole]);

  const handleOpenModal = (staff?: RestaurantStaff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        restaurantId: staff.restaurantId,
        restaurantName: staff.restaurantName,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        phone: staff.phone || '',
        password: '',
        isActive: staff.isActive,
      });
    } else {
      setEditingStaff(null);
      setFormData(INITIAL_FORM);
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setEditingStaff(null);
    setFormData(INITIAL_FORM);
    setRestaurantSearchQuery('');
  };

  const handleSave = async () => {
    if (!formData.email || !formData.name || !formData.restaurantId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!editingStaff && !formData.password) {
      Alert.alert('Error', 'Password is required for new staff');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      console.log('[Staff] Attempting to save staff:', editingStaff ? 'UPDATE' : 'CREATE');
      
      if (editingStaff) {
        const updateData: any = {
          id: editingStaff.id,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          phone: formData.phone || undefined,
          isActive: formData.isActive,
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }

        console.log('[Staff] Updating staff with data:', { ...updateData, password: '***' });
        await updateMutation.mutateAsync(updateData);
        Alert.alert('Success', 'Staff member updated successfully');
      } else {
        const createData = {
          restaurantId: formData.restaurantId,
          restaurantName: formData.restaurantName,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          phone: formData.phone || undefined,
          password: formData.password,
        };
        console.log('[Staff] Creating staff with data:', { ...createData, password: '***' });
        await createMutation.mutateAsync(createData);
        Alert.alert('Success', 'Staff member created successfully');
      }
      
      refetch();
      handleCloseModal();
    } catch (error: any) {
      console.error('[Staff] Error saving staff:', error);
      const errorMessage = error.message || error.toString() || 'Failed to save staff member';
      
      if (errorMessage.includes('fetch')) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to the backend server. Please check if the backend is running and the API URL is configured correctly.'
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleDelete = (staff: RestaurantStaff) => {
    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to delete ${staff.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(staff.id);
              Alert.alert('Success', 'Staff member deleted successfully');
              refetch();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete staff member');
            }
          },
        },
      ]
    );
  };

  const handleRestaurantChange = (restaurantId: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      setFormData(prev => ({
        ...prev,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      }));
    }
  };

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(restaurantSearchQuery.toLowerCase())
    );
  }, [restaurants, restaurantSearchQuery]);

  const renderStaffCard = ({ item }: { item: RestaurantStaff }) => {
    const permissions = ROLE_PERMISSIONS[item.role];
    const isExpanded = showPermissions === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[
              styles.roleIcon,
              item.role === 'owner' && styles.roleIconOwner,
              item.role === 'general_manager' && styles.roleIconManager,
              item.role === 'host' && styles.roleIconHost,
            ]}>
              <Shield size={20} color="#fff" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.staffName}>{item.name}</Text>
              <Text style={styles.roleBadge}>{ROLE_DISPLAY_NAMES[item.role]}</Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleOpenModal(item)}
            >
              <Edit2 size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.detailText}>📧 {item.email}</Text>
          {item.phone && <Text style={styles.detailText}>📱 {item.phone}</Text>}
          <Text style={styles.detailText}>🏪 {item.restaurantName}</Text>
          {item.lastLogin && (
            <Text style={styles.detailText}>
              🕐 Last login: {new Date(item.lastLogin).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge,
            item.isActive ? styles.statusActive : styles.statusInactive
          ]}>
            <Text style={[
              styles.statusText,
              item.isActive ? styles.statusTextActive : styles.statusTextInactive
            ]}>
              {item.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.permissionsButton}
            onPress={() => setShowPermissions(isExpanded ? null : item.id)}
          >
            <Text style={styles.permissionsButtonText}>
              {isExpanded ? 'Hide' : 'View'} Permissions
            </Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsTitle}>Role Permissions:</Text>
            {Object.entries(permissions).map(([key, value]) => (
              <View key={key} style={styles.permissionRow}>
                <Text style={styles.permissionLabel}>
                  {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Text style={value ? styles.permissionYes : styles.permissionNo}>
                  {value ? '✓' : '✗'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const roleOptions: RestaurantStaffRole[] = ['owner', 'general_manager', 'assistant_manager', 'host', 'event_manager'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Restaurant Staff</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleOpenModal()}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Staff</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, !filterRole && styles.filterChipActive]}
              onPress={() => setFilterRole('')}
            >
              <Text style={[styles.filterChipText, !filterRole && styles.filterChipTextActive]}>
                All Roles
              </Text>
            </TouchableOpacity>
            {roleOptions.map(role => (
              <TouchableOpacity
                key={role}
                style={[styles.filterChip, filterRole === role && styles.filterChipActive]}
                onPress={() => setFilterRole(role)}
              >
                <Text style={[styles.filterChipText, filterRole === role && styles.filterChipTextActive]}>
                  {ROLE_DISPLAY_NAMES[role]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D6A4F" />
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          renderItem={renderStaffCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color="#ccc" />
              <Text style={styles.emptyText}>No staff members found</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Restaurant *</Text>
                <View style={styles.restaurantSearchContainer}>
                  <Search size={18} color="#666" />
                  <TextInput
                    style={styles.restaurantSearchInput}
                    placeholder="Search restaurant..."
                    value={restaurantSearchQuery}
                    onChangeText={setRestaurantSearchQuery}
                  />
                </View>
                <View style={styles.pickerContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {filteredRestaurants.length > 0 ? (
                      filteredRestaurants.map(restaurant => (
                        <TouchableOpacity
                          key={restaurant.id}
                          style={[
                            styles.pickerOption,
                            formData.restaurantId === restaurant.id && styles.pickerOptionActive
                          ]}
                          onPress={() => handleRestaurantChange(restaurant.id)}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            formData.restaurantId === restaurant.id && styles.pickerOptionTextActive
                          ]}>
                            {restaurant.name}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noResultsText}>No restaurants found</Text>
                    )}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Password {!editingStaff && '*'}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  placeholder={editingStaff ? 'Leave blank to keep current' : 'Minimum 6 characters'}
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Role *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {roleOptions.map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleChip,
                        formData.role === role && styles.roleChipActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, role }))}
                    >
                      <Text style={[
                        styles.roleChipText,
                        formData.role === role && styles.roleChipTextActive
                      ]}>
                        {ROLE_DISPLAY_NAMES[role]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {editingStaff && (
                <View style={styles.formGroup}>
                  <View style={styles.switchRow}>
                    <Text style={styles.label}>Active</Text>
                    <Switch
                      value={formData.isActive}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                      trackColor={{ false: '#ccc', true: '#2D6A4F' }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Text style={styles.saveButtonText}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2D6A4F',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconOwner: {
    backgroundColor: '#8B5CF6',
  },
  roleIconManager: {
    backgroundColor: '#3B82F6',
  },
  roleIconHost: {
    backgroundColor: '#10B981',
  },
  cardInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  roleBadge: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500' as const,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  cardDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  statusTextActive: {
    color: '#10B981',
  },
  statusTextInactive: {
    color: '#EF4444',
  },
  permissionsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  permissionsButtonText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600' as const,
  },
  permissionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  permissionLabel: {
    fontSize: 13,
    color: '#666',
  },
  permissionYes: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700' as const,
  },
  permissionNo: {
    fontSize: 14,
    color: '#EF4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  restaurantSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  restaurantSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  pickerContainer: {
    flexDirection: 'row',
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    padding: 12,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  pickerOptionActive: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  pickerOptionTextActive: {
    color: '#fff',
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  roleChipActive: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  roleChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  roleChipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
