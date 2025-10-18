import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ref, get, set, push, update, onValue } from "firebase/database";
import { db } from "../config/firebase-config";

export default function KnockoutScreen({ route }) {
  const { tournamentId } = route.params;
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [tournament, setTournament] = useState(null);

  useEffect(() => {
    const tRef = ref(db, `tournaments/${tournamentId}`);
    const mRef = ref(db, "matches");

    const unsubT = onValue(tRef, (snap) => {
      if (snap.exists()) setTournament(snap.val());
    });

    const unsubM = onValue(mRef, (snap) => {
      if (!snap.exists()) {
        setMatches([]);
        return;
      }
      const allMatches = Object.entries(snap.val()).map(([id, m]) => ({
        id,
        ...m,
      }));
      const knockout = allMatches.filter(
        (m) =>
          m.tournamentId === tournamentId &&
          ["Quarter Final", "Semi Final", "Final"].includes(m.stage)
      );
      setMatches(knockout);
    });

    return () => {
      unsubT();
      unsubM();
    };
  }, [tournamentId]);

  const generateNextKnockoutStage = async () => {
    if (!tournament) return;
    try {
      setLoading(true);
      const points = tournament.pointsTable || {};
      const sortedTeams = Object.values(points).sort(
        (a, b) => b.points - a.points || b.nrr - a.nrr
      );

      const snap = await get(ref(db, "matches"));
      const allMatches = snap.exists()
        ? Object.entries(snap.val()).map(([id, m]) => ({ id, ...m }))
        : [];

      const qf = allMatches.filter(
        (m) => m.tournamentId === tournamentId && m.stage === "Quarter Final"
      );
      const semi = allMatches.filter(
        (m) => m.tournamentId === tournamentId && m.stage === "Semi Final"
      );
      const final = allMatches.filter(
        (m) => m.tournamentId === tournamentId && m.stage === "Final"
      );

      if (qf.length === 0 && sortedTeams.length >= 8) {
        const top8 = sortedTeams.slice(0, 8);
        const created = [];
        for (let i = 0; i < top8.length; i += 2) {
          const match = {
            tournamentId,
            stage: "Quarter Final",
            teamA: { teamName: top8[i].teamName },
            teamB: { teamName: top8[i + 1].teamName },
            status: "upcoming",
            createdAt: new Date().toISOString(),
          };
          const newRef = push(ref(db, "matches"));
          await set(newRef, match);
          created.push(newRef.key);
        }
        await update(ref(db, `tournaments/${tournamentId}`), {
          quarterFinals: created,
          knockoutStage: "Quarter Final",
        });
        Alert.alert("✅ Quarter Finals Created!");
        return;
      }

      const qfCompleted = allMatches
        .filter(
          (m) =>
            m.tournamentId === tournamentId &&
            m.stage === "Quarter Final" &&
            (m.status === "completed" || m.status === "complete") &&
            m.winner
        )
        .map((m) => m.winner);

      const semiStage = allMatches.filter(
        (m) => m.tournamentId === tournamentId && m.stage === "Semi Final"
      );

      let semiTeams = [];
      if (qfCompleted.length >= 2) semiTeams = qfCompleted;
      else if (sortedTeams.length >= 2) semiTeams = sortedTeams.map((t) => t.teamName);

      if (semiStage.length === 0 && semiTeams.length >= 2) {
        const created = [];
        for (let i = 0; i < semiTeams.length; i += 2) {
          if (!semiTeams[i + 1]) break;
          const match = {
            tournamentId,
            stage: "Semi Final",
            teamA: { teamName: semiTeams[i] },
            teamB: { teamName: semiTeams[i + 1] },
            status: "upcoming",
            createdAt: new Date().toISOString(),
          };
          const newRef = push(ref(db, "matches"));
          await set(newRef, match);
          created.push(newRef.key);
        }
        await update(ref(db, `tournaments/${tournamentId}`), {
          semiFinals: created,
          knockoutStage: "Semi Final",
        });
        Alert.alert("✅ Semi Finals Created!");
        return;
      }

      const semiCompleted = allMatches
        .filter(
          (m) =>
            m.tournamentId === tournamentId &&
            m.stage === "Semi Final" &&
            (m.status === "completed" || m.status === "complete") &&
            m.winner
        )
        .map((m) => m.winner);

      const finalStage = allMatches.filter(
        (m) => m.tournamentId === tournamentId && m.stage === "Final"
      );

      if (finalStage.length === 0 && semiCompleted.length >= 2) {
        const finalMatch = {
          tournamentId,
          stage: "Final",
          teamA: { teamName: semiCompleted[0] },
          teamB: { teamName: semiCompleted[1] },
          status: "upcoming",
          createdAt: new Date().toISOString(),
        };
        const newRef = push(ref(db, "matches"));
        await set(newRef, finalMatch);
        await update(ref(db, `tournaments/${tournamentId}`), {
          finalMatch: newRef.key,
          knockoutStage: "Final",
        });
        Alert.alert("🏆 Final Created!");
        return;
      }

      Alert.alert("⚠️ No new knockout stage can be generated now.");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const announceChampion = async () => {
    const finalMatch = matches.find(
      (m) =>
        m.stage === "Final" &&
        (m.status === "completed" || m.status === "complete")
    );
    if (!finalMatch?.winner) {
      Alert.alert("⚠️ Final not completed yet!");
      return;
    }
    await update(ref(db, `tournaments/${tournamentId}`), {
      champion: finalMatch.winner,
    });
    Alert.alert(`🏆 Tournament Winner: ${finalMatch.winner}`);
  };

  const renderMatch = ({ item }) => (
    <View
      style={[
        styles.matchCard,
        item.status === "completed" || item.status === "complete"
          ? { backgroundColor: "#d1f7c4", borderColor: "#4CAF50" }
          : item.status === "ongoing"
          ? { backgroundColor: "#fff3cd", borderColor: "#FFC107" }
          : { backgroundColor: "#f9f9f9" },
      ]}
    >
      <Text style={styles.stage}>{item.stage}</Text>
      <Text>
        {item.teamA?.teamName} 🆚 {item.teamB?.teamName}
      </Text>
      <Text>
        Status:{" "}
        <Text style={{ fontWeight: "bold" }}>
          {item.status === "complete" || item.status === "completed"
            ? "Completed"
            : item.status}
        </Text>
      </Text>
      {item.winner && <Text>🏆 Winner: {item.winner}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🏆 Knockout Stage</Text>
      {loading && <ActivityIndicator size="large" color="#2196F3" />}

      <TouchableOpacity
        style={styles.button}
        onPress={generateNextKnockoutStage}
      >
        <Text style={styles.buttonText}>Generate Next Knockout Stage</Text>
      </TouchableOpacity>

      {matches.length > 0 && !tournament?.champion && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#9c27b0" }]}
          onPress={announceChampion}
        >
          <Text style={styles.buttonText}>Announce Champion</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatch}
        contentContainerStyle={{ marginTop: 20 }}
      />

      {tournament?.champion && (
        <Text style={styles.champion}>🏆 Champion: {tournament.champion}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  heading: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  button: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  matchCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  stage: { fontWeight: "bold", marginBottom: 4 },
  champion: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    color: "#4caf50",
  },
});
