// Build a wa.me link so a customer can send an order straight to the shop on WhatsApp.
// Free: no WhatsApp Business API, it just opens the WhatsApp chat with the order text filled in.

// Keeps digits only. A 10 digit Indian number gets the 91 country code.
export const toWhatsAppNumber = (raw) => {
    const digits = String(raw || "").replace(/\D/g, "")
    if (digits.length === 10) return `91${digits}`
    if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`
    if (digits.length >= 11 && digits.length <= 15) return digits
    return null
}

export const buildOrderMessage = ({ shopName, items, customerName, address }) => {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const lines = items.map((i, idx) => `${idx + 1}. ${i.name} x ${i.quantity} = Rs ${i.price * i.quantity}`)
    return [
        `Hi ${shopName || "team"}, I want to place an order from Khana Khajana:`,
        "",
        ...lines,
        "",
        `Items total: Rs ${total}`,
        customerName ? `Name: ${customerName}` : null,
        address ? `Delivery address: ${address}` : "Delivery address: (will share here)",
        "",
        "Please confirm the order and delivery time. Thanks!"
    ].filter(l => l !== null).join("\n")
}

export const buildWhatsAppUrl = (number, message) =>
    `https://wa.me/${number}?text=${encodeURIComponent(message)}`
