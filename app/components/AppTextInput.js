import React from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AppTextInput({
  style,
  rightIcon,
  onPress,
  ...otherProps
}) {
  return (
    <View style={styles.container}>
      <TextInput
        placeholderTextColor="#000"
        style={[styles.textInput, style]}
        {...otherProps}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onPress}>
          <Ionicons style={{ marginRight: 0 }} name={rightIcon} size={25} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "80%",
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "black",
    padding: 10,
    textAlign: "center",
    justifyContent: "space-between",
  },
  textInput: {
    width: "90%",
    textAlign: "center",
  },
});
