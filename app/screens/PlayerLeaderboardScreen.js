import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { db } from "../config/firebase-config";
import { ref, onValue, get } from "firebase/database";
import { useNavigation } from "@react-navigation/native";

export default function PlayerLeaderboardScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchCityText, setSearchCityText] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedFilterType, setSelectedFilterType] = useState("runs");

  const [activeTab, setActiveTab] = useState("runs");

  const allPakistanCities = [
    "Islamabad", "Mardan", "Lahore", "Karachi", "Rawalpindi",
    "Peshawar", "Faisalabad", "Multan", "Quetta"
  ];

  const filterOptions = [
    { label: "Most Runs", value: "runs" },
    { label: "Most 50s", value: "fifties" },
    { label: "Most 100s", value: "hundreds" },
    { label: "Most 6s", value: "sixes" },
    { label: "Most 4s", value: "fours" },
    { label: "Most Wickets", value: "wickets" },
  ];

  const safeNum = (v) => (v === undefined || v === null ? 0 : Number(v));
  const formatOvers = (balls) => {
    balls = safeNum(Math.floor(balls));
    if (balls <= 0) return "0.0";
    const overs = Math.floor(balls / 6);
    const rem = balls % 6;
    return `${overs}.${rem}`;
  };

  const calcEconomy = (p) =>
    p.ballsBowled > 0 ? (safeNum(p.runsConceded) / (safeNum(p.ballsBowled) / 6)).toFixed(2) : "-";

  // ✅ Get player cities (including captain)
