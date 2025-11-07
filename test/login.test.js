const request = require('supertest');
const { expect } = require('chai');
const postLogin = require('../fixtures/postLogin.json');
require('dotenv').config();

describe('Login', () => {
    describe('POST /login', () => {
        it('Deve retornar 200 com token em string quando usar credenciais válidas', async() => {
            const bodyLogin = { ...postLogin };
            const response = await request(process.env.BASE_URL)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send(bodyLogin);

                expect(response.status).to.equal(200);
                expect(response.body.token).to.be.a('string');
                expect(response.body.user.id).to.not.be.null;
                expect(response.body.user.name).to.equal('Admin');
        });

        it('Deve retornar 401 com mensagem de erro ao usar senha inválida', async() => {
            const bodyLogin = { ...postLogin };
            bodyLogin.password = "123";

            const response = await request(process.env.BASE_URL)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send(bodyLogin);

                expect(response.status).to.equal(401);
                expect(response.body[0].code).to.be.equal('INVALID_CREDENTIALS');
                expect(response.body[0].field).to.be.equal('password');
                expect(response.body[0].message).to.be.equal('Senha inválida');
        });

        it('Deve retornar 401 com mensagem de erro ao usar email inválido', async() => {
            const bodyLogin = { ...postLogin };
            bodyLogin.email = "email@invalido.com";

            const response = await request(process.env.BASE_URL)
                .post('/auth/login')
                .set('Content-Type', 'application/json')
                .send(bodyLogin);

                expect(response.status).to.equal(401);
                expect(response.body[0].code).to.be.equal('INVALID_CREDENTIALS');
                expect(response.body[0].field).to.be.equal('email');
                expect(response.body[0].message).to.be.equal('Usuário não encontrado');
        });
    });
});