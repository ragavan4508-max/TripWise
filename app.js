// ---------- APIs (no keys needed) ----------
const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const CITIES = [
  ["Paris","FR"], ["London","GB"], ["Rome","IT"], ["Barcelona","ES"], ["Madrid","ES"], ["Amsterdam","NL"],
  ["Berlin","DE"], ["Munich","DE"], ["Vienna","AT"], ["Prague","CZ"], ["Budapest","HU"], ["Lisbon","PT"],
  ["Porto","PT"], ["Athens","GR"], ["Istanbul","TR"], ["Venice","IT"], ["Florence","IT"], ["Milan","IT"],
  ["Edinburgh","GB"], ["Dublin","IE"], ["Copenhagen","DK"], ["Stockholm","SE"], ["Oslo","NO"], ["Helsinki","FI"],
  ["Reykjavik","IS"], ["Zurich","CH"], ["Geneva","CH"], ["Brussels","BE"], ["Warsaw","PL"], ["Krakow","PL"],
  ["Dubrovnik","HR"], ["Split","HR"], ["Seville","ES"], ["Nice","FR"], ["Lyon","FR"], ["Bruges","BE"],
  ["Salzburg","AT"], ["Tallinn","EE"], ["Riga","LV"], ["Vilnius","LT"], ["Bucharest","RO"], ["Sofia","BG"],
  ["Belgrade","RS"], ["Valletta","MT"], ["Tokyo","JP"], ["Kyoto","JP"], ["Osaka","JP"], ["Seoul","KR"],
  ["Busan","KR"], ["Beijing","CN"], ["Shanghai","CN"], ["Hong Kong","HK"], ["Taipei","TW"], ["Bangkok","TH"],
  ["Phuket","TH"], ["Chiang Mai","TH"], ["Hanoi","VN"], ["Ho Chi Minh City","VN"], ["Da Nang","VN"], ["Singapore","SG"],
  ["Kuala Lumpur","MY"], ["Jakarta","ID"], ["Denpasar","ID"], ["Manila","PH"], ["Cebu City","PH"], ["Siem Reap","KH"],
  ["Phnom Penh","KH"], ["Kathmandu","NP"], ["Colombo","LK"], ["Male","MV"], ["Thimphu","BT"], ["Dhaka","BD"],
  ["Chennai","IN"], ["Mumbai","IN"], ["Delhi","IN"], ["Jaipur","IN"], ["Panaji","IN"], ["Kolkata","IN"],
  ["Bengaluru","IN"], ["Hyderabad","IN"], ["Agra","IN"], ["Varanasi","IN"], ["Udaipur","IN"], ["Kochi","IN"],
  ["Madurai","IN"], ["Puducherry","IN"], ["Shimla","IN"], ["Rishikesh","IN"], ["Amritsar","IN"], ["Darjeeling","IN"],
  ["Mysuru","IN"], ["Dubai","AE"], ["Abu Dhabi","AE"], ["Doha","QA"], ["Muscat","OM"], ["Riyadh","SA"],
  ["Jerusalem","IL"], ["Tel Aviv","IL"], ["Amman","JO"], ["Tbilisi","GE"], ["Baku","AZ"], ["Tashkent","UZ"],
  ["Samarkand","UZ"], ["Cairo","EG"], ["Luxor","EG"], ["Marrakech","MA"], ["Casablanca","MA"], ["Tunis","TN"],
  ["Cape Town","ZA"], ["Johannesburg","ZA"], ["Nairobi","KE"], ["Zanzibar","TZ"], ["Arusha","TZ"], ["Accra","GH"],
  ["Lagos","NG"], ["Dakar","SN"], ["Addis Ababa","ET"], ["Kigali","RW"], ["Windhoek","NA"], ["Port Louis","MU"],
  ["New York","US"], ["Los Angeles","US"], ["San Francisco","US"], ["Las Vegas","US"], ["Miami","US"], ["Chicago","US"],
  ["New Orleans","US"], ["Honolulu","US"], ["Seattle","US"], ["Boston","US"], ["Toronto","CA"], ["Vancouver","CA"],
  ["Montreal","CA"], ["Mexico City","MX"], ["Cancun","MX"], ["Havana","CU"], ["Bogota","CO"], ["Cartagena","CO"],
  ["Lima","PE"], ["Cusco","PE"], ["Quito","EC"], ["Rio de Janeiro","BR"], ["Sao Paulo","BR"], ["Buenos Aires","AR"],
  ["Santiago","CL"], ["Montevideo","UY"], ["La Paz","BO"], ["San Jose","CR"], ["Panama City","PA"], ["Sydney","AU"],
  ["Melbourne","AU"], ["Brisbane","AU"], ["Perth","AU"], ["Auckland","NZ"], ["Queenstown","NZ"], ["Wellington","NZ"],
  ["Suva","FJ"], ["Papeete","PF"]
];

