import "leaflet/dist/leaflet.css";
import WaterMap from "./WaterMap";
import { useEffect, useMemo, useState } from 'react'
import { getDashboardData, getWeatherData, getRainfallSeries, type DashboardData, type WeatherData, type RainfallSeriesData } from './api'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CheckCircle2, ChevronDown, AlertTriangle, Clock,
  CalendarDays, CloudRain, Droplets, Eye, Gauge, LayoutDashboard, Leaf, MapPin, Menu,
  Search, ShieldAlert, ShieldCheck, Waves, X, FlaskConical, Factory,
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import './App.css'

type Location = {
  name: string
  area: string
  level: number
  quality: string
  status: 'good' | 'warning'
  rainfall: number
}

const rainfallData = [
  { day: 'Mon', rainfall: 18, level: 72, usage: 1260 },
  { day: 'Tue', rainfall: 25, level: 70, usage: 1210 },
  { day: 'Wed', rainfall: 16, level: 69, usage: 1290 },
  { day: 'Thu', rainfall: 35, level: 73, usage: 1180 },
  { day: 'Fri', rainfall: 28, level: 71, usage: 1240 },
  { day: 'Sat', rainfall: 42, level: 75, usage: 1160 },
  { day: 'Sun', rainfall: 31, level: 74, usage: 1240 },
]

const locations: Location[] = [
  { name: 'Pashan Lake', area: 'Pune, Maharashtra', level: 76, quality: 'Good', status: 'good', rainfall: 31 },
  { name: 'Khadakwasla Reservoir', area: 'Pune, Maharashtra', level: 68, quality: 'Good', status: 'good', rainfall: 28 },
  { name: 'Mula River', area: 'Pune, Maharashtra', level: 42, quality: 'Monitor', status: 'warning', rainfall: 24 },
]

const qualityData = [
  { location: 'Pashan Lake', ph: 7.2, tds: 280, turbidity: 2.1, status: 'Good' },
  { location: 'Khadakwasla', ph: 7.4, tds: 310, turbidity: 2.8, status: 'Good' },
  { location: 'Mula River', ph: 6.8, tds: 460, turbidity: 5.6, status: 'Monitor' },
]

const pollutionData = [
  { day: 'Mon', index: 22 }, { day: 'Tue', index: 25 }, { day: 'Wed', index: 31 },
  { day: 'Thu', index: 28 }, { day: 'Fri', index: 37 }, { day: 'Sat', index: 34 },
  { day: 'Sun', index: 29 },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Water Quality', icon: Droplets },
  { label: 'Rainfall', icon: CloudRain },
  { label: 'Forecast', icon: CalendarDays },
  { label: 'Water Levels', icon: Waves },
  { label: 'Pollution', icon: Activity },
  { label: 'Alerts', icon: ShieldAlert },
  { label: 'Water Map', icon: MapPin },
  { label: 'Conservation', icon: Leaf },
]

const descriptions: Record<string, string> = {
  Overview: 'Here is what is happening with your water resources.',
  'Water Quality': 'Review sample water-quality parameters across monitored locations.',
  Rainfall: 'Explore recent daily precipitation records from weather-model data.',
  Forecast: 'Explore predicted precipitation for the next seven days. Forecasts are estimates, not guarantees.',
  'Water Levels': 'Compare illustrative water levels across monitored water bodies.',
  Pollution: 'Review sample pollution indicators and monitoring status.',
  Alerts: 'Review, acknowledge and resolve sample water-quality alerts.',
  'Water Map': 'The interactive location map will be added in Phase A.',
  Conservation: 'Practical steps to use water wisely and reduce avoidable waste.',
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <Droplets size={29} strokeWidth={1.8} />
        <Eye className="brand-eye" size={15} strokeWidth={2} />
      </div>
      <div>
        <div className="brand-name">JalDrishti<span>.</span></div>
        <div className="brand-subtitle">SMART WATER INTELLIGENCE</div>
      </div>
    </div>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
}

function MetricCard({ title, value, unit, caption, icon: Icon, tone = 'aqua' }: {
  title: string; value: string; unit?: string; caption: string;
  icon: typeof Droplets; tone?: string
}) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span>{title}</span><span className={`metric-icon ${tone}`}><Icon size={20} /></span></div>
      <div className="metric-value">{value}{unit && <span className="unit">{unit}</span>}</div>
      <p className="metric-caption">{caption}</p>
      <div className="metric-bottom"><span>DEMO DATA</span><span>Illustrative</span></div>
    </article>
  )
}

function DataNotice() {
  return (
    <div className="notice-banner">
      <div className="notice-icon"><Activity size={19} /></div>
      <div>
        <strong>JalDrishti Water Intelligence</strong>
        <p>Explore water quality, rainfall, forecasts, water levels and conservation insights for monitored locations.</p>
      </div>
      <span className="demo-badge">JALDRISHTI</span>
    </div>
  )
}

