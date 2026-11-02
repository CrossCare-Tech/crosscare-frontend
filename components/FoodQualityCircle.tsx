import BadEmoji from '@/assets/images/Svg/BadEmoji';
import GoodEmoji from '@/assets/images/Svg/GoodEmoji';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FoodQualityCircle = ({ goodCount = 2, badCount = 2 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        {/* Left Half - Good Food */}
        <View style={styles.leftHalf}>
          <View style={styles.emojiContainer}>
           <GoodEmoji/>
          </View>
          <Text style={styles.goodLabel}>Good</Text>
          <Text style={styles.goodCount}>{goodCount}</Text>
        </View>
        
        {/* Right Half - Bad Food */}
        <View style={styles.rightHalf}>
          <View style={styles.emojiContainer}>
            <BadEmoji/>
          </View>
          <Text style={styles.badLabel}>Bad</Text>
          <Text style={styles.badCount}>{badCount}</Text>
        </View>
        
        {/* Center Divider Line */}
        <View style={styles.centerLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 100,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth:5,
    borderColor:'rgba(255, 255, 255, 1)',
    position: 'relative',
  },
  leftHalf: {
    flex: 1,
    backgroundColor: 'rgba(235, 249, 241, 1)', // Light green background
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  rightHalf: {
    flex: 1,
    backgroundColor: 'rgba(235, 249, 241, 1)', // Light red background
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 10,
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    marginLeft: -0.5,
  },
  emojiContainer: {
    marginBottom:10,
  },
  goodEmoji: {
    fontSize: 18,
    color: 'rgba(112, 217, 92, 1)',
  },
  badEmoji: {
    fontSize: 18,
    color: 'rgba(249, 98, 97, 1)',
  },
  goodLabel: {
    fontSize: 20,
    fontFamily:'DMSans700',
    color: 'rgba(112, 217, 92, 1)',
  },
  badLabel: {
    fontSize: 20,
    fontFamily:'DMSans700',
    color: 'rgba(249, 98, 97, 1)',
  },
  goodCount: {
    fontSize: 20,
    fontFamily:'DMSans700',
    color: 'rgba(112, 217, 92, 1)',
  },
  badCount: {
    fontSize: 20,
    fontFamily:'DMSans700',
    color: 'rgba(249, 98, 97, 1)',
  },
});

export default FoodQualityCircle;