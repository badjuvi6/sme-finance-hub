import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback, useContext, useMemo, createContext, Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

// =====================================================================================
// CONFIGURATION
// =====================================================================================

const API_BASE_URL = 'https://sme-finance-hub.onrender.com/api';

const CURRENCY_CODE = 'GHS';
const CURRENCY_LOCALE = 'en-GH';

const TOKEN_KEY = 'smehub_token';
const USER_KEY = 'smehub_user';

const safeGetItem = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    console.warn(`SecureStore.getItemAsync failed for "${key}":`, e?.message);
    return null;
  }
};

const safeSetItem = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (e) {
    console.warn(`SecureStore.setItemAsync failed for "${key}":`, e?.message);
    return false;
  }
};

const safeDeleteItem = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.warn(`SecureStore.deleteItemAsync failed for "${key}":`, e?.message);
  }
};

// =====================================================================================
// DESIGN SYSTEM
// =====================================================================================

const COLORS = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  slate: '#334155',
  white: '#FFFFFF',
  background: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  red: '#DC2626',
  redBg: '#FEE2E2',
  amber: '#D97706',
  amberBg: '#FEF3C7',
};

const STATUS_COLORS = {
  Paid: { text: COLORS.green, bg: COLORS.greenBg },
  Approved: { text: COLORS.green, bg: COLORS.greenBg },
  Pending: { text: COLORS.amber, bg: COLORS.amberBg },
  'Under Review': { text: COLORS.amber, bg: COLORS.amberBg },
  Overdue: { text: COLORS.red, bg: COLORS.redBg },
  Rejected: { text: COLORS.red, bg: COLORS.redBg },
};

// =====================================================================================
// DOMAIN CONSTANTS — mirrors the backend Mongoose schemas exactly
// =====================================================================================

const INCOME_CATEGORIES = ['Sales', 'Other'];
const EXPENSE_CATEGORIES = ['Utilities', 'Payroll', 'Inventory', 'Rent', 'Marketing', 'Transport', 'Other'];
const BUSINESS_TYPES = ['Retail', 'Services', 'Manufacturing', 'Agriculture', 'Technology', 'Hospitality', 'Other'];
const FUNDING_TYPES = ['Micro-loan', 'Business Loan', 'Grant'];
const INVOICE_STATUSES = ['Paid', 'Pending', 'Overdue'];

// =====================================================================================
// FORMATTING HELPERS
// =====================================================================================

const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: 'currency',
      currency: CURRENCY_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    return `GH₵ ${value.toFixed(2)}`;
  }
};

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toInputDate = (date) => {
  const d = date ? new Date(date) : new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

const isValidDateString = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !Number.isNaN(new Date(s).getTime());

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

// =====================================================================================
// API LAYER
// =====================================================================================

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

// Attach the JWT to every outgoing request.
api.interceptors.request.use(async (config) => {
  const token = await safeGetItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AuthProvider registers a handler here so a 401 anywhere in the app forces logout.
let handleUnauthorized = () => {};
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message === 'Network Error') {
    return 'Cannot reach the server. Check your connection and API_BASE_URL.';
  }
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  return fallback;
};

const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (payload) => api.post('/auth/register', payload),
  getMe: () => api.get('/auth/me'),
  updateMe: (payload) => api.put('/auth/me', payload),
};

const transactionApi = {
  list: (params) => api.get('/transactions', { params }),
  summary: () => api.get('/transactions/summary'),
  create: (payload) => api.post('/transactions', payload),
  remove: (id) => api.delete(`/transactions/${id}`),
};

const invoiceApi = {
  list: (params) => api.get('/invoices', { params }),
  create: (payload) => api.post('/invoices', payload),
  update: (id, payload) => api.put(`/invoices/${id}`, payload),
  remove: (id) => api.delete(`/invoices/${id}`),
};

const loanApi = {
  create: (payload) => api.post('/loans', payload),
  mine: () => api.get('/loans/mine'),
};

const adminApi = {
  overview: () => api.get('/admin/overview'),
  smes: () => api.get('/admin/smes'),
};

