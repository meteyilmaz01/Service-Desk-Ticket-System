import { useLanguage } from './LanguageContext';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { currentLanguage: lang, setCurrentLanguage: setLang } = useLanguage();

    const languages = [
        { code: 'EN', name: 'English', flag: '🇬🇧' },
        { code: 'TR', name: 'Türkçe', flag: '🇹🇷' }
    ];

    const currentLang = languages.find(l => l.code === lang);

    return (
        <div className="language-switcher">
            <button className="lang-btn" aria-haspopup="listbox">
                <span className="lang-flag">{currentLang.flag}</span>
                {currentLang.code}
            </button>
            <div className="lang-dropdown" role="listbox">
                {languages.map((l) => (
                    <div 
                        key={l.code} 
                        className={`lang-option ${lang === l.code ? 'active' : ''}`}
                        onClick={() => setLang(l.code)}
                        role="option"
                        aria-selected={lang === l.code}
                    >
                        <span><span className="lang-flag">{l.flag}</span> {l.name}</span>
                        {lang === l.code && <span className="check-icon">✓</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LanguageSwitcher;
