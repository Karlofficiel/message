/**
 * Configuration de l'application de messagerie sécurisée
 */

const config = {
  // Configuration serveur
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // Configuration WebSocket
  websocket: {
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    messageQueueSize: 50
  },

  // Configuration fichiers
  files: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFilesPerUpload: 10,
    allowedTypes: {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      documents: [
        'application/pdf', 
        'text/plain', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
      video: ['video/mp4', 'video/webm', 'video/ogg']
    },
    dangerousExtensions: ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.msi', '.dll', '.sys']
  },

  // Configuration audio
  audio: {
    maxDuration: 300, // 5 minutes
    sampleRate: 44100,
    channelCount: 1,
    audioBitsPerSecond: 128000
  },

  // Configuration messages
  messages: {
    maxLength: 1000,
    maxDisplayed: 100,
    autoScroll: true
  },

  // Configuration sécurité
  security: {
    encryptionAlgorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12
  },

  // Configuration interface
  ui: {
    notificationTimeout: 5000,
    maxNotifications: 5,
    animationDuration: 300,
    responsiveBreakpoints: {
      mobile: 768,
      tablet: 1024
    }
  },

  // Configuration développement
  development: {
    debug: process.env.NODE_ENV !== 'production',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

// Fonction pour obtenir une configuration
function getConfig(path) {
  return path.split('.').reduce((obj, key) => obj && obj[key], config);
}

// Fonction pour valider la configuration
function validateConfig() {
  const errors = [];

  // Vérifier les ports
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('Port serveur invalide');
  }

  // Vérifier les tailles de fichiers
  if (config.files.maxFileSize <= 0) {
    errors.push('Taille de fichier maximale invalide');
  }

  // Vérifier les limites de messages
  if (config.messages.maxLength <= 0) {
    errors.push('Longueur maximale de message invalide');
  }

  if (errors.length > 0) {
    console.error('Erreurs de configuration:', errors);
    return false;
  }

  return true;
}

// Export pour usage global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { config, getConfig, validateConfig };
} else if (typeof window !== 'undefined') {
  window.config = config;
  window.getConfig = getConfig;
  window.validateConfig = validateConfig;
} 