const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city");
const countryInput = document.getElementById("country");
const apiKeyInput = document.getElementById("apiKey");
const message = document.getElementById("form-message");
const result = document.getElementById("weather-result");
const submitButton = form.querySelector("button[type='submit']");

const API_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const API_KEY_STORAGE = "weatherly-openweather-key";

apiKeyInput.value = localStorage.getItem(API_KEY_STORAGE) || "";

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();
  const country = countryInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  localStorage.setItem(API_KEY_STORAGE, apiKey);

  if (!apiKey) {
    showMessage("Enter your OpenWeatherMap API key to continue.", true);
    result.innerHTML = emptyState("Add an API key above to fetch live weather data.");
    return;
  }

  if (!city || !country) {
    showMessage("Enter both a city and a country.", true);
    result.innerHTML = emptyState("Both fields are required before searching.");
    return;
  }

  setLoading(true);
  showMessage("Looking up the latest conditions...");

  try {
    const params = new URLSearchParams({
      q: `${city},${country}`,
      appid: apiKey,
      units: "metric"
    });

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(getApiErrorMessage(response.status, data));
    }

    renderWeather(data);
    showMessage(`Showing current weather for ${data.name}, ${data.sys.country}.`);
  } catch (error) {
    result.innerHTML = emptyState(error.message || "Unable to load weather data right now.");
    showMessage(error.message || "Unable to load weather data right now.", true);
  } finally {
    setLoading(false);
  }
});

function renderWeather(data) {
  const weather = data.weather?.[0] || {};
  const iconUrl = weather.icon
    ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
    : "";

  result.classList.remove("is-empty");
  result.innerHTML = `
    <article class="weather-panel">
      <div class="weather-header">
        <div class="location-block">
          <p class="eyebrow">Current weather</p>
          <h2 class="location-name">${escapeHtml(data.name)}, ${escapeHtml(data.sys.country)}</h2>
          <p class="condition-text">${escapeHtml(weather.main || "Unknown")}${weather.description ? ` • ${escapeHtml(toTitleCase(weather.description))}` : ""}</p>
        </div>
        <div class="temp-block">
          ${iconUrl ? `<img class="weather-icon" src="${iconUrl}" alt="${escapeHtml(weather.description || weather.main || "Weather icon")}">` : ""}
          <p class="temperature">${Math.round(data.main.temp)}&deg;C</p>
        </div>
      </div>

      <div class="weather-stats">
        <div class="stat-card">
          <span class="stat-label">Condition</span>
          <span class="stat-value">${escapeHtml(weather.main || "N/A")}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Humidity</span>
          <span class="stat-value">${data.main.humidity}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Wind Speed</span>
          <span class="stat-value">${formatWind(data.wind.speed)}</span>
        </div>
      </div>
    </article>
  `;
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("is-error", isError);
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Loading..." : "Get Weather";
}

function emptyState(text) {
  result.classList.add("is-empty");
  return `
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">+</div>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function getApiErrorMessage(status, data) {
  if (status === 401) {
    return "The API key was rejected. Check it and try again.";
  }

  if (status === 404) {
    return "That location was not found. Try a different city or country.";
  }

  if (data && typeof data.message === "string") {
    return toTitleCase(data.message);
  }

  return "Unable to load weather data right now.";
}

function formatWind(speed) {
  if (typeof speed !== "number") {
    return "N/A";
  }

  return `${speed.toFixed(1)} m/s`;
}

function toTitleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
