/**
 * Firebase Voting System for rpk.io
 * Allows photo voting with name tracking and real-time vote counts
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAz-cnS1BN5xS0VIZKHeKobJSyHPT9V5rU",
  authDomain: "rpk-critiq.firebaseapp.com",
  databaseURL: "https://rpk-critiq-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rpk-critiq",
  storageBucket: "rpk-critiq.firebasestorage.app",
  messagingSenderId: "972493337470",
  appId: "1:972493337470:web:bb07a3f3596b5c863f792f"
};

// Initialize Firebase
let app, database;
try {
  app = firebase.initializeApp(firebaseConfig);
  database = firebase.database();
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Global voting state
let currentSession = null;
let voterName = null;
let voterKey = null;
let activeListeners = [];

/**
 * Initialize the voting system
 * @param {string} sessionId - Unique identifier for this voting session
 */
function initVoting(sessionId) {
  console.log('Initializing voting for session:', sessionId);
  currentSession = sessionId;
  
  // Check if user has already provided their name
  const storedVoterKey = localStorage.getItem(`voter_${sessionId}`);
  
  if (storedVoterKey) {
    // User has voted before in this session
    console.log('Found stored voter key:', storedVoterKey);
    voterKey = storedVoterKey;
    loadVoterName(voterKey);
  } else {
    // New voter - show name prompt
    console.log('No stored voter key, prompting for name');
    promptForName();
  }
  
  // Load existing votes
  loadVotes();
}

/**
 * Prompt user to enter their name
 */
function promptForName() {
  const modal = document.getElementById('name-prompt-modal');
  const input = document.getElementById('voter-name-input');
  const submitBtn = document.getElementById('submit-name');
  
  modal.style.display = 'flex';
  input.focus();
  
  // Handle name submission
  const submitName = () => {
    const name = input.value.trim();
    if (name.length < 2) {
      alert('Please enter a valid name (at least 2 characters)');
      return;
    }
    
    // Helper to finalize login
    const finalizeLogin = (key) => {
      voterName = name;
      voterKey = key;
      
      console.log('Finalizing login with key:', voterKey, 'session:', currentSession);
      
      // Save/Update voter info (use set to ensure it works for both new and existing users)
      database.ref(`sessions/${currentSession}/voters/${voterKey}`).set({
        name: voterName,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
      }).then(() => {
        console.log('Voter info saved successfully');
        
        // Store voter key locally
        localStorage.setItem(`voter_${currentSession}`, voterKey);
        
        // Hide modal
        modal.style.display = 'none';
        
        // Update UI
        updateVoterDisplay();
        
        // Reload votes to reflect this user's history
        loadVotes();
      }).catch(error => {
        console.error('Error saving voter info:', error);
        alert('Failed to save voter information. Please check your internet connection and try again.');
      });
    };

    // Check if user exists by checking the deterministic key directly
    const potentialKey = generateVoterKey(name);
    
    database.ref(`sessions/${currentSession}/voters/${potentialKey}`)
      .once('value', (snapshot) => {
        if (snapshot.exists()) {
          // User exists - ask for confirmation
          if (confirm(`A voter named "${name}" already exists.\n\nIs this you?\n\nClick OK to load your previous votes.\nClick Cancel to enter a different name.`)) {
            finalizeLogin(potentialKey);
          } else {
            input.value = '';
            input.focus();
          }
        } else {
          // New user - use the generated key
          finalizeLogin(potentialKey);
        }
      });
  };
  
  // Use onclick to prevent duplicate listeners if promptForName is called multiple times
  submitBtn.onclick = submitName;
  input.onkeypress = (e) => {
    if (e.key === 'Enter') {
      submitName();
    }
  };
}

/**
 * Load voter name from database
 */
