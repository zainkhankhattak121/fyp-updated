import React, { useState } from 'react';
import { View, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const navigation = useNavigation();

  const handleSignIn = async () => {
    setLoading(true); // Start loading
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user's email is verified
      await user.reload(); // Refresh the user data
      if (!user.emailVerified) {
        Alert.alert("Sign In Error", "Your email is not verified. Please verify your email before logging in.");
        await auth.signOut(); // Sign out the user
        setLoading(false); // Stop loading
        return;
      }

      // If verified, navigate to the Home screen
      navigation.navigate('HomeScreen'); // Replace with your actual Home screen name
      Alert.alert("Sign In Successful!", "You have successfully signed in.");
    } catch (error) {
      Alert.alert("Sign In Error", error.message);
    } finally {
      setLoading(false); // Stop loading regardless of success or error
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Sign In" onPress={handleSignIn} disabled={loading} />
      {loading && <ActivityIndicator size="small" color="#0000ff" />}
    </View>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
});
