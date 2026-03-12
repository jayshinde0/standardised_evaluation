import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, Text } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen';
import UploadPhysicalScreen from '../screens/UploadPhysicalScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function StudentsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Students" 
        component={TeacherDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="UploadPhysical" 
        component={UploadPhysicalScreen}
        options={{ title: 'Upload Physical Test' }}
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

export default function TeacherNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen 
        name="StudentsTab" 
        component={StudentsStack}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Students'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}
