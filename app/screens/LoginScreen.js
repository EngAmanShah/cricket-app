import React from "react";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from "react-native";

import { auth } from "../config/firebase-config";
import {
  signInWithEmailAndPassword,
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
    console.log("Login pressed", userData);
    signInWithEmailAndPassword(auth, userData.email, userData.password)
      .then((userCredentials) => {
        console.log("Signed in", userCredentials.user);
        const user = userCredentials.user;
        if (!user.emailVerified) {
          alert("Verify your email to continue");
          signOut(auth);
        }
      })
      .catch((error) => {
        console.log(error);
        alert(error.message);
      });
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
            placeholder="Password"
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

          {/* Forgot Password */}
          <Text
            style={styles.linkText}
            onPress={() => navigation.navigate("Forgot Password")}
          >
            Forgot Password?
          </Text>

          {/* Login Button */}
          <AppButton
            onPress={handleSignIn}
            style={{ marginTop: 10, width: "82%" }}
          >
            LOGIN
          </AppButton>

          {/* Register link */}
          <Text style={styles.registerText}>
            Don’t have an account?{" "}
            <Text
              style={styles.linkHighlight}
              onPress={() => navigation.navigate("Register")}
            >
              Register
            </Text>
          </Text>
        </View>
      </ImageBackground>
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkText: {
    color: "brown",
    fontWeight: "bold",
    fontSize: 17,
    alignSelf: "flex-end",
    margin: 15,
    marginRight: 35,
  },
  registerText: {
    color: "black",
    fontSize: 16,
    marginTop: 15,
  },
  linkHighlight: {
    color: "brown",
    fontWeight: "bold",
  },
});
