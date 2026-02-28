/**
 * Admin Panel — Unified Single-Page Logic
 * Handles login, transitions, CRUD, GitHub API
 */

document.addEventListener('DOMContentLoaded', () => {
    // =============================
    // Elements
    // =============================
    const body = document.body;
    const otpStep1 = document.getElementById('otpStep1');
    const otpStep2 = document.getElementById('otpStep2');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const sendError = document.getElementById('sendError');
    const verifyOtpForm = document.getElementById('verifyOtpForm');
    const verifyError = document.getElementById('verifyError');
    const otpDigits = document.querySelectorAll('.otp-digit');
    const otpCountdown = document.getElementById('otpCountdown');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const resendCooldown = document.getElementById('resendCooldown');

    let otpTimerInterval = null;
    let cooldownInterval = null;

    // =============================
    // 1. View Transitions
    // =============================

    // Show login overlay (blur portfolio behind)
    window.showLogin = function () {
        body.classList.remove('show-admin');
        body.classList.add('show-login');
        // Reset to step 1
        otpStep1.style.display = 'block';
        otpStep2.style.display = 'none';
        sendError.textContent = '';
        verifyError.textContent = '';
        otpDigits.forEach(d => d.value = '');
    };

    // Show admin panel (slide from right)
    window.showAdmin = function () {
        body.classList.remove('show-login');
        body.classList.add('show-admin');
        clearTimers();
        renderCurrentPage();
    };

    // Back to portfolio
    window.showPortfolio = function () {
        body.classList.remove('show-login');
        body.classList.remove('show-admin');
        clearTimers();
        if (typeof window.refreshPortfolio === 'function') {
            window.refreshPortfolio();
        }
    };

    function clearTimers() {
        if (otpTimerInterval) { clearInterval(otpTimerInterval); otpTimerInterval = null; }
        if (cooldownInterval) { clearInterval(cooldownInterval); cooldownInterval = null; }
    }

    // Check if already authenticated — if URL has #admin, go directly
    if (window.location.hash === '#admin') {
        if (PortfolioAuth.isAuthenticated()) {
            showAdmin();
        } else {
            showLogin();
        }
    }

    // =============================
    // 2. OTP Login Flow
    // =============================

    // Step 1: Send OTP
    sendOtpBtn.addEventListener('click', async () => {
        sendError.textContent = '';
        sendOtpBtn.disabled = true;
        sendOtpBtn.querySelector('span').textContent = 'Gönderiliyor...';

        try {
            await PortfolioAuth.sendOTP();
            // Move to step 2
            otpStep1.style.display = 'none';
            otpStep2.style.display = 'block';
            otpDigits[0].focus();
            startOtpTimer();
            startCooldownTimer();
        } catch (err) {
            sendError.textContent = err.message;
        } finally {
            sendOtpBtn.disabled = false;
            sendOtpBtn.querySelector('span').textContent = 'Doğrulama Kodu Gönder';
        }
    });

    // Step 2: OTP digit inputs — auto-advance, paste, backspace
    otpDigits.forEach((input, i) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = val;
            if (val && i < otpDigits.length - 1) {
                otpDigits[i + 1].focus();
            }
            // Auto-submit when all filled
            if (getOtpValue().length === 6) {
                verifyOtpForm.dispatchEvent(new Event('submit'));
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && i > 0) {
                otpDigits[i - 1].focus();
                otpDigits[i - 1].value = '';
            }
        });

        // Handle paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6);
            paste.split('').forEach((ch, idx) => {
                if (otpDigits[idx]) otpDigits[idx].value = ch;
            });
            if (paste.length === 6) {
                otpDigits[5].focus();
                verifyOtpForm.dispatchEvent(new Event('submit'));
            } else if (paste.length > 0) {
                otpDigits[Math.min(paste.length, 5)].focus();
            }
        });
    });

    function getOtpValue() {
        return Array.from(otpDigits).map(d => d.value).join('');
    }

    // Submit OTP
    verifyOtpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        verifyError.textContent = '';
        const code = getOtpValue();

        if (code.length !== 6) {
            verifyError.textContent = 'Lütfen 6 haneli kodu girin.';
            return;
        }

        if (PortfolioAuth.isOTPExpired()) {
            verifyError.textContent = 'Kodun süresi doldu. Yeni kod gönderin.';
            return;
        }

        const success = PortfolioAuth.verifyOTP(code);
        if (success) {
            showAdmin();
            toast('Giriş başarılı', 'success');
        } else {
            verifyError.textContent = 'Geçersiz kod. Tekrar deneyin.';
            otpDigits.forEach(d => d.value = '');
            otpDigits[0].focus();
        }
    });

    // Resend OTP
    resendOtpBtn.addEventListener('click', async () => {
        if (PortfolioAuth.getCooldownRemaining() > 0) return;
        verifyError.textContent = '';
        resendOtpBtn.disabled = true;

        try {
            await PortfolioAuth.sendOTP();
            otpDigits.forEach(d => d.value = '');
            otpDigits[0].focus();
            startOtpTimer();
            startCooldownTimer();
            toast('Yeni kod gönderildi', 'success');
        } catch (err) {
            verifyError.textContent = err.message;
        }
    });

    // OTP expiry countdown timer (5 min)
    function startOtpTimer() {
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        otpTimerInterval = setInterval(() => {
            const rem = PortfolioAuth.getOTPTimeRemaining();
            const min = Math.floor(rem / 60);
            const sec = rem % 60;
            otpCountdown.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
            if (rem <= 0) {
                clearInterval(otpTimerInterval);
                otpCountdown.textContent = 'Süre doldu';
                otpCountdown.parentElement.style.color = 'var(--red, #ff5f57)';
            }
        }, 1000);
    }

    // Resend cooldown timer (60s)
    function startCooldownTimer() {
        resendOtpBtn.disabled = true;
        if (cooldownInterval) clearInterval(cooldownInterval);
        cooldownInterval = setInterval(() => {
            const rem = PortfolioAuth.getCooldownRemaining();
            resendCooldown.textContent = rem;
            if (rem <= 0) {
                clearInterval(cooldownInterval);
                resendOtpBtn.disabled = false;
                resendOtpBtn.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Tekrar Gönder';
            }
        }, 1000);
    }

    // Login back button
    document.getElementById('loginBackBtn').addEventListener('click', () => showPortfolio());

    // Admin back button (sidebar logo)
    document.getElementById('adminBackBtn').addEventListener('click', () => showPortfolio());

    // Preview button
    document.getElementById('previewBtn').addEventListener('click', () => showPortfolio());

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        PortfolioAuth.logout();
        showPortfolio();
        toast('Çıkış yapıldı', 'success');
    });

    // Escape key closes login
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (body.classList.contains('show-login')) {
                showPortfolio();
            }
        }
    });

    // =============================
    // 3. Sidebar Navigation
    // =============================
    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-page]');
    const topbarTitle = document.getElementById('topbarTitle');
    const pageTitles = {
        projects: 'Projeler', skills: 'Yetenekler', experience: 'Deneyim',
        about: 'Hakkımda', hero: 'Hero Bölümü', contact: 'İletişim', settings: 'Ayarlar'
    };

    let currentPage = 'projects';

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            currentPage = link.getAttribute('data-page');
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            topbarTitle.textContent = pageTitles[currentPage] || currentPage;
            document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-' + currentPage).classList.add('active');
            renderCurrentPage();
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    function renderCurrentPage() {
        switch (currentPage) {
            case 'projects': renderProjectsPage(); break;
            case 'skills': renderSkillsPage(); break;
            case 'experience': renderExperiencePage(); break;
            case 'about': renderAboutPage(); break;
            case 'hero': renderHeroPage(); break;
            case 'contact': renderContactPage(); break;
        }
    }

    // =============================
    // 4. Projects Page
    // =============================
    function renderProjectsPage() {
        const data = PortfolioData.getData();
        const list = document.getElementById('projectsList');

        if (data.projects.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">Henüz proje eklenmedi.</p>';
            return;
        }

        list.innerHTML = data.projects.map(p => `
            <div class="project-admin-card ${p.visible ? '' : 'hidden-project'}" data-id="${p.id}">
                <div class="project-admin-drag" title="Sürükle"><i class="ph ph-dots-six-vertical"></i></div>
                <div class="project-admin-toggle ${p.visible ? 'on' : ''}" data-id="${p.id}" title="${p.visible ? 'Gizle' : 'Göster'}"></div>
                <div class="project-admin-info">
                    <div class="project-admin-title">${esc(p.title)}</div>
                    <div class="project-admin-meta">
                        ${p.tech.slice(0, 4).map(t => `<span>${esc(t)}</span>`).join('')}
                        ${p.fromGithub ? '<span style="background:rgba(74,222,128,0.1);color:#4ade80">GitHub</span>' : ''}
                    </div>
                </div>
                <div class="project-admin-actions">
                    <button class="btn-ghost" onclick="editProject('${p.id}')" title="Düzenle"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-ghost" onclick="deleteProject('${p.id}')" title="Sil"><i class="ph ph-trash"></i></button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.project-admin-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                PortfolioData.toggleProjectVisibility(toggle.getAttribute('data-id'));
                renderProjectsPage();
                toast('Görünürlük güncellendi', 'success');
            });
        });
    }

    document.getElementById('addProjectBtn').addEventListener('click', () => openProjectModal());

    document.getElementById('fetchGithubBtn').addEventListener('click', async () => {
        openModal('GitHub Repoları', '<p style="color:var(--text-secondary);text-align:center;padding:20px"><i class="ph ph-spinner" style="animation:spin 1s linear infinite;display:inline-block"></i> Yükleniyor...</p><style>@keyframes spin{to{transform:rotate(360deg)}}</style>');
        try {
            const resp = await fetch('https://api.github.com/users/cmldlr/repos?sort=updated&per_page=50');
            if (!resp.ok) throw new Error('GitHub API hatası');
            const repos = await resp.json();
            const data = PortfolioData.getData();
            const existingUrls = data.projects.filter(p => p.fromGithub).map(p => p.github);

            let html = '<div class="github-repo-list">';
            repos.forEach(repo => {
                const isAdded = existingUrls.includes(repo.html_url);
                html += `<label class="github-repo-item ${isAdded ? 'selected' : ''}">
                    <input type="checkbox" value="${repo.full_name}" data-url="${repo.html_url}" data-name="${esc(repo.name)}" data-lang="${repo.language || ''}" ${isAdded ? 'checked' : ''}>
                    <span class="github-repo-name">${esc(repo.name)}</span>
                    ${repo.language ? `<span class="github-repo-lang">${repo.language}</span>` : ''}
                </label>`;
            });
            html += '</div><div class="modal-footer"><button class="btn btn-primary btn-sm" id="importGithubBtn"><i class="ph ph-check"></i> Seçilenleri Ekle</button></div>';
            document.getElementById('modalBody').innerHTML = html;

            document.getElementById('importGithubBtn').addEventListener('click', () => {
                const checked = document.querySelectorAll('.github-repo-item input:checked');
                let added = 0;
                checked.forEach(cb => {
                    const url = cb.getAttribute('data-url');
                    if (!data.projects.find(p => p.github === url)) {
                        const name = cb.getAttribute('data-name');
                        const lang = cb.getAttribute('data-lang');
                        PortfolioData.addProject({
                            id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                            title: name.replace(/-/g, ' '),
                            description: '', icon: iconForLang(lang),
                            tags: tagsForLang(lang), tech: lang ? [lang] : [],
                            github: url, featured: false, visible: true, fromGithub: true
                        });
                        added++;
                    }
                });
                closeModal();
                renderProjectsPage();
                toast(`${added} proje eklendi`, 'success');
            });
        } catch (err) {
            document.getElementById('modalBody').innerHTML = `<p style="color:var(--red);text-align:center;padding:20px">${err.message}</p>`;
        }
    });

    window.editProject = function (id) {
        const p = PortfolioData.getData().projects.find(pr => pr.id === id);
        if (p) openProjectModal(p);
    };
    window.deleteProject = function (id) {
        if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
            PortfolioData.removeProject(id);
            renderProjectsPage();
            toast('Proje silindi', 'success');
        }
    };

    function openProjectModal(p = null) {
        const isEdit = !!p;
        const html = `
            <div class="form-group"><label>Başlık</label><input type="text" id="projTitle" value="${isEdit ? esc(p.title) : ''}"></div>
            <div class="form-group"><label>Açıklama</label><textarea id="projDesc" rows="3">${isEdit ? esc(p.description) : ''}</textarea></div>
            <div class="form-group"><label>İkon (ör: ph-factory)</label><input type="text" id="projIcon" value="${isEdit ? esc(p.icon) : 'ph-folder'}"></div>
            <div class="form-group"><label>GitHub URL</label><input type="url" id="projGithub" value="${isEdit ? esc(p.github) : ''}"></div>
            <div class="form-group"><label>Teknolojiler (virgülle)</label><input type="text" id="projTech" value="${isEdit ? p.tech.join(', ') : ''}"></div>
            <div class="form-group"><label>Etiketler (featured, web, java, csharp, python)</label><input type="text" id="projTags" value="${isEdit ? p.tags.join(', ') : ''}"></div>
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
                <input type="checkbox" id="projFeatured" ${isEdit && p.featured ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent-primary)">
                <label for="projFeatured" style="margin:0">Öne Çıkan</label>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline btn-sm" onclick="closeModal()">İptal</button>
                <button class="btn btn-primary btn-sm" id="saveProjectBtn"><i class="ph ph-check"></i> ${isEdit ? 'Güncelle' : 'Ekle'}</button>
            </div>`;
        openModal(isEdit ? 'Proje Düzenle' : 'Yeni Proje', html);
        document.getElementById('saveProjectBtn').addEventListener('click', () => {
            const title = document.getElementById('projTitle').value.trim();
            if (!title) { toast('Başlık gerekli', 'error'); return; }
            const obj = {
                title, description: document.getElementById('projDesc').value.trim(),
                icon: document.getElementById('projIcon').value.trim() || 'ph-folder',
                github: document.getElementById('projGithub').value.trim(),
                tech: document.getElementById('projTech').value.split(',').map(s => s.trim()).filter(Boolean),
                tags: document.getElementById('projTags').value.split(',').map(s => s.trim()).filter(Boolean),
                featured: document.getElementById('projFeatured').checked,
                visible: true, fromGithub: false
            };
            if (isEdit) { PortfolioData.updateProject(p.id, obj); }
            else { obj.id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-'); PortfolioData.addProject(obj); }
            closeModal(); renderProjectsPage();
            toast(isEdit ? 'Güncellendi' : 'Eklendi', 'success');
        });
    }

    // =============================
    // 5. Skills Page
    // =============================
    function renderSkillsPage() {
        const skills = PortfolioData.getSection('skills') || [];
        document.getElementById('skillsList').innerHTML = skills.map((cat, ci) => `
            <div class="skill-admin-card">
                <div class="skill-admin-header">
                    <h4><i class="ph ${cat.icon}"></i> ${esc(cat.title)}</h4>
                    <div>
                        <button class="btn-ghost" onclick="editSkillCat(${ci})"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn-ghost" onclick="delSkillCat(${ci})"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
                <div class="skill-admin-tags">
                    ${cat.tags.map((t, ti) => `<div class="skill-admin-tag"><span>${esc(t.name)}</span>
                        <select onchange="setSkillLvl(${ci},${ti},this.value)">
                            <option value="beginner" ${t.level === 'beginner' ? 'selected' : ''}>Başlangıç</option>
                            <option value="intermediate" ${t.level === 'intermediate' ? 'selected' : ''}>Orta</option>
                            <option value="advanced" ${t.level === 'advanced' ? 'selected' : ''}>İleri</option>
                        </select>
                        <button onclick="rmSkillTag(${ci},${ti})"><i class="ph ph-x"></i></button>
                    </div>`).join('')}
                    <button class="btn-ghost" onclick="addSkillTag(${ci})" style="font-size:0.8rem"><i class="ph ph-plus"></i> Ekle</button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('addSkillCategoryBtn').addEventListener('click', () => {
        const html = `<div class="form-group"><label>Kategori Adı</label><input type="text" id="catTitle"></div>
            <div class="form-group"><label>İkon</label><input type="text" id="catIcon" value="ph-code"></div>
            <div class="modal-footer"><button class="btn btn-outline btn-sm" onclick="closeModal()">İptal</button>
            <button class="btn btn-primary btn-sm" id="saveCatBtn"><i class="ph ph-check"></i> Ekle</button></div>`;
        openModal('Yeni Kategori', html);
        document.getElementById('saveCatBtn').addEventListener('click', () => {
            const title = document.getElementById('catTitle').value.trim();
            if (!title) return;
            const skills = PortfolioData.getSection('skills') || [];
            skills.push({ id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), icon: document.getElementById('catIcon').value.trim(), title, tags: [] });
            PortfolioData.saveSection('skills', skills);
            closeModal(); renderSkillsPage(); toast('Eklendi', 'success');
        });
    });

    window.editSkillCat = function (ci) {
        const s = PortfolioData.getSection('skills'); const cat = s[ci];
        const html = `<div class="form-group"><label>Ad</label><input type="text" id="catTitle" value="${esc(cat.title)}"></div>
            <div class="form-group"><label>İkon</label><input type="text" id="catIcon" value="${esc(cat.icon)}"></div>
            <div class="modal-footer"><button class="btn btn-outline btn-sm" onclick="closeModal()">İptal</button>
            <button class="btn btn-primary btn-sm" id="saveCEBtn"><i class="ph ph-check"></i> Güncelle</button></div>`;
        openModal('Kategori Düzenle', html);
        document.getElementById('saveCEBtn').addEventListener('click', () => {
            s[ci].title = document.getElementById('catTitle').value.trim();
            s[ci].icon = document.getElementById('catIcon').value.trim();
            PortfolioData.saveSection('skills', s); closeModal(); renderSkillsPage(); toast('Güncellendi', 'success');
        });
    };
    window.delSkillCat = function (ci) { if (!confirm('Silmek istediğinize emin misiniz?')) return; const s = PortfolioData.getSection('skills'); s.splice(ci, 1); PortfolioData.saveSection('skills', s); renderSkillsPage(); toast('Silindi', 'success'); };
    window.addSkillTag = function (ci) { const n = prompt('Yetenek adı:'); if (!n) return; const s = PortfolioData.getSection('skills'); s[ci].tags.push({ name: n.trim(), level: 'intermediate' }); PortfolioData.saveSection('skills', s); renderSkillsPage(); };
    window.rmSkillTag = function (ci, ti) { const s = PortfolioData.getSection('skills'); s[ci].tags.splice(ti, 1); PortfolioData.saveSection('skills', s); renderSkillsPage(); };
    window.setSkillLvl = function (ci, ti, l) { const s = PortfolioData.getSection('skills'); s[ci].tags[ti].level = l; PortfolioData.saveSection('skills', s); };

    // =============================
    // 6. Experience Page
    // =============================
    function renderExperiencePage() {
        const exp = PortfolioData.getSection('experience') || [];
        document.getElementById('experienceList').innerHTML = exp.map((e, i) => `
            <div class="exp-admin-card">
                <div class="skill-admin-header">
                    <h4>${esc(e.title)} <span style="color:var(--accent-secondary);font-size:0.8rem;font-family:var(--font-mono);margin-left:8px">${esc(e.date)}</span></h4>
                    <div>
                        <button class="btn-ghost" onclick="editExp(${i})"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn-ghost" onclick="delExp(${i})"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
                <p style="color:var(--accent-primary);font-size:0.9rem;font-weight:600;margin-bottom:4px">${esc(e.company)}</p>
                <p style="color:var(--text-secondary);font-size:0.85rem">${esc(e.description).substring(0, 120)}...</p>
            </div>
        `).join('');
    }

    document.getElementById('addExperienceBtn').addEventListener('click', () => openExpModal());
    window.editExp = function (i) { openExpModal(PortfolioData.getSection('experience')[i], i); };
    window.delExp = function (i) { if (!confirm('Silmek istediğinize emin misiniz?')) return; const e = PortfolioData.getSection('experience'); e.splice(i, 1); PortfolioData.saveSection('experience', e); renderExperiencePage(); toast('Silindi', 'success'); };

    function openExpModal(e = null, idx = -1) {
        const isE = !!e;
        const html = `
            <div class="form-group"><label>Başlık</label><input type="text" id="expTitle" value="${isE ? esc(e.title) : ''}"></div>
            <div class="form-group"><label>Tarih</label><input type="text" id="expDate" value="${isE ? esc(e.date) : ''}"></div>
            <div class="form-group"><label>Şirket</label><input type="text" id="expComp" value="${isE ? esc(e.company) : ''}"></div>
            <div class="form-group"><label>Açıklama</label><textarea id="expDesc" rows="4">${isE ? esc(e.description) : ''}</textarea></div>
            <div class="form-group"><label>Teknolojiler (virgülle)</label><input type="text" id="expTech" value="${isE ? e.tech.join(', ') : ''}"></div>
            <div class="modal-footer"><button class="btn btn-outline btn-sm" onclick="closeModal()">İptal</button>
            <button class="btn btn-primary btn-sm" id="saveExpBtn"><i class="ph ph-check"></i> ${isE ? 'Güncelle' : 'Ekle'}</button></div>`;
        openModal(isE ? 'Deneyim Düzenle' : 'Yeni Deneyim', html);
        document.getElementById('saveExpBtn').addEventListener('click', () => {
            const exp = PortfolioData.getSection('experience') || [];
            const obj = {
                id: document.getElementById('expTitle').value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                title: document.getElementById('expTitle').value.trim(),
                date: document.getElementById('expDate').value.trim(),
                company: document.getElementById('expComp').value.trim(),
                description: document.getElementById('expDesc').value.trim(),
                tech: document.getElementById('expTech').value.split(',').map(s => s.trim()).filter(Boolean)
            };
            if (!obj.title) { toast('Başlık gerekli', 'error'); return; }
            if (isE && idx >= 0) exp[idx] = obj; else exp.push(obj);
            PortfolioData.saveSection('experience', exp);
            closeModal(); renderExperiencePage(); toast(isE ? 'Güncellendi' : 'Eklendi', 'success');
        });
    }

    // =============================
    // 7. About Page
    // =============================
    function renderAboutPage() {
        const about = PortfolioData.getSection('about');
        document.getElementById('aboutEditor').innerHTML = `
            <div class="editor-card">
                <h4><i class="ph ph-text-align-left"></i> Paragraflar</h4>
                ${about.paragraphs.map((p, i) => `<div class="form-group"><label>Paragraf ${i + 1}</label><textarea class="about-para" data-i="${i}" rows="3">${esc(p.replace(/<\/?strong>/g, ''))}</textarea></div>`).join('')}
                <button class="btn btn-outline btn-sm" id="addParaBtn"><i class="ph ph-plus"></i> Ekle</button>
            </div>
            <div class="editor-card">
                <h4><i class="ph ph-identification-card"></i> Detay Kartları</h4>
                ${about.details.map((d, i) => `<div class="form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
                    <div><label>İkon</label><input type="text" class="di" data-i="${i}" value="${esc(d.icon)}"></div>
                    <div><label>Başlık</label><input type="text" class="dl" data-i="${i}" value="${esc(d.label)}"></div>
                    <div><label>Değer</label><input type="text" class="dv" data-i="${i}" value="${esc(d.value)}"></div>
                </div>`).join('')}
            </div>
            <div class="editor-actions"><button class="btn btn-primary btn-sm" id="saveAboutBtn"><i class="ph ph-check"></i> Kaydet</button></div>`;

        document.getElementById('addParaBtn').addEventListener('click', () => { about.paragraphs.push(''); PortfolioData.saveSection('about', about); renderAboutPage(); });
        document.getElementById('saveAboutBtn').addEventListener('click', () => {
            about.paragraphs = Array.from(document.querySelectorAll('.about-para')).map(e => e.value.trim()).filter(Boolean);
            about.details = Array.from(document.querySelectorAll('.di')).map((el, i) => ({
                icon: el.value.trim(), label: document.querySelectorAll('.dl')[i].value.trim(), value: document.querySelectorAll('.dv')[i].value.trim()
            }));
            PortfolioData.saveSection('about', about); toast('Kaydedildi', 'success');
        });
    }

    // =============================
    // 8. Hero Page
    // =============================
    function renderHeroPage() {
        const hero = PortfolioData.getSection('hero');
        document.getElementById('heroEditor').innerHTML = `
            <div class="editor-card">
                <h4><i class="ph ph-star"></i> İçerik</h4>
                <div class="form-group"><label>Karşılama</label><input type="text" id="hGreet" value="${esc(hero.greeting)}"></div>
                <div class="form-group"><label>İsim</label><input type="text" id="hName" value="${esc(hero.name)}"></div>
                <div class="form-group"><label>Açıklama (HTML)</label><textarea id="hDesc" rows="3">${esc(hero.description)}</textarea></div>
                <div class="form-group"><label>Badge</label><input type="text" id="hBadge" value="${esc(hero.badge)}"></div>
                <div class="form-group"><label>Roller (her satıra bir)</label><textarea id="hRoles" rows="4">${hero.roles.join('\n')}</textarea></div>
            </div>
            <div class="editor-card">
                <h4><i class="ph ph-chart-bar"></i> İstatistikler</h4>
                ${hero.stats.map((s, i) => `<div class="form-group" style="display:grid;grid-template-columns:1fr 2fr;gap:8px">
                    <div><label>Sayı</label><input type="number" class="sn" data-i="${i}" value="${s.number}"></div>
                    <div><label>Etiket</label><input type="text" class="sl" data-i="${i}" value="${esc(s.label)}"></div>
                </div>`).join('')}
            </div>
            <div class="editor-actions"><button class="btn btn-primary btn-sm" id="saveHeroBtn"><i class="ph ph-check"></i> Kaydet</button></div>`;

        document.getElementById('saveHeroBtn').addEventListener('click', () => {
            hero.greeting = document.getElementById('hGreet').value.trim();
            hero.name = document.getElementById('hName').value.trim();
            hero.description = document.getElementById('hDesc').value.trim();
            hero.badge = document.getElementById('hBadge').value.trim();
            hero.roles = document.getElementById('hRoles').value.split('\n').map(s => s.trim()).filter(Boolean);
            hero.stats = Array.from(document.querySelectorAll('.sn')).map((el, i) => ({
                number: parseInt(el.value) || 0, label: document.querySelectorAll('.sl')[i].value.trim()
            }));
            PortfolioData.saveSection('hero', hero); toast('Kaydedildi', 'success');
        });
    }

    // =============================
    // 9. Contact Page
    // =============================
    function renderContactPage() {
        const c = PortfolioData.getSection('contact');
        document.getElementById('contactEditor').innerHTML = `
            <div class="editor-card">
                <h4><i class="ph ph-envelope"></i> Bilgiler</h4>
                <div class="form-group"><label>Başlık</label><input type="text" id="cHead" value="${esc(c.heading)}"></div>
                <div class="form-group"><label>Açıklama</label><textarea id="cDesc" rows="2">${esc(c.description)}</textarea></div>
            </div>
            <div class="editor-card">
                <h4><i class="ph ph-link"></i> Linkler</h4>
                ${c.links.map((l, i) => `<div class="form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr 2fr;gap:8px">
                    <div><label>İkon</label><input type="text" class="ci" data-i="${i}" value="${esc(l.icon)}"></div>
                    <div><label>Etiket</label><input type="text" class="clb" data-i="${i}" value="${esc(l.label)}"></div>
                    <div><label>Değer</label><input type="text" class="cv" data-i="${i}" value="${esc(l.value)}"></div>
                    <div><label>URL</label><input type="text" class="cu" data-i="${i}" value="${esc(l.url)}"></div>
                </div>`).join('')}
            </div>
            <div class="editor-actions"><button class="btn btn-primary btn-sm" id="saveContactBtn"><i class="ph ph-check"></i> Kaydet</button></div>`;

        document.getElementById('saveContactBtn').addEventListener('click', () => {
            c.heading = document.getElementById('cHead').value.trim();
            c.description = document.getElementById('cDesc').value.trim();
            c.links = Array.from(document.querySelectorAll('.ci')).map((el, i) => ({
                icon: el.value.trim(), label: document.querySelectorAll('.clb')[i].value.trim(),
                value: document.querySelectorAll('.cv')[i].value.trim(), url: document.querySelectorAll('.cu')[i].value.trim()
            }));
            PortfolioData.saveSection('contact', c); toast('Kaydedildi', 'success');
        });
    }

    // =============================
    // 10. Settings
    // =============================
    document.getElementById('exportBtn').addEventListener('click', () => { PortfolioData.exportToJSON(); toast('Dışa aktarıldı', 'success'); });
    document.getElementById('importFile').addEventListener('change', async (e) => {
        const f = e.target.files[0]; if (!f) return;
        try { await PortfolioData.importFromJSON(f); toast('İçe aktarıldı', 'success'); renderCurrentPage(); }
        catch (err) { toast(err.message, 'error'); }
        e.target.value = '';
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Tüm veriler varsayılana sıfırlanacak. Devam?')) {
            PortfolioData.resetData(); toast('Sıfırlandı', 'success'); renderCurrentPage();
        }
    });

    // =============================
    // 11. Modal & Toast
    // =============================
    const modalOv = document.getElementById('modalOverlay');
    function openModal(title, html) { document.getElementById('modalTitle').textContent = title; document.getElementById('modalBody').innerHTML = html; modalOv.classList.add('open'); }
    window.closeModal = function () { modalOv.classList.remove('open'); };
    document.getElementById('modalClose').addEventListener('click', closeModal);
    modalOv.addEventListener('click', (e) => { if (e.target === modalOv) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalOv.classList.contains('open')) closeModal(); });

    function toast(msg, type = 'success') {
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-x-circle'}"></i> ${esc(msg)}`;
        document.getElementById('toastContainer').appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
    }

    // =============================
    // 12. Utilities
    // =============================
    function esc(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function iconForLang(l) { return { 'JavaScript': 'ph-file-js', 'Python': 'ph-snake', 'Java': 'ph-coffee', 'C#': 'ph-code', 'PHP': 'ph-globe', 'Jupyter Notebook': 'ph-notebook' }[l] || 'ph-folder'; }
    function tagsForLang(l) { return { 'JavaScript': ['web'], 'Python': ['python'], 'Java': ['java'], 'C#': ['csharp'], 'PHP': ['web'], 'Jupyter Notebook': ['python'] }[l] || []; }
});
