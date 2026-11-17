import re
import os

with open('VoiceCallModal.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. State
c = c.replace('const [voiceGender, setVoiceGender] = useState(\'female\');', 'const [voiceGender, setVoiceGender] = useState(\'female\');\n  const [callLang, setCallLang] = useState(language);\n  const callLangRef = useRef(callLang);\n  useEffect(() => { callLangRef.current = callLang; }, [callLang]);\n  useEffect(() => { setCallLang(language); }, [language]);')

# 2. Replace language -> callLang
c = re.sub(r'(?<!\w)language(?!\w)(?! =)', 'callLang', c)
c = c.replace('export default function VoiceCallModal({ isOpen, onClose, instructor, videoId, callLang = \'ar\' })', 'export default function VoiceCallModal({ isOpen, onClose, instructor, videoId, language = \'ar\' })')

# 3. Add Language toggle button
btn = """<button 
            onClick={() => setCallLang(prev => prev === 'ar' ? 'en' : 'ar')}
            className="w-16 h-16 rounded-full bg-white/5 text-slate-300 flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-md border border-white/10 text-2xl font-bold shadow-lg"
            title={callLang === 'ar' ? 'تغيير اللغة (EN/AR)' : 'Toggle Language (EN/AR)'}
          >
            {callLang === 'ar' ? 'عع' : 'EN'}
          </button>
          
          <button 
            onClick={() => setIsMuted(!isMuted)}"""
c = c.replace('<button \n            onClick={() => setIsMuted(!isMuted)}', btn)

# 4. Fix voice toggle bug
old_v = """setVoiceGender(prev => prev === 'female' ? 'male' : 'female');
              // Speak a quick test if not in a call
              if (callStatus !== 'Speaking' && callStatus !== 'Listening' && callStatus !== 'Thinking...') {
                const utterance = new SpeechSynthesisUtterance(callLang === 'ar' ? (voiceGender === 'female' ? 'صوت رجل' : 'صوت امرأة') : (voiceGender === 'female' ? 'Male Voice' : 'Female Voice'));
                utterance.voice = getBestVoice();
                window.speechSynthesis.speak(utterance);
              }"""
new_v = """const newGender = voiceGender === 'female' ? 'male' : 'female';
              setVoiceGender(newGender);
              voiceGenderRef.current = newGender; // Force immediate update
              if (callStatus !== 'Speaking' && callStatus !== 'Listening' && callStatus !== 'Thinking...') {
                const utterance = new SpeechSynthesisUtterance(callLang === 'ar' ? (newGender === 'male' ? 'صوت رجل' : 'صوت امرأة') : (newGender === 'male' ? 'Male Voice' : 'Female Voice'));
                utterance.lang = callLang === 'ar' ? 'ar-SA' : 'en-US';
                utterance.voice = getBestVoice();
                window.speechSynthesis.speak(utterance);
              }"""
c = c.replace(old_v, new_v)

with open('VoiceCallModal.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('SUCCESS')
