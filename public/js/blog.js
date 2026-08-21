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

// ===== SHARE FUNCTIONS =====
function getShareUrl() {
  return encodeURIComponent(window.location.href);
}
function getShareTitle() {
  return encodeURIComponent(document.title);
}
function shareTwitter() {
  window.open('https://twitter.com/intent/tweet?url=' + getShareUrl() + '&text=' + getShareTitle(), '_blank', 'width=600,height=400');
}
function shareFacebook() {
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + getShareUrl(), '_blank', 'width=600,height=400');
}
function shareWhatsApp() {
  window.open('https://wa.me/?text=' + getShareTitle() + '%20' + getShareUrl(), '_blank');
}
function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.querySelector('.share-btn.copylink');
    const original = btn.innerHTML;
    btn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
    setTimeout(() => { btn.innerHTML = original; }, 1500);
  });
}

// ===== STAR RATING =====
let selectedRating = 0;
function initStarRating() {
  const stars = document.querySelectorAll('#starRating .star');
  const ratingInput = document.getElementById('revRating');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.value);
      ratingInput.value = selectedRating;
      updateStars();
    });
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.value);
      stars.forEach((s, i) => {
        s.classList.toggle('active', i < val);
      });
    });
  });

  document.getElementById('starRating').addEventListener('mouseleave', updateStars);
}

function updateStars() {
  const stars = document.querySelectorAll('#starRating .star');
  stars.forEach((s, i) => {
    s.classList.toggle('active', i < selectedRating);
  });
}

// ===== CHARACTER COUNTER =====
function initCharCounter() {
  const textarea = document.getElementById('revComment');
  const counter = document.getElementById('charCounter');
  textarea.addEventListener('input', () => {
    counter.textContent = textarea.value.length + ' / 1000 characters';
    if (textarea.value.length >= 1000) {
      counter.style.color = '#ef4444';
    } else {
      counter.style.color = 'var(--text-muted)';
    }
  });
}

// ===== MARKDOWN PARSER =====
// Supports: # Heading, ## Sub Heading, **bold**, *italic*, - bullet, * bullet, 1. numbered
function parseMarkdown(text) {
  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings (must be at start of line)
  html = html.replace(/^# (.+)$/gm, '<h2 style="color:#ddd6fe;font-size:1.8rem;margin:2rem 0 1rem;font-weight:700;">$1</h2>');
  html = html.replace(/^## (.+)$/gm, '<h3 style="color:#a78bfa;font-size:1.4rem;margin:1.5rem 0 1rem;">$1</h3>');

  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *text* (but not bullet points)
  // We handle this carefully - only match *text* that is NOT at start of line followed by space
  html = html.replace(/(?<!^\s*)\*(?!\s)(.+?)(?<!\s)\*(?!\s)/g, '<em>$1</em>');

  // Bullet points: - item  or  * item
  html = html.replace(/^- (.+)$/gm, '<li style="margin-bottom:0.5rem;color:#d1d5db;">$1</li>');
  html = html.replace(/^\* (.+)$/gm, '<li style="margin-bottom:0.5rem;color:#d1d5db;">$1</li>');

  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="margin-bottom:0.5rem;color:#d1d5db;">$1</li>');

  // Wrap consecutive li elements in ul
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, function(match) {
    return '<ul style="margin:1rem 0 1rem 1.5rem;list-style-type:disc;">' + match.replace(/\n/g, '') + '</ul>';
  });

  // Line breaks for remaining text
  html = html.replace(/\n/g, '<br>');

  return html;
}

async function loadBlog() {
  if (!blogId) return location.href = '/';

  // Track view (fire and forget)
  fetch('/api/blog/view/' + blogId, { method: 'POST' }).catch(()=>{});

  try {
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
          const parsed = parseMarkdown(p.trim());
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

    // Show reviews section after blog loads
    document.getElementById('reviewsSection').style.display = '';

    loadReviews();
  } catch (err) {
    document.getElementById('blogContainer').innerHTML = `
      <div class="blog-loading">
        <p style="color:#ef4444">❌ Failed to load article. <a href="/" style="color:var(--accent-cyan)">Go back home</a></p>
      </div>
    `;
  }
}

async function loadReviews() {
  try {
    const res = await fetch('/api/reviews/' + blogId);
    const reviews = await res.json();
    const container = document.getElementById('reviewsList');

    if (reviews.length === 0) {
      container.innerHTML = `
        <div class="reviews-empty">
          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <p>No reviews yet. Be the first to review!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <strong>${r.name}</strong>
          <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
        </div>
        <p>${r.comment}</p>
        <small>${r.date}</small>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('reviewsList').innerHTML = '<p style="color:var(--text-muted);text-align:center">Failed to load reviews.</p>';
  }
}

// ===== REVIEW FORM SUBMIT =====
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const rating = parseInt(document.getElementById('revRating').value);
  if (rating < 1 || rating > 5) {
    alert('Please select a star rating');
    return;
  }

  const review = {
    blogId,
    name: document.getElementById('revName').value.trim(),
    email: document.getElementById('revEmail').value.trim(),
    rating: rating,
    comment: document.getElementById('revComment').value.trim()
  };

  const btn = e.target.querySelector('.post-review-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Posting...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });

    if (res.ok) {
      document.getElementById('reviewForm').reset();
      selectedRating = 0;
      updateStars();
      document.getElementById('charCounter').textContent = '0 / 1000 characters';
      loadReviews();
    } else {
      alert('Failed to post review. Please try again.');
    }
  } catch (err) {
    alert('Network error. Please try again.');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// Init
initStarRating();
initCharCounter();
loadBlog();
