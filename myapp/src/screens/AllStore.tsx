import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';

const CITY_LIST = [
  { key: 'hz', name: '杭州市' },
  { key: 'jx', name: '嘉兴市' },
  { key: 'sx', name: '绍兴市' },
];

const STORE_DATA = {
  hz: [
    {
      name: '浣熊洗护西溪蝶园门店',
      type: '上门取送',
      typeColor: '#C89B5A',
      distance: '9.4Km',
      distanceColor: '#1890FF',
    },
    {
      name: '浣熊洗护康到家政服务点',
      type: '自主到店',
      typeColor: '#E54D42',
      distance: '95.4Km',
      distanceColor: '#1890FF',
    },
  ],
  jx: [],
  sx: [],
};

export default function AllStore() {
  const [activeCity, setActiveCity] = useState('hz');
  const stores = STORE_DATA[activeCity] || [];

  return (
    <View style={styles.root}>
      {/* 左侧城市Tab */}
      <View style={styles.cityTabWrap}>
        {CITY_LIST.map(city => (
          <TouchableOpacity
            key={city.key}
            style={[styles.cityTab, activeCity === city.key && styles.cityTabActive]}
            onPress={() => setActiveCity(city.key)}
          >
            <Text style={[styles.cityTabText, activeCity === city.key && styles.cityTabTextActive]}>{city.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* 右侧门店列表 */}
      <View style={styles.storeListWrap}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {stores.map((store, idx) => (
            <View key={store.name} style={[styles.storeCard, idx !== 0 && { marginTop: 18 }]}> 
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.storeName}>{store.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <View style={[styles.typeTag, { backgroundColor: store.typeColor }]}> 
                  <Text style={styles.typeTagText}>{store.type}</Text>
                </View>
                <Text style={[styles.distance, { color: store.distanceColor }]}> 距离:{store.distance}</Text>
              </View>
            </View>
          ))}
          {stores.length === 0 && (
            <Text style={{ color: '#bbb', marginTop: 40, textAlign: 'center' }}>暂无门店</Text>
          )}
          {/* 底部提示 */}
          <Text style={styles.bottomTip}>
            <Text style={{ color: '#E54D42', fontSize: 16 }}>* </Text>
            门店取送仅服务周边10Km范围内的位置
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  cityTabWrap: {
    width: 80,
    backgroundColor: '#f5f5f5',
    paddingTop: 16,
    paddingBottom: 16,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  cityTab: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  cityTabActive: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#E6A23C',
  },
  cityTabText: {
    fontSize: 18,
    color: '#888',
  },
  cityTabTextActive: {
    color: '#E6A23C',
    fontWeight: 'bold',
  },
  storeListWrap: {
    flex: 1,
    backgroundColor: '#fff',
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  typeTag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  typeTagText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  distance: {
    fontSize: 15,
    marginLeft: 2,
  },
  bottomTip: {
    marginTop: 32,
    fontSize: 15,
    color: '#888',
  },
});