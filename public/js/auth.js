
const AUTH_API = "http://localhost:3001";
const USER_KEY = "spaceSkribbleUser";

const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const message = document.getElementById("auth-message");

// Send a request to the authentication server

async function sendRequest(endpoint, data) {
  const response = await fetch(`${AUTH_API}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const raw = await response.text();

  console.log("HTTP status:", response.status);
  console.log("Raw server response:", raw);

  let result;

  try {
    result = JSON.parse(raw);
  } catch {
    throw new Error("Server did not return valid JSON.");
  }

  if (!response.ok) {
    throw new Error(result.message || "Request failed.");
  }

  return result;
}


// Save the authenticated user and token
function saveUser(user, token) {
  if (!user || typeof user !== "object") {
    throw new Error("The server did not return valid user information.");
  }

  if (!token || typeof token !== "string") {
    throw new Error("The server did not return an authentication token.");
  }

  const savedUser = {
    ...user,
    token
  };

  localStorage.setItem(USER_KEY, JSON.stringify(savedUser));

  return savedUser;
}

// Read the currently logged-in user
function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);

    if (!raw) return null;

    const user = JSON.parse(raw);

    if (!user || typeof user !== "object" || !user.token) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Could not read saved user:", error);
    return null;
  }
}

// REGISTER
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (message) message.textContent = "Creating account...";

    try {
      const result = await sendRequest("/register", {
        name: document.getElementById("reg-name")?.value.trim(),
        email: document.getElementById("reg-email")?.value.trim(),
        password: document.getElementById("reg-password")?.value,
        question: document.getElementById("security-question")?.value,
        answer: document.getElementById("security-answer")?.value.trim()
      });

      if (message) {
        message.textContent =
          (result.message || "Account created!") +
          " Redirecting to login...";
      }

      registerForm.reset();

      setTimeout(() => {
        window.location.href = "./login.html";
      }, 1200);
    } catch (error) {
      if (message) {
        message.textContent = error.message || "Registration failed.";
      }
    }
  });
}


 // LOGIN
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (message) message.textContent = "Logging in...";

    try {
      const result = await sendRequest("/login", {
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value
      });

      console.log("Login response:", result);

      // The provided auto-server.js returns these exact fields.
      if (!result || !result.token || !result.user) {
        throw new Error(
          "Login response is missing token or user. Check the server response in Console."
        );
      }

      const savedUser = {
        ...result.user,
        token: result.token
      };

      localStorage.setItem(
        "spaceSkribbleUser",
        JSON.stringify(savedUser)
      );

      // Verify that the user was saved
      const storedUser = JSON.parse(
        localStorage.getItem("spaceSkribbleUser")
      );

      if (!storedUser?.token) {
        throw new Error("Could not save the login session.");
      }

      if (message) {
        message.textContent =
          `Welcome, ${savedUser.name || savedUser.email}!`;
      }

      updateAccountMenu();

      setTimeout(() => {
        window.location.href = "./index.html";
      }, 500);

    } catch (error) {
      console.error("Login error:", error);

      if (message) {
        message.textContent = error.message || "Login failed.";
      }
    }
  });
}

// HOME ACCOUNT NAVIGATION
function updateAccountMenu() {
  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("spaceSkribbleUser") || "null"
    );
  } catch {
    localStorage.removeItem("spaceSkribbleUser");
  }

  const profile = document.getElementById("profile-link");
  const login = document.getElementById("login-link");
  const register = document.getElementById("register-link");

  const loggedIn = Boolean(user?.token);

  if (profile) {
    profile.hidden = !loggedIn;

    if (loggedIn) {
      profile.title = `My Profile — ${user.name || user.email || ""}`;
    }
  }

  if (login) login.hidden = loggedIn;
  if (register) register.hidden = loggedIn;
}

updateAccountMenu();
