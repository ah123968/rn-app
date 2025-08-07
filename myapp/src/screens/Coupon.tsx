import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import React, { useState } from 'react';

const { width } = Dimensions.get('window');

const tabs = [
    { key: 'unused', label: '待使用' },
    { key: 'used', label: '已使用' },
    { key: 'expired', label: '已失效' },
];

const couponData = [
    {
        id: 1,
        amount: 10,
        type: '新人专享券',
        title: '洗护专场',
        valid: '有效期至2023.04.24/23:59',
        desc: '仅限新用户下单使用，满99自动抵扣！',
        btn: '去使用',
        color: '#4FC3F7',
    },
];

export default function Coupon() {
    const [activeTab, setActiveTab] = useState('unused');
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

            {/* 列表区 */}
            <ScrollView style={styles.scroll} contentContainerStyle={{ flexGrow: 1 }}>
                {activeTab === 'unused' && couponData.map(item => (
                    <View key={item.id} style={styles.cardBox}>
                        <View style={styles.cardLeft}>
                            <Text style={styles.amount}><Text style={styles.amountY}>¥</Text>{item.amount}</Text>
                            <Text style={styles.couponType}>{item.type}</Text>
                        </View>
                        <View style={[styles.cardRight, { backgroundColor: item.color }]}>
                            <View style={styles.cardRightTop}>
                                <Text style={styles.couponTitle}>{item.title}</Text>
                                <TouchableOpacity style={styles.useBtn}>
                                    <Text style={styles.useBtnText}>{item.btn}</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.valid}>{item.valid}</Text>
                        </View>
                    </View>
                ))}
                {activeTab === 'unused' && (
                    <Text style={styles.desc}>{couponData[0].desc}</Text>
                )}
            </ScrollView>

            {/* 底部提示 */}
            <Text style={styles.bottomTip}>领取优惠券，享受更优性价比！</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        position: 'relative',
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
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    cardLeft: {
        width: 90,
        backgroundColor: '#FFF7E6',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRightWidth: 1,
        borderRightColor: '#F2C07B',
    },
    amount: {
        fontSize: 24,
        color: '#F2C07B',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    amountY: {
        fontSize: 14,
        color: '#F2C07B',
        fontWeight: 'bold',
    },
    couponType: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    cardRight: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
        backgroundColor: '#4FC3F7',
    },
    cardRightTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    couponTitle: {
        fontSize: 16,
        color: '#222',
        fontWeight: 'bold',
    },
    useBtn: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    useBtnText: {
        color: '#4FC3F7',
        fontWeight: 'bold',
        fontSize: 15,
    },
    valid: {
        fontSize: 12,
        color: '#333',
    },
    desc: {
        color: '#BDBDBD',
        fontSize: 12,
        marginTop: 2,
        marginLeft: 6,
        marginBottom: 10,
    },
    bottomTip: {
        textAlign: 'center',
        color: '#3B6EFF',
        fontSize: 13,
        marginBottom: 8,
        marginTop: 2,
    },
});