import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { ref, get } from "firebase/database";
import { db } from "../config/firebase-config";

export default function MatchSummaryScreen({ route, navigation }) {
  const { matchId, winner, teamA, teamB } = route.params;
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsSnap = await get(ref(db, `matches/${matchId}/live/playerStats`));
        setPlayerStats(statsSnap.val() || {});
      } catch (err) {
        console.error("Error loading stats:", err);
      }
      setLoading(false);
    };
    fetchStats();
  }, [matchId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d32f2f" />
        <Text style={{ marginTop: 8, color: "#333" }}>Loading Match Summary...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 🏆 Header */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>🏆 Match Summary</Text>
        <Text style={styles.subtitle}>{teamA.name} vs {teamB.name}</Text>
        <Text style={styles.winnerText}>Winner: {winner}</Text>
      </View>

      {/* 🏏 Team Score Cards */}
      <View style={styles.teamContainer}>
        <View style={styles.teamCard}>
          <Image
            source={{ uri: teamA.logo }}
            style={styles.teamLogo}
          />
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{teamA.name}</Text>
            <Text style={styles.scoreText}>
              {playerStats?.teamA?.runs || 0}/{playerStats?.teamA?.wickets || 0} ({playerStats?.teamA?.overs || 0} ov)
            </Text>
          </View>
        </View>

        <View style={styles.teamCard}>
          <Image
            source={{ uri: teamB.logo }}
            style={styles.teamLogo}
          />
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{teamB.name}</Text>
            <Text style={styles.scoreText}>
              {playerStats?.teamB?.runs || 0}/{playerStats?.teamB?.wickets || 0} ({playerStats?.teamB?.overs || 0} ov)
            </Text>
          </View>
        </View>
      </View>

      {/* 🧍 Batting Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Batting Summary</Text>
        <TeamTable title={`${teamA.name} Batting`} players={teamA.players} playerStats={playerStats} type="batting" />
        <TeamTable title={`${teamB.name} Batting`} players={teamB.players} playerStats={playerStats} type="batting" />
      </View>

      {/* 🎯 Bowling Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bowling Summary</Text>
        <TeamTable title={`${teamA.name} Bowling`} players={teamA.players} playerStats={playerStats} type="bowling" />
        <TeamTable title={`${teamB.name} Bowling`} players={teamB.players} playerStats={playerStats} type="bowling" />
      </View>

      {/* 🔙 Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>⬅ Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* 📊 Team Table */
const TeamTable = ({ title, players, playerStats, type }) => (
  <View style={styles.tableContainer}>
    <Text style={styles.tableTitle}>{title}</Text>
    <View style={styles.tableHeader}>
      {type === "batting" ? (
        <>
          <Text style={[styles.cell, { flex: 2 }]}>Batsman</Text>
          <Text style={styles.cell}>R</Text>
          <Text style={styles.cell}>B</Text>
          <Text style={styles.cell}>4s</Text>
          <Text style={styles.cell}>6s</Text>
        </>
      ) : (
        <>
          <Text style={[styles.cell, { flex: 2 }]}>Bowler</Text>
          <Text style={styles.cell}>O</Text>
          <Text style={styles.cell}>R</Text>
          <Text style={styles.cell}>W</Text>
        </>
      )}
    </View>

    {players?.map((p) => {
      const s = playerStats?.[p.id];
      if (!s) return null;
      return (
        <View key={p.id} style={styles.tableRow}>
          <Text style={[styles.cell, { flex: 2 }]}>{p.name}</Text>
          {type === "batting" ? (
            <>
              <Text style={styles.cell}>{s.runs || 0}</Text>
              <Text style={styles.cell}>{s.balls || 0}</Text>
              <Text style={styles.cell}>{s.fours || 0}</Text>
              <Text style={styles.cell}>{s.sixes || 0}</Text>
            </>
          ) : (
            <>
              <Text style={styles.cell}>{s.overs || 0}</Text>
              <Text style={styles.cell}>{s.runsGiven || 0}</Text>
              <Text style={styles.cell}>{s.wickets || 0}</Text>
            </>
          )}
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 12,
    padding: 16,
    alignItems: "center",
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#d32f2f",
    marginBottom: 4,
  },
  subtitle: { fontSize: 16, color: "#555" },
  winnerText: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "700",
    color: "#2e7d32",
  },
  teamContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  teamCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "45%",
    padding: 10,
    alignItems: "center",
    elevation: 3,
  },
  teamLogo: { width: 60, height: 60, borderRadius: 30, marginBottom: 6 },
  teamInfo: { alignItems: "center" },
  teamName: { fontSize: 16, fontWeight: "700", color: "#222" },
  scoreText: { fontSize: 18, fontWeight: "800", color: "#d32f2f" },
  section: { backgroundColor: "#fff", margin: 10, borderRadius: 10, padding: 12, elevation: 2 },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: "#d32f2f",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 4,
    marginBottom: 8,
  },
  tableContainer: { marginBottom: 14 },
  tableTitle: { fontWeight: "700", fontSize: 15, color: "#333", marginBottom: 6 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    paddingVertical: 5,
  },
  cell: { flex: 1, textAlign: "center", color: "#333", fontWeight: "600" },
  backBtn: {
    margin: 16,
    backgroundColor: "#d32f2f",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
});
