import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {saveEscapePin} from '../services/pinService';

import {MC_COLORS, MC_FONTS} from '../theme/minecraft';
import {PixelBlock} from '../components/minecraft/PixelBlock';
import {McButton} from '../components/minecraft/McButton';

interface Props {
  onSetupComplete: () => void;
}

export const FirstLaunchSetupScreen: React.FC<Props> = ({onSetupComplete}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSavePin = async () => {
    if (pin.length < 4 || pin.length > 6) {
      Alert.alert('PIN inválido', 'El PIN debe tener entre 4 y 6 dígitos.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Error', 'Los PINs no coinciden. Inténtalo de nuevo.');
      return;
    }

    setLoading(true);
    try {
      await saveEscapePin(pin);
      onSetupComplete();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el PIN. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          
          <PixelBlock bg="#1E293B" light="#334155" shadow="#0F172A" style={styles.card}>
            <Text style={styles.emoji}>🔐</Text>
            <Text style={styles.title}>CONFIGURACIÓN INICIAL</Text>
            <Text style={styles.subtitle}>
              Define el PIN de administrador para poder salir del modo EduCraft de ser necesario.
            </Text>

            <Text style={styles.label}>NUEVO PIN (4-6 DÍGITOS)</Text>
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              placeholder="••••••"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.label}>CONFIRMAR PIN</Text>
            <TextInput
              style={styles.input}
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={6}
              placeholder="••••••"
              placeholderTextColor="#64748B"
            />

            <View style={{height: 10}} />

            <McButton variant="green" onPress={handleSavePin} loading={loading} fullWidth>
              EL PIN ESTÁ SEGURO
            </McButton>
          </PixelBlock>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MC_COLORS.bgDark,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    padding: 28,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 12,
    color: MC_COLORS.textWhite,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  subtitle: {
    fontFamily: MC_FONTS.mono,
    fontSize: 18,
    color: MC_COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 8,
    color: MC_COLORS.textWhite,
    marginBottom: 8,
  },
  input: {
    backgroundColor: MC_COLORS.bgDark,
    color: MC_COLORS.textWhite,
    borderRadius: 0,
    padding: 14,
    fontFamily: MC_FONTS.pixel,
    fontSize: 16,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: MC_COLORS.borderStoneLight,
  },
});
