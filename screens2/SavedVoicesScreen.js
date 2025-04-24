import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const SavedVoicesScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Voices</Text>
      </View>
      <Text style={styles.text}>List of saved voices will be shown here.</Text>
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
    fontFamily:'Roboto',

  },
  menuIcon: {
    fontSize: 24,
    color: '#1e90ff',
  },
  text: {
    fontSize: 16,
    color: '#555',
    fontFamily:'Roboto',

  },
});

export default SavedVoicesScreen;