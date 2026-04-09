const jobseekers = [
  { name: "김민수", job: "백엔드", experience: "4-7년", education: "학사", region: "서울", district: "강남구", lat: 37.4979, lng: 127.0276, skills: ["Java", "Spring", "MySQL"] },
  { name: "박지현", job: "프론트엔드", experience: "1-3년", education: "학사", region: "서울", district: "마포구", lat: 37.5563, lng: 126.9086, skills: ["React", "TypeScript", "Figma"] },
  { name: "이도윤", job: "데이터분석", experience: "신입", education: "석사 이상", region: "서울", district: "서초구", lat: 37.4836, lng: 127.0327, skills: ["Python", "Pandas", "SQL"] },
  { name: "최유진", job: "웹개발", experience: "8년+", education: "학사", region: "경기", district: "분당구", lat: 37.3826, lng: 127.1187, skills: ["Node.js", "AWS", "MongoDB"] },
  { name: "정하늘", job: "백엔드", experience: "1-3년", education: "전문학사", region: "경기", district: "영통구", lat: 37.2594, lng: 127.0465, skills: ["Kotlin", "Spring", "Redis"] },
  { name: "한예린", job: "디자인", experience: "4-7년", education: "학사", region: "인천", district: "연수구", lat: 37.4103, lng: 126.6788, skills: ["UX", "UI", "Prototyping"] },
  { name: "윤태경", job: "프론트엔드", experience: "4-7년", education: "학사", region: "인천", district: "부평구", lat: 37.5071, lng: 126.7218, skills: ["Vue", "Nuxt", "Pinia"] },
  { name: "오지후", job: "데이터분석", experience: "1-3년", education: "학사", region: "대전", district: "유성구", lat: 36.3622, lng: 127.3568, skills: ["R", "Python", "Tableau"] },
  { name: "배소민", job: "백엔드", experience: "8년+", education: "석사 이상", region: "대구", district: "수성구", lat: 35.8582, lng: 128.6306, skills: ["Go", "gRPC", "PostgreSQL"] },
  { name: "송현우", job: "웹개발", experience: "신입", education: "학사", region: "부산", district: "해운대구", lat: 35.1632, lng: 129.1636, skills: ["JavaScript", "HTML", "CSS"] },
  { name: "노서연", job: "프론트엔드", experience: "1-3년", education: "학사", region: "부산", district: "부산진구", lat: 35.1628, lng: 129.0532, skills: ["React", "Next.js", "Sass"] },
  { name: "임가은", job: "디자인", experience: "신입", education: "전문학사", region: "광주", district: "북구", lat: 35.174, lng: 126.9111, skills: ["Illustrator", "Photoshop", "Figma"] },
  { name: "권시우", job: "백엔드", experience: "4-7년", education: "학사", region: "서울", district: "송파구", lat: 37.5145, lng: 127.1059, skills: ["Python", "Django", "Docker"] },
  { name: "서지민", job: "데이터분석", experience: "8년+", education: "석사 이상", region: "경기", district: "고양시", dong: "장항동", lat: 37.6584, lng: 126.7789, skills: ["ML", "Spark", "Airflow"] },
  { name: "황준호", job: "웹개발", experience: "1-3년", education: "학사", region: "대전", district: "서구", lat: 36.3553, lng: 127.3835, skills: ["React", "Node.js", "Firebase"] }
];

const keywordEl = document.getElementById("keyword");
const jobEl = document.getElementById("job");
const experienceEl = document.getElementById("experience");
const educationEl = document.getElementById("education");
const regionEl = document.getElementById("region");
const resetBtn = document.getElementById("resetBtn");
const listEl = document.getElementById("list");
const countEl = document.getElementById("count");
const regionSummaryEl = document.getElementById("regionSummary");
const radiusStatsEl = document.getElementById("radiusStats");
const employerAddressEl = document.getElementById("employerAddress");

const employerLocation = {
  name: "로그인 사업장",
  address: "서울특별시 강남구 테헤란로",
  lat: 37.4981,
  lng: 127.0276
};

const map = L.map("map", { zoomControl: true }).setView([36.45, 127.9], 7);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const circleLayerGroup = L.layerGroup().addTo(map);
const radiusLayerGroup = L.layerGroup().addTo(map);
let employerMarker = null;

