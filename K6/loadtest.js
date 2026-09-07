import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 30 },
        { duration: '20s', target: 50 },
        { duration: '20s', target: 100 },
        { duration: '20s', target: 200 },
        { duration: '10s', target: 0 },
    ],

    thresholds: {
        http_req_duration: ['p(95)<1500'],
        http_req_failed: ['rate<0.01'],
    },
};

export default function () {
    const url = 'http://[::1]:5173/';

    const res = http.get(url, {
        timeout: '5s',
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
    });

    sleep(1);
}