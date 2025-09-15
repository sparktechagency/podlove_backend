import crypto from 'crypto';
import { HMS_ENDPOINT } from './index';
import { getMgmToken } from '@utils/getMgmToken';

export const createRoomCodesForAllRoles = async (roomId: string) => {
    const response = await fetch(`${HMS_ENDPOINT}/room-codes/room/${roomId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getMgmToken()}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to create room codes: ${response.statusText}`);
    }

    // console.log('getMgmToken()', getMgmToken())

    const data = await response.json();
    // console.log('data', data);
    return data.data;
};

/**
 * Generate a unique alphanumeric code
 * @param length default = 10
 * @returns string
 */
export function generateRoomName(length: number = 10): string {
    let name = '';
    while (name.length < length) {
        name += crypto
            .randomBytes(length)
            .toString('base64')
            .replace(/[^a-zA-Z0-9]/g, '');
    }
    return name.substring(0, length);
}