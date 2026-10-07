// Fetch a fresh snapshot on every connection, including reconnections.
// The immediate call also covers a socket that connected before this view mounted.
export const subscribeOrderResync = (socket, refresh) => {
    if (!socket) return () => {}
    socket.on('connect', refresh)
    if (socket.connected) refresh()
    return () => socket.off('connect', refresh)
}
