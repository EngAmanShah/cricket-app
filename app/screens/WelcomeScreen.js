import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View,StyleSheet,Text,ImageBackground,Dimensions,Image } from 'react-native'

import Screen from '../components/Screen';
import AppButton from '../components/AppButton';

export default function WelcomeScreen({navigation}) {
  return (
    <Screen>
      <ImageBackground source={require('../assets/welcomeImage.jpg')} 
      blurRadius={1.5}
      resizeMode="cover"
      style={{width:Dimensions.get('window').width,height:Dimensions.get('window').height,justifyContent:'center',alignItems:'center'}}>
        <View style={{position:'absolute',top:70,alignItems:'center'}}>
        <Image source={require('../assets/logo.png')} style={{width:200,height:200,}} resizeMode='contain' />
        <Text style={{fontSize:25,fontWeight:'bold',color:'#000',marginTop:20,}}>Share Your Talent</Text>
        </View>
        <View style={{position:'absolute',bottom:30,width:'100%',alignItems:'center',}}>
        <AppButton onPress={()=>navigation.navigate("Login")}>LOGIN</AppButton>
        <AppButton onPress={()=>navigation.navigate("Register")} style={{backgroundColor:'#07FFF0'}}>REGISTER</AppButton>
        </View>
      </ImageBackground>
    </Screen>
  )
}

const styles = StyleSheet.create({
})
