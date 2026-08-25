import {
  FileText,
  Calendar,
  Download,
  Pencil,
  Trash2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import CategoryBadge from './CategoryBadge';
import { formatFileSize, getFileUrl } from '../services/documentService';

const ANALYZABLE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : null);

const DocumentCard = ({ document, onEdit, onDelete, onAnalyze, analyzing }) => {
  const isExpiringSoon = () => {
    if (!document.expiryDate) return false;
    const expiry = new Date(document.expiryDate);
    const now = new Date();
    const daysUntil = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysUntil >= 0 && daysUntil <= 30;
  };

  const isExpired = () => {
    if (!document.expiryDate) return false;
    return new Date(document.expiryDate) < new Date();
  };

  const canAnalyze = ANALYZABLE_TYPES.includes(document.mimeType);
  const ai = document.aiData;
  const hasAiResult = document.aiStatus === 'analyzed' && ai;

  return (
    <div className="document-card">
      <div className="document-card__header">
        <div className="document-card__icon">
          <FileText size={22} />
        </div>
        <CategoryBadge category={document.category} />
      </div>

      <h3 className="document-card__title">{document.title}</h3>

      {document.description && (
        <p className="document-card__description">{document.description}</p>
      )}

      <div className="document-card__meta">
        <span>{formatFileSize(document.fileSize)}</span>
        <span>{document.fileName}</span>
      </div>

      {document.expiryDate && (
        <div
          className={`document-card__expiry ${
            isExpired()
              ? 'document-card__expiry--expired'
              : isExpiringSoon()
                ? 'document-card__expiry--soon'
                : ''
          }`}
        >
          {(isExpired() || isExpiringSoon()) && <AlertTriangle size={14} />}
          <Calendar size={14} />
          <span>
            {isExpired() ? 'Expired' : 'Expires'}{' '}
            {new Date(document.expiryDate).toLocaleDateString()}
          </span>
        </div>
      )}

      {document.tags?.length > 0 && (
        <div className="document-card__tags">
          {document.tags.map((tag) => (
            <span key={tag} className="document-card__tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Part 2B/2C — AI document analysis */}
      {canAnalyze && (
        <div className="document-card__ai">
          {analyzing ? (
            <div className="document-card__ai-loading">
              <Sparkles size={14} className="spin" />
              <span>✨ AI is analyzing your document…</span>
            </div>
          ) : hasAiResult ? (
            <div className="document-card__ai-result">
              <div className="document-card__ai-result-header">
                <Sparkles size={13} />
                <span>AI extracted details</span>
                <button
                  type="button"
                  className="document-card__ai-reanalyze"
                  onClick={() => onAnalyze(document)}
                  title="Re-analyze with AI"
                >
                  Re-analyze
                </button>
              </div>
              <ul className="document-card__ai-fields">
                {ai.productName && <li><strong>Product:</strong> {ai.productName}</li>}
                {ai.brand && <li><strong>Brand:</strong> {ai.brand}</li>}
                {ai.amount != null && (
                  <li><strong>Amount:</strong> {ai.currency} {ai.amount}</li>
                )}
                {ai.warrantyExpiryDate && (
                  <li><strong>Warranty until:</strong> {formatDate(ai.warrantyExpiryDate)}</li>
                )}
                {ai.serialNumber && <li><strong>Serial:</strong> {ai.serialNumber}</li>}
              </ul>
              {ai.summary && <p className="document-card__ai-summary">{ai.summary}</p>}
            </div>
          ) : document.aiStatus === 'failed' ? (
            <button
              type="button"
              className="document-card__ai-btn document-card__ai-btn--retry"
              onClick={() => onAnalyze(document)}
            >
              <Sparkles size={14} />
              AI analysis failed — Retry
            </button>
          ) : (
            <button
              type="button"
              className="document-card__ai-btn"
              onClick={() => onAnalyze(document)}
            >
              <Sparkles size={14} />
              Analyze with AI
            </button>
          )}
        </div>
      )}

      <div className="document-card__actions">
        <a
          href={getFileUrl(document.fileUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="document-card__action document-card__action--download"
          title="Download"
        >
          <Download size={16} />
        </a>
        <button
          type="button"
          className="document-card__action"
          onClick={() => onEdit(document)}
          title="Edit"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="document-card__action document-card__action--delete"
          onClick={() => onDelete(document)}
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default DocumentCard;
