import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get } from '../utils/request';

const TABS = [
  { key: 'pending', label: '待支付' },
  { key: 'toServe', label: '待服务' },
  { key: 'serving', label: '服务中' },
  { key: 'toSign', label: '待签收' },
  { key: 'all', label: '全部订单' },
];

// 后端数据类型与UI类型
type BackendOrder = {
  orderId: string;
  orderNo: string;
  storeName: string;
  status: 'pending' | 'paid' | 'processing' | 'ready' | 'completed' | 'cancelled';
  totalPrice: number;
  createTime: string;
  items: { name: string; quantity: number }[];
};

export type UIOrder = {
  id: string;
  status: 'pending' | 'toServe' | 'serving' | 'toSign' | 'finished' | 'cancelled';
  title: string;
  subtitle: string;
  quantity: number;
  price: number;
  tag: string;
  tagColor: string;
  actions: string[];
  actionColor?: string;
  extra?: string;
};

// 单个订单卡片（memo）
const OrderCard = memo(function OrderCard({
  order,
  activeTab,
  onCancel,
  onDetail,
}: {
  order: UIOrder;
  activeTab: string;
  onCancel: (id: string) => void;
  onDetail: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={styles.cardTitle}>{order.title}</Text>
        <View style={[styles.tag, { borderColor: order.tagColor }]}> 
          <Text style={{ color: order.tagColor, fontSize: 13 }}>{order.tag}</Text>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>{order.subtitle}</Text>
      <Text style={styles.cardSubtitle}>
        商品数量*{order.quantity}
        {order.extra ? ` | ${order.extra}` : ''}
      </Text>
      <View style={styles.divider} />
      <View style={styles.feeRow}>
        <Text style={styles.priceLabel}>
          {activeTab === 'pending' ? '待付费用：' : '实付费用：'}
          <Text style={styles.price}>￥{order.price.toFixed(2)}</Text>
        </Text>
      </View>
      <View style={styles.actionsRowAlone}>
        {order.actions.map((action, idx) => {
          if (action === '取消订单') {
            return (
              <TouchableOpacity
                key={`${order.id}-cancel`}
                style={[
                  styles.actionBtn,
                  idx === order.actions.length - 1 && {
                    backgroundColor: order.actionColor || '#E6A23C',
                    borderWidth: 0,
                  },
                ]}
                onPress={() => onCancel(order.id)}
              >
                <Text
                  style={[
                    styles.actionText,
                    idx === order.actions.length - 1 && { color: '#fff' },
                    idx === order.actions.length - 1 && order.actionColor ? { backgroundColor: 'transparent' } : {},
                  ]}
                >
                  {action}
                </Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={`${order.id}-${action}`}
              style={[
                styles.actionBtn,
                idx === order.actions.length - 1 && {
                  backgroundColor: order.actionColor || '#E6A23C',
                  borderWidth: 0,
                },
              ]}
              onPress={() => {
                if (action === '订单详情') onDetail(order.id);
              }}
            >
              <Text
                style={[
                  styles.actionText,
                  idx === order.actions.length - 1 && { color: '#fff' },
                  idx === order.actions.length - 1 && order.actionColor ? { backgroundColor: 'transparent' } : {},
                ]}
              >
                {action}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const OrdersScreen = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [_cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<UIOrder[]>([]);
  const navigation = useNavigation();

  const handleCancelPress = useCallback((orderId: string) => {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
  }, []);

  const handleContinueCancel = useCallback(() => {
    setShowCancelModal(false);
    setCancelOrderId(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowCancelModal(false);
    setCancelOrderId(null);
  }, []);

  const backendStatusForTab: Record<string, string | undefined> = {
    pending: 'pending',
    toServe: 'paid',
    serving: 'processing',
    toSign: 'ready',
    all: undefined,
  };

  const uiOrderFromBackend = (o: BackendOrder): UIOrder => {
    const qty = o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0;
    const base = {
      id: o.orderId,
      title: '洗护订单',
      subtitle: `门店：${o.storeName || '未知门店'}`,
      quantity: qty,
      price: o.totalPrice,
      tagColor: '#409EFF',
    } as Partial<UIOrder>;
    switch (o.status) {
      case 'pending':
        return {
          ...base,
          status: 'pending',
          tag: '等待付款',
          actions: ['取消订单', '订单详情', '立即付款'],
          actionColor: '#E6A23C',
        } as UIOrder;
      case 'paid':
        return {
          ...base,
          status: 'toServe',
          tag: '等待取件',
          actions: ['取消订单', '订单详情', '预约变更'],
        } as UIOrder;
      case 'processing':
        return {
          ...base,
          status: 'serving',
          tag: '订单洗护',
          actions: ['订单详情'],
        } as UIOrder;
      case 'ready':
        return {
          ...base,
          status: 'toSign',
          tag: '已挂白牌',
          actions: ['订单详情', '取件码'],
          actionColor: '#13CE66',
        } as UIOrder;
      case 'completed':
        return {
          ...base,
          status: 'finished',
          tag: '完成取件',
          actions: ['订单详情', '开发票'],
          actionColor: '#E6A23C',
        } as UIOrder;
      case 'cancelled':
        return {
          ...base,
          status: 'cancelled',
          tag: '已取消',
          actions: ['订单详情'],
        } as UIOrder;
      default:
        return {
          ...base,
          status: 'finished',
          tag: '完成取件',
          actions: ['订单详情'],
        } as UIOrder;
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const tokenStr = await AsyncStorage.getItem('userToken');
      const token = tokenStr ? JSON.parse(tokenStr).token : '';
      const status = backendStatusForTab[activeTab];

      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const params = {
        _t: Date.now(),
        ...(status ? { status } : {}),
      };

      const resp = await get('/order/list', params, headers);
      const res = resp.data;
      if (res.code === 0 && res.data?.orders) {
        const list: UIOrder[] = (res.data.orders as BackendOrder[]).map(uiOrderFromBackend);
        setOrders(list);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error('获取订单列表失败:', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onDetail = useCallback(
    (id: string) => (navigation as any).navigate('Detail', { orderId: id }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: UIOrder }) => (
      <OrderCard order={item} activeTab={activeTab} onCancel={handleCancelPress} onDetail={onDetail} />
    ),
    [activeTab, handleCancelPress, onDetail]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* 顶部Tab栏 */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 订单列表 */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 12 }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={!loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#999' }}>暂无订单</Text>
        ) : null}
      />

      {/* 取消订单弹窗 */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {activeTab === 'pending' ? (
              // 待支付页面：简单确认弹框
              <>
                <Text style={styles.modalTitle}>取消确认</Text>
                <Text style={[styles.modalText, { marginBottom: 32 }]}>确定取消当前订单吗？</Text>
              </>
            ) : (
              // 待服务页面：详细温馨提示弹框
              <>
                <Text style={styles.modalTitle}>温馨提示</Text>
                <Text style={styles.modalText}>
                  亲爱的用户，感谢您使用工匠熊洗护服务，您已使用上门取件服务，为保障服务人员的时间效益，如果在上门前120分钟内取消订单，可能扣除您订单金额一定数额用来弥补取件物流成本，请您谅解！
                </Text>
                <Text style={styles.modalSubTitle}>具体规则如下：</Text>
                <Text style={styles.modalRule}>1、取件前120分钟之外取消，退还100%支付金额。</Text>
                <Text style={styles.modalRule}>2、取件前0-120分钟内取消需扣除10元/次的取件费。</Text>
              </>
            )}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtn} onPress={handleContinueCancel}>
                <Text style={styles.modalBtnText}>继续取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={handleCloseModal}>
                <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>关闭操作</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 48,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#E6A23C',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '400',
  },
  activeTabText: {
    color: '#E6A23C',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#333',
  },
  price: {
    color: '#F56C6C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionsRowAlone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
    marginTop: 0,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  actionText: {
    color: '#333',
    fontSize: 15,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Dimensions.get('window').width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  modalText: {
    fontSize: 16,
    color: '#222',
    marginBottom: 16,
    lineHeight: 22,
  },
  modalSubTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  modalRule: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingVertical: 12,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#222',
    fontSize: 16,
  },
  modalBtnPrimary: {
    backgroundColor: '#1890FF',
    borderColor: '#1890FF',
  },
  modalBtnPrimaryText: {
    color: '#fff',
  },
});

export default OrdersScreen; 