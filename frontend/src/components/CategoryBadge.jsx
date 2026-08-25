const CATEGORY_STYLES = {
  identity: { label: 'Identity', className: 'category-badge--identity' },
  financial: { label: 'Financial', className: 'category-badge--financial' },
  medical: { label: 'Medical', className: 'category-badge--medical' },
  legal: { label: 'Legal', className: 'category-badge--legal' },
  insurance: { label: 'Insurance', className: 'category-badge--insurance' },
  education: { label: 'Education', className: 'category-badge--education' },
  other: { label: 'Other', className: 'category-badge--other' },
};

const CategoryBadge = ({ category }) => {
  const config = CATEGORY_STYLES[category] || CATEGORY_STYLES.other;

  return (
    <span className={`category-badge ${config.className}`}>
      {config.label}
    </span>
  );
};

export default CategoryBadge;
