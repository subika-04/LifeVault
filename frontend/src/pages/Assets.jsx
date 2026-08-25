import { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, Search, Trash2, Edit2, Calendar, Shield, CreditCard, Tag } from 'lucide-react';
import { getAssets, createAsset, updateAsset, deleteAsset, ASSET_CATEGORIES } from '../services/assetService';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

const Assets = () => {
  const { showToast } = useToast();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: 'electronics',
    brand: '',
    model: '',
    purchaseDate: '',
    purchasePrice: '',
    warrantyExpiry: '',
    serialNumber: '',
    notes: '',
  });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getAssets({
        search: search || undefined,
        category: category !== 'all' ? category : undefined,
      });
      setAssets(data.data.assets);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load assets', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, category, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchAssets, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchAssets, search]);

  const handleOpenModal = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setForm({
        name: asset.name || '',
        category: asset.category || 'electronics',
        brand: asset.brand || '',
        model: asset.model || '',
        purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
        purchasePrice: asset.purchasePrice || '',
        warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : '',
        serialNumber: asset.serialNumber || '',
        notes: asset.notes || '',
      });
    } else {
      setEditingAsset(null);
      setForm({
        name: '',
        category: 'electronics',
        brand: '',
        model: '',
        purchaseDate: '',
        purchasePrice: '',
        warrantyExpiry: '',
        serialNumber: '',
        notes: '',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAsset(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) {
      showToast('Name and Category are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : 0,
        purchaseDate: form.purchaseDate || null,
        warrantyExpiry: form.warrantyExpiry || null,
      };

      if (editingAsset) {
        await updateAsset(editingAsset._id, payload);
        showToast('Asset updated successfully');
      } else {
        await createAsset(payload);
        showToast('Asset created successfully');
      }
      handleCloseModal();
      fetchAssets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`Delete "${asset.name}"? This cannot be undone.`)) return;
    try {
      await deleteAsset(asset._id);
      showToast('Asset deleted successfully');
      fetchAssets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete asset', 'error');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const getWarrantyStatus = (expiryDate) => {
    if (!expiryDate) return { label: 'No Warranty', class: 'warranty-none' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Expired', class: 'badge--danger' };
    } else if (diffDays <= 30) {
      return { label: `Expires soon (${diffDays}d)`, class: 'badge--warning' };
    } else {
      return { label: 'Active', class: 'badge--success' };
    }
  };

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1 className="page-title">Assets</h1>
          <p className="page-subtitle">
            Track your valuable possessions and physical assets
            {assets.length > 0 && ` · ${assets.length} total`}
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      <div className="documents-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-bar__icon" />
          <input
            type="text"
            className="search-bar__input"
            placeholder="Search assets by name, brand, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="category-filters">
          <button
            type="button"
            className={`filter-btn ${category === 'all' ? 'filter-btn--active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All
          </button>
          {ASSET_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`filter-btn ${category === cat.value ? 'filter-btn--active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="documents-grid">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="document-card skeleton-card" style={{ height: '240px' }} />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No assets found"
          description={search || category !== 'all' ? 'Try adjusting your filters.' : 'Add your first asset to track its price and warranty details.'}
          action={
            !(search || category !== 'all') && (
              <button type="button" className="btn btn--primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Add Asset
              </button>
            )
          }
        />
      ) : (
        <div className="documents-grid">
          {assets.map((asset) => {
            const warranty = getWarrantyStatus(asset.warrantyExpiry);
            return (
              <div key={asset._id} className="document-card">
                <div className="document-card__header">
                  <div className="document-card__meta">
                    <span className={`category-badge category-badge--${asset.category}`}>
                      {asset.category}
                    </span>
                    {asset.warrantyExpiry && (
                      <span className={`badge ${warranty.class}`}>
                        {warranty.label}
                      </span>
                    )}
                  </div>
                  <div className="document-card__actions">
                    <button
                      type="button"
                      className="document-card__action"
                      onClick={() => handleOpenModal(asset)}
                      title="Edit Asset"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="document-card__action document-card__action--danger"
                      onClick={() => handleDelete(asset)}
                      title="Delete Asset"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="document-card__body">
                  <h3 className="document-card__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={18} className="text-primary-400" />
                    {asset.name}
                  </h3>
                  {asset.brand || asset.model ? (
                    <p className="document-card__description" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                      {asset.brand} {asset.model}
                    </p>
                  ) : null}

                  {asset.notes && (
                    <p className="document-card__description" style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                      {asset.notes}
                    </p>
                  )}

                  <div className="document-card__details" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CreditCard size={14} /> Price
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                        {formatPrice(asset.purchasePrice)}
                      </span>
                    </div>

                    {asset.purchaseDate && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} /> Purchased
                        </span>
                        <span>
                          {new Date(asset.purchaseDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    {asset.warrantyExpiry && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Shield size={14} /> Warranty
                        </span>
                        <span>
                          {new Date(asset.warrantyExpiry).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    {asset.serialNumber && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Tag size={14} /> S/N
                        </span>
                        <code style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                          {asset.serialNumber}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Form Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</h2>
              <button type="button" className="modal__close" onClick={handleCloseModal}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form className="modal__form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Asset Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Dell Laptop, Honda Shine"
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
                  {ASSET_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="brand">Brand</label>
                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    className="form-input"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="e.g. Dell, Apple"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="model">Model</label>
                  <input
                    id="model"
                    name="model"
                    type="text"
                    className="form-input"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="e.g. Inspiron 15"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="purchasePrice">Purchase Price (₹)</label>
                  <input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.purchasePrice}
                    onChange={handleChange}
                    placeholder="e.g. 58900"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="purchaseDate">Purchase Date</label>
                  <input
                    id="purchaseDate"
                    name="purchaseDate"
                    type="date"
                    className="form-input"
                    value={form.purchaseDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="warrantyExpiry">Warranty Expiry Date</label>
                  <input
                    id="warrantyExpiry"
                    name="warrantyExpiry"
                    type="date"
                    className="form-input"
                    value={form.warrantyExpiry}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="serialNumber">Serial Number</label>
                  <input
                    id="serialNumber"
                    name="serialNumber"
                    type="text"
                    className="form-input"
                    value={form.serialNumber}
                    onChange={handleChange}
                    placeholder="e.g. CN-09283-X"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-input form-textarea"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Optional details or placement info"
                  rows={3}
                />
              </div>

              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingAsset ? 'Save Changes' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
