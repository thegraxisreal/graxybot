const DEFAULT_API_BASE = "https://www.graxybot.xyz";
const RUNTIME_API_BASE =
  typeof window !== "undefined"
    ? window.GraxybotConfig?.apiBase || window.location.origin
    : DEFAULT_API_BASE;

export const GEMINI_CHAT_MODEL = "gemini-2.0-flash";
export const API_BASE = RUNTIME_API_BASE;
export const GEMINI_IMAGE_ENDPOINT = `${API_BASE}/gemini/image`;
export const OPENAI_CHAT_MODEL = "gpt-4.1-mini";
export const OPENAI_PROXY_ENDPOINT = `${API_BASE}/openai/chat`;
export const OPENAI_SEARCH_ENDPOINT = `${API_BASE}/openai/search`;
export const GEMINI_CHAT_ENDPOINT = `${API_BASE}/gemini/chat`;

export const DEFAULT_CHAT_MODEL = OPENAI_CHAT_MODEL;
export const BOT_ICON_SRC = "graxybot.png";
export const USER_ICON_CLASS = "fas fa-user";
export const CHATS_STORAGE_KEY = "graxybot_minimalist_chats_v3";
export const CURRENT_CHAT_ID_KEY = "graxybot_minimalist_current_chat_id_v3";
export const PERSONALITY_STORAGE_KEY = "graxybot_minimalist_personality_v3";
export const THEME_STORAGE_KEY = "graxybot_theme_v1";
export const THEME_MODE_STORAGE_KEY = "graxybot_theme_mode_v1";
export const ME_PROFILE_STORAGE_KEY = "graxybot_me_profile_v1";
export const USAGE_STORAGE_KEY = "graxybot_usage_stats_v1";
export const CHAT_USAGE_LIMIT = 50;
export const IMAGE_USAGE_LIMIT = 10;
export const USAGE_WINDOW_MS = 2 * 60 * 60 * 1000;
export const SEARCH_USAGE_WINDOW_MS = 12 * 60 * 60 * 1000;
export const SEARCH_USAGE_LIMIT = 5;
export const BACKGROUND_VIDEOS = ["vid1.mp4", "vid2.mp4", "vid3.mp4"];
