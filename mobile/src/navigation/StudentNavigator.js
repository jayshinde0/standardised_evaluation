import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import StudentDashboardScreen from '../screens/StudentDashboardScreen';
import TakeTestScreen from '../screens/TakeTestScreen';
import QuizHistoryScreen from '../screens/QuizHistoryScreen';
import QuizHistoryDetailScreen from '../screens/QuizHistoryDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors, spacing, typography } from '../styles/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Dashboard" 
        component={StudentDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuizHistory"
        component={QuizHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuizHistoryDetail"
        component={QuizHistoryDetailScreen}
        options={{ 
          title: 'Quiz Analysis',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            ...typography.h3,
          },
        }}
      />
      <Stack.Screen 
        name="TakeTest" 
        component={TakeTestScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: spacing.md,
          paddingTop: spacing.sm,
          height: 70,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          ...typography.caption,
          fontWeight: '600',
          fontSize: 12,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardStack}
        options={{ 
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={26} 
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
