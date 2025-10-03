import React, {useState} from 'react';
import { View,StyleSheet, Text,ScrollView,TextInput } from 'react-native';
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";

import Screen from '../components/Screen';
import AppTextInput from '../components/AppTextInput';

export default function EditProfile() {
  const [userData, setUserData] = useState({
    name:"",
    location:"",
    dob:"",
    email:"",
    number:null,
    playingRole:"",

  });
  return (
    <Screen>
        <ScrollView>
        <AppTextInput
            placeholder="Player Name"
            value={userData.name}
            onChangeText={(text) => setuserData({ ...userData, name: text })}
          />
          <AppTextInput
            placeholder="Location"
            value={userData.location}
            onChangeText={(text) => setuserData({ ...userData, location: text })}
          />
          <AppTextInput
            placeholder="Date of Birth"
            value={userData.dob}
          />
          <AppTextInput
            placeholder="Email"
            keyboardType="email-address"
            value={userData.email}
            onChangeText={(text) => setuserData({ ...userData, email: text })}
          />
          <AppTextInput
            placeholder="Mobile Number"
            keyboardType="numeric"
            value={userData.email}
            onChangeText={(text) => setuserData({ ...userData, email: text })}
          />
        </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container:{

  },
})
