import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapComponent = ({ address }) => {
  const defaultCoordinates = [21.028511, 105.804817]; // Hà Nội
  const defaultAddress = "Hà Nội";
  const [coordinates, setCoordinates] = useState(defaultCoordinates);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const geocode = async () => {
      if (!address) {
        setCoordinates(defaultCoordinates);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
          )}`
        );
        if (!response.ok) throw new Error("Failed to fetch coordinates");
        const data = await response.json();
        if (data.length > 0) {
          const { lat, lon } = data[0];
          setCoordinates([parseFloat(lat), parseFloat(lon)]);
        } else {
          setCoordinates(defaultCoordinates);
        }
      } catch (error) {
        setCoordinates(defaultCoordinates);
      } finally {
        setLoading(false);
      }
    };

    geocode();
  }, [address]);

  return loading ? (
    <div>Đang tải bản đồ...</div>
  ) : (
    <MapContainer
      center={coordinates}
      zoom={15}
      style={{ width: "100%", height: "400px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={coordinates}>
        <Popup>{address || defaultAddress}</Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent;