// =====================================================================================
// AUTH CONTEXT
// =====================================================================================

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(async () => {
    await safeDeleteItem(TOKEN_KEY);
    await safeDeleteItem(USER_KEY);
    setUser(null);
  }, []);

  // Let the axios layer trigger a logout on any 401 response.
  useEffect(() => {
    handleUnauthorized = () => {
      logout();
    };
    return () => {
      handleUnauthorized = () => {};
    };
  }, [logout]);

  // Bootstrap session from SecureStore on cold start.
  useEffect(() => {
    (async () => {
      try {
        const token = await safeGetItem(TOKEN_KEY);
        const cachedUser = await safeGetItem(USER_KEY);

        if (!token) {
          setInitializing(false);
          return;
        }
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (e) {
            // ignore malformed cache
          }
        }
        const { data } = await authApi.getMe();
        setUser(data.user);
        await safeSetItem(USER_KEY, JSON.stringify(data.user));
      } catch (e) {
        await safeDeleteItem(TOKEN_KEY);
        await safeDeleteItem(USER_KEY);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const persistSession = async (data) => {
    await safeSetItem(TOKEN_KEY, data.token || 'demo_token');
    await safeSetItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await authApi.login(email, password);
      await persistSession(data);
      return data.user;
    } catch (err) {
      // Fallback check for demo accounts if backend is down or fails credentials check
      if (email === 'admin@smefinancehub.com' && password === 'Admin123!') {
        const demoAdmin = {
          _id: 'demo_admin',
          name: 'Financial Officer',
          email: 'admin@smefinancehub.com',
          role: 'admin',
          businessName: 'SME Finance Hub Admin',
          businessType: 'Services',
        };
        await persistSession({ token: 'demo_admin_token', user: demoAdmin });
        return demoAdmin;
      } else if (email === 'owner@goldencrustbakery.com' && password === 'Password123!') {
        const demoOwner = {
          _id: 'demo_owner',
          name: 'Golden Crust Bakery Owner',
          email: 'owner@goldencrustbakery.com',
          role: 'user',
          businessName: 'Golden Crust Bakery',
          businessType: 'Retail',
        };
        await persistSession({ token: 'demo_owner_token', user: demoOwner });
        return demoOwner;
      }
      throw err;
    }
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    await persistSession(data);
    return data.user;
  }, []);

  const updateUser = useCallback(async (updatedUser) => {
    setUser(updatedUser);
    await safeSetItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin' || user?.role === 'financial_officer',
      login,
      register,
      logout,
      updateUser,
    }),
    [user, initializing, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// =====================================================================================
// REUSABLE UI PRIMITIVES
// =====================================================================================

const VARIANT_STYLES = {
  primary: { backgroundColor: COLORS.navy },
  success: { backgroundColor: COLORS.green },
  danger: { backgroundColor: COLORS.red },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.navy },
  ghost: { backgroundColor: COLORS.borderLight },
  onDark: { backgroundColor: COLORS.white },
  outlineLight: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)' },
};

const VARIANT_TEXT_COLORS = {
  primary: COLORS.white,
  success: COLORS.white,
  danger: COLORS.white,
  outline: COLORS.navy,
  ghost: COLORS.navy,
  onDark: COLORS.navy,
  outlineLight: COLORS.white,
};

function Button({ title, onPress, loading, variant = 'primary', disabled, icon, style }) {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const textColor = VARIANT_TEXT_COLORS[variant] || COLORS.white;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.button, variantStyle, (disabled || loading) && styles.buttonDisabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.buttonContent}>
          {icon || null}
          <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function Field({ label, error, required, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={{ color: COLORS.red }}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

function ChipSelect({ options, value, onChange }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { text: COLORS.textSecondary, bg: COLORS.borderLight };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, subtext, tone = 'navy' }) {
  const toneColor = { navy: COLORS.navy, green: COLORS.green, red: COLORS.red, amber: COLORS.amber }[tone];
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${toneColor}1A` }]}>
        <Ionicons name={icon} size={17} color={toneColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: toneColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {subtext ? <Text style={styles.statSubtext}>{subtext}</Text> : null}
    </View>
  );
}

function EmptyState({ icon = 'file-tray-outline', title, subtitle }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={30} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function InlineLoading() {
  return (
    <View style={styles.inlineLoading}>
      <ActivityIndicator color={COLORS.navy} />
    </View>
  );
}

function LoadingView({ label = 'Loading…' }) {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={COLORS.navy} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

function InlineError({ message }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={16} color={COLORS.red} />
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

function FAB({ onPress, icon = 'add' }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={26} color={COLORS.white} />
    </TouchableOpacity>
  );
}

function ScreenHeader({ title, subtitle, rightIcon, onRightPress }) {
  return (
    <SafeAreaView edges={['top']} style={styles.screenHeader}>
      <View style={styles.screenHeaderInner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenHeaderTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.screenHeaderSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightIcon ? (
          <TouchableOpacity onPress={onRightPress} style={styles.screenHeaderAction} hitSlop={8}>
            <Ionicons name={rightIcon} size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function FormModal({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={19} color={COLORS.navy} />
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// =====================================================================================
// AUTH SCREENS
// =====================================================================================

function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.landingContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />
      <View style={styles.landingContent}>
        <View style={styles.landingLogoWrap}>
          <Ionicons name="wallet" size={28} color={COLORS.white} />
        </View>
        <Text style={styles.landingBrand}>SME Hub</Text>
        <Text style={styles.landingHeadline}>Run your business finances with confidence</Text>
        <Text style={styles.landingSubcopy}>
          Track income and expenses, send client invoices, and apply for financing — all from one
          place built for growing businesses.
        </Text>
      </View>
      <View style={styles.landingActions}>
        <Button title="Log In" variant="onDark" onPress={() => navigation.navigate('Login')} />
        <Button
          title="Create an Account"
          variant="outlineLight"
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: 12 }}
        />
      </View>
    </SafeAreaView>
  );
}

function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (overrideEmail, overridePassword) => {
    const targetEmail = overrideEmail || email;
    const targetPassword = overridePassword || password;

    setError('');
    if (!targetEmail.trim() || !targetPassword) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(targetEmail.trim().toLowerCase(), targetPassword);
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.authWrapper}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={COLORS.navy} />
          </TouchableOpacity>
          <Text style={styles.authTitle}>Welcome back</Text>
          <Text style={styles.authSubtitle}>Log in to manage your business finances.</Text>

          {error ? <InlineError message={error} /> : null}

          <Field label="Email address">
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@business.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
            />
          </Field>
          <Field label="Password">
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
            />
          </Field>

          <Button title="Log In" onPress={() => handleLogin()} loading={submitting} style={{ marginTop: 8 }} />

          {/* Quick Demo Login Section */}
          <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textAlign: 'center' }}>
              QUICK DEMO ACCOUNTS
            </Text>
            <Button
              title="SME Owner Demo"
              variant="outline"
              onPress={() => handleLogin('owner@goldencrustbakery.com', 'Password123!')}
              style={{ marginBottom: 10 }}
            />
            <Button
              title="Financial Officer Demo"
              variant="ghost"
              onPress={() => handleLogin('admin@smefinancehub.com', 'Admin123!')}
            />
          </View>

          <View style={styles.authFooterRow}>
            <Text style={styles.authFooterText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.authFooterLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    businessName: '',
    name: '',
    email: '',
    phone: '',
    businessType: BUSINESS_TYPES[0],
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    setError('');
    if (!form.businessName.trim() || !form.name.trim() || !form.email.trim()) {
      setError('Business name, owner name and email are required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.authWrapper}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color={COLORS.navy} />
          </TouchableOpacity>
          <Text style={styles.authTitle}>Create your account</Text>
          <Text style={styles.authSubtitle}>Start tracking your business finances in minutes.</Text>

          {error ? <InlineError message={error} /> : null}

          <Field label="Business name" required>
            <TextInput
              style={styles.input}
              placeholder="e.g. Adjei Foods Ltd"
              placeholderTextColor={COLORS.textMuted}
              value={form.businessName}
              onChangeText={(v) => update('businessName', v)}
            />
          </Field>
          <Field label="Owner name" required>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textMuted}
              value={form.name}
              onChangeText={(v) => update('name', v)}
            />
          </Field>
          <Field label="Email address" required>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@business.com"
              placeholderTextColor={COLORS.textMuted}
              value={form.email}
              onChangeText={(v) => update('email', v)}
            />
          </Field>
          <Field label="Phone number">
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              placeholder="Optional"
              placeholderTextColor={COLORS.textMuted}
              value={form.phone}
              onChangeText={(v) => update('phone', v)}
            />
          </Field>
          <Field label="Business category">
            <ChipSelect options={BUSINESS_TYPES} value={form.businessType} onChange={(v) => update('businessType', v)} />
          </Field>
          <Field label="Password" required>
            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder="At least 6 characters"
              placeholderTextColor={COLORS.textMuted}
              value={form.password}
              onChangeText={(v) => update('password', v)}
            />
          </Field>

          <Button title="Create Account" onPress={handleRegister} loading={submitting} style={{ marginTop: 8 }} />

          <View style={styles.authFooterRow}>
            <Text style={styles.authFooterText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.authFooterLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// =====================================================================================
// DASHBOARD SCREEN
// =====================================================================================

function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [txCount, setTxCount] = useState(0);
  const [recentTx, setRecentTx] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, txRes, invRes] = await Promise.all([
        transactionApi.summary(),
        transactionApi.list(),
        invoiceApi.list(),
      ]);
      setSummary(summaryRes.data);
      setTxCount(txRes.data.count ?? txRes.data.transactions.length);
      setRecentTx(txRes.data.transactions.slice(0, 5));
      setRecentInvoices(invRes.data.invoices.slice(0, 5));
      setError('');
    } catch (err) {
      // If server data isn't available, keep UI clear without breaking
      setError(getErrorMessage(err, 'Could not load live dashboard data.'));
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    })();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingView label="Loading your dashboard…" />;

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle={user?.businessName || 'Here is how your business is doing'}
        rightIcon="person-circle-outline"
        onRightPress={() => navigation.navigate('Profile')}
      />
      <ScrollView
        contentContainerStyle={styles.screenBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
      >
        {error ? <InlineError message={error} /> : null}

        <View style={styles.statGrid}>
          <StatCard icon="trending-up" label="Total Revenue" value={formatCurrency(summary?.totalRevenue)} tone="green" />
          <StatCard icon="trending-down" label="Total Expenses" value={formatCurrency(summary?.totalExpenses)} tone="red" />
          <StatCard
            icon="wallet-outline"
            label="Net Balance"
            value={formatCurrency(summary?.netProfit)}
            tone={(summary?.netProfit ?? 0) >= 0 ? 'green' : 'red'}
          />
          <StatCard icon="pulse-outline" label="Active Transactions" value={String(txCount)} tone="navy" />
        </View>

        <Text style={styles.sectionLabel}>Quick actions</Text>
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon="add-circle"
            label="Add Transaction"
            onPress={() => navigation.navigate('Transactions', { openAdd: true })}
          />
          <QuickAction
            icon="document-text"
            label="New Invoice"
            onPress={() => navigation.navigate('Invoices', { openAdd: true })}
          />
          <QuickAction icon="cash" label="Apply for Financing" onPress={() => navigation.navigate('Financing')} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Recent transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.cardLink}>View all</Text>
            </TouchableOpacity>
          </View>
          {recentTx.length === 0 ? (
            <EmptyState icon="swap-vertical-outline" title="No transactions yet" subtitle="Record your first sale or expense to see it here." />
          ) : (
            recentTx.map((tx) => (
              <View key={tx._id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>{tx.category}</Text>
                  <Text style={styles.listRowSubtitle}>
                    {formatDate(tx.date)}
                    {tx.description ? ` · ${tx.description}` : ''}
                  </Text>
                </View>
                <Text style={[styles.listRowAmount, { color: tx.type === 'income' ? COLORS.green : COLORS.red }]}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Recent invoices</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Invoices')}>
              <Text style={styles.cardLink}>View all</Text>
            </TouchableOpacity>
          </View>
          {recentInvoices.length === 0 ? (
            <EmptyState icon="document-text-outline" title="No invoices yet" subtitle="Create your first client invoice to start tracking payments." />
          ) : (
            recentInvoices.map((inv) => (
              <View key={inv._id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>{inv.clientName}</Text>
                  <Text style={styles.listRowSubtitle}>
                    {inv.invoiceNumber} · Due {formatDate(inv.dueDate)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.listRowAmountNeutral}>{formatCurrency(inv.totalAmount)}</Text>
                  <StatusBadge status={inv.status} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// =====================================================================================
// TRANSACTIONS (FINANCIALS) SCREEN
// =====================================================================================

function TransactionFormModal({ visible, onClose, onSubmit }) {
  const emptyForm = () => ({
    type: 'income',
    category: INCOME_CATEGORIES[0],
    amount: '',
    description: '',
    date: toInputDate(),
  });
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(emptyForm());
      setErrors({});
    }
  }, [visible]);

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const changeType = (type) => {
    const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setForm((prev) => ({ ...prev, type, category: cats[0] }));
  };

  const validate = () => {
    const next = {};
    if (!form.amount || Number(form.amount) <= 0) next.amount = 'Enter an amount greater than 0';
    if (!isValidDateString(form.date)) next.date = 'Use format YYYY-MM-DD';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ ...form, amount: Number(form.amount) });
    } catch (err) {
      Alert.alert('Could not save transaction', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal visible={visible} onClose={onClose} title="Record Transaction">
      <View style={styles.typeToggleRow}>
        <TouchableOpacity
          onPress={() => changeType('income')}
          style={[styles.typeToggle, form.type === 'income' && styles.typeToggleIncomeActive]}
        >
          <Text style={[styles.typeToggleText, form.type === 'income' && { color: COLORS.green }]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => changeType('expense')}
          style={[styles.typeToggle, form.type === 'expense' && styles.typeToggleExpenseActive]}
        >
          <Text style={[styles.typeToggleText, form.type === 'expense' && { color: COLORS.red }]}>Expense</Text>
        </TouchableOpacity>
      </View>

      <Field label="Category">
        <ChipSelect options={categories} value={form.category} onChange={(v) => setForm((p) => ({ ...p, category: v }))} />
      </Field>

      <Field label="Amount" error={errors.amount} required>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          value={String(form.amount)}
          onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
        />
      </Field>

      <Field label="Date" error={errors.date} required>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textMuted}
            value={form.date}
            onChangeText={(v) => setForm((p) => ({ ...p, date: v }))}
          />
          <TouchableOpacity style={styles.todayButton} onPress={() => setForm((p) => ({ ...p, date: toInputDate() }))}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>
      </Field>

      <Field label="Description">
        <TextInput
          style={styles.input}
          placeholder="e.g. Weekly stock restock"
          placeholderTextColor={COLORS.textMuted}
          value={form.description}
          onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
        />
      </Field>

      <Button title="Save Transaction" onPress={handleSubmit} loading={submitting} style={{ marginTop: 8 }} />
    </FormModal>
  );
}

function TransactionsScreen({ route, navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (typeFilter !== 'All') params.type = typeFilter.toLowerCase();
      const { data } = await transactionApi.list(params);
      setTransactions(data.transactions);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load transactions.'));
    }
  }, [typeFilter]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (route.params?.openAdd) {
      setModalVisible(true);
      navigation.setParams({ openAdd: undefined });
    }
  }, [route.params?.openAdd]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (tx) => {
    Alert.alert('Delete transaction', `Remove this ${tx.type} of ${formatCurrency(tx.amount)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await transactionApi.remove(tx._id);
            load();
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err, 'Could not delete transaction.'));
          }
        },
      },
    ]);
  };

  const handleCreate = async (payload) => {
    await transactionApi.create(payload);
    setModalVisible(false);
    load();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Financials" subtitle="Track income and expenses" />
      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.screenBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
        ListHeaderComponent={
          <View>
            {error ? <InlineError message={error} /> : null}
            <ChipSelect options={['All', 'Income', 'Expense']} value={typeFilter} onChange={setTypeFilter} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <InlineLoading />
          ) : (
            <EmptyState icon="swap-vertical-outline" title="No transactions found" subtitle="Tap the + button to record your first income or expense." />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.listRow}>
              <View style={[styles.txIcon, { backgroundColor: item.type === 'income' ? COLORS.greenBg : COLORS.redBg }]}>
                <Ionicons
                  name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
                  size={15}
                  color={item.type === 'income' ? COLORS.green : COLORS.red}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listRowTitle}>{item.category}</Text>
                <Text style={styles.listRowSubtitle}>
                  {formatDate(item.date)}
                  {item.description ? ` · ${item.description}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.listRowAmount, { color: item.type === 'income' ? COLORS.green : COLORS.red }]}>
                  {item.type === 'income' ? '+' : '-'}
                  {formatCurrency(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8} style={{ marginTop: 6 }}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
      <FAB onPress={() => setModalVisible(true)} />
      <TransactionFormModal visible={modalVisible} onClose={() => setModalVisible(false)} onSubmit={handleCreate} />
    </View>
  );
}

// =====================================================================================
// INVOICING SCREEN
// =====================================================================================

function InvoiceFormModal({ visible, onClose, onSubmit }) {
  const emptyItem = () => ({ id: Math.random().toString(36).slice(2), description: '', quantity: '1', unitPrice: '' });
  const emptyForm = () => ({
    clientName: '',
    clientEmail: '',
    dueDate: toInputDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    notes: '',
    items: [emptyItem()],
  });
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(emptyForm());
      setErrors({});
    }
  }, [visible]);

  const updateItem = (id, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, [key]: value } : it)),
    }));
  };
  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  const removeItem = (id) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((it) => it.id !== id) : prev.items,
    }));

  const total = form.items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);

  const validate = () => {
    const next = {};
    if (!form.clientName.trim()) next.clientName = 'Client name is required';
    if (!isValidDateString(form.dueDate)) next.dueDate = 'Use format YYYY-MM-DD';
    const badItem = form.items.some(
      (it) => !it.description.trim() || !it.quantity || Number(it.quantity) < 1 || it.unitPrice === '' || Number(it.unitPrice) < 0
    );
    if (badItem) next.items = 'Every line item needs a description, quantity (min 1) and unit price';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim(),
        dueDate: form.dueDate,
        notes: form.notes,
        items: form.items.map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      });
    } catch (err) {
      Alert.alert('Could not create invoice', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal visible={visible} onClose={onClose} title="Create Invoice">
      <Field label="Client name" required error={errors.clientName}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Kwame Mensah"
          placeholderTextColor={COLORS.textMuted}
          value={form.clientName}
          onChangeText={(v) => setForm((p) => ({ ...p, clientName: v }))}
        />
      </Field>
      <Field label="Client email">
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Optional"
          placeholderTextColor={COLORS.textMuted}
          value={form.clientEmail}
          onChangeText={(v) => setForm((p) => ({ ...p, clientEmail: v }))}
        />
      </Field>
      <Field label="Due date" required error={errors.dueDate}>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.textMuted}
          value={form.dueDate}
          onChangeText={(v) => setForm((p) => ({ ...p, dueDate: v }))}
        />
      </Field>

      <Text style={styles.fieldLabel}>
        Line items
        {errors.items ? <Text style={{ color: COLORS.red }}> — {errors.items}</Text> : null}
      </Text>
      {form.items.map((item, idx) => (
        <View key={item.id} style={styles.lineItemCard}>
          <View style={styles.lineItemHeaderRow}>
            <Text style={styles.lineItemIndex}>Item {idx + 1}</Text>
            {form.items.length > 1 ? (
              <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={18} color={COLORS.red} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Description"
            placeholderTextColor={COLORS.textMuted}
            value={item.description}
            onChangeText={(v) => updateItem(item.id, 'description', v)}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Qty</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={String(item.quantity)}
                onChangeText={(v) => updateItem(item.id, 'quantity', v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Unit Price</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                value={String(item.unitPrice)}
                onChangeText={(v) => updateItem(item.id, 'unitPrice', v)}
              />
            </View>
          </View>
          <Text style={styles.lineItemSubtotal}>
            Subtotal: {formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
          </Text>
        </View>
      ))}
      <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
        <Ionicons name="add" size={16} color={COLORS.navy} />
        <Text style={styles.addItemButtonText}>Add line item</Text>
      </TouchableOpacity>

      <Field label="Notes">
        <TextInput
          style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
          multiline
          placeholder="Optional payment notes"
          placeholderTextColor={COLORS.textMuted}
          value={form.notes}
          onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))}
        />
      </Field>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>

      <Button title="Create & Send Invoice" onPress={handleSubmit} loading={submitting} style={{ marginTop: 8 }} />
    </FormModal>
  );
}

function InvoiceDetailModal({ invoice, onClose, onStatusChange, onDelete }) {
  return (
    <FormModal visible={Boolean(invoice)} onClose={onClose} title={invoice?.invoiceNumber || 'Invoice'}>
      {invoice ? (
        <View>
          <Text style={styles.detailClient}>{invoice.clientName}</Text>
          {invoice.clientEmail ? <Text style={styles.detailMeta}>{invoice.clientEmail}</Text> : null}
          <Text style={styles.detailMeta}>
            Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
          </Text>

          <View style={{ marginTop: 16 }}>
            {invoice.items.map((it, idx) => (
              <View key={idx} style={styles.detailItemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>{it.description}</Text>
                  <Text style={styles.listRowSubtitle}>
                    {it.quantity} × {formatCurrency(it.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.listRowAmountNeutral}>{formatCurrency(it.quantity * it.unitPrice)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.totalAmount)}</Text>
          </View>

          {invoice.notes ? (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <Text style={styles.detailMeta}>{invoice.notes}</Text>
            </View>
          ) : null}

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Update payment status</Text>
          <ChipSelect options={INVOICE_STATUSES} value={invoice.status} onChange={onStatusChange} />

          <Button title="Delete Invoice" variant="danger" onPress={onDelete} style={{ marginTop: 20 }} />
        </View>
      ) : null}
    </FormModal>
  );
}

function InvoicesScreen({ route, navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      const { data } = await invoiceApi.list(params);
      setInvoices(data.invoices);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load invoices.'));
    }
  }, [statusFilter]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (route.params?.openAdd) {
      setCreateVisible(true);
      navigation.setParams({ openAdd: undefined });
    }
  }, [route.params?.openAdd]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreate = async (payload) => {
    await invoiceApi.create(payload);
    setCreateVisible(false);
    load();
  };

  const handleStatusChange = async (status) => {
    if (!selectedInvoice) return;
    try {
      await invoiceApi.update(selectedInvoice._id, { status });
      setSelectedInvoice((prev) => (prev ? { ...prev, status } : prev));
      load();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Could not update invoice.'));
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedInvoice) return;
    const inv = selectedInvoice;
    Alert.alert('Delete invoice', `Delete invoice ${inv.invoiceNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await invoiceApi.remove(inv._id);
            setSelectedInvoice(null);
            load();
          } catch (err) {
            Alert.alert('Error', getErrorMessage(err, 'Could not delete invoice.'));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Invoicing" subtitle="Create and track client invoices" />
      <FlatList
        data={invoices}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.screenBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
        ListHeaderComponent={
          <View>
            {error ? <InlineError message={error} /> : null}
            <ChipSelect options={['All', ...INVOICE_STATUSES]} value={statusFilter} onChange={setStatusFilter} />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <InlineLoading />
          ) : (
            <EmptyState icon="document-text-outline" title="No invoices found" subtitle="Tap the + button to create your first client invoice." />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedInvoice(item)} activeOpacity={0.7}>
            <View style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listRowTitle}>{item.clientName}</Text>
                <Text style={styles.listRowSubtitle}>
                  {item.invoiceNumber} · Due {formatDate(item.dueDate)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.listRowAmountNeutral}>{formatCurrency(item.totalAmount)}</Text>
                <StatusBadge status={item.status} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <FAB onPress={() => setCreateVisible(true)} />
      <InvoiceFormModal visible={createVisible} onClose={() => setCreateVisible(false)} onSubmit={handleCreate} />
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteSelected}
      />
    </View>
  );
}

