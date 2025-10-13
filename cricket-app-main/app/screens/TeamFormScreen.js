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
import { Ionicons } from "@expo/vector-icons";
import { db, storage } from "../config/firebase-config";
import { ref, push, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRoute, useNavigation } from "@react-navigation/native";

const TeamFormScreen = () => {
  const [teamName, setTeamName] = useState("");
  const [city, setCity] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainNumber, setCaptainNumber] = useState("");
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const { tournamentId } = route.params || {}; 

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const handleAddTeam = async () => {
  if (!tournamentId) {
    Alert.alert("Error", "Tournament ID not found.");
    return;
  }

  if (!teamName || !city) {
    Alert.alert("Missing Fields", "Team name and city are required.");
    return;
  }

  setLoading(true);
  try {
    let imageUrl = null;

    if (logo) {
      const formData = new FormData();
      formData.append("file", {
        uri: logo,
        type: "image/jpeg",
        name: `${teamName}.jpg`,
      });
      formData.append("upload_preset", "upload"); 

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/<YOUR_CLOUD_NAME>/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (data.secure_url) {
        imageUrl = data.secure_url;
      } else {
        console.error("Cloudinary upload failed:", data);
      }
    }

    const teamRef = ref(db, `tournaments/${tournamentId}/teams`);
    const newTeamRef = push(teamRef);
    await update(newTeamRef, {
      id: newTeamRef.key,
      teamName,
      city,
      captainName,
      captainNumber,
      logo: imageUrl || null,
      createdAt: new Date().toISOString(),
    });

    Alert.alert("✅ Success", "Team added successfully!");
    setTeamName("");
    setCity("");
    setCaptainName("");
    setCaptainNumber("");
    setLogo(null);

    navigation.navigate("TournamentDetails", {
      tournamentId,
      initialTab: "Teams",
    });
  } catch (error) {
    console.error("Error adding team:", error);
    Alert.alert("❌ Error", "Failed to add team.");
  } finally {
    setLoading(false);
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add one or more teams</Text>

      <View style={styles.card}>
        <TouchableOpacity onPress={pickImage} style={styles.logoContainer}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logo} />
          ) : (
            <Image
              source={{ uri: "https://via.placeholder.com/100" }}
              style={styles.logo}
            />
          )}
          <Text style={styles.logoLabel}>LOGO</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Team Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter team name"
          value={teamName}
          onChangeText={setTeamName}
        />

        <Text style={styles.label}>City / Town *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter city"
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.label}>+92 Team Captain / Coordinator Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter number"
          keyboardType="phone-pad"
          value={captainNumber}
          onChangeText={setCaptainNumber}
        />

        <Text style={styles.label}>Team Captain Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter captain name"
          value={captainName}
          onChangeText={setCaptainName}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00bfa5" style={{ marginTop: 20 }} />
      ) : (
        <>
          <TouchableOpacity style={styles.addMoreBtn} onPress={handleAddTeam}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addMoreText}>ADD TEAM</Text>
          </TouchableOpacity>

        
        </>
      )}
    </ScrollView>
  );
};

export default TeamFormScreen;

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
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 2,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  addMoreBtn: {
    marginTop: 20,
    backgroundColor: "#00bfa5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 30,
  },
  addMoreText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  doneBtn: {
    marginTop: 15,
    backgroundColor: "#00bfa5",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  doneText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
