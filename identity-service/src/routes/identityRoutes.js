const express = require('express');
const { registerUser } = require('../controllers/identityController');
const router = express.Router();

//routing
router.post('/register', registerUser);
module.exports = router;
