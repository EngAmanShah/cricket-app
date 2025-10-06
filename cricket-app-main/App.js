import * as React from "react";
import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";

import { auth } from "./app/config/firebase-config";
import { onAuthStateChanged } from "firebase/auth";

import AuthNavigator from "./app/navigation/AuthNavigator";
import AppNavigator from "./app/navigation/AppNavigator";
export default function App() {
  const [currentUser, setcurrentUser] = useState({});

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setcurrentUser(user);
    });
  }, []);

  return (
    <NavigationContainer>
      {currentUser && currentUser.emailVerified ? (
        <AppNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
