import React, { useState } from 'react';
import {
  TextInputProps,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

interface CustomTextInputProps extends TextInputProps {
  icon?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  type?: 'email' | 'password' | 'username' | 'number' | 'phone';
  errorMessage?: string;
  label?: string;
  isValid?: boolean;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  type,
  errorMessage,
  label,
  isValid = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handlePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  const hasError = !!errorMessage;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          isValid && !hasError && styles.inputValid,
          hasError && styles.inputError,
        ]}
      >
        {icon && (
          <Feather
            name={icon as any}
            size={18}
            color={hasError ? Theme.colors.danger : isFocused ? Theme.colors.magenta : Theme.colors.inkFaint}
            style={styles.icon}
          />
        )}
        <TextInput
          {...props}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {type === 'password' && (
          <TouchableOpacity
            onPress={handlePasswordVisibility}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.actionIcon}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={Theme.colors.inkFaint}
            />
          </TouchableOpacity>
        )}
        {isValid && !hasError && type !== 'password' && (
          <View style={styles.actionIcon}>
            <Feather name="check" size={18} color={Theme.colors.success} />
          </View>
        )}
      </View>
      {hasError && <Text style={styles.errorMessage}>{errorMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12.5,
    fontFamily: Theme.typography.heading,
    color: Theme.colors.inkSoft,
    marginBottom: 7,
    letterSpacing: -0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1.5,
    borderColor: Theme.colors.inputBorder,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 16,
    height: 52,
    width: '100%',
  },
  inputFocused: {
    borderColor: Theme.colors.magenta,
    backgroundColor: Theme.colors.surface,
  },
  inputValid: {
    borderColor: Theme.colors.success,
  },
  inputError: {
    borderColor: Theme.colors.danger,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Theme.colors.ink,
    fontFamily: Theme.typography.body,
    height: '100%',
  },
  actionIcon: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    color: Theme.colors.danger,
    fontSize: 12,
    marginTop: 4,
    fontFamily: Theme.typography.body,
    paddingHorizontal: 2,
  },
});

export default CustomTextInput;
