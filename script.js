/* ==========================================================================
   MindMetric-AI — script.js
   Handles: mobile nav, scroll-reveal, form validation, API call, result render
   ========================================================================== */

// Backend base URL — change this single value when deploying.
const API_URL = "https://mindmetric-ai-d3in.onrender.com";

/* ---------------------------------------------------------------------- */
/* Mobile navigation                                                      */
/* ---------------------------------------------------------------------- */
(function initNav() {
  const hamburger = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");

  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    hamburger.classList.toggle("is-open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      hamburger.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
})();

/* ---------------------------------------------------------------------- */
/* Scroll reveal (single, restrained fade-in on entry)                    */
/* ---------------------------------------------------------------------- */
(function initReveal() {
  const targets = document.querySelectorAll(".fade-in");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((el) => observer.observe(el));
})();

/* ---------------------------------------------------------------------- */
/* Toast helper                                                           */
/* ---------------------------------------------------------------------- */
let toastTimer = null;
function showToast(message, type = "error") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.toggle("is-error", type === "error");
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 5000);
}

/* ---------------------------------------------------------------------- */
/* Validation rules — mirrors the FastAPI Pydantic constraints exactly    */
/* ---------------------------------------------------------------------- */
const RULES = {
  age: { type: "number", min: 10, max: 100, label: "Age" },
  gender: { type: "select", label: "Gender" },
  country: { type: "text", label: "Country" },
  academic_level: { type: "select", label: "Academic level" },
  most_used_platform: { type: "select", label: "Most used platform" },
  purpose_of_use: { type: "select", label: "Purpose of use" },
  avg_daily_usage_hours: { type: "number", min: 0, max: 24, label: "Average daily usage hours" },
  daily_unlocks: { type: "number", min: 0, max: Infinity, label: "Daily unlocks" },
  study_hours: { type: "number", min: 0, max: 24, label: "Study hours" },
  physical_activity_hours: { type: "number", min: 0, max: 24, label: "Physical activity hours" },
  sleep_hours_per_night: { type: "number", min: 0, max: 24, label: "Sleep hours per night" },
  stress_level: { type: "select", label: "Stress level" },
};

function clearFieldError(name) {
  const field = document.getElementById(name).closest(".field");
  const errorEl = field.querySelector(`[data-error-for="${name}"]`);
  field.classList.remove("has-error");
  errorEl.textContent = "";
}

function setFieldError(name, message) {
  const field = document.getElementById(name).closest(".field");
  const errorEl = field.querySelector(`[data-error-for="${name}"]`);
  field.classList.add("has-error");
  errorEl.textContent = message;
}

/**
 * Validates the whole form against RULES.
 * Returns { valid: boolean, data: object|null }
 */
function validateForm(form) {
  let valid = true;
  const data = {};

  Object.entries(RULES).forEach(([name, rule]) => {
    clearFieldError(name);
    const el = form.elements[name];
    const rawValue = el.value.trim();

    if (rawValue === "") {
      setFieldError(name, `${rule.label} is required.`);
      valid = false;
      return;
    }

    if (rule.type === "number") {
      const num = Number(rawValue);
      if (Number.isNaN(num)) {
        setFieldError(name, `${rule.label} must be a number.`);
        valid = false;
        return;
      }
      if (num < rule.min || num > rule.max) {
        const maxLabel = rule.max === Infinity ? "" : ` and ${rule.max}`;
        setFieldError(name, `${rule.label} must be between ${rule.min}${maxLabel}.`);
        valid = false;
        return;
      }
      data[name] = name === "daily_unlocks" ? Math.round(num) : num;
    } else {
      data[name] = rawValue;
    }
  });

  return { valid, data };
}

/* ---------------------------------------------------------------------- */
/* Score ring + interpretation                                            */
/* ---------------------------------------------------------------------- */
const RING_CIRCUMFERENCE = 2 * Math.PI * 86; // r = 86

function interpretScore(score) {
  // A single monochrome stroke color keeps the ring consistent with the
  // black & white theme — the tier is communicated through the label text,
  // not through color-coding.
  if (score >= 8) {
    return {
      tag: "Excellent",
      color: "#111111",
      message: "Your predicted score indicates a generally positive mental-health profile based on the information provided.",
    };
  }
  if (score >= 6) {
    return {
      tag: "Good",
      color: "#111111",
      message: "Your predicted score indicates a generally positive mental-health profile based on the information provided.",
    };
  }
  if (score >= 4) {
    return {
      tag: "Moderate",
      color: "#111111",
      message: "Your predicted score suggests some areas of your lifestyle may deserve additional attention.",
    };
  }
  return {
    tag: "Needs attention",
    color: "#111111",
    message: "Your predicted score suggests that some lifestyle or stress-related factors may need attention. Consider speaking with a qualified professional if you are concerned.",
  };
}

