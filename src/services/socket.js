import io from "socket.io-client";

// Utiliser l'URL du serveur de production
const socketUrl = window.location.hostname === 'localhost' 
  ? "http://localhost:30072" 
  : `http://${window.location.hostname}:30072`;

const socket = io(socketUrl);
export default socket;
