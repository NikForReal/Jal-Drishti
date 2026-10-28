import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ========================================
// 1. BACKEND HEALTH CHECK
// ========================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    project: "JalDrishti",
    message: "JalDrishti Backend is running!",
    status: "Online",
  });
});

// ========================================
// 2. DASHBOARD API
// Existing demo data preserved
// ========================================
app.get("/api/dashboard", (req, res) => {
  res.json({
    success: true,
    project: "JalDrishti",
    message: "Water Intelligence Platform API",
    data: {
      waterQuality: {
        ph: 7.2,
        status: "Normal",
      },
      rainfall: {
        value: 124,
        unit: "mm",
      },
      waterLevel: {
        value: 68,
        unit: "%",
      },
      activeAlerts: 3,
    },
    note: "Demo data only. These values are not live measurements.",
  });
});

// ========================================
// 3. CURRENT WEATHER API
// Pune weather using Open-Meteo
// ========================================
app.get("/api/weather", async (req, res) => {
  try {
    const latitude = 18.5204;
    const longitude = 73.8567;

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current:
        "temperature_2m,relative_humidity_2m,precipitation,rain",
      daily: "precipitation_sum",
      timezone: "Asia/Kolkata",
      forecast_days: "1",
    });

    const apiUrl =
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const weather = await response.json();

    if (!weather.current || !weather.daily) {
      throw new Error("Weather data is incomplete");
    }

    res.json({
      success: true,
      project: "JalDrishti",
      location: "Pune, Maharashtra, India",

      source: {
        name: "Open-Meteo",
        type: "Weather model data",
        attribution: "Weather data by Open-Meteo.com",
      },

      current: {
        time: weather.current.time,
        temperature: weather.current.temperature_2m,
        temperatureUnit: weather.current_units.temperature_2m,
        humidity: weather.current.relative_humidity_2m,
        humidityUnit: weather.current_units.relative_humidity_2m,
        precipitation: weather.current.precipitation,
        precipitationUnit: weather.current_units.precipitation,
        rain: weather.current.rain,
        rainUnit: weather.current_units.rain,
      },

      daily: {
        date: weather.daily.time?.[0] ?? null,
        precipitation: weather.daily.precipitation_sum?.[0] ?? null,
        precipitationUnit: weather.daily_units.precipitation_sum,
      },

      fetchedAt: new Date().toISOString(),

      note:
        "Weather-model estimates, not verified local rain-gauge measurements. Daily precipitation may be a forecast estimate.",
    });
  } catch (error) {
    console.error("Weather API error:", error);

    res.status(502).json({
      success: false,
      message: "Unable to fetch Pune weather data right now.",
      note: "Check your internet connection and try again.",
    });
  }
});

