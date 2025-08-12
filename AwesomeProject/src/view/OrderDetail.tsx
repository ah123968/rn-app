import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image
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

const API_BASE_CANDIDATES = [
  'http://192.168.43.51:3000', // 局域网IP
  'http://10.0.2.2:3000',      // Android 模拟器访问宿主机
  'http://127.0.0.1:3000'      // 同机直连
];

const OrderDetail: React.FC<Props> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [apiBase, setApiBase] = useState<string>(API_BASE_CANDIDATES[0]);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [pickupInput, setPickupInput] = useState('');
  const [plannedNext, setPlannedNext] = useState<string | null>(null);
  const [plannedCurrent, setPlannedCurrent] = useState<string | null>(null);
  
  // 多源二维码服务，自动回退
  const getQrCandidates = (code: string) => [
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code || '')}`,
    `https://quickchart.io/qr?text=${encodeURIComponent(code || '')}&size=200`,
  ];
  const [qrIndex, setQrIndex] = useState(0);
  const [qrError, setQrError] = useState<string | null>(null);

  // 长按二维码：识别并预填取件码（仅在 toPickup 状态可用）
  const handleQrLongPress = async () => {
    if (!order) return;
    try {
      setLoading(true);
      if (!token) {
        navigation.navigate('StoreLogin');
        return;
      }
      // 获取最新状态
      const { resp: orderResponse } = await fetchWithFallback(`/api/store-admin/orders?limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });
      const orderData = await orderResponse.json();
      const orderDetail = orderData.data?.orders?.find((o: any) => o.orderId === order.id);
      const backendStatus = orderDetail?.status;
      if (backendStatus === 'toPickup') {
        setPlannedCurrent('toPickup');
        setPlannedNext('pickedUp');
        setPickupInput(order.pickupCode);
        setPickupModalVisible(true);
      } else {
        Alert.alert('提示', `当前状态为 ${backendStatus || '未知'}，不可直接取衣`);
      }
    } catch (e) {
      Alert.alert('识别失败', e instanceof Error ? e.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

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

  // 带候选基址的请求封装
  const fetchWithFallback = async (path: string, init: RequestInit): Promise<{ resp: Response, base: string }> => {
    let lastErr: any = null;
    for (const base of [apiBase, ...API_BASE_CANDIDATES.filter(b => b !== apiBase)]) {
      try {
        const resp = await fetch(`${base}${path}`, init);
        // 返回任何有效响应（即使是非200，方便上层处理）
        if (resp) return { resp, base };
      } catch (e) {
        lastErr = e;
        console.log('请求失败，尝试下一个基址:', base, e instanceof Error ? e.message : String(e));
      }
    }
    throw lastErr || new Error('网络请求失败');
  };

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      // 检查token
      if (!token) {
        navigation.navigate('StoreLogin');
        return;
      }

      // 请求后端API获取订单列表（带候选基址）
      const { resp: response, base } = await fetchWithFallback(`/api/store-admin/orders?limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (base !== apiBase) {
        console.log('切换API基址为:', base);
        setApiBase(base);
      }

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
 
  // 凭取件码取衣（paid -> processing），调用后端专用接口
  const handleTakePickup = async () => {
    if (!order) return;
    try {
      setLoading(true);
      if (!token) {
        navigation.navigate('StoreLogin');
        return;
      }
      // 先读取最新状态
      const { resp: listResp, base } = await fetchWithFallback(`/api/store-admin/orders?limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (base !== apiBase) setApiBase(base);
      if (!listResp.ok) {
        throw new Error(`获取订单状态失败: ${listResp.status}`);
      }
      const listData = await listResp.json();
      const latest = listData?.data?.orders?.find((o: any) => o.orderId === order.id);
      let current = latest?.status || 'paid';
      console.log('取衣-当前后端状态:', current);

      const processingSet = new Set(['toPickup','pickedUp','sorting','washing','drying','ironing','packaging']);
      // 目标：初始阶段到 toPickup；处理中阶段到 ready；ready 到 completed
      let goal: string;
      if (current === 'pending' || current === 'paid') goal = 'toPickup';
      else if (processingSet.has(current)) goal = 'ready';
      else if (current === 'ready') goal = 'completed';
      else if (current === 'completed') {
        Alert.alert('提示', '订单已完成');
        return;
      } else {
        Alert.alert('提示', `当前状态为 ${current}，无法执行该操作`);
        return;
      }

      // 合法的下一步映射
      const nextMap: Record<string, string | undefined> = {
        pending: 'paid',
        paid: 'toPickup',
        toPickup: 'pickedUp',
        pickedUp: 'sorting',
        sorting: 'washing',
        washing: 'drying',
        drying: 'ironing',
        ironing: 'packaging',
        packaging: 'ready',
        ready: 'completed'
      };

      // 计算完整路径
      const steps: string[] = [];
      let cursor: string | undefined = current;
      while (cursor && cursor !== goal) {
        const next = nextMap[cursor];
        if (!next) break;
        steps.push(next);
        cursor = next;
      }

      if (steps.length === 0) {
        Alert.alert('提示', '无需变更');
        await loadOrderDetail();
        return;
      }

      // 逐步执行每个合法状态更新
      for (const next of steps) {
        const { resp } = await fetchWithFallback(`/api/store-admin/order/${order.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: next, _allowPendingToProcessing: true, currentStatus: current })
        });
        const txt = await resp.text();
        console.log('取衣状态更新响应:', current, '->', next, resp.status, txt);
        const data = (() => { try { return JSON.parse(txt); } catch { return null; } })();
        if (!(resp.ok && data?.code === 0)) {
          throw new Error(data?.message || `服务器错误: ${resp.status}`);
        }
        current = next;
      }

      Alert.alert('成功', `状态已更新至 ${current}`);
      await loadOrderDetail();
    } catch (e) {
      console.error('取衣失败:', e);
      Alert.alert('取件失败', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const performStatusUpdate = async (backendStatus: string, nextBackendStatus: string) => {
    const { resp: response } = await fetchWithFallback(`/api/store-admin/order/${order!.id}/status`, {
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
    const responseText = await response.text();
    console.log(`API响应状态: ${response.status}`);
    console.log(`API响应内容: ${responseText}`);
    let responseData: any;
    try { responseData = JSON.parse(responseText); } catch {}
    if (response.ok && responseData && responseData.code === 0) {
      Alert.alert('成功', `状态已更新至 ${nextBackendStatus}`);
      setOrder(prev => prev ? { ...prev, status: mapStatusToFrontend(nextBackendStatus) } : null);
      setTimeout(() => { loadOrderDetail(); }, 300);
    } else {
      const errorMsg = responseData?.message || `服务器错误: ${response.status}`;
      console.error('更新状态失败:', errorMsg);
      Alert.alert('更新失败', errorMsg);
    }
  };

  // 更新订单状态（单步推进到下一个合法状态）
  const handleUpdateStatus = async () => {
    if (!order) return;

    try {
      setLoading(true);
      if (!token) {
        navigation.navigate('StoreLogin');
        return;
      }

      // 获取最新状态
      const { resp: orderResponse, base } = await fetchWithFallback(`/api/store-admin/orders?limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });
      if (base !== apiBase) setApiBase(base);

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

      // 定义单步“下一步”映射（优先路径）
      const nextMap: Record<string, string | undefined> = {
        pending: 'paid',
        paid: 'toPickup',
        toPickup: 'pickedUp',
        pickedUp: 'sorting',
        sorting: 'washing',
        washing: 'drying',
        drying: 'ironing',
        ironing: 'packaging',
        packaging: 'ready',
        ready: 'completed',
        delivering: 'completed',
        // 兼容旧聚合态
        processing: 'ready'
      };

      const nextBackendStatus = nextMap[backendStatus];
      if (!nextBackendStatus) {
        Alert.alert('提示', `当前状态为 ${backendStatus}，无法推进`);
        setLoading(false);
        return;
      }

      console.log(`准备更新状态: ${backendStatus} -> ${nextBackendStatus}`);

      // 只有从 toPickup 推进到 pickedUp 需要输入取件码
      if (backendStatus === 'toPickup' && nextBackendStatus === 'pickedUp') {
        setPlannedCurrent(backendStatus);
        setPlannedNext(nextBackendStatus);
        setPickupInput('');
        setPickupModalVisible(true);
      } else {
        await performStatusUpdate(backendStatus, nextBackendStatus);
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
      case 'toPickup': return 'toPickup';
      case 'processing': return 'processing';
      case 'ready': return 'ready';
      case 'completed': return 'completed';
      case 'pending': return 'paid';
      case 'cancelled': return 'completed';
      case 'pickedUp': return 'processing';
      case 'sorting': return 'processing';
      case 'washing': return 'processing';
      case 'drying': return 'processing';
      case 'ironing': return 'processing';
      case 'packaging': return 'processing';
      case 'delivering': return 'ready';
      default: return backendStatus;
    }
  };

  const mapStatusToBackend = (frontendStatus: string): string => {
    switch (frontendStatus) {
      case 'paid': return 'paid';
      case 'toPickup': return 'toPickup';
      case 'processing': return 'processing';
      case 'ready': return 'ready';
      case 'completed': return 'completed';
      default: return frontendStatus;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '待处理';
      case 'toPickup': return '待取衣';
      case 'processing': return '处理中';
      case 'ready': return '待取件';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#FF9800';
      case 'toPickup': return '#FFC107';
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
          {!!order.pickupCode && (
            <View style={styles.qrContainer}>
              {!qrError ? (
                <TouchableOpacity activeOpacity={0.9} onLongPress={handleQrLongPress}>
                  <Image
                    source={{ uri: getQrCandidates(order.pickupCode)[qrIndex] }}
                    style={styles.qrImage}
                    resizeMode="contain"
                    onError={() => {
                      // 切换到下一个二维码源
                      if (qrIndex + 1 < getQrCandidates(order.pickupCode).length) {
                        setQrIndex(qrIndex + 1);
                      } else {
                        setQrError('二维码加载失败，请检查网络');
                      }
                    }}
                  />
                </TouchableOpacity>
              ) : (
                <Text style={styles.qrError}>{qrError}</Text>
              )}
              <Text style={styles.qrHint}>请扫描二维码核验取件码（长按二维码可自动识别/填充）</Text>
            </View>
          )}
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

        {/* 操作区域：单步推进 */}
        {order.status !== 'completed' && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateStatus}>
              <Text style={styles.updateButtonText}>推进下一步</Text>
            </TouchableOpacity>
          </View>
        )}
       
      </ScrollView>

      {/* 取件码输入弹窗（仅 toPickup -> pickedUp） */}
      <Modal visible={pickupModalVisible} transparent animationType="fade" onRequestClose={() => setPickupModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>输入取件码</Text>
            <Text style={styles.modalHint}>请核对客户提供的取件码</Text>
            <TextInput
              value={pickupInput}
              onChangeText={setPickupInput}
              placeholder="请输入取件码"
              style={styles.modalInput}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setPickupModalVisible(false)}>
                <Text style={styles.modalBtnText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={async () => {
                  const code = (pickupInput || '').trim().toUpperCase();
                  const expect = (order?.pickupCode || '').trim().toUpperCase();
                  if (!code || code !== expect) {
                    Alert.alert('错误', '取件码不正确');
                    return;
                  }
                  setPickupModalVisible(false);
                  if (plannedCurrent && plannedNext) {
                    setLoading(true);
                    try { await performStatusUpdate(plannedCurrent, plannedNext); } finally { setLoading(false); }
                  }
                }}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>确认</Text>
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
  },
  updateButton: {
    width: '100%',
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    marginTop: 10
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCard: {
    width: '82%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  modalHint: {
    color: '#666',
    marginBottom: 10
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginLeft: 10
  },
  modalBtnText: {
    color: '#333',
    fontSize: 15
  },
  modalBtnPrimary: {
    backgroundColor: '#007AFF'
  },
  modalBtnPrimaryText: {
    color: '#fff'
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 10
  },
  qrImage: {
    width: 140,
    height: 140,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff'
  },
  qrHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#666'
  },
  qrError: {
    width: 140,
    height: 140,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#d00',
    fontSize: 12,
    paddingHorizontal: 6
  }
});

export default OrderDetail; 