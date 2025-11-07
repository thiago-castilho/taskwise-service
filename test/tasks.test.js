const request = require('supertest');
const { expect } = require('chai');
const { getToken } = require('../helpers/authentication');
require('dotenv').config();

describe('Tarefas - Operações relacionadas a tarefas de teste', () => {
    describe('GET /tasks - Listar tarefas com filtros de paginação', () => {
        it('Deve retornar 200 e uma lista com tarefas usando autenticação de administrador', async () => {
            const response = await request(process.env.BASE_URL)
                .get('/tasks')
                .set('Content-Type', 'application/json')
                .set('X-Timezone', 'America/Sao_Paulo')
                .set('Authorization', `Bearer ${await getToken()}`);

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

            expect(response.body).to.be.an('array');
            expect(response.body[0].code).to.be.equal('UNAUTHORIZED');
            expect(response.body[0].field).to.be.null;
            expect(response.body[0].message).to.be.equal('Token ausente');
        });
    });
});