// ========================================
// 4. HISTORICAL RAINFALL + 7-DAY FORECAST
// ========================================
app.get("/api/rainfall", async (req, res) => {
  try {
    const latitude = 18.5204;
    const longitude = 73.8567;

    // Get today's date in Pune's timezone
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Calculate the date 30 days before today
    const todayDate = new Date(`${today}T00:00:00+05:30`);

    const startDate = new Date(todayDate);
    startDate.setDate(startDate.getDate() - 30);

    const start = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(startDate);

    // Fetch historical weather data
    const historicalParams = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      start_date: start,
      end_date: today,
      daily: "precipitation_sum",
      timezone: "Asia/Kolkata",
    });

    const historicalUrl =
      `https://archive-api.open-meteo.com/v1/archive?${historicalParams.toString()}`;

    // Fetch forecast data
    const forecastParams = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily: "precipitation_sum,temperature_2m_max,temperature_2m_min",
      timezone: "Asia/Kolkata",
      forecast_days: "7",
    });

    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?${forecastParams.toString()}`;

    // Fetch both sources
    const [historicalResponse, forecastResponse] = await Promise.all([
      fetch(historicalUrl),
      fetch(forecastUrl),
    ]);

    if (!historicalResponse.ok) {
      throw new Error(
        `Historical API error: ${historicalResponse.status}`
      );
    }

    if (!forecastResponse.ok) {
      throw new Error(
        `Forecast API error: ${forecastResponse.status}`
      );
    }

    const historicalData = await historicalResponse.json();
    const forecastData = await forecastResponse.json();

    if (!historicalData.daily || !forecastData.daily) {
      throw new Error("Rainfall data is incomplete");
    }

    const historical = (historicalData.daily.time || []).map(
      (date, index) => ({
        date,
        precipitation:
          historicalData.daily.precipitation_sum[index],
        unit: historicalData.daily_units.precipitation_sum,
      })
    );

    const forecast = (forecastData.daily.time || []).map(
      (date, index) => ({
        date,
        precipitation:
          forecastData.daily.precipitation_sum[index],
        precipitationUnit:
          forecastData.daily_units.precipitation_sum,
        maxTemperature:
          forecastData.daily.temperature_2m_max[index],
        minTemperature:
          forecastData.daily.temperature_2m_min[index],
        temperatureUnit:
          forecastData.daily_units.temperature_2m_max,
      })
    );

    // Historical data for completed days only
    const pastRecords = historical.filter(
      (record) => record.date < today
    );

    // Today's forecast/model estimate
    const todayForecast = forecast.find(
      (record) => record.date === today
    );

    // Future predictions only
    const futureForecast = forecast.filter(
      (record) => record.date > today
    );

    res.json({
      success: true,
      project: "JalDrishti",
      location: "Pune, Maharashtra, India",

      source: {
        name: "Open-Meteo",
        historicalType: "Historical weather-model data",
        forecastType: "Weather forecast",
        attribution: "Weather data by Open-Meteo.com",
      },

      today: {
        date: today,
        precipitation: todayForecast?.precipitation ?? null,
        unit: todayForecast?.precipitationUnit ?? "mm",
        type: "Daily model estimate/forecast",
      },

      historical: {
        startDate: start,
        endDate: today,
        records: pastRecords,
        count: pastRecords.length,
        note:
          "Historical weather data may be model-based and is not guaranteed to match local rain-gauge observations.",
      },

      forecast: {
        records: futureForecast,
        count: futureForecast.length,
        note:
          "Predictions are estimates, not guaranteed future rainfall.",
      },

      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Rainfall API error:", error);

    res.status(502).json({
      success: false,
      message: "Unable to fetch rainfall data right now.",
      note: "Check your internet connection and try again.",
    });
  }
});
// CPCB / National Water Data Portal — Maharashtra chemical water quality
const CPCB_MAHARASHTRA_CSV =
  "https://nwdp.nwic.gov.in/dataset/d54d7702-d21f-408f-8dc0-2665bde47201/resource/4593ba3e-3097-4f26-800c-b25c692adaef/download/swq_chemical_parameter_manual_cpcb_mh_2021_2025.csv";

// Parse CSV while supporting quoted values and commas inside quotes.
function parseCSVLine(line) {
  const values = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      values.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }

  values.push(value.trim());
  return values;
}

function normalizeHeader(header) {
  return String(header ?? "")
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]/g, "");
}

function findColumn(headers, candidates) {
  return headers.findIndex((header) =>
    candidates.includes(normalizeHeader(header))
  );
}

app.get("/api/water-quality", async (_req, res) => {
  try {
    const response = await fetch(CPCB_MAHARASHTRA_CSV, {
      headers: {
        Accept: "text/csv,text/plain,*/*",
        "User-Agent": "JalDrishti-Water-Intelligence"
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      throw new Error(`CPCB/NWDP returned HTTP ${response.status}`);
    }

    const csvText = await response.text();

    if (
      !csvText.trim() ||
      csvText.trimStart().startsWith("<!DOCTYPE html")
    ) {
      throw new Error("The source did not return a readable CSV file");
    }

    const lines = csvText
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      throw new Error("The source CSV contains no data rows");
    }

    const headers = parseCSVLine(lines[0]);

    const records = lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const record = {};

      headers.forEach((header, index) => {
        record[header] = values[index] ?? "";
      });

      return record;
    });

    const dateColumn = findColumn(headers, [
      "date",
      "sampledate",
      "samplingdate",
      "monitoringdate",
      "observationdate",
      "dataacquisitiontime"
   ]);

    const stationColumn = findColumn(headers, [
      "station",
      "stationname",
      "stationid",
      "monitoringstation",
      "location",
      "locationname",
      "samplinglocation"
    ]);

    const phColumn = findColumn(headers, [
      "ph",
      "phvalue",
      "phlevel"
    ]);

    const tdsColumn = findColumn(headers, [
      "tds",
      "totaldissolvedsolids",
      "totaldissolvedsolidsmg/l",
      "tdsmg/l"
    ]);

    const doColumn = findColumn(headers, [
      "do",
      "dissolvedoxygen",
      "dissolvedoxygenmg/l"
    ]);

    const normalizedRecords = records.map((record) => {
      const values = headers.map((header) => record[header] ?? "");

      return {
        date: dateColumn >= 0 ? values[dateColumn] || null : null,
        station: stationColumn >= 0 ? values[stationColumn] || null : null,
        ph: phColumn >= 0 ? values[phColumn] || null : null,
        tds: tdsColumn >= 0 ? values[tdsColumn] || null : null,
        dissolvedOxygen:
          doColumn >= 0 ? values[doColumn] || null : null,
        raw: record
      };
    });

    res.json({
      success: true,
      project: "JalDrishti",
      location: "Maharashtra, India",
      source: {
        name: "Central Pollution Control Board (CPCB)",
        portal: "National Water Data Portal (NWDP)",
        dataset: "Surface Water Quality — Manual Chemical Parameters",
        url: "https://nwdp.nwic.gov.in/dataset/surface-water-quality-manual-chemical-parameters-cpcb",
        dataType: "Official manual monitoring records",
        frequency: "Dataset described by NWDP as annual chemical monitoring",
        isLiveSensorData: false
      },
      totalRecords: normalizedRecords.length,
      columns: headers,
      records: normalizedRecords,
      fetchedAt: new Date().toISOString(),
      note:
        "Official monitoring dataset, not real-time sensor data. " +
        "Original column names and values are preserved in each record's raw field. " +
        "Missing measurements remain blank; they are not replaced with zero."
    });
  } catch (error) {
    console.error("CPCB water-quality API error:", error);

    res.status(502).json({
      success: false,
      message:
        "Unable to retrieve the CPCB Maharashtra water-quality dataset.",
      detail:
        error instanceof Error ? error.message : "Unknown source error"
    });
  }
});
// ========================================
// 5. START SERVER
// ========================================
app.listen(PORT, () => {
  console.log(
    `JalDrishti Backend running at http://localhost:${PORT}`
  );
});