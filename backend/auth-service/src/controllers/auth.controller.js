const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

let users = []; // base de datos temporal

// Registro
exports.register = async (req, res) => {
  const { email, username, password } = req.body;

  const existingUser = users.find(u => u.username === username);
  if (existingUser) return res.status(400).json({ message: 'Usuario ya existe' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, email, username, password: hashedPassword };
  users.push(newUser);

  res.status(201).json({ message: 'Usuario registrado correctamente' });
};

// Login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Contraseña incorrecta' });

  const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, 'secreto', { expiresIn: '1h' });
  res.json({ token });
};
