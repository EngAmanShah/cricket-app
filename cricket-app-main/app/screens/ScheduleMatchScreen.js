import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { db } from "../config/firebase-config";
import { ref, push, get, child } from "firebase/database";
import DateTimePicker from "@react-native-community/datetimepicker";

const ScheduleMatchScreen = ({ route, navigation }) => {
  const { tournamentId } = route.params;
  const [teams, setTeams] = useState([]);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [venue, setVenue] = useState("");
  const [overs, setOvers] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [stage, setStage] = useState("Group");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const snapshot = await get(child(ref(db), `tournaments/${tournamentId}/teams`));
        if (snapshot.exists()) {
          const data = snapshot.val();
const teamList = Object.keys(data).map((key) => ({
  id: key,
  name: data[key].teamName,
}));
setTeams(teamList);
        } else {
          Alert.alert("No Teams Found", "Please add teams to this tournament first.");
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchTeams();
  }, [tournamentId]);

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handleScheduleMatch = async () => {
    if (!teamA || !teamB || !venue || !overs) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (teamA === teamB) {
      Alert.alert("Error", "Team A and Team B cannot be the same");
      return;
    }

    try {
const newMatch = {
  tournamentId,
  teamA: teamA.name,
  teamAId: teamA.id,  
  teamB: teamB.name,
  teamBId: teamB.id,  
  venue,
  overs,
  matchDate: date.toISOString(),
  stage,
  status: "upcoming",
  createdAt: new Date().toISOString(),
};


      await push(ref(db, "matches"), newMatch);

      Alert.alert("✅ Success", "Match Scheduled Successfully!");
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Something went wrong while saving the match");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
    

      <Text style={styles.label}>Select Team A</Text>
     <View style={styles.teamList}>
 {teams.map((team) => (
  <TouchableOpacity
    key={team.id}
    style={[styles.teamButton, teamA?.id === team.id && styles.selectedTeam]}
    onPress={() => setTeamA(team)}
  >
    <Text style={styles.teamText}>{team.name}</Text>
  </TouchableOpacity>
))}

</View>


      <Text style={styles.label}>Select Team B</Text>
    <View style={styles.teamList}>
  {teams.map((team) => (
    <TouchableOpacity
      key={team.id}
      style={[styles.teamButton, teamB?.id === team.id && styles.selectedTeam]}
      onPress={() => setTeamB(team)}
    >
      <Text style={styles.teamText}>{team.name}</Text>
    </TouchableOpacity>
  ))}
</View>


      <TextInput
        style={styles.input}
        placeholder="Enter Venue"
        value={venue}
        onChangeText={setVenue}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter Overs (e.g. 10, 20, 50)"
        keyboardType="numeric"
        value={overs}
        onChangeText={setOvers}
      />

      <Text style={styles.label}>Match Date</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateText}>{date.toDateString()}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Match Time</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.dateText}>
          {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      <Text style={styles.label}>Select Stage</Text>
      <View style={styles.stageContainer}>
        {["Group", "Quarter Final", "Semi Final", "Final"].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.stageButton, stage === st && styles.selectedStage]}
            onPress={() => setStage(st)}
          >
            <Text style={styles.stageText}>{st}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleScheduleMatch}>
        <Text style={styles.buttonText}>Save Match</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ScheduleMatchScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  dateButton: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  teamList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  teamButton: {
    backgroundColor: "#f1f1f1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  selectedTeam: {
    backgroundColor: "#0cbee6",
  },
  teamText: {
    color: "#000",
  },
  stageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  stageButton: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedStage: {
    backgroundColor: "#0cbee6",
  },
  stageText: {
    color: "#fff",
  },
  button: {
    backgroundColor: "#0cbee6",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
});
