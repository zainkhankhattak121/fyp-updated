import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Importing screens
import AuthDashboard from './screens2/AuthDashboard.js';
import ScreenSignUp2 from './ScreenSignUp2';
import ScreenEmailLogin2 from './ScreenEmailLogin2';
import SplashScreen from './screens2/SplashScreen';
import HomeScreen from './screens2/HomeScreen';
import VoiceGenerationScreen from './screens2/VoiceGenerationScreen';
import VoiceDetectionScreen from './screens2/VoiceDetectionScreen';
import SavedVoicesScreen from './screens2/SavedVoicesScreen'; // Ensure this file exists
import PoliciesScreen from './screens2/Policiess'; // Ensure this file exists
import AboutScreen from './screens2/AboutScreen'; // Ensure this file exists
import FeedbackScreen from './screens2/FeedbackScreen'; // Ensure this file exists
import googlesignin from './GoogleSignInScreen';
import ForgetPasswordScreen from './ForgetPasswordScreen';


const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Custom Back Button Component
const CustomBackButton = ({ navigation }) => (
  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
    <Text style={styles.backButtonText}>← Back</Text>
  </TouchableOpacity>
);

// Authentication Stack (for login, signup, and other auth-related screens)
function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="SplashScreen">
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="AuthDashboard" 
        component={AuthDashboard} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="googlesignin" 
        component={googlesignin} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ForgetPassword" 
        component={ForgetPasswordScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="SignUp" 
        component={ScreenSignUp2} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="EmailLogin" 
        component={ScreenEmailLogin2} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}

// Main App with Drawer
function AppDrawer() {
  return (
    <Drawer.Navigator initialRouteName="HomeScreen">
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="SavedVoices" component={SavedVoicesScreen} />
      <Drawer.Screen name="Policies" component={PoliciesScreen} />
      <Drawer.Screen name="About" component={AboutScreen} />
      <Drawer.Screen name="Feedback" component={FeedbackScreen} />
      <Drawer.Screen 
        name="VoiceGeneration" 
        component={VoiceGenerationScreen} 
      />
      <Drawer.Screen 
        name="VoiceDetection" 
        component={VoiceDetectionScreen} 
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="AuthStack" 
          component={AuthStack} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MainApp" 
          component={AppDrawer} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#0056b3', 
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