function OverviewPage({ filteredLocations, search, setSearch, setActivePage, period, setPeriod, weather, weatherError }: {
  filteredLocations: Location[]; search: string; setSearch: (value: string) => void;
  setActivePage: (page: string) => void; period: string; setPeriod: (value: string) => void;
  weather: WeatherData | null; weatherError: string;
}) {
  const chartData = period === '30 days'
    ? [...rainfallData, ...rainfallData, ...rainfallData, ...rainfallData].map((item, index) => ({ ...item, day: `D${index + 1}` }))
    : rainfallData
  return (
    <>
      <section className="metrics-grid">
        <article className="metric-card">
          <div className="metric-top"><span>Water quality</span><span className="metric-icon aqua"><Droplets size={20} /></span></div>
          <div className="metric-value">Good <span className="status-pill status-good"><ShieldCheck size={13} /> Stable</span></div>
          <p className="metric-caption">Illustrative overall status</p>
          <div className="metric-bottom"><span className="metric-foot-icon"><Activity size={14} /></span> Sample quality indicators</div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Average water level</span><span className="metric-icon blue"><Waves size={20} /></span></div>
          <div className="metric-value">62.4<span className="unit">%</span><span className="trend positive"><ArrowUpRight size={15} /> 3.2%</span></div>
          <p className="metric-caption">Across monitored locations</p>
          <div className="progress-track"><div className="progress-fill" style={{ width: '62.4%' }} /></div>
          <div className="metric-bottom"><span>Sample capacity indicator</span><span>62.4%</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Today's precipitation</span><span className="metric-icon violet"><CloudRain size={20} /></span></div>
          <div className="metric-value">{weather?.daily.precipitation != null ? weather.daily.precipitation : '—'} <span className="unit">{weather?.daily.precipitationUnit ?? 'mm'}</span></div>
          <p className="metric-caption">{weather ? `Model estimate for ${weather.daily.date ?? 'today'}` : weatherError ? 'Weather data unavailable' : 'Loading Pune weather data…'}</p>
          <div className="metric-bottom"><span>{weather ? 'OPEN-METEO MODEL' : 'NOT AVAILABLE'}</span><span>{weather?.daily.date ?? '—'}</span></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Pune temperature</span><span className="metric-icon orange"><Activity size={20} /></span></div>
          <div className="metric-value">{weather ? weather.current.temperature : '—'}<span className="unit">{weather?.current.temperatureUnit ?? '°C'}</span></div>
          <p className="metric-caption">{weather ? `Humidity ${weather.current.humidity}${weather.current.humidityUnit}` : weatherError ? 'Weather data unavailable' : 'Loading Pune weather data…'}</p>
          <div className="metric-bottom"><span>{weather ? 'MODEL DATA' : 'NOT AVAILABLE'}</span><span>{weather?.current.time ?? '—'}</span></div>
        </article>
      </section>
      <section className="content-grid">
        <article className="panel chart-panel">
          <div className="panel-heading"><div><h2>Water trends</h2><p>Rainfall and water level patterns</p></div>
            <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Select chart period">
              <option>7 days</option><option>30 days</option>
            </select>
          </div>
          <div className="chart-legend"><span><i className="legend-rain" /> Rainfall (mm)</span><span><i className="legend-level" /> Water level (%)</span></div>
          <div className="chart-area"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#14b8a6" stopOpacity={0.25} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0.01} /></linearGradient>
                <linearGradient id="levelGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3279d9" stopOpacity={0.18} /><stop offset="95%" stopColor="#3279d9" stopOpacity={0.01} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#edf2f6" strokeDasharray="4 5" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8a9aa9', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a9aa9', fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5edf2', fontSize: 12 }} />
              <Area type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#14b8a6" strokeWidth={2.5} fill="url(#rainGradient)" />
              <Area type="monotone" dataKey="level" name="Water level (%)" stroke="#3279d9" strokeWidth={2.5} fill="url(#levelGradient)" />
            </AreaChart>
          </ResponsiveContainer></div>
          <div className="chart-footer"><span><i className="footer-dot teal-dot" /> Illustrative rainfall data</span><span><i className="footer-dot blue-dot" /> Illustrative water-level data</span></div>
        </article>
        <article className="panel locations-panel">
          <div className="panel-heading"><div><h2>Monitored locations</h2><p>Sample water bodies around Pune</p></div><button className="text-button" onClick={() => setActivePage('Water Map')}>View map ↗</button></div>
          <div className="search-box"><Search size={16} /><input placeholder="Search locations..." value={search} onChange={(event) => setSearch(event.target.value)} /><span>⌘ K</span></div>
          <div className="locations-list">
            {filteredLocations.map((location) => <button className="location-row" key={location.name} onClick={() => setActivePage('Water Map')}>
              <div className={`location-symbol ${location.status}`}><Waves size={19} /></div>
              <div className="location-details"><strong>{location.name}</strong><span><MapPin size={12} /> {location.area}</span></div>
              <div className="location-status"><strong>{location.level}%</strong><span className={`status-text ${location.status}`}>{location.quality}</span></div>
            </button>)}
            {filteredLocations.length === 0 && <p className="empty-state">No matching locations found.</p>}
          </div>
          <div className="locations-footer"><span className="live-dot" /> {filteredLocations.length} sample locations <span>·</span> Simulated readings</div>
        </article>
      </section>
      <section className="bottom-grid">
        <article className="recommendation-panel"><div className="recommendation-symbol"><Leaf size={23} /></div>
          <div className="recommendation-copy"><span className="recommendation-label">CONSERVATION INSIGHT</span><h2>Make every drop count.</h2><p>Track usage, reduce waste and explore practical ways to protect local water resources.</p></div>
          <button onClick={() => setActivePage('Conservation')}>Explore recommendations <span>→</span></button>
        </article>
        <article className="data-status-panel"><div className="data-status-icon"><ShieldCheck size={21} /></div><div><strong>Data transparency</strong><p>This prototype uses simulated readings. Connect verified sources before using it for real-world decisions.</p></div></article>
      </section>
    </>
  )
}

