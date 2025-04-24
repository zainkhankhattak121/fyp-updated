import React, { useState, useEffect } from 'react';
import { Button, View, StyleSheet, TextInput, Text, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCredential, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();
const firebaseConfig = {
  apiKey: 'AIzaSyC5zFuWZGZcsIbFTqSzyVgBVHjnUZmKdSE',
  authDomain: 'deepfakeaudio.firebaseapp.com',
  projectId: 'deepfakeaudio',
  storageBucket: 'deepfakeaudio.appspot.com',
  messagingSenderId: '996257752349',
  appId: '1:996257752349:android:41c3c0dda62c933fef6df4',
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '715536465897-alh8rp4girh91dqe0ng81ptldm7juvrl.apps.googleusercontent.com',
    expoClientId: '715536465897-te7yjtf8eoat07p3pcsvu34ied6o2cnq.apps.googleusercontent.com'
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;

      const credential = GoogleAuthProvider.credential(null, authentication.accessToken);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          Alert.alert('Google Login successful!', `Welcome ${userCredential.user.displayName}`);
        })
        .catch((error) => {
          Alert.alert('Google Login failed:', error.message);
        });
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    await promptAsync();
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, `${username}@example.com`, password);
      const user = userCredential.user;
      Alert.alert('Signup successful!', `Welcome ${user.displayName}`);
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, `${username}@example.com`, password);
      Alert.alert('Login successful!');
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {isSignUp ? (
        <Button title="Sign Up" onPress={handleSignUp} />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}

      <Button
        title="Sign In with Google"
        disabled={!request}
        onPress={handleGoogleSignIn}
      />

      <Text
        style={styles.switchText}
        onPress={() => setIsSignUp(!isSignUp)}
      >
        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '80%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  switchText: {
    color: 'blue',
    marginTop: 10,
  },
});

export default LoginScreen;