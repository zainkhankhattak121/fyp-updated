import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BackButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
      <Text style={styles.buttonText}>← Back</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30, // Adjust for notch (iOS) and status bar (Android)
    left: 20,
    backgroundColor: '#1e90ff', // Consistent blue tone from other buttons
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25, // Rounded for a pill-shaped look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Shadow for Android
    zIndex: 1000, // Ensure above other elements
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold', // Matches other button text style
  },
});

export default BackButton;
