import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 数据类型定义
interface CartItem {
  id: string;
  name: string;
  price: number;
  memberPrice: number;
  quantity: number;
  image: string;
  category: string;
}

interface AddressInfo {
  type: 'pickup' | 'delivery' | 'store';
  icon: string;
  title: string;
  address: string;
  contact: string;
  distance?: string;
}

// 模拟数据
const cartItems: CartItem[] = [
  {
    id: '1',
    name: '皮面运动鞋',
    price: 50,
    memberPrice: 25,
    quantity: 1,
    image: 'https://via.placeholder.com/60x60',
    category: '皮鞋类',
  },
  {
    id: '2',
    name: '单皮鞋',
    price: 50,
    memberPrice: 25,
    quantity: 2,
    image: 'https://via.placeholder.com/60x60',
    category: '皮鞋类',
  },
  {
    id: '3',
    name: '棉皮鞋',
    price: 25,
    memberPrice: 12.5,
    quantity: 0,
    image: 'https://via.placeholder.com/60x60',
    category: '皮鞋类',
  },
  {
    id: '4',
    name: '网面布面鞋',
    price: 20,
    memberPrice: 10,
    quantity: 1,
    image: 'https://via.placeholder.com/60x60',
    category: '非皮鞋',
  },
];

const addressInfo: AddressInfo[] = [
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

const serviceCategories = [
  '洗衣干洗',
  '洗鞋修鞋',
  '洗包修包',
  '家私清洗',
  '二奢鉴定',
];

const CartScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [items, setItems] = useState(cartItems);
  const navigation = useNavigation();
  // 更新商品数量
  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  // 计算总价和总数量
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalMemberPrice = items.reduce(
    (sum, item) => sum + item.memberPrice * item.quantity,
    0,
  );
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // 渲染地址项
  const renderAddressItem = useCallback((item: AddressInfo) => (
    <TouchableOpacity onPress={() => {
      navigation.navigate('AllStore');
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
  ), []);

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
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>¥{item.price.toFixed(2)}</Text>
          <Text style={styles.memberPrice}>
            会员价最低¥{item.memberPrice.toFixed(2)}
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
          <FlatList
            data={addressInfo}
            renderItem={({ item }) => renderAddressItem(item)}
            keyExtractor={item => item.type}
            scrollEnabled={false}
          />
        </View>

        {/* 服务分类 */}
        <View style={styles.categorySection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {serviceCategories.map(renderServiceCategory)}
          </ScrollView>
        </View>

        {/* 商品列表 */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>皮鞋类</Text>
          <FlatList
            data={items.filter(item => item.category === '皮鞋类')}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
          />

          <Text style={styles.sectionTitle}>非皮鞋</Text>
          <FlatList
            data={items.filter(item => item.category === '非皮鞋')}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
          />
        </View>
      </ScrollView>

      {/* 底部购物车栏 */}
      <View style={styles.bottomBar}>
        <View style={styles.cartInfo}>
          <Text style={styles.cartText}>共{totalQuantity}件</Text>
        </View>
        <View style={styles.priceInfo}>
          <Text style={styles.totalPrice}>¥{totalPrice.toFixed(2)}</Text>
          <Text style={styles.totalMemberPrice}>
            会员价最低¥{totalMemberPrice.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity style={styles.orderButton}>
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
});

export default CartScreen;
