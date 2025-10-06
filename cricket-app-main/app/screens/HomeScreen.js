import React from "react";
import { View, Text, ScrollView, TouchableWithoutFeedback } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import Screen from "../components/Screen";
import Header from "./Header";
import MatchCard from "../components/cards/MatchCard";
import TournamentCard from "../components/cards/TournamentCard";
import ClubCard from "../components/cards/ClubCard";
import PlayerCard from "../components/cards/PlayerCard";
import NewsCard from "../components/cards/NewsCard";

export default function HomeScreen({ navigation }) {

  return (
    <Screen>
      <Header
        handleSearch={() => navigation.navigate("Search")}
        handleNews={() => navigation.navigate("News")}
        handleDrawer={() => navigation.openDrawer()}
      />
      <ScrollView contentContainerStyle={{ backgroundColor: "#e0dede" }}>
        <Text style={{ fontWeight: "bold", fontSize: 20, margin: 20 }}>
          Matches
        </Text>
        <ScrollView
          horizontal
          contentContainerStyle={{ height: 160, paddingRight: 20 }}
        >
          <MatchCard
            status="LIVE"
            category="T20"
            description="Zahid VS Usama - 1st T20, Attock"
            team1="ZAHID HANGU"
            team2="USAMA HAZRO"
            score1="110/5"
            overs1="20.0"
            score2="90/7"
            overs2="17.0"
            result="USAMA HAZRO requires 20 runs on 3 overs"
            onPress={() => navigation.navigate("Match Details")}
          />
          <MatchCard
            status="LIVE"
            category="Club"
            description="king eleven VS KPK - club match, Peshawar"
            team1="KING ELEVEN"
            team2="KPK"
            score1="100/5"
            overs1="10.0"
            score2="190/7"
            overs2="20.0"
            result="KING ELEVEN requires 90 runs on 10 overs"
            onPress={() => navigation.navigate("Match Details")}
          />
          <MatchCard
            status="LIVE"
            category="T20"
            description="ABD VS ZFL - 3rd T20, Islamabad"
            team1="ABD"
            team2="ZFL"
            score1="80/2"
            overs1="10.3"
            score2="0/0"
            overs2="00.0"
            result="ZFL Yet to bat"
            onPress={() => navigation.navigate("Match Details")}
          />
          <MatchCard
            status="LIVE"
            category="T20"
            description="ABD VS ZFL - 3rd T20, Islamabad"
            team1="ABD"
            team2="ZFL"
            score1="80/2"
            overs1="10.3"
            score2="0/0"
            overs2="00.0"
            result="ZFL Yet to bat"
            onPress={() => navigation.navigate("Match Details")}
          />
          <MatchCard
            status="LIVE"
            category="T20"
            description="ABD VS ZFL - 3rd T20, Islamabad"
            team1="ABD"
            team2="ZFL"
            score1="80/2"
            overs1="10.3"
            score2="0/0"
            overs2="00.0"
            result="ZFL Yet to bat"
            onPress={() => navigation.navigate("Match Details")}
          />
        </ScrollView>
        <Text style={{ fontWeight: "bold", fontSize: 20, margin: 20 }}>
          Tournaments
        </Text>
        <ScrollView
          horizontal
          contentContainerStyle={{ paddingRight: 20, height: 160 }}
        >
          <TournamentCard
            name="zahid bangash tournament- hangu"
            teams={12}
            status="Ongoing"
            image={require("../assets/t1.jpg")}
            date="03 Nov, 2022 to 20 Dec, 2022"
            onPress={() => navigation.navigate("Tournament Details")}
          />
          <TournamentCard
            name="Night tournament - Hazro"
            teams={20}
            status="Ongoing"
            image={require("../assets/t2.jpg")}
            date="03 Nov, 2022 to 30 Nov, 2022"
            onPress={() => navigation.navigate("Tournament Details")}
          />
          <TournamentCard
            name="Peshawar Super league - Peshawar"
            teams={8}
            status="Ongoing"
            image={require("../assets/t3.jpg")}
            date="08 Oct, 2022 to 29 Nov, 2022"
            onPress={() => navigation.navigate("Tournament Details")}
          />
          <TournamentCard
            name="Tournament Name- City"
            teams={19}
            status="Ongoing"
            image={require("../assets/t1.jpg")}
            date="20 Nv, 2022 to 20 Dec, 2022"
            onPress={() => navigation.navigate("Tournament Details")}
          />
          <TournamentCard
            name="Karachi T10 League- Karachi"
            teams={14}
            status="Ongoing"
            image={require("../assets/t2.jpg")}
            date="20 Nv, 2022 to 20 Dec, 2022"
            onPress={() => navigation.navigate("Tournament Details")}
          />
          <TournamentCard
            name="zahid bangash tournament- hangu"
            teams={6}
            status="Ongoing"
            image={require("../assets/t3.jpg")}
            date="20 Nv, 2022 to 20 Dec, 2022"
            onPress={() => navigation.navigate("Tournament Details")}
          />
        </ScrollView>
        <Text style={{ fontWeight: "bold", fontSize: 20, margin: 20 }}>
          Clubs
        </Text>
        <ScrollView
          horizontal
          contentContainerStyle={{ paddingRight: 20, height: 160 }}
        >
          <ClubCard
            name="Harzo Cricket Club"
            image={require("../assets/t3.jpg")}
            address="Hazro"
          />
          <ClubCard
            name="Osama club"
            image={require("../assets/t2.jpg")}
            address="Attock"
          />
          <ClubCard
            name="Karachi Club"
            image={require("../assets/t1.jpg")}
            address="Karachi"
          />
          <ClubCard
            name="Club name"
            image={require("../assets/t3.jpg")}
            address="Islamabad"
          />
          <ClubCard
            name="King Club"
            image={require("../assets/t2.jpg")}
            address="Peshawar"
          />
          <ClubCard
            name="Club name"
            image={require("../assets/t1.jpg")}
            address="Faisalabad"
          />
        </ScrollView>
        <Text style={{ fontWeight: "bold", fontSize: 20, margin: 20 }}>
          Featured Players
        </Text>
        <ScrollView
          horizontal
          contentContainerStyle={{ height: 160, paddingRight: 20 }}
        >
          <PlayerCard
            name="Muhammad Zahid"
            image={require("../assets/profile.jpeg")}
            runs={200}
            wickets={25}
            matches={10}
            type="Batter"
          />
          <PlayerCard
            name="Shahid Afridi"
            image={require("../assets/shahid.jpg")}
            runs={2000}
            wickets={50}
            matches={70}
            type="All rounder"
          />
          <PlayerCard
            name="Alyan Subhani"
            image={require("../assets/player2.jpg")}
            runs={200}
            wickets={20}
            matches={7}
            type="Batter"
          />
          <PlayerCard
            name="Muhammad Osama"
            image={require("../assets/player1.jpg")}
            runs={150}
            wickets={7}
            matches={3}
            type="Bowler"
          />
        </ScrollView>
        <Text style={{ fontWeight: "bold", fontSize: 20, margin: 20 }}>
          News/Blogs
        </Text>
        <ScrollView
          horizontal
          contentContainerStyle={{ paddingRight: 20, height: 200 }}
        >
          <NewsCard
            image={require("../assets/india.jpg")}
            description="India won the match against pakistan in 2022 men worldcup ..."
            date="03 November, 2022"
          />
          <NewsCard
            image={require("../assets/australia.jpg")}
            description="Australia won the match against pakistan in 2022 men worldcup ..."
            date="01 March, 2022"
          />
          <NewsCard
            image={require("../assets/pakistan.jpg")}
            description="Pakistan won the match against pakistan in 2022 men worldcup ..."
            date="07 October, 2022"
          />
          <NewsCard
            image={require("../assets/srilanka.jpg")}
            description="Srilanka won the match against pakistan in 2020 men worldcup ..."
            date="05 Jun, 2022"
          />
        </ScrollView>
        <Text style={{ fontWeight: "bold", fontSize: 20, margin: 20 }}>
          Support
        </Text>
        <View
          style={{
            padding: 20,
            width: 320,
            height: 140,
            backgroundColor: "#3f8c67",
            borderRadius: 20,
            marginLeft: 20,
            elevation: 5,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 17 }}>
            Need help?
          </Text>
          <Text style={{ color: "white", lineHeight: 20 }}>
            {`Mail us at support@cricworld.com \nCall or WhatsApp at \nOsama +923125273333 \nZahid +923125274444`}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
