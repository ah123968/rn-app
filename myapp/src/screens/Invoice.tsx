import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native'
import React, { useState } from 'react'

export default function Invoice() {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { id: 0, title: '待开票' },
    { id: 1, title: '已开票' },
    { id: 2, title: '发票抬头' }
  ]

  const pendingInvoices = [
    {
      id: '1',
      type: '洗护订单',
      status: '完成取件',
      service: '上门取送',
      details: '商品数量*3 | 返洗数量*1',
      amount: '¥120.00'
    },
    {
      id: '202006060021025',
      type: '会员年卡500',
      date: '2020-06-06 09:25',
      amount: '¥500.00'
    }
  ]

  const issuedInvoices = [
    {
      id: '1',
      type: '洗护订单',
      status: '已开发票',
      service: '上门取送',
      details: '商品数量*3 | 返洗数量*1',
      amount: '¥120.00'
    }
  ]

  const invoiceHeaders = [
    {
      company: '山东彩泓网络科技有限公司',
      contact: '孙新民',
      phone: '133****3826'
    }
  ]

  const renderPendingInvoices = () => (
    <ScrollView style={styles.content}>
      {pendingInvoices.map((invoice, index) => (
        <View key={index} style={styles.card}>
          {invoice.type === '洗护订单' ? (
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.orderTitle}>{invoice.type}</Text>
                <View style={styles.statusTag}>
                  <Text style={styles.statusText}>{invoice.status}</Text>
                </View>
              </View>
              <Text style={styles.serviceText}>{invoice.service}</Text>
              <Text style={styles.detailsText}>{invoice.details}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.amountLabel}>实付费用:</Text>
                <Text style={styles.amountValue}>{invoice.amount}</Text>
                <TouchableOpacity style={styles.invoiceButton}>
                  <Text style={styles.invoiceButtonText}>开发票</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.transactionId}>{invoice.id}</Text>
                <Text style={styles.dateText}>{invoice.date}</Text>
              </View>
              <Text style={styles.orderTitle}>{invoice.type}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.amountLabel}>实付金额:</Text>
                <Text style={styles.amountValue}>{invoice.amount}</Text>
                <TouchableOpacity style={styles.invoiceButton}>
                  <Text style={styles.invoiceButtonText}>开发票</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ))}
    </ScrollView>
  )

  const renderIssuedInvoices = () => (
    <ScrollView style={styles.content}>
      {issuedInvoices.map((invoice, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderTitle}>{invoice.type}</Text>
            <View style={styles.statusTag}>
              <Text style={styles.statusText}>{invoice.status}</Text>
            </View>
          </View>
          <Text style={styles.serviceText}>{invoice.service}</Text>
          <Text style={styles.detailsText}>{invoice.details}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.amountLabel}>实付费用:</Text>
            <Text style={styles.amountValue}>{invoice.amount}</Text>
          </View>
        </View>
      ))}
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
})