// screens/SelectPlayersScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../config/firebase-config";
import { ref, onValue, update } from "firebase/database";

export default function SelectPlayersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { tournamentId, matchId, teamA, teamB, overs, ballType, format } = route.params;

  const [activeTeam, setActiveTeam] = useState("A");
  const [squadA, setSquadA] = useState([]);
  const [squadB, setSquadB] = useState([]);
  const [teamAName, setTeamAName] = useState(teamA?.teamName || "Team A");
  const [teamBName, setTeamBName] = useState(teamB?.teamName || "Team B");
  const [nameInput, setNameInput] = useState("");
  const [playingA, setPlayingA] = useState([]);
  const [playingB, setPlayingB] = useState([]);

  useEffect(() => {
    if (!tournamentId) return;

    const teamsRef = ref(db, `tournaments/${tournamentId}/teams`);
    onValue(teamsRef, (snapshot) => {
      const teamsData = snapshot.val() || {};

      const teamAData =
        teamsData[teamA.id] ||
        Object.values(teamsData).find((t) => t.teamName === teamA.teamName) ||
        null;

      const teamBData =
        teamsData[teamB.id] ||
        Object.values(teamsData).find((t) => t.teamName === teamB.teamName) ||
        null;

      setTeamAName(teamAData?.teamName || teamAName);
      setTeamBName(teamBData?.teamName || teamBName);

      const playersA = teamAData?.players
        ? Object.values(teamAData.players).map((p, idx) => ({
            id: p.id || idx.toString(),
            name: p.name || "Unnamed",
            number: p.number || "",
            role: p.role || "",
          }))
        : [];

      if (teamAData?.captainName) {
        if (!playersA.some((p) => p.name === teamAData.captainName)) {
          playersA.unshift({
            id: "captainA",
            name: teamAData.captainName,
            number: teamAData.captainNumber || "",
            role: "Captain",
          });
        }
      }

      const playersB = teamBData?.players
        ? Object.values(teamBData.players).map((p, idx) => ({
            id: p.id || idx.toString(),
            name: p.name || "Unnamed",
            number: p.number || "",
            role: p.role || "",
          }))
        : [];

      if (teamBData?.captainName) {
        if (!playersB.some((p) => p.name === teamBData.captainName)) {
          playersB.unshift({
            id: "captainB",
            name: teamBData.captainName,
            number: teamBData.captainNumber || "",
            role: "Captain",
          });
        }
      }

      setSquadA(playersA);
      setSquadB(playersB);
    });
  }, [tournamentId]);

  const addPlayerToSquad = () => {
    if (!nameInput.trim()) return;

    const player = {
      id: Date.now().toString(),
      name: nameInput.trim(),
      role: "",
      number: "",
    };

    if (activeTeam === "A") setSquadA((s) => [player, ...s]);
    else setSquadB((s) => [player, ...s]);

    setNameInput("");
  };

  const toggleSelectPlaying = (team, playerId) => {
    if (team === "A") {
      if (playingA.includes(playerId))
        setPlayingA((p) => p.filter((id) => id !== playerId));
      else {
        if (playingA.length >= 11) {
          Alert.alert("Limit", "Only 11 players allowed.");
          return;
        }
        setPlayingA((p) => [playerId, ...p]);
      }
    } else {
      if (playingB.includes(playerId))
        setPlayingB((p) => p.filter((id) => id !== playerId));
      else {
        if (playingB.length >= 11) {
          Alert.alert("Limit", "Only 11 players allowed.");
          return;
        }
        setPlayingB((p) => [playerId, ...p]);
      }
    }
  };

  const handleNextToToss = async () => {
    if (playingA.length !== 11 || playingB.length !== 11) {
      Alert.alert("Select XI", "Please select 11 players for both teams.");
      return;
    }

    const teamAPlayers = squadA.filter((p) => playingA.includes(p.id));
    const teamBPlayers = squadB.filter((p) => playingB.includes(p.id));

    const matchPlayersRef = ref(db, `matches/${matchId}/players`);
    await update(matchPlayersRef, {
      teamA: teamAPlayers,
      teamB: teamBPlayers,
    });

    const playerStats = {};
    [...teamAPlayers, ...teamBPlayers].forEach((p) => {
      playerStats[p.id] = {
        name: p.name,
        team: playingA.includes(p.id) ? teamAName : teamBName,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        overs: 0,
        runsConceded: 0,
      };
    });

    const matchLiveRef = ref(db, `matches/${matchId}/live/playerStats`);
    await update(matchLiveRef, playerStats);

    navigation.navigate("TossScreen", {
      tournamentId,
      matchId,
      teamA: { ...teamA, players: teamAPlayers, teamName: teamAName },
      teamB: { ...teamB, players: teamBPlayers, teamName: teamBName },
      overs,
      ballType,
      format,
    });
  };

  const renderPlayer = (item, team) => {
    const selected =
      team === "A" ? playingA.includes(item.id) : playingB.includes(item.id);
    const isCaptain = item.role === "Captain";

    return (
      <TouchableOpacity
        onPress={() => toggleSelectPlaying(team, item.id)}
        style={[
          styles.playerRow,
          selected && styles.playerSelected,
          isCaptain && styles.captainRow,
        ]}
      >
        <View>
          <Text style={{ fontWeight: "600", color: selected ? "#fff" : "#000" }}>
            {item.name} {isCaptain ? "(C)" : ""}
          </Text>
          <Text style={{ color: selected ? "#fff" : "#555" }}>{item.role}</Text>
        </View>
        <Text style={{ color: selected ? "#fff" : "#777" }}>
          {selected ? "Selected" : "Tap to select"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Playing XI</Text>

      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <TouchableOpacity
          onPress={() => setActiveTeam("A")}
          style={[styles.tab, activeTeam === "A" && styles.activeTab]}
        >
          <Text
            style={[styles.tabText, activeTeam === "A" && { color: "#fff" }]}
          >
            {teamAName}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTeam("B")}
          style={[styles.tab, activeTeam === "B" && styles.activeTab]}
        >
          <Text
            style={[styles.tabText, activeTeam === "B" && { color: "#fff" }]}
          >
            {teamBName}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder={`Add player to ${
          activeTeam === "A" ? teamAName : teamBName
        }`}
        value={nameInput}
        onChangeText={setNameInput}
        style={styles.input}
      />
      <TouchableOpacity onPress={addPlayerToSquad} style={styles.addBtn}>
        <Text style={{ color: "#fff" }}>Add Player</Text>
      </TouchableOpacity>

      <Text style={{ fontWeight: "700", marginVertical: 10 }}>Squad</Text>
      <FlatList
        data={activeTeam === "A" ? squadA : squadB}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => renderPlayer(item, activeTeam)}
        ListEmptyComponent={
          <Text style={{ color: "#777", textAlign: "center" }}>
            No players added yet.
          </Text>
        }
      />

      <TouchableOpacity onPress={handleNextToToss} style={styles.nextBtn}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Proceed to Toss</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: "#b22222", marginBottom: 10 },
  tab: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },
  activeTab: { backgroundColor: "#b22222" },
  tabText: { fontWeight: "600", fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  playerRow: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  playerSelected: { backgroundColor: "#28a745", borderColor: "#28a745" },
  captainRow: { borderWidth: 2, borderColor: "#FFD700" },
  nextBtn: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
});
