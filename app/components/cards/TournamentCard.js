import React from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TournamentCard({ name, teams, status,onPress,image,date }) {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.container}>
        <Text style={{ position: "absolute", top: 5, right: 12, color: "red" }}>
          {status}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={image}
            style={{ width: 60, height: 60, borderRadius: 30 }}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontWeight: "bold", textAlign: "center" }}>
              {name}
            </Text>
            <View style={{ flexDirection: "row",alignItems:'center' }}>
              <MaterialIcons name="groups" size={22} color="#FE7F0A" />
              <Text style={{marginLeft:5}}>{teams} teams</Text>
            </View>
          </View>
        </View>
        <View
          style={{
            borderBottomWidth: 0.5,
            borderBottomColor: "#000",
            marginTop: 20,
          }}
        >
        </View>
        <Text style={{textAlign:'center',marginTop:10,}}>{date}</Text>
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
    padding: 20,
  },
});
