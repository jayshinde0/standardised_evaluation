import { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import TeacherDashboardScreen from '../screens/TeacherDashboardScreen';
import UploadPhysicalScreen from '../screens/UploadPhysicalScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors, spacing, typography, shadows } from '../styles/theme';

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
        options={{ 
          title: 'Upload Physical Test',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            ...typography.h3,
          },
        }}
      />
    </Stack.Navigator>
  );
}

export default function TeacherNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
          height: 65,
          ...shadows.lg,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '600',
          fontSize: 11,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen 
        name="StudentsTab" 
        component={StudentsStack}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Students',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'people' : 'people-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerStyle: {
            backgroundColor: colors.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            ...typography.h3,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
