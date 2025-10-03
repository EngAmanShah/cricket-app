import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function Box({ children,onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={{
          width: 150,
          height: 150,
          justifyContent: "center",
          alignItems: "center",
          borderColor: "red",
          borderWidth: 1,
          borderRadius: 20,
          margin:10,
        }}
      >
        <Text style={{fontWeight:'bold'}}>{children}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({});
