/* ============================================
   THE INSIGHT HUB - Blog Page JavaScript
   ============================================ */

// ===== THEME =====
(function initTheme() {
    const toggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    const saved = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', saved);
    if(toggle) toggle.textContent = saved === 'dark' ? '🌙' : '☀️';
    if(toggle) {
        toggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            toggle.textContent = next === 'dark' ? '🌙' : '☀️';
        });
    }
    document.getElementById('year').textContent = new Date().getFullYear();
})();

function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
    document.getElementById('menuOverlay').classList.toggle('show');
}

function getBlogId() {
    return new URLSearchParams(window.location.search).get('id');
}

function parseMarkdown(text) {
    if(!text) return '';
    let html = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>');
    
    html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/g, '<ul>$1</ul>\n');
    html = html.replace(/(<li>.*<\/li>)\n(?=<li>)/g, '$1\n');
    html = html.replace(/(<li>.*<\/li>\n)+/g, match => {
        if(!match.startsWith('<ul>')) return '<ul>' + match + '</ul>';
        return match;
    });
    
    html = html.replace(/\n/g, '<br>');
    return html;
}

async function loadBlog() {
    const id = getBlogId();
    if(!id) {
        document.getElementById('blogLoading').classList.add('hidden');
        document.getElementById('blogError').classList.remove('hidden');
        return;
    }
    
    try {
        const res = await fetch('/api/blogs');
        const blogs = await res.json();
        const blog = blogs.find(b => b.id === id);
        
        if(!blog) throw new Error('Not found');
        
        document.getElementById('blogTitle').textContent = blog.title || 'Untitled';
        document.getElementById('blogAuthor').textContent = blog.author || 'Admin';
        document.getElementById('blogDate').textContent = blog.date || '';
        document.getElementById('blogViews').textContent = blog.views || 0;
        document.getElementById('blogCategory').innerHTML = `<span class="blog-card-tag">${blog.category || 'General'}</span>`;
        
        const img = document.getElementById('blogTitleImg');
        img.src = blog.titleImage || '/logo.png';
        img.onerror = () => { img.src = '/logo.png'; };
        
        let content = blog.content || '';
        if(blog.images && blog.images.length > 0) {
            blog.images.forEach((imgData, idx) => {
                content = content.replace(`[IMAGE:${idx}]`, `<img src="${imgData}" class="blog-inline-img" alt="Blog image ${idx+1}" onerror="this.style.display='none'">`);
            });
        }
        document.getElementById('blogBody').innerHTML = parseMarkdown(content);
        
        document.getElementById('blogLoading').classList.add('hidden');
        document.getElementById('blogContent').classList.remove('hidden');
        
        loadReviews(id);
        
    } catch(e) {
        document.getElementById('blogLoading').classList.add('hidden');
        document.getElementById('blogError').classList.remove('hidden');
    }
}

// ===== REVIEWS =====
async function loadReviews(blogId) {
    try {
        const res = await fetch('/api/reviews/' + blogId);
        const reviews = await res.json();
        const container = document.getElementById('reviewsList');
        
        if(reviews.length === 0) {
            container.innerHTML = `<div class="reviews-empty"><p>💬 No reviews yet. Be the first!</p></div>`;
            return;
        }
        
        container.innerHTML = reviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <strong>${escapeHtml(r.name)}</strong>
                    <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                </div>
                <p>${escapeHtml(r.comment)}</p>
                <small>${new Date(r.date).toLocaleDateString()}</small>
            </div>
        `).join('');
    } catch(e) {
        console.error('Failed to load reviews', e);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== STAR RATING =====
let selectedRating = 0;
(function initStars() {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            stars.forEach((s, i) => {
                s.classList.toggle('active', i < selectedRating);
            });
        });
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach((s, i) => {
                s.style.color = i < val ? '#fbbf24' : '';
            });
        });
    });
    document.getElementById('starRating').addEventListener('mouseleave', () => {
        stars.forEach((s, i) => {
            s.style.color = i < selectedRating ? '#fbbf24' : '';
        });
    });
})();

// ===== CHAR COUNTER =====
document.getElementById('reviewText').addEventListener('input', function() {
    document.getElementById('charCounter').textContent = `${this.value.length} / 500`;
});

// ===== SUBMIT REVIEW =====
document.getElementById('reviewForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const blogId = getBlogId();
    if(!blogId) return;
    
    if(selectedRating === 0) {
        alert('Please select a star rating!');
        return;
    }
    
    const btn = this.querySelector('.post-review-btn');
    const original = btn.textContent;
    btn.textContent = 'Posting...';
    btn.disabled = true;
    
    try {
        const res = await fetch('/api/reviews/' + blogId, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                name: document.getElementById('reviewerName').value.trim(),
                email: document.getElementById('reviewerEmail').value.trim(),
                rating: selectedRating,
                comment: document.getElementById('reviewText').value.trim()
            })
        });
        
        if(res.ok) {
            alert('Review posted successfully!');
            this.reset();
            selectedRating = 0;
            document.querySelectorAll('#starRating .star').forEach(s => {
                s.classList.remove('active');
                s.style.color = '';
            });
            document.getElementById('charCounter').textContent = '0 / 500';
            loadReviews(blogId);
        } else {
            alert('Failed to post review.');
        }
    } catch(err) {
        alert('Network error. Please try again.');
    }
    
    btn.textContent = original;
    btn.disabled = false;
});

// ===== SHARE =====
function shareBlog(platform) {
    const url = window.location.href;
    const title = document.getElementById('blogTitle').textContent;
    const text = `Check out this blog: ${title}`;
    
    switch(platform) {
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
            break;
        case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
            break;
        case 'whatsapp':
            window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
            break;
        case 'copy':
            navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!'));
            break;
    }
}

loadBlog();
