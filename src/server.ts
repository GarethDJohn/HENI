
import express, { Request, Response } from 'express';
import { MainController } from './controllers/main-controller';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', async (req: Request, res: Response) => {
    const mainController = new MainController();

    try {
        const details = await mainController.getTokenHolderDetailsForTokenRange(1, 100);

        res.status(200).send({
            status: 'ok',
            data: details
        });
    } catch (error) {
        res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
