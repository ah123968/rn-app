import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import React from 'react';

export default function Introduce() {
  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部主题色横条 */}
    
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            浣熊洗生活服务有限责任公司，是一家极具创新力的互联网加实体连锁性品牌公司。
          </Text>
          <Text style={styles.paragraph}>
            我们以多元化的服务满足客户的各种生活需求，涵盖洗衣、洗鞋、皮具护理、奢侈品修复、二手奢侈品买卖以及家政服务等多个领域。无论是日常衣物的清洁，还是珍贵皮具的保养、奢侈品的精心修复，亦或是追求高性价比的二手奢侈品交易，以及贴心的家政服务，我们都以专业的水准和敬业的态度为客户提供卓越体验。
          </Text>
          <Text style={styles.paragraph}>
            作为连锁品牌，我们为加盟商提供全方位的一站式帮扶。从店面的精准选址，到独具风格的装修设计，再到详细的开店流程指导以及科学高效的运营管理方案，我们倾尽全力确保加盟商能够顺利开店。凭借我们丰富的经验和专业的团队，助力加盟商实现业绩翻倍，共同开创成功的商业未来。
          </Text>
          <Text style={styles.paragraph}>
            浣熊洗生活服务有限责任公司以科技为翼，以实体为基，不断拓展服务边界，提升服务品质，致力于成为生活服务行业的引领者，为客户和加盟商创造更大的价值。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  topBar: {
    height: 12,
    backgroundColor: '#e2ac62',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    width: '94%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  paragraph: {
    fontSize: 16,
    color: '#222',
    lineHeight: 26,
    marginBottom: 12,
    textAlign: 'justify',
  },
});