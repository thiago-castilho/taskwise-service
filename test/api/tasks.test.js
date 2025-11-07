const request = require('supertest');
const { expect } = require('chai');
const { getToken } = require('../../helpers/authentication');
const postTasks = require('../../fixtures/api/postTasks.json');
require('dotenv').config();

describe('Tarefas - Operações relacionadas a tarefas de teste', () => {
    describe('GET /tasks - Listar tarefas com filtros de paginação', () => {
        it('Deve retornar 200 e uma lista com tarefas usando autenticação de administrador', async () => {
            const response = await request(process.env.BASE_URL)
                .get('/tasks')
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${await getToken()}`);

            expect(response.status).to.be.equal(200);
            expect(response.body).to.have.property('items');
            expect(response.body.items).to.be.an('array');
            expect(response.body.items).to.have.length.above(5);
            expect(response.body.items[0]).to.have.property('id').and.to.be.a('string');
            expect(response.body.items[0]).to.have.property('title').equal('Caso de teste login');
            expect(response.body.items[0]).to.have.property('description').equal('Cobrir fluxos de login');
            expect(response.body.items[0]).to.have.property('phases');
            expect(response.body.items[0]).to.have.property('status');
            expect(response.body.items[0]).to.have.property('assigneeId');
            expect(response.body.items[0]).to.have.property('block');
            expect(response.body.items[0]).to.have.property('createdAt');
            expect(response.body.items[0]).to.have.property('updatedAt');
            expect(response.body.items[0]).to.have.property('_totalsCache');
            expect(response.body.items[0]).to.have.property('sprintId');
            expect(response.body.items[0]).to.have.property('complexidade');
            expect(response.body.items[0]).to.have.property('risco');

        });

        it('Deve retornar 200 e uma lista com tarefas usando autenticação de usuário read/write', async () => {
            const response = await request(process.env.BASE_URL)
                .get('/tasks')
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${await getToken('user@taskwise.local', 'user123')}`);

            expect(response.status).to.be.equal(200);
            expect(response.body).to.have.property('items');
            expect(response.body.items).to.be.an('array');
            expect(response.body.items).to.have.length.above(5);
            expect(response.body.items[1]).to.have.property('id').and.to.be.a('string');
            expect(response.body.items[1]).to.have.property('title').equal('Fluxo de cadastro');
            expect(response.body.items[1]).to.have.property('description').equal('Cobrir cadastro happy path');
            expect(response.body.items[1]).to.have.property('phases');
            expect(response.body.items[1]).to.have.property('status');
            expect(response.body.items[1]).to.have.property('assigneeId');
            expect(response.body.items[1]).to.have.property('block');
            expect(response.body.items[1]).to.have.property('createdAt');
            expect(response.body.items[1]).to.have.property('updatedAt');
            expect(response.body.items[1]).to.have.property('_totalsCache');
            expect(response.body.items[1]).to.have.property('sprintId');
            expect(response.body.items[1]).to.have.property('complexidade');
            expect(response.body.items[1]).to.have.property('risco');
        });

        it('Deve retornar 401 com mensagem de não autorizado se não autenticado', async () => {
            const response = await request(process.env.BASE_URL)
                .get('/tasks')
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')

            expect(response.status).to.be.equal(401);
            expect(response.body).to.be.an('array');
            expect(response.body[0].code).to.be.equal('UNAUTHORIZED');
            expect(response.body[0].field).to.be.null;
            expect(response.body[0].message).to.be.equal('Token ausente');
        });
    });

    describe('POST /tasks - Criar tarefa', () => {
        it('Deve retornar 201 e criar uma tarefa usando credenciais de administrador enviando somente dados requeridos', async () => {
            const bodyTasks = { ...postTasks };
            const response = await request(process.env.BASE_URL)
                .post('/tasks')
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${await getToken()}`)
                .send(bodyTasks);

            expect(response.status).to.be.equal(201);
            expect(response.body).to.have.property('id');
            expect(response.body).to.have.property('title').to.be.equal(bodyTasks.title);
            expect(response.body).to.have.property('description').and.to.be.null;
            expect(response.body).to.have.property('phases');
            expect(response.body).to.have.property('status').to.be.equal("Backlog");
            expect(response.body).to.have.property('assigneeId').and.to.be.null;
            expect(response.body).to.have.property('block').and.to.be.null;
            expect(response.body).to.have.property('createdAt').and.to.be.a('string');
            expect(response.body).to.have.property('updatedAt').and.to.be.a('string');
            expect(response.body).to.have.property('sprintId').and.to.be.null;
            expect(response.body).to.have.property('risco').and.to.be.null;
            expect(response.body).to.have.property('complexidade').and.to.be.null;
            expect(response.body).to.have.property('createdBy').and.to.be.a('string');
            expect(response.body).to.have.property('totalHours').and.to.be.a('number');
            expect(response.body).to.have.property('totalDays').and.to.be.a('number');
        });

        it('Deve retornar 201 e criar uma tarefa usando credenciais de usuário read/write enviando somente dados requeridos', async () => {
            const bodyTasks = { ...postTasks };
            const response = await request(process.env.BASE_URL)
                .post('/tasks')
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${await getToken('user@taskwise.local', 'user123')}`)
                .send(bodyTasks);

            expect(response.status).to.be.equal(201);
            expect(response.body).to.have.property('id');
            expect(response.body).to.have.property('title').to.be.equal(bodyTasks.title);
            expect(response.body).to.have.property('description').and.to.be.null;
            expect(response.body).to.have.property('phases');
            expect(response.body).to.have.property('status').to.be.equal("Backlog");
            expect(response.body).to.have.property('assigneeId').and.to.be.null;
            expect(response.body).to.have.property('block').and.to.be.null;
            expect(response.body).to.have.property('createdAt').and.to.be.a('string');
            expect(response.body).to.have.property('updatedAt').and.to.be.a('string');
            expect(response.body).to.have.property('sprintId').and.to.be.null;
            expect(response.body).to.have.property('risco').and.to.be.null;
            expect(response.body).to.have.property('complexidade').and.to.be.null;
            expect(response.body).to.have.property('createdBy').and.to.be.a('string');
            expect(response.body).to.have.property('totalHours').and.to.be.a('number');
            expect(response.body).to.have.property('totalDays').and.to.be.a('number');
        });

        it('Deve retornar 401 e criar uma tarefa usando credenciais de administrador', async () => {
            const bodyTasks = { ...postTasks };
            const response = await request(process.env.BASE_URL)
                .post('/tasks')
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .send(bodyTasks);

            expect(response.status).to.be.equal(401);
            expect(response.body).to.be.an('array');
            expect(response.body[0].code).to.be.equal('UNAUTHORIZED');
            expect(response.body[0].field).to.be.null;
            expect(response.body[0].message).to.be.equal('Token ausente');
        });
    });

    describe('GET /tasks/{id} - Obter tarefa por id', () => {
        it('Deve retornar 200 e a tarefa solicitada através de seu ID usando credenciais de administrador', async () => {
            const token = await getToken();
            const bodyTasks = { ...postTasks };

            const responseTaskCreated = await request(process.env.BASE_URL)
                .post('/tasks')
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyTasks);
            const taskId = responseTaskCreated.body.id;
            const response = await request(process.env.BASE_URL)
                .get(`/tasks/${taskId}`)
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('id').to.be.a('string');
            expect(response.body).to.have.property('title').to.be.equal('Tarefa criada por automação');
            expect(response.body).to.have.property('description').to.be.null;
            expect(response.body).to.have.property('phases').to.not.be.null;
            expect(response.body).to.have.property('status').to.be.equal('Backlog');
            expect(response.body).to.have.property('assigneeId').to.be.null;
            expect(response.body).to.have.property('block').to.be.null;
            expect(response.body).to.have.property('createdAt').to.not.be.null;
            expect(response.body).to.have.property('updatedAt').to.not.be.null;
            expect(response.body).to.have.property('sprintId').to.be.null;
            expect(response.body).to.have.property('complexidade').to.be.null;
            expect(response.body).to.have.property('risco').to.be.null;
            expect(response.body).to.have.property('totalHours').to.be.equal(8);
            expect(response.body).to.have.property('totalDays').to.be.equal(1);
        });

        it('Deve retornar 200 e a tarefa solicitada através de seu ID usando credenciais de usuário read/write', async () => {
            const token = await getToken('user@taskwise.local', 'user123');
            const bodyTasks = { ...postTasks };

            const responseTaskCreated = await request(process.env.BASE_URL)
                .post('/tasks')
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${token}`)
                .send(bodyTasks);
            const taskId = responseTaskCreated.body.id;
            const response = await request(process.env.BASE_URL)
                .get(`/tasks/${taskId}`)
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('id').to.be.a('string');
            expect(response.body).to.have.property('title').to.be.equal('Tarefa criada por automação');
            expect(response.body).to.have.property('description').to.be.null;
            expect(response.body).to.have.property('phases').to.not.be.null;
            expect(response.body).to.have.property('status').to.be.equal('Backlog');
            expect(response.body).to.have.property('assigneeId').to.be.null;
            expect(response.body).to.have.property('block').to.be.null;
            expect(response.body).to.have.property('createdAt').to.not.be.null;
            expect(response.body).to.have.property('updatedAt').to.not.be.null;
            expect(response.body).to.have.property('sprintId').to.be.null;
            expect(response.body).to.have.property('complexidade').to.be.null;
            expect(response.body).to.have.property('risco').to.be.null;
            expect(response.body).to.have.property('totalHours').to.be.equal(8);
            expect(response.body).to.have.property('totalDays').to.be.equal(1);
        });

        it('Deve retornar 400 e uma mensagem de erro ao passar um ID de task inválido', async () => {
            const taskId = "5b80d610-406d-4be6-a2f9-e0e6ddbcbd4f";
            const response = await request(process.env.BASE_URL)
                .get(`/tasks/${taskId}`)
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${await getToken()}`);

            expect(response.status).to.equal(404);
            expect(response.body).to.be.an('array');
            expect(response.body[0].code).to.be.equal('NOT_FOUND');
            expect(response.body[0].field).to.be.equal('id');
            expect(response.body[0].message).to.be.equal('Tarefa não encontrada');
        });

        it('Deve retornar 401 e uma mensagem de erro se não autenticado', async () => {
            const taskId = "5b80d610-406d-4be6-a2f9-e0e6ddbcbd4f";
            const response = await request(process.env.BASE_URL)
                .get(`/tasks/${taskId}`)
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')

            expect(response.status).to.equal(401);
            expect(response.body).to.be.an('array');
            expect(response.body[0].code).to.be.equal('UNAUTHORIZED');
            expect(response.body[0].field).to.be.null;
            expect(response.body[0].message).to.be.equal('Token ausente');
        });
    });
});