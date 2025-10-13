// screens/KnockoutScreen.js
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

export default function KnockoutScreen({ route, navigation }) {
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

      const merged = knockout.map((m) => {
        const teamA = m.teamA?.teamName?.trim()?.toLowerCase();
        const teamB = m.teamB?.teamName?.trim()?.toLowerCase();

        const completed = allMatches.find(
          (x) =>
            x.tournamentId === tournamentId &&
            x.status === "complete" &&
            x.stage === m.stage &&
            (
              (x.teamA?.teamName?.trim()?.toLowerCase() === teamA &&
                x.teamB?.teamName?.trim()?.toLowerCase() === teamB) ||
              (x.teamA?.teamName?.trim()?.toLowerCase() === teamB &&
                x.teamB?.teamName?.trim()?.toLowerCase() === teamA)
            )
        );

        return completed
          ? {
              ...m,
              ...completed,
              status: "complete",
            }
          : m;
      });

      setMatches(merged);
    });

    return () => {
      unsubT();
      unsubM();
    };
  }, [tournamentId]);

  const generateQuarterFinals = async () => {
    if (!tournament) return;
    try {
      setLoading(true);
      const points = tournament.pointsTable || {};
      const sorted = Object.values(points).sort(
        (a, b) => b.points - a.points || b.nrr - a.nrr
      );
      const top8 = sorted.slice(0, 8);

      if (top8.length < 8)
        return Alert.alert("⚠️ Not enough teams for Quarter Finals (need 8)");

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
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSemiFinals = async () => {
    try {
      setLoading(true);
      const snap = await get(ref(db, "matches"));
      if (!snap.exists()) return;

      const all = Object.entries(snap.val()).map(([id, m]) => ({ id, ...m }));
      const qfCompleted = all.filter(
        (m) =>
          m.tournamentId === tournamentId &&
          m.stage === "Quarter Final" &&
          (m.status === "completed" || m.status === "complete") &&
          m.winner
      );

      if (qfCompleted.length < 4)
        return Alert.alert("⚠️ Quarter Finals not completed yet");

      const winners = qfCompleted.map((m) => m.winner);
      const created = [];

      for (let i = 0; i < winners.length; i += 2) {
        const match = {
          tournamentId,
          stage: "Semi Final",
          teamA: { teamName: winners[i] },
          teamB: { teamName: winners[i + 1] },
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
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const generateFinal = async () => {
    try {
      setLoading(true);
      const snap = await get(ref(db, "matches"));
      if (!snap.exists()) return;

      const all = Object.entries(snap.val()).map(([id, m]) => ({ id, ...m }));
      const semiCompleted = all.filter(
        (m) =>
          m.tournamentId === tournamentId &&
          m.stage === "Semi Final" &&
          (m.status === "completed" || m.status === "complete") &&
          m.winner
      );

      if (semiCompleted.length < 2)
        return Alert.alert("⚠️ Semi Finals not completed yet");

      const winners = semiCompleted.map((m) => m.winner);
      const finalMatch = {
        tournamentId,
        stage: "Final",
        teamA: { teamName: winners[0] },
        teamB: { teamName: winners[1] },
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

  const qf = matches.filter((m) => m.stage === "Quarter Final");
  const semi = matches.filter((m) => m.stage === "Semi Final");
  const final = matches.filter((m) => m.stage === "Final");

  const qfDone = qf.every(
    (m) => m.status === "completed" || m.status === "complete"
  );
  const semiDone = semi.every(
    (m) => m.status === "completed" || m.status === "complete"
  );
  const finalDone = final.every(
    (m) => m.status === "completed" || m.status === "complete"
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🏆 Knockout Stage</Text>
      {loading && <ActivityIndicator size="large" color="#2196F3" />}

      {qf.length === 0 && (
        <TouchableOpacity style={styles.button} onPress={generateQuarterFinals}>
          <Text style={styles.buttonText}>Generate Quarter Finals</Text>
        </TouchableOpacity>
      )}

      {qfDone && semi.length === 0 && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#ff9800" }]}
          onPress={generateSemiFinals}
        >
          <Text style={styles.buttonText}>Generate Semi Finals</Text>
        </TouchableOpacity>
      )}

      {semiDone && final.length === 0 && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4caf50" }]}
          onPress={generateFinal}
        >
          <Text style={styles.buttonText}>Generate Final</Text>
        </TouchableOpacity>
      )}

      {finalDone && !tournament?.champion && (
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
