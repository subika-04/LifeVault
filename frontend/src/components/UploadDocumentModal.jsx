import { useState, useEffect } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { DOCUMENT_CATEGORIES } from '../services/documentService';

const UploadDocumentModal = ({ isOpen, onClose, onSubmit, document, loading }) => {
  const isEdit = Boolean(document);

  const [form, setForm] = useState({
    title: '',
    category: 'identity',
    description: '',
    expiryDate: '',
    tags: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (document) {
      setForm({
        title: document.title || '',
        category: document.category || 'identity',
        description: document.description || '',
        expiryDate: document.expiryDate
          ? new Date(document.expiryDate).toISOString().split('T')[0]
          : '',
        tags: document.tags?.join(', ') || '',
      });
      setFile(null);
    } else {
      setForm({
        title: '',
        category: 'identity',
        description: '',
        expiryDate: '',
        tags: '',
      });
      setFile(null);
    }
  }, [document, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, file }, isEdit);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{isEdit ? 'Edit Document' : 'Upload Document'}</h2>
          <button type="button" className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="modal__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-input"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Passport, Insurance Policy"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              className="form-input"
              value={form.category}
              onChange={handleChange}
              required
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <div className="form-group">
              <label htmlFor="file">File *</label>
              <div className="file-input-wrapper">
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                  onChange={handleFileChange}
                  required={!isEdit}
                />
                <div className="file-input-display">
                  {file ? (
                    <>
                      <FileText size={18} />
                      <span>{file.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Choose PDF, image, or DOC file (max 10MB)</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-input form-textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional notes about this document"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date</label>
            <input
              id="expiryDate"
              name="expiryDate"
              type="date"
              className="form-input"
              value={form.expiryDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              name="tags"
              type="text"
              className="form-input"
              value={form.tags}
              onChange={handleChange}
              placeholder="Comma-separated, e.g. passport, travel"
            />
          </div>

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadDocumentModal;
