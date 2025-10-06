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

export default function PlayerCard({
  name,
  onPress,
  image,
  matches,
  runs,
  wickets,
  type,
}) {
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.container}>
        <View style={{ flexDirection: "row" }}>
          <Image
            source={image}
            style={{ width: 60, height: 60, borderRadius: 30 }}
          />
          <View style={{ justifyContent: "center", marginLeft: 10 }}>
            <Text
              style={{
                fontWeight: "bold",
                textAlign: "center",
                color:'white',
              }}
            >
              {name}
            </Text>
            <Text style={{color:'white'}}>{type}</Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            alignItems: "center",
            width: "100%",
          }}
        >
          <View>
            <Text style={{ fontWeight: "bold",color:'white' }}>Matches</Text>
            <Text style={{color:'white'}}>{matches}</Text>
          </View>
          <View
            style={{ borderWidth: 0.5, borderLeftColor: "white", height: 25 }}
          ></View>
          <View>
            <Text style={{ fontWeight: "bold",color:'white' }}>Runs</Text>
            <Text style={{color:'white'}}>{runs}</Text>
          </View>
          <View
            style={{ borderWidth: 0.5, borderLeftColor: "white", height: 25 }}
          ></View>
          <View>
            <Text style={{ fontWeight: "bold",color:'white' }}>wickets</Text>
            <Text style={{color:'white'}}>{wickets}</Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "red",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
        >
          <View
            style={{
              width: "50%",
              height: 30,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{fontWeight:'bold'}}>Profile</Text>
          </View>
          <View
            style={{ borderWidth: 0.5, borderLeftColor: "white", height: 28 }}
          ></View>
          <View
            style={{
              width: "50%",
              height: 30,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{fontWeight:'bold'}}>Insight</Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 150,
    backgroundColor: "#000",
    borderRadius: 20,
    marginLeft: 20,
    elevation: 5,
    padding: 20,
  },
});
