import { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography, shadows, card, iconSizes } from '../styles/theme';

export default function ProfileScreen() {
  const { signOut } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState({
    role: '',
    email: '',
    apaarId: '',
  });

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      const apaarId = await AsyncStorage.getItem('apaarId');
      // Email would need to be stored during login if needed
      setUserInfo({
        role: role || 'User',
        apaarId: apaarId || 'N/A',
      });
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const getRoleIcon = () => {
    switch (userInfo.role) {
      case 'student':
        return 'school';
      case 'teacher':
        return 'person-outline';
      case 'parent':
        return 'people-outline';
      default:
        return 'person';
    }
  };

  const getRoleColor = () => {
    switch (userInfo.role) {
      case 'student':
        return colors.iq;
      case 'teacher':
        return colors.secondary;
      case 'parent':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: getRoleColor() + '15' }]}>
          <Ionicons name={getRoleIcon()} size={72} color={getRoleColor()} />
        </View>
        <Text style={styles.roleTitle}>
          {userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1)}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor() }]}>
          <Text style={styles.roleBadgeText}>{userInfo.role.toUpperCase()}</Text>
        </View>
      </View>

      {/* Account Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        {userInfo.apaarId !== 'N/A' && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.primary + '12' }]}>
                <Ionicons name="card" size={iconSizes.md} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>APAAR ID</Text>
                <Text style={styles.infoValue}>{userInfo.apaarId}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.success + '12' }]}>
              <Ionicons name="shield-checkmark" size={iconSizes.md} color={colors.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Status</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.info + '12' }]}>
              <Ionicons name="settings" size={iconSizes.md} color={colors.info} />
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.warning + '12' }]}>
              <Ionicons name="help-circle" size={iconSizes.md} color={colors.warning} />
            </View>
            <Text style={styles.actionText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.secondary + '12' }]}>
              <Ionicons name="information-circle" size={iconSizes.md} color={colors.secondary} />
            </View>
            <Text style={styles.actionText}>About</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutIconContainer}>
            <Ionicons name="log-out" size={22} color={colors.white} />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Student Development Tracker</Text>
        <Text style={styles.versionText}>Version 2.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  roleTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
    fontWeight: '500',
  },
  infoValue: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
  },
  statusText: {
    ...typography.h4,
    color: colors.success,
    fontWeight: '600',
  },
  actionCard: {
    ...card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  logoutButton: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg + 2,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.error,
    borderWidth: 0,
    ...shadows.md,
  },
  logoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    ...typography.h4,
    color: colors.white,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  versionText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});
