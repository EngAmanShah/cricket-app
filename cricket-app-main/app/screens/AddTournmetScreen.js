import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ref, push, set } from "firebase/database";
import { db, auth } from "../config/firebase-config";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function AddTournamentScreen() {
  const navigation = useNavigation();

  const [banner, setBanner] = useState(null);
  const [logo, setLogo] = useState(null);
  const [tournamentName, setTournamentName] = useState("");
  const [city, setCity] = useState("");
  const [ground, setGround] = useState("");
  const [organiserName, setOrganiserName] = useState("");
  const [organiserNumber, setOrganiserNumber] = useState("");
  const [organiserEmail, setOrganiserEmail] = useState("");
  const [tournamentCategory, setTournamentCategory] = useState("");
  const [ballType, setBallType] = useState("");
  const [pitchType, setPitchType] = useState("");
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setOrganiserEmail(user.email || "");
      setOrganiserName(user.displayName || "");
    }
  }, []);

  const pickImage = async (setter) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location permission.");
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "User-Agent": "cricket-app/1.0 (test@example.com)",
            Accept: "application/json",
          },
        }
      );
      const data = await res.json();
      const cityName =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.county ||
        "Unknown";
      setCity(cityName);
    } catch (err) {
      console.log("Location error:", err);
      Alert.alert("Error", "Unable to fetch your location.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!tournamentName || !city || !ground || !organiserName) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      const tournamentRef = push(ref(db, "tournaments"));

      await set(tournamentRef, {
        name: tournamentName,
        city,
        ground,
        organiserName,
        organiserNumber,
        organiserEmail,
        organiserUid: auth.currentUser?.uid || null,
        category: tournamentCategory,
        ballType,
        pitchType,
        banner,
        logo,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      });

      Alert.alert("✅ Success", "Tournament added successfully!");
      navigation.goBack();

      setBanner(null);
      setLogo(null);
      setTournamentName("");
      setCity("");
      setGround("");
      setOrganiserNumber("");
      setTournamentCategory("");
      setBallType("");
      setPitchType("");
      setStartDate(new Date());
      setEndDate(new Date());
    } catch (error) {
      console.error("Error adding tournament:", error);
      Alert.alert("❌ Error", "Failed to add tournament.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} marginTop={15} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add A Tournament</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imageBox} onPress={() => pickImage(setBanner)}>
            {banner ? (
              <Image source={{ uri: banner }} style={styles.image} />
            ) : (
              <Text style={styles.imageText}>Add Banner</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoBox} onPress={() => pickImage(setLogo)}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoText}>Add Logo</Text>
            )}
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Tournament / Series Name *"
          style={styles.input}
          value={tournamentName}
          onChangeText={setTournamentName}
        />

        <View style={styles.cityRow}>
          <TextInput
            placeholder="City *"
            style={[styles.input, { flex: 1 }]}
            value={city}
            onChangeText={setCity}
          />
          <TouchableOpacity style={styles.locateBtn} onPress={getCurrentLocation}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.locateText}>📍</Text>
            )}
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Ground *"
          style={styles.input}
          value={ground}
          onChangeText={setGround}
        />

        <Text style={styles.lightLabel}>Organizer Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#f5f5f5" }]}
          value={organiserName}
         
          onChangeText={setOrganiserName}
        />

        <Text style={styles.lightLabel}>Organizer Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: "#f5f5f5" }]}
          value={organiserEmail}
          editable={false}
        />

        <Text style={styles.lightLabel}>Organizer Contact Number</Text>
        <TextInput
          placeholder="Enter organiser number *"
          keyboardType="phone-pad"
          style={styles.input}
          value={organiserNumber}
          onChangeText={setOrganiserNumber}
        />

        <Text style={styles.sectionLabel}>Tournament Dates</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateBtn, { flex: 1, marginRight: 6 }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateSmallLabel}>Start Date</Text>
            <Text style={styles.dateText}>{startDate.toDateString()}</Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              onChange={(e, date) => {
                setShowStartPicker(false);
                if (date) setStartDate(date);
              }}
            />
          )}
          <TouchableOpacity
            style={[styles.dateBtn, { flex: 1, marginLeft: 6 }]}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateSmallLabel}>End Date</Text>
            <Text style={styles.dateText}>{endDate.toDateString()}</Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              onChange={(e, date) => {
                setShowEndPicker(false);
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>

        <Text style={styles.label}>Tournament Category*</Text>
        <View style={styles.optionRow}>
          {["OPEN", "CORPORATE", "COMMUNITY","SERIES","Other"].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.optionBtn,
                tournamentCategory === cat && styles.optionSelected,
              ]}
              onPress={() => setTournamentCategory(cat)}
            >
              <Text
                style={[
                  styles.optionText,
                  tournamentCategory === cat && { color: "#fff" },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Select Ball Type*</Text>
        <View style={styles.optionRow}>
          {["Tennis", "Leather", "Other"].map((ball) => (
            <TouchableOpacity
              key={ball}
              style={[
                styles.optionBtn,
                ballType === ball && styles.optionSelected,
              ]}
              onPress={() => setBallType(ball)}
            >
              <Text
                style={[styles.optionText, ballType === ball && { color: "#fff" }]}
              >
                {ball}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Pitch Type</Text>
        <View style={styles.optionRow}>
          {["ROUGH", "CEMENT", "Other"].map((pitch) => (
            <TouchableOpacity
              key={pitch}
              style={[
                styles.optionBtn,
                pitchType === pitch && styles.optionSelected,
              ]}
              onPress={() => setPitchType(pitch)}
            >
              <Text
                style={[
                  styles.optionText,
                  pitchType === pitch && { color: "#fff" },
                ]}
              >
                {pitch}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Create Tournament</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#b22222",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
    marginTop:15
  },
  container: { padding: 20 },
  imageSection: { alignItems: "center", marginBottom: 20 },
  imageBox: {
    width: "100%",
    height: 150,
    backgroundColor: "#f3f3f3",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  image: { width: "100%", height: "100%", borderRadius: 10 },
  imageText: { color: "#777" },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f3f3f3",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30,
  },
  logoImage: { width: 100, height: 100, borderRadius: 50 },
  logoText: { color: "#777" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  cityRow: { flexDirection: "row", alignItems: "center" },
  locateBtn: {
    marginLeft: 8,
    backgroundColor: "#b22222",
    padding: 12,
    borderRadius: 8,
  },
  locateText: { color: "#fff", fontSize: 16 },
  label: { fontWeight: "700", marginTop: 15, marginBottom: 8 },
  lightLabel: { color: "#666", fontSize: 13, marginBottom: 3, marginTop: 10 },
  sectionLabel: {
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 8,
    fontSize: 16,
    color: "#000",
  },
  dateRow: { flexDirection: "row", justifyContent: "space-between" },
  dateBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
  },
  dateText: { fontSize: 15, color: "#000" },
  dateSmallLabel: { fontSize: 13, color: "#777", marginBottom: 2 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    marginBottom: 8,
  },
  optionSelected: { backgroundColor: "#b22222", borderColor: "#b22222" },
  optionText: { color: "#000" },
  submitBtn: {
    backgroundColor: "#b22222",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 30,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
