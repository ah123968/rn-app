import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  Modal
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../router/Router';

// API配置
const API_BASE_URL = 'http://192.168.43.51:3000'; // 修改为您后端的实际IP地址

type ServiceManagementScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceManagement'>;

type Props = {
  navigation: ServiceManagementScreenNavigationProp;
};

interface Service {
  id: string;
  name: string;
  description: string;
  serviceType: string;
  price?: number;
  isUrgentAvailable: boolean;
  urgentFee?: number;
  urgentProcessingTime?: number;
  isActive: boolean;
}

const ServiceManagement: React.FC<Props> = ({ navigation }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 表单字段
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('dry');
  const [price, setPrice] = useState('');
  const [isUrgentAvailable, setIsUrgentAvailable] = useState(false);
  const [urgentFee, setUrgentFee] = useState('');
  const [urgentProcessingTime, setUrgentProcessingTime] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');

      // 获取认证Token
      const token = await AsyncStorage.getItem('storeToken');
      if (!token) {
        navigation.replace('StoreLogin');
        return;
      }

      // 尝试从API加载服务列表
      try {
        const response = await fetch(`${API_BASE_URL}/api/services`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        if (response.ok && result.code === 0) {
          setServices(result.data.services || []);
        } else {
          // API请求失败，使用模拟数据
          generateMockServices();
        }
      } catch (fetchError) {
        console.error('获取服务列表失败:', fetchError);
        // 使用模拟数据
        generateMockServices();
      }
    } catch (error) {
      console.error('加载服务列表失败:', error);
      setError('加载服务列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成模拟服务数据
  const generateMockServices = () => {
    const mockServices: Service[] = [
      {
        id: '1',
        name: '干洗',
        description: '专业干洗服务',
        serviceType: 'dry',
        price: 30,
        isUrgentAvailable: true,
        urgentFee: 20,
        urgentProcessingTime: 4,
        isActive: true
      },
      {
        id: '2',
        name: '水洗',
        description: '精细水洗服务',
        serviceType: 'wet',
        price: 15,
        isUrgentAvailable: true,
        urgentFee: 15,
        urgentProcessingTime: 3,
        isActive: true
      },
      {
        id: '3',
        name: '熨烫',
        description: '专业熨烫服务',
        serviceType: 'other',
        price: 10,
        isUrgentAvailable: false,
        isActive: true
      },
      {
        id: '4',
        name: '皮具护理',
        description: '高端皮具护理服务',
        serviceType: 'other',
        price: 50,
        isUrgentAvailable: true,
        urgentFee: 30,
        urgentProcessingTime: 6,
        isActive: false
      }
    ];

    setServices(mockServices);
    setError('使用模拟数据');
  };

  // 打开添加服务模态框
  const handleAddService = () => {
    // 重置表单
    setName('');
    setDescription('');
    setServiceType('dry');
    setPrice('');
    setIsUrgentAvailable(false);
    setUrgentFee('');
    setUrgentProcessingTime('');
    setIsActive(true);
    
    setIsEditing(false);
    setCurrentService(null);
    setModalVisible(true);
  };

  // 打开编辑服务模态框
  const handleEditService = (service: Service) => {
    // 设置表单值
    setName(service.name);
    setDescription(service.description);
    setServiceType(service.serviceType);
    setPrice(service.price?.toString() || '');
    setIsUrgentAvailable(service.isUrgentAvailable);
    setUrgentFee(service.urgentFee?.toString() || '');
    setUrgentProcessingTime(service.urgentProcessingTime?.toString() || '');
    setIsActive(service.isActive);
    
    setIsEditing(true);
    setCurrentService(service);
    setModalVisible(true);
  };

  // 保存服务
  const handleSaveService = () => {
    // 表单验证
    if (!name.trim()) {
      Alert.alert('错误', '服务名称不能为空');
      return;
    }

    if (!description.trim()) {
      Alert.alert('错误', '服务描述不能为空');
      return;
    }

    if (!price || isNaN(Number(price))) {
      Alert.alert('错误', '请输入有效价格');
      return;
    }

    if (isUrgentAvailable) {
      if (!urgentFee || isNaN(Number(urgentFee))) {
        Alert.alert('错误', '请输入有效加急费用');
        return;
      }
      if (!urgentProcessingTime || isNaN(Number(urgentProcessingTime))) {
        Alert.alert('错误', '请输入有效加急处理时间');
        return;
      }
    }

    // 创建或更新服务对象
    const serviceData: Service = {
      id: isEditing && currentService ? currentService.id : `mock-${Date.now()}`,
      name,
      description,
      serviceType,
      price: Number(price),
      isUrgentAvailable,
      ...(isUrgentAvailable && {
        urgentFee: Number(urgentFee),
        urgentProcessingTime: Number(urgentProcessingTime)
      }),
      isActive
    };

    // 更新服务列表
    if (isEditing && currentService) {
      // 更新现有服务
      setServices(prevServices => 
        prevServices.map(s => 
          s.id === currentService.id ? serviceData : s
        )
      );
    } else {
      // 添加新服务
      setServices(prevServices => [...prevServices, serviceData]);
    }

    // 关闭模态框
    setModalVisible(false);

    // 显示成功消息
    Alert.alert(
      '成功', 
      isEditing ? '服务更新成功' : '服务添加成功',
      [{ text: 'OK' }]
    );
  };

  // 删除服务
  const handleDeleteService = (service: Service) => {
    Alert.alert(
      '确认删除',
      `确定要删除服务"${service.name}"吗？`,
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setServices(prevServices => 
              prevServices.filter(s => s.id !== service.id)
            );
            Alert.alert('成功', '服务已删除');
          }
        }
      ]
    );
  };

  // 切换服务状态
  const toggleServiceStatus = (service: Service) => {
    setServices(prevServices => 
      prevServices.map(s => 
        s.id === service.id ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  // 渲染服务项
  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceItem}>
      <View style={styles.serviceHeader}>
        <View>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceType}>
            {item.serviceType === 'dry' ? '干洗' : 
             item.serviceType === 'wet' ? '水洗' : '其他服务'}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>状态</Text>
          <Switch
            value={item.isActive}
            onValueChange={() => toggleServiceStatus(item)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={item.isActive ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <Text style={styles.serviceDescription}>{item.description}</Text>
      
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>价格:</Text>
        <Text style={styles.price}>¥{item.price?.toFixed(2)}/件</Text>
      </View>
      
      {item.isUrgentAvailable && (
        <View style={styles.urgentContainer}>
          <Text style={styles.urgentLabel}>加急服务:</Text>
          <Text style={styles.urgentDetails}>
            额外 ¥{item.urgentFee?.toFixed(2)} (约{item.urgentProcessingTime}小时)
          </Text>
        </View>
      )}

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => handleEditService(item)}
        >
          <Text style={styles.actionButtonText}>编辑</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleDeleteService(item)}
        >
          <Text style={styles.actionButtonText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 渲染服务类型选项
  const renderServiceTypeOptions = () => {
    const types = [
      { value: 'dry', label: '干洗' },
      { value: 'wet', label: '水洗' },
      { value: 'other', label: '其他' }
    ];
    
    return (
      <View style={styles.radioGroup}>
        {types.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.radioButton,
              serviceType === type.value && styles.radioButtonSelected
            ]}
            onPress={() => setServiceType(type.value)}
          >
            <Text
              style={[
                styles.radioLabel,
                serviceType === type.value && styles.radioLabelSelected
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载服务列表中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>服务管理</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddService}
        >
          <Text style={styles.addButtonText}>添加</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无服务项目</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleAddService}
          >
            <Text style={styles.emptyButtonText}>添加服务</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* 添加/编辑服务模态框 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? '编辑服务' : '添加服务'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>服务名称</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="输入服务名称"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>服务描述</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="输入服务描述"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>服务类型</Text>
              {renderServiceTypeOptions()}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>价格 (元/件)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="输入价格"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>提供加急服务</Text>
                <Switch
                  value={isUrgentAvailable}
                  onValueChange={setIsUrgentAvailable}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={isUrgentAvailable ? '#007AFF' : '#f4f3f4'}
                />
              </View>
            </View>

            {isUrgentAvailable && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>加急费用 (元)</Text>
                  <TextInput
                    style={styles.input}
                    value={urgentFee}
                    onChangeText={setUrgentFee}
                    placeholder="输入加急费用"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>加急处理时间 (小时)</Text>
                  <TextInput
                    style={styles.input}
                    value={urgentProcessingTime}
                    onChangeText={setUrgentProcessingTime}
                    placeholder="输入处理时间"
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>是否启用</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={isActive ? '#007AFF' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveService}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15
  },
  backButton: {
    padding: 5
  },
  backText: {
    color: 'white',
    fontSize: 16
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  addButton: {
    padding: 5
  },
  addButtonText: {
    color: 'white',
    fontSize: 16
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#FFECB3',
    borderRadius: 5,
    margin: 10
  },
  errorText: {
    color: '#F57C00',
    textAlign: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  },
  listContainer: {
    padding: 10
  },
  serviceItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  serviceType: {
    fontSize: 14,
    color: '#666',
    marginTop: 3
  },
  statusContainer: {
    alignItems: 'center'
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  serviceDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    width: 50
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935'
  },
  urgentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  urgentLabel: {
    fontSize: 14,
    color: '#666',
    width: 70
  },
  urgentDetails: {
    fontSize: 14,
    color: '#FF9800'
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 10
  },
  editButton: {
    backgroundColor: '#2196F3'
  },
  deleteButton: {
    backgroundColor: '#F44336'
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  formGroup: {
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 14
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  radioButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD'
  },
  radioLabel: {
    color: '#666'
  },
  radioLabelSelected: {
    color: '#007AFF',
    fontWeight: '500'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  cancelButtonText: {
    color: '#666'
  },
  saveButton: {
    backgroundColor: '#007AFF'
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500'
  }
});

export default ServiceManagement; 