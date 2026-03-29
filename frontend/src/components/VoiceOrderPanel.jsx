import { useEffect, useMemo, useRef, useState } from 'react';
import { Languages, Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';

const LANGUAGE_OPTIONS = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'te-IN', label: 'Telugu' },
];

const LANGUAGE_REPLACEMENTS = {
  'hi-IN': [
    ['\u091c\u094b\u095c\u094b', 'add'],
    ['\u091c\u094b\u095c \u0926\u094b', 'add'],
    ['\u0921\u093e\u0932\u094b', 'add'],
    ['\u0939\u091f\u093e\u0913', 'remove'],
    ['\u0928\u093f\u0915\u093e\u0932\u094b', 'remove'],
    ['\u0915\u0949\u092b\u0940', 'coffee'],
    ['\u091a\u093e\u092f', 'tea'],
    ['\u091a\u093f\u0915\u0928', 'chicken'],
    ['\u092c\u093f\u0930\u092f\u093e\u0928\u0940', 'biryani'],
    ['\u092a\u093f\u091c\u094d\u091c\u093e', 'pizza'],
    ['\u0935\u0947\u091c', 'veg'],
    ['\u090f\u0915', '1'],
    ['\u0926\u094b', '2'],
    ['\u0924\u0940\u0928', '3'],
    ['\u091a\u093e\u0930', '4'],
    ['\u092a\u093e\u0901\u091a', '5'],
    ['\u091b\u0939', '6'],
    ['\u0938\u093e\u0924', '7'],
    ['\u0906\u0920', '8'],
    ['\u0928\u094c', '9'],
    ['\u0926\u0938', '10'],
  ],
  'te-IN': [
    ['\u0c15\u0c3e\u0c35\u0c3e\u0c32\u0c3f', 'add'],
    ['\u0c1c\u0c4b\u0c21\u0c3f\u0c02\u0c1a\u0c41', 'add'],
    ['\u0c15\u0c32\u0c2a\u0c02\u0c21\u0c3f', 'add'],
    ['\u0c2a\u0c46\u0c1f\u0c4d\u0c1f\u0c41', 'add'],
    ['\u0c2f\u0c3e\u0c21\u0c4d \u0c1a\u0c47\u0c2f\u0c3f', 'add'],
    ['\u0c24\u0c40\u0c38\u0c3f\u0c35\u0c47\u0c2f\u0c3f', 'remove'],
    ['\u0c24\u0c40\u0c38\u0c46\u0c2f\u0c3f', 'remove'],
    ['\u0c24\u0c40\u0c38\u0c3f\u0c35\u0c47\u0c2f\u0c02\u0c21\u0c3f', 'remove'],
    ['\u0c24\u0c40\u0c38\u0c47\u0c2f\u0c02\u0c21\u0c3f', 'remove'],
    ['\u0c15\u0c3e\u0c2b\u0c40', 'coffee'],
    ['\u0c1f\u0c40', 'tea'],
    ['\u0c1a\u0c3f\u0c15\u0c46\u0c28\u0c4d', 'chicken'],
    ['\u0c2c\u0c3f\u0c30\u0c4d\u0c2f\u0c3e\u0c28\u0c40', 'biryani'],
    ['\u0c2a\u0c3f\u0c1c\u0c4d\u0c1c\u0c3e', 'pizza'],
    ['\u0c35\u0c46\u0c1c\u0c4d', 'veg'],
    ['\u0c12\u0c15\u0c1f\u0c3f', '1'],
    ['\u0c30\u0c46\u0c02\u0c21\u0c41', '2'],
    ['\u0c2e\u0c42\u0c21\u0c41', '3'],
    ['\u0c28\u0c3e\u0c32\u0c41\u0c17\u0c41', '4'],
    ['\u0c10\u0c26\u0c41', '5'],
    ['\u0c06\u0c30\u0c41', '6'],
    ['\u0c0f\u0c21\u0c41', '7'],
    ['\u0c0e\u0c28\u0c3f\u0c2e\u0c3f\u0c26\u0c3f', '8'],
    ['\u0c24\u0c4a\u0c2e\u0c4d\u0c2e\u0c3f\u0c26\u0c3f', '9'],
    ['\u0c2a\u0c26\u0c3f', '10'],
  ],
};

const ACTION_SYNONYMS = {
  add: [
    'add',
    'include',
    'need',
    'want',
    'with',
    'kavali',
    'kaavali',
    'jodo',
    'jod do',
    'dalo',
    'add chey',
    'yaad cheyi',
    'kalapandi',
    'pettu',
  ],
  remove: [
    'remove',
    'delete',
    'cancel',
    'minus',
    'hatado',
    'nikalo',
    'teesei',
    'teesey',
    'teesey',
    'teesiveyi',
    'theesey',
    'theesiveyi',
  ],
};

