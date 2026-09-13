import { useState } from 'react';

const COMMON_LANGUAGES = ['English', 'Filipino', 'Bikol Naga', 'Rinconada Bikol'];

export default function TranslationPanel({
  entryId,
  initialTranslation = null,
  initialLanguage = null,
  translateEntry = async () => ({ entry: { translated_content: '(preview) translated text', translated_language: 'English' } }),
}) {
  const [targetLanguage, setTargetLanguage] = useState(initialLanguage || COMMON_LANGUAGES[0]);
  const [translation, setTranslation] = useState(initialTranslation);
  const [translatedLanguage, setTranslatedLanguage] = useState(initialLanguage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleTranslate() {
    setLoading(true);
    setError(null);
    try {
      const { entry } = await translateEntry(entryId, targetLanguage);
      setTranslation(entry.translated_content);
      setTranslatedLanguage(entry.translated_language);
    } catch (err) {
      setError(err.response?.data?.message || 'Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Translate for review</h3>

      <div className="flex items-center gap-2 mb-4">
        <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="border border-gray-300 rounded-md px-2.5 py-1.5 text-sm flex-1">
          {COMMON_LANGUAGES.map((lang) => <option key={lang} value={lang}>{lang}</option>)}
        </select>
        <button onClick={handleTranslate} disabled={loading} className="px-3 py-1.5 bg-blue-900 text-white text-sm rounded-md hover:bg-blue-800 disabled:opacity-50">
          {loading ? 'Translating…' : 'Translate'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {translation && (
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-500 mb-1.5">Translated to {translatedLanguage}</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{translation}</p>
        </div>
      )}

      {!translation && !loading && (
        <p className="text-xs text-gray-400">No translation yet. Pick a language and translate to help review this entry.</p>
      )}
    </div>
  );
}