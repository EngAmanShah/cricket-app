import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import AppTextInput from "../components/AppTextInput";
import AppButton from "../components/AppButton";

export default function Search() {
  const [selected, setselected] = useState("player");
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <AppTextInput
        placeholder="Search here"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect={false}
        rightIcon="search"
      />
    </View>
  );
}
