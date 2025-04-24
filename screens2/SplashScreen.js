import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useFonts } from 'expo-font';

const SplashScreen = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    RobotoBold: require('../assets/Roboto/Roboto-Bold.ttf'),
    RobotoRegular: require('../assets/Roboto/Roboto-Regular.ttf'),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('AuthDashboard'); // Navigate to the next screen after 2 seconds
    }, 2000); // 2 seconds splash screen duration

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [navigation]);

  if (!fontsLoaded) {
    return null; // Render nothing until fonts are loaded
  }

  return (
    <View style={styles.container}>
      {/* Logo and text */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/splash_logo.png')} // Replace with your actual logo path
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>DEEPFAKE</Text>
        <Text style={styles.subtitle}>Voice Generation and Detection</Text>
      </View>

      {/* Smaller Half-circle with Welcome Text */}
      <View style={styles.shapeContainer}>
        <View style={styles.halfCircle}>
          <Text style={styles.welcomeText}>Welcome</Text>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background
  },
  logoContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  title: {
    fontSize: 36, // Adjusted title size for professional look
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Roboto',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 18, // Adjusted subtitle size
    color: '#000000',
    textAlign: 'center',
    marginTop: 5,
    fontWeight: 'bold',
    fontFamily: 'Roboto',
  },
  shapeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  halfCircle: {
    width: width * 0.7, // Reduced width for a smaller circle
    height: width * 0.15, // Half of the width for a proportional half-circle
    backgroundColor: '#0096FF',
    borderTopLeftRadius: width * 0.3,
    borderTopRightRadius: width * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20, // Add spacing between circle and content above
  },
  welcomeText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
});

export default SplashScreen;
