import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';

const tabs = [
    { key: 'can', label: '可售后' },
    { key: 'ing', label: '售后中' },
    { key: 'ed', label: '已售后' },
];

const orderList = [
    {
        id: 1,
        title: '洗护订单',
        status: '等待取件',
        statusColor: '#3B6EFF',
        type: '上门取送',
        count: 3,
        price: 55,
    },
    {
        id: 2,
        title: '洗护订单',
        status: '等待到店',
        statusColor: '#3B6EFF',
        type: '自主到店',
        count: 3,
        price: 55,
    },
];

export default function BadPro() {
    const [activeTab, setActiveTab] = useState('can');
    return (
        <View style={styles.container}>
            {/* 顶部Tab */}
            <View style={styles.tabBar}>
                {tabs.map(tab => (
                    <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.tabBtn}>
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                        {activeTab === tab.key && <View style={styles.tabUnderline} />}
                    </TouchableOpacity>
                ))}
            </View>

            {/* 订单列表 */}
            <ScrollView style={styles.scroll} contentContainerStyle={{ flexGrow: 1 }}>
                {activeTab === 'can' && orderList.map(item => (
                    <View key={item.id} style={styles.cardBox}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <View style={styles.statusTag}><Text style={styles.statusText}>{item.status}</Text></View>
                        </View>
                        <Text style={styles.cardType}>{item.type}</Text>
                        <Text style={styles.cardCount}>商品数量×{item.count}</Text>
                        <View style={styles.cardFooter}>
                            <Text style={styles.priceLabel}>实付费用：</Text>
                            <Text style={styles.priceValue}>¥{item.price.toFixed(2)}</Text>
                        </View>
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>取消订单</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>订单详情</Text></TouchableOpacity>
                        </View>
                    </View>
                ))}
                {/* 其他tab可根据需要补充 */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingTop: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#F2C07B',
    },
    tabBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 5,
        position: 'relative',
    },
    tabText: {
        fontSize: 16,
        color: '#BDBDBD',
        fontWeight: 'bold',
    },
    tabTextActive: {
        color: '#F2C07B',
    },
    tabUnderline: {
        position: 'absolute',
        left: '25%',
        right: '25%',
        bottom: -1,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#F2C07B',
    },
    scroll: {
        flex: 1,
        padding: 15,
    },
    cardBox: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
        marginRight: 8,
    },
    statusTag: {
        backgroundColor: '#F3F8FF',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 2,
    },
    statusText: {
        color: '#3B6EFF',
        fontSize: 13,
    },
    cardType: {
        color: '#333',
        fontSize: 14,
        marginBottom: 2,
    },
    cardCount: {
        color: '#666',
        fontSize: 13,
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    priceLabel: {
        color: '#666',
        fontSize: 14,
    },
    priceValue: {
        color: '#FF4D4F',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 2,
    },
    btnRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    btn: {
        borderWidth: 1,
        borderColor: '#D9D9D9',
        borderRadius: 6,
        paddingHorizontal: 18,
        paddingVertical: 6,
        marginLeft: 8,
    },
    btnText: {
        color: '#333',
        fontSize: 14,
    },
});