import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../router/Router';

type OrderDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

type Props = {
  navigation: OrderDetailScreenNavigationProp;
  route: OrderDetailScreenRouteProp;
};

const OrderDetail: React.FC<Props> = ({ navigation, route }) => {
  const { orderId } = route.params;
  
  // 模拟订单详情数据
  const order = {
    id: orderId,
    orderNo: `NO${Date.now().toString().substring(6)}`,
    status: 'processing',
    customerName: '张先生',
    customerPhone: '139****1234',
    address: '北京市朝阳区三里屯SOHO 3号楼1705',
    totalPrice: 125.00,
    createTime: '2023-08-01 14:30:45',
    items: [
      { name: '衬衫', quantity: 2, price: 25.00 },
      { name: '西裤', quantity: 1, price: 35.00 },
      { name: '外套', quantity: 1, price: 40.00 }
    ],
    remarks: '请轻柔洗涤，外套需要特殊处理'
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
            <Text style={styles.totalLabel}>合计:</Text>
            <Text style={styles.totalPrice}>¥{order.totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        {order.remarks ? (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Text style={styles.remarks}>{order.remarks}</Text>
          </View>
        ) : null}

        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              { backgroundColor: getStatusColor(order.status) }
            ]}
          >
            <Text style={styles.actionText}>
              {order.status === 'paid' ? '接单处理' : 
               order.status === 'processing' ? '完成处理' : 
               order.status === 'ready' ? '确认取件' : '打印订单'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    color: '#666'
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
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10
  },
  totalPrice: {
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