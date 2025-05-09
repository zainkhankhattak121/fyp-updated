import React, { useState, useEffect, useRef } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// Constants
const EMOTIONS = ["Happy", "Sad", "Angry", "Surprise", "Fear", "Disgust", "Neutral"];

// Supported languages - will be fetched from backend
const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English', supportedFor: 'both' },
  { code: 'es', name: 'Spanish', supportedFor: 'both' },
  { code: 'fr', name: 'French', supportedFor: 'both' },
  { code: 'de', name: 'German', supportedFor: 'both' },
  { code: 'hi', name: 'Hindi', supportedFor: 'both' },
  { code: 'zh', name: 'Chinese', supportedFor: 'both' },
  { code: 'ja', name: 'Japanese', supportedFor: 'both' },
  { code: 'ko', name: 'Korean', supportedFor: 'both' },
  { code: 'ar', name: 'Arabic', supportedFor: 'both' },
  { code: 'ru', name: 'Russian', supportedFor: 'both' },
  { code: 'pt', name: 'Portuguese', supportedFor: 'both' },
  { code: 'ur', name: 'Urdu', supportedFor: 'standard' },
  { code: 'ta', name: 'Tamil', supportedFor: 'standard' },
  { code: 'bn', name: 'Bengali', supportedFor: 'standard' },
  { code: 'tr', name: 'Turkish', supportedFor: 'both' },
  { code: 'it', name: 'Italian', supportedFor: 'both' },
  { code: 'nl', name: 'Dutch', supportedFor: 'both' },
  { code: 'pl', name: 'Polish', supportedFor: 'both' },
  { code: 'mr', name: 'Marathi', supportedFor: 'standard' },
  { code: 'te', name: 'Telugu', supportedFor: 'standard' },
  { code: 'kn', name: 'Kannada', supportedFor: 'standard' },
  { code: 'ml', name: 'Malayalam', supportedFor: 'standard' },
  { code: 'gu', name: 'Gujarati', supportedFor: 'standard' },
  { code: 'pa', name: 'Punjabi', supportedFor: 'standard' }
];

// Update this to your actual API endpoint
const API_BASE_URL = 'http://192.168.100.17:8000'; //Hamlet hostel
//const API_BASE_URL = 'http://192.168.43.45:8000';

const showAlert = (title, message, isError = true) => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK' }],
    { cancelable: false }
  );
  if (isError) {
    console.error(`${title}: ${message}`);
  }
};

const getLanguageName = (code) => {
  const lang = DEFAULT_LANGUAGES.find(l => l.code === code);
  return lang ? lang.name : 'Unknown';
};

