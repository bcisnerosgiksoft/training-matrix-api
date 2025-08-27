const mongoose = require('mongoose');

const employeeDocumentSchema = new mongoose.Schema({
    employee_id: { type: Number, required: true }, // ID de MySQL
    original_filename: { type: String, required: true },
    stored_filename: { type: String, required: true },
    path: { type: String, required: true },
    type: { type: String, default: 'otro' },
    uploaded_at: { type: Date, default: Date.now },
    // 👇 nuevo
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    deleted_by: { type: Number, default: null }
});

module.exports = mongoose.model('EmployeeDocument', employeeDocumentSchema);
