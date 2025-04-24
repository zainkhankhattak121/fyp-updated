import React, { useState } from 'react';
import { View, TextInput, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGoogle, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig.js'; 

const AuthDashboard = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    try {
      if (!email || !password) {
        Alert.alert("Input Error", "Please enter both email and password.");
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await user.reload();
      if (user && !user.emailVerified) {
        Alert.alert("Sign In Error", "Your email is not verified. Please verify your email before logging in.");
        return;
      }

      navigation.navigate('MainApp');
      Alert.alert("Sign In Successful!", "You have successfully signed in.");
    } catch (error) {
      handleSignInError(error);
    }
  };

  const handleSignInError = (error) => {
    let errorMessage = "An unexpected error occurred.";
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = "No user found with this email. Please sign up.";
        break;
      case 'auth/wrong-password':
        errorMessage = "Incorrect password. Please try again.";
        break;
      case 'auth/invalid-email':
        errorMessage = "The email address is not valid.";
        break;
      default:
        errorMessage = error.message;
    }
    Alert.alert("Sign In Error", errorMessage);
  };

  const handleGoogleSignIn = async () => {
    try {
      navigation.navigate('googlesignin');
    } catch (error) {
      Alert.alert("Google Sign In Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

      {/* Email Input with Icon */}
      <View style={styles.inputContainer}>
        <FontAwesomeIcon icon={faEnvelope} size={20} color="#606c38" style={styles.icon} />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#B0B0B0"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password Input with Icon */}
      <View style={styles.inputContainer}>
        <FontAwesomeIcon icon={faLock} size={20} color="#606c38" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#B0B0B0"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <Text
        style={styles.forgotPassword}
        onPress={() => navigation.navigate('ForgetPassword')}
      >
        Forgot Password?
      </Text>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <FontAwesomeIcon icon={faGoogle} size={25} style={styles.googleIcon} />
        <Text style={styles.googleButtonText}>Sign In with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signUpButton}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AuthDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefae0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#606c38',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#606c38',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#000000',
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: '#606c38',
    paddingVertical: 15,
    borderRadius: 50,
    width: '85%',
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#606c38',
    marginVertical: 10,
    width: '85%',
  },
  googleIcon: {
    marginRight: 10,
    color: '#606c38',
  },
  googleButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#606c38',
    paddingVertical: 15,
    borderRadius: 50,
    width: '85%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    color: '#606c38',
    fontSize: 14,
    marginVertical: 10,
    textDecorationLine: 'underline',
  },
});