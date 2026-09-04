import { Router } from 'express';
import { createCrudController } from '../controllers/crudController.js';

export function crudRouter(Model, options = {}) {
  const r = Router();
  const ctrl = createCrudController(Model, options);

  r.get('/', ctrl.list);
  r.get('/:id', ctrl.getById);
  r.post('/', ctrl.create);
  r.patch('/:id', ctrl.update);
  r.put('/:id', ctrl.update);
  r.delete('/:id', ctrl.remove);

  return r;
}
