import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Header from "./Header";
import Screen from "../components/Screen";
import MatchCard from "../components/cards/MatchCard";
import TournamentCard from "../components/cards/TournamentCard";
import ClubCard from "../components/cards/ClubCard";
import PlayerCard from "../components/cards/PlayerCard";
import NewsCard from "../components/cards/NewsCard";
import { db } from "../config/firebase-config";
import { ref, onValue } from "firebase/database";

export default function HomeScreen({ navigation }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tournamentsRef = ref(db, "tournaments");

    const unsubscribe = onValue(
      tournamentsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const list = Object.entries(data).map(([id, value]) => ({
            id,
            name: value.name || "Unnamed Tournament",
            imageUrl: value.imageUrl || null,
            startDate: value.startDate || "N/A",
            endDate: value.endDate || "N/A",
            createdAt: value.createdAt || "1970-01-01",
          }));

          // Sort by latest createdAt
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setTournaments(list);
        } else {
          setTournaments([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("🔥 Firebase fetch error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 🔹 Calculate tournament status dynamically
  const getStatus = (tournament) => {
    const today = new Date();
    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);

    if (start > today) return "Upcoming";
    if (start <= today && today <= end) return "Ongoing";
    if (end < today) return "Past";
    return "Upcoming";
  };

  return (
    <Screen>
      {/* ✅ Single Header only */}
      <Header
        handleSearch={() => navigation.navigate("Search")}
        handleNews={() => navigation.navigate("News")}
        handleDrawer={() => navigation.openDrawer()}
      />

      <ScrollView contentContainerStyle={{ backgroundColor: "#e0dede" }}>
        {/* Matches Section */}
        <Text style={styles.sectionTitle}>Matches</Text>
        <ScrollView horizontal contentContainerStyle={{ height: 160, paddingRight: 20 }}>
          <MatchCard
            status="LIVE"
            category="T20"
            description="Zahid VS Usama - 1st T20, Attock"
            team1="ZAHID HANGU"
            team2="USAMA HAZRO"
            score1="110/5"
            overs1="20.0"
            score2="90/7"
            overs2="17.0"
            result="USAMA HAZRO requires 20 runs in 3 overs"
            onPress={() => navigation.navigate("Match Details")}
          />
        </ScrollView>

        {/* ✅ Tournament Section */}
        <Text style={styles.sectionTitle}>Tournaments</Text>

      {loading ? (
  <ActivityIndicator size="large" color="#3f8c67" style={{ marginTop: 20 }} />
) : tournaments.length > 0 ? (
  <ScrollView horizontal contentContainerStyle={{ paddingRight: 20, height: 160 }}>
    {tournaments.map((t) => {
      console.log("Tournament Item:", t); // ✅ Debug each tournament

      return (
        <View key={t.id} style={{ position: "relative" }}>
          <TournamentCard
            name={t.name}
            image={t.logo ? { uri: t.logo } : require("../assets/t1.jpg")} // ✅ use t.logo
            date={`${t.startDate || t.createdAt} - ${t.endDate || "TBD"}`} // fallback startDate
            onPress={() => {
              console.log("Navigating to TournamentDetails with ID:", t.id); // ✅ Debug navigation
              navigation.navigate("TournamentDetails", { tournamentId: t.id }); // ✅ pass correct ID
            }}
          />
          {/* Status badge */}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatus(t)}</Text>
          </View>
        </View>
      );
    })}
  </ScrollView>
        ) : (
          <Text style={{ marginLeft: 20, color: "#555" }}>No tournaments available</Text>
        )}

        {/* Clubs Section */}
        <Text style={styles.sectionTitle}>Clubs</Text>
        <ScrollView horizontal contentContainerStyle={{ paddingRight: 20, height: 160 }}>
          <ClubCard name="Hazro Cricket Club" image={require("../assets/t3.jpg")} address="Hazro" />
        </ScrollView>

        {/* Players Section */}
        <Text style={styles.sectionTitle}>Featured Players</Text>
        <ScrollView horizontal contentContainerStyle={{ height: 160, paddingRight: 20 }}>
          <PlayerCard
            name="Muhammad Zahid"
            image={require("../assets/profile.jpeg")}
            runs={200}
            wickets={25}
            matches={10}
            type="Batter"
          />
        </ScrollView>

        {/* News Section */}
        <Text style={styles.sectionTitle}>News/Blogs</Text>
        <ScrollView horizontal contentContainerStyle={{ paddingRight: 20, height: 200 }}>
          <NewsCard
            image={require("../assets/india.jpg")}
            description="India won the match against Pakistan in the 2022 World Cup..."
            date="03 November, 2022"
          />
        </ScrollView>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.supportBox}>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 17 }}>
            Need help?
          </Text>
          <Text style={{ color: "white", lineHeight: 20 }}>
            {`Mail us at support@cricworld.com \nCall or WhatsApp:\nOsama +923125273333\nZahid +923125274444`}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 20,
    margin: 20,
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#3f8c67",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  supportBox: {
    padding: 20,
    width: 320,
    height: 140,
    backgroundColor: "#3f8c67",
    borderRadius: 20,
    marginLeft: 20,
    elevation: 5,
    marginBottom: 20,
  },
});
