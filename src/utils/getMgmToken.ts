import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export const getMgmToken = () => {
    const hms_access_key = process.env.HMS_ACCESS_KEY;
    const hms_secret = process.env.HMS_SECRET_KEY;
    if (!hms_secret || !hms_access_key) {
        throw new Error('HMS access key or secret is missing in config');
    }

    const payload = {
        access_key: hms_access_key,
        type: 'management',
        version: 2,
        jti: uuidv4(),
    };

    const token = jwt.sign(payload, hms_secret as string, {
        algorithm: 'HS256',
        expiresIn: '24h',
    });

    return token;
};