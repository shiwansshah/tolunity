import React from 'react';
import clsx from 'clsx';
import './UI.css';

export const Button = ({ children, variant = 'primary', className, isLoading, ...props }) => {
  return (
    <button 
      className={clsx('premium-btn', `btn-${variant}`, className, isLoading && 'loading')} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="spinner"></span> : null}
      {children}
    </button>
  );
};

export const Card = ({ children, className }) => (
  <div className={clsx('glass-panel card-container hover-lift', className)}>
    {children}
  </div>
);

export const Badge = ({ children, variant = 'gray' }) => (
  <span className={clsx('badge', `badge-${variant}`)}>
    {children}
  </span>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="page-header flex justify-between items-center mb-6">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle text-muted mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
