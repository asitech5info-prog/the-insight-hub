/* ============================================
   THE INSIGHT HUB - Main JavaScript
   Theme | Animations | Parallax | Blog Loader
   ============================================ */

// ===== THEME TOGGLE =====
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
})();

// ===== MOBILE MENU =====
function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
    document.getElementById('menuOverlay').classList.toggle('show');
}

// ===== NAV SEARCH =====
function navSearch() {
    const q = document.getElementById('navSearchInput').value.trim();
    if(q) window.location.href = '/search.html?q=' + encodeURIComponent(q);
}

// ===== YEAR =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== MOUSE PARALLAX (Hero) =====
(function initParallax() {
    const hero = document.getElementById('hero');
    const visual = document.getElementById('heroVisual');
    if(!hero || !visual) return;
    if(window.matchMedia('(pointer: coarse)').matches) return;
    
    let rafId = null;
    let mouseX = 0, mouseY = 0;
    
    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouseX = (e.clientX - rect.left - rect.width/2) / rect.width;
        mouseY = (e.clientY - rect.top - rect.height/2) / rect.height;
        if(!rafId) {
            rafId = requestAnimationFrame(updateParallax);
        }
    });
    
    function updateParallax() {
        visual.style.transform = `translate(${mouseX * -20}px, ${mouseY * -20}px)`;
        rafId = null;
    }
    
    hero.addEventListener('mouseleave', () => {
        visual.style.transform = 'translate(0,0)';
    });
})();

// ===== SCROLL REVEAL =====
(function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

// ===== STATS COUNTER ANIMATION =====
(function initCounters() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-target'));
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
    
    function animateCounter(el, target) {
        const duration = 2000;
        const start = performance.now();
        const isBig = target >= 1000;
        
        function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(ease * target);
            el.textContent = isBig ? formatNumber(current) : current + '+';
            if(progress < 1) requestAnimationFrame(update);
            else el.textContent = isBig ? formatNumber(target) : target + '+';
        }
        requestAnimationFrame(update);
    }
    
    function formatNumber(n) {
        if(n >= 1000) return (n/1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K+';
        return n + '+';
    }
})();

// ===== CATEGORIES DATA =====
const categories = [
    { id: 'education', name: 'Education', icon: '🎓', desc: 'Learning resources and educational content', count: 18, class: 'cat-education' },
    { id: 'technology', name: 'Technology', icon: '💻', desc: 'Latest tech trends and innovations', count: 22, class: 'cat-technology' },
    { id: 'artificial intelligence', name: 'AI & Machine Learning', icon: '🧠', desc: 'Deep dives into AI, ML, and neural networks', count: 15, class: 'cat-ai' },
    { id: 'science', name: 'Science', icon: '⚛️', desc: 'Scientific discoveries and research', count: 12, class: 'cat-science' },
    { id: 'movies', name: 'Movies', icon: '🎬', desc: 'Film reviews and cinema insights', count: 10, class: 'cat-movies' },
    { id: 'programming', name: 'Programming', icon: '🖥️', desc: 'Code tutorials and developer tips', count: 20, class: 'cat-programming' },
    { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒', desc: 'Security best practices and threat analysis', count: 15, class: 'cat-cybersecurity' },
    { id: 'web development', name: 'Web Development', icon: '🌐', desc: 'Frontend, backend, and full-stack guides', count: 22, class: 'cat-webdev' },
    { id: 'gadgets & reviews', name: 'Gadgets & Reviews', icon: '📱', desc: 'Tech gadgets and honest reviews', count: 12, class: 'cat-gadgets' },
    { id: 'tech news', name: 'Tech News', icon: '📰', desc: 'Breaking news from the tech world', count: 20, class: 'cat-technews' }
];

function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if(!grid) return;
    grid.innerHTML = categories.map(cat => `
        <div class="cat-card ${cat.class}" onclick="window.location.href='/?cat=${encodeURIComponent(cat.id)}'">
            <div class="cat-card-header">
                <div class="cat-icon-wrap">${cat.icon}</div>
                <h3>${cat.name}</h3>
            </div>
            <p>${cat.desc}</p>
            <span class="cat-count">${cat.count} Articles</span>
        </div>
    `).join('');
}
renderCategories();

// ===== BLOG LOADING =====
function createBlogCard(blog) {
    const div = document.createElement('div');
    div.className = 'blog-card';
    div.onclick = () => window.location.href = '/blog.html?id=' + blog.id;
    div.innerHTML = `
        <div class="blog-card-img-wrap">
            <img src="${blog.titleImage || '/logo.png'}" alt="${blog.title}" class="blog-card-img" onerror="this.src='/logo.png'">
            <div class="blog-card-overlay"></div>
        </div>
        <div class="blog-card-body">
            <span class="blog-card-tag">${blog.category || 'General'}</span>
            <h3>${blog.title}</h3>
            <p>${blog.content ? blog.content.substring(0, 120).replace(/[#*\\-]/g,'') + '...' : ''}</p>
            <div class="blog-card-meta">
                <span>📅 ${blog.date || ''}</span>
                <span>👁️ ${blog.views || 0}</span>
            </div>
        </div>
    `;
    return div;
}

async function loadBlogs() {
    const grid = document.getElementById('blogGrid');
    if(!grid) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const filterCat = urlParams.get('cat');
    
    try {
        const res = await fetch('/api/blogs');
        const blogs = await res.json();
        grid.innerHTML = '';
        
        let displayBlogs = blogs;
        if(filterCat) {
            displayBlogs = blogs.filter(b => b.category && b.category.toLowerCase() === filterCat.toLowerCase());
            if(displayBlogs.length === 0) {
                grid.innerHTML = `<div class="empty-state"><p>😕 No blogs in "${filterCat}" yet.</p><a href="/" class="btn-primary" style="margin-top:1rem;">← All Blogs</a></div>`;
                return;
            }
        }
        
        if(displayBlogs.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>📝 No blogs published yet. Check back soon!</p></div>';
            return;
        }
        
        displayBlogs.forEach(blog => grid.appendChild(createBlogCard(blog)));
    } catch(e) {
        grid.innerHTML = '<div class="empty-state"><p>⚠️ Failed to load blogs. Please refresh.</p></div>';
    }
}
loadBlogs();
