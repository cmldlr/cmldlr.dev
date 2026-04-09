/**
 * Cemil Dalar — Portfolio
 * Data-driven rendering + interactions + admin access
 */

document.addEventListener('DOMContentLoaded', async () => {
    // =============================
    // 0. Preloader
    // =============================
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.style.display = 'none', 600);
        }, 800);
    });

    // =============================
    // 0b. Language Toggle
    // =============================
    const langToggle = document.getElementById('langToggle');
    const langLabel = document.getElementById('langLabel');

    function updateLangButton() {
        const lang = I18n.getLang();
        langLabel.textContent = lang === 'en' ? 'TR' : 'EN';
    }
    updateLangButton();

    langToggle.addEventListener('click', () => {
        const current = I18n.getLang();
        const next = current === 'en' ? 'tr' : 'en';
        I18n.setLang(next);
        updateLangButton();
        renderAll();
        I18n.applyToDOM();
        // Re-animate stat counters after re-render
        counterAnimated = false;
        animateCounters();
    });

    // =============================
    // 0c. Force Dark Theme
    // =============================
    document.documentElement.setAttribute('data-theme', 'dark');

    // =============================
    // 0d. Scroll Progress Bar
    // =============================
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            scrollProgress.style.width = percent + '%';
        }, { passive: true });
    }

    // =============================
    // 0e. Accent Color Picker
    // =============================
    const COLOR_KEY = 'portfolio_accent';
    const colorPickerToggle = document.getElementById('colorPickerToggle');
    const colorPickerPopup = document.getElementById('colorPickerPopup');
    const colorSwatches = document.getElementById('colorSwatches');
    const customColorInput = document.getElementById('customColorInput');

    const colorPresets = {
        purple: { primary: '#6c63ff', secondary: '#a78bfa' },
        blue: { primary: '#3b82f6', secondary: '#60a5fa' },
        emerald: { primary: '#10b981', secondary: '#34d399' },
        rose: { primary: '#f43f5e', secondary: '#fb7185' },
        amber: { primary: '#f59e0b', secondary: '#fbbf24' },
        cyan: { primary: '#06b6d4', secondary: '#22d3ee' }
    };

    function hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    function applyAccentColor(primary, secondary) {
        const root = document.documentElement;
        const rgb = hexToRgb(primary);
        root.style.setProperty('--accent-primary', primary);
        root.style.setProperty('--accent-secondary', secondary);
        root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${primary}, ${secondary})`);
        root.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
        root.style.setProperty('--accent-glow-strong', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        root.style.setProperty('--border-hover', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        // Update particles color
        window._particleColor = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
    }

    function loadAccentColor() {
        const saved = localStorage.getItem(COLOR_KEY);
        if (saved) {
            try {
                const { primary, secondary, name } = JSON.parse(saved);
                applyAccentColor(primary, secondary);
                customColorInput.value = primary;
                // Mark active swatch
                document.querySelectorAll('.color-swatch').forEach(s => {
                    s.classList.toggle('active', s.dataset.color === name);
                });
            } catch (e) { /* ignore */ }
        }
    }
    loadAccentColor();

    colorPickerToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        colorPickerPopup.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!colorPickerPopup.contains(e.target) && e.target !== colorPickerToggle) {
            colorPickerPopup.classList.remove('open');
        }
    });

    colorSwatches.addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (!swatch) return;
        const name = swatch.dataset.color;
        const preset = colorPresets[name];
        if (!preset) return;
        applyAccentColor(preset.primary, preset.secondary);
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        customColorInput.value = preset.primary;
        localStorage.setItem(COLOR_KEY, JSON.stringify({ ...preset, name }));
    });

    customColorInput.addEventListener('input', (e) => {
        const primary = e.target.value;
        // Generate lighter secondary
        const rgb = hexToRgb(primary);
        const secondary = `#${Math.min(255, rgb.r + 50).toString(16).padStart(2, '0')}${Math.min(255, rgb.g + 50).toString(16).padStart(2, '0')}${Math.min(255, rgb.b + 50).toString(16).padStart(2, '0')}`;
        applyAccentColor(primary, secondary);
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        localStorage.setItem(COLOR_KEY, JSON.stringify({ primary, secondary, name: 'custom' }));
    });

    // =============================
    // 1. Initial Render
    // =============================
    await PortfolioData.init(); // Fetch from Supabase (falls back to localStorage/defaults)
    renderAll();
    I18n.applyToDOM();

    function renderAll() {
        const data = PortfolioData.getData();
        renderHero(data.hero);
        renderAbout(data.about);
        renderSkills(data.skills);
        renderProjects(data.projects);
        renderCertificates(data.certificates || []);
        renderContact(data.contact);
        initRevealAnimations();
        initStagger();
    }

    // Expose for admin panel to call on return
    window.refreshPortfolio = function () {
        renderAll();
        I18n.applyToDOM();
        // Re-animate counters
        counterAnimated = false;
        animateCounters();
    };

    // =============================
    // Render Functions
    // =============================
    function renderHero(hero) {
        document.getElementById('heroGreeting').textContent = hero.greeting;
        document.getElementById('heroName').textContent = hero.name;
        document.getElementById('heroDesc').innerHTML = hero.description;
        document.getElementById('heroBadge').querySelector('span:last-child').textContent = hero.badge;

        // Apply i18n data translations if available
        const heroT = I18n.getDataTranslation('hero');
        if (heroT) {
            document.getElementById('heroGreeting').textContent = heroT.greeting || hero.greeting;
            document.getElementById('heroDesc').innerHTML = heroT.description || hero.description;
            document.getElementById('heroBadge').querySelector('span:last-child').textContent = heroT.badge || hero.badge;
        }

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
            cvBtn.innerHTML = `<i class="ph ph-file-pdf"></i> ${I18n.t('hero.cta.cv')}`;
            actionsEl.appendChild(cvBtn);
        }

        document.getElementById('heroStats').innerHTML = hero.stats.map(s => {
            const i18nKey = 'hero.stat.' + s.label.toLowerCase().replace(/\s+/g, '_');
            return `
            <div class="stat">
                <span class="stat-number" data-count="${s.number}">0</span>
                <span class="stat-label" data-i18n="${i18nKey}">${esc(s.label)}</span>
            </div>`;
        }).join('');

        window._heroRoles = heroT?.roles || hero.roles;
    }

    function renderAbout(about) {
        // Apply i18n translations
        const aboutT = I18n.getDataTranslation('about');
        const paragraphs = (aboutT?.paragraphs && aboutT.paragraphs.length > 0) ? aboutT.paragraphs : about.paragraphs;
        const details = about.details.map((d, i) => {
            if (aboutT?.details?.[i]) {
                return {
                    ...d,
                    label: aboutT.details[i].label || d.label,
                    value: aboutT.details[i].value || d.value
                };
            }
            return d;
        });
        document.getElementById('aboutText').innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
        document.getElementById('aboutDetails').innerHTML = details.map(d => `
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
        const trans = I18n.getDataTranslation('skills') || {};
        document.getElementById('skillsGrid').innerHTML = skills.map(cat => {
            const trCat = trans[cat.id];
            const title = (trCat && trCat.title) ? trCat.title : cat.title;
            return `
            <div class="skill-category">
                <div class="skill-category-header">
                    <i class="ph ${cat.icon}"></i>
                    <h3>${esc(title)}</h3>
                </div>
                <div class="skill-tags">
                    ${cat.tags.map(t => `<span class="skill-tag" data-level="${t.level}">${esc(t.name)}</span>`).join('')}
                </div>
            </div>
            `;
        }).join('');
    }

    function renderProjects(projects) {
        const trans = I18n.getDataTranslation('projects') || {};
        const visible = projects.filter(p => p.visible).map(p => {
            const trP = trans[p.id];
            if (trP) {
                return { ...p, title: trP.title || p.title, description: trP.description || p.description };
            }
            return p;
        });
        const allTags = new Set();
        visible.forEach(p => p.tags.forEach(t => allTags.add(t)));
        const labels = {
            featured: I18n.t('filter.featured'), web: I18n.t('filter.web'),
            java: I18n.t('filter.java'), csharp: I18n.t('filter.csharp'), python: I18n.t('filter.python')
        };

        // Filters
        let fhtml = `<button class="filter-btn active" data-filter="all">${I18n.t('projects.all')}</button>`;
        allTags.forEach(t => { fhtml += `<button class="filter-btn" data-filter="${t}">${labels[t] || t}</button>`; });
        document.getElementById('projectFilters').innerHTML = fhtml;

        // Cards
        document.getElementById('projectsGrid').innerHTML = visible.map(p => {
            const images = p.images || [];
            let mediaHtml = '';
            if (images.length > 0) {
                mediaHtml = `
                    <div class="project-carousel">
                        <div class="carousel-track">
                            ${images.map(img => `<img src="${img}" alt="${esc(p.title)}" loading="lazy">`).join('')}
                        </div>
                        ${images.length > 1 ? `
                        <button class="carousel-nav prev" title="Previous"><i class="ph ph-caret-left"></i></button>
                        <button class="carousel-nav next" title="Next"><i class="ph ph-caret-right"></i></button>
                        <div class="carousel-dots">
                            ${images.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
                        </div>
                        ` : ''}
                    </div>
                `;
            } else {
                mediaHtml = `
                    <div class="project-header">
                        <div class="project-icon"><i class="ph ${p.icon}"></i></div>
                        <div class="project-links">
                            ${p.github ? `<a href="${esc(p.github)}" target="_blank" rel="noopener" class="project-link" title="GitHub"><i class="ph ph-github-logo"></i></a>` : ''}
                        </div>
                    </div>
                `;
            }

            return `
            <div class="project-card ${p.featured ? 'project-featured' : ''}" data-tags="${p.tags.join(',')}">
                <div class="project-card-glow"></div>
                ${mediaHtml}
                <div class="project-content">
                    <h3 class="project-title">${esc(p.title)}</h3>
                    <p class="project-desc">${esc(p.description)}</p>
                    <div class="project-tech">${p.tech.map(t => `<span>${esc(t)}</span>`).join('')}</div>
                    ${images.length > 0 && p.github ? `<div style="margin-top:16px"><a href="${esc(p.github)}" target="_blank" rel="noopener" class="github-view-btn"><i class="ph ph-github-logo"></i> View on GitHub</a></div>` : ''}
                </div>
            </div>
            `;
        }).join('');

        initProjectFilters();
        initCardGlow();
        initCarousels();
    }

    function initCarousels() {
        document.querySelectorAll('.project-carousel').forEach(carousel => {
            const track = carousel.querySelector('.carousel-track');
            const prevBtn = carousel.querySelector('.carousel-nav.prev');
            const nextBtn = carousel.querySelector('.carousel-nav.next');
            const dots = carousel.querySelectorAll('.dot');
            const slides = track.querySelectorAll('img');
            if (slides.length <= 1) return;

            let currentIndex = 0;
            const total = slides.length;

            function updateCarousel() {
                track.style.transform = `translateX(-${currentIndex * 100}%)`;
                dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    currentIndex = (currentIndex > 0) ? currentIndex - 1 : total - 1;
                    updateCarousel();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    currentIndex = (currentIndex < total - 1) ? currentIndex + 1 : 0;
                    updateCarousel();
                });
            }

            dots.forEach((dot, i) => {
                dot.addEventListener('click', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    currentIndex = i;
                    updateCarousel();
                });
            });

            let startX = 0;
            let isDown = false;
            carousel.addEventListener('touchstart', e => {
                startX = e.changedTouches[0].screenX;
                isDown = true;
            }, { passive: true });
            carousel.addEventListener('touchend', e => {
                if (!isDown) return;
                isDown = false;
                let endX = e.changedTouches[0].screenX;
                if (startX - endX > 40) {
                    currentIndex = (currentIndex < total - 1) ? currentIndex + 1 : 0;
                    updateCarousel();
                } else if (endX - startX > 40) {
                    currentIndex = (currentIndex > 0) ? currentIndex - 1 : total - 1;
                    updateCarousel();
                }
            }, { passive: true });
        });
    }

    // =============================
    // Certificates
    // =============================
    function renderCertificates(certificates) {
        const trans = I18n.getDataTranslation('certificates') || {};
        const grid = document.getElementById('certificatesGrid');
        if (!grid) return;
        if (!certificates || certificates.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">' + I18n.t('certificates.empty') + '</p>';
            return;
        }
        grid.innerHTML = certificates.map(c => {
            const trC = trans[c.id];
            const title = (trC && trC.title) ? trC.title : c.title;
            const issuer = (trC && trC.issuer) ? trC.issuer : c.issuer;
            const desc = (trC && trC.description) ? trC.description : c.description;
            return `
            <div class="cert-card${c.image ? ' has-image' : ''}">
                <div class="cert-card-glow"></div>
                ${c.image ? `<div class="cert-image"><img src="${esc(c.image)}" alt="${esc(title)}" loading="lazy"></div>` : ''}
                <div class="cert-icon"><i class="ph ${c.icon}"></i></div>
                <div class="cert-info">
                    <h3 class="cert-title">${esc(title)}</h3>
                    <div class="cert-issuer">
                        <i class="ph ph-buildings"></i>
                        <span>${esc(issuer)}</span>
                    </div>
                    <span class="cert-date"><i class="ph ph-calendar-blank"></i> ${esc(c.date)}</span>
                    <p class="cert-desc">${esc(desc)}</p>
                    <div class="cert-tech">${(c.tech || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
                </div>
                ${c.credential ? `<a href="${esc(c.credential)}" target="_blank" rel="noopener" class="cert-link"><i class="ph ph-arrow-up-right"></i> ${I18n.t('certificates.view')}</a>` : ''}
            </div>
            `;
        }).join('');
    }

    function renderContact(contact) {
        const contactT = I18n.getDataTranslation('contact');
        const heading = contactT?.heading || contact.heading;
        const description = contactT?.description || contact.description;
        document.getElementById('contactText').innerHTML = `<h3>${esc(heading)}</h3><p>${esc(description)}</p>`;
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
            graph.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;width:100%">' + I18n.t('github.error') + '</p>';
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
        const monthNames = I18n.t('github.months');
        const dayNames = I18n.t('github.dayNames');
        const fullMonthNames = I18n.t('github.fullMonths');

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

            const tooltipTemplate = I18n.t('github.tooltip');
            tooltip.innerHTML = tooltipTemplate
                .replace('{count}', `<strong>${count}</strong>`)
                .replace('{day}', dayName)
                .replace('{date}', date.getDate())
                .replace('{month}', monthName)
                .replace('{year}', date.getFullYear());
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
        const isMobile = window.innerWidth <= 768;
        const PARTICLE_COUNT = isMobile ? 30 : 70;
        const CONNECTION_DIST = isMobile ? 80 : 120;
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
                ctx.fillStyle = `rgba(${window._particleColor || '108, 99, 255'}, ${this.opacity})`;
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
                        ctx.strokeStyle = `rgba(${window._particleColor || '108, 99, 255'}, ${opacity})`;
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
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // Close mobile nav when clicking backdrop
    navLinks.addEventListener('click', (e) => {
        if (e.target === navLinks) {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.style.overflow = '';
        }
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
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            e.preventDefault();
            try {
                const t = document.querySelector(href);
                if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (err) { /* invalid selector, ignore */ }
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
        // Disable parallax on touch/mobile devices for better performance
        const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        if (isTouchDevice || window.innerWidth <= 768) return;

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
    // 🎮 Easter Egg — Konami Code Snake Game
    // ↑ ↑ ↓ ↓ ← → ← → B A
    // =============================
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === konamiSequence[konamiIndex] || e.key.toLowerCase() === konamiSequence[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiSequence.length) {
                konamiIndex = 0;
                launchSnakeGame();
            }
        } else {
            konamiIndex = 0;
        }
    });

    function launchSnakeGame() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'snakeOverlay';
        overlay.innerHTML = `
            <div class="snake-container">
                <div class="snake-header">
                    <div class="snake-title"><span class="logo-bracket">{</span><span style="color:var(--accent-primary)">🐍</span><span class="logo-bracket">}</span> Snake</div>
                    <div class="snake-score">Score: <span id="snakeScore">0</span></div>
                    <button class="snake-close" id="snakeClose"><i class="ph ph-x"></i></button>
                </div>
                <canvas id="snakeCanvas" width="400" height="400"></canvas>
                <div class="snake-info">
                    <span>Play with arrow keys</span>
                    <span>ESC = Close</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const canvas = document.getElementById('snakeCanvas');
        const ctx = canvas.getContext('2d');
        const scoreEl = document.getElementById('snakeScore');
        const GRID = 20;
        const CELL = canvas.width / GRID;

        let snake = [{ x: 10, y: 10 }];
        let dir = { x: 1, y: 0 };
        let nextDir = { x: 1, y: 0 };
        let food = spawnFood();
        let score = 0;
        let gameOver = false;
        let interval;

        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#6c63ff';
        const accentRgb = window._particleColor || '108, 99, 255';

        function spawnFood() {
            let pos;
            do {
                pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
            } while (snake.some(s => s.x === pos.x && s.y === pos.y));
            return pos;
        }

        function draw() {
            // Background
            ctx.fillStyle = '#0a0a12';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid lines
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            for (let i = 0; i <= GRID; i++) {
                ctx.beginPath();
                ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height);
                ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL);
                ctx.stroke();
            }

            // Food
            ctx.fillStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Snake
            snake.forEach((seg, i) => {
                const alpha = 1 - (i / snake.length) * 0.6;
                ctx.fillStyle = i === 0 ? accent : `rgba(${accentRgb}, ${alpha})`;
                ctx.shadowColor = accent;
                ctx.shadowBlur = i === 0 ? 12 : 4;
                const pad = i === 0 ? 1 : 2;
                ctx.beginPath();
                ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 4);
                ctx.fill();
            });
            ctx.shadowBlur = 0;

            // Game over text
            if (gameOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 28px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 15);
                ctx.font = '14px "JetBrains Mono", monospace';
                ctx.fillStyle = accent;
                ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '12px "JetBrains Mono", monospace';
                ctx.fillText('SPACE = Play Again', canvas.width / 2, canvas.height / 2 + 45);
            }
        }

        function update() {
            if (gameOver) return;
            dir = nextDir;
            const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

            // Wall collision
            if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
                gameOver = true; draw(); clearInterval(interval); return;
            }
            // Self collision
            if (snake.some(s => s.x === head.x && s.y === head.y)) {
                gameOver = true; draw(); clearInterval(interval); return;
            }

            snake.unshift(head);
            if (head.x === food.x && head.y === food.y) {
                score += 10;
                scoreEl.textContent = score;
                food = spawnFood();
            } else {
                snake.pop();
            }
            draw();
        }

        function handleKey(e) {
            const k = e.key;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) e.preventDefault();
            if (k === 'Escape') { closeGame(); return; }
            if (k === ' ' && gameOver) {
                snake = [{ x: 10, y: 10 }]; dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
                food = spawnFood(); score = 0; scoreEl.textContent = 0; gameOver = false;
                interval = setInterval(update, 120); draw(); return;
            }
            if (k === 'ArrowUp' && dir.y === 0) nextDir = { x: 0, y: -1 };
            if (k === 'ArrowDown' && dir.y === 0) nextDir = { x: 0, y: 1 };
            if (k === 'ArrowLeft' && dir.x === 0) nextDir = { x: -1, y: 0 };
            if (k === 'ArrowRight' && dir.x === 0) nextDir = { x: 1, y: 0 };
        }

        function closeGame() {
            clearInterval(interval);
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
            overlay.remove();
        }

        document.addEventListener('keydown', handleKey);
        document.getElementById('snakeClose').addEventListener('click', closeGame);

        // --- Mobile touch controls for Snake ---
        let touchStartX = null, touchStartY = null;
        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: true });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        canvas.addEventListener('touchend', (e) => {
            if (touchStartX === null) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            if (Math.max(absDx, absDy) < 20) {
                // Tap — restart if game over
                if (gameOver) {
                    snake = [{ x: 10, y: 10 }]; dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
                    food = spawnFood(); score = 0; scoreEl.textContent = 0; gameOver = false;
                    interval = setInterval(update, 120); draw();
                }
                touchStartX = null; touchStartY = null;
                return;
            }
            if (absDx > absDy) {
                if (dx > 0 && dir.x === 0) nextDir = { x: 1, y: 0 };
                else if (dx < 0 && dir.x === 0) nextDir = { x: -1, y: 0 };
            } else {
                if (dy > 0 && dir.y === 0) nextDir = { x: 0, y: 1 };
                else if (dy < 0 && dir.y === 0) nextDir = { x: 0, y: -1 };
            }
            touchStartX = null; touchStartY = null;
        });

        draw();
        interval = setInterval(update, 120);
    }

    // =============================
    // 🎮 Easter Egg — Word Triggers (matrix, fly)
    // =============================
    let typedBuffer = '';
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('snakeOverlay') || document.getElementById('matrixOverlay') ||
            document.getElementById('pongOverlay') || document.getElementById('flappyOverlay')) return;
        if (e.key.length === 1) {
            typedBuffer += e.key.toLowerCase();
            if (typedBuffer.length > 10) typedBuffer = typedBuffer.slice(-10);
            if (typedBuffer.endsWith('matrix')) { typedBuffer = ''; launchMatrixRain(); }
            if (typedBuffer.endsWith('fly')) { typedBuffer = ''; launchFlappyCD(); }
        }
    });

    // =============================
    // 🎮 Easter Egg — Footer 5x Click → Pong
    // =============================
    let footerClicks = 0;
    let footerTimer = null;
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.addEventListener('click', () => {
            footerClicks++;
            clearTimeout(footerTimer);
            footerTimer = setTimeout(() => footerClicks = 0, 1500);
            if (footerClicks >= 5) {
                footerClicks = 0;
                launchPong();
            }
        });
    }

    // =============================
    // 📱 Secret Menu — Long-press footer logo (mobile-friendly easter eggs)
    // =============================
    const footerLogo = document.querySelector('.footer-logo');
    if (footerLogo) {
        let longPressTimer = null;
        let longPressTriggered = false;

        function startLongPress(e) {
            longPressTriggered = false;
            longPressTimer = setTimeout(() => {
                longPressTriggered = true;
                e.preventDefault();
                showSecretMenu();
            }, 800);
        }

        function cancelLongPress() {
            clearTimeout(longPressTimer);
        }

        footerLogo.addEventListener('mousedown', startLongPress);
        footerLogo.addEventListener('mouseup', cancelLongPress);
        footerLogo.addEventListener('mouseleave', cancelLongPress);
        footerLogo.addEventListener('touchstart', startLongPress, { passive: false });
        footerLogo.addEventListener('touchend', (e) => {
            cancelLongPress();
            if (longPressTriggered) e.preventDefault();
        });
        footerLogo.addEventListener('touchmove', cancelLongPress);
        footerLogo.style.cursor = 'pointer';
        footerLogo.style.userSelect = 'none';
        footerLogo.style.webkitUserSelect = 'none';
    }

    function showSecretMenu() {
        if (document.querySelector('.secret-menu-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'secret-menu-overlay';
        overlay.innerHTML = `
            <div class="secret-menu">
                <div class="secret-menu-title">🕹️ Secret Menu</div>
                <div class="secret-menu-grid">
                    <button class="secret-menu-btn" data-action="snake">
                        <span class="emoji">🐍</span>
                        Snake
                    </button>
                    <button class="secret-menu-btn" data-action="pong">
                        <span class="emoji">🏓</span>
                        Pong
                    </button>
                    <button class="secret-menu-btn" data-action="flappy">
                        <span class="emoji">🐦</span>
                        Flappy
                    </button>
                    <button class="secret-menu-btn" data-action="matrix">
                        <span class="emoji">💊</span>
                        Matrix
                    </button>
                    <button class="secret-menu-btn" data-action="terminal" style="grid-column: 1 / -1;">
                        <span class="emoji">💻</span>
                        Terminal
                    </button>
                </div>
                <button class="secret-menu-close">
                    <i class="ph ph-x"></i> Close
                </button>
            </div>
        `;
        document.body.appendChild(overlay);

        function closeMenu() { overlay.remove(); }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeMenu();
        });

        overlay.querySelector('.secret-menu-close').addEventListener('click', closeMenu);

        overlay.querySelectorAll('.secret-menu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                closeMenu();
                setTimeout(() => {
                    if (action === 'snake') launchSnakeGame();
                    else if (action === 'pong') launchPong();
                    else if (action === 'flappy') launchFlappyCD();
                    else if (action === 'matrix') launchMatrixRain();
                    else if (action === 'terminal') launchTerminal();
                }, 100);
            });
        });
    }

    // =============================
    // 🟢 Matrix Rain
    // =============================
    function launchMatrixRain() {
        const overlay = document.createElement('div');
        overlay.id = 'matrixOverlay';
        overlay.innerHTML = `<canvas id="matrixCanvas"></canvas><div class="matrix-hint">Tap to close</div><button class="snake-close" id="matrixClose" style="position:fixed;top:16px;right:16px;z-index:99999;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.6);color:rgba(255,255,255,0.7);font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="ph ph-x"></i></button>`;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const canvas = document.getElementById('matrixCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const fontSize = 14;
        const cols = Math.floor(canvas.width / fontSize);
        const drops = new Array(cols).fill(1);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]<>~`|';
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#6c63ff';

        function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = accent;
            ctx.font = fontSize + 'px "JetBrains Mono", monospace';

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;
                // Random brightness
                ctx.globalAlpha = 0.3 + Math.random() * 0.7;
                ctx.fillText(char, x, y);
                ctx.globalAlpha = 1;
                if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        }

        const matrixInterval = setInterval(drawMatrix, 40);
        const autoClose = setTimeout(() => closeMatrix(), 12000);

        function closeMatrix() {
            clearInterval(matrixInterval);
            clearTimeout(autoClose);
            document.removeEventListener('keydown', matrixKey);
            document.body.style.overflow = '';
            overlay.remove();
        }

        function matrixKey(e) {
            if (e.key === 'Escape') closeMatrix();
        }
        document.addEventListener('keydown', matrixKey);
        document.getElementById('matrixClose').addEventListener('click', closeMatrix);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.tagName === 'CANVAS') closeMatrix();
        });
    }

    // =============================
    // 🏓 Pong
    // =============================
    function launchPong() {
        const overlay = document.createElement('div');
        overlay.id = 'pongOverlay';
        overlay.innerHTML = `
            <div class="snake-container">
                <div class="snake-header">
                    <div class="snake-title"><span class="logo-bracket">{</span><span style="color:var(--accent-primary)">🏓</span><span class="logo-bracket">}</span> Pong</div>
                    <div class="snake-score" id="pongScoreDisplay">0 — 0</div>
                    <button class="snake-close" id="pongClose"><i class="ph ph-x"></i></button>
                </div>
                <canvas id="pongCanvas" width="500" height="350"></canvas>
                <div class="snake-info"><span>↑ ↓ to play</span><span>5 points = Victory</span></div>
            </div>`;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const canvas = document.getElementById('pongCanvas');
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#6c63ff';

        const paddleH = 70, paddleW = 10, ballR = 6;
        let playerY = H / 2 - paddleH / 2;
        let aiY = H / 2 - paddleH / 2;
        let ballX = W / 2, ballY = H / 2;
        let ballVX = 4, ballVY = 3;
        let playerScore = 0, aiScore = 0;
        let keys = {};
        let pongGameOver = false;
        let winner = '';
        let animFrame;

        function drawPong() {
            // BG
            ctx.fillStyle = '#0a0a12';
            ctx.fillRect(0, 0, W, H);
            // Center line
            ctx.setLineDash([6, 8]);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
            ctx.setLineDash([]);

            // Paddles
            ctx.shadowColor = accent;
            ctx.shadowBlur = 10;
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.roundRect(15, playerY, paddleW, paddleH, 5);
            ctx.fill();
            ctx.fillStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e';
            ctx.beginPath();
            ctx.roundRect(W - 25, aiY, paddleW, paddleH, 5);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Ball
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            // Score
            ctx.font = 'bold 32px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillText(playerScore, W / 2 - 50, 50);
            ctx.fillText(aiScore, W / 2 + 50, 50);

            if (pongGameOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px "Inter", sans-serif';
                ctx.fillText(winner === 'player' ? '🎉 You Win!' : '😤 You Lose!', W / 2, H / 2 - 10);
                ctx.font = '12px "JetBrains Mono", monospace';
                ctx.fillStyle = accent;
                ctx.fillText('SPACE = Play Again', W / 2, H / 2 + 25);
            }
        }

        function updatePong() {
            if (pongGameOver) { drawPong(); animFrame = requestAnimationFrame(updatePong); return; }

            // Player movement
            if (keys['ArrowUp'] && playerY > 0) playerY -= 5;
            if (keys['ArrowDown'] && playerY < H - paddleH) playerY += 5;

            // AI
            const aiCenter = aiY + paddleH / 2;
            const diff = ballY - aiCenter;
            aiY += diff * 0.08;
            aiY = Math.max(0, Math.min(H - paddleH, aiY));

            // Ball
            ballX += ballVX;
            ballY += ballVY;

            // Top/Bottom bounce
            if (ballY - ballR <= 0 || ballY + ballR >= H) ballVY *= -1;

            // Player paddle hit
            if (ballX - ballR <= 25 && ballY >= playerY && ballY <= playerY + paddleH && ballVX < 0) {
                ballVX = Math.abs(ballVX) * 1.05;
                ballVY += (ballY - (playerY + paddleH / 2)) * 0.15;
            }
            // AI paddle hit
            if (ballX + ballR >= W - 25 && ballY >= aiY && ballY <= aiY + paddleH && ballVX > 0) {
                ballVX = -Math.abs(ballVX) * 1.05;
                ballVY += (ballY - (aiY + paddleH / 2)) * 0.15;
            }

            // Scoring
            if (ballX < 0) { aiScore++; resetBall(); }
            if (ballX > W) { playerScore++; resetBall(); }
            document.getElementById('pongScoreDisplay').textContent = `${playerScore} — ${aiScore}`;

            if (playerScore >= 5) { pongGameOver = true; winner = 'player'; }
            if (aiScore >= 5) { pongGameOver = true; winner = 'ai'; }

            drawPong();
            animFrame = requestAnimationFrame(updatePong);
        }

        function resetBall() {
            ballX = W / 2; ballY = H / 2;
            ballVX = (Math.random() > 0.5 ? 4 : -4);
            ballVY = (Math.random() - 0.5) * 6;
        }

        function pongKey(e) {
            if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
            if (e.key === 'Escape') { closePong(); return; }
            if (e.key === ' ' && pongGameOver) {
                playerScore = 0; aiScore = 0; pongGameOver = false; winner = '';
                resetBall(); return;
            }
            keys[e.key] = true;
        }
        function pongKeyUp(e) { keys[e.key] = false; }

        function closePong() {
            cancelAnimationFrame(animFrame);
            document.removeEventListener('keydown', pongKey);
            document.removeEventListener('keyup', pongKeyUp);
            document.body.style.overflow = '';
            overlay.remove();
        }

        document.addEventListener('keydown', pongKey);
        document.addEventListener('keyup', pongKeyUp);
        document.getElementById('pongClose').addEventListener('click', closePong);

        // --- Mobile touch controls for Pong ---
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const scaleY = H / rect.height;
            playerY = (touch.clientY - rect.top) * scaleY - paddleH / 2;
            playerY = Math.max(0, Math.min(H - paddleH, playerY));
        }, { passive: false });
        canvas.addEventListener('click', () => {
            if (pongGameOver) {
                playerScore = 0; aiScore = 0; pongGameOver = false; winner = '';
                resetBall();
            }
        });

        // Update info text for mobile
        const snakeInfoEl = overlay.querySelector('.snake-info');
        if (snakeInfoEl && window.innerWidth <= 768) {
            snakeInfoEl.innerHTML = '<span>Tap to play</span><span>5 points = Victory</span>';
        }

        updatePong();
    }

    // =============================
    // 🐦 Flappy {CD}
    // =============================
    function launchFlappyCD() {
        const overlay = document.createElement('div');
        overlay.id = 'flappyOverlay';
        overlay.innerHTML = `
            <div class="snake-container">
                <div class="snake-header">
                    <div class="snake-title"><span class="logo-bracket">{</span><span style="color:var(--accent-primary)">CD</span><span class="logo-bracket">}</span> Flappy</div>
                    <div class="snake-score">Score: <span id="flappyScore">0</span></div>
                    <button class="snake-close" id="flappyClose"><i class="ph ph-x"></i></button>
                </div>
                <canvas id="flappyCanvas" width="400" height="500"></canvas>
                <div class="snake-info"><span>SPACE / Click = Jump</span><span>ESC = Close</span></div>
            </div>`;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const canvas = document.getElementById('flappyCanvas');
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#6c63ff';
        const accentRgb = window._particleColor || '108, 99, 255';

        const GRAVITY = 0.45;
        const JUMP = -7;
        const PIPE_W = 50;
        const GAP = 140;
        const PIPE_SPEED = 2.5;

        let bird = { x: 80, y: H / 2, vy: 0, size: 22 };
        let pipes = [];
        let score = 0;
        let flappyOver = false;
        let started = false;
        let animFrame;
        let pipeTimer = 0;

        function spawnPipe() {
            const topH = 60 + Math.random() * (H - GAP - 120);
            pipes.push({ x: W, topH, passed: false });
        }

        function drawFlappy() {
            // Sky gradient
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, '#0a0a14');
            grad.addColorStop(1, '#12121e');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Ground
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(0, H - 30, W, 30);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath(); ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30); ctx.stroke();

            // Pipes
            pipes.forEach(p => {
                ctx.fillStyle = accent;
                ctx.shadowColor = accent;
                ctx.shadowBlur = 6;
                // Top pipe
                ctx.beginPath();
                ctx.roundRect(p.x, 0, PIPE_W, p.topH, [0, 0, 8, 8]);
                ctx.fill();
                // Bottom pipe
                const bottomY = p.topH + GAP;
                ctx.beginPath();
                ctx.roundRect(p.x, bottomY, PIPE_W, H - bottomY - 30, [8, 8, 0, 0]);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Pipe caps
                ctx.fillStyle = `rgba(${accentRgb}, 0.7)`;
                ctx.fillRect(p.x - 4, p.topH - 16, PIPE_W + 8, 16);
                ctx.fillRect(p.x - 4, bottomY, PIPE_W + 8, 16);
            });
            ctx.shadowBlur = 0;

            // Bird — {CD} logo
            ctx.save();
            ctx.translate(bird.x, bird.y);
            const rotation = Math.min(Math.max(bird.vy * 3, -30), 45) * Math.PI / 180;
            ctx.rotate(rotation);
            // Glow
            ctx.shadowColor = accent;
            ctx.shadowBlur = 16;
            ctx.fillStyle = '#0a0a14';
            ctx.beginPath();
            ctx.roundRect(-bird.size, -bird.size / 1.3, bird.size * 2, bird.size * 1.5, 8);
            ctx.fill();
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
            // Text
            ctx.font = `bold ${bird.size * 0.7}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = accent;
            ctx.fillText('{', -bird.size * 0.45, 0);
            ctx.fillText('}', bird.size * 0.45, 0);
            ctx.fillStyle = '#fff';
            ctx.fillText('CD', 0, 0);
            ctx.restore();

            // Score text
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.font = 'bold 48px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(score, W / 2, 70);

            // Intro / Game over
            if (!started && !flappyOver) {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '14px "JetBrains Mono", monospace';
                ctx.fillText('SPACE / Click = Start', W / 2, H / 2 + 60);
            }
            if (flappyOver) {
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 28px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Game Over!', W / 2, H / 2 - 15);
                ctx.font = '14px "JetBrains Mono", monospace';
                ctx.fillStyle = accent;
                ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 15);
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '12px "JetBrains Mono", monospace';
                ctx.fillText('SPACE = Play Again', W / 2, H / 2 + 45);
            }
        }

        function updateFlappy() {
            if (!flappyOver && started) {
                bird.vy += GRAVITY;
                bird.y += bird.vy;

                pipeTimer++;
                if (pipeTimer % 90 === 0) spawnPipe();

                pipes.forEach(p => {
                    p.x -= PIPE_SPEED;
                    // Score
                    if (!p.passed && p.x + PIPE_W < bird.x) {
                        p.passed = true;
                        score++;
                        document.getElementById('flappyScore').textContent = score;
                    }
                    // Collision
                    if (bird.x + bird.size > p.x && bird.x - bird.size < p.x + PIPE_W) {
                        if (bird.y - bird.size / 1.3 < p.topH || bird.y + bird.size / 1.3 > p.topH + GAP) {
                            flappyOver = true;
                        }
                    }
                });
                pipes = pipes.filter(p => p.x + PIPE_W > -10);

                // Ground / ceiling
                if (bird.y + bird.size > H - 30 || bird.y - bird.size < 0) flappyOver = true;
            }
            drawFlappy();
            animFrame = requestAnimationFrame(updateFlappy);
        }

        function flap() {
            if (flappyOver) {
                bird = { x: 80, y: H / 2, vy: 0, size: 22 };
                pipes = []; score = 0; pipeTimer = 0;
                flappyOver = false; started = true;
                document.getElementById('flappyScore').textContent = 0;
                return;
            }
            if (!started) started = true;
            bird.vy = JUMP;
        }

        function flappyKey(e) {
            if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
            if (e.key === 'Escape') { closeFlappy(); return; }
            if (e.key === ' ') { flap(); }
        }

        function closeFlappy() {
            cancelAnimationFrame(animFrame);
            document.removeEventListener('keydown', flappyKey);
            canvas.removeEventListener('click', flap);
            document.body.style.overflow = '';
            overlay.remove();
        }

        document.addEventListener('keydown', flappyKey);
        canvas.addEventListener('click', flap);
        document.getElementById('flappyClose').addEventListener('click', closeFlappy);
        updateFlappy();
    }

    // =============================
    // 💻 Interactive Terminal Mode
    // Press ` (backtick) to open
    // =============================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2' && !document.getElementById('terminalOverlay') &&
            !document.getElementById('snakeOverlay') && !document.getElementById('pongOverlay') &&
            !document.getElementById('flappyOverlay') && !document.getElementById('matrixOverlay')) {
            e.preventDefault();
            launchTerminal();
        }
    });

    function launchTerminal() {
        const overlay = document.createElement('div');
        overlay.id = 'terminalOverlay';
        overlay.innerHTML = `
            <div class="terminal-window">
                <div class="terminal-titlebar">
                    <div class="terminal-dots">
                        <span class="dot red"></span>
                        <span class="dot yellow"></span>
                        <span class="dot green"></span>
                    </div>
                    <span class="terminal-title">cemil@portfolio:~</span>
                    <button class="terminal-close-btn" id="terminalCloseBtn"><i class="ph ph-x"></i></button>
                </div>
                <div class="terminal-body" id="terminalBody">
                    <div class="terminal-output" id="terminalOutput"></div>
                    <div class="terminal-input-line">
                        <span class="terminal-prompt">visitor@cmldlr.dev:~$</span>
                        <input type="text" class="terminal-input" id="terminalInput" autofocus autocomplete="off" spellcheck="false">
                        <span class="terminal-cursor-blink"></span>
                    </div>
                </div>
            </div>
            <div class="terminal-scanlines"></div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const output = document.getElementById('terminalOutput');
        const input = document.getElementById('terminalInput');
        const body = document.getElementById('terminalBody');
        let history = [];
        let historyIndex = -1;

        const data = PortfolioData.getData();

        // ASCII boot
        const asciiLogo = [
            '',
            '  ██████╗██████╗     ████████╗███████╗██████╗ ███╗   ███╗',
            ' ██╔════╝██╔══██╗    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║',
            ' ██║     ██║  ██║       ██║   █████╗  ██████╔╝██╔████╔██║',
            ' ██║     ██║  ██║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║',
            ' ╚██████╗██████╔╝       ██║   ███████╗██║  ██║██║ ╚═╝ ██║',
            '  ╚═════╝╚═════╝        ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝',
            ''
        ].join('\n');

        function print(text, cls = '') {
            const div = document.createElement('div');
            div.className = 'terminal-line ' + cls;
            div.innerHTML = text;
            output.appendChild(div);
            body.scrollTop = body.scrollHeight;
        }

        function printLines(lines, cls = '') {
            lines.forEach(l => print(l, cls));
        }

        // Boot sequence
        print(asciiLogo, 'terminal-ascii');
        print('<span class="t-accent">Cemil Dalar</span> — Interactive Portfolio Terminal v1.0', 'terminal-boot');
        print('Type <span class="t-cmd">help</span> to see available commands.', 'terminal-boot');
        print('Press <span class="t-muted">ESC</span> or type <span class="t-cmd">exit</span> to close.', 'terminal-boot');
        print('');

        const commands = {
            help: () => {
                printLines([
                    '<span class="t-accent">━━━ Available Commands ━━━</span>',
                    '',
                    '  <span class="t-cmd">whoami</span>      — Who am I?',
                    '  <span class="t-cmd">about</span>       — About me',
                    '  <span class="t-cmd">skills</span>      — Technical skills',
                    '  <span class="t-cmd">projects</span>    — Project portfolio',
                    '  <span class="t-cmd">contact</span>     — Get in touch',
                    '  <span class="t-cmd">neofetch</span>    — System info',
                    '  <span class="t-cmd">ls</span>          — List sections',
                    '  <span class="t-cmd">cd &lt;section&gt;</span> — Navigate to section',
                    '  <span class="t-cmd">cat readme</span>  — Read the README',
                    '  <span class="t-cmd">games</span>       — Hidden games list',
                    '  <span class="t-cmd">theme</span>       — Toggle dark/light',
                    '  <span class="t-cmd">clear</span>       — Clear terminal',
                    '  <span class="t-cmd">exit</span>        — Close terminal',
                    ''
                ]);
            },

            whoami: () => {
                print(`<span class="t-accent">${data.hero.name}</span> — ${data.hero.roles[0]}`);
                print(`${data.hero.roles.join(' • ')}`);
            },

            about: () => {
                print('<span class="t-accent">━━━ About ━━━</span>');
                data.about.paragraphs.forEach(p => {
                    print(p.replace(/<\/?strong>/g, ''));
                });
                print('');
                data.about.details.forEach(d => {
                    print(`  <span class="t-muted">${d.label}:</span> ${d.value}`);
                });
            },

            skills: () => {
                print('<span class="t-accent">━━━ Skills ━━━</span>');
                data.skills.forEach(cat => {
                    print(`\n  <span class="t-cmd">[${cat.category}]</span>`);
                    cat.items.forEach(s => {
                        const bar = '█'.repeat(Math.round(s.level / 10)) + '░'.repeat(10 - Math.round(s.level / 10));
                        print(`    ${s.name.padEnd(16)} ${bar} ${s.level}%`);
                    });
                });
            },

            projects: () => {
                print('<span class="t-accent">━━━ Projects ━━━</span>');
                const visible = data.projects.filter(p => p.visible);
                visible.forEach((p, i) => {
                    const star = p.featured ? ' ⭐' : '';
                    print(`\n  <span class="t-cmd">${i + 1}. ${p.title}${star}</span>`);
                    print(`     ${p.description}`);
                    print(`     <span class="t-muted">[${p.tech.join(', ')}]</span>`);
                    if (p.github) print(`     <span class="t-link">→ ${p.github}</span>`);
                });
            },

            contact: () => {
                print('<span class="t-accent">━━━ Contact ━━━</span>');
                print(`  ${data.contact.heading}`);
                print(`  ${data.contact.description}`);
                print('');
                data.contact.links.forEach(l => {
                    print(`  <span class="t-cmd">${l.label}</span>: <span class="t-link">${l.url}</span>`);
                });
            },

            neofetch: () => {
                const theme = document.documentElement.getAttribute('data-theme') || 'dark';
                const lang = I18n.getLang().toUpperCase();
                const skills = data.skills.reduce((acc, c) => acc + c.items.length, 0);
                const projects = data.projects.filter(p => p.visible).length;
                printLines([
                    '',
                    '  <span class="t-accent">    {CD}</span>         <span class="t-cmd">cemil@portfolio</span>',
                    '  <span class="t-accent">   {  CD  }</span>      ─────────────────',
                    '  <span class="t-accent">  {   CD   }</span>     <span class="t-muted">OS:</span> Portfolio v1.0',
                    '  <span class="t-accent"> {    CD    }</span>    <span class="t-muted">Host:</span> cmldlr.dev',
                    '  <span class="t-accent">  {   CD   }</span>     <span class="t-muted">Theme:</span> ' + theme,
                    '  <span class="t-accent">   {  CD  }</span>      <span class="t-muted">Language:</span> ' + lang,
                    '  <span class="t-accent">    {CD}</span>         <span class="t-muted">Skills:</span> ' + skills + ' technologies',
                    '                     <span class="t-muted">Projects:</span> ' + projects + ' visible',
                    '                     <span class="t-muted">Games:</span> 4 hidden',
                    '                     <span class="t-muted">Shell:</span> portfolio-sh',
                    '                     <span class="t-muted">Uptime:</span> ' + new Date().toLocaleTimeString(),
                    '',
                    '  <span style="background:#f43f5e;color:#f43f5e">██</span><span style="background:#f59e0b;color:#f59e0b">██</span><span style="background:#4ade80;color:#4ade80">██</span><span style="background:#3b82f6;color:#3b82f6">██</span><span style="background:#6c63ff;color:#6c63ff">██</span><span style="background:#a78bfa;color:#a78bfa">██</span><span style="background:#22d3ee;color:#22d3ee">██</span><span style="background:#fff;color:#fff">██</span>',
                    ''
                ]);
            },

            ls: () => {
                printLines([
                    '<span class="t-muted">drwxr-xr-x</span>  <span class="t-cmd">about/</span>         <span class="t-cmd">skills/</span>        <span class="t-cmd">projects/</span>',
                    '<span class="t-muted">drwxr-xr-x</span>  <span class="t-cmd">certificates/</span>  <span class="t-cmd">contact/</span>',
                    '<span class="t-muted">-rw-r--r--</span>  <span class="t-accent">README.md</span>      <span class="t-accent">.secret</span>        <span class="t-accent">games.sh</span>'
                ]);
            },

            clear: () => { output.innerHTML = ''; },

            'cat readme': () => {
                printLines([
                    '<span class="t-accent">━━━ README.md ━━━</span>',
                    '',
                    '# Cemil Dalar — Portfolio',
                    '',
                    'Welcome to my interactive portfolio!',
                    'This isn\'t your average developer website.',
                    '',
                    'You found the hidden terminal — impressive! 🎉',
                    '',
                    'Pro tips:',
                    '  • Try <span class="t-cmd">neofetch</span> for system info',
                    '  • Type <span class="t-cmd">games</span> to discover hidden games',
                    '  • Try <span class="t-cmd">sudo hire cemil</span> if you dare',
                    '  • Navigate with <span class="t-cmd">cd about</span>',
                    ''
                ]);
            },

            'cat .secret': () => {
                printLines([
                    '',
                    '🔑 You found the secret file!',
                    '',
                    '  Konami Code: ↑↑↓↓←→←→BA → Snake',
                    '  Type "matrix" → Matrix Rain',
                    '  Type "fly" → Flappy {CD}',
                    '  Click footer 5x → Pong',
                    '  Press F2 → This terminal',
                    '',
                    '  You\'re clearly a curious developer. I like that. 😎',
                    ''
                ]);
            },

            games: () => {
                printLines([
                    '<span class="t-accent">━━━ Hidden Games ━━━</span>',
                    '',
                    '  🐍 <span class="t-cmd">Snake</span>       — Konami Code: ↑↑↓↓←→←→BA',
                    '  🟢 <span class="t-cmd">Matrix</span>      — Type "matrix" anywhere',
                    '  🏓 <span class="t-cmd">Pong</span>        — Click footer 5 times',
                    '  🐦 <span class="t-cmd">Flappy {CD}</span> — Type "fly" anywhere',
                    '',
                    '  Close terminal first, then activate a game!',
                    ''
                ]);
            },

            'sudo hire cemil': () => {
                printLines([
                    '',
                    '  <span class="t-accent">🎉 EXCELLENT CHOICE! 🎉</span>',
                    '',
                    '  Processing hiring request...',
                    '  ████████████████████ 100%',
                    '',
                    '  ✅ Request approved!',
                    '  📧 Contact: cemil@cmldlr.dev',
                    '  🔗 LinkedIn: linkedin.com/in/cmldlr',
                    '  🐙 GitHub: github.com/cmldlr',
                    '',
                    '  Let\'s build something amazing together! 🚀',
                    ''
                ]);
            },

            theme: () => {
                const curr = document.documentElement.getAttribute('data-theme') || 'dark';
                const next = curr === 'dark' ? 'light' : 'dark';
                document.getElementById('themeToggle').click();
                print(`Theme switched to <span class="t-cmd">${next}</span>`);
            },

            lang: () => {
                document.getElementById('langToggle').click();
                print(`Language switched to <span class="t-cmd">${I18n.getLang().toUpperCase()}</span>`);
            },

            exit: () => { closeTerminal(); }
        };

        // CD command handler
        function handleCd(section) {
            const valid = ['about', 'skills', 'projects', 'certificates', 'contact', 'github-activity'];
            if (valid.includes(section)) {
                closeTerminal();
                setTimeout(() => {
                    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                print(`<span class="t-error">cd: ${section}: No such section</span>`);
                print(`Valid: ${valid.join(', ')}`);
            }
        }

        function executeCommand(cmd) {
            const trimmed = cmd.trim().toLowerCase();
            print(`<span class="terminal-prompt">visitor@cmldlr.dev:~$</span> ${esc(cmd)}`);

            if (!trimmed) return;

            history.push(cmd);
            historyIndex = history.length;

            if (commands[trimmed]) {
                commands[trimmed]();
            } else if (trimmed.startsWith('cd ')) {
                handleCd(trimmed.slice(3).trim());
            } else if (trimmed.startsWith('cat ')) {
                const file = trimmed;
                if (commands[file]) commands[file]();
                else print(`<span class="t-error">cat: ${trimmed.slice(4)}: No such file</span>`);
            } else if (trimmed === 'sudo' || trimmed.startsWith('sudo ')) {
                if (trimmed === 'sudo hire cemil') {
                    commands['sudo hire cemil']();
                } else {
                    print(`<span class="t-error">${esc(cmd)}: permission denied. Try "sudo hire cemil" 😏</span>`);
                }
            } else if (trimmed === 'pwd') {
                print('/home/visitor/cmldlr.dev');
            } else if (trimmed === 'date') {
                print(new Date().toString());
            } else if (trimmed === 'echo' || trimmed.startsWith('echo ')) {
                print(esc(cmd.slice(5)));
            } else if (trimmed === 'rm -rf /') {
                print('Nice try 😄 This portfolio is indestructible!');
            } else {
                print(`<span class="t-error">command not found: ${esc(trimmed)}</span>`);
                print('Type <span class="t-cmd">help</span> for available commands.');
            }
        }

        // Tab completion
        const allCmds = ['help', 'whoami', 'about', 'skills', 'projects', 'contact', 'neofetch', 'ls', 'cd', 'cat readme', 'cat .secret', 'clear', 'games', 'theme', 'lang', 'exit', 'sudo hire cemil', 'pwd', 'date', 'echo'];

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                executeCommand(input.value);
                input.value = '';
            } else if (e.key === 'Escape') {
                closeTerminal();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (historyIndex > 0) { historyIndex--; input.value = history[historyIndex]; }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex < history.length - 1) { historyIndex++; input.value = history[historyIndex]; }
                else { historyIndex = history.length; input.value = ''; }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                const val = input.value.toLowerCase();
                const match = allCmds.find(c => c.startsWith(val) && c !== val);
                if (match) input.value = match;
            } else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                output.innerHTML = '';
            }
        });

        // Focus input on click
        overlay.addEventListener('click', () => input.focus());
        input.focus();

        function closeTerminal() {
            document.body.style.overflow = '';
            overlay.remove();
        }

        document.getElementById('terminalCloseBtn').addEventListener('click', closeTerminal);
    }

    // =============================
    // Utility
    // =============================
    function esc(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
});
