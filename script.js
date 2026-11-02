
// ======================================
// 1. CAMPUS LOCATIONS
// ======================================

let locations = [
  "Main Gate",
  "Library",
  "Canteen",
  "CSE Department",
  "AI&ML Lab"
];

// ======================================
// 2. CAMPUS ROADS
// ======================================

let roads = [
  { from: "Main Gate", to: "Library", distance: 100, blocked: false },
  { from: "Main Gate", to: "Canteen", distance: 150, blocked: false },
  { from: "Library", to: "CSE Department", distance: 120, blocked: false },
  { from: "Canteen", to: "CSE Department", distance: 200, blocked: false },
  { from: "CSE Department", to: "AI&ML Lab", distance: 130, blocked: false }
];

const WALKING_SPEED = 80;

// Initial map positions
const mapPositions = {
  "Main Gate": [120, 220],
  "Library": [300, 110],
  "Canteen": [300, 330],
  "CSE Department": [520, 220],
  "AI&ML Lab": [690, 220]
};

// ======================================
// 3. HTML ELEMENTS
// ======================================

const startSelect = document.getElementById("startLocation");
const endSelect = document.getElementById("endLocation");
const connectSelect = document.getElementById("connectLocation");

const routeResult = document.getElementById("routeResult");
const routeError = document.getElementById("routeError");


// ======================================
// 4. SAFE HTML TEXT
// ======================================

function safeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}


// ======================================
// 5. UPDATE DROPDOWNS
// ======================================

function updateDropdowns() {

  const oldStart = startSelect.value;
  const oldEnd = endSelect.value;
  const oldConnect = connectSelect.value;

  const options = locations.map(location =>
    `<option value="${safeText(location)}">${safeText(location)}</option>`
  ).join("");

  startSelect.innerHTML = options;
  endSelect.innerHTML = options;
  connectSelect.innerHTML = options;

  startSelect.value = locations.includes(oldStart)
    ? oldStart : locations[0];

  endSelect.value = locations.includes(oldEnd)
    ? oldEnd : locations[locations.length - 1];

  connectSelect.value = locations.includes(oldConnect)
    ? oldConnect : locations[0];

  if (startSelect.value === endSelect.value && locations.length > 1) {
    endSelect.value = locations[1];
  }
}


// ======================================
// 6. UPDATE STATISTICS
// ======================================

function updateStats() {

  document.getElementById("locationCount").textContent =
    locations.length;

  document.getElementById("roadCount").textContent =
    roads.length;

  document.getElementById("blockedCount").textContent =
    roads.filter(road => road.blocked).length;
}


// ======================================
// 7. MAP POSITION FOR NEW LOCATIONS
// ======================================

function getPosition(location) {

  if (mapPositions[location]) {
    return mapPositions[location];
  }

  const index = locations.indexOf(location);

  // Arrange additional locations in a grid
  const column = index % 3;
  const row = Math.floor(index / 3);

  const x = 170 + column * 230;
  const y = 85 + (row % 2) * 270;

  mapPositions[location] = [x, y];

  return mapPositions[location];
}


// ======================================
// 8. DRAW CAMPUS MAP
// ======================================

function drawCampusMap() {

  const roadLayer = document.getElementById("mapRoads");
  const locationLayer = document.getElementById("mapLocations");

  // Draw roads
  roadLayer.innerHTML = roads.map(road => {

    const start = getPosition(road.from);
    const end = getPosition(road.to);

    return `
      <line
        x1="${start[0]}"
        y1="${start[1]}"
        x2="${end[0]}"
        y2="${end[1]}"
        class="${road.blocked ? "road-line blocked-road" : "road-line"}"
      />

      <text
        x="${(start[0] + end[0]) / 2}"
        y="${(start[1] + end[1]) / 2 - 10}"
        text-anchor="middle"
        fill="#cbd5e1"
        font-size="12">
        ${road.distance}m
      </text>
    `;

  }).join("");


  // Draw location pins
  locationLayer.innerHTML = locations.map((location, index) => {

    const position = getPosition(location);

    const x = position[0];
    const y = position[1];

    const icons = ["🚪", "📚", "🍽️", "🏢", "💻"];
    const icon = icons[index] || "📍";

    return `
      <g class="map-pin" data-location="${safeText(location)}">

        <circle
          cx="${x}"
          cy="${y}"
          r="24"
          fill="#0f766e"
          stroke="#5eead4"
          stroke-width="3"
        />

        <text
          x="${x}"
          y="${y + 6}"
          text-anchor="middle"
          font-size="19">
          ${icon}
        </text>

        <text
          x="${x}"
          y="${y + 44}"
          text-anchor="middle"
          fill="white"
          font-size="12">
          ${safeText(location)}
        </text>

      </g>
    `;

  }).join("");


  drawMapRoute();
}


