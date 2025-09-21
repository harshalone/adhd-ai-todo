import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Circle, Clock, AlertTriangle, Check, Edit3 } from 'lucide-react-native';
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

  // Format date from API response (date + start_time/due_time)
  const getDateTimeText = () => {
    if (item.date && item.start_time) {
      const dateTime = moment(`${item.date} ${item.start_time}`, 'YYYY-MM-DD HH:mm');
      return dateTime.format('MMM D, YYYY • h:mm A');
    } else if (item.due_date) {
      return moment(item.due_date).format('MMM D, YYYY • h:mm A');
    }
    return null;
  };

  const dateTimeText = getDateTimeText();

  return (
    <TouchableOpacity
      style={[
        styles.listItem,
        {
          backgroundColor: backgroundColor,
          opacity: opacity,
        }
      ]}
      onPress={() => onPress && onPress(item)}
    >
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

      <View style={[styles.todoContent, !showCheckbox && styles.todoContentNoCheckbox]}>
        <View style={styles.todoFirstRow}>
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
          <View style={styles.actionsContainer}>
            <Text
              style={[
                styles.priorityText,
                { color: getPriorityColor(item.priority || 0) }
              ]}
            >
              {getPriorityText(item.priority || 0)}
            </Text>
            {onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(item)}
                style={styles.editButton}
              >
                <Edit3 size={12} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {dateTimeText && (
          <Text style={[styles.todoDateTime, { color: theme.colors.textSecondary }]}>
            {dateTimeText}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkboxContainer: {
    marginRight: 10,
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
  todoContent: {
    flex: 1,
  },
  todoContentNoCheckbox: {
    marginLeft: 0,
  },
  todoFirstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  todoTitle: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    minWidth: 16,
    textAlign: 'center',
  },
  todoDateTime: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButton: {
    padding: 2,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});