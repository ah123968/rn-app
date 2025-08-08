import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../router/Router';

type OrderDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

type Props = {
  navigation: OrderDetailScreenNavigationProp;
  route: OrderDetailScreenRouteProp;
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetail {
  id: string;
  orderNo: string;
  status: string;
  customerName: string;
  customerPhone: string;
  address: string;
  totalPrice: number;
  subTotal: number;
  deliveryFee: number;
  discount: number;
  createTime: string;
  payTime?: string;
  estimateCompleteTime?: string;
  items: OrderItem[];
  remarks: string;
  pickupCode: string;
}

const API_BASE_URL = 'http://192.168.43.51:3000'; // 使用您实际的后端服务器IP

const OrderDetail: React.FC<Props> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  
  // 获取token
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem('storeAdminToken');
      setToken(storedToken);
    };
    getToken();
  }, []);

  // 加载订单详情
  useEffect(() => {
    if (token) {
      loadOrderDetail();
    }
  }, [orderId, token]);

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      // 检查token
      if (!token) {
        navigation.navigate('StoreLogin');
        return;
      }

      // 请求后端API获取订单列表
      const response = await fetch(`${API_BASE_URL}/api/store-admin/orders?limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('获取订单详情API状态:', response.status);

      if (!response.ok) {
        throw new Error('获取订单详情失败');
      }

      const data = await response.json();
      console.log('获取到订单数据，寻找ID:', orderId);
      
      if (data.code === 0 && data.data && data.data.orders) {
        // 从列表中找到对应ID的订单
        const foundOrder = data.data.orders.find((o: any) => o.orderId === orderId);
        
        if (foundOrder) {
          console.log('找到对应订单:', foundOrder.orderNo);
          
          // 将后端数据转换为前端需要的格式
          const orderDetail: OrderDetail = {
            id: foundOrder.orderId,
            orderNo: foundOrder.orderNo || `未知订单-${Date.now()}`,
            status: mapStatusToFrontend(foundOrder.status || 'paid'),
            customerName: foundOrder.user?.nickname || '未知客户',
            customerPhone: foundOrder.user?.phone || '未知电话',
            address: foundOrder.address ? 
              `${foundOrder.address.province || ''}${foundOrder.address.city || ''}${foundOrder.address.district || ''}${foundOrder.address.detail || ''}` : 
              '无地址信息',
            totalPrice: foundOrder.totalPrice || 0,
            subTotal: foundOrder.subTotal || foundOrder.totalPrice || 0,
            deliveryFee: foundOrder.deliveryFee || 0,
            discount: foundOrder.discount || 0,
            createTime: foundOrder.createTime ? new Date(foundOrder.createTime).toLocaleString() : 
              foundOrder.createdAt ? new Date(foundOrder.createdAt).toLocaleString() : 
              new Date().toLocaleString(),
            payTime: foundOrder.payTime ? new Date(foundOrder.payTime).toLocaleString() : undefined,
            estimateCompleteTime: foundOrder.estimateCompleteTime ? new Date(foundOrder.estimateCompleteTime).toLocaleString() : undefined,
            items: Array.isArray(foundOrder.items) ? foundOrder.items.map((item: any) => ({
              name: item.name || '未知物品',
              quantity: item.quantity || 1,
              price: item.price || (item.totalPrice ? item.totalPrice / item.quantity : 0)
            })) : [],
            remarks: foundOrder.remark || '',
            pickupCode: foundOrder.pickupCode || '无取件码'
          };
          
          setOrder(orderDetail);
        } else {
          console.log('未找到订单ID:', orderId);
          console.log('可用ID列表:', data.data.orders.map((o: any) => o.orderId).join(', '));
          // 未找到对应订单，使用模拟数据
          useMockData();
        }
      } else {
        console.error('API返回错误:', data.message);
        useMockData();
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      useMockData();
    } finally {
      setLoading(false);
    }
  };

  // 更新订单状态
  const handleUpdateStatus = async () => {
    if (!order) return;

    try {
      // 显示加载提示
      setLoading(true);
      console.log('开始更新订单状态...');

      // 直接获取订单详情而不是列表
      const orderResponse = await fetch(`${API_BASE_URL}/api/store-admin/orders?limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!orderResponse.ok) {
        throw new Error(`获取订单详情失败: ${orderResponse.status}`);
      }

      const orderData = await orderResponse.json();
      const orderDetail = orderData.data?.orders?.find((o: any) => o.orderId === order.id);
      
      if (!orderDetail) {
        throw new Error(`找不到订单ID: ${order.id}`);
      }

      const backendStatus = orderDetail.status;
      console.log(`当前订单状态: ${backendStatus}`);
      
      // 确定下一个状态
      let nextStatus;
      let nextBackendStatus;
      
      // 直接处理各种可能的状态
      if (backendStatus === 'pending' || backendStatus === 'paid') {
        nextBackendStatus = 'processing';
        nextStatus = 'processing';
      } else if (backendStatus === 'processing') {
        nextBackendStatus = 'ready';
        nextStatus = 'ready';
      } else if (backendStatus === 'ready') {
        nextBackendStatus = 'completed';
        nextStatus = 'completed';
      } else {
        Alert.alert('错误', `无法更新当前状态: ${backendStatus}`);
        setLoading(false);
        return;
      }
      
      console.log(`准备更新状态: ${backendStatus} -> ${nextBackendStatus}`);
      
      // 调用API更新状态
      const response = await fetch(`${API_BASE_URL}/api/store-admin/order/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          status: nextBackendStatus,
          _allowPendingToProcessing: true,
          currentStatus: backendStatus
        })
      });
      
      console.log(`API响应状态: ${response.status}`);
      const responseText = await response.text();
      console.log(`API响应内容: ${responseText}`);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('解析响应失败:', e);
      }
      
      if (response.ok && responseData && responseData.code === 0) {
        // 更新成功
        Alert.alert('成功', '订单状态已更新');
        
        // 更新本地状态
        setOrder(prev => prev ? {...prev, status: nextStatus} : null);
        
        // 延迟重新加载详情
        setTimeout(() => {
          loadOrderDetail();
        }, 500);
      } else {
        const errorMsg = responseData?.message || `服务器错误: ${response.status}`;
        console.error('更新状态失败:', errorMsg);
        Alert.alert('更新失败', errorMsg);
      }
    } catch (error) {
      console.error('更新状态出错:', error);
      Alert.alert('错误', `更新状态时发生异常: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // 当API调用失败时使用模拟数据
  const useMockData = () => {
    console.log('使用模拟数据');
    // 模拟订单详情数据
    setOrder({
      id: orderId,
      orderNo: `NO${Date.now().toString().substring(6)}`,
      status: 'processing',
      customerName: '张先生',
      customerPhone: '139****1234',
      address: '北京市朝阳区三里屯SOHO 3号楼1705',
      totalPrice: 125.00,
      subTotal: 125.00,
      deliveryFee: 0,
      discount: 0,
      createTime: '2023-08-01 14:30:45',
      items: [
        { name: '衬衫', quantity: 2, price: 25.00 },
        { name: '西裤', quantity: 1, price: 35.00 },
        { name: '外套', quantity: 1, price: 40.00 }
      ],
      remarks: '请轻柔洗涤，外套需要特殊处理',
      pickupCode: 'AB1234'
    });
  };

  // 状态映射函数
  const mapStatusToFrontend = (backendStatus: string): string => {
    switch (backendStatus) {
      case 'paid': return 'paid';
      case 'processing': return 'processing';
      case 'ready': return 'ready';
      case 'completed': return 'completed';
      case 'pending': return 'paid'; // 将pending视为paid
      case 'cancelled': return 'completed'; // 将cancelled视为completed
      default: return backendStatus;
    }
  };

  const mapStatusToBackend = (frontendStatus: string): string => {
    switch (frontendStatus) {
      case 'paid': return 'paid';
      case 'processing': return 'processing';
      case 'ready': return 'ready';
      case 'completed': return 'completed';
      default: return frontendStatus;
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

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载订单详情中...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>订单不存在或已被删除</Text>
        <TouchableOpacity 
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
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
        <Text style={styles.title}>订单详情</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
          <Text style={styles.orderNo}>订单号: {order.orderNo}</Text>
          <Text style={styles.orderTime}>下单时间: {order.createTime}</Text>
          {order.payTime && (
            <Text style={styles.orderTime}>支付时间: {order.payTime}</Text>
          )}
          <Text style={styles.orderTime}>取件码: {order.pickupCode}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>客户信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>姓名:</Text>
            <Text style={styles.infoValue}>{order.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>电话:</Text>
            <Text style={styles.infoValue}>{order.customerPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>地址:</Text>
            <Text style={styles.infoValue}>{order.address}</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>订单明细</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>¥{item.price.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>小计:</Text>
            <Text style={styles.totalPrice}>¥{order.subTotal.toFixed(2)}</Text>
          </View>
          {order.deliveryFee > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>配送费:</Text>
              <Text style={styles.totalPrice}>¥{order.deliveryFee.toFixed(2)}</Text>
            </View>
          )}
          {order.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>优惠:</Text>
              <Text style={styles.totalPrice}>-¥{order.discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.finalTotalRow]}>
            <Text style={styles.finalTotalLabel}>合计:</Text>
            <Text style={styles.finalTotalPrice}>¥{order.totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {order.remarks ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Text style={styles.remarks}>{order.remarks}</Text>
          </View>
        ) : null}

        {order.status !== 'completed' && (
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[
                styles.actionButton,
                { backgroundColor: getStatusColor(order.status) }
              ]}
              onPress={handleUpdateStatus}
            >
              <Text style={styles.actionText}>
                {order.status === 'paid' ? '接单处理' : 
                order.status === 'processing' ? '完成处理' : 
                order.status === 'ready' ? '确认取件' : '打印订单'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5
  },
  backButtonText: {
    color: 'white',
    fontSize: 16
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
    padding: 5,
    width: 50
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
  content: {
    flex: 1,
    padding: 15
  },
  statusContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 10
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500'
  },
  orderNo: {
    fontSize: 16,
    marginBottom: 5
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  infoLabel: {
    width: 60,
    fontSize: 14,
    color: '#666'
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  itemName: {
    flex: 2,
    fontSize: 14
  },
  itemQuantity: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center'
  },
  itemPrice: {
    flex: 1,
    fontSize: 14,
    textAlign: 'right'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5
  },
  finalTotalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10
  },
  totalPrice: {
    fontSize: 14,
    color: '#333'
  },
  finalTotalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30'
  },
  remarks: {
    fontSize: 14,
    color: '#666'
  },
  actionContainer: {
    marginTop: 10,
    marginBottom: 30,
    alignItems: 'center'
  },
  actionButton: {
    width: '80%',
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  }
});

export default OrderDetail; 