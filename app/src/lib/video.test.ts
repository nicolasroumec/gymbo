import { describe, expect, it } from 'vitest'
import { formatTimestamp, parseTimestamp, videoLink } from './video'

describe('parseTimestamp', () => {
  it('lee m:ss, h:mm:ss y minutos solos', () => {
    expect(parseTimestamp('1:30')).toBe(90)
    expect(parseTimestamp('0:05')).toBe(5)
    expect(parseTimestamp('1:02:03')).toBe(3723)
    expect(parseTimestamp('2')).toBe(120)
  })

  it('inválido da null', () => {
    expect(parseTimestamp('')).toBeNull()
    expect(parseTimestamp('1:75')).toBeNull()
    expect(parseTimestamp('1:5')).toBeNull()
    expect(parseTimestamp('abc')).toBeNull()
  })

  it('ida y vuelta con formatTimestamp', () => {
    for (const s of ['1:30', '0:05', '1:02:03', '12:00']) {
      expect(formatTimestamp(parseTimestamp(s)!)).toBe(s)
    }
  })
})

describe('videoLink', () => {
  it('agrega el minuto a links de YouTube', () => {
    expect(videoLink('https://www.youtube.com/watch?v=abc', 90)).toBe('https://www.youtube.com/watch?v=abc&t=90')
    expect(videoLink('https://youtu.be/abc', 5)).toBe('https://youtu.be/abc?t=5')
    expect(videoLink('https://youtube.com/shorts/abc', 10)).toBe('https://youtube.com/shorts/abc?t=10')
    expect(videoLink('https://m.youtube.com/watch?v=abc&t=3', 20)).toBe('https://m.youtube.com/watch?v=abc&t=20')
  })

  it('sin minuto o fuera de YouTube deja el link igual', () => {
    expect(videoLink('https://youtu.be/abc', null)).toBe('https://youtu.be/abc')
    expect(videoLink('https://vimeo.com/123', 90)).toBe('https://vimeo.com/123')
    expect(videoLink('https://notyoutube.com/x', 90)).toBe('https://notyoutube.com/x')
  })

  it('descarta lo que no es http(s)', () => {
    expect(videoLink('javascript:alert(1)', null)).toBeNull()
    expect(videoLink('no es un link', null)).toBeNull()
    expect(videoLink('', null)).toBeNull()
  })
})
