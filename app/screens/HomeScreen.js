import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import Header from "./Header";
import Screen from "../components/Screen";
import TournamentCard from "../components/cards/TournamentCard";
import ClubCard from "../components/cards/ClubCard";
import PlayerCard from "../components/cards/PlayerCard";
import NewsCard from "../components/cards/NewsCard";
import { db } from "../config/firebase-config";
import { ref, onValue } from "firebase/database";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen({ navigation }) {
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setTournaments(list);
        } else {
          setTournaments([]);
        }
        setLoadingTournaments(false);
      },
      (error) => {
        console.error("Firebase fetch error:", error);
        setLoadingTournaments(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const matchesRef = ref(db, "matches");
    const unsubscribe = onValue(matchesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const matchList = Object.entries(data).map(([id, value]) => {
        const teamAName = value.teamA ?? "Team A";
        const teamBName = value.teamB ?? "Team B";

        const scoreA = value.live?.scoreA ?? value.scoreA ?? { runs: 0, wickets: 0, balls: 0 };
        const scoreB = value.live?.scoreB ?? value.scoreB ?? { runs: 0, wickets: 0, balls: 0 };

        const oversA = value.live?.oversA ?? value.oversA ?? (scoreA.balls ? `${Math.floor(scoreA.balls / 6)}.${scoreA.balls % 6}` : "-");
        const oversB = value.live?.oversB ?? value.oversB ?? (scoreB.balls ? `${Math.floor(scoreB.balls / 6)}.${scoreB.balls % 6}` : "-");

        return {
          id,
          teamA: teamAName,
          teamB: teamBName,
          overs: value.overs ?? "N/A",
          oversA,
          oversB,
          venue: value.venue ?? "Unknown",
          players: value.players ?? null,
          live: value.live ?? null,
          completed: value.status === "completed",
          status: value.status ?? "upcoming",
          tournamentId: value.tournamentId ?? null,
          winner: value.winner ?? null,
          scoreA,
          scoreB,
        };
      });
      setMatches(matchList);

      Object.keys(data).forEach((matchId) => {
        const liveRef = ref(db, `matches/${matchId}/live`);
        onValue(liveRef, (liveSnap) => {
          const liveData = liveSnap.val() || null;
          setMatches((prev) =>
            prev.map((m) => (m.id === matchId ? { ...m, live: liveData } : m))
          );
        });
      });
    });
    return () => unsubscribe();
  }, []);

  const getStatus = (tournament) => {
    const today = new Date();
    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);
    if (start > today) return "Upcoming";
    if (start <= today && today <= end) return "Ongoing";
    if (end < today) return "Past";
    return "Upcoming";
  };

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Screen>
      <Header
        handleSearch={() => navigation.navigate("Search")}
        handleNews={() => navigation.navigate("News")}
        handleDrawer={() => navigation.openDrawer()}
      />

      <ScrollView contentContainerStyle={{ backgroundColor: "#e0dede" }}>
        <Text style={styles.sectionTitle}>Matches</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
        >
      {matches.map((m) => {
  const teamAName = typeof m.teamA === "object" ? m.teamA.teamName : m.teamA || "Team A";
  const teamBName = typeof m.teamB === "object" ? m.teamB.teamName : m.teamB || "Team B";

  const scoreA = m.live?.scoreA ?? m.scoreA ?? { runs: 0, wickets: 0, balls: 0 };
  const scoreB = m.live?.scoreB ?? m.scoreB ?? { runs: 0, wickets: 0, balls: 0 };

  const oversA = m.live?.oversA ?? m.oversA ?? (scoreA.balls ? `${Math.floor(scoreA.balls / 6)}.${scoreA.balls % 6}` : "-");
  const oversB = m.live?.oversB ?? m.oversB ?? (scoreB.balls ? `${Math.floor(scoreB.balls / 6)}.${scoreB.balls % 6}` : "-");

  const scoreText = `${scoreA.runs}/${scoreA.wickets} - ${scoreB.runs}/${scoreB.wickets}`;
  const oversText = `${oversA} / ${oversB}`;

  const isLive = m.live?.currentInnings != null && !m.completed;
  const isCompleted = m.completed;
  const badgeColor = isLive ? "red" : isCompleted ? "green" : "#888";
  const badgeText = isLive ? "LIVE" : isCompleted ? "COMPLETED" : "UPCOMING";

  const target = m.live?.currentInnings === "B" && m.live?.target
    ? `🎯 Target: ${m.live.target}`
    : "";

  const winnerText = isCompleted && m.winner ? `🏆 Winner: ${m.winner}` : "";

  return (
    <TouchableOpacity
      key={m.id}
      onPress={() => toggleExpand(m.id)}
      style={{
        marginRight: 12,
        minWidth: 250,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        position: "relative",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          backgroundColor: badgeColor,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 6,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
          {badgeText}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "700" }}>{teamAName}</Text>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontWeight: "700", fontSize: 16 }}>{scoreText}</Text>
          <Text style={{ color: "#555", fontSize: 12 }}>Overs: {oversText}</Text>
        </View>
        <Text style={{ fontWeight: "700" }}>{teamBName}</Text>
      </View>

      {expandedId === m.id && (
        <View style={{ marginTop: 10 }}>
          {target ? <Text style={{ fontWeight: "700" }}>{target}</Text> : null}
          {winnerText ? (
            <Text style={{ fontSize: 12, marginTop: 6, fontWeight: "600" }}>
              {winnerText}
            </Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
})}

        </ScrollView>

        <Text style={styles.sectionTitle}>Tournaments</Text>
        {loadingTournaments ? (
          <ActivityIndicator size="large" color="#3f8c67" style={{ marginTop: 20 }} />
        ) : tournaments.length > 0 ? (
          <ScrollView horizontal contentContainerStyle={{ paddingRight: 20, height: 160 }}>
            {tournaments.map((t) => (
              <View key={t.id} style={{ position: "relative" }}>
                <TournamentCard
                  name={t.name}
                  image={t.logo ? { uri: t.logo } : require("../assets/t1.jpg")}
                  date={`${t.startDate || t.createdAt} - ${t.endDate || "TBD"}`}
                  onPress={() =>
                    navigation.navigate("TournamentDetails", { tournamentId: t.id })
                  }
                />
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{getStatus(t)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={{ marginLeft: 20, color: "#555" }}>No tournaments available</Text>
        )}

        <Text style={styles.sectionTitle}>Clubs</Text>
        <ScrollView horizontal contentContainerStyle={{ paddingRight: 20, height: 160 }}>
          <ClubCard name="Hazro Cricket Club" image={require("../assets/t3.jpg")} address="Hazro" />
        </ScrollView>

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

        <Text style={styles.sectionTitle}>News/Blogs</Text>
        <ScrollView horizontal contentContainerStyle={{ paddingRight: 20, height: 200 }}>
          <NewsCard
            image={require("../assets/india.jpg")}
            description="India won the match against Pakistan in the 2022 World Cup..."
            date="03 November, 2022"
          />
        </ScrollView>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.supportBox}>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 17 }}>Need help?</Text>
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
