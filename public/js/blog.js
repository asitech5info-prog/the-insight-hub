const params = new URLSearchParams(location.search);
const blogId = params.get('id');

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
  document.getElementById('menuOverlay').classList.toggle('show');
}

function doSearch() {
  const q = document.getElementById('searchInput').value;
  if (q.trim()) location.href = '/search?q=' + encodeURIComponent(q);
}
document.getElementById('searchInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });

async function loadBlog() {
  if (!blogId) return location.href = '/';

  // Track view
  fetch('/api/blog/view/' + blogId, { method: 'POST' }).catch(()=>{});

  const res = await fetch('/api/blog/' + blogId);
  if (!res.ok) return location.href = '/';

  const blog = await res.json();

  let contentHtml = '';
  const parts = blog.content.split(/(\[IMAGE:\d+\])/);

  parts.forEach(part => {
    const match = part.match(/\[IMAGE:(\d+)\]/);
    if (match) {
      const idx = parseInt(match[1]);
      if (blog.images && blog.images[idx]) {
        contentHtml += '<img src="' + blog.images[idx] + '" class="blog-inline-img" alt="Image ' + (idx + 1) + '">';
      }
    } else if (part.trim()) {
      const paragraphs = part.split(/\n\s*\n/).filter(p => p.trim());
      paragraphs.forEach(p => {
        contentHtml += '<p>' + p.trim() + '</p>';
      });
    }
  });

  document.getElementById('blogContainer').innerHTML = `
    <img src="${blog.titleImage || '/logo.png'}" class="blog-title-img" alt="${blog.title}">
    <h1>${blog.title}</h1>
    <div class="blog-page-meta">
      <span>📅 ${blog.date}</span>
      <span>👤 ${blog.author}</span>
      <span>👁️ ${blog.views || 0} views</span>
    </div>
    <div class="blog-content">${contentHtml}</div>
  `;

  loadReviews();
}

async function loadReviews() {
  const res = await fetch('/api/reviews/' + blogId);
  const reviews = await res.json();
  const container = document.getElementById('reviewsList');

  if (reviews.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem">No reviews yet. Be the first to review!</p>';
    return;
  }

  container.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-header">
        <strong>${r.name}</strong>
        <span class="review-stars">${'⭐'.repeat(r.rating)}</span>
      </div>
      <p>${r.comment}</p>
      <small>${r.date}</small>
    </div>
  `).join('');
}

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const review = {
    blogId,
    name: document.getElementById('revName').value,
    rating: document.getElementById('revRating').value,
    comment: document.getElementById('revComment').value
  };

  await fetch('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review)
  });

  document.getElementById('reviewForm').reset();
  loadReviews();
});

loadBlog();