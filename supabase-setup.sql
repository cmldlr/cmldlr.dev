-- ============================================================
-- cmldlr.dev — Supabase Database Setup
-- Supabase SQL Editor'a yapıştır ve "Run" tıkla
-- ============================================================

-- 1. site_content tablosu
-- Her satır bir bölüm: hero, about, skills, projects, certificates, contact, translations
CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Otomatik updated_at güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON site_content
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 3. Row Level Security (RLS)
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (ziyaretçiler)
CREATE POLICY "Public read access" ON site_content
    FOR SELECT USING (true);

-- Sadece service_role yazabilir (Netlify Functions backend)
CREATE POLICY "Service role write access" ON site_content
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role update access" ON site_content
    FOR UPDATE USING (true);

CREATE POLICY "Service role delete access" ON site_content
    FOR DELETE USING (true);

-- 4. Supabase Storage — Proje & Sertifika resimleri için bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — Herkes okuyabilir, sadece authenticated/service yazabilir
CREATE POLICY "Public image read" ON storage.objects
    FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Service image upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Service image update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Service image delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'images');

-- 5. Seed Data — Mevcut data.js DEFAULTS verilerini yükle
INSERT INTO site_content (id, data) VALUES
('hero', '{
    "greeting": "Hi, I''m",
    "name": "Cemil Dalar",
    "roles": ["Software Engineer", "Backend Developer", "AI Solutions Creator", "Problem Solver"],
    "description": "<strong>Software Engineer</strong> focusing on scalable backend architectures and AI integrations. I build robust data-driven systems and API services, prioritizing clean code and high performance.",
    "badge": "Open to Work",
    "stats": [
        {"number": 21, "label": "Open Source Projects"},
        {"number": 6, "label": "Programming Languages"},
        {"number": 3, "label": "Years Experience"}
    ],
    "cvUrl": ""
}'::jsonb),

('about', '{
    "paragraphs": [
        "I am a <strong>Software Engineer</strong> with a strong foundation in Computer Engineering. I specialize in designing industrial IoT platforms, real-time data processing systems, and modern web applications.",
        "Professionally, I work extensively with MQTT-Kafka bridges, time-series data management using TimescaleDB, microservice architectures, and Next.js dashboards. Clean code, scalability, and optimal performance are my core priorities in every project.",
        "During my academic journey, I developed power outage analysis models using machine learning and built a variety of algorithms and data structure projects in Java, C#, and Python."
    ],
    "details": [
        {"icon": "ph-map-pin", "label": "Location", "value": "Turkey"},
        {"icon": "ph-graduation-cap", "label": "Education", "value": "Computer Engineering"},
        {"icon": "ph-briefcase", "label": "Position", "value": "Software Engineer"},
        {"icon": "ph-translate", "label": "Languages", "value": "Turkish, English"}
    ]
}'::jsonb),

('skills', '[
    {
        "id": "languages", "icon": "ph-code", "title": "Programming Languages",
        "tags": [
            {"name": "C#", "level": "advanced"}, {"name": "Java", "level": "advanced"},
            {"name": "JavaScript", "level": "advanced"}, {"name": "TypeScript", "level": "intermediate"},
            {"name": "Python", "level": "intermediate"}, {"name": "PHP", "level": "intermediate"},
            {"name": "SQL", "level": "beginner"}
        ]
    },
    {
        "id": "frontend", "icon": "ph-globe", "title": "Frontend",
        "tags": [
            {"name": "Next.js", "level": "advanced"}, {"name": "React", "level": "advanced"},
            {"name": "HTML5 / CSS3", "level": "advanced"}, {"name": "TailwindCSS", "level": "intermediate"},
            {"name": "DevExpress", "level": "intermediate"}
        ]
    },
    {
        "id": "backend", "icon": "ph-database", "title": "Backend & Data",
        "tags": [
            {"name": ".NET / ASP.NET", "level": "advanced"}, {"name": "TimescaleDB", "level": "advanced"},
            {"name": "PostgreSQL", "level": "advanced"}, {"name": "REST API", "level": "intermediate"},
            {"name": "SignalR", "level": "intermediate"}
        ]
    },
    {
        "id": "devops", "icon": "ph-cloud", "title": "DevOps & IoT",
        "tags": [
            {"name": "Docker", "level": "advanced"}, {"name": "Apache Kafka", "level": "advanced"},
            {"name": "MQTT", "level": "advanced"}, {"name": "Git / GitHub", "level": "intermediate"},
            {"name": "Linux", "level": "intermediate"}, {"name": "Microservices", "level": "intermediate"}
        ]
    },
    {
        "id": "other", "icon": "ph-brain", "title": "Other",
        "tags": [
            {"name": "Machine Learning", "level": "intermediate"}, {"name": "Data Analysis", "level": "intermediate"},
            {"name": "Agile / Scrum", "level": "intermediate"}, {"name": "CI/CD", "level": "beginner"}
        ]
    }
]'::jsonb),

