/**
 * Module de gestion des fichiers pour la messagerie
 */

class FileManager {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      documents: ['application/pdf', 'text/plain', 'application/msword', 
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
      video: ['video/mp4', 'video/webm', 'video/ogg']
    };
  }

  /**
   * Valide un fichier avant envoi
   * @param {File} file - Fichier à valider
   * @returns {Object} - Résultat de validation
   */
  validateFile(file) {
    const result = {
      valid: true,
      errors: []
    };

    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      result.valid = false;
      result.errors.push(`Fichier trop volumineux (max ${formatFileSize(this.maxFileSize)})`);
    }

    // Vérifier le type
    if (!this.isTypeAllowed(file.type)) {
      result.valid = false;
      result.errors.push('Type de fichier non autorisé');
    }

    // Vérifier le nom du fichier
    if (!this.isFileNameSafe(file.name)) {
      result.valid = false;
      result.errors.push('Nom de fichier non sécurisé');
    }

    return result;
  }

  /**
   * Vérifie si un type MIME est autorisé
   * @param {string} mimeType - Type MIME à vérifier
   * @returns {boolean} - True si autorisé
   */
  isTypeAllowed(mimeType) {
    return Object.values(this.allowedTypes).some(types => types.includes(mimeType));
  }

  /**
   * Vérifie si le nom de fichier est sécurisé
   * @param {string} fileName - Nom du fichier
   * @returns {boolean} - True si sécurisé
   */
  isFileNameSafe(fileName) {
    if (!fileName || typeof fileName !== 'string') {
      return false;
    }
    
    // Vérifier les caractères dangereux
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g;
    if (dangerousChars.test(fileName)) {
      return false;
    }

    // Vérifier les noms réservés Windows
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    const nameWithoutExt = fileName.split('.')[0];
    if (reservedNames.test(nameWithoutExt)) {
      return false;
    }

    // Vérifier la longueur
    if (fileName.length > 255) {
      return false;
    }
    
    // Vérifier les extensions dangereuses
    const dangerousExtensions = /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|msi|dll|sys)$/i;
    if (dangerousExtensions.test(fileName)) {
      return false;
    }

    return true;
  }

  /**
   * Obtient la catégorie d'un fichier
   * @param {string} mimeType - Type MIME
   * @returns {string} - Catégorie du fichier
   */
  getFileCategory(mimeType) {
    for (const [category, types] of Object.entries(this.allowedTypes)) {
      if (types.includes(mimeType)) {
        return category;
      }
    }
    return 'unknown';
  }

  /**
   * Obtient l'icône correspondant à un type de fichier
   * @param {string} mimeType - Type MIME
   * @returns {string} - Emoji icône
   */
  getFileIcon(mimeType) {
    const category = this.getFileCategory(mimeType);
    
    const icons = {
      images: '🖼️',
      documents: '📄',
      archives: '📦',
      audio: '🎵',
      video: '🎬',
      unknown: '📎'
    };

    return icons[category] || icons.unknown;
  }

  /**
   * Crée un aperçu pour les fichiers images
   * @param {File} file - Fichier image
   * @returns {Promise<HTMLElement>} - Élément d'aperçu
   */
  async createImagePreview(file) {
    return new Promise((resolve, reject) => {
      if (!this.getFileCategory(file.type) === 'images') {
        reject(new Error('Le fichier n\'est pas une image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = file.name;
        img.loading = 'lazy';
        
        // Limiter la taille de l'aperçu
        img.style.maxWidth = '300px';
        img.style.maxHeight = '300px';
        img.style.objectFit = 'contain';
        
        preview.appendChild(img);
        resolve(preview);
      };
      
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Crée un élément de fichier pour l'affichage
   * @param {Object} fileData - Données du fichier
   * @returns {HTMLElement} - Élément DOM du fichier
   */
  createFileElement(fileData) {
    const fileElement = document.createElement('div');
    fileElement.className = 'file-item';
    
    const icon = document.createElement('span');
    icon.className = 'file-icon';
    icon.textContent = this.getFileIcon(fileData.fileType);
    
    const info = document.createElement('div');
    info.className = 'file-info';
    
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = escapeHtml(fileData.fileName);
    
    const size = document.createElement('div');
    size.className = 'file-size';
    size.textContent = formatFileSize(fileData.fileSize);
    
    info.appendChild(name);
    info.appendChild(size);
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'file-download';
    downloadBtn.textContent = 'Télécharger';
    downloadBtn.onclick = () => this.downloadFile(fileData);
    
    fileElement.appendChild(icon);
    fileElement.appendChild(info);
    fileElement.appendChild(downloadBtn);
    
    return fileElement;
  }

  /**
   * Télécharge un fichier déchiffré
   * @param {Object} fileData - Données du fichier chiffré
   */
  async downloadFile(fileData) {
    try {
      if (!cryptoManager.keyGenerated) {
        throw new Error('Clé de chiffrement non disponible');
      }

      // Indiquer le téléchargement en cours
      if (window.showNotification) {
        window.showNotification(`Téléchargement de "${fileData.fileName}"...`, 'info');
      }

      const { encrypted, iv } = cryptoManager.deserializeEncrypted(fileData.content);
      const decryptedBlob = await cryptoManager.decryptFile(
        encrypted, 
        iv, 
        fileData.fileName, 
        fileData.fileType
      );

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.fileName;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Nettoyer l'URL après un délai
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      if (window.showNotification) {
        window.showNotification(`"${fileData.fileName}" téléchargé`, 'success');
      }

    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      if (window.showNotification) {
        window.showNotification(`Erreur lors du téléchargement de "${fileData.fileName}"`, 'error');
      }
    }
  }

  /**
   * Traite les fichiers sélectionnés ou glissés
   * @param {FileList|Array} files - Liste des fichiers
   * @returns {Array} - Fichiers valides
   */
  processFiles(files) {
    const validFiles = [];
    const errors = [];

    Array.from(files).forEach(file => {
      const validation = this.validateFile(file);
      
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });

    // Afficher les erreurs
    if (errors.length > 0 && window.showNotification) {
      errors.forEach(error => {
        window.showNotification(error, 'warning');
      });
    }

    return validFiles;
  }

  /**
   * Configure le glisser-déposer sur un élément
   * @param {HTMLElement} element - Élément cible
   * @param {Function} onFilesDropped - Callback pour les fichiers déposés
   */
  setupDragAndDrop(element, onFilesDropped) {
    let dragCounter = 0;

    element.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      
      if (dragCounter === 1) {
        this.showDropZone();
      }
    });

    element.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      
      if (dragCounter === 0) {
        this.hideDropZone();
      }
    });

    element.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      this.hideDropZone();
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const validFiles = this.processFiles(files);
        if (validFiles.length > 0 && onFilesDropped) {
          onFilesDropped(validFiles);
        }
      }
    });
  }

  /**
   * Affiche la zone de glisser-déposer
   */
  showDropZone() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.style.display = 'flex';
    }
  }

  /**
   * Cache la zone de glisser-déposer
   */
  hideDropZone() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
      dropZone.style.display = 'none';
    }
  }

  /**
   * Obtient les informations d'un fichier
   * @param {File} file - Fichier
   * @returns {Object} - Informations du fichier
   */
  getFileInfo(file) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      category: this.getFileCategory(file.type),
      icon: this.getFileIcon(file.type),
      lastModified: file.lastModified
    };
  }

  /**
   * Limite le nombre de fichiers simultanés
   * @param {Array} files - Liste des fichiers
   * @param {number} maxFiles - Nombre maximum de fichiers
   * @returns {Array} - Fichiers limités
   */
  limitFiles(files, maxFiles = 10) {
    if (files.length > maxFiles) {
      if (window.showNotification) {
        window.showNotification(`Trop de fichiers sélectionnés (max ${maxFiles})`, 'warning');
      }
      return files.slice(0, maxFiles);
    }
    return files;
  }
}

// Instance globale du gestionnaire de fichiers
const fileManager = new FileManager();

// Export
window.fileManager = fileManager;