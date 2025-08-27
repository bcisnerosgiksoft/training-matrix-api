const mongoose = require('mongoose');

const employeeSkillDocumentSchema = new mongoose.Schema({
    employee_id: { type: Number, required: true },
    employee_skill_id: { type: Number, required: true }, // ✅ este es el que estás usando en la consulta
    skill_id: { type: Number, required: true },
    level: { type: Number, required: true },
    uploaded_by: { type: Number, required: true },
    filename: { type: String, required: true },
    original_filename: { type: String, required: true },
    path: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now },
    // 👇 nuevo
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    deleted_by: { type: Number, default: null }
});


module.exports = mongoose.model('EmployeeSkillDocument', employeeSkillDocumentSchema);
