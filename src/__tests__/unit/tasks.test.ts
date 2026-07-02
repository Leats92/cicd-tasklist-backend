import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

const mockPrisma = vi.hoisted(() => ({
  task: {
    findMany:   vi.fn(),
    findUnique: vi.fn(),
    create:     vi.fn(),
    update:     vi.fn(),
    delete:     vi.fn(),
  },
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}))

import app from '../../app.js'

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

  describe('GET /tasks', () => {
    it('retourne la liste de toutes les tâches avec statut 200', async () => {
      const res = await request(app).get('/tasks')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].title).toBe('Tâche de test')
    })

    it('retourne un tableau vide si aucune tâche', async () => {
      mockPrisma.task.findMany.mockResolvedValue([])

      const res = await request(app).get('/tasks')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(0)
    })
  })

  describe('GET /tasks/:id', () => {
    it('retourne une tâche par son identifiant', async () => {
      const res = await request(app).get('/tasks/1')

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(1)
      expect(res.body.title).toBe('Tâche de test')
    })

    it('retourne 404 si la tâche n\'existe pas', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      const res = await request(app).get('/tasks/999')

      expect(res.status).toBe(404)
    })
  })

  describe('POST /tasks', () => {
    it('crée une nouvelle tâche et retourne 201', async () => {
      const newTask = { ...mockTask, id: 2, title: 'Nouvelle tâche' }
      mockPrisma.task.create.mockResolvedValue(newTask)

      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Nouvelle tâche', description: 'Ma description' })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('title')
    })

    it('retourne 400 si le titre est absent', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ description: 'Sans titre' })

      expect(res.status).toBe(400)
    })

    it('retourne 400 si le titre est une chaîne vide', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: '', description: 'Titre vide' })

      expect(res.status).toBe(400)
    })
  })

  describe('PUT /tasks/:id', () => {
    it('met à jour une tâche existante', async () => {
      const updated = { ...mockTask, title: 'Tâche modifiée', completed: true }
      mockPrisma.task.update.mockResolvedValue(updated)

      const res = await request(app)
        .put('/tasks/1')
        .send({ title: 'Tâche modifiée', completed: true })

      expect(res.status).toBe(200)
    })

    it('retourne 404 si la tâche à modifier n\'existe pas', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .put('/tasks/999')
        .send({ title: 'Inexistante' })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /tasks/:id', () => {
    it('supprime une tâche existante', async () => {
      const res = await request(app).delete('/tasks/1')

      expect(res.status).toBe(200)
    })

    it('retourne 404 si la tâche à supprimer n\'existe pas', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null)
      mockPrisma.task.delete.mockRejectedValue(new Error('Task not found'))

      const res = await request(app).delete('/tasks/999')

      expect(res.status).toBe(404)
    })
  })
})
