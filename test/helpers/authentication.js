const request = require('supertest');
const postLogin = require('../fixtures/postLogin.json');

const getToken = async (email, pass) => {
    const bodyLogin = { ...postLogin };
    
    if (email && pass) {
        bodyLogin.email = email;
        bodyLogin.password = pass;
    }
    
    const response = await request(process.env.BASE_URL)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send(bodyLogin);

    return response.body.token;
};

module.exports = {
    getToken
}