/* ================================================================
   MindMetrics-AI — Application Logic
   ================================================================ */

// ─── Configuration ───
const API_URL = "https://mindmetric-ai-d3in.onrender.com"; // Change to your deployed API URL

// ─── DOM References ───
const form          = document.getElementById("prediction-form");
const submitBtn     = document.getElementById("submit-btn");
const resetBtn      = document.getElementById("reset-btn");
const formError     = document.getElementById("form-error");
const formErrorText = document.getElementById("form-error-text");
const resultArea    = document.getElementById("result-area");
const resultScore   = document.getElementById("result-score");
const resultBarFill = document.getElementById("result-bar-fill");
const resultInsight = document.getElementById("result-insight");
const newPredBtn    = document.getElementById("new-prediction-btn");
const heroTagline   = document.getElementById("hero-tagline");
const resultBadge   = document.getElementById("result-badge");
const resultTipText = document.getElementById("result-tip-text");

// ─── Dynamic Content Collections ───
const TAGLINES = [
  "Because your screen time already knows too much about you. 👀",
  "Your phone knows your habits. Now let the ML model judge them. 😭",
  "More scrolling, more studying, or somehow both? Let's see what the model thinks. 👀",
  "No therapist was replaced in the making of this prediction.",
  "Your data has entered the chat. 🤖",
  "Let's ask the ML model before we blame the semester. 📚",
];

const MOTIVATIONAL_MESSAGES = [
  "Look at you! Your habits are giving main-character energy. Keep taking care of yourself and don't forget to celebrate the small wins. 🚀",
  "Keep going — future you is already proud. 🚀",
  "Your current habits are looking pretty solid. Keep the streak alive!",
  "Apparently, you're doing something right. Don't let the semester find out. 😎",
  "Small healthy habits today = fewer 'I should've' moments tomorrow.",
  "Great balance! You're proving it's possible to study, sleep, and stay sane. 🌟",
  "Habit score looking strong. Keep protecting your peace and downtime.",
];

const MEDIUM_MESSAGES = [
  "You're somewhere in the middle — basically the 'work in progress' section. 😄 A little more sleep, movement, and screen-time balance could make a difference.",
  "Not bad, not perfect — basically the classic student experience. 😭",
  "You're doing okay. Maybe give your sleep schedule and screen time a little attention.",
  "A few small changes could turn 'I'm surviving' into 'I'm thriving.'",
  "Balance is the goal. Your phone doesn't need to be your roommate.",
  "Solid foundation, but there's room to breathe. Don't let study sprints drain your battery.",
  "Hanging in there well, but remember to recharge before your battery hits 1%. 🔋",
];

const SUPPORTIVE_MESSAGES = [
  "Looks like your current habits may need a little extra care. Take things one step at a time, prioritize sleep and breaks, and talk to someone you trust if you're struggling. You've got this. ❤️",
  "University life is demanding, and burnout is real. Remember that your wellbeing matters far more than any deadline.",
  "Take a deep breath. Today is a great day to pause, recalibrate your routine, and put your health first.",
  "It’s completely okay to ask for support or ease your load. Small, gentle adjustments can make a big difference.",
  "Give yourself some grace. Rest isn't something you have to earn — it's essential fuel. Take care of yourself today. 💙",
  "Every busy season passes, but your health comes first. Give yourself permission to disconnect and rest tonight.",
];

