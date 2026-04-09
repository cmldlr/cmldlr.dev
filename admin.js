document.addEventListener('DOMContentLoaded', () => {

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


    window.showLogin = function () {
        body.classList.remove('show-admin');
        body.classList.add('show-login');
        otpStep1.style.display = 'block';
        otpStep2.style.display = 'none';
        sendError.textContent = '';
        verifyError.textContent = '';
        otpDigits.forEach(d => d.value = '');
    };

    window.showAdmin = function () {
        body.classList.remove('show-login');
        body.classList.add('show-admin');
        clearTimers();
        renderCurrentPage();
    };

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

    if (window.location.hash === '#admin') {
        if (PortfolioAuth.isAuthenticated()) {
            showAdmin();
        } else {
            showLogin();
        }
    }

    sendOtpBtn.addEventListener('click', async () => {
        sendError.textContent = '';
        sendOtpBtn.disabled = true;
        sendOtpBtn.querySelector('span').textContent = 'Sending...';

        try {
            await PortfolioAuth.sendOTP();
            otpStep1.style.display = 'none';
            otpStep2.style.display = 'block';
            otpDigits[0].focus();
            startOtpTimer();
            startCooldownTimer();
        } catch (err) {
            sendError.textContent = err.message;
        } finally {
            sendOtpBtn.disabled = false;
            sendOtpBtn.querySelector('span').textContent = 'Send Verification Code';
        }
    });

    otpDigits.forEach((input, i) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = val;
            if (val && i < otpDigits.length - 1) {
                otpDigits[i + 1].focus();
            }
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

    verifyOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        verifyError.textContent = '';
        const code = getOtpValue();

        if (code.length !== 6) {
            verifyError.textContent = 'Please enter the 6-digit code.';
            return;
        }

        if (PortfolioAuth.isOTPExpired()) {
            verifyError.textContent = 'Code expired. Request a new one.';
            return;
        }

        try {
            const success = await PortfolioAuth.verifyOTP(code);
            if (success) {
                showAdmin();
                toast('Login successful', 'success');
            }
        } catch (err) {
            verifyError.textContent = err.message || 'Invalid code. Try again.';
            otpDigits.forEach(d => d.value = '');
            otpDigits[0].focus();
        }
    });

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
            toast('New code sent', 'success');
        } catch (err) {
            verifyError.textContent = err.message;
        }
    });

    function startOtpTimer() {
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        otpTimerInterval = setInterval(() => {
            const rem = PortfolioAuth.getOTPTimeRemaining();
            const min = Math.floor(rem / 60);
            const sec = rem % 60;
            otpCountdown.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
            if (rem <= 0) {
                clearInterval(otpTimerInterval);
                otpCountdown.textContent = 'Expired';
                otpCountdown.parentElement.style.color = 'var(--red, #ff5f57)';
            }
        }, 1000);
    }

    function startCooldownTimer() {
        resendOtpBtn.disabled = true;
        if (cooldownInterval) clearInterval(cooldownInterval);
        cooldownInterval = setInterval(() => {
            const rem = PortfolioAuth.getCooldownRemaining();
            resendCooldown.textContent = rem;
            if (rem <= 0) {
                clearInterval(cooldownInterval);
                resendOtpBtn.disabled = false;
                resendOtpBtn.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Resend';
            }
        }, 1000);
    }

    document.getElementById('loginBackBtn').addEventListener('click', () => showPortfolio());

    document.getElementById('adminBackBtn').addEventListener('click', () => showPortfolio());

    document.getElementById('previewBtn').addEventListener('click', () => showPortfolio());

    document.getElementById('logoutBtn').addEventListener('click', () => {
        PortfolioAuth.logout();
        showPortfolio();
        toast('Logged out', 'success');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (body.classList.contains('show-login')) {
                showPortfolio();
            }
        }
    });

    const sidebarLinks = document.querySelectorAll('.sidebar-link[data-page]');
    const topbarTitle = document.getElementById('topbarTitle');
    const pageTitles = {
        projects: 'Projects', skills: 'Skills',
        about: 'About', hero: 'Hero Section', contact: 'Contact', certificates: 'Certificates', settings: 'Settings'
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
            case 'about': renderAboutPage(); break;
            case 'hero': renderHeroPage(); break;
            case 'contact': renderContactPage(); break;
            case 'certificates': renderCertificatesPage(); break;
        }
    }

    function renderProjectsPage() {
        const data = PortfolioData.getData();
        const list = document.getElementById('projectsList');

        if (data.projects.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No projects added yet.</p>';
            return;
        }

        list.innerHTML = data.projects.map(p => `
            <div class="project-admin-card ${p.visible ? '' : 'hidden-project'}" data-id="${p.id}">
                <div class="project-admin-drag" title="Drag"><i class="ph ph-dots-six-vertical"></i></div>
                <div class="project-admin-toggle ${p.visible ? 'on' : ''}" data-id="${p.id}" title="${p.visible ? 'Hide' : 'Show'}"></div>
                <div class="project-admin-info">
                    <div class="project-admin-title">${esc(p.title)}</div>
                    <div class="project-admin-meta">
                        ${p.tech.slice(0, 4).map(t => `<span>${esc(t)}</span>`).join('')}
                        ${p.fromGithub ? '<span style="background:rgba(74,222,128,0.1);color:#4ade80">GitHub</span>' : ''}
                    </div>
                </div>
                <div class="project-admin-actions">
                    <button class="btn-ghost" onclick="editProject('${p.id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-ghost" onclick="deleteProject('${p.id}')" title="Delete"><i class="ph ph-trash"></i></button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.project-admin-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                PortfolioData.toggleProjectVisibility(toggle.getAttribute('data-id'));
                renderProjectsPage();
                toast('Visibility updated', 'success');
            });
        });
    }

    document.getElementById('addProjectBtn').addEventListener('click', () => openProjectModal());

    document.getElementById('fetchGithubBtn').addEventListener('click', async () => {
        openModal('GitHub Repositories', '<p style="color:var(--text-secondary);text-align:center;padding:20px"><i class="ph ph-spinner" style="animation:spin 1s linear infinite;display:inline-block"></i> Loading...</p><style>@keyframes spin{to{transform:rotate(360deg)}}</style>');
        try {
            const resp = await fetch('https://api.github.com/users/cmldlr/repos?sort=updated&per_page=50');
            if (!resp.ok) throw new Error('GitHub API error');
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
            html += '</div><div class="modal-footer"><button class="btn btn-primary btn-sm" id="importGithubBtn"><i class="ph ph-check"></i> Add Selected</button></div>';
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
                toast(`${added} projects added`, 'success');
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
        if (confirm('Are you sure you want to delete this project?')) {
            PortfolioData.removeProject(id);
            renderProjectsPage();
            toast('Project deleted', 'success');
        }
    };

    function openProjectModal(p = null) {
        const isEdit = !!p;
        const translations = PortfolioData.getSection('translations') || { tr: {} };
        if (!translations.tr.projects) translations.tr.projects = {};
        const trData = (isEdit && p.id && translations.tr.projects[p.id]) ? translations.tr.projects[p.id] : { title: '', description: '' };
        const currentImages = (isEdit && p.images && Array.isArray(p.images)) ? [...p.images] : [];
        const html = `
            <div class="lang-tabs">
                <button class="lang-tab active" data-lang="en"><i class="ph ph-flag"></i> English</button>
                <button class="lang-tab" data-lang="tr"><i class="ph ph-translate"></i> Türkçe</button>
            </div>
            <div class="lang-pane active" data-lang="en">
                <div class="form-group"><label>Title</label><input type="text" id="projTitle" value="${isEdit ? esc(p.title) : ''}"></div>
                <div class="form-group"><label>Description</label><textarea id="projDesc" rows="3">${isEdit ? esc(p.description) : ''}</textarea></div>
            </div>
            <div class="lang-pane" data-lang="tr">
                <div class="form-group"><label>Title (TR)</label><input type="text" id="projTitleTr" value="${esc(trData.title)}"></div>
                <div class="form-group"><label>Description (TR)</label><textarea id="projDescTr" rows="3">${esc(trData.description)}</textarea></div>
            </div>
            <div class="form-group"><label>Icon (e.g. ph-factory)</label><input type="text" id="projIcon" value="${isEdit ? esc(p.icon) : 'ph-folder'}"></div>
            <div class="form-group"><label>GitHub URL</label><input type="url" id="projGithub" value="${isEdit ? esc(p.github) : ''}"></div>
            <div class="form-group"><label>Technologies (comma separated)</label><input type="text" id="projTech" value="${isEdit ? p.tech.join(', ') : ''}"></div>
            <div class="form-group"><label>Tags (featured, web, java, csharp, python)</label><input type="text" id="projTags" value="${isEdit ? p.tags.join(', ') : ''}"></div>
            <div class="form-group" style="display:flex;align-items:center;gap:8px">
                <input type="checkbox" id="projFeatured" ${isEdit && p.featured ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent-primary)">
                <label for="projFeatured" style="margin:0">Featured</label>
            </div>
            <div class="form-group">
                <label>Project Images (Drag & Drop or Select)</label>
                <div class="image-upload-zone" id="imageUploadZone">
                    <i class="ph ph-image"></i>
                    <span>Click or drag images here</span>
                    <input type="file" id="imageFileInput" multiple accept="image/*" style="display:none;">
                </div>
                <div class="image-preview-grid" id="imagePreviewGrid"></div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary btn-sm" id="saveProjectBtn"><i class="ph ph-check"></i> ${isEdit ? 'Update' : 'Add'}</button>
            </div>`;
        openModal(isEdit ? 'Edit Project' : 'New Project', html);
        initLangTabs();

        let uploadedImages = [...currentImages];
        const previewGrid = document.getElementById('imagePreviewGrid');
        const uploadZone = document.getElementById('imageUploadZone');
        const fileInput = document.getElementById('imageFileInput');

        function renderThumbnails() {
            previewGrid.innerHTML = uploadedImages.map((b64, index) => `
                <div class="image-preview-item">
                    <img src="${b64}" alt="preview">
                    <button class="remove-img-btn" data-index="${index}"><i class="ph ph-x"></i></button>
                </div>
            `).join('');

            previewGrid.querySelectorAll('.remove-img-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                    uploadedImages.splice(idx, 1);
                    renderThumbnails();
                });
            });
        }

        async function processFiles(files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;
                try {
                    uploadZone.querySelector('span').textContent = 'Uploading...';
                    const b64 = await compressImage(file, 800, 0.7);
                    // Upload to Supabase Storage, get public URL
                    const imageUrl = await PortfolioData.uploadImage(b64, file.name);
                    uploadedImages.push(imageUrl);
                } catch (err) {
                    toast('Error processing image', 'error');
                }
            }
            uploadZone.querySelector('span').textContent = 'Click or drag images here';
            renderThumbnails();
        }

        uploadZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => processFiles(e.target.files));

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
        });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files) {
                processFiles(e.dataTransfer.files);
            }
        });

        renderThumbnails();

        document.getElementById('saveProjectBtn').addEventListener('click', () => {
            const title = document.getElementById('projTitle').value.trim();
            if (!title) { toast('Title is required', 'error'); return; }
            const obj = {
                title, description: document.getElementById('projDesc').value.trim(),
                icon: document.getElementById('projIcon').value.trim() || 'ph-folder',
                github: document.getElementById('projGithub').value.trim(),
                tech: document.getElementById('projTech').value.split(',').map(s => s.trim()).filter(Boolean),
                tags: document.getElementById('projTags').value.split(',').map(s => s.trim()).filter(Boolean),
                featured: document.getElementById('projFeatured').checked,
                visible: true, fromGithub: !!(isEdit && p.fromGithub),
                images: uploadedImages
            };
            if (isEdit) { PortfolioData.updateProject(p.id, obj); }
            else { obj.id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-'); PortfolioData.addProject(obj); }

            const translations = PortfolioData.getSection('translations') || { tr: {} };
            if (!translations.tr.projects) translations.tr.projects = {};
            translations.tr.projects[obj.id] = {
                title: document.getElementById('projTitleTr').value.trim(),
                description: document.getElementById('projDescTr').value.trim()
            };
            PortfolioData.saveSection('translations', translations);

            closeModal(); renderProjectsPage();
            toast(isEdit ? 'Updated' : 'Added', 'success');
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
                            <option value="beginner" ${t.level === 'beginner' ? 'selected' : ''}>Beginner</option>
                            <option value="intermediate" ${t.level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="advanced" ${t.level === 'advanced' ? 'selected' : ''}>Advanced</option>
                        </select>
                        <button onclick="rmSkillTag(${ci},${ti})"><i class="ph ph-x"></i></button>
                    </div>`).join('')}
                    <button class="btn-ghost" onclick="addSkillTag(${ci})" style="font-size:0.8rem"><i class="ph ph-plus"></i> Add</button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('addSkillCategoryBtn').addEventListener('click', () => {
        const html = `
            <div class="lang-tabs">
                <button class="lang-tab active" data-lang="en"><i class="ph ph-flag"></i> English</button>
                <button class="lang-tab" data-lang="tr"><i class="ph ph-translate"></i> Türkçe</button>
            </div>
            <div class="lang-pane active" data-lang="en">
                <div class="form-group"><label>Category Name</label><input type="text" id="catTitle"></div>
            </div>
            <div class="lang-pane" data-lang="tr">
                <div class="form-group"><label>Category Name (TR)</label><input type="text" id="catTitleTr"></div>
            </div>
            <div class="form-group"><label>Icon</label><input type="text" id="catIcon" value="ph-code"></div>
            <div class="modal-footer"><button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary btn-sm" id="saveCatBtn"><i class="ph ph-check"></i> Add</button></div>`;
        openModal('New Category', html);
        initLangTabs();
        document.getElementById('saveCatBtn').addEventListener('click', () => {
            const title = document.getElementById('catTitle').value.trim();
            if (!title) return;
            const skills = PortfolioData.getSection('skills') || [];
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            skills.push({ id, icon: document.getElementById('catIcon').value.trim(), title, tags: [] });
            PortfolioData.saveSection('skills', skills);

            const translations = PortfolioData.getSection('translations') || { tr: {} };
            if (!translations.tr.skills) translations.tr.skills = {};
            translations.tr.skills[id] = { title: document.getElementById('catTitleTr').value.trim() };
            PortfolioData.saveSection('translations', translations);

            closeModal(); renderSkillsPage(); toast('Added', 'success');
        });
    });

    window.editSkillCat = function (ci) {
        const s = PortfolioData.getSection('skills'); const cat = s[ci];
        const translations = PortfolioData.getSection('translations') || { tr: {} };
        const trData = (translations.tr.skills && translations.tr.skills[cat.id]) ? translations.tr.skills[cat.id] : { title: '' };

        const html = `
            <div class="lang-tabs">
                <button class="lang-tab active" data-lang="en"><i class="ph ph-flag"></i> English</button>
                <button class="lang-tab" data-lang="tr"><i class="ph ph-translate"></i> Türkçe</button>
            </div>
            <div class="lang-pane active" data-lang="en">
                <div class="form-group"><label>Name</label><input type="text" id="catTitle" value="${esc(cat.title)}"></div>
            </div>
            <div class="lang-pane" data-lang="tr">
                <div class="form-group"><label>Name (TR)</label><input type="text" id="catTitleTr" value="${esc(trData.title)}"></div>
            </div>
            <div class="form-group"><label>Icon</label><input type="text" id="catIcon" value="${esc(cat.icon)}"></div>
            <div class="modal-footer"><button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary btn-sm" id="saveCEBtn"><i class="ph ph-check"></i> Update</button></div>`;
        openModal('Edit Category', html);
        initLangTabs();
        document.getElementById('saveCEBtn').addEventListener('click', () => {
            s[ci].title = document.getElementById('catTitle').value.trim();
            s[ci].icon = document.getElementById('catIcon').value.trim();
            PortfolioData.saveSection('skills', s);

            const trans = PortfolioData.getSection('translations') || { tr: {} };
            if (!trans.tr.skills) trans.tr.skills = {};
            trans.tr.skills[cat.id] = { title: document.getElementById('catTitleTr').value.trim() };
            PortfolioData.saveSection('translations', trans);

            closeModal(); renderSkillsPage(); toast('Updated', 'success');
        });
    };
    window.delSkillCat = function (ci) { if (!confirm('Are you sure you want to delete?')) return; const s = PortfolioData.getSection('skills'); s.splice(ci, 1); PortfolioData.saveSection('skills', s); renderSkillsPage(); toast('Deleted', 'success'); };
    window.addSkillTag = function (ci) { const n = prompt('Skill name:'); if (!n) return; const s = PortfolioData.getSection('skills'); s[ci].tags.push({ name: n.trim(), level: 'intermediate' }); PortfolioData.saveSection('skills', s); renderSkillsPage(); };
    window.rmSkillTag = function (ci, ti) { const s = PortfolioData.getSection('skills'); s[ci].tags.splice(ti, 1); PortfolioData.saveSection('skills', s); renderSkillsPage(); };
    window.setSkillLvl = function (ci, ti, l) { const s = PortfolioData.getSection('skills'); s[ci].tags[ti].level = l; PortfolioData.saveSection('skills', s); };

    // =============================
    // 7. About Page
    // =============================
    function renderAboutPage() {
        const about = PortfolioData.getSection('about');
        const translations = PortfolioData.getSection('translations') || { tr: { about: { paragraphs: [], details: [] } } };
        const trAbout = translations.tr?.about || { paragraphs: about.paragraphs.map(() => ''), details: about.details.map(() => ({ label: '', value: '' })) };

        // Match lengths if mismatched
        while (trAbout.paragraphs.length < about.paragraphs.length) trAbout.paragraphs.push('');
        while (trAbout.details.length < about.details.length) trAbout.details.push({ label: '', value: '' });

        document.getElementById('aboutEditor').innerHTML = `
            <div class="editor-card">
                <div class="lang-tabs">
                    <button class="lang-tab active" data-lang="en"><i class="ph ph-flag"></i> English</button>
                    <button class="lang-tab" data-lang="tr"><i class="ph ph-translate"></i> Türkçe</button>
                </div>
                <div class="lang-pane active" data-lang="en" id="aboutEnParas">
                    <h4><i class="ph ph-text-align-left"></i> Paragraphs</h4>
                    ${about.paragraphs.map((p, i) => `
                    <div class="form-group" style="position:relative;">
                        <label>Paragraph ${i + 1}</label>
                        <textarea class="about-para" data-i="${i}" rows="4">${esc(p.replace(/<\/?strong>/g, ''))}</textarea>
                        <button class="btn-ghost remove-para-btn" data-i="${i}" style="position:absolute; top:0; right:0;" title="Delete"><i class="ph ph-trash"></i></button>
                    </div>`).join('')}
                    <button class="btn btn-outline btn-sm" id="addParaBtn"><i class="ph ph-plus"></i> Add</button>
                </div>
                <div class="lang-pane" data-lang="tr" id="aboutTrParas">
                    <h4><i class="ph ph-translate"></i> Paragraphs (TR)</h4>
                    ${trAbout.paragraphs.map((p, i) => `
                    <div class="form-group">
                        <label>Paragraph ${i + 1} (TR)</label>
                        <textarea class="about-para-tr" data-i="${i}" rows="4">${esc((p || '').replace(/<\/?strong>/g, ''))}</textarea>
                    </div>`).join('')}
                </div>
            </div>
            <div class="editor-card">
                <h4><i class="ph ph-identification-card"></i> Detail Cards</h4>
                <div class="lang-tabs">
                    <button class="lang-tab active" data-lang="en"><i class="ph ph-flag"></i> English</button>
                    <button class="lang-tab" data-lang="tr"><i class="ph ph-translate"></i> Türkçe</button>
                </div>
                <div class="lang-pane active" data-lang="en">
                    ${about.details.map((d, i) => `
                    <div class="form-group" style="display:grid;grid-template-columns:auto 1fr 1fr;gap:8px; align-items: end;">
                        <div><label>Icon</label><input type="text" class="di" data-i="${i}" value="${esc(d.icon)}"></div>
                        <div><label>Title</label><input type="text" class="dl" data-i="${i}" value="${esc(d.label)}"></div>
                        <div><label>Value</label><input type="text" class="dv" data-i="${i}" value="${esc(d.value)}"></div>
                    </div>`).join('')}
                </div>
                <div class="lang-pane" data-lang="tr">
                    ${about.details.map((d, i) => `
                    <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px; align-items: end;">
                        <div><label>Title (TR)</label><input type="text" class="dl-tr" data-i="${i}" value="${esc(trAbout.details[i]?.label || '')}"></div>
                        <div><label>Value (TR)</label><input type="text" class="dv-tr" data-i="${i}" value="${esc(trAbout.details[i]?.value || '')}"></div>
                    </div>`).join('')}
                </div>
            </div>
            <div class="editor-actions"><button class="btn btn-primary btn-sm" id="saveAboutBtn"><i class="ph ph-check"></i> Save</button></div>`;
        initLangTabs();

        document.getElementById('addParaBtn').addEventListener('click', () => {
            about.paragraphs.push('');
            trAbout.paragraphs.push('');
            PortfolioData.saveSection('about', about);
            if (!translations.tr) translations.tr = {};
            translations.tr.about = trAbout;
            PortfolioData.saveSection('translations', translations);
            renderAboutPage();
        });

        document.querySelectorAll('.remove-para-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-i'));
                const enContent = document.querySelectorAll('.about-para')[idx].value.trim();
                const trContent = document.querySelectorAll('.about-para-tr')[idx].value.trim();

                if (enContent || trContent) {
                    if (!confirm('Are you sure you want to delete this paragraph? (English and Turkish versions will be deleted)')) {
                        return;
                    }
                }

                about.paragraphs.splice(idx, 1);
                trAbout.paragraphs.splice(idx, 1);

                PortfolioData.saveSection('about', about);
                if (!translations.tr) translations.tr = {};
                translations.tr.about = trAbout;
                PortfolioData.saveSection('translations', translations);

                renderAboutPage();
                toast('Deleted', 'success');
            });
        });

        document.getElementById('saveAboutBtn').addEventListener('click', () => {
            about.paragraphs = Array.from(document.querySelectorAll('.about-para')).map(e => e.value.trim());
            about.details = Array.from(document.querySelectorAll('.di')).map((el, i) => ({
                icon: el.value.trim(),
                label: document.querySelectorAll('.dl')[i].value.trim(),
                value: document.querySelectorAll('.dv')[i].value.trim()
            }));

            if (!translations.tr) translations.tr = {};
            if (!translations.tr.about) translations.tr.about = {};
            translations.tr.about.paragraphs = Array.from(document.querySelectorAll('.about-para-tr')).map(e => e.value.trim());
            translations.tr.about.details = Array.from(document.querySelectorAll('.di')).map((el, i) => ({
                label: document.querySelectorAll('.dl-tr')[i].value.trim(),
                value: document.querySelectorAll('.dv-tr')[i].value.trim()
            }));

            PortfolioData.saveSection('about', about);
            PortfolioData.saveSection('translations', translations);
            toast('Saved', 'success');
        });
    }

    function renderHeroPage() {
        const hero = PortfolioData.getSection('hero');
        const translations = PortfolioData.getSection('translations') || { tr: { hero: {}, about: {}, contact: {} } };
        const trHero = translations.tr?.hero || { greeting: '', description: '', badge: '' };

        document.getElementById('heroEditor').innerHTML = `
            <div class="editor-card">
                <div class="lang-tabs">
                    <button class="lang-tab active" data-lang="en"><i class="ph ph-flag"></i> English</button>
                    <button class="lang-tab" data-lang="tr"><i class="ph ph-translate"></i> Türkçe</button>
                </div>
                <div class="lang-pane active" data-lang="en">
                    <div class="form-group"><label>Greeting</label><input type="text" id="hGreet" value="${esc(hero.greeting)}"></div>
                    <div class="form-group"><label>Name</label><input type="text" id="hName" value="${esc(hero.name)}"></div>
                    <div class="form-group"><label>Description (HTML)</label><textarea id="hDesc" rows="3">${esc(hero.description)}</textarea></div>
                    <div class="form-group"><label>Badge</label><input type="text" id="hBadge" value="${esc(hero.badge)}"></div>
                    <div class="form-group"><label>Roles (one per line)</label><textarea id="hRoles" rows="4">${hero.roles.join('\n')}</textarea></div>
                    <div class="form-group"><label>CV URL (leave empty to hide button)</label><input type="url" id="hCvUrl" value="${esc(hero.cvUrl || '')}"></div>
                </div>
                <div class="lang-pane" data-lang="tr">
                    <div class="form-group"><label>Greeting (TR)</label><input type="text" id="hGreetTr" value="${esc(trHero.greeting)}"></div>
                    <div class="form-group"><label>Description (TR) (HTML)</label><textarea id="hDescTr" rows="3">${esc(trHero.description)}</textarea></div>
                    <div class="form-group"><label>Badge (TR)</label><input type="text" id="hBadgeTr" value="${esc(trHero.badge)}"></div>
                    <div class="form-group"><label>Roles (TR) (one per line)</label><textarea id="hRolesTr" rows="4">${(trHero.roles || hero.roles).join('\n')}</textarea></div>
                </div>
            </div>
            <div class="editor-card">
                <h4><i class="ph ph-chart-bar"></i> Statistics</h4>
                ${hero.stats.map((s, i) => `<div class="form-group" style="display:grid;grid-template-columns:1fr 2fr;gap:8px">
                    <div><label>Number</label><input type="number" class="sn" data-i="${i}" value="${s.number}"></div>
                    <div><label>Label</label><input type="text" class="sl" data-i="${i}" value="${esc(s.label)}"></div>
                </div>`).join('')}
            </div>
            <div class="editor-actions"><button class="btn btn-primary btn-sm" id="saveHeroBtn"><i class="ph ph-check"></i> Save</button></div>`;
        initLangTabs();

        document.getElementById('saveHeroBtn').addEventListener('click', () => {
            hero.greeting = document.getElementById('hGreet').value.trim();
            hero.name = document.getElementById('hName').value.trim();
            hero.description = document.getElementById('hDesc').value.trim();
            hero.badge = document.getElementById('hBadge').value.trim();
            hero.cvUrl = document.getElementById('hCvUrl').value.trim();
            hero.roles = document.getElementById('hRoles').value.split('\n').map(s => s.trim()).filter(Boolean);
            hero.stats = Array.from(document.querySelectorAll('.sn')).map((el, i) => ({
                number: parseInt(el.value) || 0, label: document.querySelectorAll('.sl')[i].value.trim()
            }));

            if (!translations.tr) translations.tr = {};
            if (!translations.tr.hero) translations.tr.hero = {};
            translations.tr.hero.greeting = document.getElementById('hGreetTr').value.trim();
            translations.tr.hero.description = document.getElementById('hDescTr').value.trim();
            translations.tr.hero.badge = document.getElementById('hBadgeTr').value.trim();
            translations.tr.hero.roles = document.getElementById('hRolesTr').value.split('\n').map(s => s.trim()).filter(Boolean);

            PortfolioData.saveSection('hero', hero);
            PortfolioData.saveSection('translations', translations);
            toast('Saved', 'success');
        });
    }

    function renderCertificatesPage() {
        const certs = PortfolioData.getSection('certificates') || [];
        const list = document.getElementById('certificatesList');

        if (certs.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No certificates added yet.</p>';
            return;
        }

        list.innerHTML = certs.map((c, i) => `
            <div class="exp-admin-card">
                <div class="skill-admin-header">
                    <h4><i class="ph ${c.icon}"></i> ${esc(c.title)} <span style="color:var(--accent-secondary);font-size:0.8rem;font-family:var(--font-mono);margin-left:8px">${esc(c.date)}</span></h4>
                    <div>
                        <button class="btn-ghost" onclick="editCert(${i})"><i class="ph ph-pencil-simple"></i></button>
                        <button class="btn-ghost" onclick="delCert(${i})"><i class="ph ph-trash"></i></button>
                    </div>
                </div>
                <p style="color:var(--accent-primary);font-size:0.9rem;font-weight:600;margin-bottom:4px">${esc(c.issuer)}</p>
                <p style="color:var(--text-secondary);font-size:0.85rem">${esc(c.description).substring(0, 120)}...</p>
            </div>
        `).join('');
    }

    document.getElementById('addCertificateBtn').addEventListener('click', () => openCertModal());
    window.editCert = function (i) { const certs = PortfolioData.getSection('certificates') || []; openCertModal(certs[i], i); };
    window.delCert = function (i) {
        if (!confirm('Are you sure you want to delete?')) return;
        const certs = PortfolioData.getSection('certificates') || [];
        certs.splice(i, 1);
        PortfolioData.saveSection('certificates', certs);
        renderCertificatesPage();
        toast('Deleted', 'success');
    };

    function openCertModal(c = null, idx = -1) {
        const isE = !!c;
        const translations = PortfolioData.getSection('translations') || { tr: {} };
        if (!translations.tr.certificates) translations.tr.certificates = {};
        const trData = (isE && c.id && translations.tr.certificates[c.id]) ? translations.tr.certificates[c.id] : { title: '', issuer: '', description: '' };
        const html = `
            <div class="lang-tabs">
                <button class="lang-tab active" data-lang="en"><i class="ph ph-flag"></i> English</button>
                <button class="lang-tab" data-lang="tr"><i class="ph ph-translate"></i> Türkçe</button>
            </div>
            <div class="lang-pane active" data-lang="en">
                <div class="form-group"><label>Title</label><input type="text" id="certTitle" value="${isE ? esc(c.title) : ''}"></div>
                <div class="form-group"><label>Issuer</label><input type="text" id="certIssuer" value="${isE ? esc(c.issuer) : ''}"></div>
                <div class="form-group"><label>Description</label><textarea id="certDesc" rows="3">${isE ? esc(c.description) : ''}</textarea></div>
            </div>
            <div class="lang-pane" data-lang="tr">
                <div class="form-group"><label>Title (TR)</label><input type="text" id="certTitleTr" value="${esc(trData.title)}"></div>
                <div class="form-group"><label>Issuer (TR)</label><input type="text" id="certIssuerTr" value="${esc(trData.issuer)}"></div>
                <div class="form-group"><label>Description (TR)</label><textarea id="certDescTr" rows="3">${esc(trData.description)}</textarea></div>
            </div>
            <div class="form-group"><label>Date</label><input type="text" id="certDate" value="${isE ? esc(c.date) : ''}"></div>
            <div class="form-group"><label>Icon (e.g. ph-robot)</label><input type="text" id="certIcon" value="${isE ? esc(c.icon) : 'ph-certificate'}"></div>
            <div class="form-group"><label>Credential URL</label><input type="url" id="certCred" value="${isE ? esc(c.credential || '') : ''}"></div>
            <div class="form-group"><label>Image URL (optional)</label><input type="url" id="certImage" value="${isE ? esc(c.image || '') : ''}" placeholder="https://... or assets/cert.jpg"></div>
            <div class="form-group"><label>Technologies (comma separated)</label><input type="text" id="certTech" value="${isE ? (c.tech || []).join(', ') : ''}"></div>
            <div class="modal-footer"><button class="btn btn-outline btn-sm" onclick="closeModal()">Cancel</button>
            <button class="btn btn-primary btn-sm" id="saveCertBtn"><i class="ph ph-check"></i> ${isE ? 'Update' : 'Add'}</button></div>`;
        openModal(isE ? 'Edit Certificate' : 'New Certificate', html);
        initLangTabs();
        document.getElementById('saveCertBtn').addEventListener('click', () => {
            const certs = PortfolioData.getSection('certificates') || [];
            const obj = {
                id: document.getElementById('certTitle').value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                title: document.getElementById('certTitle').value.trim(),
                issuer: document.getElementById('certIssuer').value.trim(),
                date: document.getElementById('certDate').value.trim(),
                description: document.getElementById('certDesc').value.trim(),
                icon: document.getElementById('certIcon').value.trim() || 'ph-certificate',
                credential: document.getElementById('certCred').value.trim(),
                image: document.getElementById('certImage').value.trim(),
                tech: document.getElementById('certTech').value.split(',').map(s => s.trim()).filter(Boolean)
            };
            if (!obj.title) { toast('Title is required', 'error'); return; }
            if (isE && idx >= 0) certs[idx] = obj; else certs.push(obj);
            PortfolioData.saveSection('certificates', certs);

            const translations = PortfolioData.getSection('translations') || { tr: {} };
            if (!translations.tr.certificates) translations.tr.certificates = {};
            translations.tr.certificates[obj.id] = {
                title: document.getElementById('certTitleTr').value.trim(),
                issuer: document.getElementById('certIssuerTr').value.trim(),
                description: document.getElementById('certDescTr').value.trim()
            };
            PortfolioData.saveSection('translations', translations);

            closeModal(); renderCertificatesPage(); toast(isE ? 'Updated' : 'Added', 'success');
        });
    }

    function renderContactPage() {
        const c = PortfolioData.getSection('contact');
        const translations = PortfolioData.getSection('translations') || { tr: { about: {}, contact: {}, hero: {} } };
        const trContact = translations.tr?.contact || { heading: '', description: '' };

        document.getElementById('contactEditor').innerHTML = `
            <div class="editor-card">
                <div class="lang-tabs">
                    <button class="lang-tab active" data-lang="en"><i class="ph ph-flag"></i> English</button>
                    <button class="lang-tab" data-lang="tr"><i class="ph ph-translate"></i> Türkçe</button>
                </div>
                <div class="lang-pane active" data-lang="en">
                    <div class="form-group"><label>Heading</label><input type="text" id="cHead" value="${esc(c.heading)}"></div>
                    <div class="form-group"><label>Description</label><textarea id="cDesc" rows="3">${esc(c.description)}</textarea></div>
                </div>
                <div class="lang-pane" data-lang="tr">
                    <div class="form-group"><label>Heading (TR)</label><input type="text" id="cHeadTr" value="${esc(trContact.heading)}"></div>
                    <div class="form-group"><label>Description (TR)</label><textarea id="cDescTr" rows="3">${esc(trContact.description)}</textarea></div>
                </div>
            </div>
            <div class="editor-card">
                <h4><i class="ph ph-link"></i> Links</h4>
                ${c.links.map((l, i) => `<div class="form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr 2fr;gap:8px">
                    <div><label>Icon</label><input type="text" class="ci" data-i="${i}" value="${esc(l.icon)}"></div>
                    <div><label>Label</label><input type="text" class="clb" data-i="${i}" value="${esc(l.label)}"></div>
                    <div><label>Value</label><input type="text" class="cv" data-i="${i}" value="${esc(l.value)}"></div>
                    <div><label>URL</label><input type="text" class="cu" data-i="${i}" value="${esc(l.url)}"></div>
                </div>`).join('')}
            </div>
            <div class="editor-actions"><button class="btn btn-primary btn-sm" id="saveContactBtn"><i class="ph ph-check"></i> Save</button></div>`;
        initLangTabs();

        document.getElementById('saveContactBtn').addEventListener('click', () => {
            c.heading = document.getElementById('cHead').value.trim();
            c.description = document.getElementById('cDesc').value.trim();
            c.links = Array.from(document.querySelectorAll('.ci')).map((el, i) => ({
                icon: el.value.trim(), label: document.querySelectorAll('.clb')[i].value.trim(),
                value: document.querySelectorAll('.cv')[i].value.trim(), url: document.querySelectorAll('.cu')[i].value.trim()
            }));

            if (!translations.tr) translations.tr = {};
            if (!translations.tr.contact) translations.tr.contact = {};
            translations.tr.contact.heading = document.getElementById('cHeadTr').value.trim();
            translations.tr.contact.description = document.getElementById('cDescTr').value.trim();

            PortfolioData.saveSection('contact', c);
            PortfolioData.saveSection('translations', translations);
            toast('Saved', 'success');
        });
    }

    document.getElementById('exportBtn').addEventListener('click', () => { PortfolioData.exportToJSON(); toast('Exported', 'success'); });
    document.getElementById('importFile').addEventListener('change', async (e) => {
        const f = e.target.files[0]; if (!f) return;
        try { await PortfolioData.importFromJSON(f); toast('Imported', 'success'); renderCurrentPage(); }
        catch (err) { toast(err.message, 'error'); }
        e.target.value = '';
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('All data will be reset to defaults. Continue?')) {
            PortfolioData.resetData(); toast('Reset', 'success'); renderCurrentPage();
        }
    });

    const modalOv = document.getElementById('modalOverlay');
    function openModal(title, html) { document.getElementById('modalTitle').textContent = title; document.getElementById('modalBody').innerHTML = html; modalOv.classList.add('open'); }
    window.closeModal = function () { modalOv.classList.remove('open'); };
    document.getElementById('modalClose').addEventListener('click', closeModal);
    modalOv.addEventListener('click', (e) => { if (e.target === modalOv) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modalOv.classList.contains('open')) closeModal(); });

    function initLangTabs() {
        document.querySelectorAll('.lang-tabs').forEach(tabBar => {
            tabBar.querySelectorAll('.lang-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const lang = tab.getAttribute('data-lang');
                    const container = tabBar.parentElement;
                    // Switch active tab
                    tabBar.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    // Switch active pane
                    container.querySelectorAll('.lang-pane').forEach(p => p.classList.remove('active'));
                    container.querySelector(`.lang-pane[data-lang="${lang}"]`)?.classList.add('active');
                });
            });
        });
    }

    function toast(msg, type = 'success') {
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-x-circle'}"></i> ${esc(msg)}`;
        document.getElementById('toastContainer').appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
    }

    function esc(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function iconForLang(l) { return { 'JavaScript': 'ph-file-js', 'Python': 'ph-snake', 'Java': 'ph-coffee', 'C#': 'ph-code', 'PHP': 'ph-globe', 'Jupyter Notebook': 'ph-notebook' }[l] || 'ph-folder'; }
    function tagsForLang(l) { return { 'JavaScript': ['web'], 'Python': ['python'], 'Java': ['java'], 'C#': ['csharp'], 'PHP': ['web'], 'Jupyter Notebook': ['python'] }[l] || []; }

    function compressImage(file, maxSize, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
                    } else {
                        if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    }
});
