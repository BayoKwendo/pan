import jwt from 'jsonwebtoken';


/**
*get variables from the .env configs
@package dotenv */
import dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // iniatilized configs here


export const verifyToken = (req: any, res: any, next: any) => {
  const token = req.body.token || req.query.token || req.headers["x-access-token"];
  if (!token) {
    return res.status(401).send({
      StatusCode: 4,
      Status: false,
      StatusMessage: 'A token is required for authentication'
    })
  }
  try {
    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`);
    req.locals = decoded;
  } catch (err) {
    return res.status(401).send({
      StatusCode: 4,
      Status: false,
      StatusMessage: 'Invalid Token'
    })
  }
  return next();
};