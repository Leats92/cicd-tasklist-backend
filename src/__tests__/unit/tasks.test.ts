import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

vi.mock('../../lib/prisma.js', () => ({
  default: {
    task: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
    },
  },
}))

import prisma from '../../lib/prisma.js'
import app from '../../app.js'

const mockPrisma = vi.mocked(prisma)

const mockTask = {
  id: 1,
  title: 'Tâche de test',
  description: 'Description de test',
  completed: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
}

describe('API des tâches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.task.findMany.mockResolvedValue([mockTask])
    mockPrisma.task.findUnique.mockResolvedValue(mockTask)
    mockPrisma.task.create.mockResolvedValue(mockTask)
    mockPrisma.task.update.mockResolvedValue({ ...mockTask, completed: true })
    mockPrisma.task.delete.mockResolvedValue(mockTask)
  })

  describe('GET /api/tasks', () => {
    it('retourne la liste de toutes les tâches avec statut 200', async () => {
      const res = await request(app).get('/api/tasks')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].title).toBe('Tâche de test')
    })

    it('retourne un tableau vide si aucune tâche', async () => {
      mockPrisma.task.findMany.mockResolvedValue([])

      const res = await request(app).get('/api/tasks')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(0)
    })
  })

  describe('GET /api/tasks/:id', () => {
    it('retourne une tâche par son identifiant', async () => {
      const res = await request(app).get('/api/tasks/1')

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(1)
      expect(res.body.title).toBe('Tâche de test')
    })

    it("retourne 404 si la tâche n'existe pas", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      const res = await request(app).get('/api/tasks/999')

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/tasks', () => {
    it('crée une nouvelle tâche et retourne 201', async () => {
      const newTask = { ...mockTask, id: 2, title: 'Nouvelle tâche' }
      mockPrisma.task.create.mockResolvedValue(newTask)

      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Nouvelle tâche', description: 'Ma description' })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('title')
    })

    it('retourne 400 si le titre est absent', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ description: 'Sans titre' })

      expect(res.status).toBe(400)
    })

    it('retourne 400 si le titre est une chaîne vide', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: '', description: 'Titre vide' })

      expect(res.status).toBe(400)
    })
  })

  describe('PUT /api/tasks/:id', () => {
    it('met à jour une tâche existante', async () => {
      const updated = { ...mockTask, title: 'Tâche modifiée', completed: true }
      mockPrisma.task.update.mockResolvedValue(updated)

      const res = await request(app)
        .put('/api/tasks/1')
        .send({ title: 'Tâche modifiée', completed: true })

      expect(res.status).toBe(200)
    })

    it("retourne 404 si la tâche à modifier n'existe pas", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .put('/api/tasks/999')
        .send({ title: 'Inexistante' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/tasks/:id', () => {
    it('supprime une tâche existante', async () => {
      const res = await request(app).delete('/api/tasks/1')

      expect(res.status).toBe(204)
    })

    it("retourne 404 si la tâche à supprimer n'existe pas", async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      const res = await request(app).delete('/api/tasks/999')

      expect(res.status).toBe(404)
    })
  })
})
