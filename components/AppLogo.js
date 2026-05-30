import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AppLogo({ size = 90 }) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.22,
          },
        ]}
      >
        NOW
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A73E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  text: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 2,
  },
});