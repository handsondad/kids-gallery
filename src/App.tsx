import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Play,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react'

type Artwork = {
  id: number
  title: string
  child: string
  age: string
  date: string
  category: '绘画' | '手作' | '影像'
  medium: string
  image: string
  color: string
  rotate?: string
  video?: boolean
  note: string
}

const initialArtworks: Artwork[] = [
  { id: 8, title: '六一京剧脸谱', child: '小小艺术家', age: '幼儿园', date: '2026.06.01', category: '手作', medium: '京剧脸谱彩绘', image: '/art/beijing-arts-museum-opera-mask.jpg', color: '#d7e6dc', rotate: '1.5deg', note: '在北京工艺美术馆参加六一儿童节亲子活动，亲手为京剧脸谱涂上鲜艳的颜色。' },
  { id: 7, title: '第一次汇佳幼儿园亲子活动', child: '小小艺术家', age: '幼儿园', date: '2026.07.02', category: '手作', medium: '亲子彩泥拼贴', image: '/art/first-kindergarten-family-activity.jpg', color: '#f2d48c', rotate: '-1.5deg', note: '第一次在汇佳幼儿园参加亲子活动，一起完成了这朵五彩的花。' },
  { id: 1, title: '春天的秘密花园', child: '朵朵', age: '5岁', date: '2026.04.18', category: '绘画', medium: '水彩 + 蜡笔', image: '/art/garden.svg', color: '#f7c8db', rotate: '-2deg', note: '“蝴蝶在和花朵说悄悄话。”' },
  { id: 2, title: '我会飞', child: '安安', age: '6岁', date: '2026.05.02', category: '绘画', medium: '油画棒', image: '/art/fly.svg', color: '#d4e8ff', rotate: '2deg', note: '一架装满彩虹和云朵的飞机。' },
  { id: 3, title: '星星面包店', child: '朵朵', age: '5岁', date: '2026.05.21', category: '手作', medium: '黏土', image: '/art/bakery.svg', color: '#ffe6ad', rotate: '-1deg', note: '今天的招牌面包是月亮味的。' },
  { id: 4, title: '夏日的海浪', child: '乐乐', age: '4岁', date: '2026.06.09', category: '影像', medium: '小小导演', image: '/art/waves.svg', color: '#c6eeee', rotate: '1.5deg', video: true, note: '第一次用相机记录海浪奔跑的样子。' },
  { id: 5, title: '怪兽的生日会', child: '安安', age: '6岁', date: '2026.06.12', category: '绘画', medium: '马克笔', image: '/art/monsters.svg', color: '#ddd0fa', rotate: '-2deg', note: '每一只怪兽都有一顶不一样的帽子。' },
  { id: 6, title: '我的月球车', child: '乐乐', age: '4岁', date: '2026.07.01', category: '手作', medium: '回收纸盒', image: '/art/mooncar.svg', color: '#ffe0bd', rotate: '2deg', note: '它可以带小熊去月球采一颗星星。' },
]

const filters = ['全部', '绘画', '手作', '影像'] as const
type Filter = (typeof filters)[number]

const emptyArtwork = {
  title: '',
  child: '',
  age: '',
  date: new Date().toISOString().slice(0, 10),
  category: '绘画' as Artwork['category'],
  medium: '',
  note: '',
}

const accentColors = ['#f5c6d7', '#cfe4f7', '#f7dea1', '#c6e7df', '#ddd1f2', '#f7d4b8']

