import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X } from 'lucide-react-native';

export default function TimePicker({ visible, onClose, onConfirm, initialTime, theme }) {
  const [tempHour, setTempHour] = useState(initialTime?.getHours() || new Date().getHours());
  const [tempMinute, setTempMinute] = useState(initialTime?.getMinutes() || new Date().getMinutes());

  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const scrollToSelectedValues = () => {
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({
        y: tempHour * 48,
        animated: true
      });

      minuteScrollRef.current?.scrollTo({
        y: tempMinute * 48,
        animated: true
      });
    }, 100);
  };

  useEffect(() => {
    if (visible) {
      scrollToSelectedValues();
    }
  }, [visible, tempHour, tempMinute]);

  const handleConfirm = () => {
    const selectedTime = new Date();
    selectedTime.setHours(tempHour);
    selectedTime.setMinutes(tempMinute);
    onConfirm(selectedTime);
  };

  const handleCancel = () => {
    if (initialTime) {
      setTempHour(initialTime.getHours());
      setTempMinute(initialTime.getMinutes());
    } else {
      setTempHour(new Date().getHours());
      setTempMinute(new Date().getMinutes());
    }
    onClose();
  };

  const formatNumber = (num) => num.toString().padStart(2, '0');

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.timePickerModal, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Time</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={[styles.confirmButton, { color: theme.colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timePickerContent}>
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>Hour</Text>
              <ScrollView
                ref={hourScrollRef}
                style={[styles.picker, { backgroundColor: theme.colors.background }]}
                showsVerticalScrollIndicator={false}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.pickerItem, {
                      backgroundColor: tempHour === hour ? theme.colors.primary + '20' : 'transparent'
                    }]}
                    onPress={() => setTempHour(hour)}
                  >
                    <Text style={[styles.pickerItemText, {
                      color: tempHour === hour ? theme.colors.primary : theme.colors.text,
                      fontWeight: tempHour === hour ? '600' : '400'
                    }]}>
                      {formatNumber(hour)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={[styles.timeSeparator, { color: theme.colors.text }]}>:</Text>

            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, { color: theme.colors.text }]}>Minute</Text>
              <ScrollView
                ref={minuteScrollRef}
                style={[styles.picker, { backgroundColor: theme.colors.background }]}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[styles.pickerItem, {
                      backgroundColor: tempMinute === minute ? theme.colors.primary + '20' : 'transparent'
                    }]}
                    onPress={() => setTempMinute(minute)}
                  >
                    <Text style={[styles.pickerItemText, {
                      color: tempMinute === minute ? theme.colors.primary : theme.colors.text,
                      fontWeight: tempMinute === minute ? '600' : '400'
                    }]}>
                      {formatNumber(minute)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  timePickerModal: {
    borderRadius: 20,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  confirmButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSection: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  picker: {
    height: 200,
    width: '100%',
    borderRadius: 12,
    paddingVertical: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 8,
    height: 44,
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 16,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 32,
  },
});