const TIPS = [
  "Try putting your phone away 30 minutes before bed tonight. 📵",
  "Take a 10-minute walk and give your brain a loading screen. 🚶",
  "Drink some water. Your brain isn't running on Wi-Fi. 💧",
  "Take a short study break. Even CPUs need cooling. 🤖",
  "Message a friend. Human connection > endless scrolling. 💬",
  "Stretch your shoulders and unclench your jaw — you're holding tension right now. 🧘",
  "Step outside for 5 minutes of sunlight before diving into your next task. ☀️",
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function initTagline() {
  if (heroTagline) {
    heroTagline.textContent = getRandomItem(TAGLINES);
  }
}

// ─── Field Definitions ───
// Maps field IDs to their validation rules
const FIELDS = {
  age:                     { type: "int",    min: 10,  max: 100, required: true, label: "Age"                   },
  gender:                  { type: "select",                     required: true, label: "Gender"                 },
  country:                 { type: "text",                       required: true, label: "Country"                },
  academic_level:          { type: "select",                     required: true, label: "Academic Level"         },
  most_used_platform:      { type: "select",                     required: true, label: "Most Used Platform"     },
  purpose_of_use:          { type: "select",                     required: true, label: "Purpose of Use"         },
  avg_daily_usage_hours:   { type: "float",  min: 0,   max: 24, required: true, label: "Avg. Daily Usage"       },
  daily_unlocks:           { type: "int",    min: 0,             required: true, label: "Daily Unlocks"          },
  study_hours:             { type: "float",  min: 0,   max: 24, required: true, label: "Study Hours"            },
  physical_activity_hours: { type: "float",  min: 0,   max: 24, required: true, label: "Physical Activity"      },
  sleep_hours_per_night:   { type: "float",  min: 0,   max: 24, required: true, label: "Sleep Hours"            },
  stress_level:            { type: "select",                     required: true, label: "Stress Level"           },
};

// ================================================================
//  Validation
// ================================================================

/**
 * Validate a single field and show/clear its error message.
 * Returns true if valid, false otherwise.
 */
function validateField(id, rule) {
  const el       = document.getElementById(id);
  const errorEl  = document.getElementById(`${id}-error`);
  const value    = el.value.trim();

  // Clear previous state
  el.classList.remove("field__input--invalid");
  errorEl.textContent = "";

  // Required check
  if (rule.required && value === "") {
    setFieldError(el, errorEl, `${rule.label} is required.`);
    return false;
  }

  if (value === "") return true; // optional & empty → ok

  // Numeric checks
  if (rule.type === "int" || rule.type === "float") {
    const num = Number(value);

    if (isNaN(num)) {
      setFieldError(el, errorEl, `${rule.label} must be a number.`);
      return false;
    }

    if (rule.type === "int" && !Number.isInteger(num)) {
      setFieldError(el, errorEl, `${rule.label} must be a whole number.`);
      return false;
    }

    if (rule.min !== undefined && num < rule.min) {
      setFieldError(el, errorEl, `Minimum value is ${rule.min}.`);
      return false;
    }

    if (rule.max !== undefined && num > rule.max) {
      setFieldError(el, errorEl, `Maximum value is ${rule.max}.`);
      return false;
    }
  }

  return true;
}

function setFieldError(inputEl, errorEl, message) {
  inputEl.classList.add("field__input--invalid");
  inputEl.classList.remove("field__input--shake");
  // Force reflow to re-trigger CSS shake animation
  void inputEl.offsetWidth;
  inputEl.classList.add("field__input--shake");
  errorEl.textContent = message;
}

/**
 * Validate all fields. Returns true if every field is valid.
 */
function validateAll() {
  let firstInvalid = null;
  let allValid = true;

  for (const [id, rule] of Object.entries(FIELDS)) {
    const valid = validateField(id, rule);
    if (!valid && !firstInvalid) {
      firstInvalid = document.getElementById(id);
    }
    if (!valid) allValid = false;
  }

  // Scroll first invalid field into view
  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return allValid;
}

// ================================================================
//  Payload Builder
// ================================================================

function buildPayload() {
  return {
    age:                     parseInt(document.getElementById("age").value, 10),
    gender:                  document.getElementById("gender").value,
    country:                 document.getElementById("country").value.trim(),
    academic_level:          document.getElementById("academic_level").value,
    most_used_platform:      document.getElementById("most_used_platform").value,
    purpose_of_use:          document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours:   parseFloat(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks:           parseInt(document.getElementById("daily_unlocks").value, 10),
    study_hours:             parseFloat(document.getElementById("study_hours").value),
    physical_activity_hours: parseFloat(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night:   parseFloat(document.getElementById("sleep_hours_per_night").value),
    stress_level:            document.getElementById("stress_level").value,
  };
}

// ================================================================
//  API Call
// ================================================================

async function predict(payload) {
  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "Something went wrong. Please try again.";
    try {
      const body = await response.json();
      if (body.detail) {
        // FastAPI validation errors come as an array
        if (Array.isArray(body.detail)) {
          detail = body.detail.map(e => e.msg).join(" ");
        } else {
          detail = String(body.detail);
        }
      }
    } catch (_) { /* ignore parse errors */ }
    throw new Error(detail);
  }

  return response.json();
}

// ================================================================
//  Result Rendering
// ================================================================

/**
 * Map a score (0–10 scale) to badge, color, level, and dynamic message.
 * Higher score indicates higher wellbeing.
 */
function getScoreInfo(score) {
  if (score >= 7.0) {
    return {
      badge: "Looking Good 🌱",
      level: "good",
      color: "#10b981", // green
      message: getRandomItem(MOTIVATIONAL_MESSAGES),
    };
  }
  if (score >= 4.0) {
    return {
      badge: "Room to Improve 🌤️",
      level: "medium",
      color: "#f59e0b", // amber
      message: getRandomItem(MEDIUM_MESSAGES),
    };
  }
  return {
    badge: "Take Some Time for Yourself 💙",
    level: "low",
    color: "#3b82f6", // soothing sky blue
    message: getRandomItem(SUPPORTIVE_MESSAGES),
  };
}

/**
 * Animate the score number smoothly from 0 to target score using cubic ease-out.
 */
function animateScoreValue(targetScore, duration = 850) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    resultScore.textContent = targetScore.toFixed(2);
    return;
  }

  const startTime = performance.now();
  const startValue = 0;

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Cubic ease-out
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = startValue + (targetScore - startValue) * easeOut;

    resultScore.textContent = current.toFixed(2);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      resultScore.textContent = targetScore.toFixed(2);
    }
  }

  requestAnimationFrame(step);
}

