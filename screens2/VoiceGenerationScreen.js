import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';  // Use FontAwesome icons

const VoiceGenerationScreen = ({ navigation }) => {
  const [text, setText] = useState('');
  const [voiceOption, setVoiceOption] = useState(null);

  const handleGenerate = () => {
    if (!text || !voiceOption) {
      alert('Please enter text and select a voice option.');
      return;
    }
    // Logic to handle voice generation
    alert('Generating voice...');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fake Voice Generation</Text>
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Enter text for TTS"
        value={text}
        onChangeText={setText}
      />

      <View style={styles.iconContainer}>
        <TouchableOpacity 
          style={[styles.iconButton, voiceOption === 'mic' && styles.selectedIcon]}
          onPress={() => setVoiceOption('mic')}
        >
          <Icon name="microphone" size={30} color={voiceOption === 'mic' ? '#606c38' : '#606c38'} />
          <Text style={styles.iconText}>Record Voice</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.iconButton, voiceOption === 'browse' && styles.selectedIcon]}
          onPress={() => setVoiceOption('browse')}
        >
          <Icon name="folder-open" size={30} color={voiceOption === 'browse' ? '#606c38' : '#606c38'} />
          <Text style={styles.iconText}>Upload Voice</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleGenerate}>
        <Text style={styles.buttonText}>Generate / Submit</Text>
      </TouchableOpacity>
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
    color: '#606c38',
  },
  textInput: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderColor: '#283618',
    borderWidth: 1,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Roboto', // Use Roboto font for a clean look
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderColor: '#606c38',
    borderWidth: 1,
    width: '48%',
  },
  selectedIcon: {
    backgroundColor: '#a3b18a',
  },
  iconText: {
    marginTop: 10,
    color: '#283618',
    fontSize: 16,
    fontFamily: 'Roboto', // Use Roboto font for a clean look
  },
  button: {
    backgroundColor: '#606c38',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    fontFamily: 'Roboto', // Use Roboto font for a clean look
  },
  buttonText: {
    color: '#fefae0',
    fontSize: 19,
    fontWeight: 'bold',
    fontFamily: 'Roboto', // Use Roboto font for a clean look
  },
});

export default VoiceGenerationScreen;