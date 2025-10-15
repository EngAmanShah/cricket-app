// screens/StartIndividualMatchScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../config/firebase-config";
import { ref, onValue, update, get, push } from "firebase/database";

export default function StartIndividualMatchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { matchId } = route.params || {};

  const [teams, setTeams] = useState([]);
  const [teamA, setTeamA] = useState({ players: [] });
  const [teamB, setTeamB] = useState({ players: [] });
  const [overs, setOvers] = useState("10");
  const [format, setFormat] = useState("T10");
  const [ballType, setBallType] = useState("Tennis");
  const [pitchType, setPitchType] = useState("");
  const [venue, setVenue] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectingFor, setSelectingFor] = useState("A");

  // Fetch all teams from all tournaments
  useEffect(() => {
    const tournamentsRef = ref(db, `tournaments`);
    onValue(tournamentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const tournamentsData = snapshot.val();
        const allTeams = [];

        Object.keys(tournamentsData).forEach((tournamentKey) => {
          const tournament = tournamentsData[tournamentKey];
          if (tournament.teams) {
            Object.keys(tournament.teams).forEach((teamKey) => {
              allTeams.push({
                id: `${tournamentKey}-${teamKey}`,
                tournamentId: tournamentKey,
                ...tournament.teams[teamKey],
              });
            });
          }
        });

        setTeams(allTeams);
      } else {
        setTeams([]);
      }
    });
  }, []);

  // Fetch existing match details if matchId is provided
  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }

    const matchRef = ref(db, `matches/${matchId}`);
    onValue(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        // Team A
        if (data.teamA) {
          const captainA = data.teamA.captain
            ? {
                id: data.teamA.captain.id,
                captainName: data.teamA.captain.captainName,
                captainNumber: data.teamA.captain.captainNumber,
              }
            : null;

          const playersA = data.teamA.players || [];
          const mergedPlayersA =
            captainA && !playersA.some((p) => p.id === captainA.id)
              ? [captainA, ...playersA]
              : playersA;

          setTeamA({
            ...data.teamA,
            captain: captainA,
            players: mergedPlayersA,
          });
        }

        // Team B
        if (data.teamB) {
          const captainB = data.teamB.captain
            ? {
                id: data.teamB.captain.id,
                captainName: data.teamB.captain.captainName,
                captainNumber: data.teamB.captain.captainNumber,
              }
            : null;

          const playersB = data.teamB.players || [];
          const mergedPlayersB =
            captainB && !playersB.some((p) => p.id === captainB.id)
              ? [captainB, ...playersB]
              : playersB;

          setTeamB({
            ...data.teamB,
            captain: captainB,
            players: mergedPlayersB,
          });
        }

        if (data.overs) setOvers(String(data.overs));
        if (data.venue) setVenue(data.venue);
        setFormat(data.format || "T10");
        setBallType(data.ballType || "Tennis");
        setPitchType(data.pitchType || "");
        setMatchDate(data.matchDate || "");
      }

      setLoading(false);
    });
  }, [matchId]);


const handleNext = async () => {
  try {
    if (!teamA || !teamB) {
      Alert.alert("Error", "Please select both teams.");
      return;
    }

    const today = new Date();
    const formattedDate = matchDate || today.toISOString().split("T")[0];

    const newMatchRef = matchId
      ? ref(db, `matches/${matchId}`)
      : push(ref(db, "matches"));
    const newMatchId = newMatchRef.key;

    const snapshot = await get(newMatchRef);
    const existingData = snapshot.exists() ? snapshot.val() : {};
    const newStatus = existingData.status === "completed" ? "completed" : "live";

    // Helper to normalize team players with captain
    const normalizeTeam = (team, captainId) => {
      const players = team.players ? Object.values(team.players) : [];

      if (team.captainName && !players.some(p => p.name === team.captainName)) {
        players.unshift({
          id: captainId || "captain",
          name: team.captainName,
          number: team.captainNumber || "",
          role: "Captain",
        });
      }

      return {
        ...team,
        players,
      };
    };

    const normalizedTeamA = normalizeTeam(teamA, "captainA");
    const normalizedTeamB = normalizeTeam(teamB, "captainB");

    await update(newMatchRef, {
      id: newMatchId,
      teamA: normalizedTeamA,
      teamB: normalizedTeamB,
      overs,
      format,
      ballType,
      pitchType,
      venue: venue || "To Be Decided",
      matchDate: formattedDate,
      status: newStatus,
      createdAt: existingData.createdAt || new Date().toISOString(),
      live: {
        scoreA: { runs: 0, wickets: 0, balls: 0 },
        scoreB: { runs: 0, wickets: 0, balls: 0 },
        target: null,
        ballsHistory: {},
        currentInnings: "A",
        playerStats: {},
      },
    });

    Alert.alert("Match Started!", "You can now select players.");

    navigation.navigate("SelectPlayersScreen", {
      matchId: newMatchId,
      teamA: normalizedTeamA,
      teamB: normalizedTeamB,
      overs,
      ballType,
      format,
    });
  } catch (err) {
    console.error(err);
    Alert.alert("Error", err.message);
  }
};


