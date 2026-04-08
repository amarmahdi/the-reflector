import { StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';

import { COLORS } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NOT FOUND' }} />
      <View style={styles.container}>
        <Text style={styles.title}>ROUTE NOT FOUND</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>RETURN TO THE WALL</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    padding: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  linkText: {
    color: COLORS.crimson,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
