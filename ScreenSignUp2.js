import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, deleteUser } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from './firebaseConfig';  // Ensure your Firebase config is imported

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // New state for confirm password
  const [errorMessage, setErrorMessage] = useState(''); // State to hold error messages
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setErrorMessage("Email, password, and confirm password cannot be empty.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const createdUser = userCredential.user;
      await sendEmailVerification(createdUser);
      setErrorMessage(""); // Clear error message on success
      Alert.alert("Sign Up Successful!", "A verification email has been sent. Please verify your email before logging in.");

      setUser(createdUser);

      const deleteTimer = setTimeout(() => {
        handleDeleteUser(createdUser);
      }, 600000); // 60 seconds

      await signOut(auth);
      setTimer(deleteTimer);

      navigation.navigate('AuthDashboard');
    } catch (error) {
      handleError(error);
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      await deleteUser(user); 
      Alert.alert("Account Deleted", "Your account has been deleted because the email was not verified within 60 seconds.");
    } catch (error) {
      console.error("Error deleting user: ", error);
      Alert.alert("Error", "There was an issue deleting your account. Please try again.");
    }
  };

  const handleError = (error) => {
    let errorMessage = "An unexpected error occurred.";

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = "The email is already in use. Please log in.";
        break;
      case 'auth/invalid-email':
        errorMessage = "The email address is not valid.";
        break;
      case 'auth/weak-password':
        errorMessage = "The password is too weak. Please choose a stronger password.";
        break;
      case 'auth/missing-email':
        errorMessage = "Please provide an email.";
        break;
      case 'auth/operation-not-allowed':
        errorMessage = "Email/password accounts are not enabled. Enable them in the Firebase console.";
        break;
      default:
        errorMessage = error.message; 
    }

    setErrorMessage(errorMessage);
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
      <TextInput
        placeholder="Confirm Password" // New confirm password field
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Sign Up" onPress={handleSignUp} />
      
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null} {/* Conditionally render error message */}
    </View>
  );
};

export default SignUpScreen;

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
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});
