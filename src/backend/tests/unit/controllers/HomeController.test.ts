import { describe, it, expect, beforeEach } from 'vitest';
import { HomeController } from '../../../controllers/HomeController.js';
import { createMockRequest, createMockResponse } from '../../setup.js';

describe('HomeController', () => {
  let controller: HomeController;
  let req: ReturnType<typeof createMockRequest>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    controller = new HomeController();
    req = createMockRequest();
    res = createMockResponse();
  });

  describe('index', () => {
    it('renders home page with correct data', async () => {
      await controller.index(req as any, res as any);

      expect(res.render).toHaveBeenCalledWith('home', {
        title: 'Patrique Ouimet',
        currentPath: '/',
      });
    });
  });
});
