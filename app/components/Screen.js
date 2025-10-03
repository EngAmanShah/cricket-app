import React from "react";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { StyleSheet, SafeAreaView, View,ScrollView } from "react-native";

export default function Screen({ children, style }) {
  return (
    <SafeAreaView style={[styles.screen, style]}>
      <View style={[styles.view, style]}>{children}</View>
      <StatusBar style='auto' />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    screen: {
      marginTop: Constants.statusBarHeight,
      flex: 1,
    },
    view: {
      flex: 1,
    },
  });
  
