import React, { useState, useEffect } from 'react';
import { EditableContact } from '../../types/index.js';
import { Button } from '../../components/common/Button.js';
import { useUiStore } from '../../stores/uiStore.js';
import { cn } from '../../lib/utils.js';

interface ContactFormProps {
  contact?: EditableContact;
  onSave: (contact: EditableContact) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({ contact, onSave, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<EditableContact & { tags: string[] }>({
    name: '',
    phone: '',
    email: '',
    company: '',
    tags: [],
    custom_fields: null,
    sentiment: null,
  });
  const [tagInput, setTagInput] = useState('');
  const addToast = useUiStore(state => state.addToast);

  useEffect(() => {
    if (contact) {
      setFormData({
        ...(contact as any),
        tags: contact.tags || [],
        email: contact.email || '',
        company: contact.company || ''
      });
    } else {
      setFormData({ name: '', phone: '', email: '', company: '', tags: [], custom_fields: null, sentiment: null });
    }
  }, [contact]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag].sort() }));
      }
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      addToast("Nome e telefone são obrigatórios.", 'warning');
      return;
    }
    onSave(formData);
  };

  const inputClasses = cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  );
  
  const labelClasses = "block text-sm font-medium text-foreground mb-1";
  const tagContainerClasses = cn(
    "flex flex-wrap items-center w-full border rounded-md p-2 gap-1 min-h-[42px]",
    "bg-background border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
  );
  const tagClasses = cn(
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
    "bg-primary/10 text-primary-foreground"
  );
  const tagRemoveButtonClasses = cn(
    "ml-1.5 -mr-1 text-muted-foreground hover:text-destructive transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
  );
  const tagInputClasses = cn(
    "bg-transparent flex-1 min-w-[100px] focus:outline-none text-sm",
    "placeholder:text-muted-foreground text-foreground"
  );
  const formSectionClasses = "space-y-6 p-6 bg-card rounded-lg border border-border";
  const formActionsClasses = "flex justify-end gap-3 pt-4 border-t border-border mt-6";

  return (
    <form onSubmit={handleSubmit} className={formSectionClasses}>
      <div>
        <label htmlFor="name" className={labelClasses}>
          Nome Completo
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={inputClasses}
        />
      </div>
      
      <div>
        <label htmlFor="phone" className={labelClasses}>
          Número de Telefone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="ex: +5511987654321"
          className={inputClasses}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className={labelClasses}>
            E-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="contato@exemplo.com"
            className={inputClasses}
          />
        </div>
        
        <div>
          <label htmlFor="company" className={labelClasses}>
            Empresa
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company || ''}
            onChange={handleChange}
            placeholder="Nome da Empresa"
            className={inputClasses}
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="tags" className={labelClasses}>
          Tags (pressione Enter para adicionar)
        </label>
        <div className={tagContainerClasses}>
          {formData.tags.map(tag => (
            <span key={tag} className={tagClasses}>
              {tag}
              <button 
                type="button" 
                onClick={() => removeTag(tag)} 
                className={tagRemoveButtonClasses}
                aria-label={`Remover tag ${tag}`}
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            id="tags"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            placeholder="vip, novo-cliente..."
            className={tagInputClasses}
          />
        </div>
      </div>
      
      <div className={formActionsClasses}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="default" 
          isLoading={isLoading}
        >
          Salvar Contato
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;