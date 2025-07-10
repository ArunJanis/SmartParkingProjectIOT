import React, { useEffect, useState } from "react";
import "./App.css";

const slotCount = 8;
const THINGSPEAK_API_URL =
  "https://api.thingspeak.com/channels/3006400/feeds.json?api_key=RLD0CRBWSEZIRV7G&results=1";

function App() {
  const [slots, setSlots] = useState(Array(slotCount).fill(1));
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = () => {
    setSyncing(true);

    fetch(THINGSPEAK_API_URL)
      .then((res) => res.json())
      .then((data) => {
        const feed = data.feeds[0];
        const updated = [];
        for (let i = 1; i <= slotCount; i++) {
          const v = parseInt(feed[`field${i}`]);
          updated.push(isNaN(v) ? 1 : v); // default to available
        }
        setSlots(updated);
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch((err) => {
        console.error("Failed to fetch:", err);
      })
      .finally(() => {
        setTimeout(() => setSyncing(false), 5000);
      });
  };

  useEffect(() => {
    fetchData(); // initial load
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = (v) => (v === 0 ? "Occupied" : "Available");
  const getStatusClass = (v) => (v === 0 ? "taken" : "available");

  return (
    <div className="wrapper">
      <div className="parking-container">
        <h1>Smart Parking</h1>

        {syncing && <div className="sync-indicator">🔄 Syncing...</div>}

        <div className="info-bar">
          <div className="last-updated">
            Last updated: {lastUpdated || "Loading..."}
          </div>
          <button className="refresh-btn" onClick={fetchData}>
            🔁 Refresh Now
          </button>
        </div>

        <div className="parking-layout">
          <div className="slot-row top">
            {slots.slice(0, 4).map((status, i) => (
              <div className={`slot ${getStatusClass(status)}`} key={i}>
                <div className="slot-title">Slot {i + 1}</div>
                <div className="status-text">{getStatusText(status)}</div>
              </div>
            ))}
          </div>

          <div className="road">
            - - - - - - - - - - - - - Central Road - - - - - - - - - - - - -
          </div>

          <div className="slot-row bottom">
            {slots.slice(4, 8).map((status, i) => (
              <div className={`slot ${getStatusClass(status)}`} key={i + 4}>
                <div className="slot-title">Slot {i + 5}</div>
                <div className="status-text">{getStatusText(status)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


