import React from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";

export default function MatchCard({
  status,
  category,
  description,
  team1,
  score1,
  overs1,
  team2,
  score2,
  overs2,
  result,
  onPress,
}) {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.container}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "90%",
            alignSelf: "center",
            marginTop: 5,
          }}
        >
          <Text style={{ fontWeight: "bold" }}>{category}</Text>
          <Text style={{ color: "red" }}>{status}</Text>
        </View>
        <Text style={{ marginLeft: 5, textAlign: "center" }}>
          {description}
        </Text>
        <View
          style={{ borderBottomWidth: 0.5, borderBottomColor: "#000" }}
        ></View>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontWeight: "700", fontSize: 14, margin: 5 }}>
              {team1}
            </Text>
            <Text style={{ fontWeight: "500" }}>{score1}</Text>
            <Text>{overs1}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontWeight: "700", fontSize: 14, margin: 5 }}>
              {team2}
            </Text>
            <Text style={{ fontWeight: "500" }}>{score2}</Text>
            <Text>{overs2}</Text>
          </View>
        </View>
        <View
          style={{
            borderBottomWidth: 0.5,
            borderBottomColor: "#000",
            marginTop: 5,
          }}
        ></View>
        <Text style={{ marginTop: 5, textAlign: "center" }}>{result}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 150,
    borderRadius: 20,
    marginLeft: 20,
    backgroundColor: "white",
    elevation: 5,
  },
});
