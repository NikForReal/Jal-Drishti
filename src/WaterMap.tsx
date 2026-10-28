import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { Search, MapPin, Droplets } from "lucide-react";
import "leaflet/dist/leaflet.css";

type WaterLocation = {
  id: number;
  name: string;
  city: string;
  position: [number, number];
  ph: number;
  tds: number;
  turbidity: number;
};

const locations: WaterLocation[] = [
  { id: 1, name: "Monitoring Station 01", city: "Pune", position: [18.5204, 73.8567], ph: 7.2, tds: 280, turbidity: 2.1 },
  { id: 2, name: "Monitoring Station 02", city: "Mumbai", position: [19.076, 72.8777], ph: 6.4, tds: 620, turbidity: 7.8 },
  { id: 3, name: "Monitoring Station 03", city: "Nashik", position: [19.9975, 73.7898], ph: 7.0, tds: 350, turbidity: 3.4 },
  { id: 4, name: "Monitoring Station 04", city: "Nagpur", position: [21.1458, 79.0882], ph: 8.1, tds: 420, turbidity: 4.2 },
  { id: 5, name: "Monitoring Station 05", city: "Chhatrapati Sambhajinagar", position: [19.8762, 75.3433], ph: 5.9, tds: 750, turbidity: 9.1 },
];

function getStatus(ph: number, tds: number, turbidity: number) {
  if (ph < 6.5 || ph > 8.5 || tds > 500 || turbidity > 5) return "Poor";
  if (ph < 6.8 || ph > 8.0 || tds > 300 || turbidity > 3) return "Moderate";
  return "Good";
}

function getColor(status: string) {
  if (status === "Good") return "#22c55e";
  if (status === "Moderate") return "#f59e0b";
  return "#ef4444";
}

function MapController({ selected }: { selected: WaterLocation | null }) {
  const map = useMap();

  useEffect(() => {
    if (selected) map.flyTo(selected.position, 10, { duration: 0.8 });
  }, [map, selected]);

  return null;
}

