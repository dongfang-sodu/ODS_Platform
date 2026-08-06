import { useLanguage } from '../i18n'

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()
  return <div className="language-toggle" role="group" aria-label={t('language.switch')}>
    <button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
    <button type="button" className={language === 'zh' ? 'active' : ''} aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button>
  </div>
}
