import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, deleteUser } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth } from './firebaseConfig';

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [timer, setTimer] = useState(null);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    hasLetter: false,
    hasNumber: false,
    hasSymbol: false,
  });

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  useEffect(() => {
    // Validate password whenever it changes
    validatePassword(password);
  }, [password]);

  const validatePassword = (pwd) => {
    setPasswordValidation({
      length: pwd.length >= 6,
      hasLetter: /[a-zA-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    });
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Check if password meets all requirements
    if (!Object.values(passwordValidation).every(val => val)) {
      setErrorMessage("Password doesn't meet all requirements.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const createdUser = userCredential.user;
      await sendEmailVerification(createdUser);
      setErrorMessage("");
      
      Alert.alert(
        "Sign Up Successful!", 
        "A verification email has been sent. Please verify your email before logging in."
      );

      setUser(createdUser);

      const deleteTimer = setTimeout(() => {
        handleDeleteUser(createdUser);
      }, 60000); // 60 seconds

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
      Alert.alert(
        "Account Deleted", 
        "Your account has been deleted because the email was not verified within 60 seconds."
      );
    } catch (error) {
      console.error("Error deleting user: ", error);
      Alert.alert(
        "Error", 
        "There was an issue deleting your account. Please try again."
      );
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

  const getValidationColor = (isValid) => {
    return isValid ? '#4CAF50' : '#F44336';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
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
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      {/* Password Requirements */}
      <View style={styles.validationContainer}>
        <Text style={styles.validationTitle}>Password Requirements:</Text>
        <Text style={{ color: getValidationColor(passwordValidation.length) }}>
          ✓ At least 6 characters
        </Text>
        <Text style={{ color: getValidationColor(passwordValidation.hasLetter) }}>
          ✓ Contains at least one letter
        </Text>
        <Text style={{ color: getValidationColor(passwordValidation.hasNumber) }}>
          ✓ Contains at least one number
        </Text>
        <Text style={{ color: getValidationColor(passwordValidation.hasSymbol) }}>
          ✓ Contains at least one symbol (!@#$%^&* etc.)
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleSignUp}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <TouchableOpacity onPress={() => navigation.navigate('AuthDashboard')}>
        <Text style={styles.loginText}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fefae0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
      fontFamily: 'Roboto'
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
      fontFamily: 'Roboto',
  },
  validationContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
      fontFamily: 'Roboto'
  },
  validationTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
      fontFamily: 'Roboto'
  },
  button: {
    backgroundColor: '#606c38',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
      fontFamily: 'Roboto'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
      fontFamily: 'Roboto'
  },
  errorText: {
    color: '#F44336',
    marginTop: 15,
    textAlign: 'center',
      fontFamily: 'Roboto'
  },
  loginText: {
    color: '#4285F4',
    marginTop: 20,
    textAlign: 'center',
    textDecorationLine: 'underline',
      fontFamily: 'Roboto'
  },
});

export default SignUpScreen;