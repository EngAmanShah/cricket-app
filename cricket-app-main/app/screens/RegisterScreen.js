import React from "react";
import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from "react-native";

import { auth, db } from "../config/firebase-config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";

import Screen from "../components/Screen";
import AppButton from "../components/AppButton";
import AppTextInput from "../components/AppTextInput";

export default function RegisterScreen({ navigation }) {
  const [userData, setuserData] = useState({
    name: "",
    phoneNumber: null,
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordVisibility, setpasswordVisibility] = useState(true);
  const [confirmVisibility, setconfirmVisibility] = useState(true);

  const handleSignUp = () => {
    if (userData.password !== userData.confirmPassword) {
      alert("Password doesn't match");
      return;
    }
    createUserWithEmailAndPassword(auth, userData.email, userData.password)
      .then(() => {
        sendEmailVerification(auth.currentUser)
          .then(() => {
            alert("Email verification sent");
          })
          .catch((error) => alert(error.message))
          .then(() => {
            setDoc(doc(db, "users", auth.currentUser.uid), {
              Name: userData.name,
              PhoneNumber: userData.phoneNumber,
              Email: userData.email,
            });
            navigation.navigate("Welcome");
          })
          .catch((error) => alert(error.message));
      })
      .catch((error) => alert(error.message));
  };

  return (
    <Screen>
      <ImageBackground
        source={require("../assets/bgRegister.jpg")}
        style={{
          width: Dimensions.get("window").width,
          height: Dimensions.get("window").height,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={{position:'absolute',width:'100%',alignItems:'center',bottom:230,}}>
        <AppTextInput
          placeholder="First Name"
          value={userData.name}
          onChangeText={(text) => setuserData({ ...userData, name: text })}
        />
        <AppTextInput
          placeholder="Phone Number"
          keyboardType='numeric'
          value={userData.phoneNumber}
          onChangeText={(text) => setuserData({ ...userData, phoneNumber: text })}
        />
        <AppTextInput
          placeholder="Email"
          keyboardType="email-address"
          value={userData.email}
          onChangeText={(text) => setuserData({ ...userData, email: text })}
        />
        <AppTextInput
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          secureTextEntry={passwordVisibility}
          visibility={passwordVisibility}
          onPress={() => setpasswordVisibility(!passwordVisibility)}
          rightIcon={passwordVisibility ? "eye" : "md-eye-off-sharp"}
          value={userData.password}
          onChangeText={(text) => setuserData({ ...userData, password: text })}
        />
        <AppTextInput
          placeholder="Confirm Password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect={false}
          secureTextEntry={confirmVisibility}
          visibility={confirmVisibility}
          onPress={() => setconfirmVisibility(!confirmVisibility)}
          rightIcon={confirmVisibility ? "eye" : "md-eye-off-sharp"}
          value={userData.confirmPassword}
          onChangeText={(text) =>
            setuserData({ ...userData, confirmPassword: text })
          }
        />
        <AppButton
          onPress={handleSignUp}
          style={{ marginTop: 30, backgroundColor: "#07FFF0",width:'82%' }}
        >
          REGISTER
        </AppButton>
        </View>
      </ImageBackground>
    </Screen>
  );
}

const styles = StyleSheet.create({});
