import React from 'react'
import { View,Text,StyleSheet } from 'react-native'

import Screen from '../components/Screen'
import Box from '../components/Box';

export default function AddTS() {
  return (
    <Screen>
      <View style={{flex:1,}}>
        <Text style={{fontWeight:'bold',fontSize:25,textAlign:'center',marginBottom:30,}}>Choose Your Role</Text>
        <View style={{flexDirection:'row',justifyContent:'center',padding:5,}}>
            <Box>Organizer</Box>
            <Box>Scorer</Box>
        </View>
        <View style={{flexDirection:'row',justifyContent:'center'}}>
            <Box>Player</Box>
          <Box>None of the Above</Box>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
})
