import React, { ReactNode } from 'react';
import { Card } from '../common/Card.js';

interface SettingsPageProps {
    title: string;
    description: string;
    children: ReactNode;
    headerAction?: ReactNode;
    className?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
    title,
    description,
    children,
    headerAction,
    className = ''
}) => {
    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        {description}
                    </p>
                </div>
                {headerAction && (
                    <div className="w-full sm:w-auto">
                        {headerAction}
                    </div>
                )}
            </div>
            
            {children}
        </div>
    );
};

interface SettingsSectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
    title,
    description,
    children,
    className = ''
}) => {
    return (
        <Card className={className}>
            {(title || description) && (
                <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
                    {title && (
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            {description}
                        </p>
                    )}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </Card>
    );
};

export const SettingsEmptyState: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
}> = ({ icon, title, description, action, className = '' }) => (
    <Card className={`text-center py-12 ${className}`}>
        <div className="mx-auto h-12 w-12 text-gray-400">
            {icon}
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {description}
        </p>
        {action && (
            <div className="mt-6">
                {action}
            </div>
        )}
    </Card>
);

export const SettingsTable: React.FC<{
    headers: string[];
    children: ReactNode;
    className?: string;
}> = ({ headers, children, className = '' }) => (
    <div className={`overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                    {headers.map((header, index) => (
                        <th 
                            key={index} 
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                        >
                            {header}
                        </th>
                    ))}
                    <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Ações</span>
                    </th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {children}
            </tbody>
        </table>
    </div>
);

export const SettingsTableRow: React.FC<{
    children: ReactNode;
    onClick?: () => void;
    className?: string;
}> = ({ children, onClick, className = '' }) => (
    <tr 
        className={`${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50' : ''} ${className}`}
        onClick={onClick}
    >
        {children}
    </tr>
);

export const SettingsTableCell: React.FC<{
    children: ReactNode;
    className?: string;
    colSpan?: number;
}> = ({ children, className = '', colSpan }) => (
    <td 
        className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white ${className}`}
        colSpan={colSpan}
    >
        {children}
    </td>
);

export const SettingsActionCell: React.FC<{
    children: ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${className}`}>
        {children}
    </td>
);

export const SettingsForm: React.FC<{
    children: ReactNode;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    className?: string;
}> = ({ children, onSubmit, className = '' }) => (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
        {children}
    </form>
);

export const SettingsFormField: React.FC<{
    label: string;
    type?: string;
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    error?: string;
    className?: string;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    disabled?: boolean;
    readOnly?: boolean;
    helpText?: string;
}> = ({
    label,
    type = 'text',
    id,
    value,
    onChange,
    required = false,
    minLength,
    maxLength,
    error,
    className = '',
    placeholder = '',
    multiline = false,
    rows = 3,
    disabled = false,
    readOnly = false,
    helpText
}) => {
    const inputClasses = `w-full px-3 py-2 border ${
        error 
            ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'
    } rounded-md shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed`;

    return (
        <div className={className}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="mt-1">
                {multiline ? (
                    <textarea
                        id={id}
                        value={value}
                        onChange={onChange}
                        required={required}
                        minLength={minLength}
                        maxLength={maxLength}
                        placeholder={placeholder}
                        rows={rows}
                        disabled={disabled}
                        readOnly={readOnly}
                        className={`${inputClasses} resize-y min-h-[80px]`}
                    />
                ) : (
                    <input
                        type={type}
                        id={id}
                        value={value}
                        onChange={onChange}
                        required={required}
                        minLength={minLength}
                        maxLength={maxLength}
                        placeholder={placeholder}
                        disabled={disabled}
                        readOnly={readOnly}
                        className={inputClasses}
                    />
                )}
            </div>
            {helpText && !error && (
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    {helpText}
                </p>
            )}
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
};

export const SettingsFormActions: React.FC<{
    children: ReactNode;
    className?: string;
}> = ({ children, className = '' }) => (
    <div className={`flex justify-end ${className}`}>
        {children}
    </div>
);
