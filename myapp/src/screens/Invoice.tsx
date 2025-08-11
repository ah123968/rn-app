import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { get } from '../utils/request'
import { useNavigation } from '@react-navigation/native'

type BackendOrder = {
  orderId: string;
  orderNo: string;
  storeName: string;
  status: 'pending' | 'paid' | 'processing' | 'ready' | 'completed' | 'cancelled';
  totalPrice: number;
  createTime: string;
  items: { name: string; quantity: number }[];
};

type InvoiceOrder = {
  id: string;
  orderNo: string;
  type: string;
  status: string;
  service: string;
  details: string;
  amount: string;
  createTime: string;
};

export default function Invoice() {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [completedOrders, setCompletedOrders] = useState<InvoiceOrder[]>([])
  const [issuedInvoices] = useState<InvoiceOrder[]>([])
  const navigation = useNavigation<any>()

  const tabs = [
    { id: 0, title: '待开票' },
    { id: 1, title: '已开票' },
    { id: 2, title: '发票抬头' }
  ]

  const invoiceHeaders = [
    {
      company: '山东彩泓网络科技有限公司',
      contact: '孙新民',
      phone: '133****3826'
    }
  ]

  // 从后端获取已完成订单
  const fetchCompletedOrders = useCallback(async () => {
    try {
      setLoading(true)
      const tokenStr = await AsyncStorage.getItem('userToken')
      const token = tokenStr ? JSON.parse(tokenStr).token : ''
      
      const headers: any = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const params = {
        _t: Date.now(),
        status: 'completed'
      }

      const resp = await get('/order/list', params, headers)
      const res = resp.data
      
      if (res.code === 0 && res.data?.orders) {
        const orders: InvoiceOrder[] = (res.data.orders as BackendOrder[]).map(order => ({
          id: order.orderId,
          orderNo: order.orderNo,
          type: '洗护订单',
          status: '完成取件',
          service: '上门取送',
          details: `商品数量*${order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}`,
          amount: `¥${order.totalPrice.toFixed(2)}`,
          createTime: order.createTime
        }))
        setCompletedOrders(orders)
      } else {
        setCompletedOrders([])
      }
    } catch (e) {
      console.error('获取已完成订单失败:', e)
      setCompletedOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompletedOrders()
  }, [fetchCompletedOrders])

  const renderPendingInvoices = () => (
    <ScrollView style={styles.content}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : completedOrders.length > 0 ? (
        completedOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderTitle}>{order.type}</Text>
              <View style={styles.statusTag}>
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>
            <Text style={styles.serviceText}>{order.service}</Text>
            <Text style={styles.detailsText}>{order.details}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.amountLabel}>实付费用:</Text>
              <Text style={styles.amountValue}>{order.amount}</Text>
              <TouchableOpacity style={styles.invoiceButton} onPress={() => navigation.navigate('SetInvoice', { orderId: order.id })}>
                <Text style={styles.invoiceButtonText}>开发票</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无待开票订单</Text>
        </View>
      )}
    </ScrollView>
  )

  const renderIssuedInvoices = () => (
    <ScrollView style={styles.content}>
      {issuedInvoices.length > 0 ? (
        issuedInvoices.map((invoice) => (
          <View key={invoice.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderTitle}>{invoice.type}</Text>
              <View style={styles.statusTag}>
                <Text style={styles.statusText}>已开发票</Text>
              </View>
            </View>
            <Text style={styles.serviceText}>{invoice.service}</Text>
            <Text style={styles.detailsText}>{invoice.details}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.amountLabel}>实付费用:</Text>
              <Text style={styles.amountValue}>{invoice.amount}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无已开票记录</Text>
        </View>
      )}
    </ScrollView>
  )

  const renderInvoiceHeaders = () => (
    <ScrollView style={styles.content}>
      {invoiceHeaders.map((header, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.companyName}>{header.company}</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactText}>{header.contact}</Text>
            <Text style={styles.phoneText}>{header.phone}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>删除</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>编辑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>添加新的发票抬头</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return renderPendingInvoices()
      case 1:
        return renderIssuedInvoices()
      case 2:
        return renderInvoiceHeaders()
      default:
        return renderPendingInvoices()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
            {activeTab === tab.id && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
      {renderContent()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#ff6b35',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 30,
    height: 3,
    backgroundColor: '#ff6b35',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionId: {
    fontSize: 14,
    color: '#999',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
  },
  statusTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#1976d2',
  },
  serviceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  invoiceButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  invoiceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  deleteButton: {
    marginRight: 10,
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 14,
  },
  editButton: {
    marginRight: 10,
  },
  editButtonText: {
    color: '#2196f3',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#ff8c42',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
})