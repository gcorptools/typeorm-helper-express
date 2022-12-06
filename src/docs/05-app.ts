import cors from 'cors';
import express, { Application, Request, json } from 'express';
import { provideRequestId, errorHandler } from '../middleware';
import { countriesRouter } from './04-route';

export const app: Application = express();

let options: cors.CorsOptions = {};

app.set('trust proxy', true);
app.use(cors<Request>(options));
app.use(json());

app.use(provideRequestId());

app.use(countriesRouter);

app.options('*', cors<Request>(options));

app.use(errorHandler);
