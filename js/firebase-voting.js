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
    
    voterName = name;
    
    // Create a unique voter key
    voterKey = generateVoterKey();
    
    // Save voter info
    database.ref(`sessions/${currentSession}/voters/${voterKey}`).set({
      name: voterName,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Store voter key locally
    localStorage.setItem(`voter_${currentSession}`, voterKey);
    
    // Hide modal
    modal.style.display = 'none';
    
    // Update UI
    updateVoterDisplay();
  };
  
  submitBtn.addEventListener('click', submitName);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitName();
    }
  });
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
 * Generate a unique voter key
 */
function generateVoterKey() {
  return 'voter_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Sanitize photo ID for Firebase (remove invalid characters)
 */
function sanitizePhotoId(photoId) {
  // Replace Firebase invalid chars: . # $ [ ]
  // Also replace URL chars that might cause issues in paths: / : ? & =
  return photoId.replace(/[.#$[\]\/:?&=]/g, '_');
}

/**
 * Vote for a photo
 * @param {string} photoId - Unique identifier for the photo
 * @param {string} voteType - Type of vote: 'like', 'ok', or 'dislike'
 */
function voteForPhoto(photoId, voteType) {
  console.log('voteForPhoto called:', photoId, voteType);
  
  if (!voterKey || !voterName) {
    console.log('No voter key/name, prompting for name');
    promptForName();
    return;
  }
  
  console.log('Voter:', voterName, 'Key:', voterKey, 'Session:', currentSession);
  
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
  const voteControlElements = document.querySelectorAll('.vote-controls[data-photo-id]');
  
  voteControlElements.forEach((element) => {
    const photoId = element.getAttribute('data-photo-id');
    const sanitizedPhotoId = sanitizePhotoId(photoId);
    const votesRef = database.ref(`sessions/${currentSession}/votes/${sanitizedPhotoId}`);
    
    // Listen for vote changes
    votesRef.on('value', (snapshot) => {
      const votes = snapshot.val() || {};
      
      // Count votes by type
      const voteCounts = { like: 0, ok: 0, dislike: 0 };
      let userVote = null;
      let userComment = '';
      
      Object.entries(votes).forEach(([key, voteData]) => {
        const voteType = voteData.vote;
        if (voteCounts[voteType] !== undefined) {
          voteCounts[voteType]++;
        }
        if (key === voterKey) {
          userVote = voteType;
          userComment = voteData.comment || '';
        }
      });
      
      // Update vote count displays in buttons
      const likeBtn = element.querySelector('.vote-like .count');
      const okBtn = element.querySelector('.vote-ok .count');
      const dislikeBtn = element.querySelector('.vote-dislike .count');
      
      if (likeBtn) likeBtn.textContent = voteCounts.like;
      if (okBtn) okBtn.textContent = voteCounts.ok;
      if (dislikeBtn) dislikeBtn.textContent = voteCounts.dislike;

      // Update comment if not focused
      const commentInput = element.querySelector('.vote-comment-input');
      if (commentInput && document.activeElement !== commentInput) {
        commentInput.value = userComment;
      }
      
      // Update vote summary under image
      const summaryElement = document.querySelector(`.vote-summary[data-photo-id="${photoId}"]`);
      if (summaryElement) {
        const summaryLike = summaryElement.querySelector('.summary-like');
        const summaryOk = summaryElement.querySelector('.summary-ok');
        const summaryDislike = summaryElement.querySelector('.summary-dislike');
        
        if (summaryLike) summaryLike.textContent = `😍 ${voteCounts.like}`;
        if (summaryOk) summaryOk.textContent = `😐 ${voteCounts.ok}`;
        if (summaryDislike) summaryDislike.textContent = `😞 ${voteCounts.dislike}`;
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
