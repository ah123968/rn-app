import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { get } from '../utils/request';
import { useNavigation } from '@react-navigation/native';

type StoreItem = {
  _id?: string;
  name: string;
  type?: string;
  address?: string;
  distance?: string; // e.g. "9.4km" when lat/lon provided
  status?: string;
};

export default function AllStore() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigation = useNavigation();

  const fetchStores = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // 不携带经纬度，返回营业中的门店列表；如需计算距离，可在此传入 latitude/longitude
      const res = await get('/store/list', { page: 1, limit: 20 });
      const payload = res?.data;
      if (payload && payload.code === 0 && payload.data?.stores) {
        setStores(payload.data.stores as StoreItem[]);
      } else {
        setError(payload?.message || '获取门店失败');
      }
    } catch (e: any) {
      setError(e?.message || '网络错误');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return (
    <View style={styles.root}>
      {/* 门店列表（上下直列展示） */}
      <View style={styles.storeListWrap}>
        {isLoading ? (
          <View style={styles.centerArea}>
            <ActivityIndicator size="large" color="#E6A23C" />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <>
                {stores.map((store: StoreItem, idx: number) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    delayPressIn={0}
                    onPress={() =>
                      (navigation as any).navigate('MainTabs', {
                        screen: 'Cart',
                        params: {
                          store: {
                            name: store.name,
                            type: store.type ?? '上门取送',
                            distance: store.distance ?? '',
                          },
                        },
                      })
                    }
                    key={store._id || store.name + idx}
                    style={[styles.storeCard, idx !== 0 && styles.storeCardSpacing]}
                  > 
                    <View style={styles.rowMb4}>
                      <Text style={styles.storeName}>{store.name}</Text>
                    </View>
                    <View style={styles.rowMb2}>
                      {!!store.type && (
                        <View style={[styles.typeTag, styles.typeTagGold]}> 
                          <Text style={styles.typeTagText}>{store.type}</Text>
                        </View>
                      )}
                      {!!store.distance && (
                        <Text style={[styles.distance, styles.distanceBlue]}> 距离:{store.distance}</Text>
                      )}
                    </View>
                    {!!store.address && (
                      <Text style={styles.address}>{store.address}</Text>
                    )}
                  </TouchableOpacity>
                ))}
                {stores.length === 0 && (
                  <Text style={styles.emptyText}>暂无门店</Text>
                )}
                {/* 底部提示 */}
                <Text style={styles.bottomTip}>
                  <Text style={styles.bottomTipStar}>* </Text>
                  门店取送仅服务周边10Km范围内的位置
                </Text>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  storeListWrap: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
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
  storeCardSpacing: {
    marginTop: 18,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  rowMb4: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowMb2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  typeTag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  typeTagGold: {
    backgroundColor: '#C89B5A',
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
  distanceBlue: {
    color: '#1890FF',
  },
  address: {
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    color: '#bbb',
    marginTop: 40,
    textAlign: 'center',
  },
  errorText: {
    color: '#E54D42',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  bottomTip: {
    marginTop: 32,
    fontSize: 15,
    color: '#888',
  },
  bottomTipStar: {
    color: '#E54D42',
    fontSize: 16,
  },
});