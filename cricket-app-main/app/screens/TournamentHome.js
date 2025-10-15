// TournamentHome.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { db } from "../config/firebase-config";
import { ref, onValue } from "firebase/database";
import { useNavigation } from "@react-navigation/native";

export default function TournamentHome() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const tournamentsRef = ref(db, "tournaments");
    const unsubscribe = onValue(tournamentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setTournaments(Object.entries(data).map(([id, t]) => ({ id, ...t })));
      } else {
        setTournaments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, marginTop: 50 }} />;

  if (tournaments.length === 0)
    return <Text style={{ textAlign: "center", marginTop: 50 }}>No tournaments found!</Text>;

  return (
    <FlatList
      data={tournaments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 15 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("TournamentDetails", { tournamentId: item.id })}
        >
          <Image
            source={item.logo ? { uri: item.logo } : require("../assets/t1.jpg")}
            style={styles.logo}
          />
          <View style={{ marginLeft: 15, flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.dates}>
              {item.startDate || "N/A"} - {item.endDate || "TBD"}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logo: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#eee" },
  name: { fontSize: 16, fontWeight: "bold" },
  dates: { fontSize: 12, color: "#555", marginTop: 4 },
});
