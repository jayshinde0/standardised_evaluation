import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import StudentNavigator from './src/navigation/StudentNavigator';
import TeacherNavigator from './src/navigation/TeacherNavigator';
import ParentNavigator from './src/navigation/ParentNavigator';
import { AuthContext } from './src/context/AuthContext';

const Stack = createStackNavigator();

export default function App() {
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [apaarId, setApaarId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');
        const id = await AsyncStorage.getItem('apaarId');
        
        if (token && role) {
          setUserToken(token);
          setUserRole(role);
          setApaarId(id);
        }
      } catch (e) {
        console.error('Failed to load user data', e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (token, role, id) => {
        try {
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('userRole', role);
          if (id) await AsyncStorage.setItem('apaarId', id);
          
          setUserToken(token);
          setUserRole(role);
          setApaarId(id);
        } catch (e) {
          console.error('Failed to save user data', e);
        }
      },
      signOut: async () => {
        try {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userRole');
          await AsyncStorage.removeItem('apaarId');
          
          setUserToken(null);
          setUserRole(null);
          setApaarId(null);
        } catch (e) {
          console.error('Failed to remove user data', e);
        }
      },
      userToken,
      userRole,
      apaarId,
    }),
    [userToken, userRole, apaarId]
  );

  if (isLoading) {
    return null; // Or a loading screen
  }

  const getRoleNavigator = () => {
    switch (userRole) {
      case 'student':
        return <StudentNavigator />;
      case 'teacher':
        return <TeacherNavigator />;
      case 'parent':
        return <ParentNavigator />;
      default:
        return null;
    }
  };

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userToken == null ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          ) : (
            <Stack.Screen name="Main">
              {() => getRoleNavigator()}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