('projects', '[
    {
        "id": "iot-platform", "title": "IoT Data Platform",
        "description": "Industrial IoT data collection, processing, and visualization platform using an MQTT → Kafka → TimescaleDB pipeline. Includes microservice architecture, real-time dashboards, and an alarm system.",
        "icon": "ph-factory", "tags": ["featured", "web"],
        "tech": ["C#", ".NET", "Kafka", "MQTT", "TimescaleDB", "Next.js", "Docker"],
        "github": "https://github.com/cmldlr", "featured": true, "visible": true, "fromGithub": false, "images": []
    },
    {
        "id": "progressio", "title": "Progressio",
        "description": "Goal tracking and management application. Offers goal setting and performance tracking features with a user-friendly interface.",
        "icon": "ph-chart-line-up", "tags": ["featured", "web"],
        "tech": ["JavaScript", "Web App"],
        "github": "https://github.com/cmldlr/Progressio", "featured": false, "visible": true, "fromGithub": true, "images": []
    },
    {
        "id": "number-maze", "title": "Number Maze",
        "description": "Number-based interactive maze game designed to enhance algorithmic thinking and problem-solving skills.",
        "icon": "ph-game-controller", "tags": ["java"],
        "tech": ["Java", "Game Dev"],
        "github": "https://github.com/cmldlr/Number-Maze", "featured": false, "visible": true, "fromGithub": true, "images": []
    },
    {
        "id": "power-outage", "title": "Power Outage Analysis",
        "description": "Analysis of power outage data using machine learning techniques. Includes data preprocessing, model training, and performance evaluation.",
        "icon": "ph-lightning", "tags": ["python", "featured"],
        "tech": ["Python", "Machine Learning", "Jupyter"],
        "github": "https://github.com/cmldlr/Analysis-power-outage-data-with-using-machine-learning", "featured": false, "visible": true, "fromGithub": true, "images": []
    },
    {
        "id": "ibm-ai", "title": "IBM AI Engineering",
        "description": "Collection of artificial intelligence and deep learning projects developed during the IBM AI Engineering certificate program.",
        "icon": "ph-robot", "tags": ["python", "featured"],
        "tech": ["Python", "AI / Deep Learning", "Jupyter"],
        "github": "https://github.com/cmldlr/IBM-AI-Engineering", "featured": false, "visible": true, "fromGithub": true, "images": []
    },
    {
        "id": "rent-a-car", "title": "Rent-A-Car Management System",
        "description": "Comprehensive car rental management system. Includes modules for vehicle tracking, customer management, and rental operations.",
        "icon": "ph-car", "tags": ["web"],
        "tech": ["PHP", "Web"],
        "github": "https://github.com/cmldlr/Rent-A-Car-Management-System", "featured": false, "visible": true, "fromGithub": true, "images": []
    },
    {
        "id": "the-matrix", "title": "The Matrix",
        "description": "Matrix operations library developed with C#. Supports basic linear algebra operations like addition, multiplication, determinant, and inverse computation.",
        "icon": "ph-grid-four", "tags": ["csharp"],
        "tech": ["C#", ".NET"],
        "github": "https://github.com/cmldlr/The-Matrix", "featured": false, "visible": true, "fromGithub": true, "images": []
    },
    {
        "id": "ceng-editor", "title": "Ceng Editor",
        "description": "A text editor built with Java. Features syntax highlighting, file management, and basic text manipulation functionalities.",
        "icon": "ph-text-aa", "tags": ["java"],
        "tech": ["Java", "Swing"],
        "github": "https://github.com/cmldlr/Ceng-Editor", "featured": false, "visible": true, "fromGithub": true, "images": []
    }
]'::jsonb),

