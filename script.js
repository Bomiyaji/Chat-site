const socket = io();
let token = localStorage.getItem('token');
let user = null;
let darkMode = false;

// Auth
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const res = await fetch('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  if (res.ok) alert('Registered! Now login.');
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  const data = await res.json();
  if (data.success) {
    token = data.token;
    user = data.user;
    localStorage.setItem('token', token);
    document.getElementById('auth-container').classList.add('d-none');
    document.getElementById('chat-container').classList.remove('d-none');
    document.getElementById('user-name').textContent = user.username;
    socket.auth = { token };
    socket.connect();
    socket.emit('join');
    loadMessages();
  } else alert(data.message);
});

// Chat
socket.on('load-messages', (messages) => {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '';
  messages.forEach(addMessage);
});

socket.on('message', (msg) => {
  addMessage(msg);
  if (Notification.permission === 'granted') new Notification('New Message', { body: msg.text });
});

socket.on('typing', (username) => {
  document.getElementById('typing-indicator').textContent = `${username} is typing...`;
  document.getElementById('typing-indicator').classList.remove('d-none');
});

socket.on('stop-typing', () => {
  document.getElementById('typing-indicator').classList.add('d-none');
});

document.getElementById('message-input').addEventListener('input', () => {
  socket.emit('typing');
  setTimeout(() => socket.emit('stop-typing'), 1000);
});

document.getElementById('send-btn').addEventListener('click', () => {
  const text = document.getElementById('message-input').value;
  if (text) {
    socket.emit('message', { text });
    document.getElementById('message-input').value = '';
  }
});

document.getElementById('file-btn').addEventListener('click', () => document.getElementById('file-input').click());
document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  // Upload logic (simplified)
  socket.emit('message', { text: 'File shared', file: file.name });
});

document.getElementById('upload-avatar-btn').addEventListener('click', async () => {
  const formData = new FormData();
  formData.append('avatar', document.getElementById('avatar-upload').files[0]);
  const res = await fetch('/upload-avatar', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
  const data = await res.json();
  if (data.success) document.getElementById('user-avatar').src = data.avatar;
});

document.getElementById('dark-mode-toggle').addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.classList.toggle('dark-mode');
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  location.reload();
});

function addMessage(msg) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `message ${msg.user === user.username ? 'self' : 'other'}`;
  div.innerHTML = `<strong>${msg.user}:</strong> ${msg.text} <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>`;
  if (msg.file) div.innerHTML += `<br><img src="/uploads/${msg.file}" alt="Shared file">`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function loadMessages() {
  const res = await fetch('/messages');
  const messages = await res.json();
  messages.forEach(addMessage);
          }
