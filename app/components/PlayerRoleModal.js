// components/PlayerRoleModal.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";

const roles = ["Captain", "Wicketkeeper", "Batsman", "Bowler", "All-Rounder"];

const PlayerRoleModal = ({ visible, player, onClose, onSave, onRemove }) => {
  const [selectedRole, setSelectedRole] = useState(player.role || "");

  const handleOk = () => {
    onSave(selectedRole);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Top: Player info */}
          <View style={styles.topContainer}>
            <Image
              source={player.logo ? { uri: player.logo } : require("../assets/t1.jpg")}
              style={styles.playerLogo}
            />
            <Text style={styles.playerName}>{player.name}</Text>
            <TouchableOpacity onPress={() => onRemove(player.id)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>

          {/* Role selection */}
          <ScrollView contentContainerStyle={styles.rolesContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleButton,
                  selectedRole === role && styles.roleButtonSelected,
                ]}
                onPress={() => setSelectedRole(role)}
              >
                <Text
                  style={[
                    styles.roleText,
                    selectedRole === role && styles.roleTextSelected,
                  ]}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okBtn} onPress={handleOk}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PlayerRoleModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    height: "50%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  topContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  playerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  removeText: {
    color: "red",
    marginTop: 5,
    fontWeight: "bold",
  },
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007bff",
    marginBottom: 10,
  },
  roleButtonSelected: {
    backgroundColor: "#007bff",
  },
  roleText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  roleTextSelected: {
    color: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  cancelBtn: {
    backgroundColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  okBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
