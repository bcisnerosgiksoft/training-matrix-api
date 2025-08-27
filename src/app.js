const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const qs = require('qs');
const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('query parser', str => qs.parse(str));
// Rutas
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/logs', require('./routes/log.routes'));
app.use('/api/positions', require('./routes/position.routes'));
app.use('/api/shifts', require('./routes/shift.routes'));
app.use('/api/classes', require('./routes/class.routes'));
app.use('/api/areas', require('./routes/area.routes'));
app.use('/api/operations', require('./routes/operation.routes'));
app.use('/api/skills', require('./routes/skill.routes'));
app.use('/api/employee-skills', require('./routes/employeeSkill.routes'));

app.use('/api/private', require('./routes/private.routes'));


app.get('/', (req, res) => {
    res.json({ message: 'API funcionando 🎉' });
});

// Servir archivos estáticos y forzar CORS headers específicos
app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // o tu frontend si prefieres
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, '../uploads')));

module.exports = app;
