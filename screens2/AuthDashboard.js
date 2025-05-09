import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, Alert, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

const AuthDashboard = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Check if email is verified
          await user.reload();
          if (user.emailVerified) {
            // Save user data in AsyncStorage
            await AsyncStorage.setItem('userData', JSON.stringify({
              email: user.email,
              isLoggedIn: true
            }));
            
            // Navigate to main app
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainApp' }],
              })
            );
          } else {
            await auth.signOut();
            await AsyncStorage.removeItem('userData');
          }
        } else {
          // Check if we have saved credentials
          const savedData = await AsyncStorage.getItem('userData');
          if (savedData) {
            const { email: savedEmail, isLoggedIn } = JSON.parse(savedData);
            if (isLoggedIn && savedEmail) {
              setEmail(savedEmail);
            }
          }
        }
      } catch (error) {
        console.error('Auth state error:', error);
        Alert.alert('Error', 'Failed to check authentication status.');
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      
      // Validate inputs
      if (!email.trim()) {
        throw { code: 'empty-email', message: 'Please enter your email address.' };
      }

      if (!password.trim()) {
        throw { code: 'empty-password', message: 'Please enter your password.' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw { code: 'invalid-email', message: 'Please enter a valid email address.' };
      }

      if (password.length < 6) {
        throw { code: 'weak-password', message: 'Password should be at least 6 characters.' };
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check email verification
      await user.reload();
      if (!user.emailVerified) {
        await auth.signOut();
        throw { code: 'email-not-verified', message: 'Your email is not verified. Please verify your email before logging in.' };
      }

      // Save login status
      await AsyncStorage.setItem('userData', JSON.stringify({
        email: email,
        isLoggedIn: true
      }));

      // Navigate to main app
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        })
      );
      
    } catch (error) {
      let errorTitle = 'Login Error';
      let errorMessage = error.message;
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please sign up.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many unsuccessful attempts. Account temporarily disabled. Try again later or reset your password.';
          break;
        case 'auth/network-request-failed':
          errorTitle = 'Network Error';
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'empty-email':
        case 'empty-password':
        case 'invalid-email':
        case 'weak-password':
        case 'email-not-verified':
          // These are our custom errors, no need to change
          break;
        default:
          errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      navigation.navigate('GoogleSignIn');
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate Google sign in.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#606c38" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

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
          editable={!isSigningIn}
        />
      </View>

      <View style={styles.inputContainer}>
        <FontAwesomeIcon icon={faLock} size={20} color="#606c38" style={styles.icon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#B0B0B0"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          editable={!isSigningIn}
        />
      </View>

      <TouchableOpacity 
        style={[styles.signInButton, isSigningIn && styles.disabledButton]} 
        onPress={handleSignIn}
        disabled={isSigningIn}
      >
        {isSigningIn ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <Text
        style={styles.forgotPassword}
        onPress={() => !isSigningIn && navigation.navigate('ForgetPasswordScreen')}
      >
        Forgot Password?
      </Text>

  {/*
<TouchableOpacity
  style={[styles.googleButton, isSigningIn && styles.disabledButton]}
  onPress={handleGoogleSignIn}
  disabled={isSigningIn}
>
  <FontAwesomeIcon icon={faGoogle} size={25} style={styles.googleIcon} />
  <Text style={styles.googleButtonText}>Sign In with Google</Text>
</TouchableOpacity>
*/}


      <TouchableOpacity
        style={[styles.signUpButton, isSigningIn && styles.disabledButton]}
        onPress={() => !isSigningIn && navigation.navigate('SignUp')}
        disabled={isSigningIn}
      >
        <Text style={styles.buttonText}>Create New Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefae0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  icon: {
    marginRight: 10,
  },
 input: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontFamily:'roboto'
  },
  signInButton: {
    backgroundColor: '#606c38',
    paddingVertical: 15,
    borderRadius: 50,
    width: '85%',
    alignItems: 'center',
    marginTop: 10,
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
    marginTop: 5,
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
  disabledButton: {
    opacity: 0.6,
  },
});

export default AuthDashboard;