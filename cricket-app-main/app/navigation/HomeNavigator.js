import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import {HomeScreen,Search,News,MatchDetails,TournamnetDetails,ProfileScreen} from "../screens";
import AddTeamScreen from "../screens/AddTeamScreen";
import TeamFormScreen from "../screens/TeamFormScreen";
import TeamDetailScreen from "../screens/TeamDetailScreen";
import AddPlayerScreen from "../screens/AddPlayerScreen";
import StartMatchScreen from "../screens/StartMatchScreen";
import SelectPlayersScreen from "../screens/SelectPlayersScreen";
import TossScreen from "../screens/TossScreen";
import LiveScoringScreen from "../screens/LiveScoringScreen";
import MatchSummaryScreen from "../screens/MatchSummaryScreen";
import ScheduleMatchScreen from "../screens/ScheduleMatchScreen";
import PointsTableScreen from "../screens/SelectPlayersScreen";
import KnockoutScreen from "../screens/KnockoutScreen";
const Stack = createNativeStackNavigator();

const HomeNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="DashBoard" component={HomeScreen} options={{headerShown:false}}/>
    <Stack.Screen name="Search" component={Search} />
    <Stack.Screen name="News" component={News} />
    <Stack.Screen name="Match Details" component={MatchDetails} />
    <Stack.Screen name="TournamentDetails" component={TournamnetDetails} />
    <Stack.Screen
  name="AddTeamScreen"
  component={AddTeamScreen}
  options={{ title: "Add Team", headerShown: true }}
/>
<Stack.Screen
  name="TeamFormScreen"
  component={TeamFormScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="TeamDetailScreen"
  component={TeamDetailScreen}
  options={{ headerShown: false }} 
/>
<Stack.Screen
  name="AddPlayerScreen"
  component={AddPlayerScreen}
  options={{ headerShown: false }} 
/>
      <Stack.Screen name="StartMatchScreen" component={StartMatchScreen} options={{ title: "Start Match" }} />
      <Stack.Screen name="SelectPlayersScreen" component={SelectPlayersScreen} options={{ title: "Select Players" }} />
      <Stack.Screen name="TossScreen" component={TossScreen} options={{ title: "Toss" }} />
      <Stack.Screen name="LiveScoringScreen" component={LiveScoringScreen} options={{ title: "Live Scoring" }} />
<Stack.Screen name="MatchSummaryScreen" component={MatchSummaryScreen} />
<Stack.Screen
  name="ScheduleMatchScreen"
  component={ScheduleMatchScreen}
  options={{ title: "Schedule Match" }}
/>
<Stack.Screen name="PointsTableScreen" component={PointsTableScreen} options={{ title: "Points Table" }} />
<Stack.Screen name="KnockoutScreen" component={KnockoutScreen} />
  </Stack.Navigator>
);

export default HomeNavigator;



