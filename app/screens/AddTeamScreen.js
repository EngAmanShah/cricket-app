// screens/AddTeamScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Share,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";


const AddTeamScreen = () => {
    const route = useRoute();
  const navigation = useNavigation();
const { tournamentId } = route.params || {};
  const shareLink = async () => {
    try {
      const message =
        "🏏 Join our tournament! Add your team directly via this link:\n\nhttps://yourtournamentapp.com/join";
      const result = await Share.share({
        message: message,
        title: "Join Our Tournament",
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared with activity type:", result.activityType);
        } else {
          console.log("Shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to share right now.");
      console.error(error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Ionicons name="link-outline" size={24} color="#007bff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Invite Link</Text>
            <Text style={styles.cardSubtitle}>
              Invite Captains to Add Teams. Share this link with captains and
              let them add their respective teams directly to your tournament.
            </Text>
          </View>
        </View>
        <View style={styles.shareRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={shareLink}>
            <Text style={styles.shareText}>SHARE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, styles.whatsappBtn]}
            onPress={shareLink}
          >
            <FontAwesome5 name="whatsapp" size={18} color="#fff" />
            <Text style={[styles.shareText, { color: "#fff", marginLeft: 8 }]}>
              WHATSAPP
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => navigation.navigate("TeamFormScreen", { tournamentId})}

      >
        <View style={styles.optionLeft}>
          <View style={styles.iconCircleSmall}>
            <Ionicons name="person-add-outline" size={20} color="#007bff" />
          </View>
          <View>
            <Text style={styles.optionTitle}>Add New Teams</Text>
            <Text style={styles.optionDesc}>
              Add one or more teams manually.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddTeamScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#e8f1ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubtitle: {
    color: "#555",
    fontSize: 13,
    marginTop: 3,
  },
  shareRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 15,
  },
  shareBtn: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
  },
  shareText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  whatsappBtn: {
    backgroundColor: "#25D366",
    borderColor: "#25D366",
  },
  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8f1ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  optionDesc: {
    fontSize: 12,
    color: "#555",
  },
});
