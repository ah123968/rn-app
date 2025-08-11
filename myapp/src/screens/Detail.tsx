import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get } from '../utils/request';

type OrderStatus = 'pending' | 'waiting' | 'processing' | 'delivering' | 'completed';

type BackendOrderDetail = {
  orderId: string;
  orderNo: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  status: 'pending' | 'paid' | 'processing' | 'ready' | 'completed' | 'cancelled';
  pickupCode: string;
  createTime: string;
  payTime?: string;
  estimateCompleteTime?: string;
  items: { name: string; price: number; quantity: number; unit?: string }[];
  subTotal: number;
  deliveryFee: number;
  discount: number;
  totalPrice: number;
  paymentMethod: string;
  remark?: string;
};

const Detail = () => {
  const route = useRoute<any>();
  const orderId: string = route?.params?.orderId ? String(route.params.orderId) : '';

  const [_loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState({
    orderNumber: '202006060021025',
    orderTime: '2020-06-06 09:25',
    paymentTime: '2020-06-06 10:25',
    deliveryMethod: '上门取送',
    appointmentTime: '2020-06-06 09:00-10:00',
    remarks: '尽快取件',
    items: [
      {
        id: '1',
        name: '皮面运动鞋',
        price: 50,
        quantity: 1,
        washMark: 'jnfonfjkan01',
        signTime: '2020-06-08 14:40',
      },
      {
        id: '2',
        name: '单皮鞋',
        price: 50,
        quantity: 1,
        washMark: 'jnfonfjkan02',
        signTime: '2020-06-08 14:40',
      },
      {
        id: '3',
        name: '棉皮鞋',
        price: 20,
        quantity: 1,
        washMark: 'jnfonfjkan03',
        signTime: '2020-06-10 14:22',
      },
    ],
    totalAmount: 55,
    paymentMethod: '会员年卡',
    status: 'pending' as OrderStatus,
  });

  const fetchDetail = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const tokenStr = await AsyncStorage.getItem('userToken');
      const token = tokenStr ? JSON.parse(tokenStr).token : '';
      
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      // 添加时间戳避免缓存
      const params = { _t: Date.now() };
      
      const resp = await get(`/order/${orderId}`, params, headers);
      const res = resp.data;
      console.log('订单详情响应:', res); // 添加调试日志
      
      if (res.code === 0 && res.data) {
        const d = res.data as BackendOrderDetail;
        setOrderDetail({
          orderNumber: d.orderNo,
          orderTime: String(d.createTime ?? ''),
          paymentTime: d.payTime ? String(d.payTime) : '',
          deliveryMethod: d.storeName ? '上门取送' : '自主到店',
          appointmentTime: d.estimateCompleteTime || '',
          remarks: d.remark || '',
          items: d.items.map((it, idx) => ({ id: String(idx), name: it.name, price: it.price, quantity: it.quantity, washMark: '', signTime: '' })),
          totalAmount: d.totalPrice,
          paymentMethod: d.paymentMethod || '—',
          status:
            d.status === 'pending'
              ? 'pending'
              : d.status === 'paid'
              ? 'waiting'
              : d.status === 'processing'
              ? 'processing'
              : d.status === 'ready'
              ? 'delivering'
              : 'completed',
        });
      } else {
        console.log('获取订单详情失败:', res);
      }
    } catch (e) {
      console.error('获取订单详情失败:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const statusConfig = {
    pending: {
      icon: '💰',
      text: '待支付',
      color: '#FF6B35',
      actions: ['cancel', 'pay'],
    },
    waiting: {
      icon: '⏰',
      text: '待服务',
      color: '#FF6B35',
      actions: ['cancel', 'change'],
    },
    processing: {
      icon: '⚙️',
      text: '服务中',
      color: '#FF6B35',
      actions: ['contact'],
    },
    delivering: {
      icon: '📦',
      text: '待签收',
      color: '#FF6B35',
      actions: ['contact'],
    },
    completed: {
      icon: '✅',
      text: '已完成',
      color: '#4CAF50',
      actions: ['invoice'],
    },
  };

  const currentStatus = statusConfig[orderDetail.status];

  const handleAction = (action: string) => {
    switch (action) {
      case 'cancel':
        Alert.alert('确认取消', '确定要取消订单吗？', [
          { text: '取消', style: 'cancel' },
          { text: '确定', onPress: () => console.log('订单已取消') },
        ]);
        break;
      case 'pay':
        Alert.alert('支付', '跳转到支付页面');
        break;
      case 'change':
        Alert.alert('预约变更', '跳转到预约变更页面');
        break;
      case 'contact':
        Alert.alert('联系客服', '正在为您转接客服');
        break;
      case 'invoice':
        Alert.alert('开发票', '正在为您开具发票');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>{currentStatus.icon}</Text>
          <Text style={[styles.statusText, { color: currentStatus.color }]}>
            {currentStatus.text}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>订单信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>订单编号：</Text>
            <Text style={styles.infoValue}>{orderDetail.orderNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>下单时间：</Text>
            <Text style={styles.infoValue}>{orderDetail.orderTime}</Text>
          </View>
          {orderDetail.paymentTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>支付时间：</Text>
              <Text style={styles.infoValue}>{orderDetail.paymentTime}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>取送方式：</Text>
            <Text style={styles.infoValue}>{orderDetail.deliveryMethod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>预约时间：</Text>
            <Text style={styles.infoValue}>{orderDetail.appointmentTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>备注：</Text>
            <Text style={styles.infoValue}>{orderDetail.remarks}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>洗护商品</Text>
          {orderDetail.items.map((item, _index) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.washMark && (
                  <Text style={styles.washMark}>水洗唛：{item.washMark}</Text>
                )}
                {item.signTime && (
                  <Text style={styles.signTime}>签收时间：{item.signTime}</Text>
                )}
              </View>
              <View style={styles.itemPrice}>
                <Text style={styles.price}>¥{item.price.toFixed(2)}</Text>
                <Text style={styles.quantity}>数量：{item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>实付费用</Text>
            <Text style={styles.paymentAmount}>¥{orderDetail.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>支付方式</Text>
            <Text style={styles.paymentMethod}>{orderDetail.paymentMethod}</Text>
          </View>
        </View>

        <View style={styles.serviceButtons}>
          <TouchableOpacity
            style={styles.serviceButton}
            onPress={() => handleAction('contact')}
          >
            <Text style={styles.serviceButtonIcon}>📞</Text>
            <Text style={styles.serviceButtonText}>电话咨询</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.serviceButton}
            onPress={() => handleAction('contact')}
          >
            <Text style={styles.serviceButtonIcon}>🎧</Text>
            <Text style={styles.serviceButtonText}>微信客服</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {currentStatus.actions.includes('cancel') && currentStatus.actions.includes('pay') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleAction('cancel')}
          >
            <Text style={styles.cancelButtonText}>取消订单</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => handleAction('pay')}
          >
            <Text style={styles.payButtonText}>立即支付</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStatus.actions.includes('cancel') && currentStatus.actions.includes('change') && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleAction('cancel')}
          >
            <Text style={styles.cancelButtonText}>取消订单</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => handleAction('change')}
          >
            <Text style={styles.changeButtonText}>预约变更</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStatus.actions.includes('invoice') && (
        <TouchableOpacity
          style={styles.invoiceButton}
          onPress={() => handleAction('invoice')}
        >
          <Text style={styles.invoiceButtonText}>开发票</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  statusHeader: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  washMark: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  signTime: {
    fontSize: 12,
    color: '#FF6B35',
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#333',
  },
  serviceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  serviceButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  serviceButtonText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  payButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  changeButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  changeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  invoiceButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  invoiceButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Detail;
