const express = require('express');
const {
  registerUser,
  loginUser,
} = require('../controllers/identityController');
const router = express.Router();

//routing
router.post('/register', registerUser);
router.post('/login', loginUser);
module.exports = router;