// ---------- State ----------
let destinations = [];
let trip = JSON.parse(localStorage.getItem("tripwise-trip") || "[]"); // saved full objects
const $ = (id) => document.getElementById(id);
const grid = $("grid"), statusEl = $("status");
const flag = (cc) => cc ? `https://flagcdn.com/w320/${cc.toLowerCase()}.png` : "";

// ---------- Fetching ----------
async function geoSearch(name, count, cc = "") {
  const res = await fetch(`${GEO}?name=${encodeURIComponent(name)}&count=${count}&language=en${cc ? "&countryCode=" + cc : ""}`);
  if (!res.ok) throw new Error("Server returned " + res.status);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    id: r.id, name: r.name, country: r.country || "Unknown", cc: r.country_code,
    admin1: r.admin1 || "", lat: r.latitude, lon: r.longitude,
    pop: r.population || 0, elev: r.elevation, tz: r.timezone || ""
  }));
}

const LOADER_MS = 3000, pageStart = Date.now();
function hideLoader() {
  const wait = Math.max(0, LOADER_MS - (Date.now() - pageStart));
  setTimeout(() => {
    const l = $("loader");
    l.classList.add("fade");
    setTimeout(() => (l.hidden = true), 500);
  }, wait);
}
let loadToken = 0;
async function loadPopular() {
  const token = ++loadToken;
  const cached = localStorage.getItem("tripwise-cache-v1");
  if (cached) { destinations = JSON.parse(cached); refresh(); hideLoader(); return; }
  destinations = []; grid.innerHTML = "";
  setStatus("Loading destinations…");
  const BATCH = 10;
  for (let i = 0; i < CITIES.length; i += BATCH) {
    const part = CITIES.slice(i, i + BATCH);
    const res = await Promise.all(part.map(([n, cc]) => geoSearch(n, 1, cc).catch(() => [])));
    destinations.push(...res.flat());
    refresh();
    const done = Math.min(i + BATCH, CITIES.length);
    setStatus(`Loading destinations… ${done}/${CITIES.length}`);
  }
  hideLoader();
  if (!destinations.length) return showError(loadPopular);
  if (destinations.length > 100) localStorage.setItem("tripwise-cache-v1", JSON.stringify(destinations));
  refresh();
}

// ---------- Status helpers ----------
function setStatus(msg) { statusEl.className = ""; statusEl.textContent = msg; }
function showError(retryFn) {
  statusEl.className = "error";
  statusEl.textContent = "Could not load destinations. Check your internet connection. ";
  const b = document.createElement("button");
  b.className = "btn"; b.textContent = "Try again"; b.onclick = retryFn;
  statusEl.appendChild(b);
}

// ---------- Filter + sort ----------
function updateCountryFilter() {
  const sel = $("region"), current = sel.value;
  const countries = [...new Set(destinations.map((d) => d.country))].sort();
  sel.innerHTML = `<option value="">All countries</option>` +
    countries.map((c) => `<option>${c}</option>`).join("");
  sel.value = countries.includes(current) ? current : "";
}
function getVisible() {
  const country = $("region").value, sort = $("sort").value;
  const q = $("search").value.trim().toLowerCase();
  const list = destinations.filter((d) =>
    (!country || d.country === country) &&
    (!q || (d.name + " " + d.admin1 + " " + d.country).toLowerCase().includes(q)));
  list.sort((a, b) =>
    sort === "pop-desc" ? b.pop - a.pop :
    sort === "pop-asc" ? a.pop - b.pop :
    a.name.localeCompare(b.name));
  return list;
}
function refresh() { updateCountryFilter(); render(); }
function render() {
  const list = getVisible();
  setStatus(list.length ? `${list.length} destinations` : "");
  grid.innerHTML = list.length ? "" :
    `<div class="empty">No destinations found. Try a different name or country.</div>`;
  list.forEach((d) => grid.appendChild(makeCard(d, false)));
}

