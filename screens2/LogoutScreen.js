import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

const LogoutScreen = ({ navigation }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Load user email from storage
  React.useEffect(() => {
    const loadUserEmail = async () => {
      try {
        const savedData = await AsyncStorage.getItem('userData');
        if (savedData) {
          const { email } = JSON.parse(savedData);
          setUserEmail(email);
        }
      } catch (error) {
        console.error('Failed to load user email:', error);
      }
    };

    loadUserEmail();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Sign out from Firebase
      await auth.signOut();
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['userData']);
      
      // Reset navigation stack and go to AuthDashboard
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'AuthStack' }],
        })
      );
    } catch (error) {
      Alert.alert('Logout Error', error.message || 'Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <FontAwesomeIcon icon={faUser} size={50} color="#606c38" />
        {userEmail && <Text style={styles.userEmail}>{userEmail}</Text>}
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, isLoggingOut && styles.disabledButton]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <FontAwesomeIcon icon={faSignOutAlt} size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefae0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  userEmail: {
    marginTop: 10,
    fontSize: 16,
    color: '#606c38',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d62828',
    paddingVertical: 15,
    borderRadius: 50,
    width: '85%',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default LogoutScreen;