import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { async } from "@firebase/util";

import { ref, uploadBytes } from "firebase/storage";
import { storage } from "../config/firebase-config";

export default function ProfileScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setloading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    // console.log(result.uri);

    if (!result.canceled) {
      setImage(result.uri);
      setloading(true);
    }
  };

  const uploadImage = async () => {
    setloading(true);
    const storageRef = ref(storage, "imagename");
    const metadata = {
      contentType: "image/jpeg",
    };

    uploadBytes(storageRef, image.uri, metadata).then(() => {
      alert("Uploaded a blob or file!");
    });
    setloading(false);
  };

  useEffect(() => {
    uploadImage();
  }, [loading]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View
        style={{
          alignItems: "center",
          width: 150,
          height: 150,
          marginTop: 10,
        }}
      >
        <Image
          source={require("../assets/profile.jpeg")}
          style={{ width: 130, height: 130, borderRadius: 65 }}
        />
        <TouchableOpacity
          style={{
            backgroundColor: "white",
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            alignSelf: "flex-end",
            top: -40,
          }}
          onPress={pickImage}
        >
          <Ionicons name="camera" size={30} />
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 25, fontWeight: "bold" }}>Zahid Bangash</Text>
      <TouchableOpacity style={{ marginTop: 5 }}>
        <Text
          style={{
            color: "red",
            alignSelf: "flex-end",
            fontWeight: "bold",
            fontSize: 18,
            textDecorationLine: "underline",
          }}
          onPress={() => navigation.navigate("Edit Profile")}
        >
          Edit info
        </Text>
      </TouchableOpacity>
      <View
        style={{
          width: "90%",
          marginTop: 20,
          padding: 5,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text>FULL NAME</Text>
          <Text style={{ fontWeight: "bold" }}>Muhammad Zahid</Text>
          <Text>PLAYING ROLE</Text>
          <Text style={{ fontWeight: "bold" }}>Batter</Text>
          <Text>BOWLING STYLE</Text>
          <Text style={{ fontWeight: "bold" }}>Right Arm Offbreak</Text>
          <Text>EMAIL</Text>
          <Text style={{ fontWeight: "bold" }}>zahidbangash@gmail.com</Text>
        </View>
        <View>
          <Text>DATE OF BIRTH</Text>
          <Text style={{ fontWeight: "bold" }}>03.03.2001</Text>
          <Text style={{ width: "100%" }}>BATTING STYLE</Text>
          <Text style={{ fontWeight: "bold" }}>Right Hand Bat</Text>
          <Text>DATE OF BIRTH</Text>
          <Text style={{ fontWeight: "bold" }}>03.03.2001</Text>
          <Text>MOBILE NUMBER</Text>
          <Text style={{ fontWeight: "bold" }}>03125273883</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
