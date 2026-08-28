import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus, Search } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import UploadDocumentModal from '../components/UploadDocumentModal';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  analyzeDocument,
  DOCUMENT_CATEGORIES,
} from '../services/documentService';

const Documents = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [analyzingIds, setAnalyzingIds] = useState(new Set());

  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory) setCategory(urlCategory);
    const urlSearch = searchParams.get('search');
    if (urlSearch) setSearch(urlSearch);
  }, [searchParams]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getDocuments({
        search: search || undefined,
        category: category !== 'all' ? category : undefined,
        page: 1,
        limit: 50,
      });
      setDocuments(data.data.documents);
      setPagination(data.data.pagination);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, category, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchDocuments, search]);

  const handleUpload = async (formData, isEdit) => {
    setSubmitting(true);
    try {
      if (isEdit && editingDoc) {
        await updateDocument(editingDoc._id, {
          title: formData.title,
          category: formData.category,
          description: formData.description,
          expiryDate: formData.expiryDate || null,
          tags: formData.tags,
        });
        showToast('Document updated successfully');
      } else {
        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('category', formData.category);
        fd.append('description', formData.description || '');
        if (formData.expiryDate) fd.append('expiryDate', formData.expiryDate);
        if (formData.tags) fd.append('tags', formData.tags);
        if (formData.renewsDocumentId) fd.append('renewsDocumentId', formData.renewsDocumentId);
        fd.append('file', formData.file);
        await createDocument(fd);
        showToast(formData.renewsDocumentId ? 'Renewal uploaded — old document archived' : 'Document uploaded successfully');
      }
      setModalOpen(false);
      setEditingDoc(null);
      fetchDocuments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setModalOpen(true);
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await deleteDocument(doc._id);
      showToast('Document deleted');
      fetchDocuments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete document', 'error');
    }
  };

  const handleAnalyze = async (doc) => {
    setAnalyzingIds((prev) => new Set(prev).add(doc._id));
    try {
      const { data } = await analyzeDocument(doc._id);
      setDocuments((prev) =>
        prev.map((d) => (d._id === doc._id ? data.data.document : d))
      );
      showToast('✨ AI analysis complete');
    } catch (err) {
      showToast(err.response?.data?.message || 'AI analysis failed', 'error');
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(doc._id);
        return next;
      });
    }
  };

  const openUploadModal = () => {
    setEditingDoc(null);
    setModalOpen(true);
  };

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">
            Store and manage your important documents
            {pagination.total > 0 && ` · ${pagination.total} total`}
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={openUploadModal}>
          <Plus size={18} />
          Upload Document
        </button>
      </div>

      <div className="documents-toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="category-filters">
          <button
            type="button"
            className={`category-filter ${category === 'all' ? 'category-filter--active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All
          </button>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`category-filter ${category === cat.value ? 'category-filter--active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
          <p>Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description={
            search || category !== 'all'
              ? 'No documents match your filters. Try adjusting your search or category.'
              : 'Upload your first document to start building your secure vault.'
          }
          action={
            !search && category === 'all' ? (
              <button type="button" className="btn btn--primary" onClick={openUploadModal}>
                <Plus size={18} />
                Upload Document
              </button>
            ) : null
          }
        />
      ) : (
        <div className="documents-grid">
          {documents.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAnalyze={handleAnalyze}
              analyzing={analyzingIds.has(doc._id)}
            />
          ))}
        </div>
      )}

      <UploadDocumentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDoc(null);
        }}
        onSubmit={handleUpload}
        document={editingDoc}
        loading={submitting}
      />
    </div>
  );
};

export default Documents;
