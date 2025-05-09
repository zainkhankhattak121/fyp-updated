import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Animated, 
  Easing,
  AppState,
  Dimensions,
  SafeAreaView
} from "react-native";
import axios from "axios";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SUPPORTED_AUDIO_TYPES = [
  "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3",
  "audio/aac", "audio/flac", "audio/ogg", "audio/x-flac",
  "audio/mp4", "audio/x-m4a", "audio/webm", "audio/amr"
];

const SERVER_URL = "https://zainkhan121-fastapi-deepfake.hf.space";
const MAX_FILE_SIZE_MB = 10;
const SERVER_CHECK_INTERVAL = 5000;
const CONNECTION_RETRY_DELAY = 2000;

const createConnectionManager = () => {
  let isConnected = false;
  let connectionCheckInterval = null;
  let isActive = false;
  let retryTimeout = null;
  
  const manager = {
    start: (onStatusChange) => {
      if (connectionCheckInterval || !isActive) return;
      
      const checkConnection = async () => {
        try {
          const response = await axios.get(`${SERVER_URL}/health-check`, {
            timeout: 5000
          });
          
          const newStatus = response.status === 200;
          if (newStatus !== isConnected) {
            isConnected = newStatus;
            onStatusChange(isConnected);
          }
          if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
          }
        } catch (error) {
          if (isConnected) {
            isConnected = false;
            onStatusChange(false);
          }
          if (!retryTimeout) {
            retryTimeout = setTimeout(() => checkConnection(), CONNECTION_RETRY_DELAY);
          }
        }
      };
      
      checkConnection();
      connectionCheckInterval = setInterval(checkConnection, SERVER_CHECK_INTERVAL);
    },
    stop: () => {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
        connectionCheckInterval = null;
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
    },
    activate: () => {
      isActive = true;
    },
    deactivate: () => {
      isActive = false;
      manager.stop();
    },
    getStatus: () => isConnected
  };
  
  return manager;
};

const showAlert = (title, message) => {
  Alert.alert(
    title,
    message,
    [{ text: 'OK' }],
    { cancelable: false }
  );
};

