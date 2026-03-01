/**
 * Cemil Dalar — Portfolio
 * Data-driven rendering + interactions + admin access
 */

document.addEventListener('DOMContentLoaded', () => {
    // =============================
    // 0. Initial Render
    // =============================
    renderAll();

    function renderAll() {
        const data = PortfolioData.getData();
        renderHero(data.hero);
        renderAbout(data.about);
        renderSkills(data.skills);
        renderProjects(data.projects);
        renderExperience(data.experience);
        renderCertificates(data.certificates || []);
        renderContact(data.contact);
        initRevealAnimations();
        initStagger();
    }

    // Expose for admin panel to call on return
    window.refreshPortfolio = function () {
        renderAll();
        // Re-animate counters
        counterAnimated = false;
        if (statsSection) statsObserver.observe(statsSection);
    };

    // =============================
    // Render Functions
    // =============================
    function renderHero(hero) {
        document.getElementById('heroGreeting').textContent = hero.greeting;
        document.getElementById('heroName').textContent = hero.name;
        document.getElementById('heroDesc').innerHTML = hero.description;
        document.getElementById('heroBadge').querySelector('span:last-child').textContent = hero.badge;

        // CV Download button
        const actionsEl = document.querySelector('.hero-actions');
        const existingCvBtn = document.getElementById('heroCvBtn');
        if (existingCvBtn) existingCvBtn.remove();
        if (hero.cvUrl && hero.cvUrl.trim()) {
            const cvBtn = document.createElement('a');
            cvBtn.id = 'heroCvBtn';
            cvBtn.href = hero.cvUrl;
            cvBtn.target = '_blank';
            cvBtn.rel = 'noopener';
            cvBtn.className = 'btn btn-outline';
            cvBtn.innerHTML = '<i class="ph ph-file-pdf"></i> CV İndir';
            actionsEl.appendChild(cvBtn);
        }

        document.getElementById('heroStats').innerHTML = hero.stats.map(s => `
            <div class="stat">
                <span class="stat-number" data-count="${s.number}">0</span>
                <span class="stat-label">${esc(s.label)}</span>
            </div>
        `).join('');

        window._heroRoles = hero.roles;
    }

    function renderAbout(about) {
        document.getElementById('aboutText').innerHTML = about.paragraphs.map(p => `<p>${p}</p>`).join('');
        document.getElementById('aboutDetails').innerHTML = about.details.map(d => `
            <div class="detail-card">
                <i class="ph ${d.icon}"></i>
                <div>
                    <span class="detail-label">${esc(d.label)}</span>
                    <span class="detail-value">${esc(d.value)}</span>
                </div>
            </div>
        `).join('');
    }

    function renderSkills(skills) {
        document.getElementById('skillsGrid').innerHTML = skills.map(cat => `
            <div class="skill-category">
                <div class="skill-category-header">
                    <i class="ph ${cat.icon}"></i>
                    <h3>${esc(cat.title)}</h3>
                </div>
                <div class="skill-tags">
                    ${cat.tags.map(t => `<span class="skill-tag" data-level="${t.level}">${esc(t.name)}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    function renderProjects(projects) {
        const visible = projects.filter(p => p.visible);
        const allTags = new Set();
        visible.forEach(p => p.tags.forEach(t => allTags.add(t)));
        const labels = { featured: 'Öne Çıkan', web: 'Web', java: 'Java', csharp: 'C#', python: 'Python' };

        // Filters
        let fhtml = '<button class="filter-btn active" data-filter="all">Tümü</button>';
        allTags.forEach(t => { fhtml += `<button class="filter-btn" data-filter="${t}">${labels[t] || t}</button>`; });
        document.getElementById('projectFilters').innerHTML = fhtml;

        // Cards
        document.getElementById('projectsGrid').innerHTML = visible.map(p => `
            <div class="project-card ${p.featured ? 'project-featured' : ''}" data-tags="${p.tags.join(',')}">
                <div class="project-card-glow"></div>
                <div class="project-header">
                    <div class="project-icon"><i class="ph ${p.icon}"></i></div>
                    <div class="project-links">
                        ${p.github ? `<a href="${esc(p.github)}" target="_blank" rel="noopener" class="project-link" title="GitHub"><i class="ph ph-github-logo"></i></a>` : ''}
                    </div>
                </div>
                <h3 class="project-title">${esc(p.title)}</h3>
                <p class="project-desc">${esc(p.description)}</p>
                <div class="project-tech">${p.tech.map(t => `<span>${esc(t)}</span>`).join('')}</div>
            </div>
        `).join('');

        initProjectFilters();
        initCardGlow();
    }

    function renderExperience(experience) {
        document.getElementById('timeline').innerHTML = experience.map(e => `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h3>${esc(e.title)}</h3>
                        <span class="timeline-date">${esc(e.date)}</span>
                    </div>
                    <p class="timeline-company">${esc(e.company)}</p>
                    <p class="timeline-desc">${esc(e.description)}</p>
                    <div class="timeline-tech">${e.tech.map(t => `<span>${esc(t)}</span>`).join('')}</div>
                </div>
            </div>
        `).join('');
    }

    // =============================
    // Certificates
    // =============================
    function renderCertificates(certificates) {
        const grid = document.getElementById('certificatesGrid');
        if (!grid) return;
        if (!certificates || certificates.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">Henüz sertifika eklenmedi.</p>';
            return;
        }
        grid.innerHTML = certificates.map(c => `
            <div class="cert-card">
                <div class="cert-card-glow"></div>
                <div class="cert-icon"><i class="ph ${c.icon}"></i></div>
                <div class="cert-info">
                    <h3 class="cert-title">${esc(c.title)}</h3>
                    <div class="cert-issuer">
                        <i class="ph ph-buildings"></i>
                        <span>${esc(c.issuer)}</span>
                    </div>
                    <span class="cert-date"><i class="ph ph-calendar-blank"></i> ${esc(c.date)}</span>
                    <p class="cert-desc">${esc(c.description)}</p>
                    <div class="cert-tech">${(c.tech || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
                </div>
                ${c.credential ? `<a href="${esc(c.credential)}" target="_blank" rel="noopener" class="cert-link"><i class="ph ph-arrow-up-right"></i> Görüntüle</a>` : ''}
            </div>
        `).join('');
    }

    function renderContact(contact) {
        document.getElementById('contactText').innerHTML = `<h3>${esc(contact.heading)}</h3><p>${esc(contact.description)}</p>`;
        document.getElementById('contactLinks').innerHTML = contact.links.map(l => `
            <a href="${esc(l.url)}" ${l.url.startsWith('mailto:') ? '' : 'target="_blank" rel="noopener"'} class="contact-card">
                <div class="contact-card-icon"><i class="ph ${l.icon}"></i></div>
                <div class="contact-card-info">
                    <span class="contact-card-label">${esc(l.label)}</span>
                    <span class="contact-card-value">${esc(l.value)}</span>
                </div>
                <i class="ph ph-arrow-up-right contact-card-arrow"></i>
            </a>
        `).join('');
    }

    // =============================
    // GitHub Contribution Heatmap
    // =============================
    fetchContributions();

    async function fetchContributions() {
        try {
            const resp = await fetch('https://github-contributions-api.jogruber.de/v4/cmldlr?y=last');
            if (!resp.ok) throw new Error();
            const data = await resp.json();
            renderContribGraph(data);
        } catch (e) {
            const graph = document.getElementById('contribGraph');
            graph.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;width:100%">Katkı verileri yüklenemedi.</p>';
        }
    }

    function renderContribGraph(data) {
        const graph = document.getElementById('contribGraph');
        const monthsEl = document.getElementById('contribMonths');
        const tooltip = document.getElementById('contribTooltip');

        // Total count
        document.getElementById('contribTotal').textContent = data.total.lastYear;

        const contributions = data.contributions;
        if (!contributions || contributions.length === 0) return;

        // Organize into weeks (columns of 7 days, Sunday=0..Saturday=6)
        const weeks = [];
        let currentWeek = [];

        contributions.forEach(day => {
            const d = new Date(day.date);
            const dow = d.getDay(); // Sunday=0

            // If it's Sunday and we have a current week, push it
            if (dow === 0 && currentWeek.length > 0) {
                weeks.push(currentWeek);
                currentWeek = [];
            }

            // For the very first week, pad empty cells before
            if (weeks.length === 0 && currentWeek.length === 0 && dow > 0) {
                for (let i = 0; i < dow; i++) {
                    currentWeek.push(null);
                }
            }

            currentWeek.push(day);
        });

        // Push last week
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        // Month labels
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const fullMonthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

        // Calculate month label positions
        let monthHtml = '';
        let lastMonth = -1;
        const cellSize = 16; // 13px cell + 3px gap
        weeks.forEach((week, wi) => {
            const firstDay = week.find(d => d !== null);
            if (firstDay) {
                const m = new Date(firstDay.date).getMonth();
                if (m !== lastMonth) {
                    monthHtml += `<span class="contrib-month-label" style="position:relative;left:${wi * cellSize}px">${monthNames[m]}</span>`;
                    lastMonth = m;
                }
            }
        });
        monthsEl.innerHTML = monthHtml;

        // Build heatmap grid
        let html = '';
        weeks.forEach(week => {
            html += '<div class="contrib-week">';
            for (let row = 0; row < 7; row++) {
                if (row < week.length && week[row]) {
                    const day = week[row];
                    html += `<span class="contrib-cell" data-level="${day.level}" data-date="${day.date}" data-count="${day.count}"></span>`;
                } else {
                    html += '<span class="contrib-cell" data-level="0" style="visibility:hidden"></span>';
                }
            }
            html += '</div>';
        });
        graph.innerHTML = html;

        // Tooltip
        graph.addEventListener('mouseover', (e) => {
            const cell = e.target.closest('.contrib-cell');
            if (!cell || !cell.dataset.date) return;

            const date = new Date(cell.dataset.date);
            const count = parseInt(cell.dataset.count);
            const dayName = dayNames[date.getDay()];
            const monthName = fullMonthNames[date.getMonth()];

            tooltip.innerHTML = `<strong>${count}</strong> katkı — ${dayName}, ${date.getDate()} ${monthName} ${date.getFullYear()}`;
            tooltip.classList.add('visible');

            const rect = cell.getBoundingClientRect();
            tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
        });

        graph.addEventListener('mouseout', (e) => {
            if (e.target.closest('.contrib-cell')) {
                tooltip.classList.remove('visible');
            }
        });
    }

    // =============================
    // 1. Cursor Glow
    // =============================
    const cursorGlow = document.getElementById('cursorGlow');
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
        cursorGlow.classList.add('active');
    });
    document.addEventListener('mouseleave', () => cursorGlow.classList.remove('active'));

    // =============================
    // Particle System
    // =============================
    const particleCanvas = document.getElementById('particleCanvas');
    if (particleCanvas) {
        const ctx = particleCanvas.getContext('2d');
        let particles = [];
        let mouseX = -1000, mouseY = -1000;
        const PARTICLE_COUNT = 70;
        const CONNECTION_DIST = 120;
        const MOUSE_DIST = 150;

        function resizeCanvas() {
            const hero = document.getElementById('hero');
            particleCanvas.width = hero.offsetWidth;
            particleCanvas.height = hero.offsetHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * particleCanvas.width;
                this.y = Math.random() * particleCanvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.5 + 0.2;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > particleCanvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > particleCanvas.height) this.vy *= -1;
                // Mouse repulsion
                const dx = this.x - mouseX, dy = this.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_DIST) {
                    const force = (MOUSE_DIST - dist) / MOUSE_DIST * 0.03;
                    this.vx += dx * force;
                    this.vy += dy * force;
                }
                // Dampen velocity
                this.vx *= 0.99;
                this.vy *= 0.99;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(108, 99, 255, ${this.opacity})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECTION_DIST) {
                        const opacity = (1 - dist / CONNECTION_DIST) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(108, 99, 255, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        }

        function animateParticles() {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            drawConnections();
            requestAnimationFrame(animateParticles);
        }
        animateParticles();

        document.getElementById('hero').addEventListener('mousemove', (e) => {
            const rect = particleCanvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });
        document.getElementById('hero').addEventListener('mouseleave', () => {
            mouseX = -1000;
            mouseY = -1000;
        });
    }

    function initCardGlow() {
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
                card.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
            });
        });
    }

    // =============================
    // 2. Navigation
    // =============================
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });

    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinksList = document.querySelectorAll('.nav-link');

    function updateActiveLink() {
        const y = window.scrollY + 200;
        sections.forEach(sec => {
            const id = sec.getAttribute('id');
            if (y >= sec.offsetTop && y < sec.offsetTop + sec.offsetHeight) {
                navLinksList.forEach(l => {
                    l.classList.toggle('active', l.getAttribute('data-section') === id);
                });
            }
        });
    }
    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink();

    // =============================
    // 3. Typing Effect
    // =============================
    const heroRole = document.getElementById('heroRole');
    let roleIndex = 0, charIndex = 0, isDeleting = false, typeSpeed = 100;

    function typeEffect() {
        const roles = window._heroRoles || ['Software Engineer'];
        const current = roles[roleIndex];
        if (isDeleting) { heroRole.innerHTML = current.substring(0, --charIndex) + '<span class="cursor"></span>'; typeSpeed = 50; }
        else { heroRole.innerHTML = current.substring(0, ++charIndex) + '<span class="cursor"></span>'; typeSpeed = 100; }
        if (!isDeleting && charIndex === current.length) { typeSpeed = 2000; isDeleting = true; }
        else if (isDeleting && charIndex === 0) { isDeleting = false; roleIndex = (roleIndex + 1) % roles.length; typeSpeed = 500; }
        setTimeout(typeEffect, typeSpeed);
    }
    typeEffect();

    // =============================
    // 4. Counter Animation
    // =============================
    let counterAnimated = false;
    function animateCounters() {
        if (counterAnimated) return;
        document.querySelectorAll('.stat-number').forEach(c => {
            const target = parseInt(c.getAttribute('data-count'));
            const step = target / 125; let cur = 0;
            const update = () => { cur += step; if (cur < target) { c.textContent = Math.floor(cur); requestAnimationFrame(update); } else c.textContent = target + '+'; };
            update();
        });
        counterAnimated = true;
    }

    const statsObserver = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) animateCounters(); });
    }, { threshold: 0.5 });
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) statsObserver.observe(statsSection);

    // =============================
    // 5. Reveal Animations
    // =============================
    function initRevealAnimations() {
        const items = document.querySelectorAll(
            '.section-header, .about-text, .about-details, .contrib-card, .skill-category, .project-card, .timeline-item, .cert-card, .contact-text, .contact-links'
        );
        items.forEach(i => i.classList.add('reveal'));
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        items.forEach(i => obs.observe(i));
    }

    // =============================
    // 6. Project Filters
    // =============================
    function initProjectFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const f = btn.getAttribute('data-filter');
                document.querySelectorAll('.project-card').forEach(card => {
                    const tags = card.getAttribute('data-tags').split(',');
                    if (f === 'all' || tags.includes(f)) { card.classList.remove('hidden'); card.style.animation = 'fadeInUp 0.4s ease-out forwards'; }
                    else card.classList.add('hidden');
                });
            });
        });
    }

    // =============================
    // 7. Smooth Scroll
    // =============================
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            const t = document.querySelector(this.getAttribute('href'));
            if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // =============================
    // 8. Staggered Reveals
    // =============================
    function initStagger() {
        document.querySelectorAll('.skills-grid, .projects-grid, .certificates-grid').forEach(cont => {
            Array.from(cont.children).forEach((c, i) => { c.style.transitionDelay = `${i * 0.1}s`; });
        });
    }

    // =============================
    // Parallax Scroll
    // =============================
    function initParallax() {
        const heroVisual = document.querySelector('.hero-visual');
        const heroContent = document.querySelector('.hero-content');
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    if (heroVisual && scrollY < window.innerHeight) {
                        heroVisual.style.transform = `translateY(${scrollY * 0.15}px)`;
                        heroContent.style.transform = `translateY(${scrollY * 0.08}px)`;
                    }
                    // Section headers subtle parallax
                    document.querySelectorAll('.section-header').forEach(header => {
                        const rect = header.getBoundingClientRect();
                        if (rect.top < window.innerHeight && rect.bottom > 0) {
                            const offset = (rect.top - window.innerHeight / 2) * 0.04;
                            header.style.transform = `translateY(${offset}px)`;
                        }
                    });
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    initParallax();

    // =============================
    // 9. Admin Access (3x logo click)
    // =============================
    let clicks = 0, clickTimer = null;
    document.getElementById('navLogo').addEventListener('click', (e) => {
        e.preventDefault();
        clicks++;
        if (clickTimer) clearTimeout(clickTimer);
        if (clicks >= 3) {
            clicks = 0;
            if (PortfolioAuth.isAuthenticated()) {
                showAdmin();
            } else {
                showLogin();
            }
        } else {
            clickTimer = setTimeout(() => clicks = 0, 600);
        }
    });

    // =============================
    // Utility
    // =============================
    function esc(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
});
