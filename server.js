const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const uri = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/insighthub?retryWrites=true&w=majority';
let db;

async function connectDB() {
  if (db) return db;
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db('insighthub');
  console.log('Connected to MongoDB Atlas');
  return db;
}

// Helper: get collection
async function col(name) {
  const database = await connectDB();
  return database.collection(name);
}

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'blog.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'public', 'contact.html')));
app.get('/search', (req, res) => res.sendFile(path.join(__dirname, 'public', 'search.html')));

// API: Get all blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const collection = await col('blogs');
    const blogs = await collection.find({}).sort({ _id: -1 }).toArray();
    res.json(blogs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get single blog
app.get('/api/blog/:id', async (req, res) => {
  try {
    const collection = await col('blogs');
    const blog = await collection.findOne({ id: req.params.id });
    if (!blog) return res.status(404).json({ error: 'Not found' });
    res.json(blog);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Admin login
app.post('/api/admin/login', (req, res) => {
  if (req.body.password === 'vape1098') {
    res.json({ success: true, token: 'admin-secret-token' });
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

// API: Create blog (admin only)
app.post('/api/admin/blog', async (req, res) => {
  try {
    const { title, content, category, titleImage, images } = req.body;
    const newBlog = {
      id: uuidv4(),
      title,
      titleImage: titleImage || '',
      content,
      images: images || [],
      category,
      views: 0,
      date: new Date().toLocaleDateString(),
      author: 'Admin'
    };
    const collection = await col('blogs');
    await collection.insertOne(newBlog);
    res.json({ success: true, blog: newBlog });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Delete blog
app.delete('/api/admin/blog/:id', async (req, res) => {
  try {
    const collection = await col('blogs');
    await collection.deleteOne({ id: req.params.id });
    const reviewsCol = await col('reviews');
    await reviewsCol.deleteMany({ blogId: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Track blog view
app.post('/api/blog/view/:id', async (req, res) => {
  try {
    const collection = await col('blogs');
    await collection.updateOne({ id: req.params.id }, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Add review
app.post('/api/review', async (req, res) => {
  try {
    const { blogId, name, rating, comment } = req.body;
    const newReview = {
      id: uuidv4(),
      blogId,
      name,
      rating: parseInt(rating),
      comment,
      date: new Date().toLocaleDateString()
    };
    const collection = await col('reviews');
    await collection.insertOne(newReview);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get reviews for a blog
app.get('/api/reviews/:blogId', async (req, res) => {
  try {
    const collection = await col('reviews');
    const reviews = await collection.find({ blogId: req.params.blogId }).toArray();
    res.json(reviews);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get all reviews (admin)
app.get('/api/admin/reviews', async (req, res) => {
  try {
    const collection = await col('reviews');
    const reviews = await collection.find({}).toArray();
    res.json(reviews);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Delete review
app.delete('/api/admin/review/:id', async (req, res) => {
  try {
    const collection = await col('reviews');
    await collection.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Submit message (contact form)
app.post('/api/message', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const newMessage = {
      id: uuidv4(),
      name,
      email,
      subject,
      message,
      date: new Date().toLocaleDateString(),
      read: false
    };
    const collection = await col('messages');
    await collection.insertOne(newMessage);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Get all messages (admin)
app.get('/api/admin/messages', async (req, res) => {
  try {
    const collection = await col('messages');
    const messages = await collection.find({}).sort({ _id: -1 }).toArray();
    res.json(messages);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Delete message
app.delete('/api/admin/message/:id', async (req, res) => {
  try {
    const collection = await col('messages');
    await collection.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Mark message as read
app.patch('/api/admin/message/:id/read', async (req, res) => {
  try {
    const collection = await col('messages');
    await collection.updateOne({ id: req.params.id }, { $set: { read: true } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Search
app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    const collection = await col('blogs');
    const blogs = await collection.find({}).toArray();
    const results = blogs.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.content.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// API: Stats for admin dashboard
app.get('/api/admin/stats', async (req, res) => {
  try {
    const blogsCol = await col('blogs');
    const reviewsCol = await col('reviews');
    const messagesCol = await col('messages');
    const totalBlogs = await blogsCol.countDocuments();
    const totalReviews = await reviewsCol.countDocuments();
    const totalMessages = await messagesCol.countDocuments();
    const unreadMessages = await messagesCol.countDocuments({ read: false });
    res.json({ totalBlogs, totalReviews, totalMessages, unreadMessages });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Export for Vercel
module.exports = app;

// Local dev
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('The Insight Hub running at http://localhost:' + PORT);
  });
}