function WaterQualityPage() {
  return <>
    <section className="metrics-grid">
      <MetricCard title="Average pH" value="7.1" caption="Illustrative pH reading" icon={FlaskConical} />
      <MetricCard title="Average TDS" value="350" unit=" mg/L" caption="Total dissolved solids sample" icon={Droplets} tone="blue" />
      <MetricCard title="Turbidity" value="3.5" unit=" NTU" caption="Illustrative clarity indicator" icon={Eye} tone="violet" />
      <MetricCard title="Locations checked" value="3" caption="Sample monitoring points" icon={CheckCircle2} tone="orange" />
    </section>
    <section className="content-grid section-spaced">
      <article className="panel"><SectionHeading title="Quality indicators by location" subtitle="Example readings for prototype demonstration" />
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Location</th><th>pH</th><th>TDS (mg/L)</th><th>Turbidity (NTU)</th><th>Status</th></tr></thead><tbody>
          {qualityData.map(row => <tr key={row.location}><td>{row.location}</td><td>{row.ph.toFixed(1)}</td><td>{row.tds}</td><td>{row.turbidity.toFixed(1)}</td><td><span className={`table-status ${row.status === 'Good' ? 'good' : 'warning'}`}>{row.status}</span></td></tr>)}
        </tbody></table></div>
      </article>
      <article className="panel"><SectionHeading title="pH comparison" subtitle="Illustrative readings on a 0–14 pH scale" />
        <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={qualityData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="#edf2f6" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="location" tick={{fontSize: 10, fill:'#8396a4'}} axisLine={false} tickLine={false}/><YAxis domain={[0,14]} tick={{fontSize:10,fill:'#8396a4'}} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="ph" name="pH" fill="#14b8a6" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
        <p className="muted-note">These example values are for UI testing only; they do not certify that any water source is safe.</p>
      </article>
    </section>
  </>
}

function formatRainDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function RainfallPage({ rainfall, rainfallError, loading }: { rainfall: RainfallSeriesData | null; rainfallError: string; loading: boolean }) {
  const [range, setRange] = useState<'7 days' | '30 days'>('7 days')
  const allPast = rainfall?.historical ?? []
  const past = range === '7 days' ? allPast.slice(-7) : allPast
  const chartData = past.map((day) => ({ date: formatRainDate(day.date), rainfall: day.precipitation ?? 0 }))
  const values = past.map((day) => day.precipitation).filter((value): value is number => value !== null)
  const total = values.reduce((sum, value) => sum + value, 0)
  const peak = values.length ? Math.max(...values) : null
  const rainyDays = values.filter((value) => value > 0).length
  const average = values.length ? total / values.length : null

  return <>
    <section className="metrics-grid">
      <MetricCard title={`${range} precipitation`} value={loading ? '…' : rainfall ? total.toFixed(1) : '—'} unit=" mm" caption="Recent model-based daily totals" icon={CloudRain} />
      <MetricCard title="Highest daily value" value={peak === null ? '—' : peak.toFixed(1)} unit=" mm" caption="Within the selected period" icon={Activity} tone="blue" />
      <MetricCard title="Days with precipitation" value={values.length ? String(rainyDays) : '—'} caption="Values greater than 0 mm" icon={Droplets} tone="violet" />
      <MetricCard title="Daily average" value={average === null ? '—' : average.toFixed(1)} unit=" mm" caption="Across available daily records" icon={Gauge} tone="orange" />
    </section>
    <section className="content-grid section-spaced">
      <article className="panel">
        <div className="panel-heading"><div><h2>Recent rainfall records</h2><p>Daily precipitation from Open-Meteo model data (mm)</p></div>
          <select value={range} onChange={(event) => setRange(event.target.value as '7 days' | '30 days')} aria-label="Select historical rainfall range"><option>7 days</option><option>30 days</option></select>
        </div>
        {loading && <p className="muted-note">Loading rainfall records…</p>}

        {!loading && !rainfallError && chartData.length > 0 && <div className="chart-area tall-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{top:15,right:10,left:-15,bottom:0}}><CartesianGrid stroke="#edf2f6" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill:'#8396a4',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8396a4',fontSize:11}}/><Tooltip/><Bar dataKey="rainfall" name="Precipitation (mm)" fill="#14b8a6" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>}
        {!loading && !rainfallError && chartData.length === 0 && <p className="muted-note">No historical records were returned by the weather provider.</p>}
        <p className="muted-note">Source: {rainfall?.source.name ?? 'Open-Meteo'}. Historical values here are weather-model data, not verified local rain-gauge measurements.</p>
      </article>
      <article className="panel"><SectionHeading title="Daily records" subtitle="Most recent dates first" />
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Precipitation</th><th>Data type</th></tr></thead><tbody>
          {[...past].reverse().map((day) => <tr key={day.date}><td>{formatRainDate(day.date)} {day.date.slice(0,4)}</td><td>{day.precipitation === null ? 'Unavailable' : `${day.precipitation.toFixed(1)} mm`}</td><td>Model estimate</td></tr>)}
        </tbody></table></div>
        <p className="muted-note">Fetched: {rainfall ? new Date(rainfall.fetchedAt).toLocaleString() : '—'}</p>
      </article>
    </section>
  </>
}

function ForecastPage({ rainfall, rainfallError, loading }: { rainfall: RainfallSeriesData | null; rainfallError: string; loading: boolean }) {
  const forecast = rainfall?.forecast ?? []
  const chartData = forecast.map((day) => ({ date: formatRainDate(day.date), rainfall: day.precipitation ?? 0 }))
  const total = forecast.reduce((sum, day) => sum + (day.precipitation ?? 0), 0)
  const rainyDays = forecast.filter((day) => day.precipitation !== null && day.precipitation > 0).length
  const max = forecast.reduce<number | null>((highest, day) => day.precipitation === null ? highest : highest === null ? day.precipitation : Math.max(highest, day.precipitation), null)

  return <>
    <section className="metrics-grid">
      <MetricCard title="Next 7-day precipitation" value={loading ? '…' : rainfall ? total.toFixed(1) : '—'} unit=" mm" caption="Sum of daily forecast estimates" icon={CloudRain} />
      <MetricCard title="Highest forecast day" value={max === null ? '—' : max.toFixed(1)} unit=" mm" caption="Maximum daily forecast value" icon={Activity} tone="blue" />
      <MetricCard title="Days with predicted rain" value={rainfall ? String(rainyDays) : '—'} caption="Forecast precipitation above 0 mm" icon={Droplets} tone="violet" />
      <MetricCard title="Forecast horizon" value={forecast.length ? String(forecast.length) : '—'} unit=" days" caption="Daily estimates available" icon={CalendarDays} tone="orange" />
    </section>
    <section className="content-grid section-spaced">
      <article className="panel"><SectionHeading title="7-day precipitation forecast" subtitle="Predicted daily precipitation (mm), not a guarantee" />
        {loading && <p className="muted-note">Loading forecast…</p>}

        {!loading && !rainfallError && chartData.length > 0 && <div className="chart-area tall-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{top:15,right:10,left:-15,bottom:0}}><CartesianGrid stroke="#edf2f6" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill:'#8396a4',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8396a4',fontSize:11}}/><Tooltip/><Line type="monotone" dataKey="rainfall" name="Forecast precipitation (mm)" stroke="#3279d9" strokeWidth={3} dot={{r:4}} connectNulls={false}/></LineChart></ResponsiveContainer></div>}
        <p className="muted-note">Source: {rainfall?.source.name ?? 'Open-Meteo'}. Forecasts can change as weather models update.</p>
      </article>
      <article className="panel"><SectionHeading title="Forecast by date" subtitle="Daily estimates for Pune" />
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Date</th><th>Predicted precipitation</th></tr></thead><tbody>
          {forecast.map((day) => <tr key={day.date}><td>{formatRainDate(day.date)} {day.date.slice(0,4)}</td><td>{day.precipitation === null ? 'Unavailable' : `${day.precipitation.toFixed(1)} mm`}</td></tr>)}
        </tbody></table></div>
        {!loading && !rainfallError && forecast.length === 0 && <p className="muted-note">No forecast records available.</p>}
      </article>
    </section>
  </>
}

function WaterLevelsPage() {
  return <>
    <section className="metrics-grid">
      <MetricCard title="Average level" value="62.4" unit="%" caption="Across 3 sample locations" icon={Waves} />
      <MetricCard title="Highest level" value="76" unit="%" caption="Pashan Lake sample" icon={ArrowUpRight} tone="blue" />
      <MetricCard title="Lowest level" value="42" unit="%" caption="Mula River sample" icon={ArrowDownRight} tone="violet" />
      <MetricCard title="Locations monitored" value="3" caption="Illustrative water bodies" icon={MapPin} tone="orange" />
    </section>
    <section className="content-grid section-spaced">
      <article className="panel"><SectionHeading title="Water level comparison" subtitle="Sample level indicators; not live reservoir capacity" />
        <div className="chart-area tall-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={locations} margin={{top:15,right:10,left:-15,bottom:0}}><CartesianGrid stroke="#edf2f6" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#8396a4',fontSize:10}}/><YAxis domain={[0,100]} axisLine={false} tickLine={false} tick={{fill:'#8396a4',fontSize:11}}/><Tooltip/><Bar dataKey="level" name="Level (%)" fill="#3279d9" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
      </article>
      <article className="panel"><SectionHeading title="Location status" subtitle="Illustrative readings" />
        <div className="level-list">{locations.map(location => <div className="level-row" key={location.name}><div className="level-row-head"><strong>{location.name}</strong><span>{location.level}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${location.level}%`}}/></div><small>{location.status === 'good' ? 'Sample level indicator' : 'Review sample level'}</small></div>)}</div>
      </article>
    </section>
  </>
}

function PollutionPage() {
  return <>
    <section className="metrics-grid">
      <MetricCard title="Sample pollution index" value="29" caption="Illustrative index, lower is preferable" icon={Activity} />
      <MetricCard title="Locations to review" value="1" caption="Sample warning state" icon={ShieldAlert} tone="orange" />
      <MetricCard title="Trend this week" value="Stable" caption="Based on simulated values" icon={ArrowDownRight} tone="blue" />
      <MetricCard title="Monitoring points" value="3" caption="Example locations" icon={MapPin} tone="violet" />
    </section>
    <section className="content-grid section-spaced">
      <article className="panel"><SectionHeading title="Illustrative pollution indicator" subtitle="Sample index trend over seven days" />
        <div className="chart-area tall-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={pollutionData} margin={{top:15,right:10,left:-15,bottom:0}}><CartesianGrid stroke="#edf2f6" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#8396a4',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8396a4',fontSize:11}}/><Tooltip/><Line type="monotone" dataKey="index" name="Sample index" stroke="#e4a257" strokeWidth={3} dot={{r:4,fill:'#e4a257'}}/></LineChart></ResponsiveContainer></div>
      </article>
      <article className="panel"><SectionHeading title="Monitoring checklist" subtitle="Useful indicators to connect later" />
        <div className="insight-list"><div><span className="insight-icon warning-icon"><Factory size={18}/></span><div><strong>Potential discharge sources</strong><p>Record verified inspection notes and sampling locations.</p></div></div><div><span className="insight-icon"><FlaskConical size={18}/></span><div><strong>Lab-tested parameters</strong><p>Connect verified readings such as dissolved oxygen and relevant contaminants.</p></div></div><div><span className="insight-icon"><ShieldCheck size={18}/></span><div><strong>Interpret with standards</strong><p>Use applicable standards and qualified interpretation before issuing public warnings.</p></div></div></div>
      </article>
    </section>
  </>
}


type AlertSeverity = 'Critical' | 'Warning';
type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';
type WaterAlert = {
  id: number;
  location: string;
  parameter: string;
  reading: string;
  message: string;
  severity: AlertSeverity;
};

const sampleAlerts: WaterAlert[] = [
  {
    id: 1,
    location: 'Mula River',
    parameter: 'Turbidity',
    reading: '5.6 NTU',
    message: 'Sample turbidity is above the prototype review threshold.',
    severity: 'Warning',
  },
  {
    id: 2,
    location: 'Khadakwasla Reservoir',
    parameter: 'TDS',
    reading: '310 mg/L',
    message: 'Sample TDS reading is elevated compared with the other listed location.',
    severity: 'Warning',
  },
  {
    id: 3,
    location: 'Mula River',
    parameter: 'Water level',
    reading: '42%',
    message: 'Sample water-level indicator is marked for monitoring.',
    severity: 'Warning',
  },
];

function AlertsPage() {
  const [alerts, setAlerts] = useState<(WaterAlert & { status: AlertStatus })[]>(
    sampleAlerts.map((alert) => ({ ...alert, status: 'Active' })),
  );
  const [filter, setFilter] = useState<'All' | AlertStatus>('All');

  const updateStatus = (id: number, status: AlertStatus) => {
    setAlerts((current) =>
      current.map((alert) => alert.id === id ? { ...alert, status } : alert),
    );
  };

  const activeCount = alerts.filter((alert) => alert.status === 'Active').length;
  const acknowledgedCount = alerts.filter((alert) => alert.status === 'Acknowledged').length;
  const resolvedCount = alerts.filter((alert) => alert.status === 'Resolved').length;
  const visibleAlerts = filter === 'All' ? alerts : alerts.filter((alert) => alert.status === filter);

  return (
    <>
      <section className="metrics-grid alert-metrics-grid">
        <article className="metric-card alert-metric-card">
          <div className="metric-top"><span>Active alerts</span><span className="metric-icon orange"><ShieldAlert size={20} /></span></div>
          <div className="metric-value">{activeCount}</div>
          <p className="metric-caption">Require review in this demo</p>
          <div className="metric-bottom"><span>DEMO DATA</span><span>Rule-based</span></div>
        </article>
        <article className="metric-card alert-metric-card">
          <div className="metric-top"><span>Acknowledged</span><span className="metric-icon blue"><Clock size={20} /></span></div>
          <div className="metric-value">{acknowledgedCount}</div>
          <p className="metric-caption">Seen by the dashboard user</p>
          <div className="metric-bottom"><span>LOCAL STATE</span><span>Session only</span></div>
        </article>
        <article className="metric-card alert-metric-card">
          <div className="metric-top"><span>Resolved</span><span className="metric-icon aqua"><CheckCircle2 size={20} /></span></div>
          <div className="metric-value">{resolvedCount}</div>
          <p className="metric-caption">Marked as reviewed</p>
          <div className="metric-bottom"><span>LOCAL STATE</span><span>Session only</span></div>
        </article>
        <article className="metric-card alert-metric-card">
          <div className="metric-top"><span>Attention level</span><span className="metric-icon violet"><Activity size={20} /></span></div>
          <div className="metric-value">{activeCount > 0 ? 'Review' : 'Clear'}</div>
          <p className="metric-caption">Based on sample alerts below</p>
          <div className="metric-bottom"><span>NOT LIVE</span><span>Prototype</span></div>
        </article>
      </section>

      <section className="panel alerts-panel">
        <div className="panel-heading alerts-panel-heading">
          <div><h2>Water quality alerts</h2><p>Review sample readings and update their workflow status.</p></div>
          <label className="alert-filter-label">
            <span>Show</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value as 'All' | AlertStatus)}>
              <option>All</option>
              <option>Active</option>
              <option>Acknowledged</option>
              <option>Resolved</option>
            </select>
          </label>
        </div>

        <div className="alerts-list">
          {visibleAlerts.map((alert) => (
            <article className={`alert-row alert-${alert.severity.toLowerCase()} alert-status-${alert.status.toLowerCase()}`} key={alert.id}>
              <div className="alert-severity-icon">
                {alert.severity === 'Critical' ? <AlertTriangle size={21} /> : <ShieldAlert size={21} />}
              </div>
              <div className="alert-main">
                <div className="alert-title-line">
                  <h3>{alert.parameter} — {alert.location}</h3>
                  <span className={`alert-severity-badge ${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                  <span className={`alert-state-badge ${alert.status.toLowerCase()}`}>{alert.status}</span>
                </div>
                <p>{alert.message}</p>
                <div className="alert-reading"><span>Sample reading</span><strong>{alert.reading}</strong></div>
              </div>
              <div className="alert-actions">
                {alert.status === 'Active' && <button className="alert-action-button acknowledge" onClick={() => updateStatus(alert.id, 'Acknowledged')}>Acknowledge</button>}
                {alert.status !== 'Resolved' && <button className="alert-action-button resolve" onClick={() => updateStatus(alert.id, 'Resolved')}>Mark resolved</button>}
                {alert.status !== 'Active' && <button className="alert-action-button reopen" onClick={() => updateStatus(alert.id, 'Active')}>Reopen</button>}
              </div>
            </article>
          ))}
          {visibleAlerts.length === 0 && <div className="alerts-empty"><CheckCircle2 size={22} /><strong>No alerts in this filter</strong><p>Choose another status to see the demo alerts.</p></div>}
        </div>
        <div className="alerts-disclaimer"><AlertTriangle size={17} /><span>Prototype only: these alerts use illustrative sample readings and simplified rules. They are not live measurements or a safety certification.</span></div>
      </section>
    </>
  );
}

function WaterMapPlaceholder() {
  return <WaterMap />;
}

function ConservationPage() {
  const actions = [
    {
      id: 1,
      title: 'Fix leaking taps',
      description: 'Check taps, pipes and toilet cisterns for leaks.',
      saving: 15,
      time: '10–20 min',
      icon: Droplets,
      category: 'Home',
    },
    {
      id: 2,
      title: 'Take shorter showers',
      description: 'Reduce shower time and turn off water when not needed.',
      saving: 20,
      time: 'Daily habit',
      icon: Waves,
      category: 'Daily',
    },
    {
      id: 3,
      title: 'Turn off running taps',
      description: 'Close the tap while brushing or soaping your hands.',
      saving: 8,
      time: 'Daily habit',
      icon: Gauge,
      category: 'Daily',
    },
    {
      id: 4,
      title: 'Reuse suitable water',
      description: 'Reuse suitable rinse water for cleaning or watering plants.',
      saving: 12,
      time: '5–10 min',
      icon: Leaf,
      category: 'Reuse',
    },
    {
      id: 5,
      title: 'Run full laundry loads',
      description: 'Avoid running a washing machine for only a few clothes.',
      saving: 10,
      time: 'Weekly habit',
      icon: Activity,
      category: 'Home',
    },
    {
      id: 6,
      title: 'Collect rainwater',
      description: 'Explore a suitable rainwater collection system where permitted.',
      saving: 25,
      time: 'Planning needed',
      icon: Waves,
      category: 'Reuse',
    },
  ]

  const [completed, setCompleted] = useState<number[]>([])
  const [filter, setFilter] = useState('All')

  const toggleAction = (id: number) => {
    setCompleted((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const visibleActions =
    filter === 'All'
      ? actions
      : actions.filter((action) => action.category === filter)

  const estimatedSavings = actions
    .filter((action) => completed.includes(action.id))
    .reduce((total, action) => total + action.saving, 0)

  const progress = Math.round((completed.length / actions.length) * 100)

  return (
    <>
      <section className="conservation-dashboard-hero">
        <div className="conservation-hero-content">
          <span className="conservation-eyebrow">
            <Leaf size={15} /> SMART CONSERVATION PLANNER
          </span>

          <h2>Every drop has a purpose.</h2>

          <p>
            Build simple water-saving habits, track your actions,
            and explore ways to reduce avoidable water waste.
          </p>

          <div className="conservation-hero-stats">
            <div>
              <strong>{completed.length}/{actions.length}</strong>
              <span>Actions completed</span>
            </div>

            <div>
              <strong>{progress}%</strong>
              <span>Plan progress</span>
            </div>
          </div>
        </div>

        <div className="conservation-hero-art">
          <div className="conservation-water-orbit orbit-one" />
          <div className="conservation-water-orbit orbit-two" />
          <div className="conservation-water-icon">
            <Droplets size={66} strokeWidth={1.4} />
            <Leaf size={27} />
          </div>
        </div>
      </section>

      <section className="conservation-stats-grid">
        <article className="conservation-stat-card">
          <span className="conservation-stat-icon green">
            <CheckCircle2 size={21} />
          </span>

          <div>
            <p>Actions completed</p>
            <h3>{completed.length}</h3>
            <span>Out of {actions.length} suggested actions</span>
          </div>
        </article>

        <article className="conservation-stat-card">
          <span className="conservation-stat-icon blue">
            <Droplets size={21} />
          </span>

          <div>
            <p>Potential daily savings</p>
            <h3>{estimatedSavings} L</h3>
            <span>Illustrative estimate only</span>
          </div>
        </article>

        <article className="conservation-stat-card">
          <span className="conservation-stat-icon purple">
            <Activity size={21} />
          </span>

          <div>
            <p>Plan completion</p>
            <h3>{progress}%</h3>
            <div className="conservation-progress-track">
              <div
                className="conservation-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </article>
      </section>

      <section className="conservation-actions-section">
        <div className="conservation-section-heading">
          <div>
            <span className="recommendation-label">YOUR ACTION PLAN</span>
            <h2>Small actions, better habits.</h2>
            <p>Select an action when you have completed it.</p>
          </div>

          <select
            className="conservation-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter conservation actions"
          >
            <option value="All">All actions</option>
            <option value="Daily">Daily habits</option>
            <option value="Home">Home</option>
            <option value="Reuse">Reuse & recovery</option>
          </select>
        </div>

        <div className="conservation-actions-grid">
          {visibleActions.map((action) => {
            const Icon = action.icon
            const isCompleted = completed.includes(action.id)

            return (
              <article
                className={`conservation-action-card ${
                  isCompleted ? 'action-completed' : ''
                }`}
                key={action.id}
              >
                <div className="conservation-action-top">
                  <span className="conservation-action-icon">
                    <Icon size={22} />
                  </span>

                  <span
                    className={`conservation-action-status ${
                      isCompleted ? 'completed' : ''
                    }`}
                  >
                    {isCompleted ? 'Completed' : action.category}
                  </span>
                </div>

                <h3>{action.title}</h3>
                <p>{action.description}</p>

                <div className="conservation-action-meta">
                  <span>{action.time}</span>
                  <strong>~{action.saving} L/day*</strong>
                </div>

                <button
                  className={`conservation-complete-button ${
                    isCompleted ? 'completed' : ''
                  }`}
                  onClick={() => toggleAction(action.id)}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={17} /> Completed
                    </>
                  ) : (
                    <>
                      <span className="conservation-checkbox" />
                      Mark as completed
                    </>
                  )}
                </button>
              </article>
            )
          })}
        </div>

        <p className="conservation-estimate-note">
          *Water-saving figures are illustrative estimates for demonstration,
          not measured savings. Actual savings depend on usage, equipment,
          local conditions and individual habits.
        </p>
      </section>

      <section className="conservation-bottom-grid">
        <article className="conservation-weekly-card">
          <div className="conservation-bottom-icon">
            <Activity size={22} />
          </div>

          <div>
            <span className="recommendation-label">KEEP GOING</span>
            <h3>Your conservation journey</h3>
            <p>
              Complete more actions to increase your progress.
              Every practical step towards reducing waste matters.
            </p>

            <div className="conservation-bottom-progress">
              <div
                className="conservation-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <span className="conservation-progress-caption">
              {completed.length === actions.length
                ? 'Amazing! You completed the entire demo action plan.'
                : `${actions.length - completed.length} actions remaining`}
            </span>
          </div>
        </article>

        <article className="conservation-safety-card">
          <span className="conservation-safety-icon">
            <ShieldCheck size={22} />
          </span>

          <h3>Reuse water responsibly</h3>

          <p>
            Only reuse water when it is suitable for the intended purpose.
            Do not assume untreated or contaminated water is safe for drinking.
          </p>

          <span className="conservation-safety-label">
            <ShieldCheck size={14} /> Responsible water use
          </span>
        </article>
      </section>
    </>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [period, setPeriod] = useState('7 days')
  const [search, setSearch] = useState('')
  const [apiData, setApiData] = useState<DashboardData | null>(null)
  const [apiError, setApiError] = useState('')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherError, setWeatherError] = useState('')
  const [rainfallSeries, setRainfallSeries] = useState<RainfallSeriesData | null>(null)
  const [rainfallError, setRainfallError] = useState('')
  const [rainfallLoading, setRainfallLoading] = useState(true)

  useEffect(() => {
    getDashboardData()
      .then((data) => {
        setApiData(data)
        setApiError('')
      })
      .catch((error: unknown) => {
        // Keep errors in the console for development/debugging only.
        setApiError(error instanceof Error ? error.message : 'Unable to connect to backend')
        console.error('JalDrishti API error:', error)
      })

    getWeatherData()
      .then((data) => {
        setWeather(data)
        setWeatherError('')
      })
      .catch((error: unknown) => {
        // Do not expose API errors in the website UI.
        setWeatherError(error instanceof Error ? error.message : 'Unable to fetch weather data')
        console.error('JalDrishti weather API error:', error)
      })

    getRainfallSeries()
      .then((data) => {
        setRainfallSeries(data)
        setRainfallError('')
      })
      .catch((error: unknown) => {
        // Do not expose API errors in the website UI.
        setRainfallError(error instanceof Error ? error.message : 'Unable to fetch rainfall data')
        console.error('JalDrishti rainfall API error:', error)
      })
      .finally(() => setRainfallLoading(false))
  }, [])

  const filteredLocations = useMemo(() => locations.filter((location) =>
    `${location.name} ${location.area}`.toLowerCase().includes(search.toLowerCase())), [search])

  const renderPage = () => {
    switch (activePage) {
      case 'Water Quality': return <WaterQualityPage />
      case 'Rainfall': return <RainfallPage rainfall={rainfallSeries} rainfallError={rainfallError} loading={rainfallLoading} />
      case 'Forecast': return <ForecastPage rainfall={rainfallSeries} rainfallError={rainfallError} loading={rainfallLoading} />
      case 'Water Levels': return <WaterLevelsPage />
      case 'Pollution': return <PollutionPage />
      case 'Alerts': return <AlertsPage />
      case 'Water Map': return <WaterMapPlaceholder />
      case 'Conservation': return <ConservationPage />
      default:
        return (
          <OverviewPage
            filteredLocations={filteredLocations}
            search={search}
            setSearch={setSearch}
            setActivePage={setActivePage}
            period={period}
            setPeriod={setPeriod}
            weather={weather}
            weatherError={weatherError}
          />
        )
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Brand />
          <button
            className="icon-button mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? 'active' : ''}`}
              onClick={() => {
                setActivePage(label)
                setMenuOpen(false)
              }}
            >
              <Icon size={19} strokeWidth={1.8}/>
              <span>{label}</span>
              {label === 'Pollution' && <span className="nav-dot"/>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="conservation-card">
            <div className="conservation-icon"><Leaf size={19}/></div>
            <h3>Every drop counts.</h3>
            <p>Small actions today create a water-secure tomorrow.</p>
            <button onClick={() => setActivePage('Conservation')}>
              Explore tips <span>→</span>
            </button>
          </div>

          <div className="profile-row">
            <div className="avatar">JD</div>
            <div className="profile-info">
              <strong>Water Observer</strong>
              <span>Free workspace</span>
            </div>
            <ChevronDown size={16}/>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22}/>
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <div className="location-chip">
              <MapPin size={15}/>
              <span>Pune, India</span>
              <ChevronDown size={14}/>
            </div>

            <button
              className="icon-button notification-button"
              aria-label="Open alerts"
              onClick={() => setActivePage("Alerts")}
            >
              <Bell size={19}/><i/>
            </button>

            <div className="top-avatar">JD</div>
          </div>
        </header>

        <div className="page-container">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="live-dot"/> WATER INTELLIGENCE PLATFORM
              </div>
              <h1>{activePage === 'Overview' ? 'Water, in a clearer view.' : activePage}</h1>
              <p>{descriptions[activePage]}</p>
            </div>

            <div className="date-label">
              <span className="date-icon">◷</span>WATER INTELLIGENCE PLATFORM
            </div>
          </div>

          <DataNotice />

          <div key={activePage} className="page-transition">
            {renderPage()}
          </div>

          <footer className="footer">
            <Brand />
            <span>Designed for a water-conscious future.</span>
            <span>JalDrishti © 2026</span>
          </footer>
        </div>
      </main>
    </div>
  )
}
export default App
