import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowLeft, ArrowRight, BarChart3, Bell, BookHeart, Brain,
  CalendarDays, Check, ChevronRight, CircleHelp, Clock3, CloudRain,
  Dumbbell, Headphones, Heart, Home, Leaf, LockKeyhole, Menu, MessageCircleHeart,
  MoonStar, MoreHorizontal, Music2, Pause, Play, Plus, RotateCcw, ShieldCheck,
  Sparkles, SunMedium, Trash2, TrendingUp, Wind, X,
} from 'lucide-react'

type View = 'home' | 'journal' | 'insights' | 'care'
type MoodKey = 'joy' | 'calm' | 'tired' | 'anxious' | 'sad' | 'angry'

type Entry = {
  id: number
  createdAt: string
  mood: MoodKey
  intensity: number
  triggers: string[]
  note: string
  body: string[]
}

const moods: { key: MoodKey; label: string; face: string; color: string; score: number }[] = [
  { key: 'joy', label: '开心', face: '◡', color: '#f6b84a', score: 5 },
  { key: 'calm', label: '平静', face: '—', color: '#67a989', score: 4 },
  { key: 'tired', label: '疲惫', face: '⌒', color: '#8d8baf', score: 3 },
  { key: 'anxious', label: '焦虑', face: '﹏', color: '#e89572', score: 2 },
  { key: 'sad', label: '低落', face: '︵', color: '#6e91b4', score: 1 },
  { key: 'angry', label: '生气', face: '︿', color: '#d66a5f', score: 1 },
]

const triggerOptions = ['工作 / 学业', '人际关系', '睡眠', '身体状态', '家庭', '经济', '自我期待', '独处', '运动', '好消息']
const bodyOptions = ['头部紧绷', '肩颈僵硬', '胸口发闷', '胃不舒服', '身体沉重', '没有明显感觉']

const dateOffset = (days: number, hour: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 10, 0, 0)
  return d.toISOString()
}

const demoEntries: Entry[] = [
  { id: 101, createdAt: dateOffset(0, 9), mood: 'calm', intensity: 3, triggers: ['睡眠', '独处'], note: '昨晚睡得不错。早上没有急着看消息，慢慢吃了早餐。', body: ['没有明显感觉'] },
  { id: 102, createdAt: dateOffset(1, 22), mood: 'anxious', intensity: 4, triggers: ['工作 / 学业', '自我期待'], note: '汇报前总觉得准备得不够好，一直在反复修改。', body: ['肩颈僵硬', '胸口发闷'] },
  { id: 103, createdAt: dateOffset(2, 18), mood: 'joy', intensity: 4, triggers: ['运动', '好消息'], note: '下班后跑了三公里，朋友发来了周末见面的消息。', body: ['没有明显感觉'] },
  { id: 104, createdAt: dateOffset(3, 23), mood: 'tired', intensity: 4, triggers: ['睡眠', '工作 / 学业'], note: '连续开会，脑子像塞满了东西，只想安静一会儿。', body: ['头部紧绷', '身体沉重'] },
  { id: 105, createdAt: dateOffset(4, 20), mood: 'sad', intensity: 3, triggers: ['人际关系', '自我期待'], note: '一句无心的话让我想了很久，担心自己是不是太敏感。', body: ['胸口发闷'] },
  { id: 106, createdAt: dateOffset(5, 12), mood: 'calm', intensity: 2, triggers: ['独处', '运动'], note: '午休散步时晒到了太阳，心里慢慢安静下来。', body: ['没有明显感觉'] },
  { id: 107, createdAt: dateOffset(6, 16), mood: 'joy', intensity: 5, triggers: ['好消息', '人际关系'], note: '项目被肯定了，和同事一起庆祝，觉得努力有了回应。', body: ['没有明显感觉'] },
]

