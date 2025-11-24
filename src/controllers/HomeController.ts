import { Request, Response } from 'express';

export class HomeController {
  async index(req: Request, res: Response): Promise<void> {
    res.render('home', {
      title: 'Patrique Ouimet',
      currentPath: '/',
    });
  }
}

export const homeController = new HomeController();
