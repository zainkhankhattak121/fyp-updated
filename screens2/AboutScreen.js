import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';

const onpressaboutfunction = () => {
  Alert.alert("about pressed")
}

const AboutScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>About</Text>
      </View>
      <Text style={styles.text}>Deepfake Audio Generation and Detection” 
      is an AI-powered app that allows you to detect and generate deepfake
       audio. With its advanced machine learning algorithms, you can create 
       realistic audio clips that sound like you or detect fake audio clips
        that could be trying to deceive you. The app is easy to use and secure, 
        making it perfect for content creators, journalists, and individuals looking
         to have some fun with audio. Whether you want to create realistic audio clips 
         for your videos, podcasts, or social media content or detect fake audio clips that 
         could be used to spread misinformation, “Deepfake Audio Generation and Detection” 
          will got you covered. Download the app now and experience the power of deepfake audio technology!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefae0',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'Roboto', // Use Roboto font for a clean look
  },
  menuIcon: {
    fontSize: 24,
    color: '#1e90ff',
  },
  text: {
    fontSize: 16,
    color: '#555',
    fontFamily: 'Roboto', // Use Roboto font for a clean look
  },
});

export default AboutScreen;