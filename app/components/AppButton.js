import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function AppButton({ children, onPress,style,styleText }) {
  return (
    <TouchableOpacity style={[styles.container,style]} onPress={onPress}>
      <Text style={[styles.text,styleText]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "90%",
    height: 40,
    alignItems: "center",
    backgroundColor: "#FE7F0A",
    justifyContent: "center",
    borderRadius: 30,
    marginVertical: 5,
  },
  text: { color: "white", fontSize: 17,fontWeight:'700' },
});
