/**
 * geminiService.js
 * ------------------------------------------------------------------
 * The ONLY file in the backend that talks to the Google Gemini SDK
 * directly. Every other AI-related service (documentAIService,
 * insightService) must go through the functions exported here.
 *
 * This keeps the AI provider swappable: React -> Express -> AI Service
 * -> Gemini. If LifeVault ever needs to switch providers (OpenAI,
 * Claude, etc.), only this file needs to change.
 *
 * The Gemini API key NEVER leaves the backend. It is read from
 * process.env.GEMINI_API_KEY and is never sent to, or accepted from,
 * the frontend.
 * ------------------------------------------------------------------
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

let client = null;

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error(
      'GEMINI_API_KEY is not configured on the server. Set it in backend/.env to enable AI features.'
    );
    error.statusCode = 503;
    error.code = 'GEMINI_NOT_CONFIGURED';
    throw error;
  }

  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }

  return client;
};

/**
 * Convert a Buffer into the inlineData part Gemini expects for
 * multimodal (image/PDF) input.
 */
const toInlinePart = (buffer, mimeType) => ({
  inlineData: {
    data: buffer.toString('base64'),
    mimeType,
  },
});

/**
 * Generate plain text content from a prompt, optionally attaching a
 * file (image or PDF) as an additional multimodal part.
 *
 * @param {string} prompt - The instruction/prompt text.
 * @param {{buffer: Buffer, mimeType: string}=} file - Optional file to analyze.
 * @returns {Promise<string>} Raw text returned by Gemini.
 */
export const generateText = async (prompt, file) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const parts = [{ text: prompt }];
  if (file?.buffer && file?.mimeType) {
    parts.push(toInlinePart(file.buffer, file.mimeType));
  }

  try {
    const result = await model.generateContent(parts);
    const response = result.response;
    return response.text();
  } catch (err) {
    const error = new Error(`Gemini API request failed: ${err.message}`);
    error.statusCode = 502;
    error.code = 'GEMINI_REQUEST_FAILED';
    throw error;
  }
};

/**
 * Generate a JSON object from a prompt, using Gemini's structured
 * output mode so the model is constrained to return valid JSON.
 * Still defensively parses the result since the SDK/model can
 * occasionally wrap output in markdown fences.
 *
 * @param {string} prompt
 * @param {{buffer: Buffer, mimeType: string}=} file
 * @returns {Promise<object>}
 */
export const generateJSON = async (prompt, file) => {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const parts = [{ text: prompt }];
  if (file?.buffer && file?.mimeType) {
    parts.push(toInlinePart(file.buffer, file.mimeType));
  }

  let rawText;
  try {
    const result = await model.generateContent(parts);
    rawText = result.response.text();
  } catch (err) {
    const error = new Error(`Gemini API request failed: ${err.message}`);
    error.statusCode = 502;
    error.code = 'GEMINI_REQUEST_FAILED';
    throw error;
  }

  const cleaned = rawText
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const error = new Error('Gemini returned a response that could not be parsed as JSON.');
    error.statusCode = 502;
    error.code = 'GEMINI_INVALID_JSON';
    error.rawResponse = rawText;
    throw error;
  }
};

export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);
