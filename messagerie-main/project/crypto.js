/**
 * Module de chiffrement pour la messagerie sécurisée
 * Utilise l'API Web Crypto pour le chiffrement AES-GCM
 */

class CryptoManager {
  constructor() {
    this.key = null;
    this.keyGenerated = false;
  }

  /**
   * Génère une clé de chiffrement AES-256
   */
  async generateKey() {
    try {
      this.key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
      this.keyGenerated = true;
      console.log('Clé de chiffrement générée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la génération de la clé:', error);
      return false;
    }
  }

  /**
   * Chiffre un message ou des données
   * @param {string|ArrayBuffer} data - Données à chiffrer
   * @returns {Object} - Objet contenant les données chiffrées et l'IV
   */
  async encrypt(data) {
    if (!this.keyGenerated) {
      throw new Error('Clé de chiffrement non générée');
    }

    try {
      // Convertir string en ArrayBuffer si nécessaire
      const encoder = new TextEncoder();
      const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;

      // Générer un vecteur d'initialisation (IV) aléatoire
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Chiffrer les données
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.key,
        dataBuffer
      );

      return {
        encrypted: new Uint8Array(encryptedData),
        iv: iv
      };
    } catch (error) {
      console.error('Erreur lors du chiffrement:', error);
      throw error;
    }
  }

  /**
   * Déchiffre des données
   * @param {Uint8Array} encryptedData - Données chiffrées
   * @param {Uint8Array} iv - Vecteur d'initialisation
   * @returns {string} - Données déchiffrées
   */
  async decrypt(encryptedData, iv) {
    if (!this.keyGenerated) {
      throw new Error('Clé de chiffrement non générée');
    }

    try {
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Erreur lors du déchiffrement:', error);
      // Retourner un message d'erreur au lieu de lever une exception
      return '[Message non déchiffrable]';
    }
  }

  /**
   * Chiffre un fichier
   * @param {File} file - Fichier à chiffrer
   * @returns {Object} - Objet contenant les données chiffrées et les métadonnées
   */
  async encryptFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const encrypted = await this.encrypt(arrayBuffer);

      return {
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        name: file.name,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Erreur lors du chiffrement du fichier:', error);
      throw error;
    }
  }

  /**
   * Déchiffre un fichier
   * @param {Uint8Array} encryptedData - Données chiffrées
   * @param {Uint8Array} iv - Vecteur d'initialisation
   * @param {string} name - Nom du fichier
   * @param {string} type - Type MIME du fichier
   * @returns {Blob} - Blob du fichier déchiffré
   */
  async decryptFile(encryptedData, iv, name, type) {
    try {
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.key,
        encryptedData
      );

      return new Blob([decryptedData], { type: type });
    } catch (error) {
      console.error('Erreur lors du déchiffrement du fichier:', error);
      throw error;
    }
  }

  /**
   * Génère un hash pour vérifier l'intégrité des données
   * @param {string} data - Données à hasher
   * @returns {string} - Hash en hexadécimal
   */
  async generateHash(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      const hashHex = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return hashHex;
    } catch (error) {
      console.error('Erreur lors de la génération du hash:', error);
      throw error;
    }
  }

  /**
   * Sérialise les données chiffrées pour la transmission
   * @param {Uint8Array} encrypted - Données chiffrées
   * @param {Uint8Array} iv - Vecteur d'initialisation
   * @returns {string} - Données sérialisées en base64
   */
  serializeEncrypted(encrypted, iv) {
    const combined = new Uint8Array(iv.length + encrypted.length);
    combined.set(iv);
    combined.set(encrypted, iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Désérialise les données chiffrées reçues
   * @param {string} serialized - Données sérialisées en base64
   * @returns {Object} - Objet contenant les données chiffrées et l'IV
   */
  deserializeEncrypted(serialized) {
    const combined = new Uint8Array(
      atob(serialized).split('').map(char => char.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    return { encrypted, iv };
  }

  /**
   * Vérifie si le chiffrement est disponible
   * @returns {boolean} - True si le chiffrement est supporté
   */
  isSupported() {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined';
  }

  /**
   * Nettoie les données sensibles de la mémoire
   */
  cleanup() {
    this.key = null;
    this.keyGenerated = false;
  }
}

// Instance globale du gestionnaire de chiffrement
const cryptoManager = new CryptoManager();

// Fonction utilitaire pour échapper le HTML et prévenir les injections XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Fonction utilitaire pour formater l'heure
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Export des fonctions utilitaires
window.cryptoManager = cryptoManager;
window.escapeHtml = escapeHtml;
window.formatFileSize = formatFileSize;
window.formatTime = formatTime;