import { 
  Phone, 
  Mail, 
  FileText, 
  AlertCircle, 
  Gavel,
  CreditCard,
  Clock,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecentActivity } from '@/hooks/useDashboardStats';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const actionIcons: Record<string, any> = {
  'creation': Plus,
  'modification': Edit,
  'suppression': Trash2,
  'paiement': CreditCard,
  'audience': Gavel,
  'appel': Phone,
  'courrier': Mail,
  'default': FileText
};

const moduleColors: Record<string, string> = {
  contentieux: 'bg-info/10 text-info',
  recouvrement: 'bg-success/10 text-success',
  immobilier: 'bg-immobilier/10 text-immobilier',
  conseil: 'bg-primary/10 text-primary',
  default: 'bg-muted text-muted-foreground'
};

export function RecentActivity() {
  const { data: activities = [], isLoading } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = actionIcons[activity.action?.toLowerCase()] || actionIcons.default;
        const moduleColor = moduleColors[activity.module?.toLowerCase()] || moduleColors.default;
        
        return (
          <div key={activity.id} className="flex gap-4">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className={cn('p-2 rounded-lg', moduleColor)}>
                <Icon className="h-4 w-4" />
              </div>
              {index < activities.length - 1 && (
                <div className="w-px h-full bg-border mt-2" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground capitalize">
                  {activity.action} - {activity.entity_type}
                </h4>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activity.entity_reference || activity.entity_id}
              </p>
              {activity.user_email && (
                <p className="text-xs text-muted-foreground mt-1">
                  Par {activity.user_email}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
