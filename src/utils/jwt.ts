import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.refreshExpiresIn,
    });
};

export const verifyToken = (token: string): JWTPayload => {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
};