function loadVoterName(key) {
  database.ref(`sessions/${currentSession}/voters/${key}`).once('value', (snapshot) => {
    const voterData = snapshot.val();
    if (voterData) {
      voterName = voterData.name;
      updateVoterDisplay();
    } else {
      // Voter key exists but no data - prompt again
      localStorage.removeItem(`voter_${currentSession}`);
      promptForName();
    }
  });
}

/**
 * Update the voter name display
 */
function updateVoterDisplay() {
  const display = document.getElementById('voter-display');
  if (display && voterName) {
    display.textContent = `Voting as: ${voterName}`;
    display.style.display = 'block';
  }
}

/**
 * Generate a deterministic voter key based on name
 * This allows users to "log in" by entering the same name
 */
function generateVoterKey(name) {
  if (!name) return 'voter_' + Date.now();
  // Create a safe key from the name: lowercase, alphanumeric only
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return 'voter_' + safeName;
}

/**
 * Sanitize photo ID for Firebase (remove invalid characters)
 */
function sanitizePhotoId(photoId) {
  // Replace invalid Firebase key characters: . # $ [ ] /
  return photoId.replace(/[.#$[\]\/]/g, '_');
}

/**
 * Vote for a photo
 * @param {string} photoId - Unique identifier for the photo
 * @param {string} voteType - Type of vote: 'like', 'ok', or 'dislike'
 */
function voteForPhoto(photoId, voteType) {
  console.log('voteForPhoto called:', photoId, voteType);
  console.log('Current state - voterKey:', voterKey, 'voterName:', voterName, 'session:', currentSession);
  
  if (!voterKey || !voterName) {
    console.log('No voter key/name, prompting for name');
    promptForName();
    return;
  }
  
  if (!currentSession) {
    console.error('No current session!');
    alert('Session not initialized. Please refresh the page.');
    return;
  }
  
  // Sanitize the photo ID to remove Firebase-invalid characters
  const sanitizedPhotoId = sanitizePhotoId(photoId);
  const voteRef = database.ref(`sessions/${currentSession}/votes/${sanitizedPhotoId}/${voterKey}`);
  
  // Get current comment
  const container = document.querySelector(`.vote-controls[data-photo-id="${photoId}"]`);
  const commentInput = container ? container.querySelector('.vote-comment-input') : null;
  const comment = commentInput ? commentInput.value.trim() : '';

  // Check if already voted with same type
  voteRef.once('value', (snapshot) => {
    const existingVote = snapshot.val();
    console.log('Existing vote:', existingVote);
    
    if (existingVote && existingVote.vote === voteType) {
      // Remove vote (toggle off)
      console.log('Removing vote');
      voteRef.remove();
    } else {
      // Add or update vote
      console.log('Adding/updating vote');
      voteRef.set({
        vote: voteType,
        voterName: voterName,
        comment: comment,
        photoId: photoId,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      }).then(() => {
        console.log('Vote saved successfully');
      }).catch((error) => {
        console.error('Error saving vote:', error);
      });
    }
  }).catch((error) => {
    console.error('Error reading existing vote:', error);
  });
}

/**
 * Update just the comment for a photo
 */
function updateComment(photoId, comment) {
  if (!voterKey || !currentSession) return;

  const sanitizedPhotoId = sanitizePhotoId(photoId);
  const voteRef = database.ref(`sessions/${currentSession}/votes/${sanitizedPhotoId}/${voterKey}`);

  voteRef.once('value', (snapshot) => {
    const existingVote = snapshot.val();
    if (existingVote) {
      voteRef.update({
        comment: comment,
        photoId: photoId
      });
    }
  });
}

/**
 * Update vote button state
 */
function updateVoteButton(photoId, voteType, isActive) {
  const container = document.querySelector(`.vote-controls[data-photo-id="${photoId}"]`);
  if (!container) return;
  
  const buttons = container.querySelectorAll('.vote-btn');
  buttons.forEach(btn => {
    const btnType = btn.getAttribute('data-vote');
    if (btnType === voteType) {
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Load all votes and set up real-time listeners
 */
function loadVotes() {
  // Cleanup existing listeners to avoid duplicates
  activeListeners.forEach(ref => ref.off());
  activeListeners = [];

  const voteControlElements = document.querySelectorAll('.vote-controls[data-photo-id]');
  
  voteControlElements.forEach((element) => {
    const photoId = element.getAttribute('data-photo-id');
    const sanitizedPhotoId = sanitizePhotoId(photoId);
    const votesRef = database.ref(`sessions/${currentSession}/votes/${sanitizedPhotoId}`);
    
    // Track listener for cleanup
    activeListeners.push(votesRef);
    
    // Listen for vote changes
    votesRef.on('value', (snapshot) => {
      const votes = snapshot.val() || {};
      
      // Count votes by type
      const voteCounts = { 
        strongly_like: 0, 
        like: 0, 
        fits_set: 0, 
        not_good: 0 
      };
      
      let userVote = null;
      let userComment = '';
      
      Object.entries(votes).forEach(([key, voteData]) => {
        let voteType = voteData.vote;
        
        // Backward compatibility mapping
        if (voteType === 'ok') voteType = 'fits_set';
        if (voteType === 'dislike') voteType = 'not_good';
        
        if (voteCounts[voteType] !== undefined) {
          voteCounts[voteType]++;
        }
        
        if (key === voterKey) {
          userVote = voteType; // Use mapped type for UI state
          userComment = voteData.comment || '';
        }
      });
      
      // Update vote count displays in buttons
      const sLikeBtn = element.querySelector('.vote-strongly_like .count');
      const likeBtn = element.querySelector('.vote-like .count');
      const fitsBtn = element.querySelector('.vote-fits_set .count');
      const notGoodBtn = element.querySelector('.vote-not_good .count');
      
      if (sLikeBtn) sLikeBtn.textContent = voteCounts.strongly_like;
      if (likeBtn) likeBtn.textContent = voteCounts.like;
      if (fitsBtn) fitsBtn.textContent = voteCounts.fits_set;
      if (notGoodBtn) notGoodBtn.textContent = voteCounts.not_good;

      // Update comment if not focused
      const commentInput = element.querySelector('.vote-comment-input');
      if (commentInput && document.activeElement !== commentInput) {
        commentInput.value = userComment;
      }
      
      // Update vote summary under image
      const summaryElement = document.querySelector(`.vote-summary[data-photo-id="${photoId}"]`);
      if (summaryElement) {
        const sLikeSum = summaryElement.querySelector('.summary-strongly_like');
        const likeSum = summaryElement.querySelector('.summary-like');
        const fitsSum = summaryElement.querySelector('.summary-fits_set');
        const notGoodSum = summaryElement.querySelector('.summary-not_good');
        
        if (sLikeSum) sLikeSum.textContent = `😍 ${voteCounts.strongly_like}`;
        if (likeSum) likeSum.textContent = `🙂 ${voteCounts.like}`;
        if (fitsSum) fitsSum.textContent = `🧩 ${voteCounts.fits_set}`;
        if (notGoodSum) notGoodSum.textContent = `❌ ${voteCounts.not_good}`;
      }
      
      // Update button states
      if (userVote) {
        updateVoteButton(photoId, userVote, true);
      } else {
        // Clear all active states
        const buttons = element.querySelectorAll('.vote-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
      }
    });
  });
}

/**
 * Clean up Firebase listeners
 */
function cleanupVoting() {
  activeListeners.forEach(ref => ref.off());
  activeListeners = [];
  
  if (currentSession) {
    database.ref(`sessions/${currentSession}/votes`).off();
  }
}

// Clean up when page unloads
window.addEventListener('beforeunload', cleanupVoting);

// Export for use in HTML
window.initVoting = initVoting;
window.voteForPhoto = voteForPhoto;
window.updateComment = updateComment;
