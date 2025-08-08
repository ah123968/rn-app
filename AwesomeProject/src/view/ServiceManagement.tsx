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

// 定义服务类别和项目接口，与MongoDB中的结构对应
interface ServiceItem {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  unit: string;
  description?: string;
  processingTime?: number;
  fabricTypes?: string[];
}

interface ServiceCategory {
  _id?: string;
  id?: string;
  name: string;
  items: ServiceItem[];
}

interface Service {
  _id?: string;
  id: string;
  name: string;
  description: string;
  icon?: string;
  serviceType?: string;
  categories?: ServiceCategory[];
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
  
  // 分类和服务项目表单字段
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ServiceCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [categoryIndex, setCategoryIndex] = useState(-1);
  
  // 服务项目表单字段
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<ServiceItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemUnit, setItemUnit] = useState('件');
  const [itemDescription, setItemDescription] = useState('');
  const [itemProcessingTime, setItemProcessingTime] = useState('');
  const [itemFabricTypes, setItemFabricTypes] = useState('');
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [itemIndex, setItemIndex] = useState(-1);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');

      // 获取认证Token
      const token = await AsyncStorage.getItem('storeAdminToken');
      console.log('ServiceManagement: 获取token状态:', token ? '成功' : '失败');
      console.log('ServiceManagement: token值:', token?.substring(0, 10) + '...');
      
      if (!token) {
        console.log('ServiceManagement: 未找到token，重定向到登录页');
        navigation.replace('StoreLogin');
        return;
      }

      // 尝试从API加载服务列表
      try {
        console.log('ServiceManagement: 正在请求服务列表...');
        console.log('ServiceManagement: API_BASE_URL:', API_BASE_URL);
        
        const response = await fetch(`${API_BASE_URL}/api/services`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('ServiceManagement: 获取服务列表响应状态:', response.status);
        const responseText = await response.text();
        console.log('ServiceManagement: 原始响应文本:', responseText.substring(0, 300) + '...');
        
        let result;
        try {
          result = JSON.parse(responseText);
          console.log('ServiceManagement: 解析后的JSON数据结构:', Object.keys(result));
          if (result.data) {
            console.log('ServiceManagement: result.data结构:', Object.keys(result.data));
          }
        } catch (parseError) {
          console.error('ServiceManagement: 解析JSON失败:', parseError);
          generateMockServices();
          setError(`JSON解析错误: ${(parseError instanceof Error) ? parseError.message : '无效的JSON'}`);
          setLoading(false);
          return;
        }
        
        if (response.ok) {
          if (result.code === 0) {
            // 检查是否有正确的服务数据结构
            const serviceData = result.data?.services;
            
            if (Array.isArray(serviceData) && serviceData.length > 0) {
              console.log('ServiceManagement: 成功获取服务列表，条目数:', serviceData.length);
              
              // 转换后端数据格式为前端格式
              const formattedServices = serviceData.map((service: any) => {
                console.log('ServiceManagement: 处理服务项:', service.name, '类型:', typeof service);
                
                // 从第一个类别中获取价格（如果有）
                let basePrice = 0;
                if (service.categories && service.categories.length > 0 && 
                    service.categories[0].items && service.categories[0].items.length > 0) {
                  basePrice = service.categories[0].items[0].price || 0;
                }
                
                return {
                  id: service._id || service.id || String(Math.random()),
                  name: service.name || '未命名服务',
                  description: service.description || '无描述',
                  icon: service.icon,
                  serviceType: service.serviceType || service.name === '干洗' ? 'dry' : 
                               service.name === '水洗' ? 'wet' : 'other',
                  categories: service.categories,
                  price: basePrice,
                  isUrgentAvailable: !!service.isUrgentAvailable,
                  urgentFee: service.urgentFee || 0,
                  urgentProcessingTime: service.urgentProcessingTime || 0,
                  isActive: service.isActive !== undefined ? service.isActive : true
                };
              });
              
              console.log('ServiceManagement: 格式化后的服务数据:', formattedServices.length);
              setServices(formattedServices);
              setError(''); // 成功获取数据
            } else {
              console.log('ServiceManagement: API返回空服务列表，使用模拟数据');
              generateMockServices();
              setError('API返回空数据，使用模拟数据');
            }
          } else {
            console.log('ServiceManagement: API返回错误:', result.message);
            generateMockServices();
            setError(`API错误: ${result.message || '未知错误'}`);
          }
        } else {
          console.log('ServiceManagement: API请求失败，HTTP状态:', response.status);
          generateMockServices();
          setError(`API请求失败: HTTP ${response.status}`);
        }
      } catch (fetchError) {
        console.error('ServiceManagement: 获取服务列表失败:', fetchError);
        generateMockServices();
        setError(`网络错误: ${(fetchError instanceof Error) ? fetchError.message : '获取数据失败'}`);
      }
    } catch (error) {
      console.error('ServiceManagement: 加载服务列表失败:', error);
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
    setError('使用模拟数据（非数据库数据）');
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
    setCategories([]); // 重置分类列表
    
    setIsEditing(false);
    setCurrentService(null);
    setModalVisible(true);
  };

  // 打开编辑服务模态框
  const handleEditService = (service: Service) => {
    // 设置表单值
    setName(service.name);
    setDescription(service.description);
    setServiceType(service.serviceType || 'dry');
    setPrice(service.price?.toString() || '');
    setIsUrgentAvailable(service.isUrgentAvailable);
    setUrgentFee(service.urgentFee?.toString() || '');
    setUrgentProcessingTime(service.urgentProcessingTime?.toString() || '');
    setIsActive(service.isActive);
    
    // 设置分类数据
    setCategories(service.categories || []);
    
    setIsEditing(true);
    setCurrentService(service);
    setModalVisible(true);
  };

  // 处理分类相关功能
  const handleAddCategory = () => {
    setCategoryName('');
    setIsEditingCategory(false);
    setCategoryIndex(-1);
    setCurrentCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: ServiceCategory, index: number) => {
    setCategoryName(category.name);
    setIsEditingCategory(true);
    setCategoryIndex(index);
    setCurrentCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = (index: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除此分类及其下的所有服务项目吗？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const newCategories = [...categories];
            newCategories.splice(index, 1);
            setCategories(newCategories);
          }
        }
      ]
    );
  };

  const handleSaveCategory = () => {
    if (!categoryName.trim()) {
      Alert.alert('错误', '分类名称不能为空');
      return;
    }

    if (isEditingCategory && categoryIndex !== -1) {
      // 编辑现有分类
      const newCategories = [...categories];
      newCategories[categoryIndex] = {
        ...newCategories[categoryIndex],
        name: categoryName
      };
      setCategories(newCategories);
    } else {
      // 添加新分类
      const newCategory: ServiceCategory = {
        id: Date.now().toString(),
        name: categoryName,
        items: []
      };
      setCategories([...categories, newCategory]);
    }

    setShowCategoryModal(false);
  };

  // 处理服务项目相关功能
  const handleAddItem = (categoryIndex: number) => {
    setItemName('');
    setItemPrice('');
    setItemUnit('件');
    setItemDescription('');
    setItemProcessingTime('');
    setItemFabricTypes('');
    setIsEditingItem(false);
    setItemIndex(-1);
    setCurrentItem(null);
    setCategoryIndex(categoryIndex);
    setShowItemModal(true);
  };

  const handleEditItem = (item: ServiceItem, categoryIndex: number, itemIndex: number) => {
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemUnit(item.unit || '件');
    setItemDescription(item.description || '');
    setItemProcessingTime(item.processingTime?.toString() || '');
    setItemFabricTypes(item.fabricTypes?.join(', ') || '');
    setIsEditingItem(true);
    setCategoryIndex(categoryIndex);
    setItemIndex(itemIndex);
    setCurrentItem(item);
    setShowItemModal(true);
  };

  const handleDeleteItem = (categoryIndex: number, itemIndex: number) => {
    Alert.alert(
      '确认删除',
      '确定要删除此服务项目吗？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const newCategories = [...categories];
            newCategories[categoryIndex].items.splice(itemIndex, 1);
            setCategories(newCategories);
          }
        }
      ]
    );
  };

  const handleSaveItem = () => {
    if (!itemName.trim()) {
      Alert.alert('错误', '项目名称不能为空');
      return;
    }

    if (!itemPrice || isNaN(Number(itemPrice))) {
      Alert.alert('错误', '请输入有效价格');
      return;
    }

    // 处理面料类型字符串
    const fabricTypesArray = itemFabricTypes.trim() ? 
      itemFabricTypes.split(',').map(item => item.trim()) : 
      [];

    const newItem: ServiceItem = {
      id: currentItem?.id || Date.now().toString(),
      name: itemName,
      price: Number(itemPrice),
      unit: itemUnit,
      description: itemDescription || undefined,
      processingTime: itemProcessingTime ? Number(itemProcessingTime) : undefined,
      fabricTypes: fabricTypesArray.length > 0 ? fabricTypesArray : undefined
    };

    const newCategories = [...categories];
    
    if (isEditingItem && itemIndex !== -1) {
      // 编辑现有项目
      newCategories[categoryIndex].items[itemIndex] = newItem;
    } else {
      // 添加新项目
      newCategories[categoryIndex].items.push(newItem);
    }

    setCategories(newCategories);
    setShowItemModal(false);
  };

  // 保存服务
  const handleSaveService = async () => {
    // 表单验证
    if (!name.trim()) {
      Alert.alert('错误', '服务名称不能为空');
      return;
    }

    if (!description.trim()) {
      Alert.alert('错误', '服务描述不能为空');
      return;
    }

    // 价格检查不再强制要求，因为可能由分类中的服务项目决定
    const hasNoCategories = categories.length === 0;
    if (hasNoCategories && (!price || isNaN(Number(price)))) {
      Alert.alert('错误', '请输入有效价格或添加服务分类');
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

    try {
      setLoading(true);
      
      // 获取认证Token
      const token = await AsyncStorage.getItem('storeAdminToken');
      
      if (!token) {
        Alert.alert('错误', '未登录或会话已过期');
        navigation.replace('StoreLogin');
        return;
      }
      
      // 创建或更新服务对象
      const serviceData: any = {
        id: isEditing && currentService ? currentService.id : `temp-${Date.now()}`,
        name,
        description,
        serviceType,
        isUrgentAvailable,
        ...(isUrgentAvailable && {
          urgentFee: Number(urgentFee),
          urgentProcessingTime: Number(urgentProcessingTime)
        }),
        isActive,
        // 添加分类数据
        categories: categories.map(cat => ({
          name: cat.name,
          items: cat.items.map(item => ({
            name: item.name,
            price: item.price,
            unit: item.unit,
            description: item.description,
            processingTime: item.processingTime,
            fabricTypes: item.fabricTypes
          }))
        }))
      };
      
      // 如果没有分类，使用顶层价格
      if (hasNoCategories && price) {
        serviceData.price = Number(price);
      }
      
      if (isEditing && currentService) {
        // 更新现有服务
        const serviceId = currentService._id || currentService.id;
        console.log('正在更新服务:', serviceId);
        console.log('更新数据:', JSON.stringify(serviceData, null, 2));
        
        const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(serviceData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.code === 0) {
          // 更新本地服务列表
          setServices(prevServices => 
            prevServices.map(s => 
              s.id === currentService.id ? { 
                ...serviceData, 
                _id: serviceId,
                categories: serviceData.categories 
              } : s
            )
          );
          setModalVisible(false);
          Alert.alert('成功', '服务更新成功');
        } else {
          Alert.alert('错误', result.message || '更新服务失败');
        }
      } else {
        // 添加新服务
        console.log('正在添加新服务');
        console.log('新服务数据:', JSON.stringify(serviceData, null, 2));
        
        const response = await fetch(`${API_BASE_URL}/api/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(serviceData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.code === 0) {
          // 添加到本地服务列表
          const newService = result.data;
          setServices(prevServices => [...prevServices, {
            id: newService._id,
            _id: newService._id,
            name: newService.name,
            description: newService.description,
            serviceType: newService.serviceType,
            categories: newService.categories,
            icon: newService.icon,
            price: hasNoCategories ? Number(price) : 
                  newService.categories?.[0]?.items?.[0]?.price || 0,
            isUrgentAvailable: newService.isUrgentAvailable,
            urgentFee: newService.urgentFee,
            urgentProcessingTime: newService.urgentProcessingTime,
            isActive: newService.isActive
          }]);
          setModalVisible(false);
          Alert.alert('成功', '服务添加成功');
        } else {
          Alert.alert('错误', result.message || '添加服务失败');
        }
      }
    } catch (error) {
      console.error('保存服务失败:', error);
      Alert.alert('错误', '保存服务失败，请重试');
    } finally {
      setLoading(false);
    }
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
          onPress: async () => {
            try {
              setLoading(true);
              
              // 获取认证Token
              const token = await AsyncStorage.getItem('storeAdminToken');
              
              if (!token) {
                Alert.alert('错误', '未登录或会话已过期');
                navigation.replace('StoreLogin');
                return;
              }
              
              const serviceId = service._id || service.id;
              console.log('正在删除服务:', serviceId);
              
              const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              
              const result = await response.json();
              
              if (response.ok && result.code === 0) {
                // 从本地列表中移除
                setServices(prevServices => 
                  prevServices.filter(s => s.id !== service.id)
                );
                Alert.alert('成功', '服务已删除');
              } else {
                Alert.alert('错误', result.message || '删除服务失败');
              }
            } catch (error) {
              console.error('删除服务失败:', error);
              Alert.alert('错误', '删除服务失败，请重试');
            } finally {
              setLoading(false);
            }
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
  const renderServiceItem = ({ item }: { item: Service }) => {
    // 获取服务的价格范围
    let priceRange = '暂无价格';
    let minPrice = Number.MAX_VALUE;
    let maxPrice = 0;
    
    if (item.categories && item.categories.length > 0) {
      item.categories.forEach(category => {
        if (category.items && category.items.length > 0) {
          category.items.forEach(serviceItem => {
            if (typeof serviceItem.price === 'number') {
              minPrice = Math.min(minPrice, serviceItem.price);
              maxPrice = Math.max(maxPrice, serviceItem.price);
            }
          });
        }
      });
      
      if (minPrice !== Number.MAX_VALUE) {
        priceRange = minPrice === maxPrice ? 
          `¥${minPrice.toFixed(2)}/件` : 
          `¥${minPrice.toFixed(2)}~${maxPrice.toFixed(2)}/件`;
      }
    } else if (item.price) {
      priceRange = `¥${item.price.toFixed(2)}/件`;
    }
    
    // 获取服务类型显示文本
    const getServiceTypeText = () => {
      if (item.serviceType === 'dry' || item.name === '干洗') return '干洗';
      if (item.serviceType === 'wet' || item.name === '水洗') return '水洗';
      return '其他服务';
    };
    
    return (
      <View style={styles.serviceItem} key={item.id}>
        <View style={styles.serviceHeader}>
          <View>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceType}>
              {getServiceTypeText()}
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
          <Text style={styles.price}>{priceRange}</Text>
        </View>
        
        {/* 显示服务类别和项目 */}
        {item.categories && item.categories.length > 0 && (
          <View style={styles.detailsContainer}>
            {item.categories.map((category, catIndex) => (
              <View key={`cat-${item.id}-${catIndex}`} style={styles.categoryContainer}>
                <Text style={styles.categoryName}>{category.name}</Text>
                
                {category.items && category.items.length > 0 && (
                  <View style={styles.itemsContainer}>
                    {category.items.map((serviceItem, itemIndex) => (
                      <View key={`item-${item.id}-${catIndex}-${itemIndex}`} style={styles.serviceItemDetail}>
                        <Text style={styles.itemName}>{serviceItem.name}</Text>
                        <View style={styles.itemPriceRow}>
                          <Text style={styles.itemPrice}>¥{serviceItem.price.toFixed(2)}/{serviceItem.unit || '件'}</Text>
                          {serviceItem.processingTime && (
                            <Text style={styles.processingTime}>约{serviceItem.processingTime}小时</Text>
                          )}
                        </View>
                        
                        {/* 显示布料类型 */}
                        {serviceItem.fabricTypes && serviceItem.fabricTypes.length > 0 && (
                          <View style={styles.fabricTypesContainer}>
                            <Text style={styles.fabricLabel}>适用面料: </Text>
                            <Text style={styles.fabricTypes}>
                              {serviceItem.fabricTypes.join(', ')}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        
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
  };

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
              <Text style={styles.noteText}>注：如添加分类和具体服务项目，此价格将被忽略</Text>
            </View>

            {/* 分类和服务项目编辑区域 */}
            <View style={styles.formGroup}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>服务分类</Text>
                <TouchableOpacity 
                  style={styles.addCategoryButton} 
                  onPress={handleAddCategory}
                >
                  <Text style={styles.addButtonTextSmall}>添加分类</Text>
                </TouchableOpacity>
              </View>

              {categories.length === 0 ? (
                <View style={styles.emptyCategoriesContainer}>
                  <Text style={styles.emptyCategoriesText}>暂无分类，点击"添加分类"按钮创建</Text>
                </View>
              ) : (
                <View style={styles.categoriesList}>
                  {categories.map((category, catIndex) => (
                    <View key={`edit-cat-${catIndex}`} style={styles.categoryEditItem}>
                      <View style={styles.categoryEditHeader}>
                        <Text style={styles.categoryEditName}>{category.name}</Text>
                        <View style={styles.categoryEditActions}>
                          <TouchableOpacity
                            style={[styles.smallActionButton, styles.smallEditButton]}
                            onPress={() => handleEditCategory(category, catIndex)}
                          >
                            <Text style={styles.smallActionButtonText}>编辑</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.smallActionButton, styles.smallDeleteButton]}
                            onPress={() => handleDeleteCategory(catIndex)}
                          >
                            <Text style={styles.smallActionButtonText}>删除</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.smallActionButton, styles.smallAddButton]}
                            onPress={() => handleAddItem(catIndex)}
                          >
                            <Text style={styles.smallActionButtonText}>添加项目</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* 服务项目列表 */}
                      {category.items.length === 0 ? (
                        <Text style={styles.emptyItemsText}>暂无服务项目</Text>
                      ) : (
                        <View style={styles.itemsList}>
                          {category.items.map((item, itemIndex) => (
                            <View key={`edit-item-${catIndex}-${itemIndex}`} style={styles.itemEditItem}>
                              <View style={styles.itemEditRow}>
                                <View style={styles.itemEditInfo}>
                                  <Text style={styles.itemEditName}>{item.name}</Text>
                                  <Text style={styles.itemEditPrice}>
                                    ¥{item.price.toFixed(2)}/{item.unit || '件'}
                                    {item.processingTime && ` · 约${item.processingTime}小时`}
                                  </Text>
                                  {item.fabricTypes && item.fabricTypes.length > 0 && (
                                    <Text style={styles.itemEditFabric}>
                                      适用面料: {item.fabricTypes.join(', ')}
                                    </Text>
                                  )}
                                </View>
                                <View style={styles.itemEditActions}>
                                  <TouchableOpacity
                                    style={[styles.smallActionButton, styles.smallEditButton]}
                                    onPress={() => handleEditItem(item, catIndex, itemIndex)}
                                  >
                                    <Text style={styles.smallActionButtonText}>编辑</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[styles.smallActionButton, styles.smallDeleteButton]}
                                    onPress={() => handleDeleteItem(catIndex, itemIndex)}
                                  >
                                    <Text style={styles.smallActionButtonText}>删除</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
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

      {/* 添加/编辑分类模态框 */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditingCategory ? '编辑分类' : '添加分类'}
            </Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>分类名称</Text>
              <TextInput
                style={styles.input}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="输入分类名称"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveCategory}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 添加/编辑服务项目模态框 */}
      <Modal
        visible={showItemModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditingItem ? '编辑服务项目' : '添加服务项目'}
            </Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>项目名称</Text>
              <TextInput
                style={styles.input}
                value={itemName}
                onChangeText={setItemName}
                placeholder="输入项目名称"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>价格 (元/{itemUnit})</Text>
              <TextInput
                style={styles.input}
                value={itemPrice}
                onChangeText={setItemPrice}
                placeholder="输入价格"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>单位</Text>
              <TextInput
                style={styles.input}
                value={itemUnit}
                onChangeText={setItemUnit}
                placeholder="如：件、套、件/小时"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>项目描述</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={itemDescription}
                onChangeText={setItemDescription}
                placeholder="输入项目描述"
                multiline
                numberOfLines={2}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>处理时间 (小时)</Text>
              <TextInput
                style={styles.input}
                value={itemProcessingTime}
                onChangeText={setItemProcessingTime}
                placeholder="输入处理时间"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>适用面料</Text>
              <TextInput
                style={styles.input}
                value={itemFabricTypes}
                onChangeText={setItemFabricTypes}
                placeholder="如：棉、毛、化纤"
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowItemModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveItem}
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
  categoriesContainer: {
    marginBottom: 10
  },
  categoriesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  categoriesText: {
    fontSize: 14,
    color: '#333'
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
  },
  detailsContainer: {
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 10
  },
  categoryContainer: {
    marginBottom: 15
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  itemsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    padding: 10
  },
  serviceItemDetail: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53935',
    marginRight: 10
  },
  processingTime: {
    fontSize: 12,
    color: '#666'
  },
  fabricTypesContainer: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  fabricLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 5
  },
  fabricTypes: {
    fontSize: 12,
    color: '#333'
  },
  noteText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'right'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  addCategoryButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#007AFF',
    borderRadius: 5
  },
  addButtonTextSmall: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  emptyCategoriesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  emptyCategoriesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  categoriesList: {
    //
  },
  categoryEditItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  categoryEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  categoryEditName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  categoryEditActions: {
    flexDirection: 'row'
  },
  smallActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    marginLeft: 5
  },
  smallEditButton: {
    backgroundColor: '#2196F3'
  },
  smallDeleteButton: {
    backgroundColor: '#F44336'
  },
  smallAddButton: {
    backgroundColor: '#4CAF50'
  },
  smallActionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500'
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 10
  },
  itemsList: {
    //
  },
  itemEditItem: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1
  },
  itemEditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemEditInfo: {
    flex: 1
  },
  itemEditName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3
  },
  itemEditPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53935',
    marginBottom: 3
  },
  itemEditFabric: {
    fontSize: 12,
    color: '#666'
  },
  itemEditActions: {
    flexDirection: 'row'
  }
});

export default ServiceManagement; 