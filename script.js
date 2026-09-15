/* ================================================================
   MindLens — Application Logic
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
 * Map a score (assumed 0–10 scale) to a color and insight message.
 */
function getScoreInfo(score) {
  if (score <= 3.5) {
    return {
      color: "#10b981", // green
      level: "good",
      message: `A score of ${score} suggests relatively positive mental wellbeing based on the provided inputs. The lifestyle and usage patterns appear balanced.`,
    };
  }
  if (score <= 6.5) {
    return {
      color: "#f59e0b", // amber
      level: "medium",
      message: `A score of ${score} indicates a moderate level of mental health strain. Some factors in the provided inputs may warrant attention.`,
    };
  }
  return {
    color: "#ef4444", // red
    level: "low",
    message: `A score of ${score} suggests elevated mental health strain based on the provided inputs. Multiple lifestyle or usage factors may be contributing.`,
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

  // Initialize bar at 0% before revealing, then expand smoothly
  resultBarFill.style.width           = "0%";
  resultBarFill.style.backgroundColor = info.color;

  // Insight
  resultInsight.textContent = info.message;
  resultInsight.className   = `result__insight result__insight--${info.level}`;

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
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupScrollReveal);
} else {
  setupScrollReveal();
}
