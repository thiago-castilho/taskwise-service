const request = require('supertest');
const { expect } = require('chai');
const postUsers = require('../fixtures/postUsers.json');
const { getToken } = require('../helpers/authentication');
require('dotenv').config();

describe('Usuários - Gerenciamento de usuários do sistema', () => {
    describe('POST /users - Cria usuário Read/Write', () => {
        it('Deve retornar 201 e criar um usuário ao passar dados válidos', async () => {
            const bodyUsers = { ...postUsers };
            bodyUsers.name = bodyUsers.name + Math.random().toString();
            bodyUsers.email = bodyUsers.name + '@taskwise.local';
            const response = await request(process.env.BASE_URL)
                .post('/users')
                .set('Content-Type', 'application/json')
                .send(bodyUsers);

            expect(response.body.id).to.not.be.null;
            expect(response.body.name).to.be.equal(bodyUsers.name);
            expect(response.body.email).to.be.equal(bodyUsers.email).and.to.be.a('string');
            expect(response.body.role).to.be.equal('ReadWrite');
            expect(response.body.createdAt).to.be.a('string').and.not.be.null;
        });

        it('Deve retornar 422 ao passar o email de um usuário já cadastrado', async () => {
            const bodyUsers = { ...postUsers };
            bodyUsers.email = 'admin@taskwise.local';
            const response = await request(process.env.BASE_URL)
                .post('/users')
                .set('Content-Type', 'application/json')
                .send(bodyUsers);

            expect(response.status).to.equal(422);
            expect(response.body[0].code).to.be.equal('EMAIL_IN_USE');
            expect(response.body[0].field).to.be.equal('email');
            expect(response.body[0].message).to.be.equal('E-mail já cadastrado');
        });
    });

    describe('GET /users - Listar usuários (Admin)', () => {
        it('Deve retornar status 200 e uma lista de usuários cadastrados se autenticado como administrador', async () => {
            const response = await request(process.env.BASE_URL)
                .get('/users')
                .set('Authorization', `Bearer ${await getToken()}`)
                .set('Content-Type', 'application/json')

            expect(response.status).to.equal(200);
            expect(response.body.items).to.be.an('array');
            expect(response.body.items).to.have.length.above(1);
        });

        it('Deve retornar status 403 e mensagem de restrição se autenticado como read/writer', async () => {
            const response = await request(process.env.BASE_URL)
                .get('/users')
                .set('Authorization', `Bearer ${await getToken('user@taskwise.local', 'user123')}`)
                .set('Content-Type', 'application/json')

            expect(response.status).to.equal(403);
            expect(response.body[0].code).to.equal('FORBIDDEN');
            expect(response.body[0].field).to.be.null;
            expect(response.body[0].message).to.equal('Acesso restrito a Admin');
        });

        it('Deve retornar status 401 e mensagem de erro se não autenticado', async () => {
            const response = await request(process.env.BASE_URL)
                .get('/users')
                .set('Content-Type', 'application/json')

            expect(response.status).to.equal(401);
            expect(response.body[0].code).to.equal('UNAUTHORIZED');
            expect(response.body[0].field).to.not.exist;
            expect(response.body[0].message).to.equal('Token ausente');
        });

        it('Deve retornar status 401 e mensagem de erro se token for inválido', async () => {
            const response = await request(process.env.BASE_URL)
                .get('/users')
                .set('Authorization', `Bearer ${await getToken('invalid@taskwise.local', 'invalid')}`)
                .set('Content-Type', 'application/json')

            expect(response.status).to.equal(401);
            expect(response.body[0].code).to.equal('UNAUTHORIZED');
            expect(response.body[0].field).to.not.exist;
            expect(response.body[0].message).to.equal('Token inválido');
        });
    });
});