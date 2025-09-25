import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import {
  // Fitness & Sports
  Dumbbell, Bike, Heart, Zap, Activity, Target, Timer, Flame,
  // Work & Study
  BookOpen, GraduationCap, Briefcase, Laptop, PenTool, Calculator, FileText, Monitor,
  // Food & Kitchen
  Coffee, Utensils, ChefHat, Apple,
  // Home & Chores
  Home, Shirt, Scissors, Hammer, Wrench,
  // Travel & Transport
  Car, Plane, Train, Bus, Ship, MapPin, Navigation, Compass,
  // Health & Wellness
  Stethoscope, Brain, Eye, Smile,
  // Entertainment & Hobbies
  Music, Headphones, Camera, Palette, Gamepad2, Guitar, Film,
  // Communication & Social
  Phone, MessageCircle, Users, Mail, Video, Mic,
  // Shopping & Finance
  ShoppingCart, CreditCard, DollarSign, TrendingUp,
  // Nature & Outdoors
  TreePine, Flower2, Sun, Moon, Star, Cloud, Leaf,
  // Time & Calendar
  Clock, Calendar, AlarmClock, Watch,
  // General Activities
  Play, Square, Circle, CheckCircle, AlertCircle, Info, Settings, Plus
} from 'lucide-react-native';

const ICON_CATEGORIES = {
  'Fitness & Sports': [
    { name: 'Dumbbell', icon: Dumbbell, key: 'dumbbell' },
    { name: 'Bike', icon: Bike, key: 'bike' },
    { name: 'Heart', icon: Heart, key: 'heart' },
    { name: 'Activity', icon: Activity, key: 'activity' },
    { name: 'Target', icon: Target, key: 'target' },
    { name: 'Flame', icon: Flame, key: 'flame' },
  ],
  'Work & Study': [
    { name: 'Book', icon: BookOpen, key: 'bookOpen' },
    { name: 'Graduation', icon: GraduationCap, key: 'graduationCap' },
    { name: 'Briefcase', icon: Briefcase, key: 'briefcase' },
    { name: 'Laptop', icon: Laptop, key: 'laptop' },
    { name: 'Pen', icon: PenTool, key: 'penTool' },
    { name: 'Calculator', icon: Calculator, key: 'calculator' },
    { name: 'File', icon: FileText, key: 'fileText' },
    { name: 'Monitor', icon: Monitor, key: 'monitor' },
  ],
  'Food & Kitchen': [
    { name: 'Coffee', icon: Coffee, key: 'coffee' },
    { name: 'Utensils', icon: Utensils, key: 'utensils' },
    { name: 'Chef Hat', icon: ChefHat, key: 'chefHat' },
    { name: 'Apple', icon: Apple, key: 'apple' },
  ],
  'Home & Chores': [
    { name: 'Home', icon: Home, key: 'home' },
    { name: 'Shirt', icon: Shirt, key: 'shirt' },
    { name: 'Scissors', icon: Scissors, key: 'scissors' },
    { name: 'Hammer', icon: Hammer, key: 'hammer' },
    { name: 'Wrench', icon: Wrench, key: 'wrench' },
  ],
  'Travel & Transport': [
    { name: 'Car', icon: Car, key: 'car' },
    { name: 'Plane', icon: Plane, key: 'plane' },
    { name: 'Train', icon: Train, key: 'train' },
    { name: 'Bus', icon: Bus, key: 'bus' },
    { name: 'Ship', icon: Ship, key: 'ship' },
    { name: 'Map Pin', icon: MapPin, key: 'mapPin' },
    { name: 'Navigation', icon: Navigation, key: 'navigation' },
    { name: 'Compass', icon: Compass, key: 'compass' },
  ],
  'Health & Wellness': [
    { name: 'Stethoscope', icon: Stethoscope, key: 'stethoscope' },
    { name: 'Brain', icon: Brain, key: 'brain' },
    { name: 'Eye', icon: Eye, key: 'eye' },
    { name: 'Smile', icon: Smile, key: 'smile' },
  ],
  'Entertainment': [
    { name: 'Music', icon: Music, key: 'music' },
    { name: 'Headphones', icon: Headphones, key: 'headphones' },
    { name: 'Camera', icon: Camera, key: 'camera' },
    { name: 'Palette', icon: Palette, key: 'palette' },
    { name: 'Gamepad', icon: Gamepad2, key: 'gamepad2' },
    { name: 'Guitar', icon: Guitar, key: 'guitar' },
    { name: 'Film', icon: Film, key: 'film' },
  ],
  'Communication': [
    { name: 'Phone', icon: Phone, key: 'phone' },
    { name: 'Message', icon: MessageCircle, key: 'messageCircle' },
    { name: 'Users', icon: Users, key: 'users' },
    { name: 'Mail', icon: Mail, key: 'mail' },
    { name: 'Video', icon: Video, key: 'video' },
    { name: 'Mic', icon: Mic, key: 'mic' },
  ],
  'Time & Planning': [
    { name: 'Clock', icon: Clock, key: 'clock' },
    { name: 'Calendar', icon: Calendar, key: 'calendar' },
    { name: 'Alarm', icon: AlarmClock, key: 'alarmClock' },
    { name: 'Watch', icon: Watch, key: 'watch' },
    { name: 'Timer', icon: Timer, key: 'timer' },
  ],
};

export default function IconPicker({ visible, onClose, onSelectIcon, selectedIcon, theme }) {
  const [selectedCategory, setSelectedCategory] = useState('Work & Study');

  const handleIconSelect = (iconKey, IconComponent) => {
    onSelectIcon(iconKey, IconComponent);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>

            {/* Close Button */}
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.colors.background }]}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Gap */}
            <View style={styles.gap} />

            {/* Category Selector */}
            <View style={styles.categorySection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {Object.keys(ICON_CATEGORIES).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: selectedCategory === category
                          ? theme.colors.primary
                          : theme.colors.background,
                        borderColor: selectedCategory === category
                          ? theme.colors.primary
                          : theme.colors.border,
                      }
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      {
                        color: selectedCategory === category
                          ? '#FFFFFF'
                          : theme.colors.text
                      }
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Gap */}
            <View style={styles.gap} />

            {/* Icons Grid */}
            <ScrollView style={styles.iconsScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.iconsGrid}>
                {(ICON_CATEGORIES[selectedCategory] || []).map((iconData) => {
                  const IconComponent = iconData.icon;
                  const isSelected = selectedIcon === iconData.key;

                  return (
                    <TouchableOpacity
                      key={iconData.key}
                      style={[
                        styles.iconButton,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary + '20'
                            : theme.colors.background,
                          borderColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.border
                        }
                      ]}
                      onPress={() => handleIconSelect(iconData.key, IconComponent)}
                    >
                      <IconComponent
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.text}
                      />
                      <Text style={[
                        styles.iconText,
                        {
                          color: isSelected ? theme.colors.primary : theme.colors.textSecondary
                        }
                      ]}>
                        {iconData.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  closeButtonContainer: {
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gap: {
    height: 24,
  },
  categorySection: {
    height: 60,
  },
  categoryScrollContent: {
    paddingHorizontal: 4,
    gap: 12,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconsScrollView: {
    flex: 1,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  iconButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  iconText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});