import React from 'react'
import { View,Text } from 'react-native'

export default function Label({children}) {
  return (
    <View>
        <Text style={{color:'white'}}>{children}</Text>
    </View>
  )
}
