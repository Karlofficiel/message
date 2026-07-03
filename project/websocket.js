/**
 * Module de gestion WebSocket pour la messagerie temps réel
 */

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.messageQueue = [];
    this.callbacks = {};
  }

  /**
   * Établit une connexion WebSocket
   */
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      this.handleError(error);
    }
  }

  /**
   * Configure les gestionnaires d'événements WebSocket
   */
  setupEventHandlers() {
    this.ws.onopen = (event) => {
      console.log('Connexion WebSocket établie');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Envoyer les messages en attente
      this.flushMessageQueue();
      
      // Notifier les callbacks
      this.trigger('connected', event);
      
      // Afficher notification de connexion
      this.showNotification('Connexion établie', 'success');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Erreur lors du parsing du message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('Connexion WebSocket fermée:', event.code, event.reason);
      this.isConnected = false;
      this.trigger('disconnected', event);
      
      // Tentative de reconnexion si ce n'est pas une fermeture intentionnelle
      if (event.code !== 1000 && event.code !== 1001 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.showNotification('Connexion perdue. Rechargez la page.', 'error');
      } else if (event.code === 1000 || event.code === 1001) {
        this.showNotification('Connexion fermée', 'info');
      }
    };

    this.ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      this.handleError(error);
    };
  }

  /**
   * Gère les messages reçus via WebSocket
   * @param {Object} message - Message reçu
   */
  async handleMessage(message) {
    switch (message.type) {
      case 'user_id':
        this.trigger('user_id', message.userId);
        break;
        
      case 'user_count':
        this.trigger('user_count', message.count);
        break;
        
      case 'text_message':
        const decryptedText = await this.decryptMessage(message.content);
        this.trigger('message', {
          ...message,
          content: decryptedText,
          decrypted: true
        });
        break;
        
      case 'voice_message':
        this.trigger('voice_message', message);
        break;
        
      case 'file_message':
        this.trigger('file_message', message);
        break;
        
      default:
        console.warn('Type de message non reconnu:', message.type);
    }
  }

  /**
   * Déchiffre un message reçu
   * @param {string} encryptedContent - Contenu chiffré
   * @returns {string} - Contenu déchiffré
   */
  async decryptMessage(encryptedContent) {
    try {
      if (!cryptoManager.keyGenerated) {
        return '[Message chiffré - clé non disponible]';
      }
      
      if (!encryptedContent || typeof encryptedContent !== 'string') {
        return '[Message invalide]';
      }
      
      const { encrypted, iv } = cryptoManager.deserializeEncrypted(encryptedContent);
      return await cryptoManager.decrypt(encrypted, iv);
    } catch (error) {
      console.error('Erreur lors du déchiffrement:', error);
      return '[Message non déchiffrable]';
    }
  }

  /**
   * Envoie un message texte chiffré
   * @param {string} text - Texte à envoyer
   */
  async sendTextMessage(text) {
    try {
      if (!cryptoManager.keyGenerated) {
        throw new Error('Clé de chiffrement non disponible');
      }

      const encrypted = await cryptoManager.encrypt(text);
      const serialized = cryptoManager.serializeEncrypted(encrypted.encrypted, encrypted.iv);
      
      const message = {
        type: 'text_message',
        content: serialized
      };
      
      this.sendMessage(message);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      this.showNotification('Erreur lors de l\'envoi du message', 'error');
    }
  }

  /**
   * Envoie un message vocal
   * @param {Blob} audioBlob - Données audio
   */
  async sendVoiceMessage(audioBlob) {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const encrypted = await cryptoManager.encrypt(arrayBuffer);
      const serialized = cryptoManager.serializeEncrypted(encrypted.encrypted, encrypted.iv);
      
      const message = {
        type: 'voice_message',
        content: serialized,
        duration: audioBlob.duration || 0
      };
      
      this.sendMessage(message);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message vocal:', error);
      this.showNotification('Erreur lors de l\'envoi du message vocal', 'error');
    }
  }

  /**
   * Envoie des fichiers
   * @param {Array} files - Liste des fichiers à envoyer
   */
  async sendFiles(files) {
    for (const file of files) {
      try {
        // Vérifier la taille du fichier (limite 10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.showNotification(`Fichier "${file.name}" trop volumineux (max 10MB)`, 'warning');
          continue;
        }

        const encryptedFile = await cryptoManager.encryptFile(file);
        const serialized = cryptoManager.serializeEncrypted(encryptedFile.encrypted, encryptedFile.iv);
        
        const message = {
          type: 'file_message',
          content: serialized,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        };
        
        this.sendMessage(message);
      } catch (error) {
        console.error(`Erreur lors de l'envoi du fichier "${file.name}":`, error);
        this.showNotification(`Erreur lors de l'envoi de "${file.name}"`, 'error');
      }
    }
  }

  /**
   * Envoie un message via WebSocket
   * @param {Object} message - Message à envoyer
   */
  sendMessage(message) {
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Ajouter à la queue pour envoi ultérieur
      this.messageQueue.push(message);
      
      if (!this.isConnected) {
        this.showNotification('Connexion perdue, message mis en attente', 'warning');
      }
    }
  }

  /**
   * Envoie tous les messages en attente
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Tentative de reconnexion
   */
  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.showNotification(`Reconnexion dans ${delay/1000}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'warning');
    
    setTimeout(() => {
      console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect();
    }, delay);
  }

  /**
   * Gère les erreurs WebSocket
   * @param {Error} error - Erreur
   */
  handleError(error) {
    console.error('Erreur WebSocket:', error);
    this.trigger('error', error);
    
    if (!this.isConnected) {
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  /**
   * Ajoute un callback pour un type d'événement
   * @param {string} event - Type d'événement
   * @param {Function} callback - Fonction callback
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  /**
   * Supprime un callback
   * @param {string} event - Type d'événement
   * @param {Function} callback - Fonction callback à supprimer
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Déclenche les callbacks pour un événement
   * @param {string} event - Type d'événement
   * @param {*} data - Données à passer aux callbacks
   */
  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  /**
   * Affiche une notification
   * @param {string} message - Message de notification
   * @param {string} type - Type de notification (success, error, warning, info)
   */
  showNotification(message, type = 'info') {
    // Cette fonction sera implémentée dans main.js
    if (window.showNotification) {
      window.showNotification(message, type);
    }
  }

  /**
   * Ferme la connexion WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Déconnexion intentionnelle');
    }
  }

  /**
   * Vérifie si la connexion est active
   * @returns {boolean} - True si connecté
   */
  isConnectionActive() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Instance globale du gestionnaire WebSocket
const wsManager = new WebSocketManager();

// Export
window.wsManager = wsManager;