import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

// 导入购物车上下文
import { useCart, CartItem } from '../utils/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import request, { post } from '../utils/request';

// 地址类型定义
interface AddressInfo {
  type: 'pickup' | 'delivery' | 'store';
  icon: string;
  title: string;
  address: string;
  contact: string;
  distance?: string;
}

// 默认地址数据
const defaultAddressInfo: AddressInfo[] = [
  {
    type: 'pickup',
    icon: '取',
    title: '取',
    address: '浙江省杭州市西湖区余杭塘路866号浙江大学',
    contact: '王森13371208888',
  },
  {
    type: 'delivery',
    icon: '送',
    title: '送',
    address: '浙江省杭州市西湖区余杭塘路866号浙江大学',
    contact: '王森13371208888',
  },
  {
    type: 'store',
    icon: '店',
    title: '店',
    address: '浣熊洗护西溪蝶园门店',
    contact: '上门取送 | 距离9.4Km',
  },
];

// 服务分类
const serviceCategories = [
  '洗衣干洗',
  '洗鞋修鞋',
  '洗包修包',
  '家私清洗',
  '二奢鉴定',
];

const CartScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const incomingStore = route?.params?.store as
    | { name: string; type?: string; distance?: string }
    | undefined;

  // 使用购物车上下文
  const { 
    items, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice, 
    getMemberPrice, 
    clearCart 
  } = useCart();

  const addressInfo: AddressInfo[] = [
    defaultAddressInfo[0],
    defaultAddressInfo[1],
    {
      type: 'store',
      icon: '店',
      title: '店',
      address: incomingStore?.name || '浣熊洗护西溪蝶园门店',
      contact: `${incomingStore?.type || '上门取送'}${incomingStore?.distance ? ' | 距离' + incomingStore.distance : ''}`,
    },
  ];

  // 计算不同分类的商品
  const categorizedItems = useMemo(() => {
    const result: Record<string, CartItem[]> = {};
    items.forEach(item => {
      const category = item.category || '默认分类';
      if (!result[category]) {
        result[category] = [];
      }
      result[category].push(item);
    });
    return result;
  }, [items]);

  // 渲染地址项
  const renderAddressItem = useCallback((item: AddressInfo) => (
    <TouchableOpacity onPress={() => {
      if(item.type === 'store'){  
        (navigation as any).navigate('AllStore');
      }
    }} key={item.type} style={styles.addressItem}>
      <View
        style={[
          styles.addressIcon,
          item.type === 'store' ? styles.storeIcon : styles.circleIcon,
        ]}
      >
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.addressContent}>
        <Text style={styles.addressText}>{item.address}</Text>
        <Text style={styles.contactText}>{item.contact}</Text>
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </TouchableOpacity>
  ), [navigation]);

  // 渲染服务分类
  const renderServiceCategory = (category: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.categoryTab,
        selectedCategory === index && styles.selectedCategory,
      ]}
      onPress={() => setSelectedCategory(index)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === index && styles.selectedCategoryText,
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  // 渲染商品项
  const renderCartItem = (item: CartItem) => (
    <View key={item.id} style={styles.cartItem}>
      <View style={[styles.itemImage, {backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{fontSize: 24}}>🧺</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>¥{item.price.toFixed(2)}/{item.unit}</Text>
          <Text style={styles.memberPrice}>
            会员价最低¥{(item.price * 0.5).toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity - 1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 处理下单操作
  const handleOrder = async () => {
    if (items.length === 0) {
      Alert.alert('提示', '购物车为空，请先添加商品');
      return;
    }
    
    // 先显示确认对话框
    Alert.alert(
      '提交订单',
      '确认提交洗护订单吗？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '确定',
          onPress: async () => {
            try {
              // 1. 获取登录token
              const tokenString = await AsyncStorage.getItem('userToken');
              if (!tokenString) {
                Alert.alert('提示', '请先登录');
                navigation.navigate('Login' as never);
                return;
              }
              
              const tokenData = JSON.parse(tokenString);
              
              // 2. 准备订单数据
              const orderItems = items.map(item => ({
                serviceItemId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                unit: item.unit
              }));
              
                              // 3. 调用创建订单API
              console.log('开始调用创建订单API');
              
              // 打印请求数据，便于调试
              const requestData = {
                storeId: '6892cbd37ae4c574159baa0f', // 使用真实存在的门店ID："洁净干洗店（总店）"
                items: orderItems,
                deliveryType: 'self', // 可以根据用户选择的配送方式调整
                remark: ''
              };
              console.log('发送的订单数据:', JSON.stringify(requestData));
              
              const response = await post(
                '/order/create',  // 使用封装的请求方法，baseURL已在request.ts中配置
                requestData
              );
              
              if (response.code === 0) {
                // 订单创建成功
                Alert.alert(
                  '订单创建成功',
                  `订单号: ${response.data.orderNo}\n总价: ¥${response.data.totalPrice.toFixed(2)}`,
                  [
                    {
                      text: '确定',
                      onPress: () => {
                        // 清空购物车
                        clearCart();
                        // 导航到订单页面
                        navigation.navigate('Orders' as never);
                      }
                    }
                  ]
                );
              } else {
                // 处理错误
                throw new Error(response.message || '创建订单失败');
              }
            } catch (error: any) {
              console.error('下单失败:', error);
              // 更详细的错误信息，帮助调试
              if (error.response) {
                // 服务器返回了错误响应
                console.error('错误响应状态:', error.response.status);
                console.error('错误响应数据:', error.response.data);
                Alert.alert('下单失败', `服务器错误(${error.response.status}): ${error.response.data?.message || '未知错误'}`);
              } else if (error.request) {
                // 请求发出但没有收到响应
                console.error('无响应:', error.request);
                Alert.alert('下单失败', '服务器无响应，请检查网络连接和后端服务是否运行');
              } else {
                // 请求设置过程中发生的错误
                Alert.alert('下单失败', error instanceof Error ? error.message : '网络异常，请稍后再试');
              }
            }
          }
        }
      ]
    );
  };

  // 购物车为空时显示
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#e2ac62" />
        <View style={styles.statusBar}>
          <Text style={styles.title}>洗衣筐</Text>
        </View>
        
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartIcon}>🛒</Text>
          <Text style={styles.emptyCartText}>购物车空空如也</Text>
          <TouchableOpacity 
            style={styles.goShoppingButton}
            onPress={() => navigation.navigate('Home' as never)}
          >
            <Text style={styles.goShoppingText}>去选购服务</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e2ac62" />

      {/* 顶部状态栏 */}
      <View style={styles.statusBar}>
        <Text style={styles.title}>洗衣筐</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 地址信息 */}
        <View style={styles.addressSection}>
          {addressInfo.map((item, index) => (
            <React.Fragment key={`address-${item.type}-${index}`}>
              {renderAddressItem(item)}
            </React.Fragment>
          ))}
        </View>

        {/* 服务分类 */}
        <View style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {serviceCategories.map((category, index) => (
              <React.Fragment key={`category-${index}`}>
                {renderServiceCategory(category, index)}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>

        {/* 商品列表 - 按分类显示 */}
        <View style={styles.itemsSection}>

          {Object.entries(categorizedItems).map(([category, categoryItems]) => (
            <View key={category}>
              <Text style={styles.sectionTitle}>{category}</Text>
              {categoryItems.map(item => renderCartItem(item))}
            </View>
          ))}

          <Text style={styles.sectionTitle}>皮鞋类</Text>
          {items
            .filter(item => item.category === '皮鞋类')
            .map((item, index) => (
              <React.Fragment key={`cart-item-${item.id}-${index}`}>
                {renderCartItem({ item })}
              </React.Fragment>
            ))}

          <Text style={styles.sectionTitle}>非皮鞋</Text>
          {items
            .filter(item => item.category === '非皮鞋')
            .map((item, index) => (
              <React.Fragment key={`cart-item-${item.id}-${index}`}>
                {renderCartItem({ item })}
              </React.Fragment>
            ))}

        </View>
      </ScrollView>

      {/* 底部购物车栏 */}
      <View style={styles.bottomBar}>
        <View style={styles.cartInfo}>
          <Text style={styles.cartText}>共{getTotalItems()}件</Text>
        </View>
        <View style={styles.priceInfo}>
          <Text style={styles.totalPrice}>¥{getTotalPrice().toFixed(2)}</Text>
          <Text style={styles.totalMemberPrice}>
            会员价最低¥{getMemberPrice().toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity style={styles.orderButton} onPress={handleOrder}>
          <Text style={styles.orderButtonText}>下单洗护</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e2ac62',
  },
  title: {
    fontSize: 18,
    color: '#fff',
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  statusIcon: {
    fontSize: 16,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  activeDot: {
    backgroundColor: '#FF6B35',
  },
  scrollView: {
    flex: 1,
  },
  addressSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  circleIcon: {
    backgroundColor: '#FF6B35',
  },
  storeIcon: {
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  iconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  contactText: {
    fontSize: 12,
    color: '#666',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#999',
  },
  categorySection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategory: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  itemsSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  memberPrice: {
    fontSize: 12,
    color: '#FF6B35',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  quantityButtonText: {
    fontSize: 16,
    color: '#333',
  },
  quantityText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  cartIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  cartText: {
    fontSize: 14,
    color: '#333',
  },
  priceInfo: {
    flex: 1,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalMemberPrice: {
    fontSize: 12,
    color: '#FF6B35',
  },
  orderButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 空购物车样式
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartIcon: {
    fontSize: 60,
    marginBottom: 20,
    color: '#ccc',
  },
  emptyCartText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  goShoppingButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  goShoppingText: {
    color: 'white',
    fontSize: 14,
  },
});

export default CartScreen; 