const handleTeamSelect = (team) => {
  // Add captain to players if missing
  let players = team.players ? Object.values(team.players) : [];

  if (team.captainName && !players.some(p => p.name === team.captainName)) {
    const captainId = selectingFor === "A" ? "captainA" : "captainB";
    players.unshift({
      id: captainId,
      name: team.captainName,
      number: team.captainNumber || "",
      role: "Captain",
    });
  }

  const updatedTeam = {
    ...team,
    players,
  };

  if (selectingFor === "A") setTeamA(updatedTeam);
  else setTeamB(updatedTeam);

  setModalVisible(false);
};


  const renderTeamItem = ({ item }) => (
    <TouchableOpacity
      style={styles.teamListItem}
      onPress={() => handleTeamSelect(item)}
    >
      <Image
        source={{
          uri:
            item.logo ||
            "https://img.freepik.com/premium-photo/cricket-bat-ball-stump-3d-illustration_772785-2068.jpg",
        }}
        style={styles.teamListLogo}
      />
      <View>
        <Text style={styles.teamListName}>{item.teamName}</Text>
        <Text style={{ fontSize: 10, color: "#888" }}>
          Tournament: {item.tournamentId}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b22222" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏏 Start Individual Match</Text>

      <View style={styles.teamsContainer}>
        {/* Team A */}
        <View style={styles.teamCard}>
          <Image
            source={{
              uri:
                teamA?.logo ||
                "https://th.bing.com/th/id/OIP.jRtLNBHeebvDEQk4PgU3uAHaHa?w=200&h=199&c=7&r=0&o=7",
            }}
            style={styles.teamLogo}
          />
          <Text style={styles.teamName}>
            {teamA?.teamName || "Select Team A"}
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>
            Captain: {teamA?.captain?.captainName || "Not assigned"}
          </Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => {
              setSelectingFor("A");
              setModalVisible(true);
            }}
          >
            <Text style={styles.selectText}>Select</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.vsText}>VS</Text>

        {/* Team B */}
        <View style={styles.teamCard}>
          <Image
            source={{
              uri:
                teamB?.logo ||
                "https://th.bing.com/th/id/OIP.jRtLNBHeebvDEQk4PgU3uAHaHa?w=200&h=199&c=7&r=0&o=7",
            }}
            style={styles.teamLogo}
          />
          <Text style={styles.teamName}>
            {teamB?.teamName || "Select Team B"}
          </Text>
          <Text style={{ fontSize: 12, color: "#555" }}>
            Captain: {teamB?.captain?.captainName || "Not assigned"}
          </Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => {
              setSelectingFor("B");
              setModalVisible(true);
            }}
          >
            <Text style={styles.selectText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Match info */}
      <View style={styles.infoBox}>
        <Text style={styles.fieldHeader}>🏟 Venue:</Text>
        <TextInput
          style={styles.inputBox}
          value={venue}
          placeholder="Enter venue"
          onChangeText={setVenue}
        />

        <Text style={styles.fieldHeader}>🌾 Pitch Type:</Text>
        <View style={styles.optionRow}>
          {["Grass", "Hard", "Artificial", "Clay"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.optionBtn, pitchType === type && styles.optionSelected]}
              onPress={() => setPitchType(type)}
            >
              <Text style={{ color: pitchType === type ? "#fff" : "#333" }}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldHeader}>⏱ Overs:</Text>
        <TextInput
          style={styles.inputBox}
          value={overs}
          placeholder="Enter overs"
          keyboardType="numeric"
          onChangeText={setOvers}
        />

        <Text style={styles.fieldHeader}>🎾 Ball Type:</Text>
        <View style={styles.optionRow}>
          {["Tennis", "Leather", "Synthetic"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.optionBtn, ballType === type && styles.optionSelected]}
              onPress={() => setBallType(type)}
            >
              <Text style={{ color: ballType === type ? "#fff" : "#333" }}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextText}>Next → Select Players</Text>
      </TouchableOpacity>

      {/* Team selection modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Select {selectingFor === "A" ? "Team A" : "Team B"}
            </Text>
            <FlatList
              data={teams}
              keyExtractor={(item) => item.id}
              renderItem={renderTeamItem}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#b22222", marginBottom: 20 },
  teamsContainer: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  teamCard: { alignItems: "center", backgroundColor: "#f9f9f9", borderRadius: 10, padding: 10, width: 130, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
  teamLogo: { width: 70, height: 70, borderRadius: 35, marginBottom: 6 },
  teamName: { fontWeight: "bold", fontSize: 14, textAlign: "center" },
  selectBtn: { backgroundColor: "#b22222", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginTop: 4 },
  selectText: { color: "#fff", fontSize: 12 },
  vsText: { fontSize: 20, fontWeight: "bold", color: "#b22222" },
  nextBtn: { backgroundColor: "#b22222", padding: 14, borderRadius: 10, marginTop: 30 },
  nextText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)" },
  modalBox: { width: "85%", backgroundColor: "#fff", borderRadius: 10, padding: 16, maxHeight: "70%" },
  modalTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  teamListItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  teamListLogo: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  teamListName: { fontWeight: "500" },
  closeBtn: { backgroundColor: "#b22222", padding: 10, borderRadius: 8, marginTop: 10 },
  infoBox: { backgroundColor: "#f4f4f4", padding: 16, borderRadius: 12, marginTop: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  fieldHeader: { fontWeight: "600", fontSize: 15, marginBottom: 6, color: "#333" },
  inputBox: { backgroundColor: "#fff", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", marginBottom: 12, fontSize: 14 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 12 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", marginBottom: 8, minWidth: 80, alignItems: "center", backgroundColor: "#fff" },
  optionSelected: { backgroundColor: "#b22222", borderColor: "#b22222" },
});
