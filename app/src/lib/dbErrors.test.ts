import { expect, it } from 'vitest'
import { dbErrorKey } from './dbErrors'

it('traduce los códigos de Postgres a claves de texto', () => {
  expect(dbErrorKey(null)).toBeNull()
  expect(dbErrorKey({ code: '23505' })).toBe('nameTaken')
  expect(dbErrorKey({ code: '23503' })).toBe('inUse')
  expect(dbErrorKey({ code: '42501' })).toBe('saveError')
  expect(dbErrorKey({})).toBe('saveError')
})