const VoiceDetectionScreen = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [serverConnected, setServerConnected] = useState(false);
  const [uploadState, setUploadState] = useState({
    loading: false,
    error: null,
    progress: 0
  });
  const [fileInfo, setFileInfo] = useState({
    name: null,
    size: null
  });
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const connectionManager = useRef(createConnectionManager()).current;
  const appState = useRef(AppState.currentState);
  const uploadController = useRef(null);

  const animateResult = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: true
      })
    ]).start();
  };

  useEffect(() => {
    connectionManager.activate();
    
    const handleStatusChange = (connected) => {
      setServerConnected(connected);
      if (!connected && uploadState.loading) {
        uploadController.current?.abort();
        setUploadState(prev => ({
          ...prev,
          loading: false,
          error: "Server connection lost during upload"
        }));
        showAlert("Connection Lost", "Server connection was lost during upload. Please try again.");
      }
    };
    
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        connectionManager.start(handleStatusChange);
      } else if (nextAppState.match(/inactive|background/)) {
        connectionManager.stop();
      }
      appState.current = nextAppState;
    };
    
    connectionManager.start(handleStatusChange);
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      connectionManager.deactivate();
      subscription.remove();
    };
  }, []);

  const handleFileUpload = async () => {
    if (!connectionManager.getStatus()) {
      showAlert("Server Offline", "Please ensure the server is running and accessible.");
      return;
    }

    setResult(null);
    setUploadState({ loading: true, error: null, progress: 0 });

    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_AUDIO_TYPES,
        copyToCacheDirectory: true,
        multiple: false
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) {
        setUploadState(prev => ({ ...prev, loading: false }));
        return;
      }

      const file = pickerResult.assets[0];
      const fileStats = await FileSystem.getInfoAsync(file.uri);
      
      if (!fileStats.exists) {
        throw new Error("Selected file does not exist");
      }

      try {
        await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (readError) {
        throw new Error("Failed to read file contents");
      }

      const fileSizeMB = fileStats.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      }

      if (!SUPPORTED_AUDIO_TYPES.includes(file.mimeType)) {
        throw new Error("Unsupported file type");
      }

      setFileInfo({
        name: file.name,
        size: fileSizeMB.toFixed(2)
      });

      const fileUri = file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`;
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: file.name,
        type: file.mimeType || "audio/*"
      });

      uploadController.current = new AbortController();
      const timeout = setTimeout(() => {
        uploadController.current.abort();
      }, 30000);

      if (!connectionManager.getStatus()) {
        throw new Error("Server connection lost during upload preparation");
      }

      const response = await axios.post(`${SERVER_URL}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: uploadController.current.signal,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadState(prev => ({ ...prev, progress: percentCompleted }));
          
          if (!connectionManager.getStatus()) {
            uploadController.current.abort();
            throw new Error("Server connection lost during upload");
          }
        }
      });

      clearTimeout(timeout);

      if (!response.data?.result) {
        throw new Error("Invalid response from server");
      }

      if (!connectionManager.getStatus()) {
        throw new Error("Server connection lost during result processing");
      }

      setResult(response.data.result);
      animateResult();
      
      showAlert(
        "Analysis Complete", 
        `The voice analysis result is: ${response.data.result === "real" ? "Genuine Voice" : "Potential Deepfake"}`
      );

    } catch (error) {
      console.error("Upload error:", error);
      let errorMessage = "Upload failed: ";
      
      if (error.name === 'AbortError' || error.code === "ECONNABORTED") {
        errorMessage += "Request timed out or was aborted";
      } else if (error.message === "Network Error") {
        errorMessage += "Network error - please check your connection";
      } else if (error.response) {
        errorMessage += `Server error (${error.response.status})`;
      } else {
        errorMessage += error.message || "Unknown error";
      }
      
      setUploadState(prev => ({ ...prev, error: errorMessage }));
      showAlert("Upload Failed", errorMessage);
    } finally {
      setUploadState(prev => ({ ...prev, loading: false, progress: 0 }));
      uploadController.current = null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#fefae0', '#f8f4d9']}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Voice Authenticator</Text>
          <Text style={styles.subtitle}>Detect deepfake audio with AI analysis</Text>
        </View>
        
        <View style={styles.statusCard}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: serverConnected ? "#4CAF50" : "#F44336" }
          ]}>
            <MaterialIcons 
              name={serverConnected ? "wifi" : "wifi-off"} 
              size={20} 
              color="white"
            />
            <Text style={styles.statusText}>
              {serverConnected ? "Server Connected" : "Server Disconnected"}
            </Text>
          </View>
          <Text style={styles.serverUrl}>{SERVER_URL}</Text>
        </View>

        <View style={styles.uploadCard}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              { 
                opacity: (!serverConnected || uploadState.loading) ? 0.6 : 1,
              }
            ]}
            onPress={handleFileUpload}
            disabled={!serverConnected || uploadState.loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={serverConnected ? ['#606c38', '#4a5a2a'] : ['#CCCCCC', '#AAAAAA']}
              style={styles.buttonGradient}
            >
              {uploadState.loading ? (
                <View style={styles.uploadProgressContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  {uploadState.progress > 0 && (
                    <Text style={styles.progressText}>
                      {uploadState.progress}%
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  {serverConnected ? "Upload Voice File" : "Server Offline"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {fileInfo.name && (
            <View style={styles.fileInfoCard}>
              <MaterialIcons name="insert-drive-file" size={24} color="#606c38" />
              <View style={styles.fileInfoTextContainer}>
                <Text style={styles.fileText} numberOfLines={1} ellipsizeMode="middle">
                  {fileInfo.name}
                </Text>
                <Text style={styles.fileSize}>{fileInfo.size} MB</Text>
              </View>
            </View>
          )}
        </View>

        {result && (
          <Animated.View 
            style={[
              styles.resultCard,
              result === "real" ? styles.realResult : styles.fakeResult,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <MaterialIcons 
              name={result === "real" ? "check-circle" : "warning"} 
              size={32} 
              color="white"
            />
            <Text style={styles.resultText}>
              {result === "real" ? "Genuine Voice" : "Potential Deepfake"}
            </Text>
          </Animated.View>
        )}

        {uploadState.error && (
          <View style={styles.errorCard}>
            <MaterialIcons name="error-outline" size={24} color="#fefae0" />
            <Text style={styles.errorText}>
              {uploadState.error}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Select an audio file to analyze</Text>
          <Text style={styles.supportedFormats}>
            Supported formats: WAV, MP3, AAC, FLAC, OGG, M4A, WEBM, AMR
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#283618',
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#283618",
    fontFamily: 'Roboto',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#606c38",
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    color: "white",
    fontFamily: 'Roboto'
  },
  serverUrl: {
    textAlign: "center",
    color: "#606c38",
    fontSize: 12,
    fontFamily: 'Roboto',
    opacity: 0.8,
  },
  uploadCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  uploadButton: {
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: 'center',
  },
  buttonText: {
    color: "#fefae0",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: 'Roboto'
  },
  uploadProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: "#fefae0",
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Roboto'
  },
  fileInfoCard: {
    backgroundColor: "#f8f4d9",
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9e5d1',
  },
  fileInfoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  fileText: {
    fontSize: 14,
    color: "#283618",
    fontFamily: 'Roboto',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: "#606c38",
    fontFamily: 'Roboto',
    opacity: 0.8,
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "center",
    width: width - 48,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  realResult: {
    backgroundColor: "#606c38",
  },
  fakeResult: {
    backgroundColor: "#bc6c25",
  },
  resultText: {
    fontWeight: "600",
    fontSize: 18,
    marginLeft: 12,
    color: "#fefae0",
    fontFamily: 'Roboto'
  },
  errorCard: {
    backgroundColor: "#bc6c25",
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: "#fefae0",
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Roboto',
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    color: "#606c38",
    fontSize: 14,
    fontFamily: 'Roboto',
    marginBottom: 8,
  },
  supportedFormats: {
    color: "#606c38",
    fontSize: 12,
    fontFamily: 'Roboto',
    opacity: 0.7,
    textAlign: 'center',
  }
});

export default VoiceDetectionScreen;