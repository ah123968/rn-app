import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
const ProfileScreen = () => {
  // 菜单项数据
  const navigation = useNavigation()
  const menuItems = [
    { id: 1, title: '会员卡包', icon: '💳', color: '#4A90E2',path:"VipUser" },
    { id: 2, title: '优惠券', icon: '🎫', color: '#FF6B35' ,path:"Coupon" },
    {id: 3, title: '售后订单', icon: '📋', color: '#FF6B35',path:"BadPro"},
      { id: 4, title: '开发票', icon: '📄', color: '#87CEEB',path:"Invoice" },
      { id: 5, title: '地址管理', icon: '📍', color: '#4A90E2',path:"Address" },
    { id: 6, title: '熊洗推荐官', icon: '⭐', color: '#FF6B35' },
    { id: 7, title: '加盟熊洗洗', icon: '💚', color: '#4CAF50',path:"JoinWash" },
    { id: 8, title: '关于熊洗洗', icon: 'ℹ️', color: '#9E9E9E',path:"Introduce" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 用户信息区域 */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🦝</Text>
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraText}>📷</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.username}>浣熊洗</Text>
            <Text style={styles.phoneNumber}>133****3826</Text>
          </View>
          
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsIcon} onPress={() => {
              navigation.navigate('UserData')
            }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* 菜单列表 */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity onPress={()=>navigation.navigate(item.path)} key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemLeft} >
                <View  style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <Text style={styles.menuIconText}>{item.icon}</Text>
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Text style={styles.arrowIcon}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#20B2AA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 30,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cameraText: {
    fontSize: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666666',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuIconText: {
    fontSize: 16,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333333',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#CCCCCC',
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 