('certificates', '[
    {
        "id": "ibm-ai-cert", "title": "IBM AI Engineering",
        "issuer": "IBM / Coursera", "date": "2025",
        "description": "Professional certificate covering AI and deep learning. Includes practical projects utilizing TensorFlow, Keras, and PyTorch.",
        "icon": "ph-robot", "credential": "",
        "tech": ["Python", "TensorFlow", "PyTorch", "Deep Learning"]
    },
    {
        "id": "google-it", "title": "Google IT Support",
        "issuer": "Google / Coursera", "date": "2023",
        "description": "Professional certificate focusing on IT support, network administration, security, and systems management.",
        "icon": "ph-shield-check", "credential": "",
        "tech": ["Networking", "Security", "Linux", "Troubleshooting"]
    }
]'::jsonb),

('contact', '{
    "heading": "Let''s work together!",
    "description": "Feel free to reach out for new projects, job opportunities, or just to say hello.",
    "links": [
        {"icon": "ph-github-logo", "label": "GitHub", "value": "@cmldlr", "url": "https://github.com/cmldlr"},
        {"icon": "ph-linkedin-logo", "label": "LinkedIn", "value": "@cmldlr", "url": "https://linkedin.com/in/cmldlr"},
        {"icon": "ph-envelope", "label": "E-posta", "value": "contact@cmldlr.dev", "url": "mailto:contact@cmldlr.dev"}
    ]
}'::jsonb),

('translations', '{
    "tr": {
        "hero": {
            "greeting": "Merhaba, ben",
            "description": "Backend mimarileri ve yapay zeka entegrasyonlarına odaklanan <strong>Yazılım Mühendisi</strong>. Performans ve ölçeklenebilirlik öncelikli, veri odaklı sistemler ve servisler geliştiriyorum.",
            "badge": "Çalışmaya Açık"
        },
        "about": {
            "paragraphs": [
                "Bilgisayar Mühendisliği geçmişine sahip bir <strong>Yazılım Mühendisi</strong>yim. Endüstriyel IoT platformları, gerçek zamanlı veri işleme sistemleri ve modern web uygulamaları tasarımı konusunda uzmanlaşıyorum.",
                "Profesyonel olarak MQTT-Kafka köprüleri, TimescaleDB ile zaman serisi veri yönetimi, mikroservis mimarileri ve Next.js tabanlı dashboardlar üzerinde çalışıyorum. Her projemde temiz kod, ölçeklenebilirlik ve performans önceliğimdir.",
                "Akademik geçmişimde makine öğrenmesi ile güç kesintisi analizi yapan modeller geliştirdim; ayrıca Java, C# ve Python kullanarak çeşitli algoritma ve veri yapısı projeleri ürettim."
            ],
            "details": [
                {"label": "Konum", "value": "Türkiye"},
                {"label": "Eğitim", "value": "Bilgisayar Mühendisliği"},
                {"label": "Pozisyon", "value": "Yazılım Mühendisi"},
                {"label": "Diller", "value": "Türkçe, İngilizce"}
            ]
        },
        "contact": {
            "heading": "Birlikte çalışalım!",
            "description": "Yeni projeler, iş fırsatları veya sadece merhaba demek için benimle iletişime geçmekten çekinmeyin."
        }
    }
}'::jsonb)

ON CONFLICT (id) DO NOTHING;
