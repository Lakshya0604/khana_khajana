import React from "react";
import scooter from "../photos/scooter.png";
import home from "../photos/home.png";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer
} from "react-leaflet";

const deliveryBoyIcon = new L.Icon({
    iconUrl: scooter,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

const customerIcon = new L.Icon({
    iconUrl: home,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
});

function DeliveryBoyTracking({ data }) {

    // ===== Safety Checks =====

    if (!data) {
        return (
            <div className="w-full h-[400px] flex justify-center items-center border rounded-xl bg-gray-100">
                Loading map...
            </div>
        );
    }

    const deliveryBoyLat = Number(data?.deliveryBoyLocation?.lat);
    const deliveryBoyLon = Number(data?.deliveryBoyLocation?.lon);

    const customerLat = Number(data?.customerLocation?.lat);
    const customerLon = Number(data?.customerLocation?.lon);

    const isValid =
        !isNaN(deliveryBoyLat) &&
        !isNaN(deliveryBoyLon) &&
        !isNaN(customerLat) &&
        !isNaN(customerLon);

    if (!isValid) {
        return (
            <div className="w-full h-[400px] flex justify-center items-center border rounded-xl bg-gray-100">
                Waiting for location...
            </div>
        );
    }

    const center = [deliveryBoyLat, deliveryBoyLon];

    const path = [
        [deliveryBoyLat, deliveryBoyLon],
        [customerLat, customerLon]
    ];

    return (
        <div className="w-full h-[400px] mt-3 rounded-xl overflow-hidden shadow-md">

            <MapContainer
                center={center}
                zoom={16}
                className="w-full h-full"
            >

                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                    position={[deliveryBoyLat, deliveryBoyLon]}
                    icon={deliveryBoyIcon}
                >
                    <Popup>Delivery Boy</Popup>
                </Marker>

                <Marker
                    position={[customerLat, customerLon]}
                    icon={customerIcon}
                >
                    <Popup>Customer</Popup>
                </Marker>

                <Polyline
                    positions={path}
                    color="blue"
                    weight={5}
                />

            </MapContainer>

        </div>
    );
}

export default DeliveryBoyTracking;