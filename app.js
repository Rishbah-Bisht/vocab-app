const express = require('express');
const mongoose = require('mongoose');
const Word = require('./models/Word');
const app = express();
require('dotenv').config();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });



// Routes
app.get('/', (req, res) => res.redirect('/home'));

app.get('/home', async (req, res) => {
  res.render('home',);
});

const Idiom = require('./models/Idiom');
app.get('/add-idiom', (req, res) => {
  res.render('add-idiom', { success: req.query.success }); // ✅ Pass success explicitly
});



app.get('/idioms', async (req, res) => {
  res.render('idoms_option',);
});

// ✅ Route: All Idioms
app.get('/all-idioms', async (req, res) => {
  const idioms = await Idiom.find({}).sort({ idiom: 1 });
  res.render('all-idioms', { idioms });
});

// ✅ Route: Date-Wise Idioms
app.get('/idioms-on-date', async (req, res) => {
  const { date } = req.query;

  if (!date) return res.render('idioms-on-date', { idioms: [], selectedDate: null });

  const start = new Date(date);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const idioms = await Idiom.find({
    date: {
      $gte: start,
      $lte: end
    }
  }).sort({ idiom: 1 });

  res.render('idioms-on-date', { idioms, selectedDate: date });
});

// 📝 Route to handle POST submission
app.post('/add-idiom', async (req, res) => {
  const { idiom, meaning, example, date } = req.body;

  try {
    await Idiom.create({
      idiom,
      meaning,
      example,
      date: date ? new Date(date) : undefined
    });
    res.redirect('/add-idiom?success=true');
  } catch (err) {
    console.error('Error adding idiom:', err);
    res.status(500).send('Error saving idiom');
  }
});

app.get('/mcq-idioms', async (req, res) => {

  res.render('mcq-idoms');
});


app.get('/idioms-mcq-json', async (req, res) => {
  const shown = req.query.shown ? JSON.parse(req.query.shown) : [];

  try {
    const totalCount = await Idiom.countDocuments();

    const remainingIdioms = await Idiom.aggregate([
      { $match: { _id: { $nin: shown.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $sample: { size: 1 } }
    ]);

    if (remainingIdioms.length === 0) {
      return res.json({ finished: true, totalCount });
    }

    const correct = remainingIdioms[0];

    const wrongOptions = await Idiom.aggregate([
      { $match: { _id: { $ne: correct._id } } },
      { $sample: { size: 3 } }
    ]);

    const options = [correct.meaning, ...wrongOptions.map(w => w.meaning)].sort(() => Math.random() - 0.5);

    res.json({
      id: correct._id,
      idiom: correct.idiom,
      answer: correct.meaning,
      options,
      totalCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch idioms quiz question' });
  }
});





app.get('/mcq', async (req, res) => {
  // 1 random correct word
  const [correct] = await Word.aggregate([{ $sample: { size: 1 } }]);

  // 3 random wrong options, excluding the correct one
  const wrongs = await Word.aggregate([
    { $match: { _id: { $ne: correct._id } } },
    { $sample: { size: 3 } }
  ]);

  const options = [correct.meaning, ...wrongs.map(w => w.meaning)];
  const shuffled = options.sort(() => Math.random() - 0.5);

  res.render('mcq', {
    word: correct.word,
    options: shuffled,
    answer: correct.meaning
  });
});



app.get('/Squars', async (req, res) => {

  res.render('Squars', {
  
  });
});

app.get('/all-words', async (req, res) => {
  const words = await Word.find({}).sort({ word: 1 });

  const grouped = {};
  words.forEach(word => {
    const firstLetter = word.word[0].toUpperCase();
    if (!grouped[firstLetter]) grouped[firstLetter] = [];
    grouped[firstLetter].push(word);
  });

  const groupedWords = Object.keys(grouped).sort().map(letter => ({
    letter,
    words: grouped[letter]
  }));

  res.render('all_Vocab', { groupedWords });
});

app.get('/Vocab', async (req, res) => {
   res.render('Vocab');
});
app.get('/day_wise_vocab', async (req, res) => {
   res.render('daywise');
});




app.get('/mcq-json', async (req, res) => {
  const shownWords = req.query.shown ? JSON.parse(req.query.shown) : [];

  // Get total count of all questions (words) in the DB
  const totalCount = await Word.countDocuments();

  const remainingWords = await Word.aggregate([
    { $match: { _id: { $nin: shownWords.map(id => new mongoose.Types.ObjectId(id)) } } },
    { $sample: { size: 1 } }
  ]);

  // If no words remaining
  if (remainingWords.length === 0) {
    return res.json({
      finished: true,
      totalCount // Still send total for frontend reference
    });
  }

  const correct = remainingWords[0];

  // Get 3 wrong options
  const wrongs = await Word.aggregate([
    { $match: { _id: { $ne: correct._id } } },
    { $sample: { size: 3 } }
  ]);

  const options = [correct.meaning, ...wrongs.map(w => w.meaning)];
  const shuffled = options.sort(() => Math.random() - 0.5);

  res.json({
    word: correct.word,
    options: shuffled,
    answer: correct.meaning,
    sentence: correct.sentence,
    id: correct._id,
    totalCount // 👈 Add total number of words here
  });
});



app.get('/words-on-date', async (req, res) => {
  const { date } = req.query;
  try {
    const targetDate = new Date(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const words = await Word.find({
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    }).sort({ word: 1 });

    res.json(words);
  } catch (err) {
    res.status(500).json({ message: 'Error filtering by date', error: err.message });
  }
});

// ✅ Filter by date range
app.get('/words-between-dates', async (req, res) => {
  const { start, end } = req.query;
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const words = await Word.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });

    res.json(words);
  } catch (err) {
    res.status(500).json({ message: 'Error filtering by range', error: err.message });
  }
});










app.get('/add-word', (req, res) => {
  res.render('add-word');
});

app.post('/add-word', async (req, res) => {
  const { word, meaning, sentence, date } = req.body;

  try {
    await Word.create({
      word,
      meaning,
      sentence,
      date: date ? new Date(date) : undefined  // optional: if date provided, use it; else default
    });

    res.redirect('/day_wise_vocab');
  } catch (error) {
    console.error('Error adding word:', error);
    res.status(500).send('Error adding word');
  }
});



