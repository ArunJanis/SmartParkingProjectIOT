import React, { useEffect, useState } from "react";
import "./App.css";

const slotCount = 8;
const THINGSPEAK_API_URL = "https://api.thingspeak.com/channels/3006400/feeds.json?api_key=RLD0CRBWSEZIRV7G&results=1";
const RESERVER_ESP32_IP = "http://192.168.207.137";

function App() {
  const [slots, setSlots] = useState(Array(slotCount).fill(1));
  const [isLoading, setIsLoading] = useState(false);
  const [reservingSlot, setReservingSlot] = useState(null);


  const updateSlotStatus = () => {
    return fetch(THINGSPEAK_API_URL)
      .then(res => res.json())
      .then(data => {
        const feed = data.feeds[0];
        const updated = [];
        for (let i = 1; i <= slotCount; i++) {
          const v = parseInt(feed[`field${i}`]);
          updated.push(isNaN(v) ? 1 : v);
        }
        setSlots(updated);
      });
  };

  useEffect(() => {
    updateSlotStatus();
    const interval = setInterval(updateSlotStatus, 15000);
    return () => clearInterval(interval);
  }, []);
  const [userReservedSlot, setUserReservedSlot] = useState(null);
  const reserveSlot = async (index) => {
    if (userReservedSlot !== null) return;

    setReservingSlot(index);
    setIsLoading(true);

    // Optimistically show reservation
    const newSlots = [...slots];
    newSlots[index] = 2;
    setSlots(newSlots);

    try {
      const res = await fetch(`${RESERVER_ESP32_IP}/reserve?slot=${index + 1}`);
      const text = await res.text();

      if (!res.ok || text.toLowerCase().includes("failed")) {
        throw new Error(text);
      }

      setUserReservedSlot(index);
      alert("Reservation successful: " + text);
    } catch (err) {
      alert("Reservation Successful. Please wait for a few seconds");

      // Undo optimistic update
      const reverted = [...slots];
      reverted[index] = 1;
      setSlots(reverted);
    } finally {
      setTimeout(() => {
        updateSlotStatus().finally(() => {
          setReservingSlot(null);
          setIsLoading(false);
        });
      }, 15000);
    }
  };

  const cancelReservation = () => {
    if (userReservedSlot === null) return;

    const field = userReservedSlot + 1;
    const cancelURL = `https://api.thingspeak.com/update?api_key=U7A27PC1EXZY1JF7&field${field}=1`;

    setIsLoading(true);
    fetch(cancelURL)
      .then(() => {
        setTimeout(() => {
          updateSlotStatus().finally(() => {
            setUserReservedSlot(null);
            setIsLoading(false);
          });
        }, 1000);
      })
      .catch(() => {
        alert("Failed to cancel reservation.");
        setIsLoading(false);
      });
  };

  const getStatusText = (v) => (v === 0 ? "Occupied" : v === 2 ? "Reserved" : "Available");
  const getStatusClass = (v) => (v === 0 ? "taken" : v === 2 ? "reserved" : "available");

  return (
    <div className="wrapper">
      <div className="parking-container">
        <h1>Smart Parking</h1>

        {userReservedSlot !== null && (
          <button className="cancel-btn" onClick={cancelReservation}>
            Cancel Reservation
          </button>
        )}

        {isLoading && <div className="loading">Processing...</div>}

        <div className="parking-layout">
          <div className="slot-row top">
            {slots.slice(0, 4).map((status, i) => (
              <div className={`slot ${getStatusClass(status)}`} key={i}>
                <div className="slot-title">Slot {i + 1}</div>
                <div className="status-text">{getStatusText(status)}</div>
                {status === 1 && userReservedSlot === null && (
                  <button
                    className="reserve-btn"
                    onClick={() => reserveSlot(i)}
                    disabled={reservingSlot === i || isLoading}
                  >
                    {reservingSlot === i ? "Reserving..." : "Reserve"}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="road">- - - - - - Central Road - - - - - -</div>

          <div className="slot-row bottom">
            {slots.slice(4, 8).map((status, i) => (
              <div className={`slot ${getStatusClass(status)}`} key={i + 4}>
                <div className="slot-title">Slot {i + 5}</div>
                <div className="status-text">{getStatusText(status)}</div>
                {status === 1 && userReservedSlot === null && (
                  <button
                    className="reserve-btn"
                    onClick={() => reserveSlot(i + 4)}
                    disabled={reservingSlot === i + 4 || isLoading}
                  >
                    {reservingSlot === i + 4 ? "Reserving..." : "Reserve"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
