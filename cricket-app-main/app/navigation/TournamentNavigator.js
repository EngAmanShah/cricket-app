import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AddTS } from "../screens";

const Stack = createNativeStackNavigator();

const TournamentNavigator = () => (
  <Stack.Navigator >
    <Stack.Screen name="Add a Tournament/Series" component={AddTS} />
  </Stack.Navigator>
);

export default TournamentNavigator;