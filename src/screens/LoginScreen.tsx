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
import {loginAlumno, StudentSession} from '../services/authService';

import {MC_COLORS, MC_FONTS} from '../theme/minecraft';
import {SkyBackground} from '../components/minecraft/SkyBackground';
import {PixelBlock} from '../components/minecraft/PixelBlock';
import {McButton} from '../components/minecraft/McButton';

interface Props {
  onLoginSuccess: (session: StudentSession) => void;
}

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
    <View style={styles.container}>
      <SkyBackground />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={styles.appName}>EduCraft</Text>
            <Text style={styles.tagline}>¡Aprende construyendo mundos!</Text>
          </View>

          <PixelBlock bg="#1E293B" light="#334155" shadow="#0F172A" style={styles.card}>
            <Text style={styles.cardTitle}>BIENVENIDO JUGADOR</Text>

            <Text style={styles.label}>USUARIO</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Ingresa tu ID"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            <Text style={styles.label}>CONTRASEÑA</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="********"
                placeholderTextColor="#64748B"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
            </View>

            <McButton variant="green" onPress={handleLogin} loading={loading} fullWidth>
              ENTRAR AL MUNDO
            </McButton>
          </PixelBlock>

          <Text style={styles.note}>
            Si olvidaste tu usuario, pídele ayuda a tu tutor.
          </Text>
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
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 24,
    color: MC_COLORS.textYellow,
    textShadowColor: MC_COLORS.borderWoodLight,
    textShadowOffset: {width: 3, height: 3},
    textShadowRadius: 0,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: MC_FONTS.mono,
    fontSize: 20,
    color: MC_COLORS.textGreen,
    textShadowColor: '#000',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 0,
  },
  card: {
    padding: 24,
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 10,
    color: MC_COLORS.textWhite,
    marginBottom: 24,
  },
  label: {
    fontFamily: MC_FONTS.pixel,
    fontSize: 8,
    color: MC_COLORS.textMuted,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MC_COLORS.bgDark,
    borderWidth: 2,
    borderColor: MC_COLORS.borderStoneLight,
    marginBottom: 20,
    paddingHorizontal: 12,
    width: '100%',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: MC_COLORS.textWhite,
    fontFamily: MC_FONTS.mono,
    fontSize: 20,
    paddingVertical: 12,
  },
  note: {
    marginTop: 24,
    fontFamily: MC_FONTS.mono,
    fontSize: 16,
    color: MC_COLORS.textGreen,
    textAlign: 'center',
  },
});
