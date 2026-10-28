const API_BASE_URL = 'http://localhost:5000';

export interface DashboardData {
  success: boolean;
  project: string;
  message: string;
  data: {
    waterQuality: {
      ph: number;
      status: string;
    };
    rainfall: {
      value: number;
      unit: string;
    };
    waterLevel: {
      value: number;
      unit: string;
    };
    activeAlerts: number;
  };
  note: string;
}

export interface WeatherData {
  success: boolean;
  project: string;
  location: string;
  source: {
    name: string;
    type: string;
    attribution: string;
  };
  current: {
    time: string;
    temperature: number;
    temperatureUnit: string;
    humidity: number;
    humidityUnit: string;
    precipitation: number;
    precipitationUnit: string;
    rain: number;
    rainUnit: string;
  };
  daily: {
    date: string | null;
    precipitation: number | null;
    precipitationUnit: string;
  };
  fetchedAt: string;
  note: string;
}

export interface RainfallDay {
  date: string;
  precipitation: number | null;
  type: 'historical-model' | 'today-estimate' | 'forecast';
  minTemperature?: number | null;
  maxTemperature?: number | null;
  temperatureUnit?: string;
}

export interface RainfallSeriesData {
  success: boolean;
  location: string;
  source: {
    name: string;
    type: string;
    attribution: string;
  };
  unit: string;
  historical: RainfallDay[];
  today: RainfallDay | null;
  forecast: RainfallDay[];
  fetchedAt: string;
  note: string;
}

// Actual backend response structure
interface BackendRainfallResponse {
  success: boolean;
  location: string;

  source: {
    name: string;
    historicalType: string;
    forecastType: string;
    attribution: string;
  };

  today: {
    date: string;
    precipitation: number | null;
    unit: string;
    type: string;
  } | null;

  historical: {
    startDate: string;
    endDate: string;
    records: Array<{
      date: string;
      precipitation: number | null;
      unit: string;
    }>;
    count: number;
    note: string;
  };

  forecast: {
    records: Array<{
      date: string;
      precipitation: number | null;
      precipitationUnit: string;
      maxTemperature: number | null;
      minTemperature: number | null;
      temperatureUnit: string;
    }>;
    count: number;
    note: string;
  };

  fetchedAt: string;
}

// Common API fetch function
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;

    try {
      const body = await response.json();

      if (body.message) {
        message = body.message;
      }
    } catch {
      // Keep default error message
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// Dashboard API
export function getDashboardData(): Promise<DashboardData> {
  return fetchJson<DashboardData>(
    `${API_BASE_URL}/api/dashboard`
  );
}

// Current weather API
export function getWeatherData(): Promise<WeatherData> {
  return fetchJson<WeatherData>(
    `${API_BASE_URL}/api/weather`
  );
}

// Historical rainfall + future forecast API
export async function getRainfallSeries(): Promise<RainfallSeriesData> {
  const response = await fetchJson<BackendRainfallResponse>(
    `${API_BASE_URL}/api/rainfall`
  );

  // Convert backend historical records into frontend format
  const historical: RainfallDay[] =
    (response.historical?.records ?? []).map((record) => ({
      date: record.date,
      precipitation: record.precipitation,
      type: 'historical-model',
    }));

  // Convert backend future predictions into frontend format
  const forecast: RainfallDay[] =
    (response.forecast?.records ?? []).map((record) => ({
      date: record.date,
      precipitation: record.precipitation,
      type: 'forecast',
      minTemperature: record.minTemperature,
      maxTemperature: record.maxTemperature,
      temperatureUnit: record.temperatureUnit,
    }));

  // Convert today's precipitation
  const today: RainfallDay | null = response.today
    ? {
        date: response.today.date,
        precipitation: response.today.precipitation,
        type: 'today-estimate',
      }
    : null;

  return {
    success: response.success,
    location: response.location,

    source: {
      name: response.source.name,
      type: response.source.historicalType,
      attribution: response.source.attribution,
    },

    unit: 'mm',
    historical,
    today,
    forecast,
    fetchedAt: response.fetchedAt,

    note:
      'Historical values are weather-model data. Future values are forecasts, not verified measurements.',
  };
}