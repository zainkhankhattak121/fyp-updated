import React, { useEffect, useState, useCallback } from 'react'; 
import { Text, View, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session'; 
import { useNavigation } from '@react-navigation/native';

WebBrowser.maybeCompleteAuthSession();

// Replace with your real IDs
const WEB_CLIENT_ID = '715536465897-te7vjtf8eoato7p3pcsvu34ied6o2cnq.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '715536465897-alh8rp4girh91dqe0ng81ptldm7juvrl.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAX--yv0rN4_Cbfx7DiGozL9SZHGR4xhsQ';
const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.readonly'
];

const GoogleSignInScreen = () => {
  const navigation = useNavigation();
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID, // Web client
    androidClientId: ANDROID_CLIENT_ID,
    scopes: SCOPES,
    redirectUri,
  });

  const [userInfo, setUserInfo] = useState(null);
  const [events, setEvents] = useState([]);

  const fetchUserProfile = useCallback(async (idToken) => {
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      const userProfile = await res.json();
      setUserInfo(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to fetch user profile. Please try again.');
    }
  }, []);

  const fetchCalendarEvents = async (accessToken) => {
    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${API_KEY}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      setEvents(data.items || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      Alert.alert('Error', 'Failed to fetch calendar events. Please try again.');
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;
      fetchUserProfile(id_token);
      fetchCalendarEvents(access_token);
    }
  }, [response]);

  useEffect(() => {
    if (userInfo) {
      console.log('User Info:', userInfo);
      navigation.replace('MainApp');
    }
  }, [userInfo, navigation]);

  useEffect(() => {
    if (request) {
      promptAsync(); // Trigger login on screen load
    }
  }, [request]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {userInfo && <Text>Welcome, {userInfo.name}</Text>}
      {events.length > 0 && (
        <View>
          <Text>Upcoming Events:</Text>
          {events.map((event) => (
            <Text key={event.id}>{event.summary}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default GoogleSignInScreen;
