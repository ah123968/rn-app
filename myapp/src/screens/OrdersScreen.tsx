import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';

const TABS = [
  { key: 'pending', label: '待支付' },
  { key: 'toServe', label: '待服务' },
  { key: 'serving', label: '服务中' },
  { key: 'toSign', label: '待签收' },
  { key: 'all', label: '全部订单' },
];

// mock订单数据
const ORDERS = [
  {
    id: '1',
    status: 'pending',
    title: '洗护订单',
    subtitle: '上门取送',
    quantity: 3,
    price: 55,
    tag: '等待付款',
    tagColor: '#409EFF',
    actions: ['取消订单', '订单详情', '立即付款'],
  },
  {
    id: '2',
    status: 'toServe',
    title: '洗护订单',
    subtitle: '上门取送',
    quantity: 3,
    price: 55,
    tag: '等待取件',
    tagColor: '#409EFF',
    actions: ['取消订单', '订单详情', '预约变更'],
  },
  {
    id: '3',
    status: 'toServe',
    title: '洗护订单',
    subtitle: '自主到店',
    quantity: 3,
    price: 55,
    tag: '等待到店',
    tagColor: '#409EFF',
    actions: ['取消订单', '订单详情', '预约变更'],
  },
  {
    id: '4',
    status: 'serving',
    title: '洗护订单',
    subtitle: '上门取送',
    quantity: 3,
    price: 55,
    tag: '订单洗护',
    tagColor: '#409EFF',
    actions: ['订单详情'],
  },
  {
    id: '5',
    status: 'serving',
    title: '洗护订单',
    subtitle: '自主到店',
    quantity: 3,
    price: 55,
    tag: '订单洗护',
    tagColor: '#409EFF',
    extra: '返洗数量*1',
    actions: ['订单详情'],
  },
  {
    id: '6',
    status: 'toSign',
    title: '洗护订单',
    subtitle: '上门取送',
    quantity: 3,
    price: 55,
    tag: '已挂白牌',
    tagColor: '#409EFF',
    actions: ['订单详情', '取件码'],
    actionColor: '#13CE66',
  },
  {
    id: '7',
    status: 'toSign',
    title: '洗护订单',
    subtitle: '自主到店',
    quantity: 3,
    price: 55,
    tag: '已挂白牌',
    tagColor: '#409EFF',
    extra: '返洗数量*1',
    actions: ['订单详情', '取件码'],
    actionColor: '#13CE66',
  },
  {
    id: '8',
    status: 'finished',
    title: '洗护订单',
    subtitle: '上门取送',
    quantity: 3,
    price: 55,
    tag: '完成取件',
    tagColor: '#409EFF',
    extra: '返洗数量*1',
    actions: ['订单详情', '开发票'],
    actionColor: '#E6A23C',
  },
];

const OrdersScreen = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

  const handleCancelPress = (orderId: string) => {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
  };

  const handleContinueCancel = () => {
    // TODO: 这里可以调用取消订单的接口
    setShowCancelModal(false);
    setCancelOrderId(null);
    // 你可以在这里加上Toast或Alert提示
  };

  const handleCloseModal = () => {
    setShowCancelModal(false);
    setCancelOrderId(null);
  };

  const filterOrders = () => {
    if (activeTab === 'all') return ORDERS;
    if (activeTab === 'serving') return ORDERS.filter(o => o.status === 'serving');
    if (activeTab === 'toServe') return ORDERS.filter(o => o.status === 'toServe');
    if (activeTab === 'pending') return ORDERS.filter(o => o.status === 'pending');
    if (activeTab === 'toSign') return ORDERS.filter(o => o.status === 'toSign');
    return [];
  };

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
      <ScrollView style={{ flex: 1 }}>
        {filterOrders().map(order => (
          <View key={order.id} style={styles.card}>
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
            {/* 费用单独一行 */}
            <View style={styles.feeRow}>
              <Text style={styles.priceLabel}>
                {activeTab === 'pending' ? '待付费用：' : '实付费用：'}
                <Text style={styles.price}>￥{order.price.toFixed(2)}</Text>
              </Text>
            </View>
            {/* 按钮组单独一行，横向排列 */}
            <View style={styles.actionsRowAlone}>
              {order.actions.map((action, idx) => {
                if (activeTab === 'pending' && action === '取消订单') {
                  return (
                    <TouchableOpacity
                      key={action}
                      style={[
                        styles.actionBtn,
                        idx === order.actions.length - 1 && {
                          backgroundColor: order.actionColor || '#E6A23C',
                          borderWidth: 0,
                        },
                      ]}
                      onPress={() => handleCancelPress(order.id)}
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
                    key={action}
                    style={[
                      styles.actionBtn,
                      idx === order.actions.length - 1 && {
                        backgroundColor: order.actionColor || '#E6A23C',
                        borderWidth: 0,
                      },
                    ]}
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
        ))}
        {filterOrders().length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#999' }}>暂无订单</Text>
        )}
      </ScrollView>
      {/* 取消订单弹窗 */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>取消确认</Text>
            <Text style={styles.modalText}>确定取消当前订单吗？</Text>
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
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 10,
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
  actionsRowAlone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
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
    marginBottom: 32,
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