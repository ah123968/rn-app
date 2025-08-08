import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { get } from '../utils/request'

export default function SetInvoice() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const orderId: string = route.params?.orderId || ''

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<{ name: string; price: number; quantity: number }[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('')

  const [selectedHeader, setSelectedHeader] = useState('山东彩泓网络科技有限公司')
  const [selectedType, setSelectedType] = useState('增值税普通发票')

  const fetchDetail = async () => {
    if (!orderId) return
    try {
      setLoading(true)
      const tokenStr = await AsyncStorage.getItem('userToken')
      const token = tokenStr ? JSON.parse(tokenStr).token : ''
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {}
      const resp = await get(`/order/${orderId}`, { _t: Date.now() }, headers)
      const res = resp.data
      if (res.code === 0 && res.data) {
        const d = res.data
        setItems((d.items || []).map((it: any) => ({ name: it.name, price: it.price, quantity: it.quantity })))
        setTotalAmount(d.totalPrice || 0)
        setPaymentMethod(d.paymentMethod || '')
      }
    } catch (e) {
      console.error('获取订单详情失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDetail() }, [orderId])

  const renderItemRow = (it: { name: string; price: number; quantity: number }, idx: number) => (
    <View key={`${it.name}-${idx}`} style={styles.row}>
      <Text style={styles.itemName}>{it.name}</Text>
      <Text style={styles.itemPrice}>¥{Number(it.price).toFixed(2)}</Text>
      <Text style={styles.itemQty}>{it.quantity}</Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 洗护商品 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>洗护商品</Text>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>名称</Text>
            <Text style={styles.headerText}>单价</Text>
            <Text style={styles.headerText}>数量</Text>
          </View>
          {items.map(renderItemRow)}
        </View>

        {/* 支付信息 */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>实付费用</Text>
            <Text style={styles.infoValue}>{totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>支付方式</Text>
            <Text style={styles.infoValue}>{paymentMethod || '—'}</Text>
          </View>
        </View>

        {/* 开票信息 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>开票信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>开票金额：</Text>
            <Text style={styles.inputLike}>{totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>发票抬头：</Text>
            <TouchableOpacity style={styles.selectLike}>
              <Text style={styles.selectText}>{selectedHeader}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>发票类型：</Text>
            <TouchableOpacity style={styles.selectLike}>
              <Text style={styles.selectText}>{selectedType}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.submitText}>申请开票</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 12, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  headerText: { color: '#666' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemName: { color: '#333' },
  itemPrice: { color: '#ff4444' },
  itemQty: { color: '#333' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoLabel: { color: '#666' },
  infoValue: { color: '#ff4444', fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  inputLike: { backgroundColor: '#f7f7f7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, color: '#333' },
  selectLike: { flex: 1, backgroundColor: '#f7f7f7', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6, alignItems: 'flex-end' },
  selectText: { color: '#333' },
  submitBtn: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: '#e2ac62', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})