const careItems = [
  { id: 'breath', title: '呼吸复位', meta: '2 分钟 · 立即练习', desc: '用 4—4 节奏，让身体先慢下来。', icon: Wind, tone: 'green', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80' },
  { id: 'music', title: '白噪专注', meta: '10 分钟 · 环境声', desc: '暂时离开信息流，留一点听觉空间。', icon: Headphones, tone: 'blue', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80' },
  { id: 'move', title: '肩颈舒展', meta: '3 分钟 · 轻运动', desc: '释放久坐积累的紧绷，不追求标准。', icon: Dumbbell, tone: 'coral', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80' },
]

function moodByKey(key: MoodKey) {
  return moods.find((m) => m.key === key)!
}

function formatDate(value: string, full = false) {
  const d = new Date(value)
  if (full) return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const today = new Date()
  const diff = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000)
  return diff === 0 ? '今天' : diff === 1 ? '昨天' : `${d.getMonth() + 1}月${d.getDate()}日`
}

function App() {
  const [view, setView] = useState<View>('home')
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem('zhaojian-entries')
    return saved ? JSON.parse(saved) : demoEntries
  })
  const [recordOpen, setRecordOpen] = useState(false)
  const [careOpen, setCareOpen] = useState<string | null>(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => localStorage.setItem('zhaojian-entries', JSON.stringify(entries)), [entries])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  const addEntry = (entry: Entry) => {
    setEntries((prev) => [entry, ...prev])
    setRecordOpen(false)
    setView('home')
    setToast('这一刻已经被好好接住了')
  }

  const removeEntry = (id: number) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
    setToast('记录已删除')
  }

  const navigate = (next: View) => {
    setView(next)
    setMobileMenu(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('home')} aria-label="返回首页">
          <span className="brand-mark"><Leaf size={20} strokeWidth={2.2} /></span>
          <span>照见</span>
          <small>情绪日记</small>
        </button>
        <nav className="desktop-nav" aria-label="主导航">
          <NavButton active={view === 'home'} icon={Home} label="今天" onClick={() => navigate('home')} />
          <NavButton active={view === 'journal'} icon={BookHeart} label="日记" onClick={() => navigate('journal')} />
          <NavButton active={view === 'insights'} icon={BarChart3} label="洞察" onClick={() => navigate('insights')} />
          <NavButton active={view === 'care'} icon={Heart} label="自我关怀" onClick={() => navigate('care')} />
        </nav>
        <div className="header-actions">
          <button className="privacy-pill" onClick={() => setPrivacyOpen(true)}><LockKeyhole size={15} /> 本地私密</button>
          <button className="icon-button desktop-only" title="提醒"><Bell size={19} /></button>
          <button className="icon-button mobile-only" onClick={() => setMobileMenu(!mobileMenu)} aria-label="打开菜单"><Menu size={21} /></button>
        </div>
      </header>

      {mobileMenu && (
        <div className="mobile-menu">
          <NavButton active={view === 'home'} icon={Home} label="今天" onClick={() => navigate('home')} />
          <NavButton active={view === 'journal'} icon={BookHeart} label="日记" onClick={() => navigate('journal')} />
          <NavButton active={view === 'insights'} icon={BarChart3} label="洞察" onClick={() => navigate('insights')} />
          <NavButton active={view === 'care'} icon={Heart} label="自我关怀" onClick={() => navigate('care')} />
        </div>
      )}

      <main>
        {view === 'home' && <HomeView entries={entries} onRecord={() => setRecordOpen(true)} onNavigate={navigate} onCare={setCareOpen} />}
        {view === 'journal' && <JournalView entries={entries} onRecord={() => setRecordOpen(true)} onDelete={removeEntry} />}
        {view === 'insights' && <InsightsView entries={entries} />}
        {view === 'care' && <CareView onCare={setCareOpen} />}
      </main>

      <nav className="bottom-nav" aria-label="移动端导航">
        <NavButton active={view === 'home'} icon={Home} label="今天" onClick={() => navigate('home')} />
        <NavButton active={view === 'journal'} icon={BookHeart} label="日记" onClick={() => navigate('journal')} />
        <button className="mobile-record" onClick={() => setRecordOpen(true)} aria-label="记录情绪"><Plus size={25} /></button>
        <NavButton active={view === 'insights'} icon={BarChart3} label="洞察" onClick={() => navigate('insights')} />
        <NavButton active={view === 'care'} icon={Heart} label="关怀" onClick={() => navigate('care')} />
      </nav>

      {recordOpen && <RecordModal onClose={() => setRecordOpen(false)} onSave={addEntry} />}
      {careOpen && <CareSession type={careOpen} onClose={() => setCareOpen(null)} />}
      {privacyOpen && <PrivacyModal onClose={() => setPrivacyOpen(false)} onClear={() => { setEntries([]); setPrivacyOpen(false); setToast('本地记录已清空') }} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  )
}

function NavButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Home; label: string; onClick: () => void }) {
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}><Icon size={18} /><span>{label}</span></button>
}

function HomeView({ entries, onRecord, onNavigate, onCare }: { entries: Entry[]; onRecord: () => void; onNavigate: (v: View) => void; onCare: (id: string) => void }) {
  const recent = entries[0]
  const todayCount = entries.filter((e) => formatDate(e.createdAt) === '今天').length
  const chart = getLastSevenDays(entries)
  const average = chart.reduce((sum, day) => sum + day.score, 0) / chart.length
  const recommendation = average < 3 ? careItems[0] : careItems[2]
  const RecIcon = recommendation.icon

  return (
    <div className="page home-page">
      <section className="welcome-row">
        <div>
          <p className="eyebrow"><SunMedium size={15} /> {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
          <h1>晚上好，今天的你还好吗？</h1>
          <p className="subtle">不用急着变好，先听听此刻的自己。</p>
        </div>
        <button className="primary-button desktop-only" onClick={onRecord}><Plus size={19} /> 记录此刻</button>
      </section>

      <section className="checkin-panel">
        <div className="checkin-copy">
          <span className="section-kicker">30 秒情绪签到</span>
          <h2>此刻，哪一种感受<br />最接近你？</h2>
          <p>每一种感受都值得被看见。选择没有对错。</p>
          <button className="light-button" onClick={onRecord}>开始记录 <ArrowRight size={17} /></button>
        </div>
        <div className="mood-orbit" aria-hidden="true">
          <div className="orbit-center"><Sparkles size={25} /><span>停一下</span><small>感受自己</small></div>
          {moods.map((mood, index) => (
            <button key={mood.key} className={`orbit-mood orbit-${index}`} style={{ '--mood-color': mood.color } as React.CSSProperties} onClick={onRecord}>
              <span>{mood.face}</span><small>{mood.label}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel week-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">情绪趋势</span><h3>最近 7 天</h3></div>
            <button className="text-button" onClick={() => onNavigate('insights')}>查看洞察 <ChevronRight size={16} /></button>
          </div>
          <div className="week-chart">
            {chart.map((day, index) => (
              <div className="day-column" key={day.date}>
                <div className="bar-track"><div className="bar-fill" style={{ height: `${22 + day.score * 13}%`, background: day.color }}><span>{moodByKey(day.mood).face}</span></div></div>
                <small>{index === 6 ? '今天' : day.weekday}</small>
              </div>
            ))}
          </div>
          <p className="chart-note"><TrendingUp size={16} /> 本周平静与愉快时刻占比 <strong>{Math.round(chart.filter((d) => d.score >= 4).length / 7 * 100)}%</strong></p>
        </section>

        <section className="panel moment-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">今日片刻</span><h3>{todayCount ? `已记录 ${todayCount} 次` : '还没有记录'}</h3></div>
            <Clock3 size={19} className="muted-icon" />
          </div>
          {recent ? (
            <div className="recent-entry">
              <div className="mood-dot" style={{ background: moodByKey(recent.mood).color }}>{moodByKey(recent.mood).face}</div>
              <div><strong>{moodByKey(recent.mood).label} · {recent.intensity}/5</strong><p>{recent.note || '留下了这一刻的感受。'}</p><small>{formatDate(recent.createdAt, true)} · {recent.triggers.join('、')}</small></div>
            </div>
          ) : <div className="empty-compact">写下第一条记录，开始看见自己的情绪规律。</div>}
          <button className="outline-button" onClick={() => onNavigate('journal')}>查看全部日记 <ArrowRight size={16} /></button>
        </section>
      </div>

      <section className="care-strip">
        <div className="care-copy">
          <span className="section-kicker">此刻适合你</span>
          <h2>{recommendation.title}</h2>
          <p>{recommendation.desc}</p>
          <button className="dark-button" onClick={() => onCare(recommendation.id)}><Play size={17} fill="currentColor" /> 开始练习</button>
        </div>
        <div className="care-photo" style={{ backgroundImage: `url(${recommendation.image})` }}>
          <div className="care-badge"><RecIcon size={17} /> {recommendation.meta}</div>
        </div>
      </section>

      <footer className="safety-note"><ShieldCheck size={16} /><span>照见提供日常情绪支持，不替代专业诊疗。若你正处于危机中，请立即联系身边可信任的人或当地紧急援助。</span></footer>
    </div>
  )
}

function JournalView({ entries, onRecord, onDelete }: { entries: Entry[]; onRecord: () => void; onDelete: (id: number) => void }) {
  const [filter, setFilter] = useState<'all' | MoodKey>('all')
  const filtered = filter === 'all' ? entries : entries.filter((e) => e.mood === filter)
  return (
    <div className="page">
      <section className="page-title-row">
        <div><p className="eyebrow"><BookHeart size={15} /> 我的日记</p><h1>每一种感受，都有来处</h1><p className="subtle">回看不是为了评判，而是更懂自己一点。</p></div>
        <button className="primary-button" onClick={onRecord}><Plus size={19} /> 写一条</button>
      </section>
      <div className="filter-row">
        <button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>全部 {entries.length}</button>
        {moods.map((m) => <button key={m.key} className={filter === m.key ? 'selected' : ''} onClick={() => setFilter(m.key)}><span style={{ color: m.color }}>{m.face}</span>{m.label}</button>)}
      </div>
      <section className="journal-list">
        {filtered.length ? filtered.map((entry) => {
          const mood = moodByKey(entry.mood)
          return <article className="journal-entry" key={entry.id}>
            <div className="entry-date"><strong>{formatDate(entry.createdAt)}</strong><small>{new Date(entry.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</small></div>
            <div className="entry-mood" style={{ background: mood.color }}><span>{mood.face}</span></div>
            <div className="entry-body">
              <div className="entry-title"><h3>{mood.label} <small>强度 {entry.intensity}/5</small></h3><button className="icon-button small danger" title="删除记录" onClick={() => onDelete(entry.id)}><Trash2 size={16} /></button></div>
              <p>{entry.note || '没有写下文字，也是一份真实的记录。'}</p>
              <div className="tag-row">{entry.triggers.map((t) => <span key={t}>{t}</span>)}{entry.body.slice(0, 2).map((t) => <span className="body-tag" key={t}>{t}</span>)}</div>
            </div>
          </article>
        }) : <div className="empty-state"><CloudRain size={34} /><h3>这里暂时没有记录</h3><p>换个筛选条件，或记录一下此刻。</p><button className="outline-button" onClick={onRecord}>记录此刻</button></div>}
      </section>
    </div>
  )
}

function InsightsView({ entries }: { entries: Entry[] }) {
  const chart = getLastSevenDays(entries)
  const triggerCounts = useMemo(() => {
    const counts = new Map<string, number>()
    entries.forEach((e) => e.triggers.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)))
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [entries])
  const moodCounts = moods.map((m) => ({ ...m, count: entries.filter((e) => e.mood === m.key).length }))
  const topTrigger = triggerCounts[0]?.[0] || '暂无'
  const sleepNegative = entries.filter((e) => e.triggers.includes('睡眠') && ['tired', 'anxious', 'sad', 'angry'].includes(e.mood)).length

  return (
    <div className="page">
      <section className="page-title-row compact">
        <div><p className="eyebrow"><Brain size={15} /> 情绪洞察</p><h1>从记录里，看见规律</h1><p className="subtle">分析只基于你的本地记录，不上传任何日记内容。</p></div>
        <div className="range-control"><button className="selected">近 7 天</button><button>近 30 天</button></div>
      </section>

      <section className="insight-hero">
        <div className="insight-mark"><Sparkles size={22} /></div>
        <div><span className="section-kicker">本周智能洞察</span><h2>{sleepNegative > 0 ? '睡眠不足，可能正在放大你的压力感受' : `${topTrigger}，是最近最常出现的情绪线索`}</h2><p>{sleepNegative > 0 ? `近 7 条记录中，有 ${sleepNegative} 次负面感受和「睡眠」同时出现。今晚可以尝试比平时早 20 分钟离开屏幕。` : '保持记录，我们会在更多线索出现后给出更具体的建议。'}</p></div>
      </section>

      <div className="insights-grid">
        <section className="panel trend-large">
          <div className="panel-heading"><div><span className="section-kicker">情绪能量</span><h3>一周起伏</h3></div><span className="legend"><i /> 越高越积极</span></div>
          <div className="line-chart">
            <svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-label="一周情绪趋势图">
              <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#529078" stopOpacity=".28"/><stop offset="1" stopColor="#529078" stopOpacity="0"/></linearGradient></defs>
              {[30, 80, 130, 180].map((y) => <line key={y} x1="20" y1={y} x2="680" y2={y} stroke="#e8e7e1" strokeDasharray="4 8" />)}
              <path d={areaPath(chart)} fill="url(#area)" />
              <polyline points={linePoints(chart)} fill="none" stroke="#39755f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              {chart.map((d, i) => <circle key={d.date} cx={20 + i * 110} cy={200 - d.score * 34} r="6" fill="#f8f7f2" stroke="#39755f" strokeWidth="4" />)}
            </svg>
            <div className="chart-labels">{chart.map((d, i) => <span key={d.date}>{i === 6 ? '今天' : d.weekday}</span>)}</div>
          </div>
        </section>

        <section className="panel trigger-panel">
          <div className="panel-heading"><div><span className="section-kicker">高频线索</span><h3>什么在影响你</h3></div><Activity size={19} className="muted-icon" /></div>
          <div className="trigger-list">
            {triggerCounts.length ? triggerCounts.map(([name, count], index) => <div key={name}><span><b>{index + 1}</b>{name}</span><div className="progress"><i style={{ width: `${Math.max(18, count / triggerCounts[0][1] * 100)}%` }} /></div><strong>{count} 次</strong></div>) : <p className="subtle">记录后，这里会显示高频触发因素。</p>}
          </div>
        </section>
      </div>

      <section className="panel mood-map-panel">
        <div className="panel-heading"><div><span className="section-kicker">情绪构成</span><h3>最近的情绪光谱</h3></div><span className="total-count">共 {entries.length} 条记录</span></div>
        <div className="mood-spectrum">{moodCounts.map((m) => <div key={m.key}><div className="spectrum-bubble" style={{ '--bubble': m.color, '--size': `${54 + Math.min(34, m.count * 10)}px` } as React.CSSProperties}><span>{m.face}</span></div><strong>{m.label}</strong><small>{m.count} 次</small></div>)}</div>
      </section>
      <p className="analysis-disclaimer"><CircleHelp size={15} /> 洞察由结构化记录自动生成，仅用于自我觉察，不构成医学诊断。</p>
    </div>
  )
}

function CareView({ onCare }: { onCare: (id: string) => void }) {
  return (
    <div className="page">
      <section className="page-title-row compact">
        <div><p className="eyebrow"><Heart size={15} /> 自我关怀</p><h1>给自己一点恢复的空间</h1><p className="subtle">不需要完成任务，只选一件此刻做得到的小事。</p></div>
      </section>
      <section className="care-feature">
        <div className="care-feature-image" style={{ backgroundImage: `url(${careItems[0].image})` }} />
        <div className="care-feature-copy"><span className="section-kicker">今日推荐 · 2 分钟</span><h2>先让呼吸，带你回到当下</h2><p>焦虑时，大脑会催促我们立刻解决所有问题。试着把注意力交给一呼一吸，只完成接下来的两分钟。</p><button className="light-button" onClick={() => onCare('breath')}><Play size={17} fill="currentColor" /> 开始呼吸</button></div>
      </section>
      <div className="category-tabs"><button className="selected">全部</button><button><Wind size={15} />冥想呼吸</button><button><Music2 size={15} />音乐声音</button><button><Dumbbell size={15} />身体活动</button></div>
      <section className="care-card-grid">
        {careItems.map((item) => { const Icon = item.icon; return <article className="care-card" key={item.id} onClick={() => onCare(item.id)}>
          <div className="care-card-image" style={{ backgroundImage: `url(${item.image})` }}><span><Icon size={16} />{item.meta}</span></div>
          <div><h3>{item.title}</h3><p>{item.desc}</p><button className="round-play" aria-label={`开始${item.title}`}><Play size={16} fill="currentColor" /></button></div>
        </article>})}
      </section>
      <section className="micro-care"><div><MoonStar size={22} /><span><strong>今晚的小约定</strong><small>睡前 20 分钟，把手机放远一点</small></span></div><button>我愿意试试 <Check size={16} /></button></section>
    </div>
  )
}

function RecordModal({ onClose, onSave }: { onClose: () => void; onSave: (entry: Entry) => void }) {
  const [step, setStep] = useState(1)
  const [mood, setMood] = useState<MoodKey | null>(null)
  const [intensity, setIntensity] = useState(3)
  const [triggers, setTriggers] = useState<string[]>([])
  const [body, setBody] = useState<string[]>([])
  const [note, setNote] = useState('')
  const toggle = (value: string, values: string[], setter: (v: string[]) => void) => setter(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])
  const save = () => mood && onSave({ id: Date.now(), createdAt: new Date().toISOString(), mood, intensity, triggers, note: note.trim(), body })

  return <div className="modal-backdrop" role="dialog" aria-modal="true">
    <div className="record-modal">
      <div className="modal-header"><div><span className="modal-step">STEP {step} / 3</span><div className="step-dots"><i className="done" /><i className={step >= 2 ? 'done' : ''} /><i className={step >= 3 ? 'done' : ''} /></div></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={21} /></button></div>
      {step === 1 && <div className="modal-content"><span className="section-kicker">先从感受开始</span><h2>此刻最接近哪一种情绪？</h2><p className="subtle">不需要很准确，第一感觉就好。</p><div className="mood-picker">{moods.map((m) => <button className={mood === m.key ? 'selected' : ''} key={m.key} onClick={() => setMood(m.key)} style={{ '--mood-color': m.color } as React.CSSProperties}><span>{m.face}</span><strong>{m.label}</strong>{mood === m.key && <Check size={15} />}</button>)}</div><div className="intensity-row"><div><strong>感受有多强烈？</strong><small>轻微</small></div><input type="range" min="1" max="5" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} /><b>{intensity}</b><small>强烈</small></div></div>}
      {step === 2 && <div className="modal-content"><span className="section-kicker">找找可能的线索</span><h2>刚才发生了什么？</h2><p className="subtle">可多选。它们是线索，不是原因判定。</p><h4>相关情境</h4><div className="choice-grid">{triggerOptions.map((t) => <button key={t} className={triggers.includes(t) ? 'selected' : ''} onClick={() => toggle(t, triggers, setTriggers)}>{triggers.includes(t) && <Check size={14} />}{t}</button>)}</div><h4>身体有什么感觉？</h4><div className="choice-grid body-choices">{bodyOptions.map((t) => <button key={t} className={body.includes(t) ? 'selected' : ''} onClick={() => toggle(t, body, setBody)}>{t}</button>)}</div></div>}
      {step === 3 && <div className="modal-content"><span className="section-kicker">留一句话给此刻</span><h2>有什么想对自己说的？</h2><p className="subtle">可以是发生的事，也可以只是一句“我现在很累”。</p><div className="note-box"><textarea autoFocus maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="此刻，我注意到……" /><span>{note.length} / 300</span></div><div className="gentle-prompt"><MessageCircleHeart size={20} /><div><strong>不知道写什么？</strong><p>试试：“我之所以有这种感受，可能是因为……”</p></div></div></div>}
      <div className="modal-footer">{step > 1 ? <button className="back-button" onClick={() => setStep(step - 1)}><ArrowLeft size={17} /> 上一步</button> : <span />}{step < 3 ? <button className="primary-button" disabled={step === 1 && !mood} onClick={() => setStep(step + 1)}>继续 <ArrowRight size={17} /></button> : <button className="primary-button" onClick={save}><Check size={18} /> 保存记录</button>}</div>
    </div>
  </div>
}

function CareSession({ type, onClose }: { type: string; onClose: () => void }) {
  const item = careItems.find((i) => i.id === type) || careItems[0]
  const total = type === 'music' ? 600 : type === 'move' ? 180 : 120
  const [seconds, setSeconds] = useState(total)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!playing) return
    timer.current = window.setInterval(() => setSeconds((s) => s > 0 ? s - 1 : 0), 1000)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [playing])
  useEffect(() => { if (seconds === 0) setPlaying(false) }, [seconds])
  const progress = 1 - seconds / total
  const instruction = type === 'breath' ? (Math.floor((total - seconds) / 4) % 2 === 0 ? '慢慢吸气' : '轻轻呼气') : type === 'move' ? '放松肩膀，缓慢转动颈部' : '把注意力留给此刻的声音'
  return <div className="modal-backdrop care-session-backdrop" role="dialog" aria-modal="true"><div className="session-modal" style={{ backgroundImage: `linear-gradient(rgba(27,36,32,.35),rgba(27,36,32,.68)),url(${item.image})` }}>
    <button className="session-close" onClick={onClose}><X size={21} /></button><span className="session-label">{item.meta}</span><h2>{item.title}</h2><p>{instruction}</p>
    <div className={`breath-circle ${playing ? 'playing' : ''}`} style={{ '--progress': `${progress * 360}deg` } as React.CSSProperties}><span>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</span></div>
    <div className="session-controls"><button onClick={() => setSeconds(total)} aria-label="重新开始"><RotateCcw size={19} /></button><button className="main-control" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}</button><button onClick={onClose} aria-label="完成"><Check size={20} /></button></div>
  </div></div>
}

