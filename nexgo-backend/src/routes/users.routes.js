const express  = require('express');
const usersCtrl = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN', 'GESTOR_ADMINISTRATIVO'));

router.get('/',       usersCtrl.getUsers);
router.get('/roles',  usersCtrl.getRoles);
router.get('/:id',    usersCtrl.getUserById);
router.put('/:id',    usersCtrl.updateUser);
router.delete('/:id', usersCtrl.deleteUser);

module.exports = router;
