const messageInput = document.getElementById("messageInput");
const outputArea = document.getElementById("outputArea");
const cipherMode = document.getElementById("cipherMode");
const keyInput = document.getElementById("keyInput");

const encryptBtn = document.getElementById("encryptBtn");
const decryptBtn = document.getElementById("decryptBtn");
const analyzeBtn = document.getElementById("analyzeBtn");

const entropyText = document.getElementById("entropyText");
const iocText = document.getElementById("iocText");
const familyText = document.getElementById("familyText");

const canvas = document.getElementById("freqChart");
const ctx = canvas.getContext("2d");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function normalizeText(text) {
  return text.toUpperCase().replace(/[^A-Z]/g, "");
}

function shiftChar(ch, shift) {
  const idx = ALPHABET.indexOf(ch);
  if (idx === -1) return ch;
  const next = (idx + shift + 26 * 10) % 26;
  return ALPHABET[next];
}

function caesar(text, shift) {
  return text
    .split("")
    .map((ch) => {
      const upper = ch.toUpperCase();
      const transformed = shiftChar(upper, shift);
      if (!/[A-Z]/.test(upper)) return ch;
      return ch === upper ? transformed : transformed.toLowerCase();
    })
    .join("");
}

function vigenere(text, key, decrypt = false) {
  const normalizedKey = normalizeText(key);
  if (!normalizedKey) return text;

  let k = 0;
  return text
    .split("")
    .map((ch) => {
      const upper = ch.toUpperCase();
      if (!/[A-Z]/.test(upper)) return ch;

      const shift = ALPHABET.indexOf(normalizedKey[k % normalizedKey.length]);
      k += 1;
      const applied = decrypt ? -shift : shift;
      const transformed = shiftChar(upper, applied);
      return ch === upper ? transformed : transformed.toLowerCase();
    })
    .join("");
}

function encrypt() {
  const text = messageInput.value;
  if (cipherMode.value === "caesar") {
    const shift = Number(keyInput.value) || 0;
    outputArea.value = caesar(text, shift);
  } else {
    outputArea.value = vigenere(text, keyInput.value, false);
  }
}

function decrypt() {
  const text = messageInput.value;
  if (cipherMode.value === "caesar") {
    const shift = Number(keyInput.value) || 0;
    outputArea.value = caesar(text, -shift);
  } else {
    outputArea.value = vigenere(text, keyInput.value, true);
  }
}

function frequencyVector(text) {
  const clean = normalizeText(text);
  const counts = Array(26).fill(0);

  for (const ch of clean) {
    counts[ALPHABET.indexOf(ch)] += 1;
  }

  const total = clean.length || 1;
  return counts.map((c) => c / total);
}

function entropy(freq) {
  return freq.reduce((sum, p) => {
    if (p <= 0) return sum;
    return sum - p * Math.log2(p);
  }, 0);
}

function indexOfCoincidence(text) {
  const clean = normalizeText(text);
  const n = clean.length;
  if (n < 2) return 0;

  const counts = Array(26).fill(0);
  for (const ch of clean) counts[ALPHABET.indexOf(ch)] += 1;

  let numerator = 0;
  counts.forEach((c) => {
    numerator += c * (c - 1);
  });

  return numerator / (n * (n - 1));
}

function inferFamily(ent, ioc) {
  if (ioc > 0.06 && ent < 4.05) return "Monoalphabetic-like";
  if (ioc >= 0.045 && ioc <= 0.06 && ent >= 4.1) return "Polyalphabetic-like";
  if (ent > 4.3) return "High-entropy / compressed-like";
  return "Uncertain";
}

function drawFrequencyChart(freq) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#170e0b";
  ctx.fillRect(0, 0, w, h);

  const barW = w / 26;

  for (let i = 0; i < 26; i += 1) {
    const value = freq[i];
    const barH = value * (h - 60) * 6;
    const x = i * barW + 4;
    const y = h - barH - 26;

    ctx.fillStyle = "rgba(255,159,104,0.9)";
    ctx.fillRect(x, y, barW - 8, barH);

    ctx.fillStyle = "#ffd9c8";
    ctx.font = "12px monospace";
    ctx.fillText(ALPHABET[i], x + (barW - 14) / 2, h - 8);
  }
}

function analyze() {
  const text = messageInput.value || outputArea.value;
  const freq = frequencyVector(text);
  const ent = entropy(freq);
  const ioc = indexOfCoincidence(text);

  entropyText.textContent = ent.toFixed(3);
  iocText.textContent = ioc.toFixed(4);
  familyText.textContent = inferFamily(ent, ioc);

  drawFrequencyChart(freq);
}

encryptBtn.addEventListener("click", encrypt);
decryptBtn.addEventListener("click", decrypt);
analyzeBtn.addEventListener("click", analyze);

messageInput.value = "ATTACK AT DAWN. THIS IS A DEMO MESSAGE FOR CRYPTO ANALYSIS.";
analyze();
