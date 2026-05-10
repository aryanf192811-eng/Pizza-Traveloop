// src/utils/gemini.js
// Calls Gemini 2.0 Flash for smart packing. Falls back to offline templates if quota exceeded or API fails.

const FALLBACK_PACKING = {
  beach: [
    { category: 'Clothing', item_name: 'Swimwear' },
    { category: 'Clothing', item_name: 'Light linen shirt' },
    { category: 'Clothing', item_name: 'Flip flops' },
    { category: 'Toiletries', item_name: 'SPF 50 sunscreen' },
    { category: 'Toiletries', item_name: 'After-sun lotion' },
    { category: 'Toiletries', item_name: 'Insect repellent' },
    { category: 'Electronics', item_name: 'Waterproof phone case' },
    { category: 'Misc', item_name: 'Beach towel' },
    { category: 'Misc', item_name: 'Reusable water bottle' },
  ],
  winter: [
    { category: 'Clothing', item_name: 'Thermal inner layers' },
    { category: 'Clothing', item_name: 'Heavy jacket / parka' },
    { category: 'Clothing', item_name: 'Woollen gloves' },
    { category: 'Clothing', item_name: 'Beanie / winter hat' },
    { category: 'Clothing', item_name: 'Waterproof boots' },
    { category: 'Toiletries', item_name: 'Lip balm (SPF)' },
    { category: 'Toiletries', item_name: 'Moisturiser (thick)' },
    { category: 'Misc', item_name: 'Hand warmers' },
    { category: 'Misc', item_name: 'Umbrella / rain poncho' },
  ],
  europe: [
    { category: 'Clothing', item_name: 'Comfortable walking shoes' },
    { category: 'Clothing', item_name: 'Light jacket / windbreaker' },
    { category: 'Clothing', item_name: 'Smart casual outfit' },
    { category: 'Documents', item_name: 'Passport + photocopies' },
    { category: 'Documents', item_name: 'Travel insurance docs' },
    { category: 'Electronics', item_name: 'Universal plug adapter' },
    { category: 'Electronics', item_name: 'Power bank' },
    { category: 'Misc', item_name: 'Day backpack' },
    { category: 'Misc', item_name: 'Reusable shopping bag' },
  ],
  general: [
    { category: 'Documents', item_name: 'Passport / ID' },
    { category: 'Documents', item_name: 'Visa (if required)' },
    { category: 'Documents', item_name: 'Travel insurance' },
    { category: 'Documents', item_name: 'Hotel booking confirmation' },
    { category: 'Documents', item_name: 'Emergency contacts printout' },
    { category: 'Electronics', item_name: 'Phone charger' },
    { category: 'Electronics', item_name: 'Power bank' },
    { category: 'Electronics', item_name: 'Earphones' },
    { category: 'Clothing', item_name: 'Comfortable walking shoes' },
    { category: 'Clothing', item_name: 'Weather-appropriate layers' },
    { category: 'Toiletries', item_name: 'Toothbrush + toothpaste' },
    { category: 'Toiletries', item_name: 'Deodorant' },
    { category: 'Toiletries', item_name: 'Hand sanitiser' },
    { category: 'Misc', item_name: 'Reusable water bottle' },
    { category: 'Misc', item_name: 'Day backpack' },
  ],
};

// Detect destination type from city/country names to pick best template
const detectTemplate = (destinations = []) => {
  const joined = destinations.join(' ').toLowerCase();
  if (/bali|goa|phuket|maldives|beach|hawaii|cancun|ibiza/.test(joined)) return 'beach';
  if (/london|paris|rome|amsterdam|berlin|prague|vienna|europe|barcelona/.test(joined)) return 'europe';
  if (/snow|ski|alps|winter|iceland|norway|himachal|manali|leh|shimla/.test(joined)) return 'winter';
  return 'general';
};

/**
 * Generate a smart packing list using Gemini API.
 * If Gemini fails for any reason (quota, network, invalid key), falls back to offline templates.
 *
 * @param {string[]} destinations  Array of city/country name strings
 * @param {number}   tripDays      Number of days
 * @param {string}   apiKey        Gemini API key (from user profile or env)
 * @returns {{ items: {category:string, item_name:string}[], usedFallback: boolean }}
 */
export async function generatePackingList(destinations, tripDays, apiKey) {
  // Attempt Gemini if a key is available
  if (apiKey && apiKey.trim()) {
    try {
      const prompt = `You are a professional travel packing assistant.
Generate a packing list for a ${tripDays}-day trip to: ${destinations.join(', ')}.
Return ONLY a JSON array. No markdown, no explanation, just raw JSON.
Format: [{"category": "Clothing"|"Electronics"|"Documents"|"Toiletries"|"Misc", "item_name": "string"}]
Maximum 20 items. Prioritise the most important items. Consider the destination climate and culture.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini HTTP ${response.status}`);
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Strip markdown code fences if Gemini adds them
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      const items = JSON.parse(cleaned);

      if (!Array.isArray(items) || items.length === 0) throw new Error('Empty response');

      // Normalise: ensure each item has correct fields and valid category
      const validCategories = ['Clothing', 'Electronics', 'Documents', 'Toiletries', 'Misc'];
      const normalised = items.map(i => ({
        category: validCategories.includes(i.category) ? i.category : 'Misc',
        item_name: String(i.item_name || i.name || i.item || '').trim(),
      })).filter(i => i.item_name.length > 0);

      return { items: normalised, usedFallback: false };

    } catch (err) {
      // Gemini failed — fall through to offline template silently
      console.warn('[Gemini] Failed, using offline fallback:', err.message);
    }
  }

  // Offline fallback
  const template = detectTemplate(destinations);
  return { items: FALLBACK_PACKING[template], usedFallback: true };
}
