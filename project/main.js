/**
 * Application principale de messagerie sécurisée
 */

class MessagingApp {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
    
    // Éléments DOM
    this.elements = {};
    
    // État de l'application
    this.state = {
      connected: false,
      userCount: 0,
      recording: false
    };
  }

  /**
   * Initialise l'application
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Vérifier la compatibilité du navigateur
      if (!this.checkBrowserCompatibility()) {
        this.showNotification('Navigateur non compatible', 'error');
        return;
      }

      // Initialiser les éléments DOM
      this.initializeElements();
      
      // Générer la clé de chiffrement
      const keyGenerated = await cryptoManager.generateKey();
      if (!keyGenerated) {
        this.showNotification('Erreur d\'initialisation du chiffrement', 'error');
        return;
      }

      // Configurer les gestionnaires d'événements
      this.setupEventHandlers();
      
      // Configurer le glisser-déposer
      this.setupDragAndDrop();
      
      // Initialiser la connexion WebSocket
      this.initializeWebSocket();
      
      // Configurer l'audio
      this.setupAudio();
      
      this.isInitialized = true;
      console.log('Application initialisée avec succès');
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.showNotification('Erreur d\'initialisation de l\'application', 'error');
    }
  }

  /**
   * Vérifie la compatibilité du navigateur
   * @returns {boolean} - True si compatible
   */
  checkBrowserCompatibility() {
    const required = {
      WebSocket: typeof WebSocket !== 'undefined',
      WebCrypto: cryptoManager.isSupported(),
      MediaRecorder: audioManager.isSupported(),
      FileAPI: typeof File !== 'undefined' && typeof FileReader !== 'undefined'
    };

    const unsupported = Object.entries(required)
      .filter(([feature, supported]) => !supported)
      .map(([feature]) => feature);

    if (unsupported.length > 0) {
      console.error('Fonctionnalités non supportées:', unsupported);
      return false;
    }

    return true;
  }

  /**
   * Initialise les références aux éléments DOM
   */
  initializeElements() {
    this.elements = {
      currentUser: document.getElementById('currentUser'),
      userCount: document.getElementById('userCount'),
      encryptionStatus: document.getElementById('encryptionStatus'),
      messagesList: document.getElementById('messagesList'),
      messagesContainer: document.getElementById('messagesContainer'),
      messageInput: document.getElementById('messageInput'),
      sendBtn: document.getElementById('sendBtn'),
      fileBtn: document.getElementById('fileBtn'),
      fileInput: document.getElementById('fileInput'),
      voiceBtn: document.getElementById('voiceBtn'),
      recordingIndicator: document.getElementById('recordingIndicator'),
      stopRecordingBtn: document.getElementById('stopRecordingBtn'),
      dropZone: document.getElementById('dropZone'),
      notifications: document.getElementById('notifications')
    };

    // Vérifier que tous les éléments sont présents
    const missingElements = Object.entries(this.elements)
      .filter(([name, element]) => !element)
      .map(([name]) => name);

    if (missingElements.length > 0) {
      console.error('Éléments DOM manquants:', missingElements);
    }
  }

  /**
   * Configure les gestionnaires d'événements
   */
  setupEventHandlers() {
    // Bouton d'envoi de message
    this.elements.sendBtn.addEventListener('click', () => {
      this.sendTextMessage();
    });

    // Entrée clavier dans le champ de message
    this.elements.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendTextMessage();
      }
    });

    // Auto-resize du textarea
    this.elements.messageInput.addEventListener('input', () => {
      this.autoResizeTextarea(this.elements.messageInput);
    });

    // Sélection de fichiers
    this.elements.fileBtn.addEventListener('click', () => {
      this.elements.fileInput.click();
    });

    this.elements.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        this.sendFiles(files);
      }
      // Reset input pour permettre la sélection du même fichier
      e.target.value = '';
    });

    // Enregistrement vocal
    this.elements.voiceBtn.addEventListener('click', () => {
      this.toggleVoiceRecording();
    });

    this.elements.stopRecordingBtn.addEventListener('click', () => {
      this.stopVoiceRecording();
    });

    // Gestion de la fermeture de la page
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Gestion de la visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state.recording) {
        this.stopVoiceRecording();
      }
    });
  }

  /**
   * Configure le glisser-déposer
   */
  setupDragAndDrop() {
    fileManager.setupDragAndDrop(document.body, (files) => {
      this.sendFiles(files);
    });
  }

  /**
   * Initialise la connexion WebSocket
   */
  initializeWebSocket() {
    // Configurer les callbacks WebSocket
    wsManager.on('connected', () => {
      this.state.connected = true;
      this.updateConnectionStatus();
    });

    wsManager.on('disconnected', () => {
      this.state.connected = false;
      this.updateConnectionStatus();
    });

    wsManager.on('user_id', (userId) => {
      this.currentUser = userId;
      this.elements.currentUser.textContent = userId;
    });

    wsManager.on('user_count', (count) => {
      this.state.userCount = count;
      this.updateUserCount();
    });

    wsManager.on('message', (message) => {
      this.displayMessage(message);
    });

    wsManager.on('voice_message', (message) => {
      this.displayVoiceMessage(message);
    });

    wsManager.on('file_message', (message) => {
      this.displayFileMessage(message);
    });

    wsManager.on('error', (error) => {
      this.showNotification('Erreur de connexion', 'error');
    });

    // Démarrer la connexion
    wsManager.connect();
  }

  /**
   * Configure l'audio
   */
  setupAudio() {
    audioManager.setRecordingCompleteCallback((audioBlob) => {
      this.sendVoiceMessage(audioBlob);
    });
  }

  /**
   * Envoie un message texte
   */
  async sendTextMessage() {
    const text = this.elements.messageInput.value.trim();
    if (!text) return;

    if (!this.state.connected) {
      this.showNotification('Connexion non établie', 'warning');
      return;
    }

    try {
      // Afficher le message localement
      this.displayMessage({
        type: 'text_message',
        content: text,
        userId: this.currentUser,
        timestamp: Date.now(),
        isOwn: true
      });

      // Envoyer via WebSocket
      await wsManager.sendTextMessage(text);

      // Vider le champ de saisie
      this.elements.messageInput.value = '';
      this.autoResizeTextarea(this.elements.messageInput);
      
      // Focus sur le champ de saisie
      this.elements.messageInput.focus();

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      this.showNotification('Erreur lors de l\'envoi du message', 'error');
    }
  }

  /**
   * Envoie des fichiers
   * @param {Array} files - Liste des fichiers
   */
  async sendFiles(files) {
    if (!this.state.connected) {
      this.showNotification('Connexion non établie', 'warning');
      return;
    }

    const validFiles = fileManager.processFiles(files);
    const limitedFiles = fileManager.limitFiles(validFiles, 5);

    if (limitedFiles.length === 0) {
      return;
    }

    try {
      this.showNotification(`Envoi de ${limitedFiles.length} fichier(s)...`, 'info');
      await wsManager.sendFiles(limitedFiles);
      this.showNotification('Fichiers envoyés avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'envoi des fichiers:', error);
      this.showNotification('Erreur lors de l\'envoi des fichiers', 'error');
    }
  }

  /**
   * Toggle l'enregistrement vocal
   */
  async toggleVoiceRecording() {
    if (this.state.recording) {
      this.stopVoiceRecording();
    } else {
      await this.startVoiceRecording();
    }
  }

  /**
   * Démarre l'enregistrement vocal
   */
  async startVoiceRecording() {
    if (!this.state.connected) {
      this.showNotification('Connexion non établie', 'warning');
      return;
    }

    // Demander permission microphone
    const hasPermission = await audioManager.requestMicrophonePermission();
    if (!hasPermission) {
      return;
    }

    const started = await audioManager.startRecording();
    if (started) {
      this.state.recording = true;
      this.updateRecordingUI();
    }
  }

  /**
   * Arrête l'enregistrement vocal
   */
  stopVoiceRecording() {
    audioManager.stopRecording();
    this.state.recording = false;
    this.updateRecordingUI();
  }

  /**
   * Envoie un message vocal
   * @param {Blob} audioBlob - Blob audio
   */
  async sendVoiceMessage(audioBlob) {
    if (!this.state.connected) {
      this.showNotification('Connexion non établie', 'warning');
      return;
    }

    try {
      // Afficher le message vocal localement
      this.displayVoiceMessage({
        type: 'voice_message',
        userId: this.currentUser,
        timestamp: Date.now(),
        duration: audioBlob.duration || 0,
        isOwn: true,
        audioBlob: audioBlob
      });

      // Envoyer via WebSocket
      await wsManager.sendVoiceMessage(audioBlob);

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message vocal:', error);
      this.showNotification('Erreur lors de l\'envoi du message vocal', 'error');
    }
  }

  /**
   * Affiche un message texte
   * @param {Object} message - Données du message
   */
  displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.isOwn || message.userId === this.currentUser ? 'own' : 'other'}`;

    const header = document.createElement('div');
    header.className = 'message-header';

    const user = document.createElement('span');
    user.className = 'message-user';
    user.textContent = message.userId;

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = formatTime(message.timestamp);

    header.appendChild(user);
    header.appendChild(time);

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message.content;

    messageElement.appendChild(header);
    messageElement.appendChild(content);

    this.addMessageToList(messageElement);
  }

  /**
   * Affiche un message vocal
   * @param {Object} message - Données du message vocal
   */
  async displayVoiceMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.isOwn || message.userId === this.currentUser ? 'own' : 'other'}`;

    const header = document.createElement('div');
    header.className = 'message-header';

    const user = document.createElement('span');
    user.className = 'message-user';
    user.textContent = message.userId;

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = formatTime(message.timestamp);

    header.appendChild(user);
    header.appendChild(time);

    const voiceContainer = document.createElement('div');
    voiceContainer.className = 'voice-message';

    const icon = document.createElement('span');
    icon.className = 'voice-icon';
    icon.textContent = '🎤';

    const controls = document.createElement('div');
    controls.className = 'voice-controls';

    // Si c'est notre propre message et qu'on a le blob
    if (message.audioBlob) {
      const audio = audioManager.createAudioElement(message.audioBlob);
      controls.appendChild(audio);
    } else if (message.content) {
      // Message reçu - déchiffrer l'audio
      const audio = await audioManager.createDecryptedAudioElement(message.content);
      if (audio) {
        controls.appendChild(audio);
      } else {
        const errorMsg = document.createElement('span');
        errorMsg.textContent = 'Message vocal non déchiffrable';
        errorMsg.style.color = 'var(--text-muted)';
        controls.appendChild(errorMsg);
      }
    }

    voiceContainer.appendChild(icon);
    voiceContainer.appendChild(controls);

    messageElement.appendChild(header);
    messageElement.appendChild(voiceContainer);

    this.addMessageToList(messageElement);
  }

  /**
   * Affiche un message avec fichier
   * @param {Object} message - Données du message fichier
   */
  async displayFileMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.isOwn || message.userId === this.currentUser ? 'own' : 'other'}`;

    const header = document.createElement('div');
    header.className = 'message-header';

    const user = document.createElement('span');
    user.className = 'message-user';
    user.textContent = message.userId;

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = formatTime(message.timestamp);

    header.appendChild(user);
    header.appendChild(time);

    const fileContainer = document.createElement('div');
    fileContainer.className = 'file-message';

    const fileElement = fileManager.createFileElement({
      fileName: message.fileName,
      fileType: message.fileType,
      fileSize: message.fileSize,
      content: message.content
    });

    fileContainer.appendChild(fileElement);

    // Ajouter aperçu pour les images si c'est notre fichier
    if (message.file && fileManager.getFileCategory(message.fileType) === 'images') {
      try {
        const preview = await fileManager.createImagePreview(message.file);
        fileContainer.appendChild(preview);
      } catch (error) {
        console.error('Erreur création aperçu:', error);
      }
    }

    messageElement.appendChild(header);
    messageElement.appendChild(fileContainer);

    this.addMessageToList(messageElement);
  }

  /**
   * Ajoute un message à la liste
   * @param {HTMLElement} messageElement - Élément du message
   */
  addMessageToList(messageElement) {
    // Supprimer le message de bienvenue s'il existe
    const welcomeMessage = this.elements.messagesList.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    this.elements.messagesList.appendChild(messageElement);
    
    // Scroll vers le bas
    this.scrollToBottom();
    
    // Limiter le nombre de messages affichés (performance)
    this.limitDisplayedMessages();
  }

  /**
   * Scroll vers le bas des messages
   */
  scrollToBottom() {
    setTimeout(() => {
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }, 100);
  }

  /**
   * Limite le nombre de messages affichés
   */
  limitDisplayedMessages() {
    const messages = this.elements.messagesList.querySelectorAll('.message');
    const maxMessages = 100;
    
    if (messages.length > maxMessages) {
      const toRemove = messages.length - maxMessages;
      for (let i = 0; i < toRemove; i++) {
        // Nettoyer les ressources audio avant suppression
        const audioElements = messages[i].querySelectorAll('audio');
        audioElements.forEach(audio => {
          audio.pause();
          audio.src = '';
          audio.load();
        });
        messages[i].remove();
      }
    }
  }

  /**
   * Met à jour l'interface d'enregistrement
   */
  updateRecordingUI() {
    if (this.state.recording) {
      this.elements.recordingIndicator.style.display = 'flex';
      this.elements.voiceBtn.style.background = 'var(--error-color)';
    } else {
      this.elements.recordingIndicator.style.display = 'none';
      this.elements.voiceBtn.style.background = '';
    }
  }

  /**
   * Met à jour le statut de connexion
   */
  updateConnectionStatus() {
    const statusElement = this.elements.encryptionStatus;
    const statusDot = statusElement.querySelector('.status-dot');
    
    if (this.state.connected) {
      statusDot.style.background = 'var(--secondary-color)';
      statusElement.title = 'Connexion établie - Chiffrement activé';
    } else {
      statusDot.style.background = 'var(--error-color)';
      statusElement.title = 'Connexion perdue';
    }
  }

  /**
   * Met à jour le nombre d'utilisateurs
   */
  updateUserCount() {
    const count = this.state.userCount;
    this.elements.userCount.textContent = `${count} utilisateur${count > 1 ? 's' : ''} en ligne`;
  }

  /**
   * Auto-resize d'un textarea
   * @param {HTMLTextAreaElement} textarea - Élément textarea
   */
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  /**
   * Affiche une notification
   * @param {string} message - Message de notification
   * @param {string} type - Type de notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    this.elements.notifications.appendChild(notification);

    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Limiter le nombre de notifications
    const notifications = this.elements.notifications.querySelectorAll('.notification');
    if (notifications.length > 5) {
      notifications[0].remove();
    }
  }

  /**
   * Nettoie les ressources avant fermeture
   */
  cleanup() {
    if (this.state.recording) {
      audioManager.stopRecording();
    }
    
    audioManager.cleanup();
    cryptoManager.cleanup();
    wsManager.disconnect();
  }
}

// Instance globale de l'application
const app = new MessagingApp();

// Fonction globale pour les notifications (utilisée par les autres modules)
window.showNotification = (message, type) => {
  app.showNotification(message, type);
};

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Export pour usage global
window.app = app;