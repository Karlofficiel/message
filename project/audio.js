/**
 * Module de gestion audio pour les messages vocaux
 */

class AudioManager {
  constructor() {
    this.mediaRecorder = null;
    this.audioStream = null;
    this.isRecording = false;
    this.recordedChunks = [];
    this.recordingStartTime = 0;
  }

  /**
   * Vérifie si l'enregistrement audio est supporté
   * @returns {boolean} - True si supporté
   */
  isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder);
  }

  /**
   * Demande l'autorisation d'accès au microphone
   * @returns {boolean} - True si l'autorisation est accordée
   */
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100
        } 
      });
      
      // Tester la création du MediaRecorder
      const testRecorder = new MediaRecorder(stream);
      testRecorder.stop();
      
      // Arrêter le stream de test
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Erreur d\'accès au microphone:', error);
      this.handleMicrophoneError(error);
      return false;
    }
  }

  /**
   * Démarre l'enregistrement audio
   * @returns {boolean} - True si l'enregistrement a démarré
   */
  async startRecording() {
    if (this.isRecording) {
      console.warn('Enregistrement déjà en cours');
      return false;
    }

    try {
      // Demander accès au microphone
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100
        } 
      });

      // Créer le MediaRecorder
      const options = {
        mimeType: this.getSupportedMimeType(),
        audioBitsPerSecond: 128000
      };

      this.mediaRecorder = new MediaRecorder(this.audioStream, options);
      this.recordedChunks = [];
      this.recordingStartTime = Date.now();

      // Configurer les événements
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStopped();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('Erreur MediaRecorder:', event.error);
        this.stopRecording();
      };

      // Démarrer l'enregistrement
      this.mediaRecorder.start(1000); // Collecter les données toutes les secondes
      this.isRecording = true;

      console.log('Enregistrement audio démarré');
      return true;

    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      this.handleMicrophoneError(error);
      return false;
    }
  }

  /**
   * Arrête l'enregistrement audio
   */
  stopRecording() {
    if (!this.isRecording) {
      console.warn('Aucun enregistrement en cours');
      return;
    }

    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Arrêter le stream audio
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    console.log('Enregistrement audio arrêté');
  }

  /**
   * Gère l'arrêt de l'enregistrement
   */
  handleRecordingStopped() {
    if (this.recordedChunks.length === 0) {
      console.warn('Aucune donnée audio enregistrée');
      return;
    }

    const recordingDuration = Date.now() - this.recordingStartTime;
    
    // Vérifier la durée minimale (1 seconde)
    if (recordingDuration < 1000) {
      console.warn('Enregistrement trop court (< 1s)');
      if (window.showNotification) {
        window.showNotification('Enregistrement trop court (minimum 1 seconde)', 'warning');
      }
      return;
    }

    // Créer le blob audio
    const mimeType = this.getSupportedMimeType();
    const audioBlob = new Blob(this.recordedChunks, { type: mimeType });
    audioBlob.duration = recordingDuration / 1000; // Durée en secondes

    // Déclencher l'événement de fin d'enregistrement
    if (this.onRecordingComplete) {
      this.onRecordingComplete(audioBlob);
    }

    // Nettoyer
    this.recordedChunks = [];
    this.mediaRecorder = null;
  }

  /**
   * Obtient le type MIME supporté pour l'enregistrement
   * @returns {string} - Type MIME supporté
   */
  getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Crée un élément audio pour la lecture
   * @param {Blob} audioBlob - Blob audio
   * @returns {HTMLAudioElement} - Élément audio
   */
  createAudioElement(audioBlob) {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'metadata';
    audio.src = URL.createObjectURL(audioBlob);
    
    // Nettoyer l'URL quand l'audio n'est plus utilisé
    audio.addEventListener('loadstart', () => {
      // L'URL sera nettoyée quand l'élément sera supprimé du DOM
    });

    return audio;
  }

  /**
   * Déchiffre et crée un élément audio depuis des données chiffrées
   * @param {string} encryptedData - Données audio chiffrées
   * @returns {HTMLAudioElement} - Élément audio ou null si erreur
   */
  async createDecryptedAudioElement(encryptedData) {
    try {
      if (!cryptoManager.keyGenerated) {
        console.error('Clé de chiffrement non disponible');
        return null;
      }

      if (!encryptedData || typeof encryptedData !== 'string') {
        console.error('Données audio invalides');
        return null;
      }

      const { encrypted, iv } = cryptoManager.deserializeEncrypted(encryptedData);
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        cryptoManager.key,
        encrypted
      );

      const audioBlob = new Blob([decryptedData], { type: this.getSupportedMimeType() });
      return this.createAudioElement(audioBlob);

    } catch (error) {
      console.error('Erreur lors du déchiffrement de l\'audio:', error);
      return null;
    }
  }

  /**
   * Gère les erreurs d'accès au microphone
   * @param {Error} error - Erreur
   */
  handleMicrophoneError(error) {
    let message = 'Erreur d\'accès au microphone';
    
    if (error.name === 'NotAllowedError') {
      message = 'Accès au microphone refusé. Veuillez autoriser l\'accès dans les paramètres.';
    } else if (error.name === 'NotFoundError') {
      message = 'Aucun microphone détecté.';
    } else if (error.name === 'NotSupportedError') {
      message = 'Enregistrement audio non supporté par ce navigateur.';
    } else if (error.name === 'SecurityError') {
      message = 'Accès au microphone bloqué pour des raisons de sécurité.';
    }

    if (window.showNotification) {
      window.showNotification(message, 'error');
    }
  }

  /**
   * Obtient le niveau audio actuel (pour visualisation)
   * @returns {number} - Niveau audio (0-100)
   */
  getAudioLevel() {
    if (!this.audioStream) return 0;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(this.audioStream);
      const analyser = audioContext.createAnalyser();
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      
      return Math.round((sum / bufferLength) * (100 / 255));
    } catch (error) {
      console.error('Erreur lors de la mesure du niveau audio:', error);
      return 0;
    }
  }

  /**
   * Nettoie les ressources audio
   */
  cleanup() {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  /**
   * Définit le callback pour la fin d'enregistrement
   * @param {Function} callback - Fonction appelée avec le blob audio
   */
  setRecordingCompleteCallback(callback) {
    this.onRecordingComplete = callback;
  }
}

// Instance globale du gestionnaire audio
const audioManager = new AudioManager();

// Export
window.audioManager = audioManager;