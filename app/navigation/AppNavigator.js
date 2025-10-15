import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
//icons
 import { Ionicons } from "@expo/vector-icons";
 import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Entypo } from "@expo/vector-icons";

import {
  HomeScreen,
  ProfileScreen,
  AddTS,
  StartMatch,
  GoLive,
  MyMatches,
  MyTeams,
  MyTournaments,
  MyClubs,
  MyStats,
  CustomDrawer,
} from "../screens";

import TournamentNavigator from "./TournamentNavigator";
import HomeNavigator from './HomeNavigator';
import ProfileNavigator from "./ProfileNavigator";

const Drawer = createDrawerNavigator();

const AppNavigator = () => (
  
  <Drawer.Navigator
    screenOptions={{
      headerShown:false,
      drawerActiveBackgroundColor: "#FE7F0A",
      drawerActiveTintColor: "white",
      drawerInactiveTintColor: "red",
    }}
    drawerContent={(props) => <CustomDrawer {...props} />}
  >
    <Drawer.Screen
      name="Home"
      component={HomeNavigator}
      options={{
        drawerIcon: ({ size, color }) => (
          <Ionicons name="home" size={size} color={color} />
        ),
      }}
    />
     <Drawer.Screen
      name="Profile"
      component={ProfileNavigator}
      options={{
        drawerIcon: ({ size, color }) => (
          <Ionicons name="person" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="Add Tournament/series"
      component={TournamentNavigator}
      options={{
        drawerIcon: ({ size, color }) => (
          <MaterialCommunityIcons name="tournament" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="Start a Match"
      component={StartMatch}
      options={{
        drawerIcon: ({ size, color }) => (
          <Ionicons name="play-sharp" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="Go Live"
      component={GoLive}
      options={{
        drawerIcon: ({ size, color }) => (
          <Entypo name="video-camera" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="My Matches"
      component={MyMatches}
      options={{
        drawerIcon: ({ size, color }) => (
          <MaterialCommunityIcons name="cricket" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="My Teams"
      component={MyTeams}
      options={{
        drawerIcon: ({ size, color }) => (
          <Ionicons name="people" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="My Tournaments"
      component={MyTournaments}
      options={{
        drawerIcon: ({ size, color }) => (
          <Entypo name="trophy" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="My Clubs"
      component={MyClubs}
      options={{
        drawerIcon: ({ size, color }) => (
          <MaterialCommunityIcons name="cards-club" size={size} color={color} />
        ),
      }}
    />
    <Drawer.Screen
      name="My Stats"
      component={MyStats}
      options={{
        drawerIcon: ({ size, color }) => (
          <Ionicons name="stats-chart" size={size} color={color} />
        ),
      }}
    />
  </Drawer.Navigator>
);

export default AppNavigator;
