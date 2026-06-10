// FitLife Fitness Webpage - Firebase Firestore Database Module

// FIREBASE CONFIGURATION & INITIALIZATION
// Replace these parameters with your actual Firebase project web app configuration.
const firebaseConfig = {
  apiKey: "AIzaSyBpD3PeQLWQtrMp4ptoJnQ30kI3slY4qGA",
  authDomain: "fitlife-webpage.firebaseapp.com",
  projectId: "fitlife-webpage",
  storageBucket: "fitlife-webpage.firebasestorage.app",
  messagingSenderId: "785356108176",
  appId: "1:785356108176:web:af2ba489385fac19c28315"
};

let db = null;
try {
  if (typeof firebase !== 'undefined' && firebaseConfig.projectId && !firebaseConfig.projectId.includes("YOUR_PROJECT_ID")) {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log("Firebase Firestore initialized successfully!");
  } else {
    console.log("Firebase SDK loaded, but config is set to default. Running in LocalStorage fallback mode.");
  }
} catch (error) {
  console.error("Firebase Firestore initialization failed. LocalStorage mode:", error);
}

// 1. SAVE USER DATA
window.dbSaveUser = async function(email, userData) {
  if (!email) return false;
  
  const cleanEmail = email.toLowerCase().trim();
  const dateStr = new Date().toLocaleDateString();

  // Create document update object containing only defined values
  const docData = {
    userId: cleanEmail,
    email: cleanEmail,
    lastUpdated: new Date().toISOString()
  };

  if (userData.name !== undefined) docData.name = userData.name;
  
  if (userData.plan !== undefined) {
    docData.plan = userData.plan;
    docData.activePlan = userData.plan;
  }
  if (userData.activePlan !== undefined) {
    docData.activePlan = userData.activePlan;
  }

  if (userData.txnRefId !== undefined || userData.transactionId !== undefined) {
    const txnVal = userData.txnRefId || userData.transactionId || "N/A";
    docData.txnRefId = txnVal;
    docData.transactionId = txnVal;
  }

  if (userData.paymentStatus !== undefined) {
    docData.paymentStatus = userData.paymentStatus;
  } else if (userData.plan !== undefined) {
    docData.paymentStatus = userData.plan === "Free" ? "Verified" : "Pending Verification";
  }

  if (userData.registrationDate !== undefined) docData.registrationDate = userData.registrationDate;
  if (userData.waterCount !== undefined) docData.waterCount = userData.waterCount;
  if (userData.waterTarget !== undefined) docData.waterTarget = userData.waterTarget;
  if (userData.completedExercisesCount !== undefined) docData.completedExercisesCount = userData.completedExercisesCount;
  if (userData.totalExercisesCount !== undefined) docData.totalExercisesCount = userData.totalExercisesCount;
  if (userData.completedExercisesList !== undefined) docData.completedExercisesList = userData.completedExercisesList;
  if (userData.weightLogs !== undefined) docData.weightLogs = userData.weightLogs;
  if (userData.queries !== undefined) docData.queries = userData.queries;
  if (userData.fitnessGoal !== undefined) docData.fitnessGoal = userData.fitnessGoal;
  if (userData.workoutProgress !== undefined) docData.workoutProgress = userData.workoutProgress;
  if (userData.lastLogin !== undefined) docData.lastLogin = userData.lastLogin;

  // Sync to local client by merging
  let mergedData = {};
  const localData = localStorage.getItem("fitlife_current_user");
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (parsed && parsed.email === cleanEmail) {
        mergedData = parsed;
      }
    } catch (e) {
      console.error("Error parsing local user session:", e);
    }
  }
  Object.assign(mergedData, docData);
  localStorage.setItem("fitlife_current_user", JSON.stringify(mergedData));

  // Sync to local multi-user DB fallback (persisted across logouts)
  let localUsers = [];
  const rawLocalUsers = localStorage.getItem("fitlife_local_users");
  if (rawLocalUsers) {
    try {
      localUsers = JSON.parse(rawLocalUsers);
      if (!Array.isArray(localUsers)) localUsers = [];
    } catch (e) {
      console.error("Error parsing fitlife_local_users:", e);
    }
  }
  const userIdx = localUsers.findIndex(u => u.email === cleanEmail);
  let localUserDoc = (userIdx !== -1) ? localUsers[userIdx] : {};
  Object.assign(localUserDoc, docData);
  if (userIdx !== -1) {
    localUsers[userIdx] = localUserDoc;
  } else {
    localUsers.push(localUserDoc);
  }
  localStorage.setItem("fitlife_local_users", JSON.stringify(localUsers));

  if (db) {
    try {
      await db.collection("users").doc(cleanEmail).set(docData, { merge: true });
      console.log("User successfully written to Firestore:", cleanEmail, docData);
      return true;
    } catch (e) {
      console.error("Error writing user to Firestore:", e);
      return false;
    }
  }
  return true;
};

