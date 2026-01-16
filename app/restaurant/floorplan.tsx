import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Move,
  Users,
  Square,
  Circle,
  Grid3x3,
  Minus,
  DoorOpen,
  Sparkles,
  ChefHat,
  WashingMachine,
  Save,
} from 'lucide-react-native';
import { floorPlanFirebase } from '@/utils/floorPlanFirebase';
import { Table, TableShape, FloorPlan, FloorPlanElement } from '@/types/booking';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Tool = 'select' | 'add-table' | 'add-element' | 'delete';
type SelectedElement = { type: 'table'; id: string } | { type: 'element'; id: string } | null;

export default function FloorPlanEditorScreen() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState('');
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [currentFloorPlan, setCurrentFloorPlan] = useState<FloorPlan | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showElementModal, setShowElementModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newElement, setNewElement] = useState<Partial<FloorPlanElement>>({ type: 'wall' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [newTable, setNewTable] = useState<Partial<Table>>({
    name: '',
    capacity: 4,
    shape: 'square',
    width: 60,
    height: 60,
  });

  const queryClient = useQueryClient();
  
  const floorPlansQuery = useQuery({
    queryKey: ['floorplans', restaurantId],
    queryFn: () => floorPlanFirebase.getAllFloorPlans(restaurantId),
    enabled: !!restaurantId,
  });

  const createFloorPlanMutation = useMutation({
    mutationFn: (input: Omit<FloorPlan, 'id' | 'createdAt' | 'updatedAt'>) =>
      floorPlanFirebase.createFloorPlan(input),
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['floorplans', restaurantId] });
      setFloorPlans([...floorPlans, newPlan]);
      setCurrentFloorPlan(newPlan);
      setShowNewPlanModal(false);
      setNewPlanName('');
      Alert.alert('Success', 'Floor plan created successfully');
    },
  });

  const updateFloorPlanMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<FloorPlan, 'id' | 'restaurantId' | 'createdAt'>> }) =>
      floorPlanFirebase.updateFloorPlan(id, updates),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['floorplans', restaurantId] });
      if (updated) {
        setFloorPlans(floorPlans.map((fp) => (fp.id === updated.id ? updated : fp)));
        setCurrentFloorPlan(updated);
        setHasUnsavedChanges(false);
        Alert.alert('Success', 'Floor plan saved successfully');
      }
    },
  });

  const deleteFloorPlanMutation = useMutation({
    mutationFn: (id: string) => floorPlanFirebase.deleteFloorPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorplans', restaurantId] });
      if (currentFloorPlan) {
        setFloorPlans(floorPlans.filter((fp) => fp.id !== currentFloorPlan.id));
        setCurrentFloorPlan(floorPlans[0] || null);
      }
      Alert.alert('Success', 'Floor plan deleted successfully');
    },
  });

  useEffect(() => {
    loadRestaurantId();
  }, []);

  useEffect(() => {
    if (floorPlansQuery.data) {
      setFloorPlans(floorPlansQuery.data);
      if (floorPlansQuery.data.length > 0 && !currentFloorPlan) {
        setCurrentFloorPlan(floorPlansQuery.data[0]);
      }
    }
  }, [floorPlansQuery.data, currentFloorPlan]);

  const loadRestaurantId = async () => {
    const id = await AsyncStorage.getItem('restaurant_id');
    if (id) {
      setRestaurantId(id);
    }
  };

  const handleCreateFloorPlan = () => {
    if (!newPlanName.trim()) {
      Alert.alert('Error', 'Please enter a floor plan name');
      return;
    }

    createFloorPlanMutation.mutate({
      restaurantId,
      name: newPlanName,
      width: 400,
      height: 600,
      tables: [],
      elements: [],
    });
  };

  const handleAddTable = () => {
    if (!newTable.name || !newTable.capacity) {
      Alert.alert('Error', 'Please fill in table details');
      return;
    }

    if (!currentFloorPlan) return;

    const table: Table = {
      id: `table_${Date.now()}`,
      name: newTable.name,
      capacity: newTable.capacity,
      shape: (newTable.shape || 'square') as TableShape,
      x: 100,
      y: 100,
      width: newTable.width || 60,
      height: newTable.height || 60,
      rotation: 0,
      isActive: true,
    };

    const updatedTables = [...currentFloorPlan.tables, table];

    updateFloorPlanMutation.mutate({
      id: currentFloorPlan.id,
      updates: { tables: updatedTables },
    });
    setHasUnsavedChanges(true);

    setShowTableModal(false);
    setNewTable({
      name: '',
      capacity: 4,
      shape: 'square',
      width: 60,
      height: 60,
    });
  };

  const handleAddElement = () => {
    if (!currentFloorPlan) return;

    const element: FloorPlanElement = {
      id: `element_${Date.now()}`,
      type: newElement.type || 'wall',
      x: 50,
      y: 50,
      width: newElement.type === 'wall' ? 150 : 80,
      height: newElement.type === 'wall' ? 20 : 80,
      rotation: 0,
      label: newElement.label,
    };

    const updatedElements = [...currentFloorPlan.elements, element];

    updateFloorPlanMutation.mutate({
      id: currentFloorPlan.id,
      updates: { elements: updatedElements },
    });
    setHasUnsavedChanges(true);

    setShowElementModal(false);
    setNewElement({ type: 'wall' });
  };

  const handleDeleteElement = () => {
    if (!selectedElement || !currentFloorPlan) return;

    if (selectedElement.type === 'table') {
      const updatedTables = currentFloorPlan.tables.filter(
        (t) => t.id !== selectedElement.id
      );
      updateFloorPlanMutation.mutate({
        id: currentFloorPlan.id,
        updates: { tables: updatedTables },
      });
      setHasUnsavedChanges(true);
    } else if (selectedElement.type === 'element') {
      const updatedElements = currentFloorPlan.elements.filter(
        (e) => e.id !== selectedElement.id
      );
      updateFloorPlanMutation.mutate({
        id: currentFloorPlan.id,
        updates: { elements: updatedElements },
      });
      setHasUnsavedChanges(true);
    }

    setSelectedElement(null);
  };

  const handleDeleteFloorPlan = () => {
    if (!currentFloorPlan) return;

    Alert.alert(
      'Delete Floor Plan',
      'Are you sure you want to delete this floor plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFloorPlanMutation.mutate(currentFloorPlan.id);
          },
        },
      ]
    );
  };

  const handleSaveFloorPlan = () => {
    if (!currentFloorPlan || !hasUnsavedChanges) return;

    updateFloorPlanMutation.mutate({
      id: currentFloorPlan.id,
      updates: {
        tables: currentFloorPlan.tables,
        elements: currentFloorPlan.elements,
      },
    });
  };

  const DraggableTable = ({ table }: { table: Table }) => {
    const isSelected =
      selectedElement?.type === 'table' && selectedElement.id === table.id;

    const pan = useRef(new Animated.ValueXY({ x: table.x, y: table.y })).current;
    const startPosition = useRef({ x: table.x, y: table.y });

    useEffect(() => {
      pan.setValue({ x: table.x, y: table.y });
      startPosition.current = { x: table.x, y: table.y };
    }, [table.x, table.y, pan]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => selectedTool === 'select',
        onMoveShouldSetPanResponder: () => selectedTool === 'select',
        onPanResponderGrant: () => {
          setSelectedElement({ type: 'table', id: table.id });
          startPosition.current = { x: table.x, y: table.y };
          pan.setOffset({ x: table.x, y: table.y });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          pan.flattenOffset();
          const newX = Math.max(0, Math.min(currentFloorPlan!.width - table.width, startPosition.current.x + gesture.dx));
          const newY = Math.max(0, Math.min(currentFloorPlan!.height - table.height, startPosition.current.y + gesture.dy));

          pan.setValue({ x: newX, y: newY });
          startPosition.current = { x: newX, y: newY };

          const updatedTables = currentFloorPlan!.tables.map((t) =>
            t.id === table.id ? { ...t, x: newX, y: newY } : t
          );

          setCurrentFloorPlan({
            ...currentFloorPlan!,
            tables: updatedTables,
          });
          setHasUnsavedChanges(true);
        },
      })
    ).current;

    return (
      <Animated.View
        key={table.id}
        {...panResponder.panHandlers}
        style={[
          styles.table,
          {
            left: pan.x,
            top: pan.y,
            width: table.width,
            height: table.height,
            borderRadius: table.shape === 'circle' || table.shape === 'round' ? 999 : 8,
            borderColor: isSelected ? '#2D6A4F' : '#ccc',
            borderWidth: isSelected ? 3 : 1,
          },
        ]}
      >
        <Text style={styles.tableName}>{table.name}</Text>
        <View style={styles.tableCapacity}>
          <Users size={12} color="#666" />
          <Text style={styles.tableCapacityText}>{table.capacity}</Text>
        </View>
      </Animated.View>
    );
  };

  const DraggableElement = ({ element }: { element: FloorPlanElement }) => {
    const isSelected =
      selectedElement?.type === 'element' && selectedElement.id === element.id;

    const pan = useRef(new Animated.ValueXY({ x: element.x, y: element.y })).current;
    const startPosition = useRef({ x: element.x, y: element.y });

    useEffect(() => {
      pan.setValue({ x: element.x, y: element.y });
      startPosition.current = { x: element.x, y: element.y };
    }, [element.x, element.y, pan]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => selectedTool === 'select',
        onMoveShouldSetPanResponder: () => selectedTool === 'select',
        onPanResponderGrant: () => {
          setSelectedElement({ type: 'element', id: element.id });
          startPosition.current = { x: element.x, y: element.y };
          pan.setOffset({ x: element.x, y: element.y });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          pan.flattenOffset();
          const newX = Math.max(0, Math.min(currentFloorPlan!.width - element.width, startPosition.current.x + gesture.dx));
          const newY = Math.max(0, Math.min(currentFloorPlan!.height - element.height, startPosition.current.y + gesture.dy));

          pan.setValue({ x: newX, y: newY });
          startPosition.current = { x: newX, y: newY };

          const updatedElements = currentFloorPlan!.elements.map((e) =>
            e.id === element.id ? { ...e, x: newX, y: newY } : e
          );

          setCurrentFloorPlan({
            ...currentFloorPlan!,
            elements: updatedElements,
          });
          setHasUnsavedChanges(true);
        },
      })
    ).current;

    const getElementColor = () => {
      switch (element.type) {
        case 'wall': return '#8B4513';
        case 'entrance': return '#10B981';
        case 'bar': return '#F59E0B';
        case 'kitchen': return '#EF4444';
        case 'restroom': return '#3B82F6';
        case 'decoration': return '#A855F7';
        default: return '#666';
      }
    };

    return (
      <Animated.View
        key={element.id}
        {...panResponder.panHandlers}
        style={[
          styles.floorElement,
          {
            left: pan.x,
            top: pan.y,
            width: element.width,
            height: element.height,
            backgroundColor: getElementColor(),
            borderColor: isSelected ? '#2D6A4F' : getElementColor(),
            borderWidth: isSelected ? 3 : 1,
          },
        ]}
      >
        {element.label && (
          <Text style={styles.elementLabel} numberOfLines={1}>
            {element.label}
          </Text>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Floor Plan Editor</Text>
          {currentFloorPlan && (
            <Text style={styles.headerSubtitle}>{currentFloorPlan.name}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {hasUnsavedChanges && (
            <TouchableOpacity
              onPress={handleSaveFloorPlan}
              style={styles.saveButton}
              disabled={updateFloorPlanMutation.isPending}
            >
              <Save size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setShowNewPlanModal(true)}
            style={styles.addButton}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {floorPlans.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.plansScroll}
          contentContainerStyle={styles.plansScrollContent}
        >
          {floorPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planTab,
                currentFloorPlan?.id === plan.id && styles.planTabActive,
              ]}
              onPress={() => setCurrentFloorPlan(plan)}
            >
              <Text
                style={[
                  styles.planTabText,
                  currentFloorPlan?.id === plan.id && styles.planTabTextActive,
                ]}
              >
                {plan.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolButton, selectedTool === 'select' && styles.toolButtonActive]}
          onPress={() => setSelectedTool('select')}
        >
          <Move size={20} color={selectedTool === 'select' ? '#fff' : '#666'} />
          <Text
            style={[
              styles.toolButtonText,
              selectedTool === 'select' && styles.toolButtonTextActive,
            ]}
          >
            Select
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, selectedTool === 'add-table' && styles.toolButtonActive]}
          onPress={() => {
            setSelectedTool('add-table');
            setShowTableModal(true);
          }}
        >
          <Grid3x3 size={20} color={selectedTool === 'add-table' ? '#fff' : '#666'} />
          <Text
            style={[
              styles.toolButtonText,
              selectedTool === 'add-table' && styles.toolButtonTextActive,
            ]}
          >
            Table
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, selectedTool === 'add-element' && styles.toolButtonActive]}
          onPress={() => {
            setSelectedTool('add-element');
            setShowElementModal(true);
          }}
        >
          <Plus size={20} color={selectedTool === 'add-element' ? '#fff' : '#666'} />
          <Text
            style={[
              styles.toolButtonText,
              selectedTool === 'add-element' && styles.toolButtonTextActive,
            ]}
          >
            Element
          </Text>
        </TouchableOpacity>

        {selectedElement && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteElement}>
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {currentFloorPlan ? (
        <ScrollView style={styles.canvas} contentContainerStyle={styles.canvasContent}>
          <View
            style={[
              styles.floorPlanCanvas,
              {
                width: currentFloorPlan.width,
                height: currentFloorPlan.height,
              },
            ]}
          >
            {currentFloorPlan.elements.map((element) => (
              <DraggableElement key={element.id} element={element} />
            ))}
            {currentFloorPlan.tables.map((table) => (
              <DraggableTable key={table.id} table={table} />
            ))}
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Tables</Text>
              <Text style={styles.statValue}>{currentFloorPlan.tables.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Capacity</Text>
              <Text style={styles.statValue}>
                {currentFloorPlan.tables.reduce((sum, t) => sum + t.capacity, 0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Active Tables</Text>
              <Text style={styles.statValue}>
                {currentFloorPlan.tables.filter((t) => t.isActive).length}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.deleteFloorPlanButton}
            onPress={handleDeleteFloorPlan}
          >
            <Trash2 size={18} color="#EF4444" />
            <Text style={styles.deleteFloorPlanText}>Delete Floor Plan</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Grid3x3 size={64} color="#ccc" />
          <Text style={styles.emptyText}>No Floor Plans</Text>
          <Text style={styles.emptySubtext}>Create your first floor plan to get started</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowNewPlanModal(true)}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create Floor Plan</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showNewPlanModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Floor Plan</Text>
            <TextInput
              style={styles.input}
              placeholder="Floor Plan Name (e.g., Main Dining)"
              placeholderTextColor="#999"
              value={newPlanName}
              onChangeText={setNewPlanName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowNewPlanModal(false);
                  setNewPlanName('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonCreate}
                onPress={handleCreateFloorPlan}
              >
                <Text style={styles.modalButtonCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTableModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Table</Text>
            <TextInput
              style={styles.input}
              placeholder="Table Name (e.g., T1, A1)"
              placeholderTextColor="#999"
              value={newTable.name}
              onChangeText={(text) => setNewTable({ ...newTable, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Capacity"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={newTable.capacity?.toString()}
              onChangeText={(text) =>
                setNewTable({ ...newTable, capacity: parseInt(text) || 0 })
              }
            />

            <Text style={styles.shapeLabel}>Shape</Text>
            <View style={styles.shapeButtons}>
              <TouchableOpacity
                style={[
                  styles.shapeButton,
                  newTable.shape === 'square' && styles.shapeButtonActive,
                ]}
                onPress={() => setNewTable({ ...newTable, shape: 'square' })}
              >
                <Square
                  size={24}
                  color={newTable.shape === 'square' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.shapeButtonText,
                    newTable.shape === 'square' && styles.shapeButtonTextActive,
                  ]}
                >
                  Square
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.shapeButton,
                  newTable.shape === 'circle' && styles.shapeButtonActive,
                ]}
                onPress={() => setNewTable({ ...newTable, shape: 'circle' })}
              >
                <Circle
                  size={24}
                  color={newTable.shape === 'circle' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.shapeButtonText,
                    newTable.shape === 'circle' && styles.shapeButtonTextActive,
                  ]}
                >
                  Round
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowTableModal(false);
                  setNewTable({
                    name: '',
                    capacity: 4,
                    shape: 'square',
                    width: 60,
                    height: 60,
                  });
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonCreate}
                onPress={handleAddTable}
              >
                <Text style={styles.modalButtonCreateText}>Add Table</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showElementModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowElementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Element</Text>
            
            <Text style={styles.shapeLabel}>Element Type</Text>
            <View style={styles.elementTypeGrid}>
              <TouchableOpacity
                style={[
                  styles.elementTypeButton,
                  newElement.type === 'wall' && styles.elementTypeButtonActive,
                ]}
                onPress={() => setNewElement({ ...newElement, type: 'wall' })}
              >
                <Minus size={20} color={newElement.type === 'wall' ? '#fff' : '#666'} />
                <Text
                  style={[
                    styles.elementTypeText,
                    newElement.type === 'wall' && styles.elementTypeTextActive,
                  ]}
                >
                  Wall
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.elementTypeButton,
                  newElement.type === 'entrance' && styles.elementTypeButtonActive,
                ]}
                onPress={() => setNewElement({ ...newElement, type: 'entrance' })}
              >
                <DoorOpen size={20} color={newElement.type === 'entrance' ? '#fff' : '#666'} />
                <Text
                  style={[
                    styles.elementTypeText,
                    newElement.type === 'entrance' && styles.elementTypeTextActive,
                  ]}
                >
                  Door
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.elementTypeButton,
                  newElement.type === 'bar' && styles.elementTypeButtonActive,
                ]}
                onPress={() => setNewElement({ ...newElement, type: 'bar' })}
              >
                <Grid3x3 size={20} color={newElement.type === 'bar' ? '#fff' : '#666'} />
                <Text
                  style={[
                    styles.elementTypeText,
                    newElement.type === 'bar' && styles.elementTypeTextActive,
                  ]}
                >
                  Bar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.elementTypeButton,
                  newElement.type === 'kitchen' && styles.elementTypeButtonActive,
                ]}
                onPress={() => setNewElement({ ...newElement, type: 'kitchen' })}
              >
                <ChefHat size={20} color={newElement.type === 'kitchen' ? '#fff' : '#666'} />
                <Text
                  style={[
                    styles.elementTypeText,
                    newElement.type === 'kitchen' && styles.elementTypeTextActive,
                  ]}
                >
                  Kitchen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.elementTypeButton,
                  newElement.type === 'restroom' && styles.elementTypeButtonActive,
                ]}
                onPress={() => setNewElement({ ...newElement, type: 'restroom' })}
              >
                <WashingMachine size={20} color={newElement.type === 'restroom' ? '#fff' : '#666'} />
                <Text
                  style={[
                    styles.elementTypeText,
                    newElement.type === 'restroom' && styles.elementTypeTextActive,
                  ]}
                >
                  Restroom
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.elementTypeButton,
                  newElement.type === 'decoration' && styles.elementTypeButtonActive,
                ]}
                onPress={() => setNewElement({ ...newElement, type: 'decoration' })}
              >
                <Sparkles size={20} color={newElement.type === 'decoration' ? '#fff' : '#666'} />
                <Text
                  style={[
                    styles.elementTypeText,
                    newElement.type === 'decoration' && styles.elementTypeTextActive,
                  ]}
                >
                  Decor
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Label (optional)"
              placeholderTextColor="#999"
              value={newElement.label}
              onChangeText={(text) => setNewElement({ ...newElement, label: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowElementModal(false);
                  setNewElement({ type: 'wall' });
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonCreate}
                onPress={handleAddElement}
              >
                <Text style={styles.modalButtonCreateText}>Add Element</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2D6A4F',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#2D6A4F',
    padding: 10,
    borderRadius: 8,
  },
  plansScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 50,
  },
  plansScrollContent: {
    padding: 12,
    gap: 8,
  },
  planTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  planTabActive: {
    backgroundColor: '#2D6A4F',
  },
  planTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  planTabTextActive: {
    color: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  toolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  toolButtonActive: {
    backgroundColor: '#2D6A4F',
  },
  toolButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  toolButtonTextActive: {
    color: '#fff',
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    flex: 1,
  },
  canvasContent: {
    padding: 20,
  },
  floorPlanCanvas: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    position: 'relative',
  },
  table: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  tableCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableCapacityText: {
    fontSize: 11,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1a1a1a',
  },
  deleteFloorPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  deleteFloorPlanText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  shapeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginBottom: 8,
  },
  shapeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  shapeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  shapeButtonActive: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  shapeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  shapeButtonTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#666',
  },
  modalButtonCreate: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
  },
  modalButtonCreateText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  floorElement: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  elementLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
  },
  elementTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  elementTypeButton: {
    width: '31%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  elementTypeButtonActive: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  elementTypeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#666',
  },
  elementTypeTextActive: {
    color: '#fff',
  },
});
