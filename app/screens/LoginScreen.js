import React from "react";
import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
} from "react-native";

import { auth } from "../config/firebase-config";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import Screen from "../components/Screen";
import AppTextInput from "../components/AppTextInput";
import AppButton from "../components/AppButton";

export default function LoginScreen({ navigation }) {
  const [userData, setuserData] = useState({
    email: "",
    password: "",
  });

  const [visibility, setvisibility] = useState(true);

  const handleSignIn = () => {
    signInWithEmailAndPassword(auth, userData.email, userData.password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        if (!user.emailVerified) {
          alert("Verify your email to continue");
          signOut(auth);
        }
      })
      .catch((error) => alert(error.message));
  };

  return (
    <Screen>
      <ImageBackground
        source={require("../assets/bgLogin.jpg")}
        style={{
          width: Dimensions.get("window").width,
          height: Dimensions.get("window").height,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            position: "absolute",
            bottom: 230,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <AppTextInput
            placeholder="Email"
            keyboardType="email-address"
            value={userData.email}
            onChangeText={(text) => setuserData({ ...userData, email: text })}
          />
          <AppTextInput
            placeholder="Pasword"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            secureTextEntry={visibility}
            visibility={visibility}
            onPress={() => setvisibility(!visibility)}
            rightIcon={visibility ? "eye" : "md-eye-off-sharp"}
            value={userData.password}
            onChangeText={(text) =>
              setuserData({ ...userData, password: text })
            }
          />
          <Text
            style={{
              color: "brown",
              fontWeight: "bold",
              fontSize: 17,
              alignSelf: "flex-end",
              margin: 15,
              marginRight: 35,
            }}
            onPress={() => navigation.navigate("Forgot Password")}
          >
            Forgot Password?
          </Text>
          <AppButton
            onPress={handleSignIn}
            style={{ marginTop: 10, width: "82%" }}
          >
            LOGIN
          </AppButton>
        </View>
      </ImageBackground>
    </Screen>
  );
}

const styles = StyleSheet.create({});