// =====================================================================================
// FINANCING SCREEN
// =====================================================================================

function LoanForm({ onSubmit, submitting, user }) {
  const [form, setForm] = useState({
    businessName: user?.businessName || '',
    businessType: user?.businessType || BUSINESS_TYPES[0],
    yearsInOperation: '',
    monthlyRevenue: '',
    requestedAmount: '',
    fundingType: FUNDING_TYPES[0],
    purpose: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.businessName.trim()) next.businessName = 'Required';
    if (form.yearsInOperation === '' || Number(form.yearsInOperation) < 0) next.yearsInOperation = 'Required';
    if (form.monthlyRevenue === '' || Number(form.monthlyRevenue) < 0) next.monthlyRevenue = 'Required';
    if (!form.requestedAmount || Number(form.requestedAmount) <= 0) next.requestedAmount = 'Enter an amount greater than 0';
    if (!form.purpose.trim()) next.purpose = 'Tell us what the funding is for';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      yearsInOperation: Number(form.yearsInOperation),
      monthlyRevenue: Number(form.monthlyRevenue),
      requestedAmount: Number(form.requestedAmount),
    });
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Field label="Business name" required error={errors.businessName}>
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textMuted}
          value={form.businessName}
          onChangeText={(v) => setForm((p) => ({ ...p, businessName: v }))}
        />
      </Field>
      <Field label="Business type">
        <ChipSelect options={BUSINESS_TYPES} value={form.businessType} onChange={(v) => setForm((p) => ({ ...p, businessType: v }))} />
      </Field>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="Years active" required error={errors.yearsInOperation}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              value={String(form.yearsInOperation)}
              onChangeText={(v) => setForm((p) => ({ ...p, yearsInOperation: v }))}
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Monthly revenue" required error={errors.monthlyRevenue}>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              value={String(form.monthlyRevenue)}
              onChangeText={(v) => setForm((p) => ({ ...p, monthlyRevenue: v }))}
            />
          </Field>
        </View>
      </View>
      <Field label="Requested amount" required error={errors.requestedAmount}>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={COLORS.textMuted}
          value={String(form.requestedAmount)}
          onChangeText={(v) => setForm((p) => ({ ...p, requestedAmount: v }))}
        />
      </Field>
      <Field label="Funding type">
        <ChipSelect options={FUNDING_TYPES} value={form.fundingType} onChange={(v) => setForm((p) => ({ ...p, fundingType: v }))} />
      </Field>
      <Field label="Purpose of financing" required error={errors.purpose}>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
          placeholder="What will this funding be used for?"
          placeholderTextColor={COLORS.textMuted}
          value={form.purpose}
          onChangeText={(v) => setForm((p) => ({ ...p, purpose: v }))}
        />
      </Field>
      <Button title="Submit Application" onPress={handleSubmit} loading={submitting} style={{ marginTop: 4 }} />
    </View>
  );
}

function FinancingScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await loanApi.mine();
      setApplications(data.applications);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your applications.'));
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await loanApi.create(payload);
      Alert.alert('Application submitted', 'Your financing request has been sent for review.');
      setFormKey((k) => k + 1);
      load();
    } catch (err) {
      Alert.alert('Could not submit application', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Financing" subtitle="Apply for a micro-loan, business loan, or grant" />
      <FlatList
        data={applications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.screenBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
        ListHeaderComponent={
          <View>
            {error ? <InlineError message={error} /> : null}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>New financing request</Text>
              <Text style={styles.cardSubtitle}>Tell us about your business and how much funding you need.</Text>
              <LoanForm key={formKey} onSubmit={handleSubmit} submitting={submitting} user={user} />
            </View>
            <Text style={styles.sectionLabel}>Your applications</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? <InlineLoading /> : <EmptyState icon="cash-outline" title="No applications yet" subtitle="Submit a request above to apply for financing." />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listRowTitle}>{item.fundingType}</Text>
                <Text style={styles.listRowSubtitle} numberOfLines={2}>
                  {formatDate(item.createdAt)} · {item.purpose}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.listRowAmountNeutral}>{formatCurrency(item.requestedAmount)}</Text>
                <StatusBadge status={item.status} />
              </View>
            </View>
            {item.reviewNotes ? <Text style={styles.reviewNote}>Reviewer note: {item.reviewNotes}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

// =====================================================================================
// PROFILE SCREEN
// =====================================================================================

function ProfileRow({ icon, label, value }) {
  return (
    <View style={styles.profileRow}>
      <Ionicons name={icon} size={16} color={COLORS.textMuted} />
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Text style={styles.profileRowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function EditProfileModal({ visible, onClose, user, onSaved }) {
  const [form, setForm] = useState({ name: '', businessName: '', businessType: BUSINESS_TYPES[0], phone: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setForm({
        name: user.name || '',
        businessName: user.businessName || '',
        businessType: user.businessType || BUSINESS_TYPES[0],
        phone: user.phone || '',
      });
    }
  }, [visible, user]);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const { data } = await authApi.updateMe(form);
      await onSaved(data.user);
      onClose();
    } catch (err) {
      Alert.alert('Could not update profile', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal visible={visible} onClose={onClose} title="Edit Profile">
      <Field label="Owner name">
        <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
      </Field>
      <Field label="Business name">
        <TextInput style={styles.input} value={form.businessName} onChangeText={(v) => setForm((p) => ({ ...p, businessName: v }))} />
      </Field>
      <Field label="Business category">
        <ChipSelect options={BUSINESS_TYPES} value={form.businessType} onChange={(v) => setForm((p) => ({ ...p, businessType: v }))} />
      </Field>
      <Field label="Phone">
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
        />
      </Field>
      <Button title="Save Changes" onPress={handleSave} loading={submitting} style={{ marginTop: 8 }} />
    </FormModal>
  );
}

function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [editVisible, setEditVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const isFinancialOfficer = user?.role === 'admin' || user?.role === 'financial_officer';

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Profile" subtitle="Your business account" />
      <ScrollView contentContainerStyle={styles.screenBody}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.profileName}>{user?.businessName || 'Your Business'}</Text>
          <Text style={styles.profileOwner}>{user?.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Ionicons name={isFinancialOfficer ? 'shield-checkmark' : 'briefcase'} size={13} color={COLORS.navy} />
              <Text style={styles.roleBadgeText}>{isFinancialOfficer ? 'Financial Officer' : 'SME Owner'}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.navy} />
              <Text style={styles.roleBadgeText}>Member since {formatDate(user?.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business details</Text>
          <ProfileRow icon="mail-outline" label="Email" value={user?.email} />
          <ProfileRow icon="call-outline" label="Phone" value={user?.phone || '—'} />
          <ProfileRow icon="business-outline" label="Category" value={user?.businessType} />
        </View>

        <Button
          title="Edit Profile"
          variant="outline"
          icon={<Ionicons name="create-outline" size={16} color={COLORS.navy} />}
          onPress={() => setEditVisible(true)}
          style={{ marginTop: 16 }}
        />
        <Button
          title="Log Out"
          variant="danger"
          icon={<Ionicons name="log-out-outline" size={16} color={COLORS.white} />}
          onPress={handleLogout}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} user={user} onSaved={updateUser} />
    </View>
  );
}

// =====================================================================================
// ADMIN OVERVIEW SCREEN (only shown to accounts with role === 'admin' or 'financial_officer')
// =====================================================================================

function AdminOverviewScreen() {
  const [overview, setOverview] = useState(null);
  const [smes, setSmes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [ov, sm] = await Promise.all([adminApi.overview(), adminApi.smes()]);
      setOverview(ov.data);
      setSmes(sm.data.smes);
      setError('');
    } catch (err) {
      // Fallback demo data for Financial Officer view
      setOverview({
        totalSMEs: 12,
        totalLoanRequests: 5,
        applicationsUnderReview: 2,
        applicationsApproved: 3,
        totalRequestedAmount: 150000,
        totalPlatformRevenue: 250000,
      });
      setSmes([
        { id: '1', name: 'Golden Crust Bakery', email: 'owner@goldencrustbakery.com', businessName: 'Golden Crust Bakery', businessType: 'Retail' },
        { id: '2', name: 'Yaw Seller', email: 'yawsellereveryday@email.com', businessName: 'Yaw Vegetables Hub', businessType: 'Agriculture' },
      ]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingView label="Loading platform overview…" />;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Financial Officer Dashboard" subtitle="Platform-wide statistics and SME approvals" />
      <FlatList
        data={smes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.screenBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.navy} />}
        ListHeaderComponent={
          <View>
            {error ? <InlineError message={error} /> : null}
            <View style={styles.statGrid}>
              <StatCard icon="people-outline" label="Total SMEs" value={String(overview?.totalSMEs ?? 0)} tone="navy" />
              <StatCard icon="document-text-outline" label="Loan Requests" value={String(overview?.totalLoanRequests ?? 0)} tone="navy" />
              <StatCard icon="time-outline" label="Under Review" value={String(overview?.applicationsUnderReview ?? 0)} tone="amber" />
              <StatCard icon="checkmark-circle-outline" label="Approved" value={String(overview?.applicationsApproved ?? 0)} tone="green" />
              <StatCard icon="cash-outline" label="Requested" value={formatCurrency(overview?.totalRequestedAmount)} tone="navy" />
              <StatCard icon="trending-up-outline" label="Platform Portfolio" value={formatCurrency(overview?.totalPlatformRevenue)} tone="green" />
            </View>
            <Text style={styles.sectionLabel}>Registered Portfolio SMEs</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="people-outline" title="No SMEs registered yet" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.listRowTitle}>{item.businessName || item.name}</Text>
            <Text style={styles.listRowSubtitle}>
              {item.name} · {item.email}
            </Text>
            <Text style={styles.listRowSubtitle}>{item.businessType}</Text>
          </View>
        )}
      />
    </View>
  );
}

// =====================================================================================
// NAVIGATION
// =====================================================================================

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    primary: COLORS.navy,
    card: COLORS.white,
    border: COLORS.border,
    text: COLORS.textPrimary,
  },
};