const NUMBER_WORDS = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  chaar: 4,
  paanch: 5,
  chey: 1,
  oka: 1,
  okati: 1,
  rendu: 2,
  moodu: 3,
  nalugu: 4,
  aidu: 5,
  aaru: 6,
  edu: 7,
  enimidi: 8,
  tommidi: 9,
  padi: 10,
};

const STOP_WORDS = new Set([
  'please',
  'to',
  'the',
  'cart',
  'order',
  'item',
  'items',
  'plate',
  'plates',
  'and',
  'ka',
  'ki',
  'ko',
  'ni',
  'nu',
  'naaku',
  'naku',
  'kavali',
  'kaavali',
]);

const COMMAND_EXAMPLES = {
  'en-IN': [
    'Add 2 chicken biryani',
    'Remove 1 coffee',
  ],
  'hi-IN': [
    '2 chicken biryani jodo',
    '1 coffee hatao',
  ],
  'te-IN': [
    '2 chicken biryani add chey',
    'oka coffee teesey',
  ],
};

const normalizeText = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getSpeechRecognition = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const applyLanguageReplacements = (value, language) => {
  const replacements = LANGUAGE_REPLACEMENTS[language] || [];
  return replacements.reduce(
    (result, [source, target]) => result.replaceAll(normalizeText(source), target),
    normalizeText(value)
  );
};

const getActionFromText = (value) => {
  const normalized = normalizeText(value);

  if (ACTION_SYNONYMS.remove.some((word) => normalized.includes(word))) {
    return 'remove';
  }

  if (ACTION_SYNONYMS.add.some((word) => normalized.includes(word))) {
    return 'add';
  }

  return null;
};

const extractQuantity = (tokens) => {
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      return Number(token);
    }

    if (NUMBER_WORDS[token]) {
      return NUMBER_WORDS[token];
    }
  }

  return 1;
};

const buildNameTokens = (tokens) =>
  tokens.filter(
    (token) =>
      !ACTION_SYNONYMS.add.includes(token) &&
      !ACTION_SYNONYMS.remove.includes(token) &&
      !NUMBER_WORDS[token] &&
      !/^\d+$/.test(token) &&
      !STOP_WORDS.has(token)
  );

const scoreMenuItem = (itemName, query) => {
  const normalizedItem = normalizeText(itemName);
  const normalizedQuery = normalizeText(query);
  const itemTokens = normalizedItem.split(' ');
  const queryTokens = normalizedQuery.split(' ');

  let score = 0;

  queryTokens.forEach((queryToken) => {
    if (!queryToken) return;

    if (itemTokens.includes(queryToken)) {
      score += 4;
      return;
    }

    if (
      itemTokens.some(
        (itemToken) => itemToken.startsWith(queryToken) || queryToken.startsWith(itemToken)
      )
    ) {
      score += 2.5;
      return;
    }

    if (normalizedItem.includes(queryToken)) {
      score += 2;
    }
  });

  if (normalizedItem === normalizedQuery) {
    score += 6;
  } else if (normalizedItem.includes(normalizedQuery)) {
    score += 3;
  }

  return score;
};

const parseVoiceCommand = (rawText, language) => {
  const localizedText = applyLanguageReplacements(rawText, language);
  const tokens = localizedText.split(' ').filter(Boolean);
  const action = getActionFromText(localizedText);
  const quantity = extractQuantity(tokens);
  const item = buildNameTokens(tokens).join(' ').trim();

  if (!action || !item) {
    return null;
  }

  return {
    action,
    quantity,
    item,
    transcript: rawText,
  };
};

