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
  const fieldClasses = "flex items-start gap-3 p-3 hover:bg-muted/30 rounded-md transition-colors";
  const iconClasses = "w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0";
  
  return (
    <Card className={cn("space-y-1", className)}>
      <div className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <USERS_ICON className="w-5 h-5 text-primary" />
            {contact.name}
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

      <div className="space-y-1">
        {contact.phone && (
          <div className={fieldClasses}>
            <PHONE_ICON className={iconClasses} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Telefone</p>
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
              <p className="text-sm text-muted-foreground">E-mail</p>
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
              <p className="text-sm text-muted-foreground">Empresa</p>
              <p className="text-sm text-foreground">{contact.company}</p>
            </div>
          </div>
        )}
      </div>

      {(contact.tags?.length ?? 0) > 0 && (
        <div className={cn(fieldClasses, "flex-wrap pt-2")}>
          <TAG_ICON className={iconClasses} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {contact.tags?.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick?.(tag)}
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    "bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showActions && (
        <div className="p-3 pt-2 border-t border-border/50 mt-2 flex justify-end">
          <Button variant="outline" size="sm" className="gap-1.5">
            <PLUS_ICON className="w-3.5 h-3.5" />
            Nova Interação
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ContactCard;
