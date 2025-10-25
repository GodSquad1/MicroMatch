// Test File - Not utilized
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBb23ZQezJjCIEAXyz5Ilms-USNP46y8_w",
  authDomain: "lghacks2.firebaseapp.com",
  projectId: "lghacks2",
  storageBucket: "lghacks2.firebasestorage.app",
  messagingSenderId: "332866350955",
  appId: "1:332866350955:web:94b4b652da6f11230ce62e",
  measurementId: "G-23YP64MPTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Tab Switching Logic ---
const tabSignIn = document.getElementById("tab-signin");
const tabSignUp = document.getElementById("tab-signup");
const formSignIn = document.getElementById("signin-form");
const formSignUp = document.getElementById("signup-form");

tabSignIn.addEventListener("click", () => {
  tabSignIn.classList.add("border-blue-600", "text-blue-600");
  tabSignIn.classList.remove("border-transparent", "text-gray-500");

  tabSignUp.classList.remove("border-blue-600", "text-blue-600");
  tabSignUp.classList.add("border-transparent", "text-gray-500");

  formSignIn.classList.remove("hidden");
  formSignUp.classList.add("hidden");
});

tabSignUp.addEventListener("click", () => {
  tabSignUp.classList.add("border-blue-600", "text-blue-600");
  tabSignUp.classList.remove("border-transparent", "text-gray-500");

  tabSignIn.classList.remove("border-blue-600", "text-blue-600");
  tabSignIn.classList.add("border-transparent", "text-gray-500");

  formSignUp.classList.remove("hidden");
  formSignIn.classList.add("hidden");
});


// --- DOM References ---

const authSection = document.getElementById("authSection");
const matchSection = document.getElementById("matchSection");
const resultEl = document.getElementById("result");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const matchForm = document.getElementById("matchForm");

// --- Compatibility Function ---
function compatibilityScore(borrower, lender, weights, trust = 0, gamma = 0.1) {
  const weightedB = borrower.map((b, i) => b * weights[i]);
  const weightedL = lender.map((l, i) => l * weights[i]);
  
  const dot = weightedB.reduce((sum, b, i) => sum + b * weightedL[i], 0);
  const normB = Math.sqrt(weightedB.reduce((s, b) => s + b * b, 0));
  const normL = Math.sqrt(weightedL.reduce((s, l) => s + l * l, 0));
  
  const cs = dot / (normB * normL);
  return (1 - gamma) * cs + gamma * trust;
}

// --- Auth Logic ---
signupBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created successfully!");
  } catch (error) {
    alert("Sign up error: " + error.message);
  }
});

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in successfully!");
  } catch (error) {
    alert(" Login error: " + error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  alert("Logged out!");
});

// --- Auth State Listener ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.classList.add("hidden");
    matchSection.classList.remove("hidden");
  } else {
    authSection.classList.remove("hidden");
    matchSection.classList.add("hidden");
  }
});

// --- Match Form Logic ---
matchForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const borrower = document.getElementById("borrowerInput").value.split(",").map(Number);
  const lender = document.getElementById("lenderInput").value.split(",").map(Number);
  const weights = document.getElementById("weightsInput").value
    ? document.getElementById("weightsInput").value.split(",").map(Number)
    : Array(borrower.length).fill(1 / borrower.length);
  const trust = parseFloat(document.getElementById("trustInput").value);

  const score = compatibilityScore(borrower, lender, weights, trust);
  const percentage = (score * 100).toFixed(2);

  resultEl.textContent = `Compatibility Score: ${percentage}%`;

  const user = auth.currentUser;
  if (user) {
    try {
      await addDoc(collection(db, "matches"), {
        userId: user.uid,
        borrowerVector: borrower,
        lenderVector: lender,
        weights,
        trust,
        score,
        timestamp: new Date().toISOString()
      });
      console.log(" Match saved to Firebase!");
    } catch (err) {
      console.error(" Error saving match:", err);
    }
  }
});
