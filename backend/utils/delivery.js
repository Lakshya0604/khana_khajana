export const DELIVERY_FEE = 40
export const MAX_RIDER_KM = 5
export const LOCATION_FRESH_MS = 10 * 60 * 1000

export const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const toRad = d => d * Math.PI / 180
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
}

// A rider counts as "location on" only with a real fix received recently
export const riderLocationOk = (rider) => {
    const c = rider?.location?.coordinates
    if (!c || (c[0] === 0 && c[1] === 0)) return false
    if (!rider.locationUpdatedAt) return false
    return Date.now() - new Date(rider.locationUpdatedAt).getTime() <= LOCATION_FRESH_MS
}

// A rider holding this much undeposited COD cash gets no new COD orders until it is deposited
export const COD_DEPOSIT_LIMIT = 500
