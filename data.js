

const PortfolioData = (() => {
    const STORAGE_KEY = 'portfolio_data';

    const DEFAULTS = {
        hero: {
            greeting: 'Hi, I\'m',
            name: 'Cemil Dalar',
            roles: ['Software Engineer', 'Backend Developer', 'AI Solutions Creator', 'Problem Solver'],
            description: '<strong>Software Engineer</strong> focusing on scalable backend architectures and AI integrations. I build robust data-driven systems and API services, prioritizing clean code and high performance.',
            badge: 'Open to Work',
            stats: [
                { number: 21, label: 'Open Source Projects' },
                { number: 6, label: 'Programming Languages' },
                { number: 3, label: 'Years Experience' }
            ],
            cvUrl: ''
        },
        about: {
            paragraphs: [
                'I am a <strong>Software Engineer</strong> with a strong foundation in Computer Engineering. I specialize in designing industrial IoT platforms, real-time data processing systems, and modern web applications.',
                'Professionally, I work extensively with MQTT-Kafka bridges, time-series data management using TimescaleDB, microservice architectures, and Next.js dashboards. Clean code, scalability, and optimal performance are my core priorities in every project.',
                'During my academic journey, I developed power outage analysis models using machine learning and built a variety of algorithms and data structure projects in Java, C#, and Python.'
            ],
            details: [
                { icon: 'ph-map-pin', label: 'Location', value: 'Turkey' },
                { icon: 'ph-graduation-cap', label: 'Education', value: 'Computer Engineering' },
                { icon: 'ph-briefcase', label: 'Position', value: 'Software Engineer' },
                { icon: 'ph-translate', label: 'Languages', value: 'Turkish, English' }
            ]
        },
        skills: [
            {
                id: 'languages', icon: 'ph-code', title: 'Programming Languages',
                tags: [
                    { name: 'C#', level: 'advanced' }, { name: 'Java', level: 'advanced' },
                    { name: 'JavaScript', level: 'advanced' }, { name: 'TypeScript', level: 'intermediate' },
                    { name: 'Python', level: 'intermediate' }, { name: 'PHP', level: 'intermediate' },
                    { name: 'SQL', level: 'beginner' }
                ]
            },
            {
                id: 'frontend', icon: 'ph-globe', title: 'Frontend',
                tags: [
                    { name: 'Next.js', level: 'advanced' }, { name: 'React', level: 'advanced' },
                    { name: 'HTML5 / CSS3', level: 'advanced' }, { name: 'TailwindCSS', level: 'intermediate' },
                    { name: 'DevExpress', level: 'intermediate' }
                ]
            },
            {
                id: 'backend', icon: 'ph-database', title: 'Backend & Data',
                tags: [
                    { name: '.NET / ASP.NET', level: 'advanced' }, { name: 'TimescaleDB', level: 'advanced' },
                    { name: 'PostgreSQL', level: 'advanced' }, { name: 'REST API', level: 'intermediate' },
                    { name: 'SignalR', level: 'intermediate' }
                ]
            },
            {
                id: 'devops', icon: 'ph-cloud', title: 'DevOps & IoT',
                tags: [
                    { name: 'Docker', level: 'advanced' }, { name: 'Apache Kafka', level: 'advanced' },
                    { name: 'MQTT', level: 'advanced' }, { name: 'Git / GitHub', level: 'intermediate' },
                    { name: 'Linux', level: 'intermediate' }, { name: 'Microservices', level: 'intermediate' }
                ]
            },
            {
                id: 'other', icon: 'ph-brain', title: 'Other',
                tags: [
                    { name: 'Machine Learning', level: 'intermediate' }, { name: 'Data Analysis', level: 'intermediate' },
                    { name: 'Agile / Scrum', level: 'intermediate' }, { name: 'CI/CD', level: 'beginner' }
                ]
            }
        ],
        projects: [],
        certificates: [],
        contact: {
            heading: 'Let\'s work together!',
            description: 'Feel free to reach out for new projects, job opportunities, or just to say hello.',
            links: [
                { icon: 'ph-github-logo', label: 'GitHub', value: '@cmldlr', url: 'https://github.com/cmldlr' },
                { icon: 'ph-linkedin-logo', label: 'LinkedIn', value: '@cmldlr', url: 'https://linkedin.com/in/cmldlr' },
                { icon: 'ph-envelope', label: 'Email', value: 'contact@cmldlr.dev', url: 'mailto:contact@cmldlr.dev' }
            ]
        },
        translations: {
            tr: {
                hero: { greeting: 'Merhaba, ben', description: 'Backend mimarileri ve yapay zeka entegrasyonlarına odaklanan <strong>Yazılım Mühendisi</strong>.', badge: 'Çalışmaya Açık' },
                about: { paragraphs: [], details: [] },
                contact: { heading: 'Birlikte çalışalım!', description: 'Yeni projeler, iş fırsatları veya sadece merhaba demek için benimle iletişime geçmekten çekinmeyin.' },
                projects: {},
                certificates: {},
                skills: {}
            }
        }
    };


    let _cache = null;
    let _initialized = false;


    async function init() {
        try {
            const resp = await fetch('/.netlify/functions/get-content');

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

            const result = await resp.json();
            const rows = result.rows;

            if (rows && rows.length > 0) {
                const data = {};
                rows.forEach(row => {
                    data[row.id] = row.data;
                });
                _cache = deepMerge(structuredClone(DEFAULTS), data);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(_cache));
            } else {
                _cache = structuredClone(DEFAULTS);
            }
        } catch (err) {
            // Fallback: localStorage → defaults
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    _cache = deepMerge(structuredClone(DEFAULTS), JSON.parse(stored));
                } else {
                    _cache = structuredClone(DEFAULTS);
                }
            } catch (e) {
                _cache = structuredClone(DEFAULTS);
            }
        }
        _initialized = true;
    }



    function getData() {
        if (_cache) return structuredClone(_cache);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return deepMerge(structuredClone(DEFAULTS), parsed);
            }
        } catch (e) { /* silent */ }
        return structuredClone(DEFAULTS);
    }

    function saveData(data) {
        try {
            _cache = structuredClone(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            return false;
        }
    }

    function resetData() {
        localStorage.removeItem(STORAGE_KEY);
        _cache = structuredClone(DEFAULTS);
        return structuredClone(DEFAULTS);
    }

    function getSection(section) {
        const data = getData();
        return data[section] || null;
    }

    function saveSection(section, value) {
        const data = getData();
        data[section] = value;
        saveData(data);

        syncToSupabase(section, value);

        return true;
    }


    async function syncToSupabase(section, value) {
        try {
            const resp = await fetch('/.netlify/functions/save-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, data: value })
            });
            if (!resp.ok) { /* silent */ }
        } catch (err) { /* silent */ }
    }


    async function uploadImage(base64Data, filename) {
        try {
            const resp = await fetch('/.netlify/functions/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Data, filename })
            });

            if (!resp.ok) throw new Error('Upload failed');
            const result = await resp.json();
            return result.url;
        } catch (err) {
            return base64Data;
        }
    }



    function exportToJSON() {
        const data = getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data && typeof data === 'object' && data.projects) {
                        saveData(data);


                        Object.keys(data).forEach(section => {
                            syncToSupabase(section, data[section]);
                        });

                        resolve(data);
                    } else {
                        reject(new Error('Invalid data format'));
                    }
                } catch (err) {
                    reject(new Error('JSON parse error: ' + err.message));
                }
            };
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsText(file);
        });
    }



    function getVisibleProjects() {
        const data = getData();
        return data.projects.filter(p => p.visible);
    }

    function toggleProjectVisibility(projectId) {
        const data = getData();
        const project = data.projects.find(p => p.id === projectId);
        if (project) {
            project.visible = !project.visible;
            saveData(data);
            syncToSupabase('projects', data.projects);
        }
        return data;
    }

    function addProject(project) {
        const data = getData();
        if (!project.id) {
            project.id = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        const existing = data.projects.findIndex(p => p.id === project.id);
        if (existing >= 0) {
            data.projects[existing] = { ...data.projects[existing], ...project };
        } else {
            data.projects.push(project);
        }
        saveData(data);
        syncToSupabase('projects', data.projects);
        return data;
    }

    function updateProject(projectId, updates) {
        const data = getData();
        const idx = data.projects.findIndex(p => p.id === projectId);
        if (idx >= 0) {
            data.projects[idx] = { ...data.projects[idx], ...updates };
            saveData(data);
            syncToSupabase('projects', data.projects);
        }
        return data;
    }

    function removeProject(projectId) {
        const data = getData();
        data.projects = data.projects.filter(p => p.id !== projectId);
        saveData(data);
        syncToSupabase('projects', data.projects);
        return data;
    }

    function reorderProjects(orderedIds) {
        const data = getData();
        const ordered = [];
        orderedIds.forEach(id => {
            const p = data.projects.find(pr => pr.id === id);
            if (p) ordered.push(p);
        });
        data.projects.forEach(p => {
            if (!orderedIds.includes(p.id)) ordered.push(p);
        });
        data.projects = ordered;
        saveData(data);
        syncToSupabase('projects', data.projects);
        return data;
    }



    function addCertificate(cert) {
        const data = getData();
        if (!data.certificates) data.certificates = [];
        if (!cert.id) {
            cert.id = cert.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        const existing = data.certificates.findIndex(c => c.id === cert.id);
        if (existing >= 0) {
            data.certificates[existing] = { ...data.certificates[existing], ...cert };
        } else {
            data.certificates.push(cert);
        }
        saveData(data);
        syncToSupabase('certificates', data.certificates);
        return data;
    }

    function updateCertificate(certId, updates) {
        const data = getData();
        if (!data.certificates) return data;
        const idx = data.certificates.findIndex(c => c.id === certId);
        if (idx >= 0) {
            data.certificates[idx] = { ...data.certificates[idx], ...updates };
            saveData(data);
            syncToSupabase('certificates', data.certificates);
        }
        return data;
    }

    function removeCertificate(certId) {
        const data = getData();
        if (!data.certificates) return data;
        data.certificates = data.certificates.filter(c => c.id !== certId);
        saveData(data);
        syncToSupabase('certificates', data.certificates);
        return data;
    }



    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    function getDefaults() {
        return structuredClone(DEFAULTS);
    }


    return {
        init,
        getData,
        saveData,
        resetData,
        getDefaults,
        getSection,
        saveSection,
        exportToJSON,
        importFromJSON,
        uploadImage,
        getVisibleProjects,
        toggleProjectVisibility,
        addProject,
        updateProject,
        removeProject,
        reorderProjects,
        addCertificate,
        updateCertificate,
        removeCertificate
    };
})();
