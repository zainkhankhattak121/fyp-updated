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
import LogoutScreen from './screens2/LogoutScreen'; // Renamed from SavedVoicesScreen
import PoliciesScreen from './screens2/Policiess';
import AboutScreen from './screens2/AboutScreen';
import FeedbackScreen from './screens2/FeedbackScreen';
import googlesignin from './GoogleSignInScreen';
import ForgetPasswordScreen from './ForgetPasswordScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const CustomBackButton = ({ navigation }) => (
  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
    <Text style={styles.backButtonText}>← Back</Text>
  </TouchableOpacity>
);

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="SplashScreen">
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AuthDashboard" component={AuthDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="googlesignin" component={googlesignin} options={{ headerShown: false }} />
      <Stack.Screen name="ForgetPasswordScreen" component={ForgetPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={ScreenSignUp2} options={{ headerShown: false }} />
      <Stack.Screen name="EmailLogin" component={ScreenEmailLogin2} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AppDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        drawerActiveTintColor: '#606c38',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: {
          fontSize: 16,
        },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Drawer.Screen name="VoiceGeneration" component={VoiceGenerationScreen} options={{ title: 'Voice Generation' }} />
      <Drawer.Screen name="VoiceDetection" component={VoiceDetectionScreen} options={{ title: 'Voice Detection' }} />
      <Drawer.Screen name="Policies" component={PoliciesScreen} options={{ title: 'Policies' }} />
      <Drawer.Screen name="About" component={AboutScreen} options={{ title: 'About Us' }} />
      <Drawer.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Feedback' }} />
      <Drawer.Screen 
        name="Logout" 
        component={LogoutScreen} 
        options={{ 
          title: 'Logout',
          drawerLabel: ({ focused, color }) => (
            <Text style={{ color: '#d62828', fontWeight: 'bold' }}>Logout</Text>
          )
        }} 
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="AuthStack" component={AuthStack} options={{ headerShown: false }} />
        <Stack.Screen name="MainApp" component={AppDrawer} options={{ headerShown: false }} />
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