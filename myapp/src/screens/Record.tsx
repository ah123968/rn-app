import { StyleSheet, Text, View, SafeAreaView } from 'react-native'
import React from 'react'

export default function Record() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* 订单信息 */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderText}>订单编号: 202006060021025</Text>
          <Text style={styles.orderText}>下单时间: 2020-06-06 09:25</Text>
        </View>
        
        {/* 分割线 */}
        <View style={styles.divider} />
        
        {/* 洗护商品 */}
        <View style={styles.productSection}>
          <Text style={styles.sectionTitle}>洗护商品</Text>
          
          {/* 商品列表 */}
          <View style={styles.productItem}>
            <Text style={styles.productName}>皮面运动鞋</Text>
            <Text style={styles.productPrice}>¥50.00</Text>
            <Text style={styles.productQuantity}>1</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.productItem}>
            <Text style={styles.productName}>单皮鞋</Text>
            <Text style={styles.productPrice}>¥50.00</Text>
            <Text style={styles.productQuantity}>2</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.productItem}>
            <Text style={styles.productName}>棉皮鞋</Text>
            <Text style={styles.productPrice}>¥25.00</Text>
            <Text style={styles.productQuantity}>1</Text>
          </View>
        </View>
        
        {/* 分割线 */}
        <View style={styles.divider} />
        
        {/* 实际支付 */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentLabel}>实际支付</Text>
          <Text style={styles.paymentAmount}>¥55.00</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderInfo: {
    marginBottom: 8,
  },
  orderText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  productSection: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: 'bold',
    marginRight: 16,
  },
  productQuantity: {
    fontSize: 14,
    color: '#333',
    width: 20,
    textAlign: 'right',
  },
  paymentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#333',
  },
  paymentAmount: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: 'bold',
  },
})