function showResult(score) {
  const info    = getScoreInfo(score);
  const percent = Math.min(Math.max((score / 10) * 100, 0), 100);

  // Interpretation badge
  if (resultBadge) {
    resultBadge.textContent = info.badge;
    resultBadge.className   = `result__badge result__badge--${info.level}`;
  }

  // Initialize bar at 0% before revealing, then expand smoothly
  resultBarFill.style.width           = "0%";
  resultBarFill.style.backgroundColor = info.color;

  // Dynamic insight message
  resultInsight.textContent = info.message;
  resultInsight.className   = `result__insight result__insight--${info.level}`;

  // One small thing to try
  if (resultTipText) {
    resultTipText.textContent = getRandomItem(TIPS);
  }

  // Show
  resultArea.hidden = false;

  // Animate score counter
  animateScoreValue(score);

  // Smoothly expand bar fill with double-rAF for reliable CSS transition trigger
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resultBarFill.style.width = `${percent}%`;
    });
  });

  // Scroll into view
  resultArea.scrollIntoView({ behavior: "smooth", block: "center" });
}

function hideResult() {
  resultArea.hidden = true;
  resultBarFill.style.width = "0%";
}

// ================================================================
//  UI State Helpers
// ================================================================

function setLoading(isLoading) {
  if (isLoading) {
    submitBtn.classList.add("btn--loading");
    submitBtn.disabled = true;
  } else {
    submitBtn.classList.remove("btn--loading");
    submitBtn.disabled = false;
  }
}

function showFormError(message) {
  formErrorText.textContent = message;
  formError.hidden = false;
}

function hideFormError() {
  formError.hidden = true;
  formErrorText.textContent = "";
}

// ================================================================
//  Event Handlers
// ================================================================

// Live validation — clear error on change
for (const id of Object.keys(FIELDS)) {
  const el = document.getElementById(id);
  el.addEventListener("input", () => {
    const errorEl = document.getElementById(`${id}-error`);
    el.classList.remove("field__input--invalid", "field__input--shake");
    errorEl.textContent = "";
  });
}

// Submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideFormError();
  hideResult();

  if (!validateAll()) return;

  const payload = buildPayload();

  setLoading(true);

  try {
    const data = await predict(payload);
    showResult(data.predicted_mental_health_score);
  } catch (err) {
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      showFormError("Could not reach the server. Please check that the API is running and try again.");
    } else {
      showFormError(err.message || "An unexpected error occurred.");
    }
  } finally {
    setLoading(false);
  }
});

// Reset
resetBtn.addEventListener("click", () => {
  form.reset();
  hideResult();
  hideFormError();

  // Clear all field errors
  for (const id of Object.keys(FIELDS)) {
    const el      = document.getElementById(id);
    const errorEl = document.getElementById(`${id}-error`);
    el.classList.remove("field__input--invalid", "field__input--shake");
    errorEl.textContent = "";
  }
});

// New prediction button
newPredBtn.addEventListener("click", () => {
  hideResult();
  document.getElementById("predictor").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ================================================================
//  Scroll Reveal Animations
// ================================================================

function setupScrollReveal() {
  const targets = document.querySelectorAll(".reveal-on-scroll");
  if (!targets.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

// Initialize on DOM ready
function initApp() {
  initTagline();
  setupScrollReveal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
