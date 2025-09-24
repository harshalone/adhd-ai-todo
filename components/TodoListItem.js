import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Circle, Clock, AlertTriangle, Check, Edit3, Bell } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import moment from 'moment';

export default function TodoListItem({ item, onPress, onToggleComplete, onEdit, showCheckbox = true }) {
  const { theme } = useTheme();

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 2:
        return <AlertTriangle size={16} color="#FF6B6B" />;
      case 1:
        return <Clock size={16} color="#FFB84D" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 2:
        return '#FF6B6B'; // High priority - red
      case 1:
        return '#FFB84D'; // Medium priority - orange
      default:
        return theme.colors.textSecondary; // Low priority - default
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 2:
        return 'H';
      case 1:
        return 'M';
      default:
        return 'L';
    }
  };

  const backgroundColor = theme.colors.surface;
  const opacity = item.completed ? 0.6 : 1;

  // Format date and time from new database schema
  const getDateTimeText = () => {
    // Check for start_date and start_time combination first
    if (item.start_date && item.start_time) {
      const dateTime = moment(`${item.start_date} ${item.start_time}`, 'YYYY-MM-DD HH:mm');
      return dateTime.format('MMM D, YYYY • h:mm A');
    }
    // Fall back to due_date and start_time if available
    else if (item.due_date && item.start_time) {
      const dateTime = moment(`${item.due_date} ${item.start_time}`, 'YYYY-MM-DD HH:mm');
      return dateTime.format('MMM D, YYYY • h:mm A');
    }
    // Fall back to just due_date if no time is available
    else if (item.due_date) {
      return moment(item.due_date, 'YYYY-MM-DD').format('MMM D, YYYY');
    }
    // Fall back to just start_date if no time is available
    else if (item.start_date) {
      return moment(item.start_date, 'YYYY-MM-DD').format('MMM D, YYYY');
    }
    return null;
  };

  const dateTimeText = getDateTimeText();

  return (
    <View
      style={[
        styles.listItem,
        {
          backgroundColor: backgroundColor,
          opacity: opacity,
        }
      ]}
    >
      <View style={styles.leftSection}>
        {showCheckbox && (
          <TouchableOpacity
            onPress={() => onToggleComplete && onToggleComplete(item)}
            style={styles.checkboxContainer}
          >
            {item.completed ? (
              <View style={[styles.completedCircle, { backgroundColor: '#22C55E' }]}>
                <Check size={14} color="#fff" strokeWidth={3} />
              </View>
            ) : (
              <Circle size={20} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}

        {showCheckbox && (
          <View style={styles.priorityContainer}>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(item.priority || 0) }
              ]}
            >
              <Text
                style={styles.priorityText}
              >
                {getPriorityText(item.priority || 0)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.todoToggleArea, !showCheckbox && styles.todoContentNoCheckbox]}
        onPress={() => onToggleComplete && onToggleComplete(item)}
      >
        <Text
          style={[
            styles.todoTitle,
            {
              color: theme.colors.text,
              textDecorationLine: item.completed ? 'line-through' : 'none'
            }
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        {dateTimeText && (
          <Text style={[styles.todoDateTime, { color: theme.colors.textSecondary }]}>
            {dateTimeText}
          </Text>
        )}
      </TouchableOpacity>

      {onEdit && (
        <TouchableOpacity
          onPress={() => onEdit(item)}
          style={styles.editArea}
        >
          <View style={[styles.iconButton, { backgroundColor: theme.colors.primary }]}>
            <Edit3 size={10} color="#fff" />
          </View>
          <View style={[styles.iconButton, { backgroundColor: item.alert_minutes ? '#FF6B6B' : '#9CA3AF' }]}>
            <Bell
              size={10}
              color="#fff"
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 56,
    maxHeight: 80,
  },
  leftSection: {
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxContainer: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  completedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  priorityBadge: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoToggleArea: {
    flex: 2,
    paddingTop: 2,
    paddingRight: 8,
  },
  todoContentNoCheckbox: {
    marginLeft: 0,
  },
  editArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 8,
    paddingRight: 4,
  },
  iconButton: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  todoTitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 18,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  todoDateTime: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },
});