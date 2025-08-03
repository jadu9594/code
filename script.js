const API_KEY = "588d08f5527744f1b00153714253007";
const BASE_URL = "https://api.weatherapi.com/v1/forecast.json";

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const weatherContainer = document.getElementById('weather-container');
const mainContainer = document.getElementById('main-container');
const errorMessage = document.getElementById('error-message');
const forecastContainer = document.getElementById('forecast-container');
const chartCanvas = document.getElementById('weather-chart');
const chartControls = document.getElementById('chart-controls');
const daySelector = document.getElementById('day-selector');

let weatherChart = null;
let forecastDataCache = []; 
let locationCache = {};     
let selectedDayIndex = 0; 
let currentChartType = 'temperature';

const weatherThemes = {
    "Sunny": "linear-gradient(to bottom right, #b45309, #f59e0b)",
    "Clear": "linear-gradient(to bottom right, #1d4ed8, #3b82f6)",
    "Partly cloudy": "linear-gradient(to bottom right, #334155, #64748b)",
    "Cloudy": "linear-gradient(to bottom right, #475569, #94a3b8)",
    "Overcast": "linear-gradient(to bottom right, #1e293b, #475569)",
    "Mist": "linear-gradient(to bottom right, #64748b, #94a3b8)",
    "Fog": "linear-gradient(to bottom right, #64748b, #94a3b8)",
    "Rain": "linear-gradient(to bottom right, #0c4a6e, #334155)",
    "Snow": "linear-gradient(to bottom right, #94a3b8, #e2e8f0)",
    "Thunder": "linear-gradient(to bottom right, #111827, #312e81)",
    "Default": "linear-gradient(to bottom right, #1e293b, #0f172a)"
};

const getWeatherData = async (city) => {
    const url = `${BASE_URL}?key=${API_KEY}&q=${city}&days=7&aqi=no&alerts=no`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('City not found');
        const data = await response.json();
        
        errorMessage.classList.add('hidden');
        weatherContainer.classList.remove('hidden');
        forecastContainer.classList.remove('hidden');
        daySelector.classList.remove('hidden');
        
        locationCache = data.location;
        forecastDataCache = data.forecast.forecastday;
        selectedDayIndex = 0; 
        
        updateDaySelector();
        updateUI();

    } catch (error) {
        console.error("Error fetching weather data:", error);
        weatherContainer.classList.add('hidden');
        forecastContainer.classList.add('hidden');
        daySelector.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        updateBackground("Default");
    }
};

const updateDaySelector = () => {
    daySelector.innerHTML = ''; 
    forecastDataCache.forEach((day, index) => {
        const date = new Date(day.date_epoch * 1000);
        const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const button = document.createElement('button');
        button.className = 'day-btn';
        button.textContent = dayName;
        button.dataset.index = index;
        if (index === selectedDayIndex) {
            button.classList.add('active');
        }
        daySelector.appendChild(button);
    });
};

const updateUI = () => {
    const selectedDay = forecastDataCache[selectedDayIndex];
    const locationName = locationCache.name || 'City';
    const countryName = locationCache.country || '';

    const displayData = selectedDay.day;
    const conditionIcon = displayData.condition.icon;

    weatherContainer.innerHTML = `
        <div class="location-info">
            <h2>${locationName}</h2>
            <p>${countryName}</p>
            <p>${new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div class="temp-display">
            <img src="https:${conditionIcon}" alt="Weather Icon">
            <span class="temp">${Math.round(displayData.avgtemp_c)}°C</span>
        </div>
        <p class="condition">${displayData.condition.text}</p>
        <div class="extra-details">
            <div class="detail-item">
                <span>Max Temp</span>
                <span>${Math.round(selectedDay.day.maxtemp_c)}°C</span>
            </div>
            <div class="detail-item">
                <span>Min Temp</span>
                <span>${Math.round(selectedDay.day.mintemp_c)}°C</span>
            </div>
            <div class="detail-item">
                <span>Avg Humidity</span>
                <span>${selectedDay.day.avghumidity}%</span>
            </div>
             <div class="detail-item">
                <span>Max Wind</span>
                <span>${selectedDay.day.maxwind_kph} kph</span>
            </div>
        </div>
    `;
    
    updateBackground(displayData.condition.text);
    updateHourlyChart(selectedDay.hour, currentChartType);
};

const updateBackground = (conditionText) => {
    let themeGradient = weatherThemes["Default"];
    for (const key in weatherThemes) {
        if (conditionText.toLowerCase().includes(key.toLowerCase())) {
            themeGradient = weatherThemes[key];
            break;
        }
    }
    mainContainer.style.background = themeGradient;
};

const updateHourlyChart = (hourlyData, type) => {
    const labels = hourlyData.map(hour => new Date(hour.time_epoch * 1000).getHours() + ':00');
    
    let dataset, yAxisOptions;

    switch (type) {
        case 'humidity':
            dataset = {
                label: 'Humidity (%)',
                data: hourlyData.map(h => h.humidity),
                borderColor: '#38bdf8', 
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                fill: true, tension: 0.4,
            };
            yAxisOptions = { min: 0, max: 100, ticks: { color: '#38bdf8' }, title: { display: true, text: 'Humidity (%)', color: '#38bdf8' } };
            break;
        case 'precipitation':
            dataset = {
                label: 'Precipitation (%)',
                data: hourlyData.map(h => h.chance_of_rain),
                borderColor: '#a3a3a3', 
                backgroundColor: 'rgba(163, 163, 163, 0.2)',
                fill: true, tension: 0.4,
            };
            yAxisOptions = { min: 0, max: 100, ticks: { color: '#a3a3a3' }, title: { display: true, text: 'Precipitation (%)', color: '#a3a3a3' } };
            break;
        case 'temperature':
        default:
            dataset = {
                label: 'Temperature (°C)',
                data: hourlyData.map(h => h.temp_c),
                borderColor: '#f59e0b', 
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                fill: true, tension: 0.4,
            };
            yAxisOptions = { ticks: { color: '#f59e0b' }, title: { display: true, text: 'Temperature (°C)', color: '#f59e0b' } };
            break;
    }

    if (weatherChart) weatherChart.destroy();

    weatherChart = new Chart(chartCanvas, {
        type: 'line',
        data: { labels: labels, datasets: [dataset] },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { ticks: { color: '#e2e8f0' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ...yAxisOptions, grid: { color: 'rgba(255,255,255,0.1)' } }
            },
            plugins: { legend: { display: false } }
        }
    });
};

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) getWeatherData(city);
    cityInput.value = '';
});

chartControls.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const type = e.target.dataset.type;
        if (type !== currentChartType) {
            document.querySelector('.chart-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentChartType = type;
            updateHourlyChart(forecastDataCache[selectedDayIndex].hour, currentChartType);
        }
    }
});

daySelector.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const index = parseInt(e.target.dataset.index, 10);
        if (index !== selectedDayIndex) {
            document.querySelector('.day-btn.active').classList.remove('active');
            e.target.classList.add('active');
            selectedDayIndex = index;
            updateUI();
        }
    }
});

window.addEventListener('load', () => {
    getWeatherData('New Delhi');
});