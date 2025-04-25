import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, ScrollView, Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/FontAwesome';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const VoiceGenerationScreen = () => {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [voiceFile, setVoiceFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [voiceModelPath, setVoiceModelPath] = useState(null);
  const [sound, setSound] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isWeb, setIsWeb] = useState(false);

  const [settings, setSettings] = useState({
    vocal_enhance: true,
    breath_effects: 0.3,
    intonation: 0.7,
    articulation: 0.8,
  });

  useEffect(() => {
    // Check if running on web
    setIsWeb(Platform.OS === 'web');
    
    (async () => {
      await Audio.requestPermissionsAsync();
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    if (isWeb) {
      Alert.alert('Info', 'Recording is not supported on web platform');
      return;
    }

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Microphone permission is needed.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (isWeb) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setVoiceFile({
        uri,
        type: 'audio/wav',
        name: `recording_${Date.now()}.wav`,
      });

      setIsRecording(false);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handleUploadVoice = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['audio/*', 'application/octet-stream'],
        copyToCacheDirectory: !isWeb
      });
      
      if (result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        setVoiceFile({
          uri: selected.uri,
          type: selected.mimeType || 'audio/wav',
          name: selected.name || `sample_${Date.now()}.wav`,
        });
      }
    } catch (err) {
      console.error('Failed to upload voice file:', err);
      Alert.alert('Error', 'Failed to select voice file');
    }
  };

  const handleCloneVoice = async () => {
    if (!voiceFile) {
      Alert.alert('Error', 'No voice file selected');
      return null;
    }

    try {
      const formData = new FormData();
      
      // Handle web vs mobile differently
      let fileUri = voiceFile.uri;
      if (!isWeb && fileUri.startsWith('file://')) {
        fileUri = fileUri.replace('file://', '');
      }

      // For web, we need to fetch the file and convert it to a blob
      if (isWeb) {
        const response = await fetch(voiceFile.uri);
        const blob = await response.blob();
        formData.append('file', blob, voiceFile.name);
      } else {
        formData.append('file', {
          uri: fileUri,
          type: voiceFile.type || 'audio/wav',
          name: voiceFile.name,
        });
      }
      
      formData.append('voice_name', 'user_model');

      const response = await fetch(`${API_BASE_URL}/clone-voice`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to clone voice');

      return data.path;
    } catch (error) {
      console.error('Voice cloning error:', error);
      Alert.alert('Error', error.message);
      return null;
    }
  };

  const playAudio = async (uri) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      // On web, we can use HTML5 audio directly
      if (isWeb) {
        const audio = new Audio(uri);
        audio.play();
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter text');
      return;
    }

    setIsLoading(true);
    try {
      let modelPath = voiceModelPath;

      if (voiceFile && !modelPath) {
        modelPath = await handleCloneVoice();
        if (!modelPath) return;
        setVoiceModelPath(modelPath);
      }

      const requestData = {
        text,
        language,
        clone_voice: !!voiceFile,
        voice_model_path: modelPath,
        settings,
        output_format: 'mp3',
      };

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Generation failed');
      }

      // Handle response differently for web
      if (isWeb) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setDownloadUrl(audioUrl);
        await playAudio(audioUrl);
      } else {
        // For mobile, we can use the direct response
        const audioUrl = `${API_BASE_URL}/static/${(await response.json()).file}`;
        setDownloadUrl(audioUrl);
        await playAudio(audioUrl);
      }
      
      Alert.alert('Success', 'Voice generated and playing!');
    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Voice Generator</Text>

      <TextInput
        style={styles.textInput}
        placeholder="Enter text to synthesize"
        value={text}
        onChangeText={setText}
        multiline
      />

      <TextInput
        style={styles.textInput}
        placeholder="Language code (e.g. en)"
        value={language}
        onChangeText={setLanguage}
      />

      {!isWeb && (
        <View style={styles.iconContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={isRecording ? stopRecording : startRecording}>
            <Icon name={isRecording ? 'stop' : 'microphone'} size={24} color={isRecording ? 'red' : '#333'} />
            <Text>{isRecording ? 'Stop' : 'Record'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleUploadVoice}>
            <Icon name="folder-open" size={24} color="#333" />
            <Text>Upload</Text>
          </TouchableOpacity>
        </View>
      )}

      {isWeb && (
        <TouchableOpacity style={styles.button} onPress={handleUploadVoice}>
          <Text style={styles.buttonText}>Upload Voice Sample</Text>
        </TouchableOpacity>
      )}

      {voiceFile && <Text style={styles.fileText}>Voice file: {voiceFile.name}</Text>}
      {voiceModelPath && <Text style={styles.fileText}>Model path: {voiceModelPath.split('/').pop()}</Text>}

      <Text style={styles.settingsTitle}>Voice Settings</Text>

      <View style={styles.sliderContainer}>
        <Text>Breath Effects: {settings.breath_effects.toFixed(1)}</Text>
        <Slider
          minimumValue={0}
          maximumValue={1}
          step={0.1}
          value={settings.breath_effects}
          onValueChange={(val) => setSettings({ ...settings, breath_effects: val })}
          style={styles.slider}
        />
      </View>

      <View style={styles.sliderContainer}>
        <Text>Intonation: {settings.intonation.toFixed(1)}</Text>
        <Slider
          minimumValue={0}
          maximumValue={1}
          step={0.1}
          value={settings.intonation}
          onValueChange={(val) => setSettings({ ...settings, intonation: val })}
          style={styles.slider}
        />
      </View>

      <View style={styles.sliderContainer}>
        <Text>Articulation: {settings.articulation.toFixed(1)}</Text>
        <Slider
          minimumValue={0}
          maximumValue={1}
          step={0.1}
          value={settings.articulation}
          onValueChange={(val) => setSettings({ ...settings, articulation: val })}
          style={styles.slider}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#333" style={styles.loader} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleGenerate}>
          <Text style={styles.buttonText}>Generate Voice</Text>
        </TouchableOpacity>
      )}

      {downloadUrl && (
        <TouchableOpacity 
          style={[styles.button, styles.playButton]} 
          onPress={() => playAudio(downloadUrl)}
        >
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  iconButton: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    width: 100,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
  },
  sliderContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  button: {
    backgroundColor: '#4a8cff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#28a745',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fileText: {
    marginBottom: 10,
    color: '#555',
  },
  loader: {
    marginVertical: 30,
  },
});

export default VoiceGenerationScreen;