import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { db } from "../config/firebase-config";
import { ref, onValue } from "firebase/database";

export default function TeamLeaderboardScreen() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const tournamentsRef = ref(db, "tournaments");
    const unsubscribe = onValue(tournamentsRef, (snapshot) => {
      const tournaments = snapshot.val() || {};
      const teamStats = {}; 

      const initTeam = (name, logo) => {
        if (!teamStats[name]) {
          teamStats[name] = {
            id: name,
            name,
            logo: logo && logo.startsWith("http")
              ? logo
              : "https://via.placeholder.com/40",
            matchesPlayed: 0,
            wins: 0,
          };
        }
      };

      Object.values(tournaments).forEach((tournament) => {
        const teamsInTournament = tournament.teams || {};
        const matches = tournament.matches || {};

        Object.values(teamsInTournament).forEach((team) => {
          const teamName = team.teamName || "Unnamed Team";
          initTeam(teamName, team.logo);
        });

        Object.values(matches).forEach((match) => {
          const teamAName = match.teamA?.teamName || "Unnamed Team";
          const teamBName = match.teamB?.teamName || "Unnamed Team";

          initTeam(teamAName, match.teamA?.logo);
          initTeam(teamBName, match.teamB?.logo);

          if (match.status === "completed") {
            teamStats[teamAName].matchesPlayed += 1;
            teamStats[teamBName].matchesPlayed += 1;

            if (match.winner === teamAName) teamStats[teamAName].wins += 1;
            else if (match.winner === teamBName) teamStats[teamBName].wins += 1;
          }
        });
      });

      const teamList = Object.values(teamStats).map((team) => ({
        ...team,
        losses: team.matchesPlayed - team.wins,
        winRate: team.matchesPlayed
          ? (team.wins / team.matchesPlayed) * 100
          : 0,
      }));

      teamList.sort((a, b) => b.winRate - a.winRate);

      setTeams(teamList.slice(0, 50));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredTeams = teams.filter((team) =>
    (team.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const renderTeam = ({ item, index }) => {
    let backgroundColor = "#fff";
    if (index === 0) backgroundColor = "#FFD700"; 
    else if (index === 1) backgroundColor = "#C0C0C0"; 
    else if (index === 2) backgroundColor = "#CD7F32"; 

    return (
      <View style={[styles.card, { backgroundColor }]}>
        <Text style={styles.rank}>{index + 1}</Text>
        <Image source={{ uri: item.logo }} style={styles.logo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.teamName}>{item.name}</Text>
          <Text style={styles.stats}>
            {item.matchesPlayed} MP | {item.wins}W / {item.losses}L |{" "}
            {item.winRate.toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Top 50 Teams</Text>
      <TextInput
        style={styles.search}
        placeholder="Search teams..."
        value={search}
        onChangeText={setSearch}
      />
      {filteredTeams.length === 0 ? (
        <View style={styles.noData}>
          <Text style={{ fontSize: 16, color: "#555" }}>No teams found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTeams}
          keyExtractor={(item) => item.id}
          renderItem={renderTeam}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 20 },
  header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  search: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  rank: { fontSize: 18, fontWeight: "bold", width: 30 },
  logo: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  teamName: { fontSize: 16, fontWeight: "600" },
  stats: { fontSize: 14, color: "#555" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  noData: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
});
