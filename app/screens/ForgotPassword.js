import React, { useState } from "react";
import { View, Text, StyleSheet, ImageBackground,Dimensions } from "react-native";

import { auth } from "../config/firebase-config";
import { sendPasswordResetEmail } from "firebase/auth";

import Screen from "../components/Screen";
import AppTextInput from "../components/AppTextInput";
import AppButton from "../components/AppButton";

export default function ForgotPassword() {
  const [email, setemail] = useState("");

  const handleForgotPassword = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert(`Password reset link sent to ${email}`);
      })
      .catch((error) => alert(error.message));
  };
  return (
    <ImageBackground
    source={require('../assets/bgForgot.jpg')}
      style={{
        width: Dimensions.get("window").width,
        // height: Dimensions.get('window').height,
        height:'100%',
        // width:'100%',
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontWeight: "bold",fontSize:17, }}>
        A password reset link will be sent to the email
      </Text>
      <AppTextInput
        placeholder="Email*"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => setemail(text)}
        style={{ marginTop: 50, }}
      />
      <AppButton onPress={handleForgotPassword} style={{ marginTop: 50,backgroundColor:'#07FFF0',width:'80%' }}>
        SUBMIT
      </AppButton>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({});
