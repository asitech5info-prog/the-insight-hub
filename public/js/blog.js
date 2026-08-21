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

// Markdown parser
function parseMarkdown(text) {
  let html = text
    // Escape HTML to prevent XSS
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Heading ## 
    .replace(/^## (.+)$/gm, '<h3 style="color:#a78bfa;font-size:1.4rem;margin:1.5rem 0 1rem;">$1</h3>')
    // Heading #
    .replace(/^# (.+)$/gm, '<h2 style="color:#ddd6fe;font-size:1.8rem;margin:2rem 0 1rem;font-weight:700;">$1</h2>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:0.5rem;color:#d1d5db;">$1</li>')
    .replace(/^\\* (.+)$/gm, '<li style="margin-bottom:0.5rem;color:#d1d5db;">$1</li>')
    // Numbered list
    .replace(/^\\d+\\. (.+)$/gm, '<li style="margin-bottom:0.5rem;color:#d1d5db;">$1</li>')
    // Line breaks
    .replace(/\\n/g, '<br>');
  
  // Wrap consecutive li elements in ul
  html = html.replace(/(<li[^>]*>.*?<\/li>)(<br>)*\\s*(<li[^>]*>.*?<\/li>)/gs, '$1$3');
  html = html.replace(/(<li[^>]*>.*?<\/li>)+/gs, '<ul style="margin:1rem 0 1rem 1.5rem;list-style-type:disc;">$&</ul>');
  
  return html;
}

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
      // Split by double newlines for paragraphs
      const paragraphs = part.split(/\n\s*\n/).filter(p => p.trim());
      paragraphs.forEach(p => {
        const parsed = parseMarkdown(p.trim());
        // If it's not already a heading or list, wrap in p
        if (!parsed.startsWith('<h') && !parsed.startsWith('<ul')) {
          contentHtml += '<p>' + parsed + '</p>';
        } else {
          contentHtml += parsed;
        }
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
