// Storage utility for 9Router AI Studio

const STORAGE_KEYS = {
  SETTINGS: '9router_settings',
  KEYS: '9router_api_keys',
  CHATS: '9router_chats',
  ACTIVE_CHAT_ID: '9router_active_chat_id',
  MODELS_CACHE: '9router_models_cache',
};

export const DEFAULT_SETTINGS = {
  baseUrl: 'http://localhost:20128/v1',
  selectedModel: '',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  stream: true,
  systemPrompt: 'You are a helpful, versatile, and highly capable AI assistant.',
  rotationMode: 'failover', // 'failover' | 'round-robin' | 'manual'
};

export const getStoredSettings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const getStoredKeys = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.KEYS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load keys:', e);
    return [];
  }
};

export const saveStoredKeys = (keys) => {
  try {
    localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(keys));
  } catch (e) {
    console.error('Failed to save keys:', e);
  }
};

export const getStoredChats = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load chats:', e);
    return [];
  }
};

export const saveStoredChats = (chats) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  } catch (e) {
    console.error('Failed to save chats:', e);
  }
};

export const getStoredActiveChatId = () => {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_CHAT_ID) || null;
};

export const saveStoredActiveChatId = (id) => {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHAT_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CHAT_ID);
  }
};

export const getStoredModelsCache = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MODELS_CACHE);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveStoredModelsCache = (models) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MODELS_CACHE, JSON.stringify(models));
  } catch (e) {
    console.error('Failed to save models cache:', e);
  }
};