// 2. RETRIEVE USER BY EMAIL
window.dbGetUser = async function(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  if (db) {
    try {
      const doc = await db.collection("users").doc(cleanEmail).get();
      if (doc.exists) {
        const data = doc.data();
        localStorage.setItem("fitlife_current_user", JSON.stringify(data));
        return data;
      }
      return null;
    } catch (e) {
      console.error("Error reading user from Firestore:", e);
    }
  }

  // LocalStorage fallback - check current user first
  const localData = localStorage.getItem("fitlife_current_user");
  if (localData) {
    const parsed = JSON.parse(localData);
    if (parsed.email === cleanEmail) {
      return parsed;
    }
  }

  // Check multi-user list
  const rawLocalUsers = localStorage.getItem("fitlife_local_users");
  if (rawLocalUsers) {
    try {
      const localUsers = JSON.parse(rawLocalUsers);
      if (Array.isArray(localUsers)) {
        const found = localUsers.find(u => u.email === cleanEmail);
        if (found) {
          localStorage.setItem("fitlife_current_user", JSON.stringify(found));
          return found;
        }
      }
    } catch (e) {
      console.error("Error parsing fitlife_local_users:", e);
    }
  }
  return null;
};

// 3. FETCH ALL USER RECORDS
window.dbGetAllUsers = async function() {
  if (db) {
    try {
      const querySnapshot = await db.collection("users").orderBy("lastUpdated", "desc").get();
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data());
      });
      return users;
    } catch (e) {
      console.error("Error reading all users from Firestore:", e);
      return [];
    }
  }

  // LocalStorage fallback
  const rawLocalUsers = localStorage.getItem("fitlife_local_users");
  if (rawLocalUsers) {
    try {
      const localUsers = JSON.parse(rawLocalUsers);
      if (Array.isArray(localUsers)) {
        return localUsers.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
      }
    } catch (e) {
      console.error("Error parsing fitlife_local_users:", e);
    }
  }

  const localData = localStorage.getItem("fitlife_current_user");
  if (localData) {
    return [JSON.parse(localData)];
  }
  return [];
};

// 4. DELETE USER RECORD BY EMAIL
window.dbDeleteUser = async function(email) {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // Remove local copy if match
  const localData = localStorage.getItem("fitlife_current_user");
  if (localData) {
    const parsed = JSON.parse(localData);
    if (parsed.email === cleanEmail) {
      localStorage.removeItem("fitlife_current_user");
    }
  }

  // Remove from multi-user list
  const rawLocalUsers = localStorage.getItem("fitlife_local_users");
  if (rawLocalUsers) {
    try {
      let localUsers = JSON.parse(rawLocalUsers);
      if (Array.isArray(localUsers)) {
        localUsers = localUsers.filter(u => u.email !== cleanEmail);
        localStorage.setItem("fitlife_local_users", JSON.stringify(localUsers));
      }
    } catch (e) {
      console.error("Error parsing fitlife_local_users:", e);
    }
  }

  if (db) {
    try {
      await db.collection("users").doc(cleanEmail).delete();
      console.log("User successfully deleted from Firestore:", cleanEmail);
      return true;
    } catch (e) {
      console.error("Error deleting user from Firestore:", e);
      return false;
    }
  }
  return true;
};

// 5. UPDATE USER STATUS (ADMIN)
window.dbUpdateUserStatus = async function(email, updates) {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  // Sync to local current session
  const localData = localStorage.getItem("fitlife_current_user");
  if (localData) {
    const parsed = JSON.parse(localData);
    if (parsed.email === cleanEmail) {
      Object.assign(parsed, updates);
      localStorage.setItem("fitlife_current_user", JSON.stringify(parsed));
    }
  }

  // Sync to local multi-user list
  const rawLocalUsers = localStorage.getItem("fitlife_local_users");
  if (rawLocalUsers) {
    try {
      const localUsers = JSON.parse(rawLocalUsers);
      if (Array.isArray(localUsers)) {
        const foundIdx = localUsers.findIndex(u => u.email === cleanEmail);
        if (foundIdx !== -1) {
          Object.assign(localUsers[foundIdx], updates);
          localUsers[foundIdx].lastUpdated = new Date().toISOString();
          localStorage.setItem("fitlife_local_users", JSON.stringify(localUsers));
        }
      }
    } catch (e) {
      console.error("Error parsing fitlife_local_users:", e);
    }
  }

  if (db) {
    try {
      await db.collection("users").doc(cleanEmail).set(updates, { merge: true });
      console.log("User status successfully updated in Firestore:", cleanEmail, updates);
      return true;
    } catch (e) {
      console.error("Error updating user status in Firestore:", e);
      return false;
    }
  }
  return true;
};
