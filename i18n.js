/**
 * i18n — Internationalization System
 * Türkçe / English language support
 */

const I18n = (() => {
    const LANG_KEY = 'portfolio_lang';

    const translations = {
        tr: {
            // Nav
            'nav.about': 'Hakkımda',
            'nav.skills': 'Yetenekler',
            'nav.projects': 'Projeler',
            'nav.certificates': 'Sertifikalar',
            'nav.contact': 'İletişim',

            // Section Tags & Titles
            'section.about.tag': '// 01',
            'section.about.title': 'Hakkımda',
            'section.github.tag': '// GitHub',
            'section.github.title': 'Katkı Grafiği',
            'section.skills.tag': '// 02',
            'section.skills.title': 'Yetenekler',
            'section.projects.tag': '// 03',
            'section.projects.title': 'Projeler',
            'section.certificates.tag': '// 04',
            'section.certificates.title': 'Sertifikalar',
            'section.contact.tag': '// 05',
            'section.contact.title': 'İletişim',

            // Hero
            'hero.badge': 'Çalışmaya Açık',
            'hero.greeting': 'Merhaba, ben',
            'hero.cta.projects': 'Projelerimi Gör',
            'hero.cta.contact': 'İletişime Geç',
            'hero.cta.cv': 'CV İndir',

            // GitHub
            'github.contributions': 'son 1 yılda katkı',
            'github.loading': 'Yükleniyor...',
            'github.visit': 'GitHub profilini ziyaret et',
            'github.less': 'Az',
            'github.more': 'Çok',
            'github.days.mon': 'Pzt',
            'github.days.wed': 'Çar',
            'github.days.fri': 'Cum',
            'github.months': ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
            'github.fullMonths': ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
            'github.dayNames': ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
            'github.tooltip': '{count} katkı — {day}, {date} {month} {year}',
            'github.error': 'Katkı verileri yüklenemedi.',

            // Projects
            'projects.all': 'Tümü',
            'projects.featured': 'Öne Çıkan',
            'projects.see_all': 'Tüm Projeleri Gör',

            // Certificates
            'certificates.view': 'Görüntüle',
            'certificates.empty': 'Henüz sertifika eklenmedi.',

            // Footer
            'footer.text': 'Tasarım & Geliştirme — Cemil Dalar © 2026',

            // Filter labels
            'filter.featured': 'Öne Çıkan',
            'filter.web': 'Web',
            'filter.java': 'Java',
            'filter.csharp': 'C#',
            'filter.python': 'Python',

            // Preloader
            'preloader.loading': 'Yükleniyor'
        },
        en: {
            // Nav
            'nav.about': 'About',
            'nav.skills': 'Skills',
            'nav.projects': 'Projects',
            'nav.certificates': 'Certificates',
            'nav.contact': 'Contact',

            // Section Tags & Titles
            'section.about.tag': '// 01',
            'section.about.title': 'About Me',
            'section.github.tag': '// GitHub',
            'section.github.title': 'Contribution Graph',
            'section.skills.tag': '// 02',
            'section.skills.title': 'Skills',
            'section.projects.tag': '// 03',
            'section.projects.title': 'Projects',
            'section.certificates.tag': '// 04',
            'section.certificates.title': 'Certificates',
            'section.contact.tag': '// 05',
            'section.contact.title': 'Contact',

            // Hero
            'hero.badge': 'Open to Work',
            'hero.greeting': 'Hi, I\'m',
            'hero.cta.projects': 'View My Projects',
            'hero.cta.contact': 'Get in Touch',
            'hero.cta.cv': 'Download CV',

            // GitHub
            'github.contributions': 'contributions in the last year',
            'github.loading': 'Loading...',
            'github.visit': 'Visit GitHub profile',
            'github.less': 'Less',
            'github.more': 'More',
            'github.days.mon': 'Mon',
            'github.days.wed': 'Wed',
            'github.days.fri': 'Fri',
            'github.months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            'github.fullMonths': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            'github.dayNames': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            'github.tooltip': '{count} contributions — {day}, {month} {date}, {year}',
            'github.error': 'Failed to load contribution data.',

            // Projects
            'projects.all': 'All',
            'projects.featured': 'Featured',
            'projects.see_all': 'See All Projects',

            // Certificates
            'certificates.view': 'View',
            'certificates.empty': 'No certificates yet.',

            // Footer
            'footer.text': 'Designed & Developed by Cemil Dalar © 2026',

            // Filter labels
            'filter.featured': 'Featured',
            'filter.web': 'Web',
            'filter.java': 'Java',
            'filter.csharp': 'C#',
            'filter.python': 'Python',

            // Preloader
            'preloader.loading': 'Loading'
        }
    };

    // Data translations are now fetched dynamically from PortfolioData (data.js)

    function getLang() {
        return localStorage.getItem(LANG_KEY) || 'en';
    }

    function setLang(lang) {
        localStorage.setItem(LANG_KEY, lang);
    }

    function t(key) {
        const lang = getLang();
        return translations[lang]?.[key] || translations['en']?.[key] || key;
    }

    function getDataTranslation(section) {
        const lang = getLang();
        const data = PortfolioData.getData();
        if (data && data.translations) {
            return data.translations[lang]?.[section] || data.translations['en']?.[section] || null;
        }
        return null;
    }

    function applyToDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val) el.textContent = val;
        });
        // Update html lang attribute
        document.documentElement.lang = getLang();
    }

    return {
        getLang,
        setLang,
        t,
        getDataTranslation,
        applyToDOM
    };
})();
