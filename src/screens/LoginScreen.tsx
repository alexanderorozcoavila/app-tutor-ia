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
  ScrollView,
} from 'react-native';
import {loginAlumno, StudentSession} from '../services/authService';

interface Props {
  onLoginSuccess: (session: StudentSession) => void;
}

/**
 * Pantalla de Login del alumno.
 * Autentica contra la tabla `users` del sistema propio (no Supabase Auth).
 * Se muestra cada vez que no hay sesión activa guardada en Keychain.
 */
export const LoginScreen: React.FC<Props> = ({onLoginSuccess}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const session = await loginAlumno(username, password);
      if (session) {
        onLoginSuccess(session);
      } else {
        Alert.alert(
          'Acceso denegado',
          'Usuario o contraseña incorrectos.\nAsegúrate de ingresar tu usuario de alumno.',
          [{text: 'Intentar de nuevo'}],
        );
      }
    } catch (error) {
      Alert.alert(
        'Error de conexión',
        'No se pudo conectar al servidor. Verifica tu conexión a internet.',
      );
      console.error('[LoginScreen] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">

        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎓</Text>
          <Text style={styles.appName}>Tutor IA</Text>
          <Text style={styles.tagline}>Tu asistente de aprendizaje</Text>
        </View>

        {/* Tarjeta de login */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¡Hola! Ingresa para continuar</Text>
          <Text style={styles.cardSubtitle}>
            Usa el usuario que te dio tu tutor
          </Text>

          {/* Campo Usuario */}
          <Text style={styles.label}>Usuario</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Tu nombre de usuario"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!loading}
            />
          </View>

          {/* Campo Contraseña */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              placeholderTextColor="#64748B"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!loading}
            />
          </View>

          {/* Botón de ingreso */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>📚  Ingresar al Estudio</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Nota informativa */}
        <Text style={styles.note}>
          ¿No recuerdas tu usuario? Pídele ayuda a tu tutor o familiar.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    fontSize: 72,
    marginBottom: 8,
  },
  appName: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: '#3B82F6',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 16,
    paddingVertical: 14,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#1D4ED8',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  note: {
    textAlign: 'center',
    fontSize: 13,
    color: '#475569',
    marginTop: 24,
    lineHeight: 20,
  },
});
