import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;

export default function StartMatch() {
  const navigation = useNavigation();
  const boxSize = screenWidth * 0.4; 

  return (
    <View style={styles.container}>
     
      <TouchableOpacity
        style={[styles.box, { width: boxSize, height: boxSize }]}
        onPress={() =>
          navigation.navigate("Home", { screen: "TournamentHome" })
        }
      >
        <Text style={styles.title}>Tournament</Text>
        <Text style={styles.info}>Next: XYZ Cup</Text>
        <Text style={styles.info}>Start Date: 20 Oct 2025</Text>
      </TouchableOpacity>

    
      {/* <TouchableOpacity
        style={[styles.box, { width: boxSize, height: boxSize }]}
        onPress={() =>
          navigation.navigate("Home", { screen: "StartIndividualMatch" }) 
        }
      >
        <Text style={styles.title}>Individual Match</Text>
        <Text style={styles.info}>Create a match</Text>
        <Text style={styles.info}>Select teams manually</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap", // allow wrapping
    justifyContent: "center",
    alignItems: "flex-start",
    marginTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
  },
  info: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
});