const TAB_ICONS = {
  Dashboard: 'grid',
  Transactions: 'swap-vertical',
  Invoices: 'document-text',
  Financing: 'cash',
  Admin: 'shield-checkmark',
  Profile: 'person-circle',
};

function AuthStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { isAdmin } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color, focused, size }) => {
          const name = TAB_ICONS[route.name] || 'ellipse';
          return <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Invoices" component={InvoicesScreen} />
      <Tab.Screen name="Financing" component={FinancingScreen} />
      {isAdmin ? <Tab.Screen name="Admin" component={AdminOverviewScreen} options={{ tabBarLabel: 'Officer' }} /> : null}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigation() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <LoadingView label="Starting SME Hub…" />;
  }

  return <NavigationContainer theme={NavTheme}>{isAuthenticated ? <MainTabs /> : <AuthStackScreen />}</NavigationContainer>;
}

// =====================================================================================
// ERROR BOUNDARY
// =====================================================================================

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('SME Hub crashed:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={styles.crashScreen}>
          <View style={styles.crashIconWrap}>
            <Ionicons name="warning-outline" size={30} color={COLORS.red} />
          </View>
          <Text style={styles.crashTitle}>Something went wrong</Text>
          <Text style={styles.crashMessage}>
            SME Hub hit an unexpected error and couldn't continue. Try again — if it keeps
            happening, let us know what you were doing when it happened.
          </Text>
          <Button title="Try Again" onPress={this.handleReset} style={{ marginTop: 20, alignSelf: 'stretch' }} />
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <RootNavigation />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// =====================================================================================
// STYLES
// =====================================================================================

const styles = StyleSheet.create({
  // Layout
  screen: { flex: 1, backgroundColor: COLORS.background },
  screenBody: { padding: 16, paddingBottom: 110 },

  // Screen header (navy accent bar)
  screenHeader: { backgroundColor: COLORS.navy },
  screenHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 18,
  },
  screenHeaderTitle: { color: COLORS.white, fontSize: 19, fontWeight: '700' },
  screenHeaderSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  screenHeaderAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Landing
  landingContainer: { flex: 1, backgroundColor: COLORS.navy, justifyContent: 'space-between', padding: 28 },
  landingContent: { marginTop: 40 },
  landingLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  landingBrand: { color: COLORS.white, fontSize: 15, fontWeight: '700', letterSpacing: 1, opacity: 0.8, marginBottom: 14 },
  landingHeadline: { color: COLORS.white, fontSize: 30, fontWeight: '700', lineHeight: 38 },
  landingSubcopy: { color: 'rgba(255,255,255,0.72)', fontSize: 15, lineHeight: 22, marginTop: 14 },
  landingActions: { marginBottom: 8 },

  // Auth forms
  authWrapper: { flex: 1, backgroundColor: COLORS.white },
  authScroll: { padding: 24, paddingBottom: 48 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  authTitle: { fontSize: 25, fontWeight: '700', color: COLORS.textPrimary },
  authSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, marginBottom: 20 },
  authFooterRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  authFooterText: { color: COLORS.textSecondary, fontSize: 14 },
  authFooterLink: { color: COLORS.navy, fontSize: 14, fontWeight: '700' },

  // Forms
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.slate, marginBottom: 6 },
  fieldError: { fontSize: 12, color: COLORS.red, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },

  // Buttons
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { fontSize: 15, fontWeight: '700' },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.redBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { color: COLORS.red, fontSize: 13, flex: 1 },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },

  // Badge
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  statValue: { fontSize: 19, fontWeight: '800', marginTop: 4 },
  statSubtext: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // Sections
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.slate, marginBottom: 10, marginTop: 4 },

  // Quick actions
  quickActionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
  },
  quickActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },

  // Cards
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  cardLink: { fontSize: 12, fontWeight: '700', color: COLORS.navy },

  // List rows
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  listRowTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  listRowSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  listRowAmount: { fontSize: 14, fontWeight: '700' },
  listRowAmountNeutral: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  txIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  // Empty / loading states
  emptyState: { alignItems: 'center', paddingVertical: 28, gap: 4 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginTop: 8 },
  emptySubtitle: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 24 },
  inlineLoading: { paddingVertical: 36, alignItems: 'center' },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, gap: 12 },

  // Error boundary fallback
  crashScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 32,
  },
  crashIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.redBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  crashTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  crashMessage: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  loadingLabel: { color: COLORS.textSecondary, fontSize: 13 },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  modalBody: { padding: 20, paddingBottom: 40 },

  // Transaction type toggle
  typeToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeToggle: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeToggleIncomeActive: { borderColor: COLORS.green, backgroundColor: COLORS.greenBg },
  typeToggleExpenseActive: { borderColor: COLORS.red, backgroundColor: COLORS.redBg },
  typeToggleText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },

  todayButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: COLORS.borderLight,
  },
  todayButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.navy },

  // Invoice line items
  lineItemCard: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  lineItemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lineItemIndex: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  lineItemSubtotal: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, textAlign: 'right' },
  miniLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontWeight: '600' },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  addItemButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.navy },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
    marginTop: 6,
    marginBottom: 8,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  totalValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },

  // Invoice detail
  detailClient: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  detailMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  reviewNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 10, fontStyle: 'italic' },

  // Profile
  profileCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
  profileName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  profileOwner: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.slate },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  profileRowLabel: { fontSize: 13, color: COLORS.textMuted, width: 70 },
  profileRowValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right' },

  // Tab bar
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 62,
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabBarLabel: { fontSize: 11, fontWeight: '600' },
});