function animateRing(score) {
  const progress = document.getElementById("scoreRingProgress");
  const clamped = Math.max(0, Math.min(10, score));
  const offset = RING_CIRCUMFERENCE * (1 - clamped / 10);
  const { color } = interpretScore(score);
  progress.style.stroke = color;
  // reset then animate
  progress.style.transition = "none";
  progress.style.strokeDasharray = String(RING_CIRCUMFERENCE);
  progress.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
  // force reflow before enabling transition
  // eslint-disable-next-line no-unused-expressions
  progress.getBoundingClientRect();
  progress.style.transition = "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)";
  requestAnimationFrame(() => {
    progress.style.strokeDashoffset = String(offset);
  });
}

function animateCounter(el, target, duration = 1100) {
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = (target * eased).toFixed(1);
    el.textContent = value;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = target.toFixed(2);
  }
  requestAnimationFrame(tick);
}

const SUMMARY_FIELDS = [
  { key: "age", label: "Age" },
  { key: "academic_level", label: "Academic Level" },
  { key: "most_used_platform", label: "Social Platform" },
  { key: "avg_daily_usage_hours", label: "Daily Usage" },
  { key: "study_hours", label: "Study Hours" },
  { key: "physical_activity_hours", label: "Physical Activity" },
  { key: "sleep_hours_per_night", label: "Sleep" },
  { key: "stress_level", label: "Stress Level" },
];

function renderSummary(data) {
  const grid = document.getElementById("summaryGrid");
  grid.innerHTML = "";
  SUMMARY_FIELDS.forEach(({ key, label }) => {
    const item = document.createElement("div");
    item.className = "summary-item";
    const unit = ["avg_daily_usage_hours", "study_hours", "physical_activity_hours", "sleep_hours_per_night"].includes(key) ? " hrs" : "";
    item.innerHTML = `<span>${label}</span><strong>${data[key]}${unit}</strong>`;
    grid.appendChild(item);
  });
}

function renderResult(score, data) {
  const placeholder = document.getElementById("resultPlaceholder");
  const content = document.getElementById("resultContent");
  placeholder.hidden = true;
  content.hidden = false;

  const { tag, message } = interpretScore(score);
  document.getElementById("scoreTag").textContent = tag;
  document.getElementById("insightText").textContent = message;

  animateRing(score);
  animateCounter(document.getElementById("scoreValue"), score);
  renderSummary(data);

  document.getElementById("resultCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------------------------------------------------------------- */
/* Form submission                                                        */
/* ---------------------------------------------------------------------- */
let isSubmitting = false;

async function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting) return;

  const form = event.target;
  const apiNote = document.getElementById("apiNote");
  apiNote.classList.remove("is-visible");
  apiNote.textContent = "";

  const { valid, data } = validateForm(form);
  if (!valid) {
    const firstError = form.querySelector(".has-error input, .has-error select");
    if (firstError) firstError.focus({ preventScroll: false });
    return;
  }

  const button = document.getElementById("predictBtn");
  const loadingText = document.getElementById("loadingText");

  isSubmitting = true;
  button.disabled = true;
  button.classList.add("is-loading");
  loadingText.classList.add("is-visible");

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let detail = "The prediction server returned an error. Please check your input and try again.";
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.detail) {
          detail = typeof errorBody.detail === "string" ? errorBody.detail : "Please check your input and try again.";
        }
      } catch (_) {
        /* response had no JSON body */
      }
      throw new Error(detail);
    }

    const result = await response.json();
    if (typeof result.predicted_mental_health_score !== "number") {
      throw new Error("Received an unexpected response from the prediction server.");
    }

    renderResult(result.predicted_mental_health_score, data);
  } catch (err) {
    if (err instanceof TypeError) {
      // fetch network failure — server unreachable / CORS / offline
      apiNote.textContent = "Unable to connect to the prediction server. Please make sure the FastAPI server is running.";
    } else {
      apiNote.textContent = err.message || "Something went wrong while generating your score. Please try again.";
    }
    apiNote.classList.add("is-visible");
    showToast(apiNote.textContent, "error");
  } finally {
    isSubmitting = false;
    button.disabled = false;
    button.classList.remove("is-loading");
    loadingText.classList.remove("is-visible");
  }
}

document.getElementById("predictForm").addEventListener("submit", handleSubmit);

// Clear individual field errors as the user corrects them.
document.querySelectorAll("#predictForm input, #predictForm select").forEach((el) => {
  el.addEventListener("input", () => clearFieldError(el.name));
  el.addEventListener("change", () => clearFieldError(el.name));
});
