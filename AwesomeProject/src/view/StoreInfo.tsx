import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../router/Router';

// API配置 - 根据不同环境选择合适的基础URL
const API_BASE_URL = 'http://192.168.43.51:3000'; // 修改为您后端的实际IP地址

type StoreInfoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StoreInfo'>;

type Props = {
  navigation: StoreInfoScreenNavigationProp;
};

interface StoreInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  businessHours: string;
  services: string[];
  introduction: string;
  status: string;
  images: string[];
}

const StoreInfo: React.FC<Props> = ({ navigation }) => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminInfo, setAdminInfo] = useState<any>(null);

  useEffect(() => {
    const loadStoreInfo = async () => {
      try {
        setLoading(true);
        setError('');

        // 获取管理员信息
        const adminInfoStr = await AsyncStorage.getItem('storeAdminInfo');
        if (!adminInfoStr) {
          navigation.replace('StoreLogin');
          return;
        }

        const adminData = JSON.parse(adminInfoStr);
        setAdminInfo(adminData);

        // 获取认证Token
        const token = await AsyncStorage.getItem('storeToken');
        if (!token) {
          navigation.replace('StoreLogin');
          return;
        }

        // 从后端获取店铺信息
        try {
          const response = await fetch(`${API_BASE_URL}/api/store-admin/info`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const result = await response.json();
          
          if (response.ok && result.code === 0) {
            // 转换API返回数据为组件状态格式
            setStoreInfo({
              id: result.data.store.id,
              name: result.data.store.name,
              address: result.data.store.address,
              phone: result.data.store.phone,
              businessHours: result.data.store.businessHours,
              services: result.data.store.services || ['干洗', '水洗', '熨烫'],
              introduction: "专业洗衣服务，品质保证。",
              status: 'open',
              images: result.data.store.images || []
            });
          } else {
            // API请求失败，使用管理员信息中的店铺信息作为后备
            setStoreInfo({
              id: adminData.storeId,
              name: adminData.storeName,
              address: '未知地址',
              phone: '未知电话',
              businessHours: '09:00-21:00',
              services: ['干洗', '水洗', '熨烫'],
              introduction: "专业洗衣服务，品质保证。",
              status: 'open',
              images: []
            });
            setError('获取店铺详情失败，显示基本信息');
          }
        } catch (fetchError) {
          console.error('获取店铺信息失败:', fetchError);
          
          // API请求失败，使用本地存储的信息
          setStoreInfo({
            id: adminData.storeId,
            name: adminData.storeName,
            address: '未知地址',
            phone: '未知电话',
            businessHours: '09:00-21:00',
            services: ['干洗', '水洗', '熨烫'],
            introduction: "专业洗衣服务，品质保证。",
            status: 'open',
            images: []
          });
          setError('无法连接服务器，显示本地信息');
        }
      } catch (error) {
        console.error('加载店铺信息失败:', error);
        setError('加载店铺信息失败');
      } finally {
        setLoading(false);
      }
    };

    loadStoreInfo();
  }, [navigation]);

  // 渲染服务项目标签
  const renderServiceTags = (services: string[]) => {
    return services.map((service, index) => (
      <View key={index} style={styles.serviceTag}>
        <Text style={styles.serviceTagText}>{service}</Text>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载店铺信息中...</Text>
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
        <Text style={styles.title}>店铺信息</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {storeInfo && (
          <>
            <View style={styles.storeHeader}>
              {storeInfo.images && storeInfo.images.length > 0 ? (
                <Image 
                  source={{ uri: storeInfo.images[0] }} 
                  style={styles.storeImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.storePlaceholder}>
                  <Text style={styles.storePlaceholderText}>
                    {storeInfo.name.substring(0, 2)}
                  </Text>
                </View>
              )}
              
              <View style={styles.storeStatus}>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: storeInfo.status === 'open' ? '#4CAF50' : '#FF5722' }
                ]} />
                <Text style={styles.statusText}>
                  {storeInfo.status === 'open' ? '营业中' : '休息中'}
                </Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.storeName}>{storeInfo.name}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>店铺地址</Text>
                <Text style={styles.infoValue}>{storeInfo.address}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>联系电话</Text>
                <Text style={styles.infoValue}>{storeInfo.phone}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>营业时间</Text>
                <Text style={styles.infoValue}>{storeInfo.businessHours}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>店铺简介</Text>
                <Text style={styles.infoValue}>{storeInfo.introduction}</Text>
              </View>
            </View>

            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>提供服务</Text>
              <View style={styles.serviceTags}>
                {renderServiceTags(storeInfo.services)}
              </View>
            </View>

            <View style={styles.adminSection}>
              <Text style={styles.sectionTitle}>管理员信息</Text>
              {adminInfo && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>管理员</Text>
                    <Text style={styles.infoValue}>{adminInfo.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>角色</Text>
                    <Text style={styles.infoValue}>
                      {adminInfo.role === 'admin' ? '管理员' : 
                      adminInfo.role === 'manager' ? '经理' : '员工'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </>
        )}
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
    padding: 15
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#FFECB3',
    borderRadius: 5,
    marginBottom: 15
  },
  errorText: {
    color: '#F57C00',
    textAlign: 'center'
  },
  storeHeader: {
    position: 'relative',
    height: 180,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15
  },
  storeImage: {
    width: '100%',
    height: '100%'
  },
  storePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  storePlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white'
  },
  storeStatus: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5
  },
  statusText: {
    color: 'white',
    fontSize: 14
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  infoRow: {
    marginBottom: 10
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  infoValue: {
    fontSize: 16,
    color: '#333'
  },
  servicesSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  serviceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  serviceTag: {
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    margin: 5
  },
  serviceTagText: {
    color: '#0288D1',
    fontSize: 14
  },
  adminSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  }
});

export default StoreInfo; 