// ======================================
// 9. MAP PIN CLICK
// ======================================

document.getElementById("campusSvg").addEventListener("click", function(event) {

  const pin = event.target.closest(".map-pin");

  if (!pin) return;

  const location = pin.getAttribute("data-location");

  if (!locations.includes(location)) return;

  endSelect.value = location;

  document.getElementById("mapMessage").textContent =
    "Destination selected: " + location;

  findRoute();
});


// ======================================
// 10. ROAD MANAGEMENT DISPLAY
// ======================================

function displayRoads() {

  const roadList = document.getElementById("roadList");

  roadList.innerHTML = roads.map((road, index) => `

    <div class="bg-slate-900 p-4 rounded-xl flex flex-wrap justify-between items-center gap-3">

      <div>
        <p class="font-semibold text-sm">
          ${safeText(road.from)} ↔ ${safeText(road.to)}
        </p>

        <p class="text-xs text-slate-400 mt-1">
          ${road.distance} metres
        </p>

        <p class="text-xs mt-1 ${road.blocked ? "text-red-300" : "text-teal-300"}">
          ${road.blocked ? "Road Blocked" : "Road Open"}
        </p>
      </div>

      <button
        data-road-index="${index}"
        class="${road.blocked ? "btn" : "btn-secondary"} text-sm">
        ${road.blocked ? "Unblock" : "Block Road"}
      </button>

    </div>

  `).join("");
}


// ======================================
// 11. BLOCK / UNBLOCK ROAD
// ======================================

function toggleRoad(index) {

  roads[index].blocked = !roads[index].blocked;

  refreshPage();
  findRoute();
}

document.getElementById("roadList").addEventListener("click", function(event) {

  const button = event.target.closest("[data-road-index]");

  if (!button) return;

  const index = Number(button.dataset.roadIndex);

  if (Number.isInteger(index) && roads[index]) {
    toggleRoad(index);
  }
});


// ======================================
// 12. DIJKSTRA ALGORITHM
// ======================================

function dijkstra(start, destination) {

  let distances = {};
  let previous = {};
  let visited = new Set();

  locations.forEach(location => {
    distances[location] = Infinity;
    previous[location] = null;
  });

  distances[start] = 0;

  while (visited.size < locations.length) {

    let current = null;
    let smallestDistance = Infinity;

    // Find nearest unvisited location
    for (let location of locations) {

      if (
        !visited.has(location) &&
        distances[location] < smallestDistance
      ) {
        smallestDistance = distances[location];
        current = location;
      }
    }

    if (current === null) break;

    if (current === destination) break;

    visited.add(current);

    // Check connected roads
    roads.forEach(road => {

      if (road.blocked) return;

      let neighbour = null;

      if (road.from === current) {
        neighbour = road.to;
      } else if (road.to === current) {
        neighbour = road.from;
      }

      if (neighbour && !visited.has(neighbour)) {

        const newDistance =
          distances[current] + road.distance;

        if (newDistance < distances[neighbour]) {

          distances[neighbour] = newDistance;
          previous[neighbour] = current;

        }
      }

    });
  }

  if (distances[destination] === Infinity) {
    return null;
  }

  // Reconstruct shortest path
  let path = [];
  let current = destination;

  while (current !== null) {

    path.unshift(current);
    current = previous[current];

  }

  return {
    path: path,
    distance: distances[destination]
  };
}


// ======================================
// 13. DRAW ROUTE ON MAP
// ======================================

