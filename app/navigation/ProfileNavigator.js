import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import {ProfileScreen,EditProfile} from "../screens";

const Stack = createNativeStackNavigator();

const ProfileNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Your Profile" component={ProfileScreen} />
    <Stack.Screen name="Edit Profile" component={EditProfile} />
  </Stack.Navigator>
);

export default ProfileNavigator;