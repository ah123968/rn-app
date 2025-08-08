import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
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

const OrderList: React.FC<Props> = ({ navigation, route }) => {
  const { status } = route.params;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [status]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // 获取管理员信息
      const infoStr = await AsyncStorage.getItem('storeAdminInfo');
      if (!infoStr) {
        navigation.navigate('StoreLogin');
        return;
      }

      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 生成模拟订单数据
      const mockOrders: Order[] = [];
      const statuses = ['paid', 'processing', 'ready', 'completed'];
      const itemTypes = ['衬衫', '西装', '裤子', '外套', '被子', '床单', '窗帘'];

      // 生成10个订单
      for (let i = 1; i <= 10; i++) {
        const randomStatus = status === 'all' 
          ? statuses[Math.floor(Math.random() * statuses.length)]
          : status;
        
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
      if (status !== 'all') {
        filteredOrders = mockOrders.filter(order => order.status === status);
      }

      // 设置订单数据
      setOrders(filteredOrders);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '待处理';
      case 'processing': return '处理中';
      case 'ready': return '待取件';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#FF9800';
      case 'processing': return '#2196F3';
      case 'ready': return '#4CAF50';
      case 'completed': return '#757575';
      default: return '#000000';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNo}>{item.orderNo}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <Text style={styles.customerName}>客户: {item.customerName}</Text>
        <Text style={styles.orderTime}>{item.createTime}</Text>
      </View>

      <View style={styles.itemsContainer}>
        {item.items.map((orderItem, index) => (
          <Text key={index} style={styles.itemText}>
            {orderItem.name} x {orderItem.quantity}
          </Text>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>¥{item.totalPrice.toFixed(2)}</Text>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            { backgroundColor: getStatusColor(item.status) }
          ]}
        >
          <Text style={styles.actionText}>
            {item.status === 'paid' ? '接单处理' : 
             item.status === 'processing' ? '完成处理' : 
             item.status === 'ready' ? '确认取件' : '查看详情'}
          </Text>
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
        <Text style={styles.title}>
          {status === 'all' ? '全部订单' : 
           status === 'paid' ? '待处理订单' : 
           status === 'processing' ? '处理中订单' : 
           status === 'ready' ? '待取件订单' : 
           status === 'completed' ? '已完成订单' : '订单列表'}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadOrders}
        >
          <Text style={styles.refreshText}>刷新</Text>
        </TouchableOpacity>
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
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

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
  }
});

export default OrderList; 