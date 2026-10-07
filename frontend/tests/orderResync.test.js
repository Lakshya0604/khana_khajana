import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { subscribeOrderResync } from '../src/utils/orderResync.js'

test('reconnect fetches the status missed while disconnected; cleanup stops fetching', () => {
    const socket = new EventEmitter()
    socket.connected = true
    let persistedStatus = 'preparing'
    let shownStatus
    let requests = 0
    const stop = subscribeOrderResync(socket, () => {
        requests++
        shownStatus = persistedStatus // Stand-in for the order snapshot API.
    })
    assert.equal(shownStatus, 'preparing')
    socket.connected = false
    persistedStatus = 'delivered' // No status event reaches the disconnected UI.
    assert.equal(shownStatus, 'preparing')
    socket.connected = true
    socket.emit('connect')
    assert.equal(shownStatus, 'delivered')
    assert.equal(requests, 2)
    stop()
    socket.emit('connect')
    assert.equal(requests, 2)
    assert.equal(socket.listenerCount('connect'), 0)
})

test('listener is ready before first connection; no socket is safe', () => {
    const socket = new EventEmitter()
    socket.connected = false
    let requests = 0
    const stop = subscribeOrderResync(socket, () => requests++)
    assert.equal(requests, 0)
    socket.emit('connect')
    socket.emit('connect')
    assert.equal(requests, 2)
    stop()
    subscribeOrderResync(null, () => assert.fail())()
})
