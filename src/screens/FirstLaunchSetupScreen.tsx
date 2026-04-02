import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {saveEscapePin} from '../services/pinService';

interface Props {
  onSetupComplete: () => void;
}

/**
 * Pantalla que se muestra UNA SOLA VEZ al instalar la app.
 * El administrador define el PIN de escape de 4-6 dígitos.
 * Una vez guardado, no vuelve a aparecer nunca.
 */
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>Configuración Inicial</Text>
        <Text style={styles.subtitle}>
          Define el PIN de emergencia para que los administradores puedan
          desactivar el modo estudio cuando sea necesario.
        </Text>

        <Text style={styles.label}>PIN de Escape (4-6 dígitos)</Text>
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

        <Text style={styles.label}>Confirmar PIN</Text>
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

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSavePin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Guardar y Continuar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 28,
  },
  emoji: {fontSize: 48, textAlign: 'center', marginBottom: 16},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    fontSize: 20,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {backgroundColor: '#1D4ED8'},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
});
