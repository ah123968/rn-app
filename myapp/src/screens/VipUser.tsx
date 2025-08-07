import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
export default function VipUser() {
  const [activeTab, setActiveTab] = useState('valid'); // 'valid' 或 'expired'
  const navigation = useNavigation();
  // 有效卡片数据
  const validCards = [
    {
      id: 1,
      title: '会员年卡500',
      balance: '¥227.00',
      discountRate: '0.60',
      validUntil: '2025-08-11',
      type: 'annual',
      remainingTimes: null,
    },
    {
      id: 2,
      title: '储值卡500',
      balance: '¥600.00',
      discountRate: null,
      validUntil: '无',
      type: 'stored',
      remainingTimes: null,
    },
    {
      id: 3,
      title: '折扣卡500',
      balance: '¥450.00',
      discountRate: '0.50',
      validUntil: '无',
      type: 'discount',
      remainingTimes: null,
    },
    {
      id: 4,
      title: '计次卡300',
      balance: null,
      discountRate: null,
      validUntil: '无',
      type: 'count',
      remainingTimes: 11,
    },
  ];

  // 获取卡片背景颜色
  const getCardBackground = (type: string) => {
    switch (type) {
      case 'annual':
        return '#FF6B35';
      case 'stored':
        return '#20B2AA';
      case 'discount':
        return '#4CAF50';
      case 'count':
        return '#2196F3';
      default:
        return '#FF6B35';
    }
  };

  // 获取卡片详情文本
  const getCardDetails = (card: any) => {
    if (card.type === 'count') {
      return `剩余次数: ${card.remainingTimes}`;
    } else {
      const details = `卡余额: ${card.balance}`;
      return card.discountRate ? `${details} (折扣率${card.discountRate})` : details;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部标签导航 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'valid' && styles.activeTab]}
          onPress={() => setActiveTab('valid')}
        >
          <Text style={[styles.tabText, activeTab === 'valid' && styles.activeTabText]}>
            有效卡
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expired' && styles.activeTab]}
          onPress={() => setActiveTab('expired')}
        >
          <Text style={[styles.tabText, activeTab === 'expired' && styles.activeTabText]}>
            失效卡
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'valid' && (
          <>
            {/* 有效卡片列表 */}
            {validCards.map((card) => (
              <View key={card.id} style={[styles.card, { backgroundColor: getCardBackground(card.type) }]}>
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardDetails}>{getCardDetails(card)}</Text>
                    <Text style={styles.cardValidUntil}>有效期至: {card.validUntil}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <TouchableOpacity style={styles.recordButton} onPress={() => navigation.navigate('Record')}>
                      <Text style={styles.recordButtonText}>消费记录</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rulesLink}>
                      <Text style={styles.rulesIcon}>?</Text>
                      <Text style={styles.rulesText}>使用规则</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* 底部购买链接 */}
            <TouchableOpacity style={styles.purchaseLink}>
              <Text style={styles.purchaseText}>
                购买其他会员卡, 享受更优性价比!
              </Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'expired' && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无失效卡片</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  cardLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDetails: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardValidUntil: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  recordButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 8,
  },
  recordButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  rulesLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rulesIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    marginRight: 4,
  },
  rulesText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  purchaseLink: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  purchaseText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});