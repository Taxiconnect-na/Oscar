import io from 'socket.io-client'

const ENDPOINT = process.env.REACT_APP_GATEWAY
//const ENDPOINT = process.env.REACT_APP_GATEWAY

const socket = io(ENDPOINT, {
    transports: ['websocket', 'polling', 'flashsocket'],
    reconnection: true,
    withCredentials: true,
    //upgrade: true,
    //reconnectionDelay: 100,
    //reconnectionDelayMax: 200
    reconnectionAttempts: Infinity})

export default socket