import http from 'k6/http';
import { sleep, check } from 'k6';
import { getBaseUrl } from '../test/utils/variables.js';
const postLogin = JSON.parse(open('../fixtures/postLogin.json'));

export const options = {
    stages: [
        { duration: '5s', target: 10 },
        { duration: '10s', target: 10 },
        { duration: '0s', target: 0 }
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(90)<3000', 'max<5000'],
    },
};

export default function () {
    const url = getBaseUrl() + '/auth/login';
    const payload = JSON.stringify(postLogin);
    const params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const response = http.post(url, payload, params);

    check(response, {
        'status code should be 200': (res) => res.status === 200,
        'token property should be a string': (res) => typeof (res.json().token) == 'string',
    });
    sleep(1);
}