import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../router/Router';

// API配置
const API_BASE_URL = 'http://192.168.43.51:3000'; // 修改为您后端的实际IP地址

type DataStatisticsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DataStatistics'>;

type Props = {
  navigation: DataStatisticsScreenNavigationProp;
};

interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  todayOrders: number;
  monthOrders: number;
}

interface ChartData {
  labels: string[];
  values: number[];
}

const DataStatistics: React.FC<Props> = ({ navigation }) => {
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData | null>(null);
  const [orderData, setOrderData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week'); // week, month, year

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');

      // 获取认证Token（与其他页面保持一致）
      const token = await AsyncStorage.getItem('storeAdminToken');
      if (!token) {
        navigation.replace('StoreLogin');
        return;
      }

      try {
        // 拉取订单数据（取较大分页，前端聚合）
        const limit = 500;
        const response = await fetch(`${API_BASE_URL}/api/store-admin/orders?limit=${limit}&page=1`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!(data && data.code === 0 && data.data && Array.isArray(data.data.orders))) {
          throw new Error(data?.message || '返回数据格式不正确');
        }

        const orders: any[] = data.data.orders;

        // 统一获取订单时间（createTime 或 createdAt）
        const getOrderDate = (o: any): Date => {
          const ts = o.createTime || o.createdAt || o.payTime;
          return ts ? new Date(ts) : new Date();
        };

        // 计算摘要
        const processingSet = new Set(['toPickup','pickedUp','sorting','washing','drying','ironing','packaging','processing']);
        let totalOrders = 0;
        let pendingOrders = 0;      // 对齐“待处理” → paid/pending
        let processingOrders = 0;   // 洗护中系列
        let completedOrders = 0;
        let cancelledOrders = 0;
        let totalRevenue = 0;
        let todayRevenue = 0;
        let monthRevenue = 0;
        let todayOrders = 0;
        let monthOrders = 0;

        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
        const isSameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

        for (const o of orders) {
          totalOrders += 1;
          const status: string = o.status || 'paid';
          const price: number = Number(o.totalPrice || 0);
          const d = getOrderDate(o);

          if (status === 'pending' || status === 'paid') pendingOrders += 1;
          else if (processingSet.has(status)) processingOrders += 1;
          else if (status === 'completed') completedOrders += 1;
          else if (status === 'cancelled') cancelledOrders += 1;

          totalRevenue += price;
          if (isSameDay(d, now)) {
            todayRevenue += price;
            todayOrders += 1;
          }
          if (isSameMonth(d, now)) {
            monthRevenue += price;
            monthOrders += 1;
          }
        }

        setSummary({
          totalOrders,
          pendingOrders,
          processingOrders,
          completedOrders,
          cancelledOrders,
          totalRevenue,
          todayRevenue,
          monthRevenue,
          todayOrders,
          monthOrders
        });

        // 计算图表数据
        if (timeRange === 'week') {
          // 近7天（含今天），按自然日聚合
          const dayLabels: string[] = [];
          const dayValues: number[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const label = `${d.getMonth() + 1}/${d.getDate()}`;
            dayLabels.push(label);
            const sum = orders.reduce((acc, o) => {
              const od = getOrderDate(o);
              return isSameDay(od, d) ? acc + Number(o.totalPrice || 0) : acc;
            }, 0);
            dayValues.push(Number(sum.toFixed(2)));
          }
          setRevenueData({ labels: dayLabels, values: dayValues });

          const dayCountValues: number[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const cnt = orders.reduce((acc, o) => {
              const od = getOrderDate(o);
              return isSameDay(od, d) ? acc + 1 : acc;
            }, 0);
            dayCountValues.push(cnt);
          }
          setOrderData({ labels: dayLabels, values: dayCountValues });
        } else if (timeRange === 'month') {
          // 近4周（按7天为一周）
          const labels = ['第1周','第2周','第3周','第4周'];
          const weekValues: number[] = [];
          const weekCountValues: number[] = [];
          for (let w = 3; w >= 0; w--) {
            const end = new Date(now);
            end.setDate(now.getDate() - (w * 7));
            const start = new Date(end);
            start.setDate(end.getDate() - 6);
            const sum = orders.reduce((acc, o) => {
              const od = getOrderDate(o);
              return od >= start && od <= end ? acc + Number(o.totalPrice || 0) : acc;
            }, 0);
            const cnt = orders.reduce((acc, o) => {
              const od = getOrderDate(o);
              return od >= start && od <= end ? acc + 1 : acc;
            }, 0);
            weekValues.push(Number(sum.toFixed(2)));
            weekCountValues.push(cnt);
          }
          setRevenueData({ labels, values: weekValues });
          setOrderData({ labels, values: weekCountValues });
        } else if (timeRange === 'year') {
          // 当年12个月
          const labels = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
          const monthValues = new Array(12).fill(0);
          const monthCountValues = new Array(12).fill(0);
          for (const o of orders) {
            const d = getOrderDate(o);
            if (d.getFullYear() === y) {
              const idx = d.getMonth();
              monthValues[idx] += Number(o.totalPrice || 0);
              monthCountValues[idx] += 1;
            }
          }
          setRevenueData({ labels, values: monthValues.map(v => Number(v.toFixed(2))) });
          setOrderData({ labels, values: monthCountValues });
        }
      } catch (fetchError) {
        console.error('获取统计数据失败:', fetchError);
        // 使用模拟数据回退
        generateMockStatistics();
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      setError('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成模拟统计数据
  const generateMockStatistics = () => {
    // 订单摘要数据
    const mockSummary: OrderSummary = {
      totalOrders: 183,
      pendingOrders: 12,
      processingOrders: 28,
      completedOrders: 137,
      cancelledOrders: 6,
      totalRevenue: 25860.50,
      todayRevenue: 1250.00,
      monthRevenue: 8520.50,
      todayOrders: 8,
      monthOrders: 58
    };

    setSummary(mockSummary);

    // 收入图表数据
    let revenueLabels: string[] = [];
    let revenueValues: number[] = [];

    if (timeRange === 'week') {
      revenueLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      revenueValues = [1200, 980, 1350, 890, 1450, 1680, 1250];
    } else if (timeRange === 'month') {
      revenueLabels = ['第1周', '第2周', '第3周', '第4周'];
      revenueValues = [4200, 5100, 4800, 5400];
    } else if (timeRange === 'year') {
      revenueLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      revenueValues = [4500, 3800, 5200, 4800, 6100, 5700, 6800, 7500, 6900, 7200, 8100, 8500];
    }

    setRevenueData({ labels: revenueLabels, values: revenueValues });

    // 订单图表数据
    let orderLabels: string[] = [];
    let orderValues: number[] = [];

    if (timeRange === 'week') {
      orderLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      orderValues = [12, 8, 15, 9, 17, 20, 13];
    } else if (timeRange === 'month') {
      orderLabels = ['第1周', '第2周', '第3周', '第4周'];
      orderValues = [42, 51, 48, 54];
    } else if (timeRange === 'year') {
      orderLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      orderValues = [45, 38, 52, 48, 61, 57, 68, 75, 69, 72, 81, 85];
    }

    setOrderData({ labels: orderLabels, values: orderValues });

    setError('使用模拟数据');
  };

  // 渲染简易柱状图
  const renderBarChart = (data: ChartData, color: string) => {
    if (!data || data.values.length === 0) return null;

    const maxValue = Math.max(...data.values);
    const chartWidth = Dimensions.get('window').width - 40;
    const barWidth = (chartWidth - (data.values.length * 8)) / data.values.length;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.values.map((value, index) => {
            const barHeight = (value / maxValue) * 150;
            return (
              <View key={index} style={styles.barGroup}>
                <View style={[styles.bar, { height: barHeight, width: barWidth, backgroundColor: color }]} />
                <Text style={styles.barLabel}>{data.labels[index]}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // 渲染卡片
  const renderSummaryCard = (title: string, value: string | number, icon: string) => (
    <View style={styles.summaryCard}>
      <Text style={styles.cardIcon}>{icon}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );

  // 渲染时间范围选择器
  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeSelector}>
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          timeRange === 'week' && styles.timeRangeButtonActive
        ]}
        onPress={() => setTimeRange('week')}
      >
        <Text
          style={[
            styles.timeRangeButtonText,
            timeRange === 'week' && styles.timeRangeButtonTextActive
          ]}
        >
          周
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          timeRange === 'month' && styles.timeRangeButtonActive
        ]}
        onPress={() => setTimeRange('month')}
      >
        <Text
          style={[
            styles.timeRangeButtonText,
            timeRange === 'month' && styles.timeRangeButtonTextActive
          ]}
        >
          月
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.timeRangeButton,
          timeRange === 'year' && styles.timeRangeButtonActive
        ]}
        onPress={() => setTimeRange('year')}
      >
        <Text
          style={[
            styles.timeRangeButtonText,
            timeRange === 'year' && styles.timeRangeButtonTextActive
          ]}
        >
          年
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载统计数据中...</Text>
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
        <Text style={styles.title}>数据统计</Text>
        <View style={{ width: 50 }} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>订单概览</Text>
          <View style={styles.summaryGrid}>
            {summary && (
              <>
                {renderSummaryCard('总订单', summary.totalOrders, '📊')}
                {renderSummaryCard('待处理', summary.pendingOrders, '⏳')}
                {renderSummaryCard('处理中', summary.processingOrders, '🔄')}
                {renderSummaryCard('已完成', summary.completedOrders, '✅')}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>收入概览</Text>
          <View style={styles.summaryGrid}>
            {summary && (
              <>
                {renderSummaryCard('今日收入', `¥${summary.todayRevenue.toFixed(2)}`, '💰')}
                {renderSummaryCard('本月收入', `¥${summary.monthRevenue.toFixed(2)}`, '💸')}
                {renderSummaryCard('总收入', `¥${summary.totalRevenue.toFixed(2)}`, '🏦')}
                {renderSummaryCard('取消订单', summary.cancelledOrders, '❌')}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>营收趋势</Text>
            {renderTimeRangeSelector()}
          </View>
          {revenueData && renderBarChart(revenueData, '#4CAF50')}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>订单趋势</Text>
          </View>
          {orderData && renderBarChart(orderData, '#2196F3')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
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
    padding: 10
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#FFECB3',
    borderRadius: 5,
    margin: 10
  },
  errorText: {
    color: '#F57C00',
    textAlign: 'center'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center'
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 5
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  cardTitle: {
    fontSize: 12,
    color: '#666'
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 2
  },
  timeRangeButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 18
  },
  timeRangeButtonActive: {
    backgroundColor: '#007AFF'
  },
  timeRangeButtonText: {
    fontSize: 12,
    color: '#666'
  },
  timeRangeButtonTextActive: {
    color: 'white'
  },
  chartContainer: {
    height: 200,
    marginTop: 10
  },
  chart: {
    height: 180,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  barGroup: {
    alignItems: 'center',
    flex: 1
  },
  bar: {
    minHeight: 1
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 5
  }
});

export default DataStatistics; 