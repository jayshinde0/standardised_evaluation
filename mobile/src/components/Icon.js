import { MaterialCommunityIcons, Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';
import { colors, iconSizes } from '../styles/theme';

// Icon component wrapper for consistent usage
export const Icon = ({ name, type = 'MaterialCommunityIcons', size = 'md', color = colors.textPrimary, style }) => {
  const iconSize = typeof size === 'number' ? size : iconSizes[size];
  
  const IconComponent = {
    MaterialCommunityIcons,
    Ionicons,
    FontAwesome5,
    Feather,
  }[type];

  return <IconComponent name={name} size={iconSize} color={color} style={style} />;
};

// Predefined icon sets for the app
export const AppIcons = {
  // Navigation
  home: { name: 'home', type: 'Ionicons' },
  profile: { name: 'person', type: 'Ionicons' },
  settings: { name: 'settings', type: 'Ionicons' },
  back: { name: 'arrow-back', type: 'Ionicons' },
  menu: { name: 'menu', type: 'Ionicons' },
  
  // Test Types
  eq: { name: 'brain', type: 'MaterialCommunityIcons' },
  iq: { name: 'lightbulb', type: 'Ionicons' },
  physical: { name: 'fitness', type: 'Ionicons' },
  quiz: { name: 'document-text', type: 'Ionicons' },
  
  // Actions
  add: { name: 'add-circle', type: 'Ionicons' },
  edit: { name: 'pencil', type: 'MaterialCommunityIcons' },
  delete: { name: 'trash', type: 'Ionicons' },
  save: { name: 'checkmark-circle', type: 'Ionicons' },
  cancel: { name: 'close-circle', type: 'Ionicons' },
  upload: { name: 'cloud-upload', type: 'Ionicons' },
  download: { name: 'cloud-download', type: 'Ionicons' },
  refresh: { name: 'refresh', type: 'Ionicons' },
  search: { name: 'search', type: 'Ionicons' },
  filter: { name: 'filter', type: 'Ionicons' },
  
  // Status
  success: { name: 'checkmark-circle', type: 'Ionicons' },
  error: { name: 'close-circle', type: 'Ionicons' },
  warning: { name: 'warning', type: 'Ionicons' },
  info: { name: 'information-circle', type: 'Ionicons' },
  
  // Content
  document: { name: 'document-text', type: 'Ionicons' },
  folder: { name: 'folder', type: 'Ionicons' },
  image: { name: 'image', type: 'Ionicons' },
  video: { name: 'videocam', type: 'Ionicons' },
  
  // Communication
  mail: { name: 'mail', type: 'Ionicons' },
  notification: { name: 'notifications', type: 'Ionicons' },
  chat: { name: 'chatbubbles', type: 'Ionicons' },
  
  // User
  user: { name: 'person', type: 'Ionicons' },
  users: { name: 'people', type: 'Ionicons' },
  student: { name: 'school', type: 'Ionicons' },
  teacher: { name: 'person-outline', type: 'Ionicons' },
  parent: { name: 'people-outline', type: 'Ionicons' },
  
  // Data & Analytics
  chart: { name: 'bar-chart', type: 'Ionicons' },
  chartPie: { name: 'pie-chart', type: 'Ionicons' },
  chartLine: { name: 'trending-up', type: 'Ionicons' },
  analytics: { name: 'analytics', type: 'Ionicons' },
  stats: { name: 'stats-chart', type: 'Ionicons' },
  
  // Education
  book: { name: 'book', type: 'Ionicons' },
  bookOpen: { name: 'book-open', type: 'Ionicons' },
  library: { name: 'library', type: 'Ionicons' },
  graduation: { name: 'school', type: 'Ionicons' },
  certificate: { name: 'ribbon', type: 'Ionicons' },
  
  // Time
  clock: { name: 'time', type: 'Ionicons' },
  calendar: { name: 'calendar', type: 'Ionicons' },
  timer: { name: 'timer', type: 'Ionicons' },
  
  // Misc
  star: { name: 'star', type: 'Ionicons' },
  starOutline: { name: 'star-outline', type: 'Ionicons' },
  heart: { name: 'heart', type: 'Ionicons' },
  heartOutline: { name: 'heart-outline', type: 'Ionicons' },
  lock: { name: 'lock-closed', type: 'Ionicons' },
  unlock: { name: 'lock-open', type: 'Ionicons' },
  eye: { name: 'eye', type: 'Ionicons' },
  eyeOff: { name: 'eye-off', type: 'Ionicons' },
  
  // Navigation arrows
  arrowRight: { name: 'arrow-forward', type: 'Ionicons' },
  arrowLeft: { name: 'arrow-back', type: 'Ionicons' },
  arrowUp: { name: 'arrow-up', type: 'Ionicons' },
  arrowDown: { name: 'arrow-down', type: 'Ionicons' },
  chevronRight: { name: 'chevron-forward', type: 'Ionicons' },
  chevronLeft: { name: 'chevron-back', type: 'Ionicons' },
  
  // Health & Fitness
  health: { name: 'fitness', type: 'Ionicons' },
  heart_rate: { name: 'heart', type: 'MaterialCommunityIcons' },
  weight: { name: 'scale-bathroom', type: 'MaterialCommunityIcons' },
  height: { name: 'human-male-height', type: 'MaterialCommunityIcons' },
  sleep: { name: 'bed', type: 'Ionicons' },
  
  // Activities
  activity: { name: 'activity', type: 'Feather' },
  target: { name: 'target', type: 'Feather' },
  award: { name: 'trophy', type: 'Ionicons' },
  
  // Excel/File
  excel: { name: 'file-excel', type: 'MaterialCommunityIcons' },
  file: { name: 'file-document', type: 'MaterialCommunityIcons' },
  
  // Empty states
  empty: { name: 'file-tray', type: 'Ionicons' },
  noData: { name: 'bar-chart-outline', type: 'Ionicons' },
};

// Helper function to get icon props
export const getIconProps = (iconKey) => {
  return AppIcons[iconKey] || AppIcons.info;
};
