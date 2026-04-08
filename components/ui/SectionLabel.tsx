import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import styled from 'styled-components/native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';

// ── SectionLabel (styled export) ─────────────────────────────────────────────

/** Uppercase section divider label — used across all screens */
export const SectionLabel = styled.Text`
  color: ${COLORS.textDim};
  font-size: ${TYPOGRAPHY.label}px;
  font-weight: ${TYPOGRAPHY.semibold};
  letter-spacing: ${TYPOGRAPHY.widest}px;
  text-transform: uppercase;
  padding: 0 ${SPACING.xl}px;
  margin-bottom: ${SPACING.md}px;
`;

// ── SectionHeader (label + line divider) ─────────────────────────────────────

interface SectionHeaderProps {
  label: string;
}

export function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.headerText}>{label}</Text>
      <View style={styles.headerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  headerText: {
    color: COLORS.textDim,
    fontSize: TYPOGRAPHY.label,
    fontWeight: TYPOGRAPHY.semibold,
    letterSpacing: TYPOGRAPHY.widest,
    textTransform: 'uppercase',
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
});
