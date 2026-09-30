import { Test } from '@nestjs/testing';

import { AppController } from './app.controller.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = moduleRef.get(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });
});