function App() {
  const [filter, setFilter] = useState<Filter>('全部')
  const [active, setActive] = useState<Artwork | null>(null)
  const [liked, setLiked] = useState<number[]>([1, 4])
  const [menuOpen, setMenuOpen] = useState(false)
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(emptyArtwork)
  const [upload, setUpload] = useState<{ data: string; isVideo: boolean; name: string } | null>(null)
  const [formError, setFormError] = useState('')
  const visibleArtworks = filter === '全部' ? artworks : artworks.filter((artwork) => artwork.category === filter)

  useEffect(() => {
    const savedArtworks = window.localStorage.getItem('little-lights-added-artworks')
    if (savedArtworks) {
      try {
        const addedArtworks = JSON.parse(savedArtworks) as Artwork[]
        setArtworks([...addedArtworks, ...initialArtworks])
      } catch {
        window.localStorage.removeItem('little-lights-added-artworks')
      }
    }
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActive(null)
        setShowAddForm(false)
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  const toggleLike = (id: number) => setLiked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const closeAddForm = () => { setShowAddForm(false); setForm(emptyArtwork); setUpload(null); setFormError('') }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setFormError('请选择图片或视频文件。')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setFormError('为了保存在当前浏览器中，请选择小于 4 MB 的作品文件。')
      return
    }
    const reader = new FileReader()
    reader.onload = () => { setUpload({ data: String(reader.result), isVideo: file.type.startsWith('video/'), name: file.name }); setFormError('') }
    reader.onerror = () => setFormError('作品文件读取失败，请再试一次。')
    reader.readAsDataURL(file)
  }

  const addArtwork = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!upload) { setFormError('请先选择一张作品图片或视频。'); return }
    const artwork: Artwork = {
      id: Date.now(), title: form.title.trim(), child: form.child.trim() || '小小艺术家', age: form.age.trim() || '成长中',
      date: form.date.replaceAll('-', '.'), category: form.category, medium: form.medium.trim() || '自由创作', image: upload.data,
      color: accentColors[artworks.length % accentColors.length], rotate: `${artworks.length % 2 === 0 ? '-' : ''}${1 + (artworks.length % 3)}deg`, video: upload.isVideo, note: form.note.trim() || '一件闪闪发光的新作品。',
    }
    const added = [artwork, ...artworks.filter((item) => item.id >= 10000000000)]
    try {
      window.localStorage.setItem('little-lights-added-artworks', JSON.stringify(added))
      setArtworks([artwork, ...artworks])
      closeAddForm()
      setFilter('全部')
      window.setTimeout(() => document.querySelector('#gallery')?.scrollIntoView({ behavior: 'smooth' }), 0)
    } catch {
      setFormError('浏览器存储空间不足，请选择更小的文件后再试。')
    }
  }

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="小小星光首页"><i>✦</i> 小小星光</a>
        <div className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a className="active" href="#gallery">作品墙</a>
          <a href="#story">成长故事</a>
          <a href="#about">关于我们</a>
        </div>
        <div className="nav-actions">
          <button className="icon-button search-button" aria-label="搜索作品"><Search size={19} /></button>
          <button className="upload-button" onClick={() => setShowAddForm(true)}><Plus size={17} /> 添加作品</button>
          <button className="icon-button menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="打开导航"><Menu size={20} /></button>
        </div>
      </nav>

      <section id="top" className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={15} /> 每一笔，都是闪闪发光的成长</p>
          <h1>收藏孩子<br /><em>眼里的世界</em></h1>
          <p className="hero-text">把那些认真涂抹、天马行空的时刻，变成一座可以随时回来的小小美术馆。</p>
          <a href="#gallery" className="explore-button">逛逛作品墙 <ArrowUpRight size={18} /></a>
        </div>
        <div className="hero-art" aria-label="精选作品预览">
          <div className="sun">✦</div>
          <div className="cloud cloud-one">☁</div><div className="cloud cloud-two">☁</div>
          <div className="hero-frame">
            <img src={artworks[0].image} alt="春天的秘密花园" />
            <span className="tape tape-left" /><span className="tape tape-right" />
          </div>
          <div className="hero-caption"><span>本月小展览</span><strong>春天的秘密花园</strong><small>朵朵 · 5岁</small></div>
          <div className="scribble">♥</div>
        </div>
      </section>

      <section id="gallery" className="gallery-section shell">
        <div className="section-heading">
          <div><p className="eyebrow plain">作品墙</p><h2>最近的 <em>小小杰作</em></h2></div>
          <p>每一件作品，都值得被好好看见。<br />点击作品，听听创作时的小故事。</p>
        </div>
        <div className="filter-row" role="tablist" aria-label="筛选作品类型">
          {filters.map((item) => <button key={item} role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={filter === item ? 'selected' : ''}>{item}{item === '全部' && <span>{artworks.length}</span>}</button>)}
        </div>
        <div className="gallery-grid">
          {visibleArtworks.map((artwork, index) => <article className={`art-card card-${index + 1}`} key={artwork.id} style={{ '--accent': artwork.color, '--rotation': artwork.rotate } as React.CSSProperties}>
            <button className="art-image" onClick={() => setActive(artwork)} aria-label={`查看 ${artwork.title}`}>
              {artwork.video ? <video src={artwork.image} muted playsInline preload="metadata" /> : <img src={artwork.image} alt={artwork.title} />}
              {artwork.video && <span className="play"><Play size={21} fill="currentColor" /></span>}
              <span className="view-work">查看作品 <ArrowUpRight size={16} /></span>
            </button>
            <div className="art-info"><div><p>{artwork.child} · {artwork.age}</p><h3>{artwork.title}</h3></div><button onClick={() => toggleLike(artwork.id)} className={liked.includes(artwork.id) ? 'heart liked' : 'heart'} aria-label="喜欢这件作品"><Heart size={19} fill={liked.includes(artwork.id) ? 'currentColor' : 'none'} /></button></div>
          </article>)}
        </div>
      </section>

      <section id="story" className="story shell">
        <div className="story-number">03</div>
        <div className="story-content"><p className="eyebrow plain">慢慢长大的证据</p><h2>作品不止是作品，<br />是孩子和世界 <em>打招呼的方式。</em></h2><p>在这里，不追求“画得像不像”。我们珍藏每一次大胆的尝试、每一个突然冒出来的奇思妙想，还有那些未来会让人会心一笑的童言童语。</p><a href="#about">看看我们的想法 <ArrowUpRight size={17} /></a></div>
        <div className="story-stats"><div><strong>86</strong><span>件被珍藏的作品</span></div><div><strong>14</strong><span>段小导演的影像</span></div><div><strong>∞</strong><span>个奇妙的想象</span></div></div>
      </section>

      <footer id="about" className="footer shell"><a className="brand" href="#top"><i>✦</i> 小小星光</a><p>给童年留一座会发光的美术馆。</p><span>© 2026 LITTLE LIGHTS</span></footer>

      {active && <div className="modal-backdrop" role="presentation" onMouseDown={() => setActive(null)}><section className="art-modal" role="dialog" aria-modal="true" aria-label={active.title} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setActive(null)} aria-label="关闭"><X /></button><div className="modal-image">{active.video ? <video src={active.image} controls autoPlay playsInline /> : <img src={active.image} alt={active.title} />}</div><div className="modal-copy"><p className="eyebrow plain">{active.category} · {active.date}</p><h2>{active.title}</h2><p className="creator">{active.child} · {active.age}　/　{active.medium}</p><blockquote>{active.note}</blockquote><div className="modal-controls"><button onClick={() => toggleLike(active.id)} className={liked.includes(active.id) ? 'liked' : ''}><Heart size={18} fill={liked.includes(active.id) ? 'currentColor' : 'none'} /> 喜欢</button><span><ChevronLeft size={18} /><ChevronRight size={18} /></span></div></div></section></div>}

      {showAddForm && <div className="modal-backdrop" role="presentation" onMouseDown={closeAddForm}><section className="add-modal" role="dialog" aria-modal="true" aria-label="添加作品" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={closeAddForm} aria-label="关闭"><X /></button><div className="add-heading"><p className="eyebrow plain">收藏新的闪光时刻</p><h2>添加一件 <em>小小杰作</em></h2><p>填写创作故事并上传作品，内容将保存在当前浏览器中。</p></div><form onSubmit={addArtwork}><label className="file-field">{upload ? <>{upload.isVideo ? <video src={upload.data} muted /> : <img src={upload.data} alt="作品预览" />}<span>更换作品文件</span></> : <><Plus size={27} /><strong>选择图片或视频</strong><small>支持常见格式，文件小于 4 MB</small></>}<input type="file" accept="image/*,video/*" onChange={handleFile} /></label><div className="form-grid"><label>作品名称<input required value={form.title} placeholder="例如：会跳舞的太阳" onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label>创作日期<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>小艺术家<input value={form.child} placeholder="孩子的名字或昵称" onChange={(event) => setForm({ ...form, child: event.target.value })} /></label><label>年龄<input value={form.age} placeholder="例如：4岁" onChange={(event) => setForm({ ...form, age: event.target.value })} /></label><label>作品类型<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Artwork['category'] })}><option>绘画</option><option>手作</option><option>影像</option></select></label><label>创作媒介<input value={form.medium} placeholder="例如：水彩、彩泥、视频" onChange={(event) => setForm({ ...form, medium: event.target.value })} /></label></div><label>作品小故事<textarea value={form.note} placeholder="记录这件作品背后的开心瞬间……" onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>{formError && <p className="form-error">{formError}</p>}<div className="form-actions"><button type="button" onClick={closeAddForm}>取消</button><button className="save-artwork" type="submit">收藏作品 <ArrowUpRight size={17} /></button></div></form></section></div>}
    </main>
  )
}

export default App
