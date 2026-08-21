let adminToken = localStorage.getItem('adminToken');
let allBlogs = [];
let allReviews = [];
let allMessages = [];

if (adminToken === 'admin-secret-token') {
  showPanel();
}

function login() {
  const pass = document.getElementById('adminPass').value;
  fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pass })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('adminToken', data.token);
      showPanel();
    } else {
      document.getElementById('loginError').textContent = 'Wrong password!';
    }
  });
}

function logout() {
  localStorage.removeItem('adminToken');
  location.reload();
}

function showPanel() {
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('adminBox').classList.remove('hidden');
  loadStats();
  loadBlogsTable();
  loadReviewsTable();
  loadMessagesTable();
}

function showTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('content-' + tab).classList.add('active');

  if (tab === 'blogs') loadBlogsTable();
  if (tab === 'reviews') loadReviewsTable();
  if (tab === 'messages') loadMessagesTable();
}

async function loadStats() {
  const res = await fetch('/api/admin/stats');
  const stats = await res.json();
  document.getElementById('statBlogs').textContent = stats.totalBlogs;
  document.getElementById('statReviews').textContent = stats.totalReviews;
  document.getElementById('statMessages').textContent = stats.totalMessages;
  document.getElementById('statUnread').textContent = stats.unreadMessages;
}

async function loadBlogsTable() {
  const res = await fetch('/api/blogs');
  allBlogs = await res.json();
  const tbody = document.getElementById('blogsTableBody');

  if (allBlogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No blogs yet. Create your first blog!</td></tr>';
    return;
  }

  tbody.innerHTML = allBlogs.map(b => `
    <tr>
      <td>${b.title}</td>
      <td><span class="blog-card-tag">${b.category}</span></td>
      <td>${b.views || 0}</td>
      <td>${b.date}</td>
      <td>
        <div class="table-actions">
          <button class="table-btn view" onclick="window.open('/blog?id=${b.id}','_blank')">View</button>
          <button class="table-btn delete" onclick="deleteBlog('${b.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function loadReviewsTable() {
  const res = await fetch('/api/admin/reviews');
  allReviews = await res.json();
  const tbody = document.getElementById('reviewsTableBody');

  if (allReviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No reviews yet.</td></tr>';
    return;
  }

  tbody.innerHTML = allReviews.map(r => {
    const blog = allBlogs.find(b => b.id === r.blogId);
    return `
    <tr>
      <td>${r.name}</td>
      <td>${blog ? blog.title.substring(0, 30) + '...' : 'Unknown'}</td>
      <td>${'⭐'.repeat(r.rating)}</td>
      <td>${r.comment.substring(0, 50)}${r.comment.length > 50 ? '...' : ''}</td>
      <td>${r.date}</td>
      <td>
        <div class="table-actions">
          <button class="table-btn delete" onclick="deleteReview('${r.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `}).join('');
}

async function loadMessagesTable() {
  const res = await fetch('/api/admin/messages');
  allMessages = await res.json();
  const tbody = document.getElementById('messagesTableBody');

  if (allMessages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No messages yet.</td></tr>';
    return;
  }

  tbody.innerHTML = allMessages.map(m => `
    <tr style="${m.read ? '' : 'background:rgba(124,58,237,0.05)'}">
      <td><strong>${m.name}</strong></td>
      <td>${m.email}</td>
      <td>${m.subject}</td>
      <td>${m.message.substring(0, 40)}${m.message.length > 40 ? '...' : ''}</td>
      <td>${m.date}</td>
      <td>${m.read ? '<span style="color:#10b981">✓ Read</span>' : '<span style="color:#f59e0b">● New</span>'}</td>
      <td>
        <div class="table-actions">
          ${!m.read ? `<button class="table-btn view" onclick="markRead('${m.id}')">Mark Read</button>` : ''}
          <button class="table-btn delete" onclick="deleteMessage('${m.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function deleteBlog(id) {
  if (!confirm('Delete this blog permanently?')) return;
  fetch('/api/admin/blog/' + id, { method: 'DELETE' })
    .then(() => { loadBlogsTable(); loadStats(); });
}

function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  fetch('/api/admin/review/' + id, { method: 'DELETE' })
    .then(() => { loadReviewsTable(); loadStats(); });
}

function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  fetch('/api/admin/message/' + id, { method: 'DELETE' })
    .then(() => { loadMessagesTable(); loadStats(); });
}

function markRead(id) {
  fetch('/api/admin/message/' + id + '/read', { method: 'PATCH' })
    .then(() => { loadMessagesTable(); loadStats(); });
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Create blog form with base64 images
document.getElementById('blogForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = e.target.title.value;
  const category = e.target.category.value;
  const content = e.target.content.value;

  // Get title image
  const titleImageFile = e.target.titleImage.files[0];
  const imagesFiles = e.target.images.files;

  if (!titleImageFile) {
    alert('Please select a title image');
    return;
  }

  // Show loading
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = '⏳ Uploading...';
  btn.disabled = true;

  try {
    // Convert title image to base64
    const titleImage = await fileToBase64(titleImageFile);

    // Convert content images to base64
    const images = [];
    for (let i = 0; i < Math.min(imagesFiles.length, 5); i++) {
      const base64 = await fileToBase64(imagesFiles[i]);
      images.push(base64);
    }

    // Send to server
    const res = await fetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, content, titleImage, images })
    });

    const data = await res.json();
    if (data.success) {
      alert('✅ Blog published successfully!');
      e.target.reset();
      showTab('blogs');
      loadBlogsTable();
      loadStats();
    } else {
      alert('❌ Error: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    alert('❌ Error uploading: ' + err.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

// Enter key on password
document.getElementById('adminPass').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});