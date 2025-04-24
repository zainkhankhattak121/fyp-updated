import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import { auth } from './firebaseConfig'; // Import your firebase config

const LogoutScreen = ({ setIsAuthenticated }) => {
  const navigation = useNavigation();
  const [authMethod, setAuthMethod] = useState(null); // Track if signed in with email or Google

  // Check how the user logged in (Google or Email)
  useEffect(() => {
    const checkAuthMethod = async () => {
      const storedAuthMethod = await SecureStore.getItemAsync('authMethod');
      setAuthMethod(storedAuthMethod);
    };
    checkAuthMethod();
  }, []);

  // Log out the user based on the authentication method
  const handleLogout = async () => {
    try {
      if (authMethod === 'Google') {
        // Handle Google sign out
        await Google.signOut(); // Ensure you have a signOut function set
      } else {
        await auth.signOut(); // Sign out from Firebase
      }
      setIsAuthenticated(false); // Update authentication state
      navigation.navigate('AuthDashboard'); // Redirect to login screen
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <View>
      <Text>Are you sure you want to logout?</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default LogoutScreen;