export default function WaterMap() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WaterLocation | null>(null);

  const filteredLocations = locations.filter((location) =>
    `${location.name} ${location.city}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="water-map-page" style={{ width: "100%", color: "#263f54" }}>
      <div className="water-map-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 7px", color: "#204458", fontSize: 25 }}>Interactive Water Map</h2>
          <p style={{ margin: 0, color: "#8295a6", fontSize: 12 }}>Explore water monitoring stations across Maharashtra.</p>
        </div>
        <span className="map-demo-badge" style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 8, background: "#eaf8ef", color: "#258357", fontSize: 10, fontWeight: 800 }}>DEMO DATA</span>
      </div>

      <div className="water-map-layout" style={{ display: "grid", gridTemplateColumns: "258px minmax(0, 1fr)", gap: 16, alignItems: "stretch" }}>
        <aside className="water-map-sidebar" style={{ minWidth: 0, overflow: "hidden", padding: 15, border: "1px solid #e5edf2", borderRadius: 14, background: "#fff" }}>
          <div className="water-map-search" style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 17, padding: 11, border: "1px solid #e0e8ef", borderRadius: 9, color: "#8295a6" }}>
            <Search size={18} />
            <input style={{ width: "100%", minWidth: 0, border: 0, outline: 0, background: "transparent", color: "#405f73", fontSize: 12 }} type="text" placeholder="Search location..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          <div className="water-map-legend" style={{ display: "flex", flexWrap: "wrap", gap: 10, paddingBottom: 16, borderBottom: "1px solid #edf2f5" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11 }}><i style={{ background: "#22c55e", width: 8, height: 8, borderRadius: "50%" }} />Good</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11 }}><i style={{ background: "#f59e0b", width: 8, height: 8, borderRadius: "50%" }} />Moderate</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11 }}><i style={{ background: "#ef4444", width: 8, height: 8, borderRadius: "50%" }} />Poor</span>
          </div>

          <h3 style={{ display: "flex", justifyContent: "space-between", gap: 8, margin: "18px 0 12px", fontSize: 13, color: "#36576a" }}>
            Monitoring Stations <span style={{ background: "#e5f8f4", padding: "4px 7px", borderRadius: 7 }}>{filteredLocations.length}</span>
          </h3>

          <div className="water-station-list" style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 390, overflowY: "auto" }}>
            {filteredLocations.map((location) => {
              const status = getStatus(location.ph, location.tds, location.turbidity);
              return (
                <button
                  type="button"
                  className={`water-station-card ${selected?.id === location.id ? "active" : ""}`}
                  key={location.id}
                  onClick={() => setSelected(location)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", padding: 12, textAlign: "left", border: `1px solid ${selected?.id === location.id ? "#b7e5df" : "#edf1f5"}`, borderRadius: 9, background: selected?.id === location.id ? "#edf8f7" : "#f8fafc", color: "#36576a", cursor: "pointer" }}
                >
                  <MapPin size={19} color={getColor(status)} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: 11, lineHeight: 1.5 }}>{location.name}</strong>
                    <p style={{ margin: "5px 0", color: "#8393a3", fontSize: 11 }}>{location.city}</p>
                    <span style={{ color: getColor(status), fontSize: 10, fontWeight: 700 }}>{status} Water Quality</span>
                  </div>
                </button>
              );
            })}
            {filteredLocations.length === 0 && <p style={{ color: "#8393a3", fontSize: 12 }}>No locations found.</p>}
          </div>
        </aside>

        <div className="water-map-main" style={{ display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", border: "1px solid #e5edf2", borderRadius: 14, background: "#fff" }}>
          <MapContainer
            center={[19.2, 75.2]}
            zoom={6}
            scrollWheelZoom
            className="water-leaflet-map"
            style={{ width: "100%", height: 445, minHeight: 350, background: "#dbeafe", position: "relative", overflow: "hidden" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController selected={selected} />
            {filteredLocations.map((location) => {
              const status = getStatus(location.ph, location.tds, location.turbidity);
              return (
                <CircleMarker
                  key={location.id}
                  center={location.position}
                  radius={selected?.id === location.id ? 12 : 9}
                  pathOptions={{ color: "#ffffff", weight: 2, fillColor: getColor(status), fillOpacity: 0.95 }}
                  eventHandlers={{ click: () => setSelected(location) }}
                >
                  <Popup>
                    <div className="water-map-popup" style={{ minWidth: 155, color: "#263f54" }}>
                      <h3 style={{ margin: "0 0 5px", fontSize: 14 }}>{location.name}</h3>
                      <p>{location.city}</p>
                      <strong style={{ color: getColor(status) }}>{status} Water Quality</strong>
                      <hr />
                      <p>pH: {location.ph}</p>
                      <p>TDS: {location.tds} ppm</p>
                      <p>Turbidity: {location.turbidity} NTU</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
          <div className="water-map-info" style={{ display: "flex", alignItems: "center", gap: 9, minHeight: 50, padding: 13, color: "#718696", fontSize: 12 }}>
            <Droplets size={18} color="#139b91" />
            <span>{selected ? `${selected.name} — ${selected.city}` : "Select a marker or station to explore its details."}</span>
          </div>
        </div>
      </div>

      {selected && (
        <div className="water-selected-details" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 22, marginTop: 16, padding: 18, border: "1px solid #e5edf2", borderRadius: 12, background: "#fff" }}>
          <div><span>Selected Station</span><h3>{selected.name}</h3><p>{selected.city}, Maharashtra</p></div>
          <div><span>pH Level</span><strong>{selected.ph}</strong></div>
          <div><span>TDS</span><strong>{selected.tds} ppm</strong></div>
          <div><span>Turbidity</span><strong>{selected.turbidity} NTU</strong></div>
          <div><span>Status</span><strong style={{ color: getColor(getStatus(selected.ph, selected.tds, selected.turbidity)) }}>{getStatus(selected.ph, selected.tds, selected.turbidity)}</strong></div>
          <button type="button" onClick={() => setSelected(null)} style={{ marginLeft: "auto", padding: "9px 12px", border: "1px solid #b7e5df", borderRadius: 8, background: "#edf8f7", color: "#087d80", cursor: "pointer" }}>Clear Selection</button>
        </div>
      )}
      <style>{`
        @media (max-width: 1050px) {
          .water-map-layout { grid-template-columns: 1fr !important; }
          .water-station-list { max-height: 280px !important; }
        }
        @media (max-width: 600px) {
          .water-map-heading h2 { font-size: 21px !important; }
          .water-leaflet-map { height: 340px !important; min-height: 300px !important; }
        }
      `}</style>
    </div>
  );
}
