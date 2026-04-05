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
                id: 'languages',
                icon: 'ph-code',
                title: 'Programming Languages',
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
                title: 'Backend & Data',
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
                title: 'Other',
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
                description: 'Industrial IoT data collection, processing, and visualization platform using an MQTT → Kafka → TimescaleDB pipeline. Includes microservice architecture, real-time dashboards, and an alarm system.',
                icon: 'ph-factory',
                tags: ['featured', 'web'],
                tech: ['C#', '.NET', 'Kafka', 'MQTT', 'TimescaleDB', 'Next.js', 'Docker'],
                github: 'https://github.com/cmldlr',
                featured: true,
                visible: true,
                fromGithub: false,
                images: []
            },
            {
                id: 'progressio',
                title: 'Progressio',
                description: 'Goal tracking and management application. Offers goal setting and performance tracking features with a user-friendly interface.',
                icon: 'ph-chart-line-up',
                tags: ['featured', 'web'],
                tech: ['JavaScript', 'Web App'],
                github: 'https://github.com/cmldlr/Progressio',
                featured: false,
                visible: true,
                fromGithub: true,
                images: []
            },
            {
                id: 'number-maze',
                title: 'Number Maze',
                description: 'Number-based interactive maze game designed to enhance algorithmic thinking and problem-solving skills.',
                icon: 'ph-game-controller',
                tags: ['java'],
                tech: ['Java', 'Game Dev'],
                github: 'https://github.com/cmldlr/Number-Maze',
                featured: false,
                visible: true,
                fromGithub: true,
                images: []
            },
            {
                id: 'power-outage',
                title: 'Power Outage Analysis',
                description: 'Analysis of power outage data using machine learning techniques. Includes data preprocessing, model training, and performance evaluation.',
                icon: 'ph-lightning',
                tags: ['python', 'featured'],
                tech: ['Python', 'Machine Learning', 'Jupyter'],
                github: 'https://github.com/cmldlr/Analysis-power-outage-data-with-using-machine-learning',
                featured: false,
                visible: true,
                fromGithub: true,
                images: []
            },
            {
                id: 'ibm-ai',
                title: 'IBM AI Engineering',
                description: 'Collection of artificial intelligence and deep learning projects developed during the IBM AI Engineering certificate program.',
                icon: 'ph-robot',
                tags: ['python', 'featured'],
                tech: ['Python', 'AI / Deep Learning', 'Jupyter'],
                github: 'https://github.com/cmldlr/IBM-AI-Engineering',
                featured: false,
                visible: true,
                fromGithub: true,
                images: []
            },
            {
                id: 'rent-a-car',
                title: 'Rent-A-Car Management System',
                description: 'Comprehensive car rental management system. Includes modules for vehicle tracking, customer management, and rental operations.',
                icon: 'ph-car',
                tags: ['web'],
                tech: ['PHP', 'Web'],
                github: 'https://github.com/cmldlr/Rent-A-Car-Management-System',
                featured: false,
                visible: true,
                fromGithub: true,
                images: []
            },
            {
                id: 'the-matrix',
                title: 'The Matrix',
                description: 'Matrix operations library developed with C#. Supports basic linear algebra operations like addition, multiplication, determinant, and inverse computation.',
                icon: 'ph-grid-four',
                tags: ['csharp'],
                tech: ['C#', '.NET'],
                github: 'https://github.com/cmldlr/The-Matrix',
                featured: false,
                visible: true,
                fromGithub: true,
                images: []
            },
            {
                id: 'ceng-editor',
                title: 'Ceng Editor',
                description: 'A text editor built with Java. Features syntax highlighting, file management, and basic text manipulation functionalities.',
                icon: 'ph-text-aa',
                tags: ['java'],
                tech: ['Java', 'Swing'],
                github: 'https://github.com/cmldlr/Ceng-Editor',
                featured: false,
                visible: true,
                fromGithub: true,
                images: []
            }
        ],
        certificates: [
            {
                id: 'ibm-ai-cert',
                title: 'IBM AI Engineering',
                issuer: 'IBM / Coursera',
                date: '2025',
                description: 'Professional certificate covering AI and deep learning. Includes practical projects utilizing TensorFlow, Keras, and PyTorch.',
                icon: 'ph-robot',
                credential: '',
                tech: ['Python', 'TensorFlow', 'PyTorch', 'Deep Learning']
            },
            {
                id: 'google-it',
                title: 'Google IT Support',
                issuer: 'Google / Coursera',
                date: '2023',
                description: 'Professional certificate focusing on IT support, network administration, security, and systems management.',
                icon: 'ph-shield-check',
                credential: '',
                tech: ['Networking', 'Security', 'Linux', 'Troubleshooting']
            }
        ],
        contact: {
            heading: 'Let\'s work together!',
            description: 'Feel free to reach out for new projects, job opportunities, or just to say hello.',
            links: [
                { icon: 'ph-github-logo', label: 'GitHub', value: '@cmldlr', url: 'https://github.com/cmldlr' },
                { icon: 'ph-linkedin-logo', label: 'LinkedIn', value: '@cmldlr', url: 'https://linkedin.com/in/cmldlr' },
                { icon: 'ph-envelope', label: 'E-posta', value: 'contact@cmldlr.dev', url: 'mailto:contact@cmldlr.dev' }
            ]
        },
        translations: {
            tr: {
                hero: {
                    greeting: 'Merhaba, ben',
                    description: 'Backend mimarileri ve yapay zeka entegrasyonlarına odaklanan <strong>Yazılım Mühendisi</strong>. Performans ve ölçeklenebilirlik öncelikli, veri odaklı sistemler ve servisler geliştiriyorum.',
                    badge: 'Çalışmaya Açık'
                },
                about: {
                    paragraphs: [
                        'Bilgisayar Mühendisliği geçmişine sahip bir <strong>Yazılım Mühendisi</strong>yim. Endüstriyel IoT platformları, gerçek zamanlı veri işleme sistemleri ve modern web uygulamaları tasarımı konusunda uzmanlaşıyorum.',
                        'Profesyonel olarak MQTT-Kafka köprüleri, TimescaleDB ile zaman serisi veri yönetimi, mikroservis mimarileri ve Next.js tabanlı dashboard\'lar üzerinde çalışıyorum. Her projemde temiz kod, ölçeklenebilirlik ve performans önceliğimdir.',
                        'Akademik geçmişimde makine öğrenmesi ile güç kesintisi analizi yapan modeller geliştirdim; ayrıca Java, C# ve Python kullanarak çeşitli algoritma ve veri yapısı projeleri ürettim.'
                    ],
                    details: [
                        { label: 'Konum', value: 'Türkiye' },
                        { label: 'Eğitim', value: 'Bilgisayar Mühendisliği' },
                        { label: 'Pozisyon', value: 'Yazılım Mühendisi' },
                        { label: 'Diller', value: 'Türkçe, İngilizce' }
                    ]
                },
                contact: {
                    heading: 'Birlikte çalışalım!',
                    description: 'Yeni projeler, iş fırsatları veya sadece merhaba demek için benimle iletişime geçmekten çekinmeyin.'
                }
            }
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
    // Certificate Helpers
    // =============================

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
        return data;
    }

    function updateCertificate(certId, updates) {
        const data = getData();
        if (!data.certificates) return data;
        const idx = data.certificates.findIndex(c => c.id === certId);
        if (idx >= 0) {
            data.certificates[idx] = { ...data.certificates[idx], ...updates };
            saveData(data);
        }
        return data;
    }

    function removeCertificate(certId) {
        const data = getData();
        if (!data.certificates) return data;
        data.certificates = data.certificates.filter(c => c.id !== certId);
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
        reorderProjects,
        addCertificate,
        updateCertificate,
        removeCertificate
    };
})();