function drawMapRoute() {

  const routeLayer = document.getElementById("mapRoute");

  if (!routeLayer) return;

  const start = startSelect.value;
  const destination = endSelect.value;

  const result = dijkstra(start, destination);

  if (!result) {
    routeLayer.innerHTML = "";
    return;
  }

  const points = result.path.map(location => {

    const position = getPosition(location);

    return position.join(",");

  }).join(" ");

  routeLayer.innerHTML = `
    <polyline
      points="${points}"
      class="route-line"
    />
  `;

  // Highlight route pins
  document.querySelectorAll(".map-pin circle").forEach(circle => {
    circle.setAttribute("fill", "#0f766e");
  });

  result.path.forEach(location => {

    const pin = [...document.querySelectorAll(".map-pin")]
      .find(item => item.getAttribute("data-location") === location);

    if (pin) {
      pin.querySelector("circle").setAttribute("fill", "#0d9488");
    }

  });
}


// ======================================
// 14. FIND SHORTEST ROUTE
// ======================================

function findRoute() {

  const start = startSelect.value;
  const destination = endSelect.value;

  routeResult.classList.add("hidden");
  routeError.classList.add("hidden");

  if (!start || !destination) return;

  if (start === destination) {

    routeError.textContent =
      "Please select two different locations.";

    routeError.classList.remove("hidden");

    drawCampusMap();
    return;
  }

  const result = dijkstra(start, destination);

  if (!result) {

    routeError.textContent =
      "No route available! The connecting roads may be blocked.";

    routeError.classList.remove("hidden");

    drawCampusMap();
    return;
  }

  const time = result.distance / WALKING_SPEED;

  document.getElementById("routePath").textContent =
    result.path.join(" → ");

  document.getElementById("routeDistance").textContent =
    result.distance + " m";

  document.getElementById("routeTime").textContent =
    time.toFixed(1) + " minutes";

  routeResult.classList.remove("hidden");

  drawCampusMap();
}


// ======================================
// 15. ADD NEW LOCATION
// ======================================

function addNewLocation() {

  const name =
    document.getElementById("newLocation").value.trim();

  const connectTo = connectSelect.value;

  const distance =
    Number(document.getElementById("newDistance").value);

  const message =
    document.getElementById("addMessage");

  message.className = "text-sm mt-3";

  if (!name) {

    message.textContent = "Please enter a location name.";
    message.classList.add("text-red-300");
    return;

  }

  if (locations.some(location =>
    location.toLowerCase() === name.toLowerCase()
  )) {

    message.textContent = "This location already exists.";
    message.classList.add("text-red-300");
    return;

  }

  if (!connectTo) {

    message.textContent = "Please select a connected location.";
    message.classList.add("text-red-300");
    return;

  }

  if (!Number.isFinite(distance) || distance <= 0) {

    message.textContent =
      "Enter a valid distance greater than zero.";

    message.classList.add("text-red-300");
    return;

  }

  // Add location and connecting road
  locations.push(name);

  roads.push({
    from: name,
    to: connectTo,
    distance: distance,
    blocked: false
  });

  // Assign map position
  getPosition(name);

  document.getElementById("newLocation").value = "";
  document.getElementById("newDistance").value = "";

  updateDropdowns();
  refreshPage();

  message.textContent = name + " added successfully!";
  message.classList.add("text-teal-300");

  // Select new location as destination
  endSelect.value = name;

  findRoute();
}


// ======================================
// 16. RESET ROADS
// ======================================

function resetRoads() {

  roads.forEach(road => {
    road.blocked = false;
  });

  refreshPage();
  findRoute();
}


// ======================================
// 17. REFRESH WEBSITE
// ======================================

function refreshPage() {

  updateStats();
  displayRoads();
  drawCampusMap();

}


// ======================================
// 18. BUTTON EVENTS
// ======================================

document.getElementById("findRoute")
  .addEventListener("click", findRoute);

document.getElementById("addLocation")
  .addEventListener("click", addNewLocation);

document.getElementById("resetRoads")
  .addEventListener("click", resetRoads);

startSelect.addEventListener("change", findRoute);
endSelect.addEventListener("change", findRoute);


// ======================================
// 19. INITIALIZE WEBSITE
// ======================================

updateDropdowns();
refreshPage();
findRoute();