export default function VoiceOrderPanel({ items, onCommand }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('info');
  const [suggestions, setSuggestions] = useState([]);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
  }, []);

  useEffect(() => () => recognitionRef.current?.stop?.(), []);

  const canSpeakBack = useMemo(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
    []
  );
  const examples = COMMAND_EXAMPLES[selectedLanguage] || COMMAND_EXAMPLES['en-IN'];

  const speak = (message) => {
    if (!canSpeakBack || !message) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.98;
    window.speechSynthesis.speak(utterance);
  };

  const resolveMatches = (query) =>
    items
      .map((item) => ({
        item,
        score:
          scoreMenuItem(item.name || '', query) +
          scoreMenuItem(item.description || '', query) * 0.35,
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);

  const processTranscript = (nextTranscript) => {
    setTranscript(nextTranscript);
    setSuggestions([]);

    const parsed = parseVoiceCommand(nextTranscript, selectedLanguage);

    if (!parsed) {
      setFeedbackType('warning');
      setFeedback('Sorry, please try again with a command like "Add 2 chicken biryani".');
      return;
    }

    const matches = resolveMatches(parsed.item);

    if (!matches.length || matches[0].score <= 0) {
      setSuggestions(matches.filter((entry) => entry.score > 0).map((entry) => entry.item));
      setFeedbackType('warning');
      setFeedback(`We couldn't find "${parsed.item}". Try again with the menu item name.`);
      return;
    }

    const [bestMatch, ...restMatches] = matches;

    if (matches.length > 1 && bestMatch.score - (restMatches[0]?.score ?? 0) < 1.5) {
      setSuggestions(matches.map((entry) => entry.item));
      setFeedbackType('info');
      setFeedback(`Did you mean ${matches.map((entry) => entry.item.name).join(', ')}?`);
      return;
    }

    const result = onCommand({
      ...parsed,
      matchedItem: bestMatch.item,
      alternatives: restMatches.map((entry) => entry.item),
    });

    setSuggestions(result?.suggestions || []);
    setFeedbackType(result?.type || 'success');
    setFeedback(result?.message || 'Voice command processed.');

    if (result?.speak) {
      speak(result.message);
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setFeedbackType('warning');
      setFeedback('Voice ordering is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop?.();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setFeedbackType('info');
      setFeedback('Listening for your order...');
      setSuggestions([]);
    };

    recognition.onresult = (event) => {
      const combined = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      setTranscript(combined);

      if (event.results[event.results.length - 1]?.isFinal) {
        processTranscript(combined);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setFeedbackType('warning');
      setFeedback('Sorry, please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="w-full max-w-[838px] rounded-[28px] border border-white/[0.05] bg-[#1A1715]/95 p-5 shadow-[0_22px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={18} className="text-[#FF8C2B]" />
            <h3 className="text-[18px] font-semibold">Voice Ordering</h3>
          </div>
          <p className="mt-1 text-[14px] leading-6 text-[#A1A1AA]">
            {selectedLanguage === 'te-IN'
              ? 'Try simple Telugu-English commands like "2 chicken biryani add chey" or "oka coffee teesey".'
              : 'Say things like "Add 2 chicken biryani" or "Remove one coffee".'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Languages
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8379]"
            />
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
              className="h-11 rounded-full border border-white/[0.06] bg-[#231F1B] pl-10 pr-4 text-sm font-medium text-white outline-none transition-colors focus:border-[#FF8C2B]/35"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#1A1715] text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleMicClick}
            className={`relative inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition-all ${
              isListening
                ? 'bg-[#FF5E00] shadow-[0_0_0_8px_rgba(255,94,0,0.10),0_18px_36px_rgba(255,94,0,0.28)]'
                : 'bg-[#FF8C2B] shadow-[0_14px_30px_rgba(255,140,43,0.22)] hover:-translate-y-0.5 hover:brightness-105'
            } ${!supported ? 'cursor-not-allowed opacity-50' : ''}`}
            disabled={!supported}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            {isListening ? 'Stop Listening' : 'Start Voice'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example) => (
          <div
            key={example}
            className="rounded-full border border-white/[0.06] bg-[#2A2520] px-4 py-2 text-sm text-[#D9D2CB]"
          >
            {example}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[22px] border border-white/[0.05] bg-[#221E1A] p-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#8C8379]">
          <Volume2 size={14} />
          Live Transcript
        </div>
        <p className="mt-3 min-h-[28px] text-[15px] leading-7 text-white/90">
          {transcript || 'Tap the microphone and speak your order.'}
        </p>
      </div>

      <div
        className={`mt-4 rounded-[20px] border px-4 py-3 text-[14px] leading-6 ${
          feedbackType === 'success'
            ? 'border-emerald-500/15 bg-emerald-500/8 text-emerald-200'
            : feedbackType === 'warning'
              ? 'border-amber-500/15 bg-amber-500/8 text-amber-100'
              : 'border-white/[0.05] bg-white/[0.02] text-[#D6CEC6]'
        }`}
      >
        {feedback || 'Choose a language and use your voice to add or remove items.'}
      </div>

      {suggestions.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((item) => (
            <div
              key={item._id}
              className="rounded-full border border-white/[0.06] bg-[#2A2520] px-4 py-2 text-sm text-white"
            >
              {item.name}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