async function getPlayerCitiesFromTournaments() {
  const tournamentsRef = ref(db, "tournaments");
  const snapshot = await get(tournamentsRef);
  const playerCityMap = {};

  if (snapshot.exists()) {
    const tournaments = snapshot.val();

    Object.values(tournaments).forEach((tournament) => {
      Object.values(tournament.teams || {}).forEach((team) => {
        const teamCity = team.city || "Unknown";

        // 1️⃣ Normal players
        Object.entries(team.players || {}).forEach(([playerId, player]) => {
          const city = player.city || teamCity;
          playerCityMap[playerId] = city;
        });

        // 2️⃣ Captain — use actual player ID and assign team city
        if (team.captainName && team.players) {
          const captainEntry = Object.entries(team.players).find(
            ([pid, player]) => player.name === team.captainName
          );
          if (captainEntry) {
            const captainId = captainEntry[0]; // actual player ID
            playerCityMap[captainId] = teamCity;
          }
        }
      });
    });
  }

  return playerCityMap;
}



  useEffect(() => {
    setLoading(true);

    async function loadData() {
      const playerCityMap = await getPlayerCitiesFromTournaments();

      const matchesRef = ref(db, "matches");
      onValue(matchesRef, (snapshot) => {
        if (!snapshot.exists()) {
          setPlayers([]);
          setLoading(false);
          return;
        }

        const data = snapshot.val();
        const map = {};

        Object.values(data).forEach((match) => {
          const stats = match.live?.playerStats || match.playerStats || match.playerStatsGlobal || {};

          Object.entries(stats).forEach(([pid, pstatRaw]) => {
            const pstat = pstatRaw || {};
            const playerCity = playerCityMap[pid] || "Unknown";

            if (!map[pid]) {
              map[pid] = {
                id: pid,
                name: pstat.name || pid,
                city: playerCity,
                runs: 0,
                ballsFaced: 0,
                fours: 0,
                sixes: 0,
                fifties: 0,
                hundreds: 0,
                highScore: 0,
                innings: 0,
                matches: 0,
                wickets: 0,
                ballsBowled: 0,
                runsConceded: 0,
              };
            }

            const runs = safeNum(pstat.runs ?? pstat.score ?? 0);
            const ballsFaced = safeNum(pstat.ballsFaced ?? pstat.balls ?? 0);
            const fours = safeNum(pstat.fours ?? 0);
            const sixes = safeNum(pstat.sixes ?? 0);

            map[pid].runs += runs;
            map[pid].ballsFaced += ballsFaced;
            map[pid].fours += fours;
            map[pid].sixes += sixes;
            map[pid].innings += 1;
            map[pid].matches += 1;
            map[pid].highScore = Math.max(map[pid].highScore, runs);
            if (runs >= 50 && runs < 100) map[pid].fifties += 1;
            if (runs >= 100) map[pid].hundreds += 1;

            const ballsBowled = safeNum(pstat.oversBalls ?? pstat.ballsBowled ?? 0);
            const wickets = safeNum(pstat.wickets ?? 0);
            const runsConceded = safeNum(pstat.runsConceded ?? pstat.runsGiven ?? 0);

            map[pid].wickets += wickets;
            map[pid].ballsBowled += ballsBowled;
            map[pid].runsConceded += runsConceded;
          });
        });

        setPlayers(Object.values(map));
        setLoading(false);
      });
    }

    loadData();
  }, []);

  const getSortKeyForType = (type) => {
    switch (type) {
      case "runs": return (p) => safeNum(p.runs);
      case "fifties": return (p) => safeNum(p.fifties);
      case "hundreds": return (p) => safeNum(p.hundreds);
      case "sixes": return (p) => safeNum(p.sixes);
      case "fours": return (p) => safeNum(p.fours);
      case "wickets": return (p) => safeNum(p.wickets);
      default: return (p) => safeNum(p.runs);
    }
  };

  const sortKeyFn = getSortKeyForType(selectedFilterType || "runs");
  const sortedPlayers = players
    .filter((p) => selectedCity === "All" || (p.city || "").toLowerCase() === selectedCity.toLowerCase())
    .sort((a, b) => sortKeyFn(b) - sortKeyFn(a))
    .slice(0, 50);

  const filteredCities = allPakistanCities.filter((city) =>
    city.toLowerCase().includes(searchCityText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-outline" size={26} color="#2c7a7b" />
        </TouchableOpacity>
        <Text style={styles.header}>Player Leaderboard</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <Icon name="filter-outline" size={26} color="#2c7a7b" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {filterOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => {
              setSelectedFilterType(opt.value);
              setActiveTab(opt.value === "wickets" ? "wickets" : "runs");
            }}
            style={[styles.filterButton, selectedFilterType === opt.value && styles.activeFilter]}
          >
            <Text style={[styles.filterText, selectedFilterType === opt.value && styles.activeFilterText]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#3f8c67" style={{ marginTop: 40 }} />
      ) : sortedPlayers.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 40, color: "#666" }}>No players found.</Text>
      ) : (
        <FlatList
          data={sortedPlayers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.card}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.city}>🏙 {item.city}</Text>

                {selectedFilterType === "wickets" || activeTab === "wickets" ? (
                  <Text style={styles.statsLine}>
                    Wkts: {item.wickets} | Overs: {formatOvers(item.ballsBowled)} | Eco: {calcEconomy(item)}
                  </Text>
                ) : (
                  <Text style={styles.statsLine}>
                    Runs: {item.runs} | 4s: {item.fours} | 6s: {item.sixes} | HS: {item.highScore}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Players</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="close" size={26} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Select City</Text>
            <TextInput
              placeholder="Search city..."
              value={searchCityText}
              onChangeText={setSearchCityText}
              style={styles.searchInput}
            />
            <ScrollView style={{ maxHeight: 150 }}>
              <TouchableOpacity
                onPress={() => setSelectedCity("All")}
                style={[styles.cityOption, selectedCity === "All" && styles.activeCityOption]}
              >
                <Text style={selectedCity === "All" ? styles.activeCityText : styles.cityText}>All</Text>
              </TouchableOpacity>
              {filteredCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  onPress={() => setSelectedCity(city)}
                  style={[styles.cityOption, selectedCity === city && styles.activeCityOption]}
                >
                  <Text style={selectedCity === city ? styles.activeCityText : styles.cityText}>
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>Filter Type</Text>
            <View style={styles.filterGrid}>
              {filterOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.gridButton, selectedFilterType === opt.value && styles.activeGridButton]}
                  onPress={() => setSelectedFilterType(opt.value)}
                >
                  <Text style={selectedFilterType === opt.value ? styles.activeGridText : styles.gridText}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", paddingTop: 50, paddingHorizontal: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  header: { fontSize: 22, fontWeight: "bold", color: "#2c7a7b" },
  filterButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#e2e8f0", borderRadius: 12, marginRight: 8 },
  activeFilter: { backgroundColor: "#2c7a7b" },
  filterText: { color: "#333", fontWeight: "600" },
  activeFilterText: { color: "#fff" },
  card: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 10, marginVertical: 6, alignItems: "center", elevation: 2 },
  rank: { fontWeight: "bold", fontSize: 16, width: 30 },
  info: { marginLeft: 10, flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#111" },
  city: { fontSize: 12, color: "#666", marginBottom: 4 },
  statsLine: { fontSize: 13, color: "#444" },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", width: "85%", borderRadius: 16, padding: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#2c7a7b" },
  sectionLabel: { fontSize: 15, fontWeight: "bold", color: "#333", marginTop: 8, marginBottom: 4 },
  searchInput: { borderColor: "#ccc", borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 8 },
  cityOption: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#eee" },
  cityText: { fontSize: 14, color: "#333" },
  activeCityOption: { backgroundColor: "#2c7a7b33" },
  activeCityText: { fontSize: 14, color: "#2c7a7b", fontWeight: "bold" },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", marginVertical: 8 },
  gridButton: { backgroundColor: "#e2e8f0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, margin: 4 },
  activeGridButton: { backgroundColor: "#2c7a7b" },
  gridText: { color: "#333", fontSize: 13 },
  activeGridText: { color: "#fff", fontWeight: "bold" },
  applyButton: { backgroundColor: "#2c7a7b", paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  applyButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
