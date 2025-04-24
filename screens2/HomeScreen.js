import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Button, Dimensions, Image, ScrollView } from 'react-native';

const { width, height } = Dimensions.get('window'); // Get device dimensions for responsiveness

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.background}>
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* First Box */}
          <View style={styles.box}>
            <Image source={require('../assets/logo1.png')} style={styles.boxImage} />
            <Text style={styles.boxTitle}>Deep Fake Voice Generation</Text>
            <Text style={styles.boxText}>Generate AI-powered deep fake voices</Text>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => navigation.navigate('VoiceGeneration')}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>

          {/* Second Box */}
          <View style={styles.box}>
            <Image source={require('../assets/logo5.png')} style={styles.boxImage} />
            <Text style={styles.boxTitle}>Fake Voice Detection</Text>
            <Text style={styles.boxText}>Detect fake voices with high accuracy.</Text>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => navigation.navigate('VoiceDetection')}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  signUpButton: {
    backgroundColor: '#fefae0', 
    paddingVertical: 15,
    borderRadius: 50, // Fully rounded corners
    marginVertical: 10,
    width: '85%',
    alignItems: 'center',
    fontFamily: 'Roboto', // Use Roboto font for a clean look
  },
  buttonText: {
    color: '#283618', // Dark text for buttons
    fontSize: 18 + (width * 0.0015), // Dynamic font size based on screen width
    fontWeight: 'bold',
    fontFamily: 'Roboto', // Clean font
  },
  background: {
    flex: 1, // Ensure full-screen
    backgroundColor: '#fefae0', // Light background
  },
  scrollContainer: {
    flexGrow: 1, // Ensures content fills up available space and is scrollable
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
    zIndex: 1,
  },
  box: {
    backgroundColor: '#606c38',
    width: '80%',
    maxWidth: 450, // Limit the maximum width for better readability on larger screens
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5, // Adds shadow for Android devices
  },
  boxImage: {
    width: '100%',
    height: height * 0.25, // Adjust height based on screen height for responsiveness
    resizeMode: 'cover',
    borderRadius: 10,
    marginBottom: 10,
  },
  boxTitle: {
    fontSize: 20 + (width * 0.0015), // Adjust font size dynamically based on screen size
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  boxText: {
    fontSize: 16 + (width * 0.001), // Adjust font size dynamically based on screen size
    color: '#fefae0',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default HomeScreen;