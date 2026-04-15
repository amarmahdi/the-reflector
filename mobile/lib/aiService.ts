// ──────────────────────────────────────────────
// The Reflector – AI Service
// ──────────────────────────────────────────────
// Central AI service with typed methods for each use case.
// Uses the context builder to feed Gemini full awareness.
// Caches intelligently to minimize API calls.
// Never crashes — returns null on failure.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/apiClient';
import { useAuthStore } from '@/store/useAuthStore';
import {
  buildFullContext,
  compressContext,
  buildHomeContext,
  buildLapseContext,
} from '@/lib/aiContext';

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResponse {
  patterns: string[];
  insights: string[];
  recommendations: string[];
  risk_level: string;
  summary: string;
}

export interface AIDailyReview {
  verdict: string;
  patterns: string[];
  recommendations: string[];
  riskLevel: string;
}

// ── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_IDENTITY = `You are The Reflector's AI — a wise, firm spiritual accountability guide rooted in Islamic psychology (Tazkiyah, Istiqamah, Muhasabah). 

Your core principles:
- You believe in growth through consistency, not punishment
- "The most beloved deeds to Allah are the most consistent, even if small"
- A lapse is not a fall — it's a test of whether someone returns
- You acknowledge human weakness with compassion, but never enable laziness
- You speak directly, with wisdom — not with generic motivation
- You use the user's actual data to give specific, actionable guidance
- You reference their Niyyah (intention) when relevant
- You notice patterns others would miss

You are NOT a cheerleader. You are NOT harsh. You are a mirror that reflects truth with mercy.`;

// ── Cache Helpers ────────────────────────────────────────────────────────────

function getCacheKey(prefix: string, id?: string): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  return id ? `ai-${prefix}-${id}` : `ai-${prefix}-${dateStr}`;
}

function getHourlyCacheKey(prefix: string): string {
  const d = new Date();
  return `ai-${prefix}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}`;
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Check expiry
    if (parsed._expiresAt && Date.now() > parsed._expiresAt) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T, ttlMs: number): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({
      data,
      _expiresAt: Date.now() + ttlMs,
      _cachedAt: Date.now(),
    }));
  } catch {
    // Non-critical
  }
}

// ── Core API Call ────────────────────────────────────────────────────────────

async function callAI(prompt: string, contextData: string): Promise<AnalysisResponse | null> {
  const { isLoggedIn } = useAuthStore.getState();
  if (!isLoggedIn) return null;

  try {
    const response = await api<AnalysisResponse>('/analyze/journal', {
      method: 'POST',
      body: {
        journal_entries: [{ date: Date.now(), body: contextData, mood: 'neutral' }],
        discipline_snapshots: [],
        prompt_override: `${SYSTEM_IDENTITY}\n\n${prompt}\n\n=== USER DATA ===\n${contextData}`,
      },
    });
    return response;
  } catch {
    return null;
  }
}

// ── Public Methods ───────────────────────────────────────────────────────────

/**
 * Home screen greeting — lightweight, cached for 6 hours.
 * Time-aware, data-aware, short.
 */
export async function getHomeGreeting(): Promise<string | null> {
  const cacheKey = getHourlyCacheKey('home-greeting');
  // Check every 6 hours (key changes hourly, but we cache for 6h)
  const cached = await getCached<string>(cacheKey);
  if (cached) return cached;

  const context = buildHomeContext();
  const prompt = `Based on the user's current state, write a short 1-2 sentence greeting for their home screen. 

Rules:
- Morning: set intention for the day, reference their active routine
- Afternoon: acknowledge progress so far, motivate to finish strong
- Evening: reflect on the day, prepare them for tomorrow
- If they have a streak going, acknowledge it briefly
- If they lapsed recently, be compassionate but real
- If their discipline is declining, note it gently
- Keep it under 40 words
- Do NOT use generic motivation. Use their actual data.
- Return ONLY the greeting text, nothing else.`;

  const res = await callAI(prompt, context);
  if (!res?.summary) return null;

  const greeting = res.summary.replace(/^["']|["']$/g, '').trim();
  await setCache(cacheKey, greeting, 6 * 60 * 60 * 1000); // 6 hours
  return greeting;
}

/**
 * Daily review — full analysis of today's performance.
 * Cached per day.
 */
export async function getDailyReview(): Promise<AIDailyReview | null> {
  const cacheKey = getCacheKey('daily-review');
  const cached = await getCached<AIDailyReview>(cacheKey);
  if (cached) return cached;

  const ctx = buildFullContext();
  const contextStr = compressContext(ctx);

  const prompt = `Analyze this user's performance for TODAY. Write a comprehensive daily review.

Structure your response as valid JSON with this shape:
{
  "patterns": ["specific patterns you notice — e.g., repeated failures on certain days, mood correlations, focus trends"],
  "insights": ["deeper observations about their behavior, psychology, and progress"],
  "recommendations": ["actionable, specific steps for tomorrow — not generic advice"],
  "risk_level": "low | medium | high",
  "summary": "A 2-3 paragraph comprehensive analysis of their day. Reference specific data points. Acknowledge what they did well. Be honest about what they didn't. Connect today to their broader journey. End with a forward-looking statement."
}