// ---------- Cards ----------
const inTrip = (id) => trip.some((t) => t.id === id);
function makeCard(d, isTripView) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <img src="${flag(d.cc)}" alt="Flag of ${d.country}" loading="lazy">
    <div class="info">
      <h3></h3>
      <p>${[d.admin1, d.country].filter(Boolean).join(", ")}</p>
      <p>${d.pop ? "Population: " + d.pop.toLocaleString() : "Population: not available"}</p>
    </div>
    <div class="actions"></div>`;
  card.querySelector("h3").textContent = d.name;
  const actions = card.querySelector(".actions");
  actions.appendChild(button("Details", "btn", () => openDetails(d)));
  actions.appendChild(isTripView
    ? button("Remove", "btn danger", () => removeFromTrip(d.id))
    : button(inTrip(d.id) ? "Added ✓" : "Add", "btn primary", () => addToTrip(d)));
  return card;
}
function button(text, cls, onClick) {
  const b = document.createElement("button");
  b.textContent = text; b.className = cls; b.onclick = onClick;
  return b;
}

// ---------- Itinerary ----------
function saveTrip() {
  localStorage.setItem("tripwise-trip", JSON.stringify(trip));
  $("count").textContent = trip.length;
  render(); renderTrip();
}
function addToTrip(d) { if (!inTrip(d.id)) trip.push(d); saveTrip(); }
function removeFromTrip(id) { trip = trip.filter((t) => t.id !== id); saveTrip(); }
function renderTrip() {
  const box = $("trip-list");
  box.innerHTML = trip.length ? "" :
    `<div class="empty">Your trip is empty. Go to Explore and add some places.</div>`;
  trip.forEach((d) => box.appendChild(makeCard(d, true)));
}

// ---------- Details: Wikipedia description + Open-Meteo weather ----------
async function openDetails(d) {
  $("modal-body").innerHTML = `
    <img src="${flag(d.cc)}" alt="Flag of ${d.country}">
    <h2></h2>
    <p><b>Location:</b> ${[d.admin1, d.country].filter(Boolean).join(", ")}</p>
    <p><b>Coordinates:</b> ${d.lat.toFixed(2)}, ${d.lon.toFixed(2)}</p>
    <p><b>Elevation:</b> ${d.elev != null ? d.elev + " m" : "N/A"}</p>
    <p><b>Time zone:</b> ${d.tz || "N/A"}</p>
    <p id="about">Loading description…</p>
    <p id="weather">Loading weather…</p>
    <button class="btn primary" id="modal-add"></button>`;
  $("modal-body").querySelector("h2").textContent = d.name;
  const addBtn = $("modal-add");
  addBtn.textContent = inTrip(d.id) ? "Remove from trip" : "Add to trip";
  addBtn.onclick = () => {
    inTrip(d.id) ? removeFromTrip(d.id) : addToTrip(d);
    $("modal").hidden = true;
  };
  $("modal").hidden = false;

  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(d.name)}`)
    .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
    .then((w) => ($("about").textContent = w.extract || "No description available."))
    .catch(() => ($("about").textContent = "No description available."));

  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${d.lat}&longitude=${d.lon}&current=temperature_2m,wind_speed_10m`)
    .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
    .then((j) => ($("weather").textContent =
      `Weather now: ${j.current.temperature_2m}°C, wind ${j.current.wind_speed_10m} km/h`))
    .catch(() => ($("weather").textContent = "Weather is unavailable right now."));
}

// ---------- Events ----------
$("search").addEventListener("input", render);
$("region").addEventListener("change", render);
$("sort").addEventListener("change", render);
$("close").onclick = () => ($("modal").hidden = true);
$("modal").onclick = (e) => { if (e.target.id === "modal") $("modal").hidden = true; };
function showTab(name) {
  $("explore").hidden = name !== "explore";
  $("trip").hidden = name !== "trip";
  $("tab-explore").classList.toggle("active", name === "explore");
  $("tab-trip").classList.toggle("active", name === "trip");
  if (name === "trip") renderTrip();
}
$("tab-explore").onclick = () => showTab("explore");
$("tab-trip").onclick = () => showTab("trip");

// ---------- Start ----------
$("count").textContent = trip.length;
loadPopular();
