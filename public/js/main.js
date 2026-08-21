let allBlogs = [];

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
  document.getElementById('menuOverlay').classList.toggle('show');
}

function filterFromMenu(cat) {
  toggleMenu();
  setTimeout(() => filterCat(cat), 300);
}

async function loadBlogs() {
  const res = await fetch('/api/blogs');
  allBlogs = await res.json();

  // Check URL for category filter
  const params = new URLSearchParams(location.search);
  const cat = params.get('cat');
  if (cat) {
    renderBlogs(allBlogs.filter(b => b.category.toLowerCase() === cat.toLowerCase()));
    document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
  } else {
    renderBlogs(allBlogs);
  }
}

function renderBlogs(blogs) {
  const grid = document.getElementById('blogGrid');
  if (blogs.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>No blogs found.</p></div>';
    return;
  }

  grid.innerHTML = blogs.map(blog => `
    <div class="blog-card" onclick="openBlog('${blog.id}')">
      <img src="${blog.titleImage || '/logo.png'}" class="blog-card-img" alt="${blog.title}">
      <div class="blog-card-body">
        <span class="blog-card-tag">${blog.category}</span>
        <h3>${blog.title}</h3>
        <div class="blog-card-meta">
          <span>📅 ${blog.date}</span>
          <span>👁️ ${blog.views || 0}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function openBlog(id) {
  location.href = '/blog?id=' + id;
}

function filterCat(cat) {
  document.querySelectorAll('.cat-card').forEach(btn => btn.classList.remove('active'));
  event.currentTarget.classList.add('active');

  if (cat === 'all') {
    renderBlogs(allBlogs);
  } else {
    renderBlogs(allBlogs.filter(b => b.category.toLowerCase() === cat));
  }
}

function doSearch() {
  const q = document.getElementById('searchInput').value;
  if (q.trim()) {
    location.href = '/search?q=' + encodeURIComponent(q);
  }
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') doSearch();
});

loadBlogs();