import styles from './admin.module.css';

/**
 * <FormField label="Name" hint="..." error="..." as="input|textarea|select" value onChange {...rest}>
 * For as="select" pass <option> children.
 */
export default function FormField({ label, hint, error, as = 'input', id, children, ...rest }) {
  const fid = id || `f-${String(label || rest.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const cls = as === 'textarea' ? styles.textarea : as === 'select' ? styles.select : styles.input;
  const Tag = as;
  return (
    <div className={styles.field}>
      {label ? <label className={styles.label} htmlFor={fid}>{label}</label> : null}
      {as === 'select' ? <Tag id={fid} className={cls} {...rest}>{children}</Tag> : <Tag id={fid} className={cls} {...rest} />}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
      {error ? <span className={styles.fieldError}>{error}</span> : null}
    </div>
  );
}