export default function VoiceCloneApp() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [emotion, setEmotion] = useState('Neutral');
  const [speed, setSpeed] = useState(1.0);
  const [breathEffect, setBreathEffect] = useState(0.5);
  const [intonation, setIntonation] = useState(0.5);
  const [articulation, setArticulation] = useState(0.5);
  const [voiceFile, setVoiceFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [sound, setSound] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [mode, setMode] = useState('standard');
  const [statusMessage, setStatusMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedVoices, setSavedVoices] = useState([]);
  const [showSavedVoices, setShowSavedVoices] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [progress, setProgress] = useState(0);
  const [supportedLanguages, setSupportedLanguages] = useState(DEFAULT_LANGUAGES);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [showRecordingOptions, setShowRecordingOptions] = useState(false);
  const recordingRef = useRef(null);

  useEffect(() => {
    checkBackendConnection();
    loadSavedVoices();
    fetchSupportedLanguages();
    
    // Request microphone permission on mount
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const fetchSupportedLanguages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/supported_languages`);
      if (response.ok) {
        const data = await response.json();
        const standardLangs = Object.entries(data.standard_tts).map(([code, name]) => ({
          code,
          name,
          supportedFor: 'standard'
        }));
        const cloneLangs = Object.entries(data.clone).map(([code, name]) => ({
          code,
          name,
          supportedFor: 'clone'
        }));
        
        // Merge languages, prioritizing names from standard_tts
        const mergedLangs = [...standardLangs];
        cloneLangs.forEach(cloneLang => {
          const existing = mergedLangs.find(l => l.code === cloneLang.code);
          if (existing) {
            existing.supportedFor = 'both';
          } else {
            mergedLangs.push(cloneLang);
          }
        });
        
        setSupportedLanguages(mergedLangs);
      }
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
    }
  };

  const loadSavedVoices = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedVoices');
      if (saved) {
        setSavedVoices(JSON.parse(saved));
      }
    } catch (error) {
      showAlert('Error', 'Failed to load saved voices');
    }
  };

  const saveVoice = async (uri, text, language, emotion, mode) => {
    try {
      const fileName = uri.split('/').pop();
      const newVoice = {
        uri,
        fileName,
        text,
        language,
        emotion,
        mode,
        timestamp: new Date().toISOString()
      };
      
      const updatedVoices = [...savedVoices, newVoice];
      await AsyncStorage.setItem('savedVoices', JSON.stringify(updatedVoices));
      setSavedVoices(updatedVoices);
      showAlert('Success', 'Voice saved successfully!', false);
    } catch (error) {
      showAlert('Error', 'Failed to save voice');
    }
  };

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      setIsBackendConnected(response.ok);
    } catch (error) {
      setIsBackendConnected(false);
    }
  };

  const pickVoiceFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: 'audio/*',
        copyToCacheDirectory: true
      });
      
      if (!result.canceled) {
        setVoiceFile(result.assets[0]);
        setRecordingUri(null); // Clear any recording if file is selected
      }
    } catch (error) {
      showAlert('Error', 'Failed to pick voice file');
    }
  };

  const startRecording = async () => {
    try {
      setShowRecordingOptions(false);
      
      // Check and request permission for Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone to record audio',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Microphone permission denied');
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setStatusMessage('Recording... Speak now');
    } catch (error) {
      showAlert('Error', 'Failed to start recording: ' + error.message);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setStatusMessage('Processing recording...');

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      setVoiceFile({
        uri,
        name: `recording-${new Date().toISOString()}.wav`,
        mimeType: 'audio/wav'
      });
      
      recordingRef.current = null;
      setStatusMessage('Recording ready for cloning');
    } catch (error) {
      showAlert('Error', 'Failed to stop recording');
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      
      await newSound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      showAlert('Error', 'Failed to play recording');
    }
  };

  const generateStandardVoice = async () => {
    if (!text.trim()) {
      showAlert('Error', 'Please enter some text');
      return;
    }

    try {
      setIsLoading(true);
      setProgress(0);
      setStatusMessage('Generating voice...');

      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', language);
      formData.append('emotion', emotion);
      formData.append('speed', speed.toString());
      formData.append('breath_effect', breathEffect.toString());
      formData.append('intonation', intonation.toString());
      formData.append('articulation', articulation.toString());

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Server error');
      }

      const result = await response.json();
      if (!result.file_url) {
        throw new Error('No audio file received');
      }

      // Download the file directly using FileSystem
      const fileUri = `${FileSystem.cacheDirectory}${result.file_url.split('/').pop()}`;
      const downloadResumable = FileSystem.createDownloadResumable(
        result.file_url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setProgress(progress * 100);
          setStatusMessage(`Downloading... ${Math.round(progress * 100)}%`);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      setAudioUri(uri);
      await saveVoice(uri, text, language, emotion, mode);
      setStatusMessage('Success!');
    } catch (error) {
      showAlert('Error', error.message || 'Failed to generate voice');
      setStatusMessage('Failed');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const generateClonedVoice = async () => {
    if (!text.trim()) {
      showAlert('Error', 'Please enter some text');
      return;
    }
    
    if (!voiceFile) {
      showAlert('Error', 'Please select or record a voice file for cloning');
      return;
    }

    try {
      setIsLoading(true);
      setProgress(0);
      setStatusMessage('Cloning voice...');

      const formData = new FormData();
      formData.append('voice_file', {
        uri: voiceFile.uri,
        name: voiceFile.name || 'voice.wav',
        type: voiceFile.mimeType || 'audio/wav'
      });
      formData.append('text', text);
      formData.append('language', language);
      formData.append('emotion', emotion);
      formData.append('speed', speed.toString());
      formData.append('breath_effect', breathEffect.toString());
      formData.append('intonation', intonation.toString());
      formData.append('articulation', articulation.toString());

      const response = await fetch(`${API_BASE_URL}/clone`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Server error');
      }

      const result = await response.json();
      if (!result.file_url) {
        throw new Error('No audio file received');
      }

      // Download the file directly using FileSystem
      const fileUri = `${FileSystem.cacheDirectory}${result.file_url.split('/').pop()}`;
      const downloadResumable = FileSystem.createDownloadResumable(
        result.file_url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setProgress(progress * 100);
          setStatusMessage(`Downloading... ${Math.round(progress * 100)}%`);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      setAudioUri(uri);
      await saveVoice(uri, text, language, emotion, mode);
      setStatusMessage('Success!');
    } catch (error) {
      showAlert('Error', error.message || 'Failed to clone voice');
      setStatusMessage('Failed');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const playSound = async () => {
    if (!audioUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      
      await newSound.playAsync();
    } catch (error) {
      showAlert('Error', 'Failed to play audio');
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const shareAudio = async () => {
    if (!audioUri) return;

    try {
      await Sharing.shareAsync(audioUri, {
        mimeType: 'audio/wav',
        dialogTitle: 'Share Voice Recording'
      });
    } catch (error) {
      showAlert('Error', 'Failed to share audio');
    }
  };

  const loadSavedVoice = async (voice) => {
    try {
      setSelectedVoice(voice);
      setAudioUri(voice.uri);
      setText(voice.text);
      setLanguage(voice.language);
      setEmotion(voice.emotion);
      setMode(voice.mode);
      setShowSavedVoices(false);
    } catch (error) {
      showAlert('Error', 'Failed to load voice');
    }
  };

  const deleteVoice = async (index) => {
    try {
      const updatedVoices = [...savedVoices];
      updatedVoices.splice(index, 1);
      await AsyncStorage.setItem('savedVoices', JSON.stringify(updatedVoices));
      setSavedVoices(updatedVoices);
    } catch (error) {
      showAlert('Error', 'Failed to delete voice');
    }
  };

  const filteredLanguages = mode === 'clone' 
    ? supportedLanguages.filter(lang => lang.supportedFor === 'clone' || lang.supportedFor === 'both')
    : supportedLanguages;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="mic" size={32} color="#6C63FF" />
        <Text style={styles.title}>UltraRealistic Voice</Text>
        <TouchableOpacity onPress={() => setShowSavedVoices(true)}>
          <Ionicons name="list" size={28} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={[
        styles.statusBanner,
        isBackendConnected ? styles.connected : styles.disconnected
      ]}>
        <Ionicons 
          name={isBackendConnected ? "wifi" : "wifi-off"} 
          size={20} 
          color="#fff" 
        />
        <Text style={styles.statusText}>
          {isBackendConnected ? `Connected to ${API_BASE_URL}` : 'Disconnected from backend'}
        </Text>
      </View>

      {/* Status Message */}
      {statusMessage && (
        <View style={styles.statusMessageContainer}>
          <Text style={styles.statusMessageText}>{statusMessage}</Text>
        </View>
      )}

      {/* Progress Bar */}
      {progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
      )}

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            mode === 'standard' && styles.modeButtonActive
          ]} 
          onPress={() => setMode('standard')}
          disabled={isLoading}
        >
          <Text style={[
            styles.modeButtonText,
            mode === 'standard' && styles.modeButtonTextActive
          ]}>
            Standard TTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            mode === 'clone' && styles.modeButtonActive
          ]} 
          onPress={() => setMode('clone')}
          disabled={isLoading}
        >
          <Text style={[
            styles.modeButtonText,
            mode === 'clone' && styles.modeButtonTextActive
          ]}>
            Voice Clone
          </Text>
        </TouchableOpacity>
      </View>

      {/* Text Input */}
      <TextInput 
        style={styles.textInput} 
        placeholder="Enter text to convert to speech..." 
        placeholderTextColor="#999"
        value={text} 
        onChangeText={setText} 
        multiline 
        numberOfLines={4}
        editable={!isLoading}
      />

      {/* Settings Container */}
      <View style={styles.settingsContainer}>
        {/* Language Dropdown */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Language:</Text>
          <View style={styles.pickerContainer}>
            <View style={styles.selectedOptionDisplay}>
              <Text style={styles.selectedOptionText}>
                {getLanguageName(language)}
              </Text>
            </View>
            <Picker
              selectedValue={language}
              onValueChange={(itemValue) => setLanguage(itemValue)}
              style={styles.picker}
              dropdownIconColor="#6C63FF"
              enabled={!isLoading}
            >
              {filteredLanguages.map((lang) => (
                <Picker.Item 
                  key={lang.code} 
                  label={`${lang.name}${lang.supportedFor === 'standard' ? ' (TTS only)' : ''}`} 
                  value={lang.code} 
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Emotion Dropdown */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Emotion:</Text>
          <View style={styles.pickerContainer}>
            <View style={styles.selectedOptionDisplay}>
              <Text style={styles.selectedOptionText}>{emotion}</Text>
            </View>
            <Picker
              selectedValue={emotion}
              onValueChange={(itemValue) => setEmotion(itemValue)}
              style={styles.picker}
              dropdownIconColor="#6C63FF"
              enabled={!isLoading}
            >
              {EMOTIONS.map((emo) => (
                <Picker.Item key={emo} label={emo} value={emo} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Speed Control */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Speed:</Text>
          <TextInput 
            style={styles.settingInput} 
            value={speed.toString()} 
            onChangeText={(val) => setSpeed(parseFloat(val) || 1.0)} 
            placeholder="1.0" 
            keyboardType="numeric" 
            editable={!isLoading}
          />
        </View>

        {/* Breath Effect Slider */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Breath Effect:</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{breathEffect.toFixed(1)}</Text>
            <View style={styles.sliderTrack}>
              <View 
                style={[
                  styles.sliderProgress, 
                  { width: `${breathEffect * 100}%` }
                ]} 
              />
              <View style={styles.sliderThumb} />
            </View>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setBreathEffect(Math.max(0, breathEffect - 0.1))}
              disabled={breathEffect <= 0 || isLoading}
            >
              <Ionicons name="remove" size={16} color="#6C63FF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setBreathEffect(Math.min(1, breathEffect + 0.1))}
              disabled={breathEffect >= 1 || isLoading}
            >
              <Ionicons name="add" size={16} color="#6C63FF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Intonation Slider */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Intonation:</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{intonation.toFixed(1)}</Text>
            <View style={styles.sliderTrack}>
              <View 
                style={[
                  styles.sliderProgress, 
                  { width: `${intonation * 100}%` }
                ]} 
              />
              <View style={styles.sliderThumb} />
            </View>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setIntonation(Math.max(0, intonation - 0.1))}
              disabled={intonation <= 0 || isLoading}
            >
              <Ionicons name="remove" size={16} color="#6C63FF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setIntonation(Math.min(1, intonation + 0.1))}
              disabled={intonation >= 1 || isLoading}
            >
              <Ionicons name="add" size={16} color="#6C63FF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Articulation Slider */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Articulation:</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>{articulation.toFixed(1)}</Text>
            <View style={styles.sliderTrack}>
              <View 
                style={[
                  styles.sliderProgress, 
                  { width: `${articulation * 100}%` }
                ]} 
              />
              <View style={styles.sliderThumb} />
            </View>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setArticulation(Math.max(0, articulation - 0.1))}
              disabled={articulation <= 0 || isLoading}
            >
              <Ionicons name="remove" size={16} color="#6C63FF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sliderButton}
              onPress={() => setArticulation(Math.min(1, articulation + 0.1))}
              disabled={articulation >= 1 || isLoading}
            >
              <Ionicons name="add" size={16} color="#6C63FF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Voice File Selection (for Clone mode) */}
      {mode === 'clone' && (
        <View style={styles.voiceFileContainer}>
          <View style={styles.voiceFileButtonsRow}>
            <TouchableOpacity 
              style={styles.voiceFileButton}
              onPress={pickVoiceFile}
              disabled={isLoading || isRecording}
            >
              <Ionicons name="folder-open" size={20} color="#fff" />
              <Text style={styles.voiceFileButtonText}>
                Select File
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.voiceFileButton,
                isRecording && styles.recordingButton
              ]}
              onPress={isRecording ? stopRecording : () => setShowRecordingOptions(true)}
              disabled={isLoading}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.voiceFileButtonText}>
                {isRecording ? 'Stop' : 'Record'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {voiceFile && (
            <View style={styles.voiceFileInfoContainer}>
              <Text style={styles.voiceFileText} numberOfLines={1}>
                Selected: {voiceFile.name}
              </Text>
              {recordingUri && (
                <TouchableOpacity 
                  style={styles.playRecordingButton}
                  onPress={isPlaying ? stopSound : playRecording}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={isPlaying ? "stop" : "play"} 
                    size={16} 
                    color="#6C63FF" 
                  />
                  <Text style={styles.playRecordingButtonText}>
                    {isPlaying ? 'Stop' : 'Play'} Recording
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Recording Options Modal */}
      <Modal
        visible={showRecordingOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRecordingOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.recordingOptionsModal}>
            <Text style={styles.recordingOptionsTitle}>Recording Options</Text>
            <Text style={styles.recordingOptionsText}>
              Please speak clearly in a quiet environment for best results.
              Recording should be at least 10 seconds long.
            </Text>
            
            <View style={styles.recordingOptionsButtons}>
              <TouchableOpacity 
                style={styles.recordingOptionButton}
                onPress={startRecording}
              >
                <Ionicons name="mic" size={24} color="#fff" />
                <Text style={styles.recordingOptionButtonText}>Start Recording</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelRecordingButton}
                onPress={() => setShowRecordingOptions(false)}
              >
                <Text style={styles.cancelRecordingButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generate Button */}
      <TouchableOpacity 
        style={[
          styles.generateButton,
          isLoading && styles.generateButtonDisabled
        ]} 
        onPress={mode === 'clone' ? generateClonedVoice : generateStandardVoice} 
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.generateButtonText}>Processing...</Text>
          </View>
        ) : (
          <Text style={styles.generateButtonText}>
            {mode === 'clone' ? 'Clone Voice' : 'Generate Voice'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Audio Player Section */}
      {audioUri && (
        <View style={styles.audioPlayerContainer}>
          <View style={styles.audioInfo}>
            <Ionicons name="musical-note" size={18} color="#6C63FF" />
            <Text style={styles.audioInfoText} numberOfLines={1}>
              {audioUri.split('/').pop()}
            </Text>
          </View>

          <View style={styles.playerControls}>
            <TouchableOpacity 
              style={[
                styles.playButton,
                isPlaying && styles.stopButton
              ]} 
              onPress={isPlaying ? stopSound : playSound}
            >
              <Ionicons 
                name={isPlaying ? "stop" : "play"} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.playButtonText}>
                {isPlaying ? 'Stop' : 'Play'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={shareAudio}
            >
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Saved Voices Modal */}
      <Modal
        visible={showSavedVoices}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSavedVoices(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved Voices</Text>
            <TouchableOpacity onPress={() => setShowSavedVoices(false)}>
              <Ionicons name="close" size={28} color="#6C63FF" />
            </TouchableOpacity>
          </View>
          
          {savedVoices.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="musical-notes" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No saved voices yet</Text>
            </View>
          ) : (
            <ScrollView style={styles.voicesList}>
              {savedVoices.map((voice, index) => (
                <View key={index} style={[
                  styles.voiceItem,
                  selectedVoice && selectedVoice.uri === voice.uri && styles.selectedVoiceItem
                ]}>
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceName} numberOfLines={1}>
                      {voice.fileName}
                    </Text>
                    <Text style={styles.voiceDetails}>
                      {getLanguageName(voice.language)} • {voice.emotion} • {new Date(voice.timestamp).toLocaleString()}
                    </Text>
                    <Text style={styles.voiceTextPreview} numberOfLines={1}>
                      "{voice.text}"
                    </Text>
                  </View>
                  <View style={styles.voiceActions}>
                    <TouchableOpacity 
                      style={styles.loadButton}
                      onPress={() => {
                        loadSavedVoice(voice);
                        setShowSavedVoices(false);
                      }}
                    >
                      <Ionicons name="play" size={18} color="#6C63FF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Confirm Delete',
                          'Are you sure you want to delete this voice?',
                          [
                            {
                              text: 'Cancel',
                              style: 'cancel',
                            },
                            {
                              text: 'Delete',
                              onPress: () => deleteVoice(index),
                              style: 'destructive',
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash" size={18} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefae0',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  connected: {
    backgroundColor: '#28a745',
  },
  disconnected: {
    backgroundColor: '#dc3545',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  statusMessageContainer: {
    backgroundColor: '#e9ecef',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusMessageText: {
    color: '#495057',
    textAlign: 'center',
  },
  progressContainer: {
    height: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6C63FF',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 5,
  },
  modeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#606c38',
  },
  modeButtonText: {
    color: '#495057',
    fontWeight: 'bold',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    minHeight: 120,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingLabel: {
    width: 100,
    color: '#495057',
    fontWeight: 'bold',
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  selectedOptionDisplay: {
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  selectedOptionText: {
    color: '#333',
    fontWeight: 'bold',
  },
  picker: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  settingInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    padding: 8,
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderValue: {
    width: 30,
    textAlign: 'center',
    color: '#495057',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginHorizontal: 5,
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
    top: -6,
    left: '50%',
    marginLeft: -8,
  },
  sliderButton: {
    padding: 5,
  },
  voiceFileContainer: {
    marginBottom: 15,
  },
  voiceFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#606c38',
    padding: 12,
    borderRadius: 8,
  },
  voiceFileButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  voiceFileText: {
    marginTop: 5,
    color: '#6c757d',
    fontSize: 12,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#606c38',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioPlayerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  audioInfoText: {
    color: '#6c757d',
    marginLeft: 8,
    flex: 1,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#606c38',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fefae0',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  voicesList: {
    flex: 1,
  },
  voiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedVoiceItem: {
    borderColor: '#6C63FF',
    backgroundColor: '#f0f0ff',
  },
  voiceInfo: {
    flex: 1,
    marginRight: 10,
  },
  voiceName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  voiceDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  voiceTextPreview: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  voiceActions: {
    flexDirection: 'row',
  },
  loadButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  voiceFileButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  voiceFileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#606c38',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  recordingButton: {
    backgroundColor: '#dc3545',
  },
  voiceFileInfoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  voiceFileText: {
    color: '#495057',
    fontSize: 14,
  },
  playRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  playRecordingButtonText: {
    color: '#6C63FF',
    marginLeft: 5,
    fontWeight: 'bold',
  },

  // Modal Overlay Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  recordingOptionsModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
  },
  recordingOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  recordingOptionsText: {
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  recordingOptionsButtons: {
    flexDirection: 'column',
  },
  recordingOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#606c38',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  recordingOptionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cancelRecordingButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelRecordingButtonText: {
    color: '#dc3545',
    fontWeight: 'bold',
  },

  // Additional styles for picker and sliders
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
    height: 50, // Added fixed height for consistency
    justifyContent: 'center', // Center the selected value
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginHorizontal: 5,
    position: 'relative',
    overflow: 'hidden', // Ensure progress stays within track
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6C63FF',
    top: -6,
    left: '50%',
    marginLeft: -8,
    zIndex: 1, // Ensure thumb is above progress
  },
});