function formatAddressArea(person) {
  if (person.district.endsWith("시") && person.dong) {
    return `${person.district} ${person.dong}`;
  }

  return person.district;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(fromLat, fromLng, toLat, toLng) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function buildRadiusStats(items, stepKm = 5) {
  if (!items.length) {
    return [];
  }

  const maxDistance = Math.max(
    ...items.map((person) => getDistanceKm(employerLocation.lat, employerLocation.lng, person.lat, person.lng))
  );
  const bandCount = Math.max(1, Math.ceil(maxDistance / stepKm));
  const bands = Array.from({ length: bandCount }, (_, index) => ({
    startKm: index * stepKm,
    endKm: (index + 1) * stepKm,
    count: 0
  }));

  items.forEach((person) => {
    const distance = getDistanceKm(employerLocation.lat, employerLocation.lng, person.lat, person.lng);
    const bandIndex = Math.min(Math.floor(distance / stepKm), bands.length - 1);
    bands[bandIndex].count += 1;
  });

  return bands;
}

function renderRadiusStats(items) {
  const bands = buildRadiusStats(items, 5);

  if (!bands.length) {
    radiusStatsEl.innerHTML = '<p class="radius-empty">반경 통계를 계산할 구직자가 없습니다.</p>';
    return;
  }

  radiusStatsEl.innerHTML = bands
    .map((band) => `
      <article class="radius-chip">
        <p class="radius-range">${band.startKm}~${band.endKm}km</p>
        <p class="radius-count">${band.count}명</p>
      </article>
    `)
    .join("");
}

function renderEmployerRadius(items) {
  radiusLayerGroup.clearLayers();

  const bands = buildRadiusStats(items, 5);
  const ringCount = Math.max(1, bands.length);

  for (let index = 0; index < ringCount; index += 1) {
    const ringKm = (index + 1) * 5;
    const ring = L.circle([employerLocation.lat, employerLocation.lng], {
      radius: ringKm * 1000,
      color: "#da8b2f",
      fill: false,
      weight: 1.5,
      dashArray: "6 6"
    });
    ring.bindTooltip(`${ringKm}km`, {
      permanent: true,
      direction: "right",
      offset: [12, 0],
      className: "radius-ring-label"
    });
    ring.addTo(radiusLayerGroup);
  }

  if (!employerMarker) {
    employerMarker = L.marker([employerLocation.lat, employerLocation.lng], {
      icon: L.divIcon({
        className: "employer-pin-wrapper",
        html: '<div class="employer-pin">사업장</div>',
        iconSize: [56, 30],
        iconAnchor: [28, 15]
      })
    });
  }

  employerMarker
    .bindPopup(`
      <div class="map-popup">
        <h4>${employerLocation.name}</h4>
        <p>${employerLocation.address}</p>
      </div>
    `)
    .addTo(radiusLayerGroup);
}

function filterJobseekers() {
  const keyword = keywordEl.value.trim().toLowerCase();
  const job = jobEl.value;
  const experience = experienceEl.value;
  const education = educationEl.value;
  const region = regionEl.value;

  return jobseekers.filter((person) => {
    const keywordMatch = !keyword || [person.name, ...person.skills].join(" ").toLowerCase().includes(keyword);
    const jobMatch = !job || person.job === job;
    const experienceMatch = !experience || person.experience === experience;
    const educationMatch = !education || person.education === education;
    const regionMatch = !region || person.region === region;

    return keywordMatch && jobMatch && experienceMatch && educationMatch && regionMatch;
  });
}

function renderList(items) {
  if (!items.length) {
    listEl.innerHTML = '<p class="empty">조건에 맞는 구직자가 없습니다.</p>';
    return;
  }

  listEl.innerHTML = items
    .map((person) => {
      const tags = person.skills.map((skill) => `<span class="tag">${skill}</span>`).join("");
      const addressArea = formatAddressArea(person);
      return `
        <article class="talent-card">
          <h3>${person.name} <small>(${person.job})</small></h3>
          <p class="meta">주소지: ${addressArea} · ${person.experience} · ${person.education}</p>
          <div class="stack">${tags}</div>
        </article>
      `;
    })
    .join("");
}

function groupByLocation(items) {
  const grouped = new Map();

  items.forEach((person) => {
    const area = formatAddressArea(person);
    const key = `${person.region}-${area}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        region: person.region,
        area,
        lat: person.lat,
        lng: person.lng,
        members: []
      });
    }

    grouped.get(key).members.push(person);
  });

  return Array.from(grouped.values());
}

function renderMap(items) {
  circleLayerGroup.clearLayers();

  const grouped = groupByLocation(items);

  if (!grouped.length) {
    regionSummaryEl.textContent = "표시할 위치 데이터가 없습니다.";
    return;
  }

  const summary = grouped
    .slice()
    .sort((a, b) => b.members.length - a.members.length)
    .slice(0, 3)
    .map((group) => `${group.region} ${group.area} ${group.members.length}명`)
    .join(" / ");

  regionSummaryEl.textContent = `상위 밀집 지역: ${summary}`;

  const bounds = [[employerLocation.lat, employerLocation.lng]];

  grouped.forEach((group) => {
    const count = group.members.length;
    const radius = 15000 + count * 5000;

    const circle = L.circle([group.lat, group.lng], {
      radius,
      color: "#1f6b4f",
      fillColor: "#2f8a66",
      fillOpacity: 0.35,
      weight: 2
    });

    const names = group.members.map((member) => member.name).join(", ");
    circle.bindPopup(`
      <div class="map-popup">
        <h4>${group.region} ${group.area}</h4>
        <p>구직자 ${count}명</p>
        <p>인원: ${names}</p>
      </div>
    `);

    circle.addTo(circleLayerGroup);

    const countIcon = L.divIcon({
      className: "count-pin-wrapper",
      html: `<div class="count-pin">${count}명</div>`,
      iconSize: [52, 28],
      iconAnchor: [26, 14]
    });

    const marker = L.marker([group.lat, group.lng], { icon: countIcon })
      .bindTooltip(`${group.region} ${group.area}`, {
        direction: "top",
        offset: [0, -18]
      })
      .addTo(circleLayerGroup);

    marker.on("click", () => circle.openPopup());
    bounds.push([group.lat, group.lng]);
  });

  if (bounds.length === 1) {
    map.setView(bounds[0], 10);
  } else {
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

function refresh() {
  const filtered = filterJobseekers();
  renderList(filtered);
  renderMap(filtered);
  renderRadiusStats(filtered);
  renderEmployerRadius(filtered);
  countEl.textContent = String(filtered.length);
  employerAddressEl.textContent = employerLocation.address;
}

[keywordEl, jobEl, experienceEl, educationEl, regionEl].forEach((el) => {
  el.addEventListener("input", refresh);
  el.addEventListener("change", refresh);
});

resetBtn.addEventListener("click", () => {
  keywordEl.value = "";
  jobEl.value = "";
  experienceEl.value = "";
  educationEl.value = "";
  regionEl.value = "";
  refresh();
});

refresh();
