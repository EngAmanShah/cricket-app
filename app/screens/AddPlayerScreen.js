// screens/AddPlayerScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ref, push, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../config/firebase-config";
import { useRoute, useNavigation } from "@react-navigation/native";

const AddPlayerScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { team, tournamentId } = route.params;

  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [playerRole, setPlayerRole] = useState("Player");
  const [playerLogo, setPlayerLogo] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setPlayerLogo(result.assets[0].uri);
    }
  };

  const handleAddPlayer = async () => {
    if (!playerName) {
      Alert.alert("Missing Field", "Player name is required");
      return;
    }

    setLoading(true);
    let logoUrl = null;

    try {
      if (playerLogo) {
        const response = await fetch(playerLogo);
        const blob = await response.blob();
        const imageRef = storageRef(storage, `playerLogos/${Date.now()}_${playerName}.jpg`);
        await uploadBytes(imageRef, blob);
        logoUrl = await getDownloadURL(imageRef);
      }

      const playersRef = ref(db, `tournaments/${tournamentId}/teams/${team.id}/players`);
      const newPlayerRef = push(playersRef);
      await update(newPlayerRef, {
        id: newPlayerRef.key,
        name: playerName,
        number: playerNumber || "-",
        role: playerRole,
        logo: logoUrl || null,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("✅ Success", "Player added successfully!");
      setPlayerName("");
      setPlayerNumber("");
      setPlayerRole("Player");
      setPlayerLogo(null);

      navigation.goBack();
    } catch (error) {
      console.error("Error adding player:", error);
      Alert.alert("❌ Error", "Failed to add player.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add Player to {team.teamName}</Text>

      <TouchableOpacity onPress={pickImage} style={styles.logoContainer}>
        {playerLogo ? (
          <Image source={{ uri: playerLogo }} style={styles.logo} />
        ) : (
          <Image source={require("../assets/t1.jpg")} style={styles.logo} />
        )}
        <Text style={styles.logoLabel}>PLAYER LOGO</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Player Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter player name"
        value={playerName}
        onChangeText={setPlayerName}
      />

      <Text style={styles.label}>Player Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter number"
        keyboardType="phone-pad"
        value={playerNumber}
        onChangeText={setPlayerNumber}
      />

      <Text style={styles.label}>Role</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter role (e.g., Batsman)"
        value={playerRole}
        onChangeText={setPlayerRole}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#00bfa5" style={{ marginTop: 20 }} />
      ) : (
        <TouchableOpacity style={styles.addBtn} onPress={handleAddPlayer}>
          <Text style={styles.addBtnText}>Add Player</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default AddPlayerScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f2f2f2",
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#c62828",
    textAlign: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
  },
  logoLabel: {
    color: "#555",
    marginTop: 5,
    fontSize: 13,
  },
  label: {
    color: "#009688",
    fontWeight: "bold",
    marginTop: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 5,
    fontSize: 15,
  },
  addBtn: {
    marginTop: 20,
    backgroundColor: "#00bfa5",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
