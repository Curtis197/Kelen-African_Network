// components/pro-site/ProSiteSocialThread.tsx
'use client'

import { useState, useEffect } from 'react'
import type { ItemType, ProSiteComment } from '@/lib/pro-site/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'il y a 1 jour'
  if (days < 30) return `il y a ${days} jours`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  return `il y a ${months} mois`
}

function Avatar({ name }: { name: string }) {
  const letter = name.trim()[0]?.toUpperCase() ?? '?'
  const colors = ['#009639', '#FCCF00', '#2c3e6b', '#E05555', '#6c5ce7']
  const color = colors[letter.charCodeAt(0) % colors.length]
  return (
    <div
      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
      style={{ background: color }}
    >
      {letter}
    </div>
  )
}

export function ProSiteSocialThread({
  itemType,
  itemId,
  initialComments,
  initialLikeCount,
}: {
  itemType: ItemType
  itemId: string
  initialComments: ProSiteComment[]
  initialLikeCount: number
}) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [comments, setComments] = useState<ProSiteComment[]>(initialComments)
  const [authorName, setAuthorName] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetch(`/api/pro-site/likes?item_type=${itemType}&item_id=${itemId}`)
      .then((r) => r.json())
      .then(({ liked: l }) => setLiked(l))
  }, [itemType, itemId])

  async function toggleLike() {
    const res = await fetch('/api/pro-site/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_type: itemType, item_id: itemId }),
    })
    const { count, liked: l } = await res.json()
    setLikeCount(count)
    setLiked(l)
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault()
    if (!authorName.trim() || !body.trim()) return
    setPosting(true)
    const res = await fetch('/api/pro-site/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_type: itemType, item_id: itemId, author_name: authorName, body }),
    })
    if (res.ok) {
      const comment = await res.json()
      setComments((prev) => [...prev, comment])
      setBody('')
    }
    setPosting(false)
  }

  return (
    <section className="bg-[var(--pro-surface,#fff)] px-6 py-6 border-t border-[var(--pro-border,#eee)]">
      <div className="flex gap-5 items-center mb-5 pb-4 border-b border-[var(--pro-border,#eee)]">
        <button onClick={toggleLike} className="flex items-center gap-2 cursor-pointer">
          <span className="text-xl" style={{ color: liked ? '#E05555' : undefined }}>
            {liked ? '♥' : '♡'}
          </span>
          <span className="text-sm font-bold text-[var(--pro-text,#1a1a2e)]">
            {likeCount} j&apos;aime
          </span>
        </button>
        <span className="text-sm text-[var(--pro-text-muted,#888)]">
          💬 {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-4 mb-5">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar name={c.authorName} />
            <div className="flex-1 bg-[var(--pro-surface-alt,#f5f5f5)] rounded-[0_var(--pro-radius,16px)_var(--pro-radius,16px)_var(--pro-radius,16px)] px-4 py-3">
              <p className="text-xs font-bold text-[var(--pro-text,#1a1a2e)] mb-1">{c.authorName}</p>
              <p className="text-xs text-[var(--pro-text-muted,#444)] leading-relaxed">{c.body}</p>
              <p className="text-xs text-gray-400 mt-2">{timeAgo(c.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={postComment} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Votre prénom *"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={80}
          required
          className="border border-[var(--pro-border,#eee)] rounded-[var(--pro-radius,16px)] px-4 py-2 text-sm outline-none focus:border-[#009639]"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ajouter un commentaire…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            required
            className="flex-1 border border-[var(--pro-border,#eee)] rounded-[var(--pro-radius,16px)] px-4 py-2 text-sm outline-none focus:border-[#009639]"
          />
          <button
            type="submit"
            disabled={posting || !authorName.trim() || !body.trim()}
            className="bg-[#009639] text-white px-4 py-2 rounded-[var(--pro-radius,16px)] text-sm font-bold disabled:opacity-50"
          >
            →
          </button>
        </div>
      </form>
    </section>
  )
}
