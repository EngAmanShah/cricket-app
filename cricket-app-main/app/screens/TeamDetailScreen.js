// screens/TeamDetailScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ref, onValue, update } from "firebase/database";
import { db } from "../config/firebase-config";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";


const roles = ["Captain", "Wicketkeeper", "Batsman", "Bowler", "All-Rounder"];

const TeamDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { team, tournamentId, isOrganizer } = route.params;

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    const playersRef = ref(db, `tournaments/${tournamentId}/teams/${team.id}/players`);

    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      const playersArray = data
        ? Object.entries(data).map(([id, p]) => ({
            id,
            name: p.name || "Player",
            number: p.number || "-",
            logo: p.logo || null,
            role: p.role || "Player",
          }))
        : [];

      const allPlayers = [
        {
          id: "captain",
          name: team.captainName || "Captain",
          number: team.captainNumber || "-",
          logo: team.logo || null,
          role: team.captainRole || "Captain",
        },
        ...playersArray,
      ];

      setPlayers(allPlayers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [team, tournamentId]);

const openRoleModal = (player) => {
  console.log("Clicked player:", player.name, "Organizer:", isOrganizer);

  if (isOrganizer || team.captainName === player.name) {
    setSelectedPlayer(player);
    setSelectedRole(player.role);
    setModalVisible(true);
  } else {
    console.log("You are not allowed to change roles");
  }
};





  const handleRoleSave = async () => {
    if (!selectedPlayer) return;

    try {
      const formattedRole =
        selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1).toLowerCase();

      if (selectedPlayer.id === "captain") {
        const teamRef = ref(db, `tournaments/${tournamentId}/teams/${team.id}`);
        await update(teamRef, { captainRole: formattedRole });
      } else {
        const playerRef = ref(
          db,
          `tournaments/${tournamentId}/teams/${team.id}/players/${selectedPlayer.id}`
        );
        await update(playerRef, { role: formattedRole });
      }

      setPlayers((prev) =>
        prev.map((p) =>
          p.id === selectedPlayer.id ? { ...p, role: formattedRole } : p
        )
      );

      setModalVisible(false);
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

const getRoleIcon = (role) => {
  if (!role) return null;
  const r = role.toLowerCase();

  switch (r) {
    case "wicketkeeper":
      return <Text style={{ fontSize: 18 }}>🧤</Text>;

    case "batsman":
      return <MaterialCommunityIcons name="cricket" size={18} color="#27ae60" />;

    case "bowler":
      return <FontAwesome5 name="baseball-ball" size={18} color="#8e44ad" />;

    case "all-rounder":
      return <Ionicons name="people" size={18} color="#e67e22" />;

    case "captain":
      return <Ionicons name="star" size={18} color="#f1c40f" />;

    default:
      return null;
  }
};




  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{team.teamName}</Text>

      <ScrollView style={styles.playersList} contentContainerStyle={{ paddingBottom: 30 }}>
        {players.map((player) => (
          <TouchableOpacity
            key={player.id}
            style={styles.playerRow}
            onPress={() => openRoleModal(player)}
          >
            <View style={styles.logoContainer}>
              <Image
                source={player.logo ? { uri: player.logo } : require("../assets/t3.jpg")}
                style={styles.playerLogo}
              />
              {player.role && player.role !== "Player" && (
                <View style={styles.roleBadge}>{getRoleIcon(player.role)}</View>
              )}
            </View>

            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerRole}>{player.role}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.buttonRow}>
      

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#28a745" }]}
          onPress={() => navigation.navigate("AddPlayerScreen", { team, tournamentId })}
        >
          <Text style={styles.buttonText}>Add Player</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlayer && (
              <>
                <View style={styles.modalHeader}>
                  <Image
                    source={
                      selectedPlayer.logo
                        ? { uri: selectedPlayer.logo }
                        : require("../assets/t1.jpg")
                    }
                    style={styles.modalLogo}
                  />
                  <Text style={styles.modalName}>{selectedPlayer.name}</Text>
                </View>

                <View style={styles.rolesContainer}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        selectedRole === role && { backgroundColor: "#00bfa5" },
                      ]}
                      onPress={() => setSelectedRole(role)}
                    >
                      <Text
                        style={[
                          styles.roleText,
                          selectedRole === role && { color: "#fff" },
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#ccc" }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: "#333", fontWeight: "bold" }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: "#28a745" }]}
                    onPress={handleRoleSave}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>OK</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TeamDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: "#fff" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  playersList: { flex: 1, paddingHorizontal: 15 },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 10,
  },
  logoContainer: { position: "relative" },
  playerLogo: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#eee" },
  roleBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 3,
    elevation: 2,
  },
  playerInfo: { flex: 1, marginLeft: 15 },
  playerName: { fontSize: 16, fontWeight: "bold" },
  playerRole: { fontSize: 14, color: "#007bff" },
  buttonRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  button: { flex: 0.45, paddingVertical: 15, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { alignItems: "center", marginBottom: 20 },
  modalLogo: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  modalName: { fontSize: 18, fontWeight: "bold" },
  rolesContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", marginBottom: 20 },
  roleButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: "#00bfa5", margin: 5 },
  roleText: { color: "#00bfa5", fontWeight: "bold" },
  modalButtons: { flexDirection: "row", justifyContent: "space-around" },
  modalBtn: { flex: 0.45, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
});
