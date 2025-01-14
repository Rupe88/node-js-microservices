const epxress = require('express');
const {
  createPost,
  getAllPost,
  getPost,
  deletePost,
} = require('../controller/postController');
const authenticateRequest = require('../middleware/authMiddleware');

const router = epxress.Router();

router.use(authenticateRequest);

router.post('/create-post', createPost);
router.get('/get-all-post', getAllPost);
router.get('/:id', getPost);
router.delete('/delete/:id', deletePost);
module.exports = router;
