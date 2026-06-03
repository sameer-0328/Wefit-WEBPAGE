document.addEventListener("DOMContentLoaded", () => {
  // Firebase configuration and Firestore operations are handled in firebase.js.
  // We can use window.dbSaveUser, window.dbGetUser, window.dbGetAllUsers directly.

  window.saveUserToDatabase = async function(name, email, plan, txnRefId = "N/A") {
    const dateStr = window.registrationDate || new Date().toLocaleDateString();
    const totalOverall = plan === "Free" ? 4 : 33;
    const completedOverall = window.completedExercisesList ? window.completedExercisesList.length : 0;

    const userDataObj = {
      name: name,
      email: email,
      plan: plan,
      registrationDate: dateStr,
      txnRefId: txnRefId,
      waterCount: window.userWaterCount || 0,
      waterTarget: window.userWaterTarget || 8,
      completedExercisesCount: completedOverall,
      totalExercisesCount: totalOverall,
      completedExercisesList: window.completedExercisesList || [],
      weightLogs: window.weightLogs || [],
      queries: window.trainerQueries || []
    };

    if (typeof window.dbSaveUser === 'function') {
      await window.dbSaveUser(email, userDataObj);
    } else {
      localStorage.setItem("fitlife_current_user", JSON.stringify(userDataObj));
    }
  };

  window.syncUserProgress = async function() {
    const email = window.registeredEmail;
    if (!email) return;

    const totalOverall = window.registeredPlan === "Free" ? 4 : 33;
    const completedOverall = window.completedExercisesList ? window.completedExercisesList.length : 0;

    const progressUpdate = {
      waterCount: window.userWaterCount || 0,
      waterTarget: window.userWaterTarget || 8,
      completedExercisesCount: completedOverall,
      totalExercisesCount: totalOverall,
      completedExercisesList: window.completedExercisesList || [],
      weightLogs: window.weightLogs || [],
      queries: window.trainerQueries || []
    };

    if (typeof window.dbSaveUser === 'function') {
      await window.dbSaveUser(email, progressUpdate);
    } else {
      let localData = localStorage.getItem("fitlife_current_user");
      if (localData) {
        let parsed = JSON.parse(localData);
        Object.assign(parsed, progressUpdate);
        localStorage.setItem("fitlife_current_user", JSON.stringify(parsed));
      }
    }
  };

  window.syncUserProgressManual = async function() {
    const email = window.registeredEmail;
    if (!email) {
      alert("No active registration found. Please register first.");
      return;
    }
    
    await window.syncUserProgress();

    const saveBtn = document.getElementById("dashSaveBtn");
    if (saveBtn) {
      saveBtn.innerHTML = "Submitting... 🔄";
      saveBtn.style.opacity = "0.7";
      saveBtn.style.pointerEvents = "none";
      setTimeout(() => {
        saveBtn.innerHTML = "Submitted! ✓";
        saveBtn.style.background = "#22c55e"; // Success green
        saveBtn.style.color = "#ffffff";
        saveBtn.style.opacity = "1";
        saveBtn.style.pointerEvents = "none"; // Inactive until user changes workout stats
      }, 800);
    } else {
      alert("Progress saved successfully!");
    }
  };

  window.markProgressUnsaved = function() {
    const saveBtn = document.getElementById("dashSaveBtn");
    if (saveBtn && saveBtn.innerHTML !== "Submit Progress 📤") {
      saveBtn.innerHTML = "Submit Progress 📤";
      saveBtn.style.background = ""; // Restore defaults
      saveBtn.style.color = "";
      saveBtn.style.opacity = "";
      saveBtn.style.pointerEvents = "";
    }
  };

  // ELEMENTS
  const nav = document.querySelector("nav");
  const menuBtn = document.querySelector(".menu-btn");
  const navList = document.querySelector("nav ul");
  const startBtn = document.getElementById("startBtn");
  const formSection = document.getElementById("formSection");
  const dashboard = document.getElementById("dashboard");
  const userForm = document.getElementById("userForm");
  const userData = document.getElementById("userData");
  const planDetails = document.getElementById("planDetails");
  const mainSections = ["home", "plans", "tools", "about", "contact"];
  const navLinks = document.querySelectorAll("nav ul li a");

  // Sticky Nav on Scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }

    // Nav active link highlighting on scroll
    let current = "";
    mainSections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) {
        const sectionTop = section.offsetTop - 120;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
          current = sectionId;
        }
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      const href = link.getAttribute("href");
      if (href && href.substring(1) === current) {
        link.classList.add("active");
      }
    });
  });

  // Mobile Menu Toggle
  menuBtn.addEventListener("click", () => {
    navList.classList.toggle("active");
    menuBtn.classList.toggle("open");
  });

  // Close mobile menu when link clicked
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navList.classList.remove("active");
      menuBtn.classList.remove("open");
    });
  });

  // Navigation Links Action
  window.showSection = function(sectionId) {
    // If dashboard is open, we can close it to show the home layout
    if (dashboard.style.display === "block" && sectionId !== "dashboard") {
      dashboard.style.display = "none";
      // Restore other sections
      document.querySelectorAll(".landing-section").forEach(sec => {
        sec.style.display = "block";
      });
      formSection.style.display = "flex";
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 90; // Adjust for nav height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // PLAN SELECTION LOGIC
  window.selectPlan = function(planName) {
    const planSelect = document.getElementById("plan");
    if (planSelect) {
      planSelect.value = planName;
    }
    showSection("formSection");
  };

  // Get Started Hero button
  startBtn.addEventListener("click", () => {
    showSection("formSection");
  });

  // BMI CALCULATOR LOGIC
  const calculateBmiBtn = document.getElementById("calculateBmiBtn");
  if (calculateBmiBtn) {
    calculateBmiBtn.addEventListener("click", calculateBMI);
  }

  function calculateBMI() {
    const weight = parseFloat(document.getElementById("bmi-weight").value);
    const height = parseFloat(document.getElementById("bmi-height").value);
    const resultWrapper = document.getElementById("bmiResultWrapper");
    const numDisplay = document.getElementById("bmiNum");
    const statusDisplay = document.getElementById("bmiStatus");
    const progress = document.getElementById("bmiProgress");
    const tipsDisplay = document.getElementById("bmiTips");

    if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
      alert("Please enter valid height and weight values.");
      return;
    }

    // Formula: Weight (kg) / Height (m)^2
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    numDisplay.textContent = bmi;
    resultWrapper.style.display = "block";

    let status = "";
    let colorClass = "";
    let tipText = "";
    let progressPercent = 0;

    if (bmi < 18.5) {
      status = "Underweight";
      colorClass = "underweight";
      tipText = "Focus on nutrient-dense foods, proteins, and strength training to build muscle mass safely.";
      progressPercent = (bmi / 18.5) * 30; // Scale to 30% of bar
    } else if (bmi >= 18.5 && bmi < 24.9) {
      status = "Normal Weight";
      colorClass = "normal";
      tipText = "Excellent job! Keep maintaining your weight with balanced eating and regular physical activity.";
      progressPercent = 30 + ((bmi - 18.5) / 6.4) * 35; // Scale to 30-65%
    } else if (bmi >= 25 && bmi < 29.9) {
      status = "Overweight";
      colorClass = "overweight";
      tipText = "Incorporate regular cardio routines, calorie control, and high-intensity interval training (HIIT).";
      progressPercent = 65 + ((bmi - 25) / 4.9) * 20; // Scale to 65-85%
    } else {
      status = "Obese";
      colorClass = "obese";
      tipText = "Consult with a health professional. Prioritize low-impact aerobic exercises and portion control.";
      progressPercent = 85 + Math.min(((bmi - 30) / 10) * 15, 15); // Scale up to 100%
    }

    statusDisplay.textContent = status;
    statusDisplay.className = `bmi-status ${colorClass}`;
    tipsDisplay.textContent = tipText;
    
    // Animate progress bar
    setTimeout(() => {
      progress.style.width = `${Math.min(progressPercent, 100)}%`;
    }, 100);

    // Save BMI in local storage/global object for dashboard logs
    window.userBMI = bmi;
    window.userBMIStatus = status;
  }

  // WATER TRACKER LOGIC
  let waterCount = 0;
  const waterTarget = 8;
  const waterLevel = document.getElementById("waterLevel");
  const waterCountText = document.getElementById("waterCount");
  const waterProgressPercent = document.getElementById("waterProgressPercent");
  const addWaterBtn = document.getElementById("addWaterBtn");
  const resetWaterBtn = document.getElementById("resetWaterBtn");

  if (addWaterBtn) {
    addWaterBtn.addEventListener("click", () => {
      if (waterCount < 12) { // Allow slightly over target
        waterCount++;
        updateWaterUI();
      }
    });
  }

  if (resetWaterBtn) {
    resetWaterBtn.addEventListener("click", () => {
      waterCount = 0;
      updateWaterUI();
    });
  }

  function updateWaterUI() {
    const percent = Math.min((waterCount / waterTarget) * 100, 100);
    waterLevel.style.height = `${percent}%`;
    waterCountText.textContent = `${waterCount} / ${waterTarget}`;
    waterProgressPercent.textContent = `${percent.toFixed(0)}%`;
    
    // Save to global context for logs
    window.userWaterCount = waterCount;
    window.userWaterTarget = waterTarget;
    
    // If dashboard is open, sync the logged value
    const logWater = document.getElementById("logWater");
    if (logWater) {
      logWater.textContent = `${waterCount} / ${waterTarget} Cups (${percent.toFixed(0)}%)`;
    }
    syncUserProgress();
    markProgressUnsaved();
  }

  // ONBOARDING FORM SUBMISSION
  userForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const plan = document.getElementById("plan").value;

    if (!name || !email) {
      alert("Please fill in all details.");
      return;
    }

    // Check if user already exists in Firestore (Returning User auto-login)
    if (typeof window.dbGetUser === 'function') {
      try {
        const existingUser = await window.dbGetUser(email);
        if (existingUser) {
          alert("Welcome back! Loading your existing profile...");

          // Restore credentials and progress
          window.registeredName = existingUser.name || name;
          window.registeredEmail = existingUser.email || email;
          window.registeredPlan = existingUser.plan || plan;
          window.registrationDate = existingUser.registrationDate;
          window.txnRefId = existingUser.txnRefId || "N/A";
          window.userWaterCount = existingUser.waterCount || 0;
          window.userWaterTarget = existingUser.waterTarget || 8;
          window.weightLogs = existingUser.weightLogs || [];
          window.trainerQueries = existingUser.queries || [];
          window.completedExercisesCount = existingUser.completedExercisesCount || 0;
          window.totalExercisesCount = existingUser.totalExercisesCount || (existingUser.plan === "Free" ? 4 : 33);
          window.completedExercisesList = existingUser.completedExercisesList || [];

          // Sync local water variable
          waterCount = window.userWaterCount;

          // Unlock dashboard
          unlockDashboardUI(window.registeredName, window.registeredEmail, window.registeredPlan);

          // Update UI components
          updateWaterUI();
          renderWeightLogTable();
          return;
        }
      } catch (err) {
        console.error("Error checking returning user:", err);
      }
    }

    // New User Onboarding
    window.registeredName = name;
    window.registeredEmail = email;
    window.registeredPlan = plan;
    window.registrationDate = new Date().toLocaleDateString();

    if (plan === "Free") {
      await completeRegistrationAndUnlockDashboard(name, email, plan);
    } else {
      await saveUserToDatabase(name, email, plan, "Pending");

      const amount = plan === "Standard" ? "₹499" : "₹899";
      document.getElementById("paymentPlanSummary").textContent = `${plan} Plan - ${amount}`;
      formSection.style.display = "none";
      const paymentSection = document.getElementById("paymentSection");
      paymentSection.style.display = "flex";
      paymentSection.scrollIntoView({ behavior: "smooth" });
      
      // Default to UPI view
      switchPaymentMethod("upi");
    }
  });

  // HELPER TO COMPLETE REGISTRATION & SHOW DASHBOARD
  async function completeRegistrationAndUnlockDashboard(name, email, plan) {
    await saveUserToDatabase(name, email, plan, window.txnRefId || "N/A");
    unlockDashboardUI(name, email, plan);
  }

  function unlockDashboardUI(name, email, plan) {
    // Hide Landing Page sections
    document.querySelectorAll(".landing-section").forEach(sec => {
      sec.style.display = "none";
    });
    formSection.style.display = "none";
    document.getElementById("paymentSection").style.display = "none";

    // Show Dashboard
    dashboard.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Populate user details in header
    document.getElementById("userAvatar").textContent = name.charAt(0).toUpperCase();
    document.getElementById("dashName").textContent = `Welcome, ${name}!`;
    document.getElementById("dashEmail").textContent = email;
    document.getElementById("dashPlanBadge").textContent = `${plan} Plan`;

    const saveBtn = document.getElementById("dashSaveBtn");
    if (saveBtn) {
      saveBtn.style.display = plan === "Standard" ? "inline-flex" : "none";
    }

    // Initialize Active Tab
    switchDashboardTab("my-plan-tab");

    // Populate plan details
    renderPlanDetails(plan);
    
    // Initialize workout checklist interactions
    initWorkoutChecklist();

    // Populate Logs tab
    updateDashboardLogs(name, email, plan);
  }

  // PAYMENT HANDLERS
  window.switchPaymentMethod = function(method) {
    const payUpiTab = document.getElementById("payUpiTab");
    const payQrTab = document.getElementById("payQrTab");
    const paymentUpiView = document.getElementById("paymentUpiView");
    const paymentQrView = document.getElementById("paymentQrView");

    if (method === "upi") {
      paymentUpiView.style.display = "block";
      paymentQrView.style.display = "none";
      payUpiTab.className = "btn active";
      payQrTab.className = "btn btn-secondary";
    } else if (method === "qr") {
      paymentUpiView.style.display = "none";
      paymentQrView.style.display = "block";
      payQrTab.className = "btn active";
      payUpiTab.className = "btn btn-secondary";
    }
  };

  window.copyUpiId = function() {
    const upiId = "sameerkhan637577@okhdfcbank";
    navigator.clipboard.writeText(upiId).then(() => {
      const copyBtn = document.getElementById("copyUpiBtn");
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      copyBtn.style.background = "var(--primary-hover)";
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = "";
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy UPI ID: ", err);
      alert("Failed to copy UPI ID. Please copy it manually: sameerkhan637577@okhdfcbank");
    });
  };

  window.cancelPayment = function() {
    document.getElementById("paymentSection").style.display = "none";
    formSection.style.display = "flex";
    formSection.scrollIntoView({ behavior: "smooth" });
  };

  // Payment Confirmation Form
  const paymentConfirmForm = document.getElementById("paymentConfirmForm");
  if (paymentConfirmForm) {
    paymentConfirmForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      const txnRefId = document.getElementById("txnRefId").value.trim();

      if (!/^[0-9]{12}$/.test(txnRefId)) {
        alert("Please enter a valid 12-digit UPI UTR/Transaction Reference ID.");
        return;
      }

      // Save transaction reference
      window.txnRefId = txnRefId;
      window.txnAmount = window.registeredPlan === "Standard" ? "₹499" : "₹899";

      // Unlock Dashboard
      await completeRegistrationAndUnlockDashboard(
        window.registeredName,
        window.registeredEmail,
        window.registeredPlan
      );
      
      // Clear input
      document.getElementById("txnRefId").value = "";
    });
  }

  // SWITCH DASHBOARD TABS
  const dashTabs = document.querySelectorAll(".dash-tab");
  dashTabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      const tabId = e.target.id;
      switchDashboardTab(tabId);
    });
  });

  function switchDashboardTab(tabId) {
    // Deactivate all tabs and contents
    dashTabs.forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".dash-content-section").forEach(sec => sec.classList.remove("active"));

    // Activate selected
    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.add("active");

    const contentId = tabId.replace("-tab", "-content");
    const selectedContent = document.getElementById(contentId);
    if (selectedContent) {
      selectedContent.classList.add("active");
    }
  }

  // EXERCISE DATABASES FOR 7-DAY SPLIT
  const dayExercises = {
    1: `
      <div class="exercise-list">
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Flat Barbell Bench Press">
          <div class="exercise-info">
            <span class="exercise-title">Flat Barbell Bench Press</span>
            <span class="exercise-meta">4 Sets × 8-10 Reps (Chest Power)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Incline Dumbbell Press">
          <div class="exercise-info">
            <span class="exercise-title">Incline Dumbbell Press</span>
            <span class="exercise-meta">3 Sets × 10 Reps (Upper Chest)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Overhead Dumbbell Extension">
          <div class="exercise-info">
            <span class="exercise-title">Overhead Dumbbell Extension</span>
            <span class="exercise-meta">3 Sets × 12 Reps (Triceps Long Head)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Lateral Raises">
          <div class="exercise-info">
            <span class="exercise-title">Lateral Raises</span>
            <span class="exercise-meta">4 Sets × 15 Reps (Side Delts)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Tricep Rope Pushdown">
          <div class="exercise-info">
            <span class="exercise-title">Tricep Rope Pushdown</span>
            <span class="exercise-meta">3 Sets × 15 Reps (Triceps Lateral Head)</span>
          </div>
        </label>
      </div>
    `,
    2: `
      <div class="exercise-list">
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Conventional Deadlift">
          <div class="exercise-info">
            <span class="exercise-title">Conventional Deadlift</span>
            <span class="exercise-meta">3 Sets × 5 Reps (Posterior Chain)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Lat Pulldowns">
          <div class="exercise-info">
            <span class="exercise-title">Lat Pulldowns</span>
            <span class="exercise-meta">3 Sets × 10 Reps (Back Width)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Chest-Supported Rows">
          <div class="exercise-info">
            <span class="exercise-title">Chest-Supported Rows</span>
            <span class="exercise-meta">3 Sets × 12 Reps (Mid-Back Thickness)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Barbell Bicep Curls">
          <div class="exercise-info">
            <span class="exercise-title">Barbell Bicep Curls</span>
            <span class="exercise-meta">3 Sets × 10 Reps (Biceps Peak)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Hammer Curls">
          <div class="exercise-info">
            <span class="exercise-title">Hammer Curls</span>
            <span class="exercise-meta">3 Sets × 12 Reps (Forearms/Biceps)</span>
          </div>
        </label>
      </div>
    `,
    3: `
      <div class="exercise-list">
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Barbell Back Squats">
          <div class="exercise-info">
            <span class="exercise-title">Barbell Back Squats</span>
            <span class="exercise-meta">4 Sets × 8 Reps (Quads/Glutes Power)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Leg Press">
          <div class="exercise-info">
            <span class="exercise-title">Leg Press</span>
            <span class="exercise-meta">3 Sets × 12 Reps (Quad Focus)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Leg Extensions">
          <div class="exercise-info">
            <span class="exercise-title">Leg Extensions</span>
            <span class="exercise-meta">3 Sets × 15 Reps (Quad Burner)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Standing Calf Raises">
          <div class="exercise-info">
            <span class="exercise-title">Standing Calf Raises</span>
            <span class="exercise-meta">4 Sets × 15 Reps (Calves)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Hanging Knee Raises">
          <div class="exercise-info">
            <span class="exercise-title">Hanging Knee Raises</span>
            <span class="exercise-meta">3 Sets × 15 Reps (Abs/Core)</span>
          </div>
        </label>
      </div>
    `,
    4: `
      <div class="exercise-list">
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Low-Intensity Cardio">
          <div class="exercise-info">
            <span class="exercise-title">Low-Intensity Cardio</span>
            <span class="exercise-meta">30 mins Jog/Cycle (Active Recovery)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Planks Hold">
          <div class="exercise-info">
            <span class="exercise-title">Planks Hold</span>
            <span class="exercise-meta">3 Sets × 60 Sec Hold (Core Stability)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Russian Twists">
          <div class="exercise-info">
            <span class="exercise-title">Russian Twists</span>
            <span class="exercise-meta">3 Sets × 20 Reps (Obliques)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Bicycle Crunches">
          <div class="exercise-info">
            <span class="exercise-title">Bicycle Crunches</span>
            <span class="exercise-meta">3 Sets × 15 Reps (Abs)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Mobility & Stretching">
          <div class="exercise-info">
            <span class="exercise-title">Mobility & Stretching</span>
            <span class="exercise-meta">15 mins Full Body Mobility Flow</span>
          </div>
        </label>
      </div>
    `,
    5: `
      <div class="exercise-list">
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Overhead Barbell Press">
          <div class="exercise-info">
            <span class="exercise-title">Overhead Barbell Press</span>
            <span class="exercise-meta">4 Sets × 8 Reps (Shoulder Power)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Pull-ups / Chin-ups">
          <div class="exercise-info">
            <span class="exercise-title">Pull-ups / Chin-ups</span>
            <span class="exercise-meta">3 Sets × Max Reps (Lats/Biceps)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Dumbbell Bench Press">
          <div class="exercise-info">
            <span class="exercise-title">Dumbbell Bench Press</span>
            <span class="exercise-meta">3 Sets × 10 Reps (Chest Volume)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Cable Crossover Flyes">
          <div class="exercise-info">
            <span class="exercise-title">Cable Crossover Flyes</span>
            <span class="exercise-meta">3 Sets × 12 Reps (Chest Squeeze)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Face Pulls">
          <div class="exercise-info">
            <span class="exercise-title">Face Pulls</span>
            <span class="exercise-meta">4 Sets × 15 Reps (Rear Delts/Posture)</span>
          </div>
        </label>
      </div>
    `,
    6: `
      <div class="exercise-list">
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Romanian Deadlifts">
          <div class="exercise-info">
            <span class="exercise-title">Romanian Deadlifts</span>
            <span class="exercise-meta">4 Sets × 10 Reps (Hamstrings/Glutes)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Leg Curls">
          <div class="exercise-info">
            <span class="exercise-title">Leg Curls</span>
            <span class="exercise-meta">3 Sets × 12 Reps (Hamstrings isolation)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Dumbbell Walking Lunges">
          <div class="exercise-info">
            <span class="exercise-title">Dumbbell Walking Lunges</span>
            <span class="exercise-meta">3 Sets × 12 Reps Per Leg (Leg Mass)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Seated Calf Raises">
          <div class="exercise-info">
            <span class="exercise-title">Seated Calf Raises</span>
            <span class="exercise-meta">4 Sets × 15 Reps (Calves)</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Ab Wheel Rollouts">
          <div class="exercise-info">
            <span class="exercise-title">Ab Wheel Rollouts</span>
            <span class="exercise-meta">3 Sets × 10 Reps (Core Strength)</span>
          </div>
        </label>
      </div>
    `,
    7: `
      <div class="exercise-list">
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Rest Day Walking">
          <div class="exercise-info">
            <span class="exercise-title">Active Recovery Walking</span>
            <span class="exercise-meta">20-30 mins Light Walking</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Deep Stretching Routine">
          <div class="exercise-info">
            <span class="exercise-title">Deep Stretching Routine</span>
            <span class="exercise-meta">20 mins Full Body Deep Static Stretch</span>
          </div>
        </label>
        <label class="exercise-item">
          <input type="checkbox" class="workout-chk" data-name="Hamstring & Hip Openers">
          <div class="exercise-info">
            <span class="exercise-title">Hamstring & Hip Openers</span>
            <span class="exercise-meta">4 Rounds × 30 Sec Holds</span>
          </div>
        </label>
      </div>
    `
  };

  // RENDER DETAILED PLANS IN DASHBOARD
  function renderPlanDetails(plan) {
    let detailsHtml = "";

    if (plan === "Free") {
      detailsHtml = `
        <h3>Free Workout Checklist</h3>
        <p class="section-desc" style="text-align: left; margin: 0 0 20px;">Complete these daily exercises to build consistent fitness habits.</p>
        
        <div class="workout-progress-wrapper">
          <div class="progress-label">
            <span>Daily Progress</span>
            <span id="workoutProgressNum">0%</span>
          </div>
          <div class="progress-bar-bg">
            <div id="workoutProgressBar" class="progress-bar-fill"></div>
          </div>
        </div>

        <div class="exercise-list">
          <label class="exercise-item">
            <input type="checkbox" class="workout-chk" data-name="Pushups">
            <div class="exercise-info">
              <span class="exercise-title">Pushups</span>
              <span class="exercise-meta">3 Sets × 12 Reps (Upper Body)</span>
            </div>
          </label>
          
          <label class="exercise-item">
            <input type="checkbox" class="workout-chk" data-name="Bodyweight Squats">
            <div class="exercise-info">
              <span class="exercise-title">Bodyweight Squats</span>
              <span class="exercise-meta">3 Sets × 15 Reps (Lower Body)</span>
            </div>
          </label>
          
          <label class="exercise-item">
            <input type="checkbox" class="workout-chk" data-name="Jumping Jacks">
            <div class="exercise-info">
              <span class="exercise-title">Jumping Jacks</span>
              <span class="exercise-meta">2 Sets × 45 Seconds (Cardio Warm-up)</span>
            </div>
          </label>
          
          <label class="exercise-item">
            <input type="checkbox" class="workout-chk" data-name="Plank Hold">
            <div class="exercise-info">
              <span class="exercise-title">Plank Hold</span>
              <span class="exercise-meta">2 Sets × 30 Seconds (Core Stability)</span>
            </div>
          </label>
        </div>
      `;
    } else if (plan === "Standard") {
      detailsHtml = `
        <h3 style="margin-bottom: 20px; font-weight: 900; color: var(--primary);">Standard Hypertrophy Workspace</h3>
        
        <!-- SECTION 1: 7-DAY WORKOUT SPLIT -->
        <div style="border: 1px solid var(--border-color); padding: 20px; border-radius: 6px; margin-bottom: 25px;">
          <h4 style="text-transform: uppercase; font-size: 15px; margin-bottom: 12px; color: var(--text-main); font-weight:800;">1. 7-Day Workout Split</h4>
          <p class="section-desc" style="text-align: left; margin: 0 0 15px; font-size: 13px;">Choose your workout split for today to track your exercises.</p>
          
          <div class="schedule-tabs" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="schedule-tab-btn active" onclick="switchWorkoutDay(1)">Day 1: Push</button>
            <button class="schedule-tab-btn" onclick="switchWorkoutDay(2)">Day 2: Pull</button>
            <button class="schedule-tab-btn" onclick="switchWorkoutDay(3)">Day 3: Legs</button>
            <button class="schedule-tab-btn" onclick="switchWorkoutDay(4)">Day 4: Cardio</button>
            <button class="schedule-tab-btn" onclick="switchWorkoutDay(5)">Day 5: Upper</button>
            <button class="schedule-tab-btn" onclick="switchWorkoutDay(6)">Day 6: Lower</button>
            <button class="schedule-tab-btn" onclick="switchWorkoutDay(7)">Day 7: Rest</button>
          </div>

          <div class="workout-progress-wrapper" style="margin-top: 15px;">
            <div class="progress-label">
              <span>Today's Progress</span>
              <span id="workoutProgressNum">0%</span>
            </div>
            <div class="progress-bar-bg">
              <div id="workoutProgressBar" class="progress-bar-fill"></div>
            </div>
          </div>

          <!-- Dynamic Exercise Checklist Container -->
          <div id="scheduleExercisesContainer" style="margin-top: 15px;">
            <!-- Loaded dynamically -->
          </div>
        </div>

        <!-- SECTION 2: CUSTOMIZED DIET BLUEPRINT -->
        <div style="border: 1px solid var(--border-color); padding: 20px; border-radius: 6px; margin-bottom: 25px;">
          <h4 style="text-transform: uppercase; font-size: 15px; margin-bottom: 12px; color: var(--text-main); font-weight:800;">2. Customized Diet Blueprint</h4>
          <div class="diet-selector-wrapper">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Select Goal:</label>
            <select id="dietGoalSelect" style="width: auto; background: #111; border: 1px solid var(--border-color); color: white; padding: 6px 12px; border-radius: 4px;" onchange="loadDietBlueprint(this.value)">
              <option value="gain">Muscle Gain (Caloric Surplus)</option>
              <option value="loss">Fat Loss (Caloric Deficit)</option>
              <option value="maintain">Maintenance (Lean Fit)</option>
            </select>
          </div>
          
          <div id="dietBlueprintContainer">
            <!-- Loaded dynamically -->
          </div>
        </div>

        <!-- SECTION 3: VIDEO SUPPORT -->
        <div style="border: 1px solid var(--border-color); padding: 20px; border-radius: 6px; margin-bottom: 25px;">
          <h4 style="text-transform: uppercase; font-size: 15px; margin-bottom: 5px; color: var(--text-main); font-weight:800;">3. Video Form Guides</h4>
          <p class="section-desc" style="text-align: left; margin: 0 0 15px; font-size: 13px;">Watch these professional video tutorials to maintain proper compound lift form.</p>
          
          <div class="video-grid">
            <div class="video-card">
              <div>
                <h4>Bench Press Guide</h4>
                <p>Master leg drive, barbell path, and shoulder blade retraction.</p>
              </div>
              <a href="https://youtu.be/gRVjAtPip0Y?si=0wTdkRSKxwYATOj5" target="_blank" class="video-link-btn">▶ Watch Form</a>
            </div>
            
            <div class="video-card">
              <div>
                <h4>Barbell Squat Form</h4>
                <p>Learn proper depth, brace breathing, and hip hinge alignment.</p>
              </div>
              <a href="https://youtu.be/Dy28eq2PjcM?si=ZngWuAQsoJQXihno" target="_blank" class="video-link-btn">▶ Watch Form</a>
            </div>

            <div class="video-card">
              <div>
                <h4>Deadlift Checklist</h4>
                <p>Optimize hip setup, lat engagement, and neutral spine lockout.</p>
              </div>
              <a href="https://youtu.be/p2OPUi4xGrM?si=hr0rjLTdl6k30WAB" target="_blank" class="video-link-btn">▶ Watch Form</a>
            </div>
          </div>
        </div>

        <!-- SECTION 4: INTERACTIVE PROGRESS TRACKER -->
        <div style="border: 1px solid var(--border-color); padding: 20px; border-radius: 6px; margin-bottom: 25px;">
          <h4 style="text-transform: uppercase; font-size: 15px; margin-bottom: 5px; color: var(--text-main); font-weight:800;">4. Interactive Progress Tracker</h4>
          <p class="section-desc" style="text-align: left; margin: 0 0 15px; font-size: 13px;">Log your body weight consistently below to build your fitness logs.</p>
          
          <div class="weight-tracker-wrapper">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div class="form-group">
                <label>Weight (kg)</label>
                <input type="number" id="tracker-weight-input" placeholder="e.g. 70.5" step="0.1" style="background:#111; border:1px solid var(--border-color); padding:8px; border-radius:4px; color:white;">
              </div>
              <button onclick="addWeightLog()" style="padding: 10px; font-size: 13px;">Log weight</button>
            </div>
            
            <div class="weight-log-table-wrapper">
              <table class="weight-log-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody id="weightLogTableBody">
                  <tr>
                    <td colspan="2" style="text-align: center; color: var(--text-muted);">No weight entries logged yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- SECTION 5: EMAIL TRAINER SUPPORT -->
        <div class="trainer-support-box">
          <h4 style="text-transform: uppercase; font-size: 15px; margin-bottom: 5px; color: var(--text-main); font-weight:800;">5. Trainer Support Desk</h4>
          <p class="section-desc" style="text-align: left; margin: 0 0 12px; font-size: 13px;">Have questions about your diet plan or lifts? Leave a query below.</p>
          <textarea id="trainerQueryText" placeholder="Type your query here... e.g. Can I swap conventional deadlifts for RDLs?"></textarea>
          <button onclick="sendTrainerEmail()" style="width: 100%; font-size: 13px; padding: 10px;">Email Coach Sameer</button>
        </div>
      `;
    } else if (plan === "Premium") {
      detailsHtml = `
        <h3>Premium Elite Guidance Hub</h3>
        <p class="section-desc" style="text-align: left; margin: 0 0 10px;">Access high-quality video tutorials, live coaching, and a customized routine.</p>

        <div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
          <a href="https://meet.google.com" target="_blank" class="btn" style="padding: 10px 20px; font-size: 14px;">
            <span>📞</span> Join Google Meet Session
          </a>
          <span style="font-size: 13px; color: var(--text-muted); display: flex; align-items: center;">
            Next live call: Today at 5:00 PM (IST)
          </span>
        </div>

        <div class="video-wrapper">
          <video controls poster="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800">
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>

        <div class="workout-progress-wrapper" style="margin-top: 25px;">
          <div class="progress-label">
            <span>Premium Workout Progress</span>
            <span id="workoutProgressNum">0%</span>
          </div>
          <div class="progress-bar-bg">
            <div id="workoutProgressBar" class="progress-bar-fill"></div>
          </div>
        </div>

        <div class="exercise-list">
          <label class="exercise-item">
            <input type="checkbox" class="workout-chk" data-name="Weighted Squats">
            <div class="exercise-info">
              <span class="exercise-title">Weighted Barbell Squats</span>
              <span class="exercise-meta">4 Sets × 8 Reps (Focus on tempo 3-0-1)</span>
            </div>
          </label>

          <label class="exercise-item">
            <input type="checkbox" class="workout-chk" data-name="Incline Dumbbell Bench">
            <div class="exercise-info">
              <span class="exercise-title">Incline Dumbbell Bench Press</span>
              <span class="exercise-meta">4 Sets × 10 Reps (Upper Chest)</span>
            </div>
          </label>

          <label class="exercise-item">
            <input type="checkbox" class="workout-chk" data-name="Weighted Pull-ups">
            <div class="exercise-info">
              <span class="exercise-title">Weighted Pull-ups</span>
              <span class="exercise-meta">3 Sets × 8 Reps (Lat focus)</span>
            </div>
          </label>

          <label class="exercise-item">
            <input type="checkbox" class="workout-chk" data-name="Greek God Finisher">
            <div class="exercise-info">
              <span class="exercise-title">Greek God Finisher Circuit</span>
              <span class="exercise-meta">3 Rounds: Kettlebell swings & burpees (15 mins)</span>
            </div>
          </label>
        </div>
      `;
    }

    planDetails.innerHTML = detailsHtml;

    // Load initial data splits if standard plan is active
    if (plan === "Standard") {
      switchWorkoutDay(1);
      loadDietBlueprint("gain");
      if (!window.weightLogs) {
        window.weightLogs = [];
      }
      renderWeightLogTable();
    }
  }

  // WORKOUT CHECKLIST PROGRESS CALCULATION
  function initWorkoutChecklist() {
    const checkboxes = document.querySelectorAll(".workout-chk");
    const progressBar = document.getElementById("workoutProgressBar");
    const progressNum = document.getElementById("workoutProgressNum");

    // Restore checkbox states from saved progress array
    if (window.completedExercisesList && window.completedExercisesList.length > 0) {
      checkboxes.forEach(chk => {
        const name = chk.getAttribute("data-name");
        if (window.completedExercisesList.includes(name)) {
          chk.checked = true;
          const item = chk.closest(".exercise-item");
          if (item) {
            item.classList.add("completed");
          }
        }
      });
    }

    function calculateProgress() {
      if (checkboxes.length === 0) return;
      const checkedCount = Array.from(checkboxes).filter(chk => chk.checked).length;
      const percent = Math.round((checkedCount / checkboxes.length) * 100);
      
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressNum) progressNum.textContent = `${percent}%`;

      // Update in logs too
      const logExercises = document.getElementById("logExercises");
      if (logExercises) {
        const totalOverall = window.registeredPlan === "Free" ? 4 : 33;
        const completedOverall = window.completedExercisesList ? window.completedExercisesList.length : 0;
        const pctOverall = Math.round((completedOverall / totalOverall) * 100);
        logExercises.textContent = `${completedOverall} of ${totalOverall} Completed (${pctOverall}%)`;
      }
    }

    checkboxes.forEach(chk => {
      chk.addEventListener("change", (e) => {
        const item = e.target.closest(".exercise-item");
        const name = chk.getAttribute("data-name");
        
        if (!window.completedExercisesList) {
          window.completedExercisesList = [];
        }

        if (e.target.checked) {
          item.classList.add("completed");
          if (!window.completedExercisesList.includes(name)) {
            window.completedExercisesList.push(name);
          }
        } else {
          item.classList.remove("completed");
          window.completedExercisesList = window.completedExercisesList.filter(n => n !== name);
        }

        calculateProgress();
        syncUserProgress();
        markProgressUnsaved();
      });
    });

    calculateProgress(); // Run once initially
  }

  // STANDARD SPLIT HANDLERS (GLOBAL ON WINDOW)
  window.switchWorkoutDay = function (day) {
    const container = document.getElementById("scheduleExercisesContainer");
    if (!container) return;

    // Toggle active classes on subtab buttons
    const btns = document.querySelectorAll(".schedule-tab-btn");
    btns.forEach(btn => {
      btn.classList.remove("active");
      if (btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(day)) {
        btn.classList.add("active");
      }
    });

    if (dayExercises[day]) {
      container.innerHTML = dayExercises[day];
    }

    // Bind checkboxes listeners and recalculate progress bar
    initWorkoutChecklist();
  };

  window.loadDietBlueprint = function (goal) {
    const container = document.getElementById("dietBlueprintContainer");
    if (!container) return;

    let blueprintHtml = "";
    if (goal === "gain") {
      blueprintHtml = `
        <div class="diet-meal-card">
          <h5>Meal 1: Breakfast</h5>
          <p>4 Whole Eggs scrambled in olive oil, 2 slices Whole Wheat Toast, 1 large Banana, and 1 glass Orange Juice (~650 Kcal)</p>
        </div>
        <div class="diet-meal-card">
          <h5>Meal 2: Lunch</h5>
          <p>Grilled Chicken breast (200g), Brown Rice (1.5 cups), Steamed Broccoli with lemon dressing (~750 Kcal)</p>
        </div>
        <div class="diet-meal-card">
          <h5>Meal 3: Pre-Workout Fuel</h5>
          <p>Oatmeal (1 cup) cooked in milk with scoop of whey protein, 1 tbsp honey, and 2 tbsp peanut butter (~500 Kcal)</p>
        </div>
        <div class="diet-meal-card">
          <h5>Meal 4: Dinner</h5>
          <p>Salmon fillet or Lean Beef (150g), Baked Sweet Potato (200g), Mixed green salad with vinaigrette (~600 Kcal)</p>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:10px; font-weight:700;">Goal Total: ~2,500 kcal | 150g Protein | 300g Carbs | 75g Fat</div>
      `;
    } else if (goal === "loss") {
      blueprintHtml = `
        <div class="diet-meal-card">
          <h5>Meal 1: Breakfast</h5>
          <p>3 Egg Whites & 1 Whole Egg scramble with spinach, 1 slice Rye Toast, Black Coffee (~350 Kcal)</p>
        </div>
        <div class="diet-meal-card">
          <h5>Meal 2: Lunch</h5>
          <p>Grilled Chicken breast or Tofu (150g), Large garden salad with lettuce, cucumber, tomatoes, olive oil (1 tsp) (~450 Kcal)</p>
        </div>
        <div class="diet-meal-card">
          <h5>Meal 3: Pre-Workout Fuel</h5>
          <p>1 scoop Whey Protein in water, 1 small Apple or handful of berries (~200 Kcal)</p>
        </div>
        <div class="diet-meal-card">
          <h5>Meal 4: Dinner</h5>
          <p>Baked White Fish (Cod/Tilapia 200g), Stir-fried Asparagus, cauliflower rice with spices (~400 Kcal)</p>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:10px; font-weight:700;">Goal Total: ~1,400 kcal | 130g Protein | 100g Carbs | 40g Fat</div>
      `;
    } else if (goal === "maintain") {
      blueprintHtml = `
        <div class="diet-meal-card">
          <h5>Meal 1: Breakfast</h5>
          <p>Oatmeal (1/2 cup) cooked in water, 2 boiled eggs, and handful of almonds (~450 Kcal)</p>
        </div>
        <div class="diet-meal-card">
          <h5>Meal 2: Lunch</h5>
          <p>Chicken breast or Paneer (150g), Quinoa (1 cup), Mixed sautéed bell peppers and zucchini (~600 Kcal)</p>
        </div>
        <div class="diet-meal-card">
          <h5>Meal 3: Pre-Workout Fuel</h5>
          <p>Low-fat Greek Yogurt (1 cup) with honey (1 tsp) and mixed blueberries (~250 Kcal)</p>
        </div>
        <div class="diet-meal-card">
          <h5>Meal 4: Dinner</h5>
          <p>Grilled Paneer or Lean Steak (150g), Baked Russet Potato with skin, steamed green beans (~550 Kcal)</p>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:10px; font-weight:700;">Goal Total: ~1,850 kcal | 120g Protein | 180g Carbs | 60g Fat</div>
      `;
    }

    container.innerHTML = blueprintHtml;
  };

  window.addWeightLog = function () {
    const weightInput = document.getElementById("tracker-weight-input");
    const weightVal = parseFloat(weightInput.value);

    if (isNaN(weightVal) || weightVal <= 10 || weightVal > 500) {
      alert("Please enter a valid weight between 10kg and 500kg.");
      return;
    }

    const logEntry = {
      date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      weight: weightVal.toFixed(1) + " kg"
    };

    if (!window.weightLogs) {
      window.weightLogs = [];
    }

    window.weightLogs.unshift(logEntry); // Add to beginning
    weightInput.value = ""; // Clear input

    // Render Table
    renderWeightLogTable();

    // Sync weight log in Logs tab
    const logBmi = document.getElementById("logBmi");
    if (logBmi) {
      const activeBmi = window.userBMI ? `${window.userBMI} (${window.userBMIStatus})` : "Not Calculated";
      logBmi.innerHTML = `${activeBmi}<br><span style="font-size: 11px; color:var(--text-muted); font-weight:500;">Last Weight Logged: ${logEntry.weight}</span>`;
    }
    syncUserProgress();
    markProgressUnsaved();
  };

  function renderWeightLogTable() {
    const tableBody = document.getElementById("weightLogTableBody");
    if (!tableBody) return;

    if (!window.weightLogs || window.weightLogs.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-muted);">No weight entries logged yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = window.weightLogs.map(entry => `
      <tr>
        <td>${entry.date}</td>
        <td style="color: var(--primary); font-weight:700;">${entry.weight}</td>
      </tr>
    `).join("");
  }

  window.sendTrainerEmail = function () {
    const query = document.getElementById("trainerQueryText").value.trim();
    if (!query) {
      alert("Please type a support message or question for Coach Sameer.");
      return;
    }

    if (!window.trainerQueries) {
      window.trainerQueries = [];
    }
    window.trainerQueries.push({
      date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      query: query
    });

    document.getElementById("trainerQueryText").value = "";
    syncUserProgress();
    markProgressUnsaved();

    const userName = window.registeredName || "FitLife Athlete";
    const userEmail = window.registeredEmail || "Not Provided";
    const userPlan = window.registeredPlan || "Standard";

    const subject = encodeURIComponent(`FitLife Trainer Query - ${userPlan} Plan`);
    const body = encodeURIComponent(
      `Hi Coach Sameer,\n\nI have a question regarding my fitness plan.\n\n` +
      `User Profile:\n` +
      `Name: ${userName}\n` +
      `Email: ${userEmail}\n` +
      `Plan Tier: ${userPlan}\n\n` +
      `My Query:\n${query}\n\n` +
      `Best regards,\n${userName}`
    );

    const emailUrl = `mailto:sameerkhan637477@gmail.com?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
    alert("Your support query has been logged! Redirecting to mail app...");
  };

  // CALORIE BURNED CALCULATOR
  const calculateBurnBtn = document.getElementById("calculateBurnBtn");
  if (calculateBurnBtn) {
    calculateBurnBtn.addEventListener("click", () => {
      const type = document.getElementById("calc-type").value;
      const duration = parseInt(document.getElementById("calc-duration").value);
      const burnResult = document.getElementById("burnResult");
      const caloriesBurnedText = document.getElementById("caloriesBurnedText");

      if (isNaN(duration) || duration <= 0) {
        alert("Please enter a valid workout duration.");
        return;
      }

      // MET Rates per min (approximate averages)
      let kcalPerMin = 0;
      switch (type) {
        case "cardio-run":
          kcalPerMin = 11.5; // Running ~8 km/h
          break;
        case "cardio-cycle":
          kcalPerMin = 8.5; // Cycling moderate pace
          break;
        case "strength":
          kcalPerMin = 6.0; // Vigorous lifting
          break;
        case "yoga":
          kcalPerMin = 4.0; // Vinyasa / power yoga
          break;
        case "hiit":
          kcalPerMin = 13.0; // High intensity interval
          break;
        default:
          kcalPerMin = 5.0;
      }

      const totalBurned = Math.round(kcalPerMin * duration);
      caloriesBurnedText.textContent = totalBurned;
      burnResult.style.display = "block";
    });
  }

  // DASHBOARD LOGS UPDATING
  function updateDashboardLogs(name, email, plan) {
    const logBmi = document.getElementById("logBmi");
    const logWater = document.getElementById("logWater");
    const logExercises = document.getElementById("logExercises");
    const logPaymentBox = document.getElementById("logPaymentBox");
    const logPayment = document.getElementById("logPayment");

    // BMI
    if (window.userBMI) {
      logBmi.textContent = `${window.userBMI} (${window.userBMIStatus})`;
    } else {
      logBmi.textContent = "Not Calculated Yet (Click 'Tools' to calculate)";
    }

    // Water
    if (window.userWaterCount !== undefined) {
      const pct = Math.min((window.userWaterCount / window.userWaterTarget) * 100, 100);
      logWater.textContent = `${window.userWaterCount} / ${window.userWaterTarget} Cups (${pct.toFixed(0)}%)`;
    } else {
      logWater.textContent = "0 / 8 Cups (0%)";
    }

    // Exercises
    const totalOverall = plan === "Free" ? 4 : 33;
    const completedOverall = window.completedExercisesList ? window.completedExercisesList.length : 0;
    const pctOverall = Math.round((completedOverall / totalOverall) * 100);
    logExercises.textContent = `${completedOverall} of ${totalOverall} Completed (${pctOverall}%)`;

    // Payment Logs Sync
    if (logPaymentBox && logPayment) {
      if (plan === "Free") {
        logPaymentBox.style.display = "none";
      } else {
        logPaymentBox.style.display = "block";
        const amt = plan === "Standard" ? "₹499" : "₹899";
        const refId = window.txnRefId || "N/A";
        logPayment.innerHTML = `Verified (${amt})<br><span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">UTR: ${refId}</span>`;
      }
    }
  }

  // LOGOUT OR GO BACK TO HOMEPAGE FROM DASHBOARD
  window.logoutDashboard = function() {
    if (confirm("Are you sure you want to exit your dashboard? Your active workout progress will be reset.")) {
      dashboard.style.display = "none";
      
      // Clear form
      userForm.reset();
      
      // Reset session global state variables
      window.registeredName = null;
      window.registeredEmail = null;
      window.registeredPlan = null;
      window.registrationDate = null;
      window.txnRefId = null;
      window.userWaterCount = 0;
      window.userWaterTarget = 8;
      window.weightLogs = [];
      window.trainerQueries = [];
      waterCount = 0;
      
      // Reset checkboxes
      const checkboxes = document.querySelectorAll(".workout-chk");
      checkboxes.forEach(chk => {
        chk.checked = false;
        const item = chk.closest(".exercise-item");
        if (item) item.classList.remove("completed");
      });

      // Show landing sections
      document.querySelectorAll(".landing-section").forEach(sec => {
        sec.style.display = "block";
      });
      formSection.style.display = "flex";
      
      // Scroll to Home
      showSection("home");
    }
  };

  // ADMIN PORTAL FUNCTIONS DELETED: Moved to admin.html
});