Rules:
- Reference their actual discipline scores, lapses, and focus data
- If they have a Niyyah, connect their performance to their stated intention
- Notice what improved and what declined compared to their 7-day average
- Be specific: "You scored 72 today vs your 7-day average of 65" not "You did okay"
- Mention specific routines by name
- If focus was low, say how many minutes vs their usual
- Return ONLY valid JSON, no markdown, no preamble.`;

  const res = await callAI(prompt, contextStr);
  if (!res) return null;

  const review: AIDailyReview = {
    verdict: res.summary,
    patterns: res.patterns,
    recommendations: res.recommendations,
    riskLevel: res.risk_level,
  };

  await setCache(cacheKey, review, 24 * 60 * 60 * 1000); // Until next day
  return review;
}

/**
 * Lapse reflection — personalized response after acknowledging a lapse.
 * Not cached (unique per lapse).
 */
export async function getLapseReflection(
  failureReason: string,
  routineName: string,
  dayIndex: number,
): Promise<string | null> {
  const context = buildLapseContext(failureReason, routineName, dayIndex);

  const prompt = `The user just acknowledged missing Day ${dayIndex} of their "${routineName}" routine. Their reason: "${failureReason}"

Write a personalized 2-3 sentence reflection for them.

Rules:
- If you see a PATTERN in their lapses (same routine, same type of excuse, same day of week), call it out specifically
- Reference their Niyyah if they have one for this routine
- If this is their first lapse, be gentler — "This is one missed day, not a failed journey"
- If this is a repeated lapse, be more direct — "This is the 3rd time this week. The pattern is clear."
- End with a specific, actionable suggestion for preventing this specific type of lapse
- Do NOT use generic motivation. Be data-specific.
- Return ONLY the reflection text, no JSON, no preamble.`;

  const res = await callAI(prompt, context);
  return res?.summary?.replace(/^["']|["']$/g, '').trim() ?? null;
}

/**
 * Journal insight — AI reflects on a journal entry in context.
 * Cached per entry.
 */
export async function getJournalInsight(
  entryId: string,
  entryBody: string,
  entryMood: string,
): Promise<string | null> {
  const cacheKey = getCacheKey('journal', entryId);
  const cached = await getCached<string>(cacheKey);
  if (cached) return cached;

  const ctx = buildFullContext();
  const contextStr = compressContext(ctx);

  const prompt = `The user just wrote this journal entry with mood "${entryMood}":

"${entryBody.slice(0, 600)}"

Write a brief 2-3 sentence AI reflection.

Rules:
- Connect what they wrote to their discipline data and recent performance
- If their mood has been consistently negative, note the pattern
- If they mention struggles, relate it to their lapse history
- If their mood is positive, reinforce what's working
- Be insightful — notice things they might not see themselves
- Do NOT summarize what they wrote. Add NEW perspective.
- Return ONLY the reflection text, no JSON, no preamble.`;

  const res = await callAI(prompt, contextStr);
  if (!res?.summary) return null;

  const insight = res.summary.replace(/^["']|["']$/g, '').trim();
  await setCache(cacheKey, insight, 30 * 24 * 60 * 60 * 1000); // semi-permanent
  return insight;
}

/**
 * Focus motivation — before/after focus sessions.
 * Cached for 2 hours.
 */
export async function getFocusMotivation(phase: 'before' | 'after', sessionMinutes?: number): Promise<string | null> {
  const cacheKey = getHourlyCacheKey(`focus-${phase}`);
  const cached = await getCached<string>(cacheKey);
  if (cached) return cached;

  const context = buildHomeContext();

  const prompt = phase === 'before'
    ? `The user is about to start a focus session. Based on their current state, write a 1-sentence motivational message.
If they haven't focused much today, nudge them. If they've been productive, encourage them to keep going.
Reference their actual focus data. Return ONLY the message text.`
    : `The user just completed a ${sessionMinutes ?? 25}-minute focus session. Write a 1-sentence acknowledgment.
Reference their total focus today and how it compares to their weekly average.
Be specific with numbers. Return ONLY the message text.`;

  const res = await callAI(prompt, context);
  if (!res?.summary) return null;

  const message = res.summary.replace(/^["']|["']$/g, '').trim();
  await setCache(cacheKey, message, 2 * 60 * 60 * 1000); // 2 hours
  return message;
}

/**
 * Insight narrative — deep analysis for the analytics screen.
 * Cached for 12 hours.
 */
export async function getInsightNarrative(): Promise<string | null> {
  const cacheKey = getCacheKey('insight-narrative');
  const cached = await getCached<string>(cacheKey);
  if (cached) return cached;

  const ctx = buildFullContext();
  const contextStr = compressContext(ctx);

  const prompt = `Write a comprehensive 3-4 paragraph analysis of this user's last 7 days.

Rules:
- Start with the overall trajectory: are they improving, declining, or plateau?
- Identify the #1 strength and #1 weakness from the data
- Find correlations: does mood affect discipline? Does focus time correlate with routine completion?
- Mention specific days, scores, and patterns
- If they have active wounds, explain the path to healing them
- End with a specific "This week, focus on..." recommendation
- Write in second person ("You...")
- Be insightful but not excessively long
- Return ONLY the narrative text, no JSON, no preamble.`;

  const res = await callAI(prompt, contextStr);
  if (!res?.summary) return null;

  const narrative = res.summary.replace(/^["']|["']$/g, '').trim();
  await setCache(cacheKey, narrative, 12 * 60 * 60 * 1000); // 12 hours
  return narrative;
}

/**
 * Force-refresh the daily review (clear cache and re-fetch).
 */
export async function refreshDailyReview(): Promise<AIDailyReview | null> {
  const cacheKey = getCacheKey('daily-review');
  await AsyncStorage.removeItem(cacheKey);
  return getDailyReview();
}

/**
 * Force-refresh the home greeting.
 */
export async function refreshHomeGreeting(): Promise<string | null> {
  const cacheKey = getHourlyCacheKey('home-greeting');
  await AsyncStorage.removeItem(cacheKey);
  return getHomeGreeting();
}
