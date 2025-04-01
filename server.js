const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ✅ MongoDB-Verbindung
mongoose.connect('mongodb+srv://atis-user:TeamGoatAtis@cluster0.11nwfpx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB verbunden'))
.catch((err) => console.error('❌ MongoDB-Verbindungsfehler:', err));

// ✅ User-Schema mit Vorname, Nachname, Geburtstag & Rolle
const User = mongoose.model('User', {
  firstname: String,
  lastname: String,
  birthday: String,
  email: String,
  password: String,
  role: String // "arzt" oder "patient"
});

// ✅ Termin-Schema
const Termin = mongoose.model('Termin', {
  date: String,
  time: String,
  arzt: String,
  patient: String,
  status: String // "frei" oder "gebucht"
});

// ✅ Registrierung
app.post('/api/register', async (req, res) => {
  const { firstname, lastname, birthday, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'E-Mail existiert bereits' });
  }

  const user = new User({ firstname, lastname, birthday, email, password, role });
  await user.save();
  res.json({ message: 'Benutzer registriert' });
});

// ✅ Login (mit Profil-Infos)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });
  if (user) {
    res.json({
      success: true,
      role: user.role,
      name: user.firstname,
      profile: {
        firstname: user.firstname,
        lastname: user.lastname,
        birthday: user.birthday,
        email: user.email
      },
      message: 'Login erfolgreich'
    });
  } else {
    res.json({ success: false, message: 'Falsche E-Mail oder Passwort' });
  }
});

// ✅ Termin freigeben (Arzt)
app.post('/api/termine', async (req, res) => {
  const { date, time, arzt } = req.body;

  const termin = new Termin({
    date,
    time,
    arzt,
    status: "frei",
    patient: ""
  });

  await termin.save();
  res.json({ message: 'Termin freigegeben' });
});

// ✅ Alle Termine anzeigen
app.get('/api/termine', async (req, res) => {
  const termine = await Termin.find();
  res.json(termine);
});

// ✅ Termin buchen (Patient)
app.post('/api/termine/buchen', async (req, res) => {
  const { id, patient } = req.body;

  const termin = await Termin.findById(id);
  if (!termin || termin.status === "gebucht") {
    return res.status(400).json({ message: "Termin nicht verfügbar" });
  }

  termin.status = "gebucht";
  termin.patient = patient;
  await termin.save();

  res.json({ message: "Termin gebucht" });
});

// ✅ Termin stornieren
app.post('/api/termine/stornieren', async (req, res) => {
  const { id } = req.body;

  try {
    const termin = await Termin.findById(id);
    if (!termin) {
      return res.status(404).json({ message: "Termin nicht gefunden" });
    }

    termin.status = "frei";
    termin.patient = "";
    await termin.save();

    res.json({ message: "Termin storniert" });
  } catch (error) {
    console.error("Fehler beim Stornieren:", error);
    res.status(500).json({ message: "Fehler beim Stornieren" });
  }
});

// ✅ Server starten
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));
