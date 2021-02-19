import io from 'socket.io-client'

const ENDPOINT = "http://192.168.8.151:10014/"

const socket = io(ENDPOINT, {
    transports: ['websocket', 'polling', 'flashsocket'],
    reconnection: true,
    //upgrade: true,
    //reconnectionDelay: 100,
    //reconnectionDelayMax: 200
    reconnectionAttempts: Infinity})

export default socket