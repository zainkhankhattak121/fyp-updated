import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import emailjs from 'emailjs-com';

const FeedbackScreen = () => {
  const [name, setName] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name || !recipient || !message) {
      Alert.alert("Input Error", "All fields are required.");
      return;
    }

    const templateParams = {
      from_name: name,
      to_name: recipient,
      message: message,
    };

    emailjs
      .send(
        'service_i3fmcej', // Replace with your actual service ID
        'template_ty0chso', // Replace with your actual template ID
        templateParams,
        'EnBWIRgjRMXYBwsYe' // Replace with your actual user ID
      )
      .then(
        (response) => {
          console.log('SUCCESS!', response.status, response.text);
          Alert.alert("Success", "Email sent successfully!");
          setName('');
          setRecipient('');
          setMessage('');
        },
        (err) => {
          console.log('FAILED...', err);
          Alert.alert("Error", "Failed to send email. Please try again later.");
        }
      );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Send Email</Text>
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="Your Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.textInput}
        placeholder="Your Email"
        value={recipient}
        onChangeText={setRecipient}
      />
      <TextInput
        style={[styles.textInput, { height: 100 }]}
        placeholder="Your Message"
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Send</Text>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
    fontFamily:'Roboto',
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
  button: {
    backgroundColor: '#606c38',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily:'Roboto',
  },
});

export default FeedbackScreen;