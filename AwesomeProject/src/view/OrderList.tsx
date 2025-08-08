import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../router/Router';

type OrderListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderList'>;
type OrderListScreenRouteProp = RouteProp<RootStackParamList, 'OrderList'>;

type Props = {
  navigation: OrderListScreenNavigationProp;
  route: OrderListScreenRouteProp;
};

interface Order {
  id: string;
  orderNo: string;
  status: string;
  customerName: string;
  totalPrice: number;
  createTime: string;
  items: Array<{ name: string; quantity: number }>;
}

const API_BASE_URL = 'http://192.168.43.51:3000'; // 使用您实际的后端服务器IP

const OrderList: React.FC<Props> = ({ navigation, route }) => {
  const { status } = route.params;
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // 存储所有订单
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 50;  // 将页面大小从10增加到50
  const [currentStatus, setCurrentStatus] = useState(status); // 当前选择的状态
  const [filterMode, setFilterMode] = useState<'filter'|'highlight'>('filter'); // 筛选模式: filter=仅显示选中状态, highlight=高亮选中状态

  // 获取token
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem('storeAdminToken');
      setToken(storedToken);
    };
    getToken();
  }, []);

  // 首次加载
  useEffect(() => {
    if (token) {
      loadAllOrders(true);
    }
  }, [token]);

  // 监听状态变化，应用前端筛选
  useEffect(() => {
    if (allOrders.length > 0) {
      console.log('应用筛选条件:', currentStatus, '筛选模式:', filterMode);
      applyFilter();
    }
  }, [currentStatus, allOrders, filterMode]);

  // 加载所有订单，不根据状态筛选
  const loadAllOrders = async (resetPage = true) => {
    if (resetPage) {
      setLoading(true);
      setPage(1);
      setHasMoreData(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // 检查token
      if (!token) {
        navigation.navigate('StoreLogin');
        return;
      }

      const currentPage = resetPage ? 1 : page;
      
      // 构建API URL
      let apiUrl = `${API_BASE_URL}/api/store-admin/orders?limit=${pageSize}&page=${currentPage}`;
      
      // 如果状态不是"全部"，添加状态过滤参数
      if (currentStatus !== 'all') {
        const backendStatus = mapStatusToBackend(currentStatus);
        apiUrl += `&status=${backendStatus}`;
        console.log('添加状态过滤:', backendStatus);
      }

      console.log('请求API:', apiUrl);
      // 请求后端API获取订单列表
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API响应状态:', response.status);

      if (!response.ok) {
        throw new Error('获取订单列表失败');
      }

      const data = await response.json();

      if (data.code === 0 && data.data && data.data.orders) {
        // 转换后端数据格式为前端所需格式
        const formattedOrders = data.data.orders.map((order: any) => ({
          id: order.orderId,
          orderNo: order.orderNo || `未知订单-${Date.now()}`,
          customerName: order.user?.nickname || '未知客户',
          status: mapStatusToFrontend(order.status || 'paid'),
          items: Array.isArray(order.items) ? order.items.map((item: any) => ({
            name: item.name || '未知物品',
            quantity: item.quantity || 1
          })) : [],
          totalPrice: order.totalPrice || 0,
          createTime: order.createTime ? new Date(order.createTime).toLocaleString() :
            order.createdAt ? new Date(order.createdAt).toLocaleString() :
            new Date().toLocaleString()
        }));

        const newOrders = formattedOrders;
        setHasMoreData(newOrders.length === pageSize);
        
        if (resetPage) {
          setAllOrders(formattedOrders);
        } else {
          setAllOrders(prevOrders => [...prevOrders, ...formattedOrders]);
        }
        
        if (!resetPage) {
          setPage(currentPage + 1);
        }
        
        // 应用当前筛选状态
        applyFilter();
      } else {
        console.error('API返回错误:', data.message);
        // 使用模拟数据
        useMockData();
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
      // 使用模拟数据
      useMockData();
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 应用筛选条件到订单列表
  const applyFilter = () => {
    if (filterMode === 'filter' && currentStatus !== 'all') {
      // 筛选模式: 只显示当前选择状态的订单
      setOrders(allOrders.filter(order => order.status === currentStatus));
    } else {
      // 高亮模式或全部模式: 显示所有订单
      setOrders(allOrders);
    }
  };

  // 加载更多订单
  const loadMoreOrders = () => {
    if (hasMoreData && !loadingMore && !loading) {
      loadAllOrders(false);
    }
  };

  // 渲染底部加载更多指示器
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>加载更多数据...</Text>
      </View>
    );
  };

  // 当API调用失败时使用模拟数据
  const useMockData = () => {
    console.log('使用模拟数据');
    // 生成模拟订单数据
    const mockOrders: Order[] = [];
    const statuses = ['paid', 'processing', 'ready', 'completed'];
    const itemTypes = ['衬衫', '西装', '裤子', '外套', '被子', '床单', '窗帘'];

    // 生成10个订单
    for (let i = 1; i <= 10; i++) {
      const randomStatus = currentStatus === 'all' 
        ? statuses[Math.floor(Math.random() * statuses.length)]
        : currentStatus;
      
      // 生成1-3个随机订单项
      const orderItems = [];
      const itemCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < itemCount; j++) {
        orderItems.push({
          name: itemTypes[Math.floor(Math.random() * itemTypes.length)],
          quantity: Math.floor(Math.random() * 3) + 1
        });
      }

      mockOrders.push({
        id: `order-${i}`,
        orderNo: `NO${Date.now().toString().substring(6)}${i}`,
        status: randomStatus,
        customerName: `客户${i}`,
        totalPrice: Math.floor(Math.random() * 200) + 50,
        createTime: new Date(Date.now() - Math.random() * 10 * 86400000).toLocaleString(),
        items: orderItems
      });
    }

    // 根据状态过滤
    let filteredOrders = mockOrders;
    if (currentStatus !== 'all') {
      filteredOrders = mockOrders.filter(order => order.status === currentStatus);
    }

    // 设置订单数据
    setAllOrders(filteredOrders); // 使用allOrders存储模拟数据
    applyFilter(); // 应用筛选
  };

  // 更新订单状态
  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    try {
      // 确定下一个状态
      let nextStatus;
      switch (currentStatus) {
        case 'paid': nextStatus = 'processing'; break;
        case 'processing': nextStatus = 'ready'; break;
        case 'ready': nextStatus = 'completed'; break;
        default: return;
      }
      
      // 调用API更新状态
      const response = await fetch(`${API_BASE_URL}/api/store-admin/order/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({ status: mapStatusToBackend(nextStatus) })
      });

      const data = await response.json();

      if (data.code === 0) {
        Alert.alert('成功', '订单状态更新成功');
        // 重新加载订单数据
        loadAllOrders(); // 重新加载所有订单
      } else {
        Alert.alert('失败', data.message || '状态更新失败');
      }
    } catch (error) {
      console.error('更新订单状态失败:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    }
  };

  // 状态映射函数
  const mapStatusToBackend = (frontendStatus: string): string => {
    switch (frontendStatus) {
      case 'paid': return 'paid';
      case 'toPickup': return 'toPickup';
      case 'pickedUp': return 'pickedUp';
      case 'sorting': return 'sorting';
      case 'washing': return 'washing';
      case 'drying': return 'drying';
      case 'ironing': return 'ironing';
      case 'packaging': return 'packaging';
      case 'ready': return 'ready';
      case 'delivering': return 'delivering';
      case 'completed': return 'completed';
      case 'all': return 'all';
      default: return 'all';
    }
  };

  const mapStatusToFrontend = (backendStatus: string): string => {
    // 旧状态到新状态的映射
    switch (backendStatus) {
      case 'pending': return 'paid'; // 将pending视为paid
      case 'paid': return 'paid';
      case 'processing': return 'washing'; // 将旧的processing映射到新的washing
      case 'toPickup': return 'toPickup';
      case 'pickedUp': return 'pickedUp';
      case 'sorting': return 'sorting';
      case 'washing': return 'washing';
      case 'drying': return 'drying';
      case 'ironing': return 'ironing';
      case 'packaging': return 'packaging';
      case 'ready': return 'ready';
      case 'delivering': return 'delivering';
      case 'completed': return 'completed';
      case 'cancelled': return 'completed'; // 将cancelled视为completed
      default: return backendStatus;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '待处理';
      case 'toPickup': return '待取衣';
      case 'pickedUp': return '已取衣';
      case 'sorting': return '分拣中';
      case 'washing': return '洗涤中';
      case 'drying': return '烘干中';
      case 'ironing': return '熨烫中';
      case 'packaging': return '包装中';
      case 'ready': return '待取件';
      case 'delivering': return '配送中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#FF9800';         // 橙色
      case 'toPickup': return '#FFC107';     // 琥珀色
      case 'pickedUp': return '#8BC34A';     // 淡绿色
      case 'sorting': return '#00BCD4';      // 青色
      case 'washing': return '#03A9F4';      // 淡蓝色
      case 'drying': return '#2196F3';       // 蓝色
      case 'ironing': return '#673AB7';      // 深紫色
      case 'packaging': return '#9C27B0';    // 紫色
      case 'ready': return '#4CAF50';        // 绿色
      case 'delivering': return '#795548';   // 棕色
      case 'completed': return '#757575';    // 灰色
      default: return '#000000';             // 黑色
    }
  };

  // 切换订单状态
  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    // 应用筛选通过useEffect处理
  };

  // 切换筛选模式
  const toggleFilterMode = () => {
    setFilterMode(prev => prev === 'filter' ? 'highlight' : 'filter');
  };

  // 修复renderOrderItem函数，使用现有的样式名称
  const renderOrderItem = ({ item, isHighlighted }: { item: Order, isHighlighted?: boolean }) => (
    <TouchableOpacity 
      style={[
        styles.orderItem,
        isHighlighted && styles.highlightedOrderItem
      ]}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNo}>{item.orderNo}</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <View style={styles.customerRow}>
        <Text style={styles.customerName}>客户: {item.customerName}</Text>
        <Text style={styles.orderTime}>{item.createTime}</Text>
      </View>
      <View style={styles.itemsContainer}>
        {item.items.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.itemText}>
            {orderItem.name} x {orderItem.quantity}
          </Text>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.itemText}>... 等{item.items.length}件商品</Text>
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>¥{item.totalPrice.toFixed(2)}</Text>
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
        >
          <Text style={styles.buttonText}>查看详情</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>订单列表</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => loadAllOrders(true)}
        >
          <Text style={styles.refreshText}>刷新</Text>
        </TouchableOpacity>
      </View>

      {/* 筛选模式切换 */}
      <View style={styles.filterModeContainer}>
        <TouchableOpacity onPress={toggleFilterMode} style={styles.filterModeButton}>
          <Text style={styles.filterModeText}>
            当前模式: {filterMode === 'filter' ? '筛选' : '全部显示'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 添加筛选栏 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              currentStatus === 'all' && styles.filterTabActive
            ]}
            onPress={() => handleStatusChange('all')}
          >
            <Text style={[
              styles.filterText, 
              currentStatus === 'all' && styles.filterTextActive
            ]}>全部</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              currentStatus === 'paid' && styles.filterTabActive
            ]}
            onPress={() => handleStatusChange('paid')}
          >
            <Text style={[
              styles.filterText, 
              currentStatus === 'paid' && styles.filterTextActive
            ]}>待处理</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              currentStatus === 'toPickup' && styles.filterTabActive
            ]}
            onPress={() => handleStatusChange('toPickup')}
          >
            <Text style={[
              styles.filterText, 
              currentStatus === 'toPickup' && styles.filterTextActive
            ]}>待取衣</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              currentStatus === 'pickedUp' && styles.filterTabActive
            ]}
            onPress={() => handleStatusChange('pickedUp')}
          >
            <Text style={[
              styles.filterText, 
              currentStatus === 'pickedUp' && styles.filterTextActive
            ]}>已取衣</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              (currentStatus === 'sorting' || 
               currentStatus === 'washing' || 
               currentStatus === 'drying' || 
               currentStatus === 'ironing' || 
               currentStatus === 'packaging') && styles.filterTabActive
            ]}
            onPress={() => handleStatusChange('washing')}
          >
            <Text style={[
              styles.filterText, 
              (currentStatus === 'sorting' || 
               currentStatus === 'washing' || 
               currentStatus === 'drying' || 
               currentStatus === 'ironing' || 
               currentStatus === 'packaging') && styles.filterTextActive
            ]}>洗护中</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              currentStatus === 'ready' && styles.filterTabActive
            ]}
            onPress={() => handleStatusChange('ready')}
          >
            <Text style={[
              styles.filterText, 
              currentStatus === 'ready' && styles.filterTextActive
            ]}>待取件</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              currentStatus === 'delivering' && styles.filterTabActive
            ]}
            onPress={() => handleStatusChange('delivering')}
          >
            <Text style={[
              styles.filterText, 
              currentStatus === 'delivering' && styles.filterTextActive
            ]}>配送中</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterTab, 
              currentStatus === 'completed' && styles.filterTabActive
            ]}
            onPress={() => handleStatusChange('completed')}
          >
            <Text style={[
              styles.filterText, 
              currentStatus === 'completed' && styles.filterTextActive
            ]}>已完成</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载订单中...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无订单数据</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={({item}) => renderOrderItem({
            item, 
            isHighlighted: filterMode === 'highlight' && currentStatus !== 'all' && item.status === currentStatus
          })}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.2}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
};

// styles保持不变
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
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
  refreshButton: {
    padding: 5
  },
  refreshText: {
    color: 'white',
    fontSize: 16
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#666'
  },
  listContainer: {
    padding: 10
  },
  orderItem: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  orderNo: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500'
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  customerName: {
    fontSize: 14,
    color: '#333'
  },
  orderTime: {
    fontSize: 12,
    color: '#666'
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 10,
    marginBottom: 10
  },
  itemText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30'
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    height: 60
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666'
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  filterTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f2f2f2'
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666'
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500'
  },
  filterModeContainer: {
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'flex-end'
  },
  filterModeButton: {
    padding: 5,
  },
  filterModeText: {
    fontSize: 12,
    color: '#666'
  },
  highlightedOrderItem: {
    borderLeftWidth: 5,
    borderLeftColor: '#007AFF',
    backgroundColor: '#f0f8ff'
  },
  detailButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  }
});

export default OrderList; 