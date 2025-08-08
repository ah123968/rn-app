import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Alert,
  ToastAndroid,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 导入购物车上下文
import { useCart } from '../utils/CartContext';

// 后端API基础URL - 使用您实际的服务器IP或域名
// Android模拟器访问宿主机
const API_BASE_URL = 'http://192.168.26.1:3000/api'; 
// iOS模拟器访问宿主机
// const API_BASE_URL = 'http://127.0.0.1:3000/api'; 
// 真机访问 - 需要替换为您电脑的实际局域网IP
// const API_BASE_URL = 'http://192.168.1.X:3000/api';

// Define types for navigation
type RootStackParamList = {
  Home: undefined;
  Cart: { service?: Service; category?: ServiceCategory; item?: ServiceItem } | undefined;
  JoinWash: undefined;
  Introduce: undefined;
  Orders: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

// 根据后端模型定义类型
type ServiceItem = {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  unit: string;
  description?: string;
  image?: string;
};

type ServiceCategory = {
  id?: string;
  _id?: string;
  name: string;
  items: ServiceItem[];
};

type Service = {
  id?: string;
  _id?: string;
  name: string;
  icon?: string;
  description?: string;
  categories: ServiceCategory[];
  isActive?: boolean;
};

type Promotion = {
  id: string;
  title: string;
  color: string;
  description?: string;
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 状态管理
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  
  // 当前选择的服务类别
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);

  const { addItem, getTotalItems } = useCart(); // 使用购物车上下文
  const [cartCount, setCartCount] = useState(0); // 跟踪购物车数量

  // 获取所有服务
  const fetchServices = async () => {
    try {
      console.log('开始获取服务数据...');
      
      // 设置请求超时
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('请求超时')), 10000)
      );
      
      // 使用 Promise.race 确保请求不会无限等待
      const response = await Promise.race([
        fetch(`${API_BASE_URL}/services`),
        timeoutPromise
      ]) as Response;
      
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API响应:', result);
      
      if (result.code === 0 && result.data && result.data.services) {
        // 格式化API返回的数据
        const fetchedServices = result.data.services.map((service: any) => ({
          id: service.id || service._id,
          name: service.name,
          icon: service.icon || getServiceIcon(service.name),
          description: service.description || '',
          categories: service.categories || []
        }));
        
        console.log('已获取到服务数据:', fetchedServices);
        setServices(fetchedServices);
        
        // 设置默认选中的服务和类别
        if (fetchedServices.length > 0) {
          setSelectedServiceId(fetchedServices[0].id);
          setSelectedService(fetchedServices[0]);
          if (fetchedServices[0].categories && fetchedServices[0].categories.length > 0) {
            setActiveCategory(fetchedServices[0].categories[0]);
          }
        }
        
        return true;
      } else {
        throw new Error(result.message || '获取服务失败');
      }
    } catch (err: any) {
      console.error('获取服务出错:', err);
      // 如果连接失败，显示错误消息
      setError(`无法连接到服务器: ${err.message}`);
      throw err;
    }
  };

  // 设置促销信息
  const setupPromotions = () => {
    setPromotions([
      { id: '1', title: '洗1泡1赠1', color: '#FF9500', description: '活动期间洗衣享优惠' },
      { id: '2', title: '新用户首单5折', color: '#87CEFA', description: '首次下单最高减免50元' },
      { id: '3', title: '会员日特惠', color: '#98FB98', description: '每周三会员专享折扣' },
    ]);
  };

  // 根据服务名称返回对应图标
  const getServiceIcon = (name: string): string => {
    // 如果已经是完整URL，直接返回
    if (name && (name.startsWith('http://') || name.startsWith('https://'))) {
      return name;
    }

    switch (name) {
      case '干洗': return '👔';
      case '水洗': return '👕';
      case '皮具护理': return '👜';
      case '洗鞋': case '洗鞋修鞋': return '👟';
      case '窗帘清洗': case '家纺清洗': return '🧺';
      case '家电清洗': return '🔌';
      case '洗护上门': case '上门取送': return '🚚';
      case '团体洗护': return '👥';
      case '熨烫服务': return '🔥';
      case '奢侈品护理': return '✨';
      default: return '🧼';
    }
  };

  // 处理服务选择
  const handleServiceSelect = (service: Service) => {
    setSelectedServiceId(service.id || service._id);
    setSelectedService(service);
    if (service.categories && service.categories.length > 0) {
      setActiveCategory(service.categories[0]);
    } else {
      setActiveCategory(null);
    }
  };

  // 处理类别选择
  const handleCategorySelect = (category: ServiceCategory) => {
    setActiveCategory(category);
  };

  // 处理添加到购物车
  const handleAddToCart = (item: ServiceItem) => {
    // 将商品添加到购物车上下文
    addItem({
      id: item.id || item._id || `${item.name}-${Date.now()}`,
      name: item.name,
      price: item.price,
      unit: item.unit,
      image: item.image || '',
      category: activeCategory?.name || '默认分类',
      description: item.description || '',
    }, 1);
    
    // 显示添加成功提示
    if (Platform.OS === 'android') {
      ToastAndroid.show(`已添加${item.name}到购物车`, ToastAndroid.SHORT);
    } else {
      Alert.alert('添加成功', `已添加${item.name}到购物车`);
    }
    
    // 更新购物车数量
    setCartCount(getTotalItems());
  };

  // 重试连接
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    fetchServices()
      .then(() => {
        setupPromotions();
      })
      .catch((err) => {
        console.error('重试获取数据失败:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchServices();
        setupPromotions();
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // 设置轮播定时器
    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => 
        prevSlide === promotions.length - 1 ? 0 : prevSlide + 1
      );
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // 在组件加载和购物车状态变化时更新购物车数量
  useEffect(() => {
    setCartCount(getTotalItems());
  }, [getTotalItems]);

  // 渲染服务类别图标
  const renderServiceIcon = ({ item }: { item: Service }) => {
    // 检查icon是否为URL
    const isIconUrl = item.icon && (typeof item.icon === 'string') && 
      (item.icon.startsWith('http://') || item.icon.startsWith('https://'));
    
    // 根据服务名称选择合适的emoji图标
    let emojiIcon;
    switch (item.name) {
      case '干洗': emojiIcon = '👔'; break;
      case '水洗': emojiIcon = '👕'; break;
      case '皮具护理': emojiIcon = '👜'; break;
      case '洗鞋': case '洗鞋修鞋': emojiIcon = '👟'; break;
      case '窗帘清洗': case '家纺清洗': emojiIcon = '🧺'; break;
      case '家电清洗': emojiIcon = '🔌'; break;
      case '洗护上门': case '上门取送': emojiIcon = '🚚'; break;
      case '团体洗护': emojiIcon = '👥'; break;
      case '熨烫服务': emojiIcon = '🔥'; break;
      case '奢侈品护理': emojiIcon = '✨'; break;
      default: emojiIcon = '🧼'; break;
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.serviceIconContainer,
          selectedServiceId === (item.id || item._id) && styles.selectedServiceIcon
        ]}
        onPress={() => handleServiceSelect(item)}
      >
        {/* 无论是URL还是emoji，都使用emoji显示 */}
        <Text style={styles.serviceIconText}>{emojiIcon}</Text>
        <Text style={styles.serviceIconLabel}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  // 渲染服务类别标签
  const renderCategoryTab = ({ item }: { item: ServiceCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        activeCategory?.id === item.id && styles.activeCategoryTab
      ]}
      onPress={() => handleCategorySelect(item)}
    >
      <Text 
        style={[
          styles.categoryTabText,
          activeCategory?.id === item.id && styles.activeCategoryTabText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // 渲染服务项目
  const renderServiceItem = ({ item }: { item: ServiceItem }) => (
    <View style={styles.serviceItemContainer}>
      <View style={styles.serviceItemInfo}>
        <Text style={styles.serviceItemName}>{item.name}</Text>
        <Text style={styles.serviceItemPrice}>¥{item.price.toFixed(2)}/{item.unit}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddToCart(item)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  // 加载中状态
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e2ac62" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 错误状态
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>重试连接</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 没有数据
  if (services.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>没有找到服务数据</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>重试连接</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 头部横幅 */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>健康洗衣 品质生活</Text>
          
          {/* 购物车计数显示 */}
          {cartCount > 0 && (
            <TouchableOpacity 
              style={styles.cartBadge}
              onPress={() => navigation.navigate('Cart')}
            >
              <Text style={styles.cartIcon}>🛒</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 服务图标网格 */}
        <View style={styles.servicesGrid}>
          <FlatList
            data={services}
            renderItem={renderServiceIcon}
            keyExtractor={(item) => String(item.id || item._id)}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* 促销轮播 */}
        <View style={styles.promotionContainer}>
          <View style={[styles.promotionItem, { backgroundColor: promotions[activeSlide]?.color || '#FF9500' }]}>
            <Text style={styles.promotionTitle}>{promotions[activeSlide]?.title || '促销活动'}</Text>
            <Text style={styles.promotionDescription}>{promotions[activeSlide]?.description || '更多优惠，敬请期待'}</Text>
          </View>
          <View style={styles.promotionDots}>
            {promotions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.promotionDot,
                  index === activeSlide ? styles.activeDot : {}
                ]}
              />
            ))}
          </View>
        </View>

        {/* 服务详情区域 */}
        {selectedService && (
          <View style={styles.serviceDetailContainer}>
            <Text style={styles.serviceDetailTitle}>{selectedService.name}</Text>
            
            {/* 类别选择标签 */}
            {selectedService.categories && selectedService.categories.length > 0 && (
              <View style={styles.categoryTabs}>
                <FlatList
                  data={selectedService.categories}
                  renderItem={renderCategoryTab}
                  keyExtractor={(item) => String(item.id || item._id || Math.random())}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}
            
            {/* 服务项目列表 */}
            {activeCategory && activeCategory.items && activeCategory.items.length > 0 && (
              <View style={styles.serviceItems}>
                {activeCategory.items.map((item) => (
                  <View key={String(item.id || item._id || Math.random())} style={styles.serviceItemContainer}>
                    <View style={styles.serviceItemInfo}>
                      <Text style={styles.serviceItemName}>{item.name}</Text>
                      <Text style={styles.serviceItemPrice}>¥{item.price.toFixed(2)}/{item.unit}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddToCart(item)}
                    >
                      <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 底部信息 */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => navigation.navigate('JoinWash')}
          >
            <Text style={styles.footerButtonText}>加盟咨询</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => navigation.navigate('Introduce')}
          >
            <Text style={styles.footerButtonText}>关于我们</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6347',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#e2ac62',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
  },
  headerBanner: {
    backgroundColor: '#1E90FF',
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  servicesGrid: {
    backgroundColor: 'white',
    paddingVertical: 15,
  },
  serviceIconContainer: {
    alignItems: 'center',
    width: 80,
    paddingVertical: 10,
  },
  selectedServiceIcon: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  serviceIconText: {
    fontSize: 24,
    marginBottom: 5,
  },
  serviceIconLabel: {
    fontSize: 12,
    color: '#333',
  },
  promotionContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  promotionItem: {
    width: width - 30,
    padding: 15,
    borderRadius: 10,
    margin: 15,
    alignItems: 'center',
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  promotionDescription: {
    fontSize: 14,
    color: 'white',
  },
  promotionDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  promotionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    margin: 5,
  },
  activeDot: {
    backgroundColor: '#e2ac62',
  },
  serviceDetailContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  serviceDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryTabs: {
    marginBottom: 15,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  activeCategoryTab: {
    backgroundColor: '#e2ac62',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#333',
  },
  activeCategoryTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  serviceItems: {
    marginTop: 10,
  },
  serviceItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceItemInfo: {
    flex: 1,
  },
  serviceItemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  serviceItemPrice: {
    fontSize: 14,
    color: '#FF6347',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2ac62',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#f5f5f5',
    marginTop: 10,
    marginBottom: 20,
  },
  footerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  footerButtonText: {
    color: '#555',
    fontSize: 14,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  cartIcon: {
    fontSize: 24,
    color: 'white',
  },
  badgeContainer: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
