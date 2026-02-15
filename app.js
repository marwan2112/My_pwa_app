// app.js
const loginScreen = document.getElementById('login-screen');
const contentScreen = document.getElementById('content-screen');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const userNameDisplay = document.getElementById('user-name');

const politicalText = `Recent decades have witnessed a fundamental transformation in the concept of national sovereignty, driven by the growing power of international institutions and multilateral agreements...`;
const economicText = `The economic doctrine of "decoupling" – the strategic disentanglement of national economies, particularly between major powers like the United States and China – has moved from theoretical debate to active policy consideration...`;

// Check if user is already logged in
const storedUser = localStorage.getItem('username');
if (storedUser) {
  showContent(storedUser);
}

// Login button
loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (username) {
    localStorage.setItem('username', username);
    showContent(username);
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('username');
  loginScreen.style.display = 'block';
  contentScreen.style.display = 'none';
  usernameInput.value = '';
});

function showContent(username) {
  userNameDisplay.textContent = username;
  politicalText && (document.getElementById('political-text').textContent = politicalText);
  economicText && (document.getElementById('economic-text').textContent = economicText);
  loginScreen.style.display = 'none';
  contentScreen.style.display = 'block';
}
