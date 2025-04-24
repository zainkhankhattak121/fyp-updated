import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Policess = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Polices</Text>
      </View>
      <Text style={styles.text}>This is where All the policies will be .</Text>
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
  },
  menuIcon: {
    fontSize: 24,
    color: '#1e90ff',
  },
  text: {
    fontSize: 16,
    color: '#555',
  },
});

export default Policess;