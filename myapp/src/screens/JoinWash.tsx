import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import React from 'react';

export default function JoinWash() {


  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部主题色横条 */}
   
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerBox}>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>健康洗衣</Text>
            <Text style={styles.bannerSubText}>品质生活</Text>
          </View>
        </View>
        {/* 卡片表单区 */}
        <View style={styles.card}>
          {/* 老板姓名 */}
          <View style={styles.inputRow}>
            <Text style={styles.icon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入老板姓名"
              placeholderTextColor="#b8b8b8"
            />
          </View>
          {/* 老板手机号 */}
          <View style={styles.inputRow}>
            <Text style={styles.icon}>📞</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入老板手机号"
              placeholderTextColor="#b8b8b8"
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>
          {/* 门店地址 */}
          <TouchableOpacity style={styles.inputRow}>
            <Text style={styles.icon}>📍</Text>
            <Text style={[styles.input, { color: '#b8b8b8' }]}>请选择门店地址</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          {/* 门店详细位置 */}
          <View style={styles.inputRow}>
            <Text style={styles.icon}>🏠</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入门店详细位置"
              placeholderTextColor="#b8b8b8"
            />
          </View>
          {/* 分割线 */}
          <View style={styles.divider} />
          {/* 图片上传区 */}
          <View style={styles.photoLabelRow}>
            <Text style={styles.photoLabel}>门店门头/内部照片</Text>
            <Text style={styles.photoCount}>0/4</Text>
          </View>
          <View style={styles.photoList}>
            <TouchableOpacity style={styles.photoBox}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* 底部按钮 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitText}>提交加盟信息</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6' },
  topBar: { height: 12, backgroundColor: '#e2ac62', width: '100%' },
  scrollContent: { paddingBottom: 20, alignItems: 'center' },
  bannerBox: { width: '100%', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  banner: { 
    width: '94%', 
    height: 120, 
    borderRadius: 12,
    backgroundColor: '#87CEEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  card: {
    width: '94%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 18,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: 20,
    color: '#e2ac62',
    width: 28,
    textAlign: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  chevron: {
    fontSize: 20,
    color: '#b8b8b8',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f2f2f2',
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 0,
  },
  photoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 12,
    marginBottom: 6,
  },
  photoLabel: {
    fontSize: 15,
    color: '#222',
    flex: 1,
  },
  photoCount: {
    fontSize: 14,
    color: '#888',
  },
  photoList: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 4,
  },
  photoBox: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ededed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  photo: {
    width: 68,
    height: 68,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cameraIcon: {
    fontSize: 28,
    color: '#b8b8b8',
  },
  bottomBar: {
    backgroundColor: 'transparent',
    padding: 0,
    paddingBottom: 10,
  },
  submitBtn: {
    backgroundColor: '#e2ac62',
    borderRadius: 8,
    marginHorizontal: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});