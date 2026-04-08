import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS } from '@/constants/theme';

// ── Types ────────────────────────────────────────────────────────────────────

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SIZE = 22;

// ── Component ────────────────────────────────────────────────────────────────

export function Checkbox({ checked, onToggle }: CheckboxProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.box,
        checked ? styles.boxChecked : styles.boxUnchecked,
      ]}
    >
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
    borderWidth: 1.5,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: COLORS.crimson,
    backgroundColor: COLORS.crimson,
  },
  boxUnchecked: {
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  checkmark: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.label + 1,
    fontWeight: TYPOGRAPHY.bold,
  },
});
