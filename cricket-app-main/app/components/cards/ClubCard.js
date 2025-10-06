import React from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  ImageBackground,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function ClubCard({ name, onPress, image, address }) {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <ImageBackground
        blurRadius={1}
        source={image}
        style={styles.container}
        imageStyle={{ borderRadius: 20 }}
      >
        <Text
          style={{
            fontWeight: "bold",
            textAlign: "center",
            color: "white",
          }}
        >
          {name}
        </Text>
        <View
          style={{
            borderBottomWidth: 0.5,
            borderBottomColor: "white",
            marginTop: 20,
          }}
        ></View>
        <Text
          style={{
            textAlign: "center",
            marginTop: 10,
            color: "white",
            fontWeight: "bold",
          }}
        >
          {address}
        </Text>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 150,
    borderRadius: 20,
    marginLeft: 20,
    elevation: 5,
    padding: 20,
  },
});