function PrivacyModal({ onClose, onClear }: { onClose: () => void; onClear: () => void }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="privacy-modal"><button className="icon-button modal-x" onClick={onClose}><X size={20} /></button><div className="privacy-icon"><LockKeyhole size={26} /></div><h2>你的日记，只留在这里</h2><p>所有记录仅保存在当前浏览器，不会上传服务器，也不需要账号。清理浏览器数据会同时删除日记。</p><div className="privacy-points"><span><ShieldCheck size={17} /> 无账号追踪</span><span><LockKeyhole size={17} /> 本地存储</span></div><button className="outline-button full" onClick={onClose}>我知道了</button><button className="danger-link" onClick={onClear}>清空本地记录</button></div></div>
}

function getLastSevenDays(entries: Entry[]) {
  const weekday = ['日', '一', '二', '三', '四', '五', '六']
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const found = entries.find((e) => { const d = new Date(e.createdAt); return d.toDateString() === date.toDateString() })
    const mood = found ? moodByKey(found.mood) : moods[2]
    return { date: date.toISOString(), weekday: `周${weekday[date.getDay()]}`, score: found ? mood.score : 2.5, color: found ? mood.color : '#d9d8d2', mood: found?.mood || 'tired' as MoodKey }
  })
}

function linePoints(chart: ReturnType<typeof getLastSevenDays>) { return chart.map((d, i) => `${20 + i * 110},${200 - d.score * 34}`).join(' ') }
function areaPath(chart: ReturnType<typeof getLastSevenDays>) { return `M ${linePoints(chart).replaceAll(' ', ' L ')} L 680,210 L 20,210 Z` }

export default App
