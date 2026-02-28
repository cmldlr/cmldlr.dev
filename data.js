/**
 * Portfolio Data Layer
 * Merkezi veri yönetimi — localStorage + varsayılan veriler
 */

const PortfolioData = (() => {
    const STORAGE_KEY = 'portfolio_data';

    // =============================
    // Varsayılan Veriler
    // =============================
    const DEFAULTS = {
        hero: {
            greeting: 'Merhaba, ben',
            name: 'Cemil Dalar',
            roles: ['Software Engineer', 'Full-Stack Developer', 'IoT Specialist', 'Backend Architect', 'Problem Solver'],
            description: 'IoT, bulut tabanlı mimariler ve endüstriyel sistemler konusunda uzmanlaşmış <strong>Yazılım Mühendisi</strong>. MQTT, Kafka, TimescaleDB ve modern web teknolojileri ile ölçeklenebilir çözümler geliştiriyorum.',
            badge: 'Çalışmaya Açık',
            stats: [
                { number: 21, label: 'Açık Kaynak Proje' },
                { number: 6, label: 'Programlama Dili' },
                { number: 3, label: 'Yıl Deneyim' }
            ]
        },
        about: {
            paragraphs: [
                'Bilgisayar Mühendisliği geçmişine sahip bir <strong>Yazılım Mühendisi</strong>yim. Endüstriyel IoT platformları, gerçek zamanlı veri işleme sistemleri ve modern web uygulamaları geliştirme konusunda deneyimliyim.',
                'Profesyonel olarak MQTT-Kafka köprüleri, TimescaleDB ile zaman serisi veri yönetimi, mikroservis mimarileri ve Next.js tabanlı dashboard\'lar üzerinde çalışıyorum. Her projemde temiz kod, ölçeklenebilirlik ve performans önceliğimdir.',
                'Akademik çalışmalarımda makine öğrenmesi ile güç kesintisi analizi, çeşitli Java/C#/Python projeleri ve veri yapıları üzerine projeler geliştirdim.'
            ],
            details: [
                { icon: 'ph-map-pin', label: 'Konum', value: 'Türkiye' },
                { icon: 'ph-graduation-cap', label: 'Eğitim', value: 'Bilgisayar Mühendisliği' },
                { icon: 'ph-briefcase', label: 'Pozisyon', value: 'Yazılım Mühendisi' },
                { icon: 'ph-translate', label: 'Diller', value: 'Türkçe, İngilizce' }
            ]
        },
        skills: [
            {
                id: 'languages',
                icon: 'ph-code',
                title: 'Programlama Dilleri',
                tags: [
                    { name: 'C#', level: 'advanced' },
                    { name: 'Java', level: 'advanced' },
                    { name: 'JavaScript', level: 'advanced' },
                    { name: 'TypeScript', level: 'intermediate' },
                    { name: 'Python', level: 'intermediate' },
                    { name: 'PHP', level: 'intermediate' },
                    { name: 'SQL', level: 'beginner' }
                ]
            },
            {
                id: 'frontend',
                icon: 'ph-globe',
                title: 'Frontend',
                tags: [
                    { name: 'Next.js', level: 'advanced' },
                    { name: 'React', level: 'advanced' },
                    { name: 'HTML5 / CSS3', level: 'advanced' },
                    { name: 'TailwindCSS', level: 'intermediate' },
                    { name: 'DevExpress', level: 'intermediate' }
                ]
            },
            {
                id: 'backend',
                icon: 'ph-database',
                title: 'Backend & Veri',
                tags: [
                    { name: '.NET / ASP.NET', level: 'advanced' },
                    { name: 'TimescaleDB', level: 'advanced' },
                    { name: 'PostgreSQL', level: 'advanced' },
                    { name: 'REST API', level: 'intermediate' },
                    { name: 'SignalR', level: 'intermediate' }
                ]
            },
            {
                id: 'devops',
                icon: 'ph-cloud',
                title: 'DevOps & IoT',
                tags: [
                    { name: 'Docker', level: 'advanced' },
                    { name: 'Apache Kafka', level: 'advanced' },
                    { name: 'MQTT', level: 'advanced' },
                    { name: 'Git / GitHub', level: 'intermediate' },
                    { name: 'Linux', level: 'intermediate' },
                    { name: 'Microservices', level: 'intermediate' }
                ]
            },
            {
                id: 'other',
                icon: 'ph-brain',
                title: 'Diğer',
                tags: [
                    { name: 'Machine Learning', level: 'intermediate' },
                    { name: 'Data Analysis', level: 'intermediate' },
                    { name: 'Agile / Scrum', level: 'intermediate' },
                    { name: 'CI/CD', level: 'beginner' }
                ]
            }
        ],
        projects: [
            {
                id: 'iot-platform',
                title: 'IoT Data Platform',
                description: 'MQTT → Kafka → TimescaleDB veri pipeline\'ı ile endüstriyel IoT verileri toplama, işleme ve görselleştirme platformu. Mikroservis mimarisi, gerçek zamanlı dashboard ve alarm sistemi içerir.',
                icon: 'ph-factory',
                tags: ['featured', 'web'],
                tech: ['C#', '.NET', 'Kafka', 'MQTT', 'TimescaleDB', 'Next.js', 'Docker'],
                github: 'https://github.com/cmldlr',
                featured: true,
                visible: true,
                fromGithub: false
            },
            {
                id: 'progressio',
                title: 'Progressio',
                description: 'İlerleme takip ve yönetim uygulaması. Kullanıcı dostu arayüz ile hedef belirleme ve performans izleme özellikleri sunar.',
                icon: 'ph-chart-line-up',
                tags: ['featured', 'web'],
                tech: ['JavaScript', 'Web App'],
                github: 'https://github.com/cmldlr/Progressio',
                featured: false,
                visible: true,
                fromGithub: true
            },
            {
                id: 'number-maze',
                title: 'Number Maze',
                description: 'Sayı tabanlı labirent oyunu. Algoritmik düşünme ve problem çözme becerilerini geliştirmeye yönelik tasarlanmış interaktif oyun.',
                icon: 'ph-game-controller',
                tags: ['java'],
                tech: ['Java', 'Game Dev'],
                github: 'https://github.com/cmldlr/Number-Maze',
                featured: false,
                visible: true,
                fromGithub: true
            },
            {
                id: 'power-outage',
                title: 'Güç Kesintisi Analizi',
                description: 'Makine öğrenmesi teknikleri ile güç kesintisi verilerinin analizi. Veri ön işleme, model eğitimi ve performans değerlendirmesi içerir.',
                icon: 'ph-lightning',
                tags: ['python', 'featured'],
                tech: ['Python', 'Machine Learning', 'Jupyter'],
                github: 'https://github.com/cmldlr/Analysis-power-outage-data-with-using-machine-learning',
                featured: false,
                visible: true,
                fromGithub: true
            },
            {
                id: 'ibm-ai',
                title: 'IBM AI Engineering',
                description: 'IBM AI Engineering sertifika programı kapsamında geliştirilen yapay zeka ve derin öğrenme projeleri koleksiyonu.',
                icon: 'ph-robot',
                tags: ['python', 'featured'],
                tech: ['Python', 'AI / Deep Learning', 'Jupyter'],
                github: 'https://github.com/cmldlr/IBM-AI-Engineering',
                featured: false,
                visible: true,
                fromGithub: true
            },
            {
                id: 'rent-a-car',
                title: 'Araç Kiralama Yönetim Sistemi',
                description: 'Kapsamlı araç kiralama yönetim sistemi. Araç takibi, müşteri yönetimi ve kiralama işlemleri modüllerini içerir.',
                icon: 'ph-car',
                tags: ['web'],
                tech: ['PHP', 'Web'],
                github: 'https://github.com/cmldlr/Rent-A-Car-Management-System',
                featured: false,
                visible: true,
                fromGithub: true
            },
            {
                id: 'the-matrix',
                title: 'The Matrix',
                description: 'C# ile geliştirilmiş matris işlemleri kütüphanesi. Toplama, çarpma, determinant ve ters matris hesaplama gibi temel lineer cebir operasyonlarını destekler.',
                icon: 'ph-grid-four',
                tags: ['csharp'],
                tech: ['C#', '.NET'],
                github: 'https://github.com/cmldlr/The-Matrix',
                featured: false,
                visible: true,
                fromGithub: true
            },
            {
                id: 'ceng-editor',
                title: 'Ceng Editor',
                description: 'Java ile geliştirilmiş metin editörü. Sözdizimi vurgulama, dosya yönetimi ve temel düzenleme özellikleri sunar.',
                icon: 'ph-text-aa',
                tags: ['java'],
                tech: ['Java', 'Swing'],
                github: 'https://github.com/cmldlr/Ceng-Editor',
                featured: false,
                visible: true,
                fromGithub: true
            }
        ],
        experience: [
            {
                id: 'naviras',
                title: 'Yazılım Mühendisi',
                date: '2024 — Günümüz',
                company: 'Naviras',
                description: 'Endüstriyel IoT platformu geliştirme. MQTT-Kafka köprüsü, TimescaleDB ile zaman serisi veri yönetimi, C# mikroservisler, Next.js dashboard ve DevExpress raporlama araçları üzerinde çalışma.',
                tech: ['C#', 'Kafka', 'MQTT', 'TimescaleDB', 'Next.js', 'Docker']
            },
            {
                id: 'university',
                title: 'Bilgisayar Mühendisliği',
                date: '2020 — 2024',
                company: 'Üniversite',
                description: 'Algoritma ve programlama, veri yapıları, bilgisayar mimarisi, bilgisayar ağları, veritabanı yönetimi, programlama dilleri kavramları üzerine kapsamlı eğitim. Proje tabanlı öğrenme ile çeşitli yazılım projeleri geliştirme.',
                tech: ['C#', 'Java', 'Python', 'Data Structures', 'Algorithms']
            },
            {
                id: 'ibm-cert',
                title: 'IBM AI Engineering Sertifikası',
                date: '2025',
                company: 'IBM / Coursera',
                description: 'Yapay zeka ve derin öğrenme konularında IBM sertifika programı. TensorFlow, Keras ve PyTorch ile model geliştirme.',
                tech: ['Python', 'TensorFlow', 'Deep Learning']
            }
        ],
        contact: {
            heading: 'Birlikte çalışalım!',
            description: 'Yeni projeler, iş fırsatları veya sadece merhaba demek için benimle iletişime geçmekten çekinmeyin.',
            links: [
                { icon: 'ph-github-logo', label: 'GitHub', value: '@cmldlr', url: 'https://github.com/cmldlr' },
                { icon: 'ph-linkedin-logo', label: 'LinkedIn', value: '@cmldlr', url: 'https://linkedin.com/in/cmldlr' },
                { icon: 'ph-envelope', label: 'E-posta', value: 'cemildalar@outlook.com', url: 'mailto:cemildalar@outlook.com' }
            ]
        }
    };

    // =============================
    // Storage Functions
    // =============================

    function getData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure new fields are present
                return deepMerge(structuredClone(DEFAULTS), parsed);
            }
        } catch (e) {
            console.warn('Portfolio data read error:', e);
        }
        return structuredClone(DEFAULTS);
    }

    function saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Portfolio data save error:', e);
            return false;
        }
    }

    function resetData() {
        localStorage.removeItem(STORAGE_KEY);
        return structuredClone(DEFAULTS);
    }

    function getSection(section) {
        const data = getData();
        return data[section] || null;
    }

    function saveSection(section, value) {
        const data = getData();
        data[section] = value;
        return saveData(data);
    }

    // =============================
    // Export / Import
    // =============================

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
                        resolve(data);
                    } else {
                        reject(new Error('Geçersiz veri formatı'));
                    }
                } catch (err) {
                    reject(new Error('JSON parse hatası: ' + err.message));
                }
            };
            reader.onerror = () => reject(new Error('Dosya okunamadı'));
            reader.readAsText(file);
        });
    }

    // =============================
    // Project Helpers
    // =============================

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
        }
        return data;
    }

    function addProject(project) {
        const data = getData();
        // Generate ID if not present
        if (!project.id) {
            project.id = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        // Check for duplicates
        const existing = data.projects.findIndex(p => p.id === project.id);
        if (existing >= 0) {
            data.projects[existing] = { ...data.projects[existing], ...project };
        } else {
            data.projects.push(project);
        }
        saveData(data);
        return data;
    }

    function updateProject(projectId, updates) {
        const data = getData();
        const idx = data.projects.findIndex(p => p.id === projectId);
        if (idx >= 0) {
            data.projects[idx] = { ...data.projects[idx], ...updates };
            saveData(data);
        }
        return data;
    }

    function removeProject(projectId) {
        const data = getData();
        data.projects = data.projects.filter(p => p.id !== projectId);
        saveData(data);
        return data;
    }

    function reorderProjects(orderedIds) {
        const data = getData();
        const ordered = [];
        orderedIds.forEach(id => {
            const p = data.projects.find(pr => pr.id === id);
            if (p) ordered.push(p);
        });
        // Add any remaining projects not in the ordered list
        data.projects.forEach(p => {
            if (!orderedIds.includes(p.id)) ordered.push(p);
        });
        data.projects = ordered;
        saveData(data);
        return data;
    }

    // =============================
    // Utility
    // =============================

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

    // =============================
    // Public API
    // =============================
    return {
        getData,
        saveData,
        resetData,
        getDefaults,
        getSection,
        saveSection,
        exportToJSON,
        importFromJSON,
        getVisibleProjects,
        toggleProjectVisibility,
        addProject,
        updateProject,
        removeProject,
        reorderProjects
    };
})();
