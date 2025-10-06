import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Header({ handleSearch, handleNews, handleDrawer }) {
  return (
    <View
      style={{
        width: "100%",
        height: 50,
        backgroundColor: "#a10517",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <TouchableOpacity onPress={handleDrawer}>
        <Ionicons name="menu" size={35} color="white" />
      </TouchableOpacity>
      <Text style={{ color: "white", fontSize: 20 }}>My Cricket</Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          width: "30%",
        }}
      >
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="search" size={35} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNews}>
          <Ionicons name="md-newspaper-outline" size={35} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
