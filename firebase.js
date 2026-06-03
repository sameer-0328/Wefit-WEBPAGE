// FitLife Fitness Webpage - Firebase Firestore Database Module

// FIREBASE CONFIGURATION & INITIALIZATION
// Replace these parameters with your actual Firebase project web app configuration.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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

  const docData = {
    userId: cleanEmail,
    name: userData.name || "",
    email: cleanEmail,
    plan: userData.plan || "Free",
    txnRefId: userData.txnRefId || userData.transactionId || "N/A",
    transactionId: userData.txnRefId || userData.transactionId || "N/A",
    paymentStatus: userData.paymentStatus || (userData.plan === "Free" ? "Verified" : "Pending Verification"),
    registrationDate: userData.registrationDate || dateStr,
    waterCount: userData.waterCount !== undefined ? userData.waterCount : 0,
    waterTarget: userData.waterTarget !== undefined ? userData.waterTarget : 8,
    completedExercisesCount: userData.completedExercisesCount !== undefined ? userData.completedExercisesCount : 0,
    totalExercisesCount: userData.totalExercisesCount !== undefined ? userData.totalExercisesCount : 0,
    completedExercisesList: userData.completedExercisesList || [],
    weightLogs: userData.weightLogs || [],
    queries: userData.queries || [],
    fitnessGoal: userData.fitnessGoal || "gain",
    workoutProgress: userData.workoutProgress || (userData.totalExercisesCount > 0 ? Math.round((userData.completedExercisesCount / userData.totalExercisesCount) * 100) + "%" : "0%"),
    lastUpdated: new Date().toISOString()
  };

  // Sync to local client
  localStorage.setItem("fitlife_current_user", JSON.stringify(docData));

  if (db) {
    try {
      await db.collection("users").doc(cleanEmail).set(docData, { merge: true });
      console.log("User successfully written to Firestore:", cleanEmail);
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
        return doc.data();
      }
      return null;
    } catch (e) {
      console.error("Error reading user from Firestore:", e);
    }
  }

  // LocalStorage fallback
  const localData = localStorage.getItem("fitlife_current_user");
  if (localData) {
    const parsed = JSON.parse(localData);
    if (parsed.email === cleanEmail) {
      return parsed;
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

  // Sync to local client
  const localData = localStorage.getItem("fitlife_current_user");
  if (localData) {
    const parsed = JSON.parse(localData);
    if (parsed.email === cleanEmail) {
      Object.assign(parsed, updates);
      localStorage.setItem("fitlife_current_user", JSON.stringify(parsed));
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
  return false;
};
