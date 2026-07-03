import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serveur HTTP pour servir les fichiers statiques
const server = createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  const extname = filePath.split('.').pop();
  
  const mimeTypes = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json'
  };

  try {
    const content = readFileSync(join(__dirname, filePath));
    res.writeHead(200, { 'Content-Type': mimeTypes[extname] || 'text/plain' });
    res.end(content);
  } catch (error) {
    res.writeHead(404);
    res.end('File not found');
  }
});

// Serveur WebSocket
const wss = new WebSocketServer({ server });

// Stockage des utilisateurs connectés (volatile)
const connectedUsers = new Map();
let userCounter = 1;

wss.on('connection', (ws) => {
  // Génération d'un pseudo temporaire
  const userId = `Invité${userCounter++}`;
  connectedUsers.set(ws, { id: userId, connected: Date.now() });
  
  console.log(`${userId} s'est connecté`);
  
  // Envoi de l'ID utilisateur
  ws.send(JSON.stringify({
    type: 'user_id',
    userId: userId
  }));
  
  // Diffusion du nombre d'utilisateurs connectés
  broadcastUserCount();
  
  // Gestion des messages reçus
  ws.on('message', (data) => {
    try {
      // Limiter la taille des messages
      if (data.length > 10 * 1024 * 1024) { // 10MB max
        console.warn('Message trop volumineux rejeté');
        return;
      }
      
      const message = JSON.parse(data.toString());
      
      // Validation basique du message
      if (!message || typeof message !== 'object') {
        console.warn('Message invalide rejeté');
        return;
      }
      
      // Ajout du timestamp et de l'utilisateur
      message.timestamp = Date.now();
      message.userId = connectedUsers.get(ws).id;
      
      // Diffusion du message à tous les clients connectés
      broadcast(message, ws);
      
    } catch (error) {
      console.error('Erreur lors du traitement du message:', error);
    }
  });
  
  // Gestion de la déconnexion
  ws.on('close', () => {
    const user = connectedUsers.get(ws);
    if (user) {
      console.log(`${user.id} s'est déconnecté`);
      connectedUsers.delete(ws);
      broadcastUserCount();
    }
  });
  
  ws.on('error', (error) => {
    console.error('Erreur WebSocket:', error);
  });
});

// Fonction pour diffuser un message à tous les clients
function broadcast(message, sender) {
  const messageStr = JSON.stringify(message);
  
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === 1) {
      client.send(messageStr);
    }
  });
}

// Fonction pour diffuser le nombre d'utilisateurs connectés
function broadcastUserCount() {
  const userCount = connectedUsers.size;
  const message = JSON.stringify({
    type: 'user_count',
    count: userCount
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Permet l'accès depuis l'extérieur
server.listen(PORT, HOST, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Application accessible sur http://localhost:${PORT}`);
  console.log(`Réseau local: http://192.168.1.125:${PORT}`);
});