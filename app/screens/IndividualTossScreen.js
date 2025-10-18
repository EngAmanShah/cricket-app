import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ref, update } from "firebase/database";
import { db, auth } from "../config/firebase-config";

export default function TossScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { tournamentId, matchId, teamA, teamB, overs = 10, ballType = "Tennis", format } =
    route.params;

  const [tossWinner, setTossWinner] = useState(null);
  const [electedTo, setElectedTo] = useState("Bat");


  const getTeamName = (team) => {
    if (!team) return "Unknown Team";
    if (typeof team === "string") return team;

    
    if (typeof team.teamName === "string") return team.teamName;
    if (typeof team.name === "string") return team.name;
    if (typeof team.id === "string") return team.id;

    
    return JSON.stringify(team.teamName || team.name || "Unnamed Team");
  };

  const saveMatchToDB = async () => {
    if (!tossWinner) {
      Alert.alert("Select toss winner");
      return;
    }

    try {
      const matchRef = ref(db, `matches/${matchId}`);

      const teamAObj = {
        id: teamA?.id || "A",
        teamName: getTeamName(teamA),
        players: teamA?.players || [],
      };

      const teamBObj = {
        id: teamB?.id || "B",
        teamName: getTeamName(teamB),
        players: teamB?.players || [],
      };

      const tossWinnerName = tossWinner === "A" ? teamAObj.teamName : teamBObj.teamName;
      const battingFirst =
        tossWinner === "A"
          ? electedTo === "Bat"
            ? "A"
            : "B"
          : electedTo === "Bat"
          ? "B"
          : "A";

      const initialLive = {
        scoreA: { runs: 0, wickets: 0, balls: 0 },
        scoreB: { runs: 0, wickets: 0, balls: 0 },
        currentInnings: battingFirst,
        currentOverBalls: 0,
        ballsHistory: [],
        striker:
          battingFirst === "A"
            ? teamAObj.players[0]?.id || null
            : teamBObj.players[0]?.id || null,
        nonStriker:
          battingFirst === "A"
            ? teamAObj.players[1]?.id || null
            : teamBObj.players[1]?.id || null,
        currentBowler: null,
        lastBall: null,
      };

      await update(matchRef, {
        tossWinner: tossWinnerName,
        tossWonBy: tossWinner,
        electedTo,
        battingFirst,
        status: "live",
        live: initialLive,
        startedAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || null,
      });

navigation.replace("LiveIndividualMatch", { matchId });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not start match. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Who won the toss?</Text>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => setTossWinner("A")}
          style={[styles.btn, tossWinner === "A" && styles.selected]}
        >
          <Text style={styles.teamText}>{getTeamName(teamA)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTossWinner("B")}
          style={[styles.btn, tossWinner === "B" && styles.selected]}
        >
          <Text style={styles.teamText}>{getTeamName(teamB)}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.label, { marginTop: 12 }]}>Elected to</Text>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => setElectedTo("Bat")}
          style={[styles.btn, electedTo === "Bat" && styles.selected]}
        >
          <Text style={styles.teamText}>Bat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setElectedTo("Bowl")}
          style={[styles.btn, electedTo === "Bowl" && styles.selected]}
        >
          <Text style={styles.teamText}>Bowl</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={saveMatchToDB} style={styles.startBtn}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Start Match</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  label: { fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  btn: {
    flex: 0.48,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  teamText: { fontWeight: "600", fontSize: 14, color: "#222" },
  selected: { backgroundColor: "#b22222" },
  startBtn: {
    marginTop: 20,
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
});
