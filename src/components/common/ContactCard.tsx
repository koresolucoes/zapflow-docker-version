import React from 'react';
import { Contact } from '../../types/index.js';
import { Card } from './Card.js';
import { Button } from './Button.js';
import { cn } from '../../lib/utils.js';
import { 
  USERS_ICON, 
  MAIL_ICON, 
  PHONE_ICON, 
  BUILDING_ICON, 
  TAG_ICON as TAG_ICON_IMPORT, 
  PLUS_ICON, 
  EDIT_ICON 
} from '../icons/index.js';

// Alias para o ícone de tag para evitar conflito de nomes
const TAG_ICON = TAG_ICON_IMPORT;

interface ContactCardProps {
  contact: Contact;
  onEdit?: () => void;
  onTagClick?: (tag: string) => void;
  className?: string;
  showActions?: boolean;
}

const ContactCard: React.FC<ContactCardProps> = ({ 
  contact, 
  onEdit, 
  onTagClick, 
  className,
  showActions = true
}) => {
  const fieldClasses = "flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors";
  const iconClasses = "w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5";
  
  return (
    <Card className={cn("overflow-hidden shadow-sm", className)}>
      {/* Cabeçalho */}
      <div className="p-5 pb-3 border-b border-border/50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <USERS_ICON className="w-5 h-5 text-primary" />
            <span className="truncate max-w-[200px]">{contact.name}</span>
          </h3>
          {showActions && onEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Editar contato"
            >
              <EDIT_ICON className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="divide-y divide-border/50">
        {contact.phone && (
          <div className={fieldClasses}>
            <PHONE_ICON className={iconClasses} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Telefone</p>
              <a 
                href={`tel:${contact.phone}`}
                className="text-sm text-foreground hover:text-primary hover:underline"
              >
                {contact.phone}
              </a>
            </div>
          </div>
        )}

        {contact.email && (
          <div className={fieldClasses}>
            <MAIL_ICON className={iconClasses} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">E-mail</p>
              <a 
                href={`mailto:${contact.email}`}
                className="text-sm text-foreground hover:text-primary hover:underline truncate block"
              >
                {contact.email}
              </a>
            </div>
          </div>
        )}

        {contact.company && (
          <div className={fieldClasses}>
            <BUILDING_ICON className={iconClasses} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Empresa</p>
              <p className="text-sm text-foreground">{contact.company}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {(contact.tags?.length ?? 0) > 0 && (
        <div className="p-4 border-t border-border/50">
          <div className="flex items-start gap-3">
            <TAG_ICON className={iconClasses} />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {contact.tags?.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => onTagClick?.(tag)}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/80 transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      {showActions && (
        <div className="p-4 pt-3 border-t border-border/50 bg-muted/10">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <PLUS_ICON className="w-4 h-4" />
            Nova Interação
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ContactCard;
