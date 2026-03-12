import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import ParentDashboardScreen from '../screens/ParentDashboardScreen';
import RemediesScreen from '../screens/RemediesScreen';
import QuizHistoryScreen from '../screens/QuizHistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={ParentDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuizHistory"
        component={QuizHistoryScreen}
        options={{ title: 'Quiz History' }}
      />
      <Stack.Screen 
        name="Remedies" 
        component={RemediesScreen}
        options={{ title: 'Suggested Activities' }}
      />
    </Stack.Navigator>
  );
}

function ProfileScreen() {
  const { signOut } = useContext(AuthContext);
  
  return (
    <TouchableOpacity 
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      onPress={signOut}
    >
      <Text style={{ fontSize: 18, color: '#007AFF' }}>Logout</Text>
    </TouchableOpacity>
  );
}

export default function ParentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}
